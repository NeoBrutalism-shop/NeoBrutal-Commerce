import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const RENDERED_VARIANTS={
  'product-card':['default','accent-badge','primary-action'],
  'trust-strip':['check-mark-fact','policy-support-fact'],
  'promo-band':['informational','highlighted-offer'],
  'badge':['default','coral','lime'],
  'price-block':['one-time','recurring','license-scoped'],
  'product-detail':['default','with-purchase-panel'],
  'product-gallery':['selected-thumbnail','unselected-thumbnail'],
  'review-summary':['rating-summary','rating-plus-count'],
  'testimonials':['single','stacked'],
  'guarantee':['guarantee','refund-policy'],
  'license-selector':['unselected','selected','capacity-comparison'],
  'renewal-note':['one-time-updates-window','renewal-disclosure']
};
const STATE_BACKED_VARIANTS={
  'product-media':['preview','code','files']
};

const waitForVariantEvidence=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-audited','13');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-count','31');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-rendered-count','28');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-state-backed-count','3');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-batches','2');
  await expect(page.locator('html')).toHaveAttribute('data-component-depth-ready','true');
};

const openVariantProof=async(page,id)=>{
  const card=page.locator(`[data-component-id="${id}"]`);
  const details=card.locator('[data-component-variant-evidence]');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
  return {card,details,panel:details.locator('[data-variant-panel]')};
};

const expectAllVariantsComplete=async card=>{
  await expect(card.locator('[data-component-depth-audit] .cx-depth-chip[data-depth-status="complete"]').filter({hasText:/^All variants$/})).toHaveCount(1);
};

test('v1.1 accumulated variant evidence proves 31 authoritative variants without duplicating canonical states',async({page})=>{
  const runtimeFailures=[];
  page.on('pageerror',error=>runtimeFailures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForVariantEvidence(page);

  await expect(page.locator('[data-component-card]')).toHaveCount(47);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="true"]')).toHaveCount(13);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="false"]')).toHaveCount(34);
  await expect(page.locator('[data-component-variant-evidence]')).toHaveCount(13);
  await expect(page.locator('[data-variant-choice]')).toHaveCount(28);
  await expect(page.locator('[data-variant-state-ref]')).toHaveCount(3);

  for(const [id,variants] of Object.entries(RENDERED_VARIANTS)){
    const {card,details,panel}=await openVariantProof(page,id);
    await expect(details.locator('summary')).toContainText(`${variants.length}/${variants.length}`);
    const choices=details.locator('[data-variant-choice]');
    await expect(choices).toHaveCount(variants.length);
    await expect(details.locator('[data-variant-state-ref]')).toHaveCount(0);
    for(const variant of variants){
      const choice=details.locator(`[data-variant-choice="${variant}"]`);
      await choice.click();
      await expect(choice).toHaveAttribute('aria-pressed','true');
      await expect(details.locator('[data-variant-choice][aria-pressed="true"]')).toHaveCount(1);
      await expect(panel).toHaveAttribute('data-variant-current',variant);
      await expect(panel.locator(`[data-variant-sample="${id}:${variant}"]`)).toHaveCount(1);
    }
    await expectAllVariantsComplete(card);
  }

  for(const [id,states] of Object.entries(STATE_BACKED_VARIANTS)){
    const {card,details}=await openVariantProof(page,id);
    await expect(details.locator('summary')).toContainText(`${states.length}/${states.length}`);
    await expect(details.locator('[data-variant-choice]')).toHaveCount(0);
    await expect(details.locator('[data-variant-panel]')).toHaveCount(0);
    await expect(details.locator('[data-variant-state-ref]')).toHaveCount(states.length);
    const matrix=card.locator(`[data-state-matrix][data-component-state-id="${id}"]`);
    const preview=card.locator('[data-preview-for="product-media"] [data-demo-media]');
    await expect(matrix).toHaveCount(1);
    await expect(preview).toHaveCount(1);
    for(const state of states){
      await expect(details.locator(`[data-variant-state-ref="${state}"][data-state-id="${state}"]`)).toHaveCount(1);
      const stateButton=matrix.locator(`[data-showcase-state="${state}"]`);
      await stateButton.click();
      await expect(stateButton).toHaveAttribute('aria-pressed','true');
      await expect(matrix.locator('[data-showcase-state][aria-pressed="true"]')).toHaveCount(1);
      await expect(matrix.locator('[data-state-result] code')).toHaveText(state);
      await expect(card.locator('[data-preview-for="product-media"]')).toHaveAttribute('data-showcase-current-state',state);

      const mediaButton=preview.locator(`[data-media-state="${state}"]`);
      await mediaButton.click();
      await expect(mediaButton).toHaveAttribute('aria-pressed','true');
      await expect(preview.locator('[data-media-state][aria-pressed="true"]')).toHaveCount(1);
      await expect(preview.locator('[data-media-panel] strong')).toHaveText(state.toUpperCase());
    }
    await expectAllVariantsComplete(card);
  }

  const product=page.locator('[data-component-id="product-card"] [data-component-variant-evidence]');
  await product.locator('[data-variant-choice="primary-action"]').click();
  await expect(product.locator('[data-variant-panel] .nbc-button--primary.nbc-tactile')).toHaveCount(1);

  const trust=page.locator('[data-component-id="trust-strip"] [data-component-variant-evidence]');
  await trust.locator('[data-variant-choice="policy-support-fact"]').click();
  await expect(trust.locator('[data-variant-panel]')).toContainText('Render only support terms supplied');

  const promo=page.locator('[data-component-id="promo-band"] [data-component-variant-evidence]');
  await promo.locator('[data-variant-choice="highlighted-offer"]').click();
  await expect(promo.locator('[data-variant-panel]')).toContainText('no countdown or fake scarcity');

  const detail=page.locator('[data-component-id="product-detail"] [data-component-variant-evidence]');
  await detail.locator('[data-variant-choice="with-purchase-panel"]').click();
  for(const selector of ['.nbc-product-detail','.nbc-product-buybox','.nbc-license-selector','.nbc-renewal-note','.nbc-purchase-actions','.nbc-button--primary'])await expect(detail.locator(`[data-variant-panel] ${selector}`)).toHaveCount(1);

  const gallery=page.locator('[data-component-id="product-gallery"] [data-component-variant-evidence]');
  await gallery.locator('[data-variant-choice="selected-thumbnail"]').click();
  await expect(gallery.locator('[data-variant-panel] .nbc-gallery-thumb')).toHaveAttribute('aria-pressed','true');
  await gallery.locator('[data-variant-choice="unselected-thumbnail"]').click();
  await expect(gallery.locator('[data-variant-panel] .nbc-gallery-thumb')).toHaveAttribute('aria-pressed','false');

  const reviews=page.locator('[data-component-id="review-summary"] [data-component-variant-evidence]');
  await reviews.locator('[data-variant-choice="rating-plus-count"]').click();
  await expect(reviews.locator('[data-variant-panel]')).toContainText('128 supplied reviews');

  const testimonials=page.locator('[data-component-id="testimonials"] [data-component-variant-evidence]');
  await testimonials.locator('[data-variant-choice="stacked"]').click();
  await expect(testimonials.locator('[data-variant-panel] .nbc-review')).toHaveCount(2);

  const guarantee=page.locator('[data-component-id="guarantee"] [data-component-variant-evidence]');
  await guarantee.locator('[data-variant-choice="refund-policy"]').click();
  await expect(guarantee.locator('[data-variant-panel]')).toContainText('policy data');

  const license=page.locator('[data-component-id="license-selector"] [data-component-variant-evidence]');
  await license.locator('[data-variant-choice="selected"]').click();
  await expect(license.locator('[data-variant-panel] input[type="radio"]')).toBeChecked();
  await license.locator('[data-variant-choice="capacity-comparison"]').click();
  await expect(license.locator('[data-variant-panel] .nbc-license-option')).toHaveCount(2);
  await expect(license.locator('[data-variant-panel]')).toContainText('1 production site');
  await expect(license.locator('[data-variant-panel]')).toContainText('5 production sites');

  const renewal=page.locator('[data-component-id="renewal-note"] [data-component-variant-evidence]');
  await renewal.locator('[data-variant-choice="one-time-updates-window"]').click();
  await expect(renewal.locator('[data-variant-panel]')).toContainText('no automatic renewal');
  await renewal.locator('[data-variant-choice="renewal-disclosure"]').click();
  await expect(renewal.locator('[data-variant-panel]')).toContainText('supplied offer or billing model');

  expect(runtimeFailures).toEqual([]);
});

test('v1.1 variant controls are keyboard operable and preserve tactile down-press grammar',async({page},testInfo)=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForVariantEvidence(page);
  const {details,panel}=await openVariantProof(page,'product-card');
  const accent=details.locator('[data-variant-choice="accent-badge"]');
  const primary=details.locator('[data-variant-choice="primary-action"]');

  await accent.focus();
  await expect(accent).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(accent).toHaveAttribute('aria-pressed','true');
  await expect(panel).toHaveAttribute('data-variant-current','accent-badge');

  await primary.focus();
  await expect(primary).toBeFocused();
  await page.keyboard.press('Space');
  await expect(primary).toHaveAttribute('aria-pressed','true');
  await expect(panel).toHaveAttribute('data-variant-current','primary-action');

  const license=await openVariantProof(page,'license-selector');
  const comparison=license.details.locator('[data-variant-choice="capacity-comparison"]');
  await comparison.focus();
  await expect(comparison).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(comparison).toHaveAttribute('aria-pressed','true');
  await expect(license.panel).toHaveAttribute('data-variant-current','capacity-comparison');

  if(testInfo.project.name!=='mobile-chromium'){
    await accent.hover();
    await page.waitForTimeout(180);
    const hoverY=await accent.evaluate(element=>{
      const transform=getComputedStyle(element).transform;
      return transform==='none'?0:new DOMMatrixReadOnly(transform).m42;
    });
    expect(hoverY).toBeGreaterThan(0);
  }
});

test('v1.1 rendered and canonical-state variant evidence stays accessible in dark theme and at narrow width',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForVariantEvidence(page);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');

  const renewal=await openVariantProof(page,'renewal-note');
  await renewal.details.locator('[data-variant-choice="renewal-disclosure"]').click();
  await expect(renewal.panel).toContainText('supplied offer or billing model');

  const media=await openVariantProof(page,'product-media');
  await expect(media.details.locator('[data-variant-state-ref]')).toHaveCount(3);
  await media.card.locator('[data-showcase-state="files"]').click();
  await expect(media.card.locator('[data-state-result] code')).toHaveText('files');
  await media.card.locator('[data-preview-for="product-media"] [data-media-state="files"]').click();
  await expect(media.card.locator('[data-preview-for="product-media"] [data-media-panel] strong')).toHaveText('FILES');

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
