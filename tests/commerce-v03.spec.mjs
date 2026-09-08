import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes=['/','/products/','/product/soft/','/pricing/','/cart/','/checkout/','/order/success/','/account/','/account/license/demo-soft-team/','/components/'];

for(const route of routes){
  test(`v0.3 route ${route} renders without critical accessibility violations`,async({page})=>{
    const failures=[];
    page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`)});
    await page.goto(route);
    await expect(page.locator('body')).toHaveAttribute('data-commerce-page',/.+/);
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(results.violations.filter(v=>['critical','serious'].includes(v.impact||''))).toEqual([]);
    expect(failures).toEqual([]);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('product → cart → checkout → order journey persists commerce state',async({page})=>{
  await page.goto('/product/soft/');
  await page.getByRole('radio',{name:/Team/}).check();
  await page.getByRole('link',{name:'ADD TO CART →'}).click();
  await expect(page).toHaveURL(/\/cart\/?$/);
  await expect(page.locator('[data-cart-filled]')).toBeVisible();
  await expect(page.locator('[data-cart-plan]').first()).toHaveText('Team');
  await expect(page.locator('[data-cart-total]').first()).toHaveText('$99.00');
  await page.getByRole('link',{name:'CHECKOUT →'}).click();
  await expect(page).toHaveURL(/\/checkout\/?$/);
  await expect(page.locator('[data-cart-total]').first()).toHaveText('$99.00');
  await page.getByRole('checkbox',{name:/I agree to the license terms/i}).check();
  await page.getByRole('button',{name:'PLACE DEMO ORDER →'}).click();
  await expect(page).toHaveURL(/\/order\/success\/?$/);
  await expect(page.locator('[data-order-plan]').first()).toHaveText('Team');
  await expect(page.locator('[data-order-total]')).toHaveText('$99.00');
});

test('theme preference persists across production routes',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Switch to dark theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.goto('/products/');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});

test('commerce tables become labelled viewport-safe records on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const route of ['/pricing/','/account/','/account/license/demo-soft-team/']){
    await page.goto(route);
    const cells=page.locator('.store-table td');
    await expect(cells.first()).toBeVisible();
    const labels=await cells.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-label')));
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every(Boolean)).toBe(true);
    const rows=page.locator('.store-table tbody tr');
    const boxes=await rows.evaluateAll(nodes=>nodes.map(node=>{const box=node.getBoundingClientRect();return {left:box.left,right:box.right,width:box.width}}));
    expect(boxes.every(box=>box.left>=-1&&box.right<=391&&box.width<=391)).toBe(true);
  }
});

test('capture v0.3 storefront visual review',async({page},testInfo)=>{
  for(const [name,route] of [['home','/'],['product-soft','/product/soft/'],['pricing','/pricing/'],['account','/account/'],['license-detail','/account/license/demo-soft-team/']]){
    await page.goto(route);
    await page.screenshot({path:testInfo.outputPath(`commerce-v03-${name}-${testInfo.project.name}.png`),fullPage:true});
  }
});
