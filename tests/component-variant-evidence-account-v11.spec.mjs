import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CERTIFIED_ACCOUNT_STAGE={audited:38,variants:100,rendered:56,stateBacked:36,complete:38,partial:9};
const ACCOUNT_COMPLETE_IDS=[
  'account-nav',
  'download-row',
  'license-card',
  'license-status',
  'update-eligibility',
  'renewal-state',
  'plan-change',
  'ownership-transfer',
  'subscription-management',
  'ownership-timeline'
];
const ACCOUNT_EXCLUDED_IDS=['purchase-history-row','invoice-history','activation-row','seat-assignment'];
const RENDERED_ACCOUNT_VARIANTS={
  'account-nav':['current','inactive'],
  'download-row':['eligible','unavailable'],
  'license-card':['active','limited','expired-context'],
  'ownership-timeline':['chronological-event-list']
};
const CANONICAL_ACCOUNT_VARIANTS={
  'license-status':[['active','active'],['grace','grace'],['expired','expired'],['cancelled','cancelled'],['refunded','refunded']],
  'update-eligibility':[['active','active'],['grace','grace'],['expired','expired']],
  'renewal-state':[['active','active'],['grace','grace'],['expired','expired'],['cancelled','cancelled'],['past-due','past_due']],
  'plan-change':[['ready','ready'],['quoted','quoted'],['processing','processing'],['complete','complete'],['failed','failed']],
  'ownership-transfer':[['ready','ready'],['processing','processing'],['complete','complete'],['failed','failed']],
  'subscription-management':[['active','active'],['cancel-at-period-end','cancel_at_period_end'],['cancelled','cancelled'],['past-due','past_due']]
};

const collectRuntimeFailures=page=>{
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});
  return failures;
};

const loadAccountEvidence=async page=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  const html=page.locator('html');
  await expect(html).toHaveAttribute('data-showcase-ready','true');
  await expect(html).toHaveAttribute('data-component-variant-ready','true');
  await expect(html).toHaveAttribute('data-component-variant-system-ready','true');
  await expect(html).toHaveAttribute('data-component-variant-audited','42');
  await expect(html).toHaveAttribute('data-component-variant-count','117');
  await expect(html).toHaveAttribute('data-component-variant-rendered-count','67');
  await expect(html).toHaveAttribute('data-component-variant-state-backed-count','42');
  await expect(html).toHaveAttribute('data-component-variant-responsive-backed-count','4');
  await expect(html).toHaveAttribute('data-component-variant-interaction-backed-count','2');
  await expect(html).toHaveAttribute('data-component-variant-action-backed-count','2');
  await expect(html).toHaveAttribute('data-component-variant-batches','6');
  await expect(html).toHaveAttribute('data-component-depth-ready','true');
  await expect(html).toHaveAttribute('data-component-depth-account-ready','true');
  await expect(html).toHaveAttribute('data-component-depth-system-ready','true');
  await expect(html).toHaveAttribute('data-component-depth-variant-complete','42');
  await expect(html).toHaveAttribute('data-component-depth-variant-partial','5');
  expect(CERTIFIED_ACCOUNT_STAGE).toEqual({audited:38,variants:100,rendered:56,stateBacked:36,complete:38,partial:9});
};

const openVariantProof=async(page,id)=>{
  const card=page.locator(`[data-component-card][data-component-id="${id}"]`);
  const details=card.locator('[data-component-variant-evidence]');
  if(!(await details.evaluate(element=>element.open)))await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
  return {card,details,panel:details.locator('[data-variant-panel]')};
};

const allVariantsChip=card=>card.locator('[data-component-depth-audit] .cx-depth-chip').filter({hasText:/^All variants$/});

const exerciseRendered=async(details,panel,id,variant)=>{
  const choice=details.locator(`[data-variant-choice="${variant}"]`);
  await choice.click();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  await expect(details.locator('[data-variant-choice][aria-pressed="true"]')).toHaveCount(1);
  await expect(panel).toHaveAttribute('data-variant-current',variant);
  await expect(panel.locator(`[data-variant-sample="${id}:${variant}"]`)).toHaveCount(1);
};

test('v1.1 Account evidence remains intact inside the accumulated 42/47 component and 117-variant explorer',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadAccountEvidence(page);
  await expect(page.locator('[data-component-card]')).toHaveCount(47);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="true"]')).toHaveCount(42);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="false"]')).toHaveCount(5);
  await expect(page.locator('[data-component-variant-evidence]')).toHaveCount(42);
  await expect(page.locator('[data-variant-choice]')).toHaveCount(67);
  await expect(page.locator('[data-variant-state-ref]')).toHaveCount(42);
  await expect(page.locator('[data-variant-responsive-ref]')).toHaveCount(4);
  await expect(page.locator('[data-variant-interaction-ref]')).toHaveCount(2);
  await expect(page.locator('[data-variant-action-ref]')).toHaveCount(2);
  for(const id of ACCOUNT_COMPLETE_IDS){
    const card=page.locator(`[data-component-card][data-component-id="${id}"]`);
    await expect(card).toHaveAttribute('data-demo-variant-evidence','true');
    await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','complete');
  }
  for(const id of ACCOUNT_EXCLUDED_IDS){
    const card=page.locator(`[data-component-card][data-component-id="${id}"]`);
    await expect(card).toHaveAttribute('data-demo-variant-evidence','false');
    await expect(card.locator('[data-component-variant-evidence]')).toHaveCount(0);
    await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','partial');
  }
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 Account rendered evidence exercises all eight source-backed presentation variants with native semantics',async({page},testInfo)=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadAccountEvidence(page);
  for(const [id,variants] of Object.entries(RENDERED_ACCOUNT_VARIANTS)){
    const {card,details,panel}=await openVariantProof(page,id);
    await expect(details.locator('[data-variant-choice]')).toHaveCount(variants.length);
    for(const variant of variants)await exerciseRendered(details,panel,id,variant);
    await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','complete');
  }

  const nav=await openVariantProof(page,'account-nav');
  await nav.details.locator('[data-variant-choice="current"]').click();
  await expect(nav.panel.locator('nav.nbc-account-nav a[aria-current="page"]')).toHaveCount(1);
  await nav.details.locator('[data-variant-choice="inactive"]').click();
  await expect(nav.panel.locator('a[aria-current]')).toHaveCount(0);

  const download=await openVariantProof(page,'download-row');
  await download.details.locator('[data-variant-choice="eligible"]').click();
  await expect(download.panel.locator('button')).toBeEnabled();
  await download.details.locator('[data-variant-choice="unavailable"]').click();
  await expect(download.panel.locator('button')).toBeDisabled();
  await expect(download.panel).toContainText('normalized entitlement');

  const license=await openVariantProof(page,'license-card');
  await license.details.locator('[data-variant-choice="limited"]').click();
  await expect(license.panel).toContainText('5 / 5');
  await expect(license.panel).toContainText('Current capacity reached');
  await license.details.locator('[data-variant-choice="expired-context"]').click();
  await expect(license.panel.locator('.nbc-license-status--expired')).toHaveText('Expired');
  await expect(license.panel).toContainText('Review renewal eligibility');

  const timeline=await openVariantProof(page,'ownership-timeline');
  await expect(timeline.panel.locator('ol.nbc-timeline > li')).toHaveCount(2);
  await expect(timeline.panel).toContainText('Provider-returned event');

  const keyboardChoice=nav.details.locator('[data-variant-choice="current"]');
  await keyboardChoice.focus();
  await page.keyboard.press('Enter');
  await expect(keyboardChoice).toHaveAttribute('aria-pressed','true');
  const secondChoice=nav.details.locator('[data-variant-choice="inactive"]');
  await secondChoice.focus();
  await page.keyboard.press('Space');
  await expect(secondChoice).toHaveAttribute('aria-pressed','true');
  if(testInfo.project.name!=='mobile-chromium'){
    await secondChoice.hover();
    await page.waitForTimeout(180);
    const hoverY=await secondChoice.evaluate(element=>{const transform=getComputedStyle(element).transform;return transform==='none'?0:new DOMMatrixReadOnly(transform).m42;});
    expect(hoverY).toBeGreaterThan(0);
  }
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 Account stateful evidence reuses 26 exact canonical states and keeps pending invitation action-backed',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadAccountEvidence(page);
  let canonicalCount=0;
  for(const [id,pairs] of Object.entries(CANONICAL_ACCOUNT_VARIANTS)){
    const {card,details}=await openVariantProof(page,id);
    await expect(details.locator('[data-variant-state-ref]')).toHaveCount(pairs.length);
    const matrix=card.locator(`[data-state-matrix][data-component-state-id="${id}"]`);
    await expect(matrix).toHaveCount(1);
    for(const [variantId,stateId] of pairs){
      canonicalCount++;
      await expect(details.locator(`[data-variant-state-ref="${variantId}"][data-state-id="${stateId}"]`)).toHaveCount(1);
      const stateButton=matrix.locator(`[data-showcase-state="${stateId}"]`);
      await stateButton.click();
      await expect(stateButton).toHaveAttribute('aria-pressed','true');
      await expect(matrix.locator('[data-state-result] code')).toHaveText(stateId);
    }
    await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','complete');
  }
  expect(canonicalCount).toBe(26);

  const transfer=await openVariantProof(page,'ownership-transfer');
  const pending=transfer.details.locator('[data-variant-action-ref="pending-invitation"]');
  await expect(pending).toHaveAttribute('data-action-id','license.transfer.create');
  await expect(pending).toHaveAttribute('data-result-model','OwnershipTransferView');
  await expect(transfer.card.locator('[data-preview-for="ownership-transfer"] input')).toHaveCount(1);
  await expect(transfer.card.locator('[data-preview-for="ownership-transfer"] button')).toHaveCount(1);
  await expect(transfer.details.locator('[data-variant-action-proof]')).toContainText('provider output is referenced, never fabricated');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 Account variant evidence remains accessible and contained in dark narrow mode',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await page.setViewportSize({width:360,height:800});
  await loadAccountEvidence(page);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  for(const id of ACCOUNT_COMPLETE_IDS){
    const {details}=await openVariantProof(page,id);
    await expect(details.locator('summary')).toContainText('/');
  }
  const transfer=page.locator('[data-component-id="ownership-transfer"] [data-component-variant-evidence]');
  await expect(transfer.locator('[data-variant-action-ref="pending-invitation"]')).toHaveAttribute('data-action-id','license.transfer.create');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const axe=new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']);
  for(const id of ACCOUNT_COMPLETE_IDS)axe.include(`[data-component-card][data-component-id="${id}"]`);
  const results=await axe.analyze();
  expect(results.violations).toEqual([]);
  expect(runtimeFailures).toEqual([]);
});