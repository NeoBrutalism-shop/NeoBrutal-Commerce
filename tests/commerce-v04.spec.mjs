import { test, expect } from '@playwright/test';

test('v0.4 product media reviews and guarantee are interactive and semantic',async({page})=>{
  await page.goto('/product/soft/');
  const preview=page.getByRole('tabpanel',{name:'UI PREVIEW'});
  const code=page.getByRole('tabpanel',{name:'CODE PREVIEW'});
  const files=page.getByRole('tabpanel',{name:"WHAT'S INSIDE"});
  await expect(preview).toBeVisible();
  await page.getByRole('tab',{name:'CODE PREVIEW'}).click();
  await expect(code).toBeVisible();
  await expect(preview).toBeHidden();
  await page.getByRole('tab',{name:'CODE PREVIEW'}).press('ArrowRight');
  await expect(page.getByRole('tab',{name:"WHAT'S INSIDE"})).toHaveAttribute('aria-selected','true');
  await expect(files).toBeVisible();
  await expect(page.locator('[data-commerce-component="review-summary"]')).toBeVisible();
  await expect(page.locator('[data-commerce-component="testimonials"] .nbc-review')).toHaveCount(2);
  await expect(page.locator('[data-commerce-component="guarantee"]')).toBeVisible();
});

test('v0.4 checkout exposes invoice and recoverable payment states',async({page})=>{
  await page.goto('/checkout/');
  const invoice=page.locator('[data-invoice-toggle]');
  const fields=page.locator('[data-invoice-fields]');
  await expect(fields).toBeHidden();
  await invoice.check();
  await expect(fields).toBeVisible();
  await expect(invoice).toHaveAttribute('aria-expanded','true');

  await page.goto('/checkout/?state=failed');
  await expect(page.locator('body')).toHaveAttribute('data-checkout-state','failed');
  await expect(page.locator('[data-commerce-component="payment-failure"]')).toBeVisible();
  await expect(page.locator('[data-checkout-submit]')).toHaveText('RETRY DEMO PAYMENT →');
  await expect(page.locator('[data-checkout-submit]')).toBeEnabled();

  await page.goto('/checkout/?state=processing');
  await expect(page.locator('body')).toHaveAttribute('data-checkout-state','processing');
  await expect(page.locator('[data-commerce-component="processing-state"]')).toBeVisible();
  await expect(page.locator('[data-checkout-submit]')).toBeDisabled();

  await page.goto('/checkout/?state=recovered');
  await expect(page.locator('body')).toHaveAttribute('data-checkout-state','recovered');
  await expect(page.locator('[data-commerce-component="payment-recovery"]')).toBeVisible();
  await expect(page.locator('[data-checkout-submit]')).toBeEnabled();
});

test('v0.4 license detail exposes seat assignment and renewal lifecycle',async({page})=>{
  await page.goto('/account/license/demo-soft-team/');
  const seats=page.locator('[data-commerce-component="seat-assignment"]');
  await expect(seats).toBeVisible();
  await expect(seats.locator('.nbc-seat-row')).toHaveCount(3);
  const renewal=page.locator('[data-commerce-component="renewal-state"]');
  await expect(renewal).toBeVisible();
  await expect(renewal.locator('.nbc-lifecycle-badge')).toHaveAttribute('data-state','active');
});

test('v0.4 component showcase covers the full system and ownership state families',async({page})=>{
  await page.goto('/components/');
  await expect(page.locator('[data-commerce-component="system-states"] .nbc-state')).toHaveCount(6);
  await expect(page.locator('[data-commerce-component="ownership-lifecycle"] .nbc-lifecycle')).toHaveCount(4);
  const stateNames=await page.locator('[data-commerce-component="system-states"] .nbc-state').evaluateAll(nodes=>nodes.map(node=>node.dataset.state));
  expect(stateNames).toEqual(['empty','loading','error','offline','permission','unsupported']);
});

test('capture v0.4 completeness visual review',async({page},testInfo)=>{
  for(const [name,route] of [['product-soft','/product/soft/'],['checkout-failed','/checkout/?state=failed'],['license-detail','/account/license/demo-soft-team/'],['components','/components/']]){
    await page.goto(route);
    await page.screenshot({path:testInfo.outputPath(`commerce-v04-${name}-${testInfo.project.name}.png`),fullPage:true});
  }
});
