import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SYSTEM_COMPLETE_IDS=['component-contract','tokens','system-states','ownership-lifecycle'];
const REMAINING_PARTIAL_IDS=['invoice-details','purchase-history-row','invoice-history','activation-row','seat-assignment'];
const RENDERED_SYSTEM_VARIANTS={
  'component-contract':['model','action','state'],
  'tokens':['semantic-colors','depth','press'],
  'ownership-lifecycle':['active','grace','expired','cancelled','refunded']
};
const SYSTEM_STATES=['empty','loading','error','offline','permission','unsupported'];

const collectRuntimeFailures=page=>{
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});
  return failures;
};

const loadSystemEvidence=async page=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  const html=page.locator('html');
  await expect(html).toHaveAttribute('data-showcase-ready','true');
  await expect(html).toHaveAttribute('data-component-variant-ready','true');
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

test('v1.1 System extension advances accumulated variant evidence to 42/47 components and 117 variants while retaining exact five residual partials',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadSystemEvidence(page);
  await expect(page.locator('[data-component-card]')).toHaveCount(47);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="true"]')).toHaveCount(42);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="false"]')).toHaveCount(5);
  await expect(page.locator('[data-component-variant-evidence]')).toHaveCount(42);
  await expect(page.locator('[data-variant-choice]')).toHaveCount(67);
  await expect(page.locator('[data-variant-state-ref]')).toHaveCount(42);
  await expect(page.locator('[data-variant-responsive-ref]')).toHaveCount(4);
  await expect(page.locator('[data-variant-interaction-ref]')).toHaveCount(2);
  await expect(page.locator('[data-variant-action-ref]')).toHaveCount(2);
  for(const id of SYSTEM_COMPLETE_IDS){
    const card=page.locator(`[data-component-card][data-component-id="${id}"]`);
    await expect(card).toHaveAttribute('data-demo-variant-evidence','true');
    await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','complete');
  }
  for(const id of REMAINING_PARTIAL_IDS){
    const card=page.locator(`[data-component-card][data-component-id="${id}"]`);
    await expect(card).toHaveAttribute('data-demo-variant-evidence','false');
    await expect(card.locator('[data-component-variant-evidence]')).toHaveCount(0);
    await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','partial');
  }
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 System rendered evidence exercises all eleven source-backed contract, token, and ownership-lifecycle variants',async({page},testInfo)=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadSystemEvidence(page);
  for(const [id,variants] of Object.entries(RENDERED_SYSTEM_VARIANTS)){
    const {card,details,panel}=await openVariantProof(page,id);
    await expect(details.locator('[data-variant-choice]')).toHaveCount(variants.length);
    for(const variant of variants)await exerciseRendered(details,panel,id,variant);
    await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','complete');
  }

  const contract=await openVariantProof(page,'component-contract');
  await contract.details.locator('[data-variant-choice="model"]').click();
  await expect(contract.panel.locator('code')).toHaveText('ProductView');
  await contract.details.locator('[data-variant-choice="action"]').click();
  await expect(contract.panel.locator('code')).toHaveText('cart.add');
  await contract.details.locator('[data-variant-choice="state"]').click();
  await expect(contract.panel.locator('code')).toHaveText('ready');

  const tokens=await openVariantProof(page,'tokens');
  await tokens.details.locator('[data-variant-choice="depth"]').click();
  await expect(tokens.panel).toContainText('--nbc-depth');
  await expect(tokens.panel).toContainText('6px');
  await tokens.details.locator('[data-variant-choice="press"]').click();
  await expect(tokens.panel).toContainText('--nbc-press-hover');
  await expect(tokens.panel).toContainText('3px');
  await expect(tokens.panel).toContainText('--nbc-press-active');
  const tokenValues=await page.locator('html').evaluate(element=>({
    depth:getComputedStyle(element).getPropertyValue('--nbc-depth').trim(),
    hover:getComputedStyle(element).getPropertyValue('--nbc-press-hover').trim(),
    active:getComputedStyle(element).getPropertyValue('--nbc-press-active').trim()
  }));
  expect(tokenValues).toEqual({depth:'6px',hover:'3px',active:'6px'});

  const lifecycle=await openVariantProof(page,'ownership-lifecycle');
  for(const state of ['active','grace','expired','cancelled','refunded']){
    await lifecycle.details.locator(`[data-variant-choice="${state}"]`).click();
    await expect(lifecycle.panel.locator('.nbc-lifecycle-badge')).toHaveAttribute('data-state',state);
    await expect(lifecycle.panel).toContainText('related records remain separate');
  }

  const keyboardChoice=contract.details.locator('[data-variant-choice="model"]');
  await keyboardChoice.focus();
  await page.keyboard.press('Enter');
  await expect(keyboardChoice).toHaveAttribute('aria-pressed','true');
  const secondChoice=contract.details.locator('[data-variant-choice="action"]');
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

test('v1.1 System state evidence reuses all six exact canonical SystemState entries',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadSystemEvidence(page);
  const {card,details}=await openVariantProof(page,'system-states');
  await expect(details.locator('[data-variant-choice]')).toHaveCount(0);
  await expect(details.locator('[data-variant-state-ref]')).toHaveCount(6);
  const matrix=card.locator('[data-state-matrix][data-component-state-id="system-states"]');
  await expect(matrix).toHaveCount(1);
  for(const state of SYSTEM_STATES){
    await expect(details.locator(`[data-variant-state-ref="${state}"][data-state-id="${state}"]`)).toHaveCount(1);
    const stateButton=matrix.locator(`[data-showcase-state="${state}"]`);
    await stateButton.click();
    await expect(stateButton).toHaveAttribute('aria-pressed','true');
    await expect(matrix.locator('[data-state-result] code')).toHaveText(state);
  }
  await expect(allVariantsChip(card)).toHaveAttribute('data-depth-status','complete');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 System variant evidence remains accessible and contained in dark narrow mode',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await page.setViewportSize({width:360,height:800});
  await loadSystemEvidence(page);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  for(const id of SYSTEM_COMPLETE_IDS){
    const {details}=await openVariantProof(page,id);
    await expect(details.locator('summary')).toContainText('/');
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const axe=new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']);
  for(const id of SYSTEM_COMPLETE_IDS)axe.include(`[data-component-card][data-component-id="${id}"]`);
  const results=await axe.analyze();
  expect(results.violations).toEqual([]);
  expect(runtimeFailures).toEqual([]);
});
