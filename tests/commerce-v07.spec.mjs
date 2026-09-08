import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const criticalRoutes=['/','/product/soft/','/cart/','/checkout/','/account/','/account/license/demo-soft-team/'];

async function activateWithKeyboard(locator,key='Enter'){
  await locator.focus();
  await expect(locator).toBeFocused();
  await locator.page().keyboard.press(key);
}

test('v0.7 purchase journey is keyboard operable with visible focus',async({page})=>{
  await page.goto('/product/soft/');
  const team=page.getByRole('radio',{name:/Team/});
  await activateWithKeyboard(team,'Space');
  await expect(team).toBeChecked();
  await activateWithKeyboard(page.getByRole('link',{name:'ADD TO CART →'}));
  await expect(page).toHaveURL(/\/cart\/?$/);
  await activateWithKeyboard(page.getByRole('link',{name:'CHECKOUT →'}));
  await expect(page).toHaveURL(/\/checkout\/?$/);
  const terms=page.getByRole('checkbox',{name:/I agree to the license terms/i});
  await activateWithKeyboard(terms,'Space');
  await expect(terms).toBeChecked();
  await activateWithKeyboard(page.getByRole('button',{name:'PLACE DEMO ORDER →'}));
  await expect(page).toHaveURL(/\/order\/success\/?$/);
});

test('v0.7 ownership controls preserve keyboard action semantics',async({page})=>{
  await page.goto('/account/license/demo-soft-team/');
  const cancel=page.locator('[data-subscription-cancel]');
  await activateWithKeyboard(cancel);
  const shell=page.locator('[data-commerce-component="subscription-management"]');
  await expect(shell).toHaveAttribute('data-subscription-state','cancel_at_period_end');
  const resume=page.locator('[data-subscription-resume]');
  await expect(resume).toBeVisible();
  await activateWithKeyboard(resume);
  await expect(shell).toHaveAttribute('data-subscription-state','active');
});

test('v0.7 reduced-motion mode removes smooth scrolling and tactile animation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/product/soft/');
  const values=await page.locator('.nbc-tactile').first().evaluate(node=>({
    scroll:getComputedStyle(document.documentElement).scrollBehavior,
    durations:getComputedStyle(node).transitionDuration.split(',').map(value=>Number.parseFloat(value)||0)
  }));
  expect(values.scroll).toBe('auto');
  expect(Math.max(...values.durations)).toBeLessThanOrEqual(.01);
});

test('v0.7 forced-colors mode keeps focus visible and removes decorative depth',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Forced-colors emulation is release-gated in Chromium.');
  await page.emulateMedia({forcedColors:'active'});
  await page.goto('/product/soft/');
  const action=page.getByRole('link',{name:'ADD TO CART →'});
  await action.focus();
  const styles=await action.evaluate(node=>({
    shadow:getComputedStyle(node).boxShadow,
    outlineStyle:getComputedStyle(node).outlineStyle,
    outlineWidth:Number.parseFloat(getComputedStyle(node).outlineWidth)||0
  }));
  expect(styles.shadow).toBe('none');
  expect(styles.outlineStyle).not.toBe('none');
  expect(styles.outlineWidth).toBeGreaterThanOrEqual(2);
});

test('v0.7 responsive matrix stays viewport-tight with touch-safe primary controls',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Responsive matrix runs once in Chromium; engine parity is covered by projects.');
  for(const width of [320,360,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    for(const route of criticalRoutes){
      await page.goto(route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow,`${route} overflow at ${width}px`).toBeLessThanOrEqual(1);
      if(width<=390){
        const boxes=await page.locator('.nbc-button:visible,.store-theme:visible,.store-cart:visible').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {w:r.width,h:r.height}}));
        expect(boxes.length).toBeGreaterThan(0);
        expect(boxes.every(box=>box.w>=40&&box.h>=40),`${route} touch target at ${width}px`).toBe(true);
      }
    }
  }
});

test('v0.7 navigation history preserves cart and checkout context',async({page})=>{
  await page.goto('/product/soft/');
  await page.getByRole('radio',{name:/Team/}).check();
  await page.getByRole('link',{name:'ADD TO CART →'}).click();
  await page.getByRole('link',{name:'CHECKOUT →'}).click();
  await expect(page.locator('[data-cart-total]').first()).toHaveText('$99.00');
  await page.goBack();
  await expect(page).toHaveURL(/\/cart\/?$/);
  await expect(page.locator('[data-cart-plan]').first()).toHaveText('Team');
  await page.goForward();
  await expect(page).toHaveURL(/\/checkout\/?$/);
  await expect(page.locator('[data-cart-total]').first()).toHaveText('$99.00');
});

test('v0.7 core storefront remains readable before JavaScript hydration',async({page})=>{
  await page.route('**/storefront/store.js',async route=>{
    await new Promise(resolve=>setTimeout(resolve,1200));
    await route.continue();
  });
  await page.goto('/product/soft/',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await expect(page.getByRole('link',{name:'ADD TO CART →'})).toBeVisible();
  await expect(page.locator('[data-commerce-component="product-media"]')).toBeVisible();
});

test('v0.7 critical routes stay within a low layout-shift budget',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Layout-shift performance budget is measured once in Chromium.');
  for(const route of criticalRoutes){
    await page.addInitScript(()=>{
      window.__commerceCLS=0;
      try{
        new PerformanceObserver(list=>{
          for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__commerceCLS+=entry.value;
        }).observe({type:'layout-shift',buffered:true});
      }catch{}
    });
    await page.goto(route,{waitUntil:'networkidle'});
    await page.waitForTimeout(200);
    const cls=await page.evaluate(()=>window.__commerceCLS||0);
    expect(cls,`${route} CLS`).toBeLessThanOrEqual(.1);
  }
});

test('capture v0.7 visual baseline candidates',async({page},testInfo)=>{
  for(const [name,route] of [['home','/'],['product','/product/soft/'],['checkout','/checkout/'],['account','/account/'],['ownership','/account/license/demo-soft-team/']]){
    await page.goto(route);
    await page.screenshot({path:testInfo.outputPath(`commerce-v07-${name}-${testInfo.project.name}.png`),fullPage:true});
  }
});
