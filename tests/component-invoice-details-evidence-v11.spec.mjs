import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const collectRuntimeFailures=page=>{
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});
  return failures;
};

const loadInvoiceEvidence=async page=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  const html=page.locator('html');
  await expect(html).toHaveAttribute('data-showcase-ready','true');
  await expect(html).toHaveAttribute('data-component-variant-system-ready','true');
  await expect(html).toHaveAttribute('data-component-depth-system-ready','true');
  await expect(html).toHaveAttribute('data-component-implementation-ready','true');
  await expect(html).toHaveAttribute('data-component-variant-audited','42');
  await expect(html).toHaveAttribute('data-component-variant-count','117');
  await expect(html).toHaveAttribute('data-component-depth-variant-complete','42');
  await expect(html).toHaveAttribute('data-component-depth-variant-partial','5');
  await expect(html).toHaveAttribute('data-component-implementation-audited','43');
  await expect(html).toHaveAttribute('data-component-implementation-batches','5');
  await expect(html).toHaveAttribute('data-component-invoice-evidence-ready','true');
  await expect(html).toHaveAttribute('data-component-invoice-variant-evidence','3');
  await expect(html).toHaveAttribute('data-component-invoice-implementation-evidence','1');
  await expect(html).toHaveAttribute('data-component-invoice-evidence-base-variant-stage','42/117');
  await expect(html).toHaveAttribute('data-component-invoice-evidence-base-implementation-stage','43/5');
};

const invoiceCard=page=>page.locator('[data-component-card][data-component-id="invoice-details"]');

const openResidualVariantProof=async page=>{
  const card=invoiceCard(page);
  const details=card.locator('[data-invoice-variant-evidence]');
  await expect(details).toHaveCount(1);
  if(!(await details.evaluate(element=>element.open)))await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
  return {card,details,panel:details.locator('[data-invoice-variant-panel]')};
};

const chooseVariant=async(details,panel,id)=>{
  const choice=details.locator(`[data-invoice-variant-choice="${id}"]`);
  await choice.click();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  await expect(details.locator('[data-invoice-variant-choice][aria-pressed="true"]')).toHaveCount(1);
  await expect(panel).toHaveAttribute('data-variant-current',id);
  await expect(panel.locator(`[data-variant-sample="invoice-details:${id}"]`)).toHaveCount(1);
};

test('v1.1 invoice-details residual evidence proves all three documented variants without promoting the certified aggregate checkpoint',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadInvoiceEvidence(page);
  const {card,details,panel}=await openResidualVariantProof(page);
  await expect(card).toHaveAttribute('data-invoice-variant-evidence','true');
  await expect(card).toHaveAttribute('data-demo-variant-evidence','false');
  await expect(card.locator('[data-component-variant-evidence]')).toHaveCount(0);
  await expect(details.locator('summary')).toContainText('3/3');
  await expect(details.locator('[data-invoice-variant-choice]')).toHaveCount(3);

  await chooseVariant(details,panel,'individual');
  await expect(panel.getByRole('checkbox',{name:'Request business invoice'})).not.toBeChecked();
  await expect(panel).toContainText('Invoice details are not requested');
  await expect(panel).toContainText('Provider-normalized quote values remain authoritative');

  await chooseVariant(details,panel,'business-invoice');
  await expect(panel.getByLabel('Company / legal name')).toHaveValue('Northstar Studio');
  await expect(panel.getByLabel('Tax ID')).toHaveValue('IN-EXAMPLE-001');
  await expect(panel).toContainText('do not predict tax treatment or invoice status');

  await chooseVariant(details,panel,'validation');
  const invalidName=panel.getByLabel('Company / legal name');
  await expect(invalidName).toHaveAttribute('required','');
  await expect(invalidName).toHaveAttribute('aria-invalid','true');
  await expect(invalidName).toHaveAttribute('aria-describedby','invoice-proof-name-error');
  await expect(panel).toContainText('Enter a legal name when requesting a business invoice.');
  await expect(panel).toContainText('Validation is local input guidance');

  const allVariants=card.locator('[data-component-depth-audit] .cx-depth-chip').filter({hasText:/^All variants$/});
  await expect(allVariants).toHaveAttribute('data-depth-status','partial');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 invoice-details residual implementation proof is source-backed, copy-ready, and actionless',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadInvoiceEvidence(page);
  const card=invoiceCard(page);
  await expect(card).toHaveAttribute('data-invoice-implementation-evidence','true');
  const audit=card.locator('[data-component-depth-audit]');
  if(!(await audit.evaluate(element=>element.open)))await audit.locator('summary').click();
  const evidence=card.locator('[data-invoice-implementation-evidence]');
  await expect(evidence).toBeVisible();
  await expect(evidence).toContainText('src/components/cart.css');
  await expect(evidence).toContainText('component-explorer.js');
  await expect(evidence).toContainText('src/contracts/index.d.ts');
  await expect(evidence.locator('[data-invoice-token-list] .cx-depth-token')).toHaveCount(6);
  await expect(evidence.locator('[data-invoice-copy-ready-kind]')).toHaveCount(3);
  await expect(evidence.locator('[data-invoice-copy-ready-kind="css"]')).toContainText("@neobrutal/commerce/styles.css");
  await expect(evidence.locator('[data-invoice-copy-ready-kind="html"]')).toContainText('data-commerce-component="invoice-details"');
  await expect(evidence.locator('[data-invoice-copy-ready-kind="html"]')).toContainText('autocomplete="organization"');
  const js=evidence.locator('[data-invoice-copy-ready-kind="js"]');
  await expect(js).toContainText('data-invoice-requested');
  await expect(js).toContainText('setCustomValidity');
  await expect(js).not.toContainText('createCommerceAction');
  await expect(evidence).toContainText('provider-authoritative');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 invoice-details residual evidence is keyboard-operable, dark-mode accessible, and narrow-safe',async({page},testInfo)=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await page.setViewportSize({width:360,height:800});
  await loadInvoiceEvidence(page);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const {card,details,panel}=await openResidualVariantProof(page);
  const business=details.locator('[data-invoice-variant-choice="business-invoice"]');
  await business.focus();
  await page.keyboard.press('Enter');
  await expect(business).toHaveAttribute('aria-pressed','true');
  await expect(panel).toHaveAttribute('data-variant-current','business-invoice');
  const validation=details.locator('[data-invoice-variant-choice="validation"]');
  await validation.focus();
  await page.keyboard.press('Space');
  await expect(validation).toHaveAttribute('aria-pressed','true');
  if(testInfo.project.name!=='mobile-chromium'){
    await business.hover();
    await page.waitForTimeout(180);
    const hoverY=await business.evaluate(element=>{const transform=getComputedStyle(element).transform;return transform==='none'?0:new DOMMatrixReadOnly(transform).m42;});
    expect(hoverY).toBeGreaterThan(0);
  }
  const audit=card.locator('[data-component-depth-audit]');
  if(!(await audit.evaluate(element=>element.open)))await audit.locator('summary').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const results=await new AxeBuilder({page}).include('[data-component-card][data-component-id="invoice-details"]').withTags(['wcag2a','wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
  expect(runtimeFailures).toEqual([]);
});
