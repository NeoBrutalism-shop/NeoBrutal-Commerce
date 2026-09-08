import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes=['/','/products/','/product/soft/','/pricing/','/cart/','/checkout/','/order/success/','/account/','/account/license/demo-soft-team/','/components/'];

for(const route of routes){
  test(`v0.3 route ${route} renders without critical accessibility violations`,async({page})=>{
    const failures=[];
    page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`)});
    await page.goto(route);
    await expect(page.locator('body')).toHaveAttribute('data-commerce-page',/.+/);
    const results=await new AxeBuilder({page}).disableRules(['color-contrast']).analyze();
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
  await page.getByRole('checkbox').check();
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
