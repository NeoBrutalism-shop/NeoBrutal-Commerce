import {test,expect} from '@playwright/test';

const loadVariantExplorer=async page=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-system-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-variant-audited','42');
};

const openVariantProof=async(page,id)=>{
  const card=page.locator(`[data-component-id="${id}"]`);
  const details=card.locator('[data-component-variant-evidence]');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open','');
  return {card,details,panel:details.locator('[data-variant-panel]')};
};

test('v1.1 keyboard variant activation preserves focus and current-panel identity',async({page})=>{
  await loadVariantExplorer(page);

  const product=await openVariantProof(page,'product-card');
  const accent=product.details.locator('[data-variant-choice="accent-badge"]');
  await accent.focus();
  await expect(accent).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(accent).toHaveAttribute('aria-pressed','true');
  await expect(product.panel).toHaveAttribute('data-variant-current','accent-badge');

  const primary=product.details.locator('[data-variant-choice="primary-action"]');
  await primary.focus();
  await expect(primary).toBeFocused();
  await page.keyboard.press('Space');
  await expect(primary).toHaveAttribute('aria-pressed','true');
  await expect(product.panel).toHaveAttribute('data-variant-current','primary-action');

  const license=await openVariantProof(page,'license-selector');
  const comparison=license.details.locator('[data-variant-choice="capacity-comparison"]');
  await comparison.focus();
  await expect(comparison).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(comparison).toHaveAttribute('aria-pressed','true');
  await expect(license.panel).toHaveAttribute('data-variant-current','capacity-comparison');

  const pricing=await openVariantProof(page,'pricing-tier');
  const featured=pricing.details.locator('[data-variant-choice="featured"]');
  await featured.focus();
  await expect(featured).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(featured).toHaveAttribute('aria-pressed','true');
  await expect(pricing.panel).toHaveAttribute('data-variant-current','featured');
});

test('v1.1 dark narrow mode preserves canonical product-media controls and responsive proof references',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await loadVariantExplorer(page);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');

  const media=await openVariantProof(page,'product-media');
  await expect(media.details.locator('[data-variant-state-ref]')).toHaveCount(3);
  const stateButton=media.card.locator('[data-showcase-state="files"]');
  await stateButton.click();
  await expect(stateButton).toHaveAttribute('aria-pressed','true');
  await expect(media.card.locator('[data-state-result] code')).toHaveText('files');
  const mediaButton=media.card.locator('[data-preview-for="product-media"] [data-media-state="files"]');
  await mediaButton.click();
  await expect(mediaButton).toHaveAttribute('aria-pressed','true');
  await expect(media.card.locator('[data-preview-for="product-media"] [data-media-panel] strong')).toHaveText('FILES');

  const comparison=await openVariantProof(page,'plan-comparison');
  await expect(comparison.details.locator('[data-variant-responsive-ref]')).toHaveCount(2);
  const wrap=comparison.card.locator('[data-preview-for="plan-comparison"] .nbc-compare-wrap');
  await wrap.focus();
  await expect(wrap).toBeFocused();
  expect(await wrap.evaluate(element=>element.scrollWidth-element.clientWidth)).toBeGreaterThan(0);

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
