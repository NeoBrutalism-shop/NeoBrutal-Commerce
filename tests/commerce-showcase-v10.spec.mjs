import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const showcaseRoutes=['/components.html','/demo/v10.html'];

for(const route of showcaseRoutes){
  test(`v1.0 GitHub Pages showcase is accessible ${route}`,async({page})=>{
    const httpFailures=[];
    const runtimeFailures=[];
    page.on('response',response=>{if(response.status()>=400)httpFailures.push(`${response.status()} ${response.url()}`)});
    page.on('pageerror',error=>runtimeFailures.push(error.message));
    page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
    await page.goto(route,{waitUntil:'networkidle'});
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(results.violations,`${route} WCAG A/AA violations`).toEqual([]);
    expect(httpFailures,`${route} HTTP failures`).toEqual([]);
    expect(runtimeFailures,`${route} runtime/console failures`).toEqual([]);
  });
}

test('v1.0 flagship connects to permanent component explorer without visual-layout changes',async({page})=>{
  await page.goto('/');
  const links=page.locator('a[href="components.html"]');
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveText('Components');
  await expect(links.last()).toContainText('EXPLORE COMPONENTS');
});

test('v1.0 component explorer renders the complete frozen registry and reusable blocks',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await expect(page.locator('[data-component-card]')).toHaveCount(47);
  await expect(page.locator('[data-component-id="subscription-management"]')).toBeVisible();
  await expect(page.locator('[data-component-id="product-media"]')).toBeVisible();
  await page.getByRole('tab',{name:/Blocks/}).click();
  await expect(page.locator('[data-block-card]')).toHaveCount(18);
  await expect(page.getByRole('heading',{name:'Checkout split'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Ownership operations'})).toBeVisible();
});

test('v1.0 component explorer search, categories, theme, and live source interactions work',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  const search=page.locator('#componentSearch');
  await search.fill('subscription.cancel');
  const visible=page.locator('[data-component-card]:visible');
  await expect(visible).toHaveCount(1);
  await expect(visible).toHaveAttribute('data-component-id','subscription-management');
  await search.fill('');
  await page.locator('[data-category="product"]').click();
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(8);
  const theme=page.locator('#themeToggle');
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('[data-category="all"]').click();
  const subscription=page.locator('[data-component-id="subscription-management"]');
  const action=subscription.locator('[data-demo-action="subscription"]');
  await action.click();
  await expect(action).toHaveText('RESUME RENEWAL');
});

test('v1.0 application lab frames all ten real production routes with viewport and theme controls',async({page})=>{
  await page.goto('/demo/v10.html?route=checkout&viewport=mobile',{waitUntil:'networkidle'});
  await expect(page.locator('.lab-route-button')).toHaveCount(10);
  await expect(page.locator('#labStage')).toHaveAttribute('data-viewport','mobile');
  await expect(page.locator('#currentPath')).toHaveText('/checkout');
  await expect(page.locator('#labFrame')).toHaveAttribute('src','../checkout/');
  await expect(page.frameLocator('#labFrame').locator('[data-commerce-page="checkout"]')).toBeVisible();
  await page.getByRole('button',{name:/Tablet/}).click();
  await expect(page.locator('#labStage')).toHaveAttribute('data-viewport','tablet');
  await page.locator('#routeSelect').selectOption('ownership');
  await expect(page.locator('#currentPath')).toHaveText('/account/license/:id');
  await expect(page.frameLocator('#labFrame').locator('[data-commerce-page="license-detail"]')).toBeVisible();
  await page.locator('#labTheme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.frameLocator('#labFrame').locator('html')).toHaveAttribute('data-theme','dark');
});

test('v1.0 showcase surfaces do not introduce horizontal overflow',async({page})=>{
  for(const route of showcaseRoutes){
    await page.goto(route,{waitUntil:'networkidle'});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow,`${route} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});

test('capture v1.0 permanent showcase review surfaces',async({page},testInfo)=>{
  test.skip(!new Set(['chromium','mobile-chromium']).has(testInfo.project.name),'Canonical showcase review captures use Chromium desktop/mobile.');
  for(const [name,route] of [['explorer','/components.html'],['lab','/demo/v10.html?route=product']]){
    await page.goto(route,{waitUntil:'networkidle'});
    await page.screenshot({path:testInfo.outputPath(`commerce-v10-showcase-${name}-${testInfo.project.name}.png`),fullPage:true});
  }
});
