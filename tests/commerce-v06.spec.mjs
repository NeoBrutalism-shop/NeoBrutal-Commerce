import {test,expect} from '@playwright/test';

test('v0.6 license route exposes complete ownership lifecycle',async({page})=>{
  await page.goto('/account/license/demo-soft-team/');
  for(const component of ['plan-change','ownership-transfer','seat-assignment','subscription-management','renewal-state','ownership-timeline']){
    await expect(page.locator(`[data-commerce-component="${component}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-commerce-component="license-card"]')).toContainText('v0.9.0-rc.1');
});

test('v0.6 plan change blocks unsafe immediate downgrade and allows next-term scheduling',async({page})=>{
  await page.goto('/account/license/demo-soft-team/');
  await page.locator('[data-plan-target]').selectOption('individual');
  await page.locator('[data-plan-effective]').selectOption('immediate');
  await page.locator('[data-plan-change-form]').getByRole('button',{name:'QUOTE CHANGE →'}).click();
  await expect(page.locator('[data-plan-state]')).toHaveAttribute('data-state','quoted');
  await expect(page.locator('[data-plan-message]')).toContainText('exceeds the target plan');
  await expect(page.locator('[data-plan-apply]')).toBeDisabled();

  await page.locator('[data-plan-effective]').selectOption('next_term');
  await page.locator('[data-plan-change-form]').getByRole('button',{name:'QUOTE CHANGE →'}).click();
  await expect(page.locator('[data-plan-apply]')).toBeEnabled();
  await page.locator('[data-plan-apply]').click();
  await expect(page.locator('[data-plan-state]')).toHaveAttribute('data-state','complete');
  await expect(page.locator('[data-plan-title]')).toHaveText('CHANGE SCHEDULED');
  await expect(page.locator('[data-ownership-timeline] li').first()).toContainText('Team → Individual scheduled');
});

test('v0.6 transfer invitation is explicit and cancellable',async({page})=>{
  await page.goto('/account/license/demo-soft-team/');
  await page.locator('[data-transfer-kind]').selectOption('gift');
  await page.locator('[data-transfer-email]').fill('recipient@example.invalid');
  await page.locator('[data-transfer-form]').getByRole('button',{name:'CREATE INVITATION →'}).click();
  await expect(page.locator('[data-transfer-state]')).toHaveAttribute('data-state','pending');
  await expect(page.locator('[data-transfer-message]')).toContainText('Ownership has not moved yet');
  await page.locator('[data-transfer-cancel]').click();
  await expect(page.locator('[data-transfer-state]')).toHaveAttribute('data-state','cancelled');
  await expect(page.locator('[data-transfer-message]')).toContainText('Ownership remains with the current account');
});

test('v0.6 subscription cancellation preserves paid term and can resume',async({page})=>{
  await page.goto('/account/license/demo-soft-team/');
  const shell=page.locator('[data-commerce-component="subscription-management"]');
  await page.locator('[data-subscription-cancel]').click();
  await expect(shell).toHaveAttribute('data-subscription-state','cancel_at_period_end');
  await expect(page.locator('[data-subscription-badge]')).toHaveAttribute('data-state','cancel_at_period_end');
  await expect(page.locator('[data-subscription-note]')).toContainText('current license is not revoked');
  await page.locator('[data-subscription-resume]').click();
  await expect(shell).toHaveAttribute('data-subscription-state','active');
  await expect(page.locator('[data-subscription-cancel]')).toBeVisible();
});

test('v0.6 account exposes normalized invoice history without overflow',async({page})=>{
  await page.goto('/account/');
  const invoices=page.locator('[data-commerce-component="invoice-history"]');
  await expect(invoices).toBeVisible();
  await expect(invoices.locator('tbody tr')).toHaveCount(2);
  await expect(invoices.locator('td[data-label="Status"]')).toHaveText(['Paid','Paid']);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('capture v0.6 ownership visual review',async({page},testInfo)=>{
  for(const [name,route] of [['account','/account/'],['ownership','/account/license/demo-soft-team/']]){
    await page.goto(route);
    await page.screenshot({path:testInfo.outputPath(`commerce-v06-${name}-${testInfo.project.name}.png`),fullPage:true});
  }
});
