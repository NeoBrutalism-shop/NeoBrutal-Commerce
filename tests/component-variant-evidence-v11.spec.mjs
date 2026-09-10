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
  'renewal-note':['one-time-updates-window','renewal-disclosure'],
  'pricing-tier':['default','featured'],
  'bundle-builder':['no-extras','selected-extras'],
  'cart-item':['default','removable'],
  'order-summary':['cart-quote','checkout-quote'],
  'coupon':['ready','accepted','rejected'],
  'checkout-field':['default','filled','invalid','disabled'],
  'payment-method':['selected','unselected'],
  'order-confirmation':['complete'],
  'download-entitlement':['eligible','ineligible']
};
const STATE_BACKED_VARIANTS={
  'product-media':['preview','code','files'],
  'checkout-steps':['ready','processing','failed','recovered'],
  'payment-failure':['failed'],
  'payment-recovery':['recovered'],
  'processing-state':['processing']
};
const RESPONSIVE_BACKED_VARIANTS={
  'plan-comparison':['desktop-table','narrow-scroll-container'],
  'receipt':['summary-grid','stacked-facts']
};
const INTERACTION_BACKED_VARIANTS={
  'payment-recovery':['processing','complete']
};
const ACTION_BACKED_VARIANTS={
  'download-entitlement':['signed-ready']
};
const RENDERED_BATCHES={
  'storefront-core':['product-card','trust-strip','promo-band','badge','price-block'],
  'product-and-trust':['product-detail','product-gallery','review-summary','testimonials','guarantee','license-selector','renewal-note'],
  'pricing':['pricing-tier','bundle-builder'],
  'checkout-rendered':['cart-item','order-summary','coupon','checkout-field','payment-method','order-confirmation']
};

const waitForVariantEvidence=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-audited','28');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-count','65');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-rendered-count','48');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-state-backed-count','10');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-responsive-backed-count','4');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-interaction-backed-count','2');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-action-backed-count','1');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-batches','4');
  await expect(page.locator('html')).toHaveAttribute('data-component-depth-ready','true');
};

const loadVariantExplorer=async page=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForVariantEvidence(page);
};

const collectRuntimeFailures=page=>{
  const runtimeFailures=[];
  page.on('pageerror',error=>runtimeFailures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
  return runtimeFailures;
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

const exerciseRenderedVariant=async(details,panel,id,variant)=>{
  const choice=details.locator(`[data-variant-choice="${variant}"]`);
  await choice.click();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  await expect(details.locator('[data-variant-choice][aria-pressed="true"]')).toHaveCount(1);
  await expect(panel).toHaveAttribute('data-variant-current',variant);
  await expect(panel.locator(`[data-variant-sample="${id}:${variant}"]`)).toHaveCount(1);
};

test('v1.1 accumulated variant evidence exposes 65 authoritative variants across five proof kinds',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  await expect(page.locator('[data-component-card]')).toHaveCount(47);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="true"]')).toHaveCount(28);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="false"]')).toHaveCount(19);
  await expect(page.locator('[data-component-variant-evidence]')).toHaveCount(28);
  await expect(page.locator('[data-variant-choice]')).toHaveCount(48);
  await expect(page.locator('[data-variant-state-ref]')).toHaveCount(10);
  await expect(page.locator('[data-variant-responsive-ref]')).toHaveCount(4);
  await expect(page.locator('[data-variant-interaction-ref]')).toHaveCount(2);
  await expect(page.locator('[data-variant-action-ref]')).toHaveCount(1);
  expect(runtimeFailures).toEqual([]);
});

for(const [batch,ids] of Object.entries(RENDERED_BATCHES)){
  test(`v1.1 ${batch} rendered variant evidence exercises every authoritative rendered variant`,async({page})=>{
    const runtimeFailures=collectRuntimeFailures(page);
    await loadVariantExplorer(page);
    for(const id of ids){
      const variants=RENDERED_VARIANTS[id];
      const {card,details,panel}=await openVariantProof(page,id);
      await expect(details.locator('summary')).toContainText(`${variants.length}/${variants.length}`);
      const choices=details.locator('[data-variant-choice]');
      await expect(choices).toHaveCount(variants.length);
      await expect(details.locator('[data-variant-state-ref]')).toHaveCount(0);
      await expect(details.locator('[data-variant-responsive-ref]')).toHaveCount(0);
      await expect(details.locator('[data-variant-interaction-ref]')).toHaveCount(0);
      await expect(details.locator('[data-variant-action-ref]')).toHaveCount(0);
      for(const variant of variants)await exerciseRenderedVariant(details,panel,id,variant);
      await expectAllVariantsComplete(card);
    }
    expect(runtimeFailures).toEqual([]);
  });
}

test('v1.1 product-media variant evidence reuses all three canonical states',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  const id='product-media';
  const states=STATE_BACKED_VARIANTS[id];
  const {card,details}=await openVariantProof(page,id);
  await expect(details.locator('summary')).toContainText('3/3');
  await expect(details.locator('[data-variant-choice]')).toHaveCount(0);
  await expect(details.locator('[data-variant-state-ref]')).toHaveCount(3);
  const matrix=card.locator(`[data-state-matrix][data-component-state-id="${id}"]`);
  const preview=card.locator('[data-preview-for="product-media"] [data-demo-media]');
  for(const state of states){
    await expect(details.locator(`[data-variant-state-ref="${state}"][data-state-id="${state}"]`)).toHaveCount(1);
    const stateButton=matrix.locator(`[data-showcase-state="${state}"]`);
    await stateButton.click();
    await expect(stateButton).toHaveAttribute('aria-pressed','true');
    await expect(matrix.locator('[data-state-result] code')).toHaveText(state);
    const mediaButton=preview.locator(`[data-media-state="${state}"]`);
    await mediaButton.click();
    await expect(mediaButton).toHaveAttribute('aria-pressed','true');
    await expect(preview.locator('[data-media-panel] strong')).toHaveText(state.toUpperCase());
  }
  await expectAllVariantsComplete(card);
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 checkout canonical variants reuse the exact live state matrices',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  for(const id of ['checkout-steps','payment-failure','payment-recovery','processing-state']){
    const states=STATE_BACKED_VARIANTS[id];
    const {card,details}=await openVariantProof(page,id);
    await expect(details.locator('[data-variant-state-ref]')).toHaveCount(states.length);
    const matrix=card.locator(`[data-state-matrix][data-component-state-id="${id}"]`);
    await expect(matrix).toHaveCount(1);
    for(const state of states){
      const ref=details.locator(`[data-variant-state-ref="${state}"][data-state-id="${state}"]`);
      await expect(ref).toHaveCount(1);
      const stateButton=matrix.locator(`[data-showcase-state="${state}"]`);
      await stateButton.click();
      await expect(stateButton).toHaveAttribute('aria-pressed','true');
      await expect(matrix.locator('[data-state-result] code')).toHaveText(state);
    }
    await expectAllVariantsComplete(card);
  }
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 plan-comparison variant evidence reuses one semantic table across desktop and narrow contained-scroll views',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await page.setViewportSize({width:1280,height:900});
  await loadVariantExplorer(page);
  const {card,details}=await openVariantProof(page,'plan-comparison');
  await expect(details.locator('[data-variant-responsive-ref]')).toHaveCount(2);
  await expect(details.locator('[data-variant-responsive-ref="desktop-table"]')).toHaveAttribute('data-responsive-mode','contained-scroll');
  await expect(details.locator('[data-variant-responsive-ref="desktop-table"]')).toHaveAttribute('data-responsive-viewport','desktop');
  await expect(details.locator('[data-variant-responsive-ref="narrow-scroll-container"]')).toHaveAttribute('data-responsive-viewport','narrow');
  const wrap=card.locator('[data-preview-for="plan-comparison"] .nbc-compare-wrap');
  const table=wrap.locator('table.nbc-compare');
  await expect(wrap).toHaveAttribute('tabindex','0');
  await expect(table.locator('thead th')).toHaveCount(3);
  await expect(table.locator('thead th')).toHaveText(['Plan','Sites','Updates']);
  await expect(table.locator('tbody tr')).toHaveCount(3);
  await wrap.focus();
  await expect(wrap).toBeFocused();
  await expectAllVariantsComplete(card);
  await page.setViewportSize({width:360,height:800});
  const narrowGeometry=await wrap.evaluate(element=>({scrollWidth:element.scrollWidth,clientWidth:element.clientWidth}));
  expect(narrowGeometry.scrollWidth).toBeGreaterThan(narrowGeometry.clientWidth);
  const pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(pageOverflow).toBeLessThanOrEqual(0);
  await wrap.focus();
  await expect(wrap).toBeFocused();
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 receipt responsive variants reuse the live grid at desktop and narrow widths',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await page.setViewportSize({width:1280,height:900});
  await loadVariantExplorer(page);
  const {card,details}=await openVariantProof(page,'receipt');
  await expect(details.locator('[data-variant-responsive-ref]')).toHaveCount(2);
  await expect(details.locator('[data-variant-responsive-ref="summary-grid"]')).toHaveAttribute('data-responsive-mode','grid-to-stack');
  await expect(details.locator('[data-variant-responsive-ref="summary-grid"]')).toHaveAttribute('data-responsive-viewport','desktop');
  await expect(details.locator('[data-variant-responsive-ref="stacked-facts"]')).toHaveAttribute('data-responsive-viewport','narrow');
  const grid=card.locator('[data-preview-for="receipt"] .nbc-receipt-grid');
  await expect(grid).toHaveCount(1);
  await expect(grid.locator(':scope > div')).toHaveCount(3);
  const desktopColumns=await grid.evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(desktopColumns).toBe(3);
  await page.setViewportSize({width:360,height:800});
  const narrowColumns=await grid.evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(narrowColumns).toBe(1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAllVariantsComplete(card);
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 payment recovery processing and complete variants are interaction-backed by the live result transition',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  const {card,details}=await openVariantProof(page,'payment-recovery');
  await expect(details.locator('[data-variant-state-ref="recovered"]')).toHaveCount(1);
  for(const state of INTERACTION_BACKED_VARIANTS['payment-recovery']){
    const ref=details.locator(`[data-variant-interaction-ref="${state}"]`);
    await expect(ref).toHaveAttribute('data-interaction-id','result-feedback');
    await expect(ref).toHaveAttribute('data-interaction-state',state);
  }
  const recovery=card.locator('[data-preview-for="payment-recovery"] [data-demo-recovery]');
  const action=recovery.locator('[data-demo-action="recovery"]');
  await action.click();
  await expect(recovery).toHaveAttribute('data-state','loading');
  await expect(action).toHaveText('PROCESSING…');
  await expect(recovery).toHaveAttribute('data-state','success',{timeout:2000});
  await expect(recovery.locator('strong')).toHaveText('Recovered payment accepted.');
  await expect(action).toHaveText('COMPLETE ✓');
  await expectAllVariantsComplete(card);
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 download entitlement keeps signed-ready action-backed instead of rendering a fake signed URL',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  const {card,details,panel}=await openVariantProof(page,'download-entitlement');
  await expect(details.locator('[data-variant-choice]')).toHaveCount(2);
  for(const variant of RENDERED_VARIANTS['download-entitlement'])await exerciseRenderedVariant(details,panel,'download-entitlement',variant);
  await details.locator('[data-variant-choice="eligible"]').click();
  await expect(panel.locator('.nbc-update-card[data-eligible="true"]')).toHaveCount(1);
  await expect(panel).toContainText('signed URL is requested only when you choose Download');
  await details.locator('[data-variant-choice="ineligible"]').click();
  await expect(panel.locator('.nbc-update-card[data-eligible="false"] button')).toBeDisabled();
  const signed=details.locator(`[data-variant-action-ref="${ACTION_BACKED_VARIANTS['download-entitlement'][0]}"]`);
  await expect(signed).toHaveAttribute('data-action-id','download.create');
  await expect(signed).toHaveAttribute('data-result-model','SignedDownloadView');
  await expect(details.locator('[data-variant-action-proof]')).not.toContainText('/reference/downloads/');
  await expect(card.locator('[data-preview-for="download-entitlement"] .nbc-update-card[data-eligible="true"] button')).toHaveCount(1);
  await expectAllVariantsComplete(card);
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 storefront-core variant samples preserve their shipping semantics',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  const product=await openVariantProof(page,'product-card');
  await product.details.locator('[data-variant-choice="primary-action"]').click();
  await expect(product.details.locator('[data-variant-panel] .nbc-button--primary.nbc-tactile')).toHaveCount(1);
  const trust=await openVariantProof(page,'trust-strip');
  await trust.details.locator('[data-variant-choice="policy-support-fact"]').click();
  await expect(trust.panel).toContainText('Render only support terms supplied');
  const promo=await openVariantProof(page,'promo-band');
  await promo.details.locator('[data-variant-choice="highlighted-offer"]').click();
  await expect(promo.panel).toContainText('no countdown or fake scarcity');
  const badge=await openVariantProof(page,'badge');
  await badge.details.locator('[data-variant-choice="coral"]').click();
  await expect(badge.details.locator('[data-variant-panel] .nbc-badge--coral')).toHaveCount(1);
  await badge.details.locator('[data-variant-choice="lime"]').click();
  await expect(badge.details.locator('[data-variant-panel] .nbc-badge--lime')).toHaveCount(1);
  const price=await openVariantProof(page,'price-block');
  await price.details.locator('[data-variant-choice="one-time"]').click();
  await expect(price.panel).toContainText('no recurring charge');
  await price.details.locator('[data-variant-choice="recurring"]').click();
  await expect(price.panel).toContainText('Renews annually until cancelled');
  await price.details.locator('[data-variant-choice="license-scoped"]').click();
  await expect(price.panel).toContainText('5 production sites · 12 months of updates');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 product and trust variant samples preserve their shipping semantics',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  const detail=await openVariantProof(page,'product-detail');
  await detail.details.locator('[data-variant-choice="with-purchase-panel"]').click();
  for(const selector of ['.nbc-product-detail','.nbc-product-buybox','.nbc-license-selector','.nbc-renewal-note','.nbc-purchase-actions','.nbc-button--primary'])await expect(detail.details.locator(`[data-variant-panel] ${selector}`)).toHaveCount(1);
  const gallery=await openVariantProof(page,'product-gallery');
  await gallery.details.locator('[data-variant-choice="selected-thumbnail"]').click();
  await expect(gallery.details.locator('[data-variant-panel] .nbc-gallery-thumb')).toHaveAttribute('aria-pressed','true');
  await gallery.details.locator('[data-variant-choice="unselected-thumbnail"]').click();
  await expect(gallery.details.locator('[data-variant-panel] .nbc-gallery-thumb')).toHaveAttribute('aria-pressed','false');
  const reviews=await openVariantProof(page,'review-summary');
  await reviews.details.locator('[data-variant-choice="rating-plus-count"]').click();
  await expect(reviews.panel).toContainText('128 supplied reviews');
  const testimonials=await openVariantProof(page,'testimonials');
  await testimonials.details.locator('[data-variant-choice="stacked"]').click();
  await expect(testimonials.details.locator('[data-variant-panel] .nbc-review')).toHaveCount(2);
  const guarantee=await openVariantProof(page,'guarantee');
  await guarantee.details.locator('[data-variant-choice="refund-policy"]').click();
  await expect(guarantee.panel).toContainText('policy data');
  const license=await openVariantProof(page,'license-selector');
  await license.details.locator('[data-variant-choice="selected"]').click();
  await expect(license.details.locator('[data-variant-panel] input[type="radio"]')).toBeChecked();
  await license.details.locator('[data-variant-choice="capacity-comparison"]').click();
  await expect(license.details.locator('[data-variant-panel] .nbc-license-option')).toHaveCount(2);
  await expect(license.panel).toContainText('1 production site');
  await expect(license.panel).toContainText('5 production sites');
  const renewal=await openVariantProof(page,'renewal-note');
  await renewal.details.locator('[data-variant-choice="one-time-updates-window"]').click();
  await expect(renewal.panel).toContainText('no automatic renewal');
  await renewal.details.locator('[data-variant-choice="renewal-disclosure"]').click();
  await expect(renewal.panel).toContainText('supplied offer or billing model');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 Pricing rendered variants preserve featured plan and optional-extra consequences',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  const pricing=await openVariantProof(page,'pricing-tier');
  await pricing.details.locator('[data-variant-choice="default"]').click();
  await expect(pricing.details.locator('[data-variant-panel] .nbc-plan-card[data-featured="true"]')).toHaveCount(0);
  await expect(pricing.panel).toContainText('1 production site · 12 months updates');
  await pricing.details.locator('[data-variant-choice="featured"]').click();
  await expect(pricing.details.locator('[data-variant-panel] .nbc-plan-card[data-featured="true"]')).toHaveCount(1);
  await expect(pricing.details.locator('[data-variant-panel] .nbc-plan-ribbon')).toHaveText('POPULAR');
  await expect(pricing.panel).toContainText('5 production sites · 12 months updates');
  const bundle=await openVariantProof(page,'bundle-builder');
  await bundle.details.locator('[data-variant-choice="no-extras"]').click();
  await expect(bundle.details.locator('[data-variant-panel] input[type="checkbox"]:checked')).toHaveCount(0);
  await expect(bundle.details.locator('[data-variant-panel] [data-bundle-total]')).toHaveText('$49');
  await bundle.details.locator('[data-variant-choice="selected-extras"]').click();
  await expect(bundle.details.locator('[data-variant-panel] input[type="checkbox"]:checked')).toHaveCount(1);
  await expect(bundle.details.locator('[data-variant-panel] [data-bundle-total]')).toHaveText('$69');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 checkout rendered variants preserve native state, authoritative totals, and recovery copy',async({page})=>{
  const runtimeFailures=collectRuntimeFailures(page);
  await loadVariantExplorer(page);
  const cart=await openVariantProof(page,'cart-item');
  await cart.details.locator('[data-variant-choice="default"]').click();
  await expect(cart.panel.locator('.nbc-cart-item button')).toHaveCount(0);
  await cart.details.locator('[data-variant-choice="removable"]').click();
  await expect(cart.panel.locator('.nbc-cart-item button')).toHaveCount(1);
  const summary=await openVariantProof(page,'order-summary');
  await summary.details.locator('[data-variant-choice="checkout-quote"]').click();
  await expect(summary.panel).toContainText('Provider-normalized CheckoutQuoteView values are authoritative.');
  const coupon=await openVariantProof(page,'coupon');
  await coupon.details.locator('[data-variant-choice="accepted"]').click();
  await expect(coupon.panel.locator('.nbc-coupon-status')).toHaveAttribute('data-state','success');
  await coupon.details.locator('[data-variant-choice="rejected"]').click();
  await expect(coupon.panel.locator('.nbc-coupon-status')).toHaveAttribute('data-state','error');
  const field=await openVariantProof(page,'checkout-field');
  await field.details.locator('[data-variant-choice="invalid"]').click();
  await expect(field.panel.locator('input')).toHaveAttribute('aria-invalid','true');
  await expect(field.panel).toContainText('Enter a valid email address.');
  await field.details.locator('[data-variant-choice="disabled"]').click();
  await expect(field.panel.locator('input')).toBeDisabled();
  const payment=await openVariantProof(page,'payment-method');
  await payment.details.locator('[data-variant-choice="selected"]').click();
  await expect(payment.panel.locator('input[type="radio"]')).toBeChecked();
  await payment.details.locator('[data-variant-choice="unselected"]').click();
  await expect(payment.panel.locator('input[type="radio"]')).not.toBeChecked();
  const order=await openVariantProof(page,'order-confirmation');
  await expect(order.panel).toContainText('Entitlement or download delivery remains separate');
  expect(runtimeFailures).toEqual([]);
});

test('v1.1 variant controls are keyboard operable and preserve tactile down-press grammar',async({page},testInfo)=>{
  await loadVariantExplorer(page);
  const {details,panel}=await openVariantProof(page,'product-card');
  const accent=details.locator('[data-variant-choice="accent-badge"]');
  const primary=details.locator('[data-variant-choice="primary-action"]');
  await accent.focus();
  await expect(accent).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(accent).toHaveAttribute('aria-pressed','true');
  await expect(panel).toHaveAttribute('data-variant-current','accent-badge');
  await primary.focus();
  await page.keyboard.press('Space');
  await expect(primary).toHaveAttribute('aria-pressed','true');
  const license=await openVariantProof(page,'license-selector');
  const comparison=license.details.locator('[data-variant-choice="capacity-comparison"]');
  await comparison.focus();
  await page.keyboard.press('Enter');
  await expect(comparison).toHaveAttribute('aria-pressed','true');
  const pricing=await openVariantProof(page,'pricing-tier');
  const featured=pricing.details.locator('[data-variant-choice="featured"]');
  await featured.focus();
  await page.keyboard.press('Enter');
  await expect(featured).toHaveAttribute('aria-pressed','true');
  const checkout=await openVariantProof(page,'checkout-field');
  const invalid=checkout.details.locator('[data-variant-choice="invalid"]');
  await invalid.focus();
  await page.keyboard.press('Enter');
  await expect(invalid).toHaveAttribute('aria-pressed','true');
  if(testInfo.project.name!=='mobile-chromium'){
    await accent.hover();
    await page.waitForTimeout(180);
    const hoverY=await accent.evaluate(element=>{const transform=getComputedStyle(element).transform;return transform==='none'?0:new DOMMatrixReadOnly(transform).m42;});
    expect(hoverY).toBeGreaterThan(0);
  }
});

test('v1.1 all variant proof kinds stay accessible in dark theme and at narrow width',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await loadVariantExplorer(page);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const renewal=await openVariantProof(page,'renewal-note');
  await renewal.details.locator('[data-variant-choice="renewal-disclosure"]').click();
  await expect(renewal.panel).toContainText('supplied offer or billing model');
  const media=await openVariantProof(page,'product-media');
  await expect(media.details.locator('[data-variant-state-ref]')).toHaveCount(3);
  const comparison=await openVariantProof(page,'plan-comparison');
  const wrap=comparison.card.locator('[data-preview-for="plan-comparison"] .nbc-compare-wrap');
  await wrap.focus();
  await expect(wrap).toBeFocused();
  expect(await wrap.evaluate(element=>element.scrollWidth-element.clientWidth)).toBeGreaterThan(0);
  const receipt=await openVariantProof(page,'receipt');
  await expect(receipt.details.locator('[data-variant-responsive-ref]')).toHaveCount(2);
  const recovery=await openVariantProof(page,'payment-recovery');
  await expect(recovery.details.locator('[data-variant-interaction-ref]')).toHaveCount(2);
  const download=await openVariantProof(page,'download-entitlement');
  await expect(download.details.locator('[data-variant-action-ref]')).toHaveCount(1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
