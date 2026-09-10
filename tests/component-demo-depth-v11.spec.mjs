import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const waitForDepthAudit=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-depth-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-depth-audited','47');
};

test('v1.1 component demo depth audit covers the exact 47-component explorer',async({page})=>{
  const runtimeFailures=[];
  page.on('pageerror',error=>runtimeFailures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForDepthAudit(page);

  const cards=page.locator('[data-component-card]');
  await expect(cards).toHaveCount(47);
  await expect(page.locator('[data-component-depth-audit]')).toHaveCount(47);
  await expect(page.locator('[data-component-depth-audit] .cx-depth-chip')).toHaveCount(47*13);
  await expect(page.locator('[data-component-card][data-demo-depth-first-batch="true"]')).toHaveCount(12);
  await expect(page.locator('[data-component-card][data-demo-depth-missing="2"]')).toHaveCount(47);

  const subscription=page.locator('[data-component-id="subscription-management"]');
  await expect(subscription).toHaveAttribute('data-demo-depth-first-batch','true');
  await subscription.locator('[data-component-depth-audit] summary').click();
  await expect(subscription.locator('[data-depth-status="complete"]',{hasText:'Canonical states'})).toBeVisible();
  await expect(subscription.locator('[data-depth-status="complete"]',{hasText:'Action contracts'})).toBeVisible();
  await expect(subscription.locator('[data-depth-status="missing"]',{hasText:'Design tokens used'})).toBeVisible();
  await expect(subscription.locator('[data-depth-status="missing"]',{hasText:'Copy-ready HTML / CSS / JS'})).toBeVisible();

  const trust=page.locator('[data-component-id="trust-strip"]');
  await trust.locator('[data-component-depth-audit] summary').click();
  await expect(trust.locator('[data-depth-status="not-applicable"]',{hasText:'Canonical states'})).toBeVisible();
  await expect(trust.locator('[data-depth-status="not-applicable"]',{hasText:'Action contracts'})).toBeVisible();

  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(results.violations,'expanded component depth audit WCAG A/AA violations').toEqual([]);
  expect(runtimeFailures,'component depth audit runtime/console failures').toEqual([]);
});

test('v1.1 component demo depth audit survives theme and narrow-screen inspection',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForDepthAudit(page);
  const subscription=page.locator('[data-component-id="subscription-management"]');
  await subscription.locator('[data-component-depth-audit] summary').click();

  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(subscription.locator('[data-component-depth-audit]')).toBeVisible();
  await expect(subscription.locator('.cx-depth-summary')).toContainText('complete');

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'component depth audit must not introduce document horizontal overflow').toBeLessThanOrEqual(1);
});
