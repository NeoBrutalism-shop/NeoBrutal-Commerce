import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousAxe(page){
  const results=await new AxeBuilder({ page }).analyze();
  const violations=results.violations.filter(item=>['serious','critical'].includes(item.impact));
  expect(violations, JSON.stringify(violations,null,2)).toEqual([]);
}

test('v0.2 storefront passes serious/critical axe checks without stylesheet failures', async ({ page })=>{
  const stylesheetFailures=[];
  page.on('response',response=>{
    if(response.request().resourceType()==='stylesheet'&&response.status()>=400){
      stylesheetFailures.push({status:response.status(),url:response.url()});
    }
  });
  await page.goto('/demo/v02.html');
  await expect(page.getByRole('heading',{name:'NeoBrutal Soft'})).toBeVisible();
  await expectNoSeriousAxe(page);
  await page.waitForLoadState('networkidle');
  expect(stylesheetFailures).toEqual([]);
});

async function cartHitTarget(button){
  return button.evaluate(node=>{
    const rect=node.getBoundingClientRect();
    const center={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
    const target=document.elementFromPoint(center.x,center.y);
    return {
      center,
      ok:target===node||node.contains(target),
      target:target?`${target.tagName.toLowerCase()}${target.id?`#${target.id}`:''}`:null
    };
  });
}

test('license, cart, coupon and checkout stay synchronized', async ({ page })=>{
  await page.goto('/demo/v02.html');
  await page.getByRole('button',{name:'CHOOSE TEAM'}).click();
  await expect(page.locator('#productPrice')).toHaveText('$99');
  await page.locator('#addToCart').click();
  const dialog=page.getByRole('dialog',{name:'Ready when you are.'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#cartLicense')).toHaveText('Team · 5 sites');
  const bodyBox=await dialog.locator('[data-cart-region="body"]').boundingBox();
  const footerBox=await dialog.locator('[data-cart-region="actions"]').boundingBox();
  expect(bodyBox&&footerBox&&bodyBox.y+bodyBox.height<=footerBox.y+0.5).toBeTruthy();

  const checkoutButton=dialog.getByRole('button',{name:'CHECKOUT →'});
  await expect(checkoutButton).toBeVisible();
  await expect(checkoutButton).toBeEnabled();
  await checkoutButton.scrollIntoViewIfNeeded();
  const hit=await cartHitTarget(checkoutButton);
  expect(hit.ok,`Checkout center hit ${hit.target??'nothing'} instead of the button`).toBeTruthy();
  await checkoutButton.click();

  await expect(dialog).toBeHidden();
  await expect(page.locator('#checkout-title')).toBeFocused();
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
  await expect(downloads).toBeVisible();
  await downloads.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#purchasesTab')).toBeFocused();
  await expect(page.locator('#purchasesPanel')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('#licensesTab')).toBeFocused();
  await expect(page.locator('#licensesPanel')).toBeVisible();
});

test('capture v0.2 visual review render', async ({ page }, testInfo)=>{
  await page.goto('/demo/v02.html');
  await page.screenshot({path:testInfo.outputPath(`commerce-v02-${testInfo.project.name}.png`),fullPage:true});
});
