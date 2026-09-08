import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousAxe(page){
  const results=await new AxeBuilder({ page }).analyze();
  const violations=results.violations.filter(item=>['serious','critical'].includes(item.impact));
  expect(violations, JSON.stringify(violations,null,2)).toEqual([]);
}

test('v0.2 storefront passes serious/critical axe checks', async ({ page })=>{
  await page.goto('/demo/v02.html');
  await expect(page.getByRole('heading',{name:'NeoBrutal Soft'})).toBeVisible();
  await expectNoSeriousAxe(page);
});

test('license, cart, coupon and checkout stay synchronized', async ({ page })=>{
  await page.goto('/demo/v02.html');
  await page.getByRole('button',{name:'CHOOSE TEAM'}).click();
  await expect(page.locator('#productPrice')).toHaveText('$99');
  await page.locator('#addToCart').click();
  const dialog=page.getByRole('dialog',{name:'Ready when you are.'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#cartLicense')).toHaveText('Team · 5 sites');
  await dialog.getByRole('link',{name:'CHECKOUT →'}).click();
  await expect(dialog).toBeHidden();
  await page.locator('#couponInput').fill('FOUNDRY10');
  await page.getByRole('button',{name:'APPLY'}).click();
  await expect(page.locator('#couponStatus')).toContainText('10% off');
  await expect(page.locator('#checkoutTotal')).toHaveText('$89.10');
  await page.getByRole('button',{name:'PLACE DEMO ORDER →'}).click();
  await expect(page.locator('#orderSuccess')).toBeVisible();
  await expect(page.locator('#successLicense')).toHaveText('Team');
  await expect(page.locator('#successTotal')).toHaveText('$89.10');
});

test('mini cart supports escape and restores focus', async ({ page })=>{
  await page.goto('/demo/v02.html');
  const open=page.locator('#openCart');
  await open.focus();
  await open.click();
  await expect(page.locator('#closeCart')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#cartBackdrop')).toBeHidden();
  await expect(open).toBeFocused();
});

test('account tabs are keyboard navigable', async ({ page })=>{
  await page.goto('/demo/v02.html#account');
  const downloads=page.locator('#downloadsTab');
  await downloads.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#purchasesTab')).toBeFocused();
  await expect(page.locator('#purchasesPanel')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('#licensesTab')).toBeFocused();
  await expect(page.locator('#licensesPanel')).toBeVisible();
});
