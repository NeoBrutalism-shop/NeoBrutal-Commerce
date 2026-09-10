import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS={
  'product-card':['default','accent-badge','primary-action'],
  'trust-strip':['check-mark-fact','policy-support-fact'],
  'promo-band':['informational','highlighted-offer'],
  'badge':['default','coral','lime'],
  'price-block':['one-time','recurring','license-scoped']
};

const waitForVariantEvidence=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-audited','5');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-count','13');
  await expect(page.locator('html')).toHaveAttribute('data-component-depth-ready','true');
};

const openVariantProof=async(page,id)=>{
  const card=page.locator(`[data-component-id="${id}"]`);
  const details=card.locator('[data-component-variant-evidence]');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
  return {card,details,panel:details.locator('[data-variant-panel]')};
};

test('v1.1 storefront variant evidence switches all 13 authoritative samples',async({page})=>{
  const runtimeFailures=[];
  page.on('pageerror',error=>runtimeFailures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForVariantEvidence(page);

  await expect(page.locator('[data-component-card]')).toHaveCount(47);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="true"]')).toHaveCount(5);
  await expect(page.locator('[data-component-card][data-demo-variant-evidence="false"]')).toHaveCount(42);
  await expect(page.locator('[data-component-variant-evidence]')).toHaveCount(5);
  await expect(page.locator('[data-variant-choice]')).toHaveCount(13);

  for(const [id,variants] of Object.entries(VARIANTS)){
    const {card,details,panel}=await openVariantProof(page,id);
    await expect(details.locator('summary')).toContainText(`${variants.length}/${variants.length}`);
    const choices=details.locator('[data-variant-choice]');
    await expect(choices).toHaveCount(variants.length);
    for(const variant of variants){
      const choice=details.locator(`[data-variant-choice="${variant}"]`);
      await choice.click();
      await expect(choice).toHaveAttribute('aria-pressed','true');
      await expect(details.locator('[data-variant-choice][aria-pressed="true"]')).toHaveCount(1);
      await expect(panel).toHaveAttribute('data-variant-current',variant);
      await expect(panel.locator(`[data-variant-sample="${id}:${variant}"]`)).toHaveCount(1);
    }
    await expect(card.locator('[data-component-depth-audit] .cx-depth-chip[data-depth-status="complete"]').filter({hasText:/^All variants$/})).toHaveCount(1);
  }

  const product=page.locator('[data-component-id="product-card"] [data-component-variant-evidence]');
  await expect(product.locator('[data-variant-choice="primary-action"]')).toHaveAttribute('aria-pressed','true');
  await expect(product.locator('[data-variant-panel] .nbc-button--primary.nbc-tactile')).toHaveCount(1);

  const trust=page.locator('[data-component-id="trust-strip"] [data-component-variant-evidence]');
  await trust.locator('[data-variant-choice="policy-support-fact"]').click();
  await expect(trust.locator('[data-variant-panel]')).toContainText('Render only support terms supplied');

  const promo=page.locator('[data-component-id="promo-band"] [data-component-variant-evidence]');
  await promo.locator('[data-variant-choice="highlighted-offer"]').click();
  await expect(promo.locator('[data-variant-panel]')).toContainText('no countdown or fake scarcity');

  const badge=page.locator('[data-component-id="badge"] [data-component-variant-evidence]');
  await badge.locator('[data-variant-choice="coral"]').click();
  await expect(badge.locator('[data-variant-panel] .nbc-badge--coral')).toHaveCount(1);
  await badge.locator('[data-variant-choice="lime"]').click();
  await expect(badge.locator('[data-variant-panel] .nbc-badge--lime')).toHaveCount(1);

  const price=page.locator('[data-component-id="price-block"] [data-component-variant-evidence]');
  await price.locator('[data-variant-choice="one-time"]').click();
  await expect(price.locator('[data-variant-panel]')).toContainText('no recurring charge');
  await price.locator('[data-variant-choice="recurring"]').click();
  await expect(price.locator('[data-variant-panel]')).toContainText('Renews annually until cancelled');
  await price.locator('[data-variant-choice="license-scoped"]').click();
  await expect(price.locator('[data-variant-panel]')).toContainText('5 production sites · 12 months of updates');

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

test('v1.1 variant evidence stays accessible in dark theme and at narrow width',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForVariantEvidence(page);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');

  const {details}=await openVariantProof(page,'price-block');
  await details.locator('[data-variant-choice="recurring"]').click();
  await expect(details.locator('[data-variant-panel]')).toContainText('Renews annually until cancelled');

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
