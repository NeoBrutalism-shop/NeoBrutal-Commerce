import {test,expect} from '@playwright/test';

function captureRuntimeFailures(page){
  const failures=[];
  page.on('pageerror',error=>failures.push(`pageerror: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')failures.push(`console: ${message.text()}`)});
  page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`)});
  return failures;
}

test('v0.9 production storefront stress preserves purchase and recovery context across reloads',async({page})=>{
  const failures=captureRuntimeFailures(page);
  await page.goto('/product/soft/');
  await page.getByRole('button',{name:'Switch to dark theme'}).click();
  await page.getByRole('radio',{name:/Team/}).check();
  await page.getByRole('link',{name:'ADD TO CART →'}).click();

  await expect(page).toHaveURL(/\/cart\/?$/);
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('[data-cart-plan]').first()).toHaveText('Team');
  await expect(page.locator('[data-cart-total]').first()).toHaveText('$99.00');

  await page.getByRole('link',{name:'CHECKOUT →'}).click();
  await page.getByRole('link',{name:'FAILED'}).click();
  await expect(page).toHaveURL(/state=failed/);
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('[data-commerce-component="payment-failure"]')).toBeVisible();
  await expect(page.locator('[data-cart-total]').first()).toHaveText('$99.00');

  await page.getByRole('link',{name:'MARK RECOVERED'}).click();
  await expect(page).toHaveURL(/state=recovered/);
  await expect(page.locator('[data-commerce-component="payment-recovery"]')).toBeVisible();
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('[data-cart-plan]').first()).toHaveText('Team');

  await page.getByRole('checkbox',{name:/I agree to the license terms/i}).check();
  await page.getByRole('button',{name:'PLACE DEMO ORDER →'}).click();
  await expect(page).toHaveURL(/\/order\/success\/?$/);
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('[data-order-plan]').first()).toHaveText('Team');
  await expect(page.locator('[data-order-total]')).toHaveText('$99.00');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  expect(failures).toEqual([]);
});

test('v0.9 production storefront stress keeps ownership operations isolated and recoverable',async({page})=>{
  const failures=captureRuntimeFailures(page);
  await page.goto('/account/license/demo-soft-team/');
  const activationRows=page.locator('[data-commerce-component="activation-row"] tbody tr');
  const activationCount=await activationRows.count();

  await page.locator('[data-plan-target]').selectOption('individual');
  await page.locator('[data-plan-effective]').selectOption('immediate');
  await page.locator('[data-plan-change-form]').getByRole('button',{name:'QUOTE CHANGE →'}).click();
  await expect(page.locator('[data-plan-state]')).toHaveAttribute('data-state','quoted');
  await expect(page.locator('[data-plan-apply]')).toBeDisabled();

  await page.locator('[data-plan-effective]').selectOption('next_term');
  await page.locator('[data-plan-change-form]').getByRole('button',{name:'QUOTE CHANGE →'}).click();
  await page.locator('[data-plan-apply]').click();
  await expect(page.locator('[data-plan-state]')).toHaveAttribute('data-state','complete');

  await page.locator('[data-transfer-kind]').selectOption('gift');
  await page.locator('[data-transfer-email]').fill('rc-recipient@example.invalid');
  await page.locator('[data-transfer-form]').getByRole('button',{name:'CREATE INVITATION →'}).click();
  await expect(page.locator('[data-transfer-state]')).toHaveAttribute('data-state','pending');
  await page.locator('[data-transfer-cancel]').click();
  await expect(page.locator('[data-transfer-state]')).toHaveAttribute('data-state','cancelled');

  const subscription=page.locator('[data-commerce-component="subscription-management"]');
  await page.locator('[data-subscription-cancel]').click();
  await expect(subscription).toHaveAttribute('data-subscription-state','cancel_at_period_end');
  await page.locator('[data-subscription-resume]').click();
  await expect(subscription).toHaveAttribute('data-subscription-state','active');

  await expect(activationRows).toHaveCount(activationCount);
  await expect(page.locator('[data-ownership-timeline] li')).toHaveCount(6);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(failures).toEqual([]);
});
