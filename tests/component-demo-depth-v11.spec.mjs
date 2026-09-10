import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const depthChip=(card,status,label)=>card.locator(`.cx-depth-chip[data-depth-status="${status}"]`).filter({hasText:new RegExp(`^${escapeRegex(label)}$`)});

const waitForDepthAudit=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-depth-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-depth-audited','47');
  await expect(page.locator('html')).toHaveAttribute('data-component-implementation-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-component-implementation-audited','26');
  await expect(page.locator('html')).toHaveAttribute('data-component-implementation-batches','3');
};

test('v1.1 component demo depth audit covers exact accumulated implementation evidence',async({page})=>{
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
  await expect(page.locator('[data-component-card][data-demo-depth-batch="stateful-high-risk"]')).toHaveCount(12);
  await expect(page.locator('[data-component-card][data-demo-depth-batch="product-storefront"]')).toHaveCount(7);
  await expect(page.locator('[data-component-card][data-demo-depth-batch="trust-review-pricing"]')).toHaveCount(7);
  await expect(page.locator('[data-component-card][data-demo-depth-batch="none"]')).toHaveCount(21);
  await expect(page.locator('[data-component-card][data-demo-implementation-evidence="true"]')).toHaveCount(26);
  await expect(page.locator('[data-component-card][data-demo-depth-missing="0"]')).toHaveCount(26);
  await expect(page.locator('[data-component-card][data-demo-depth-missing="2"]')).toHaveCount(21);
  await expect(page.locator('.cx-depth-evidence[data-demo-implementation-evidence]')).toHaveCount(26);
  await expect(page.locator('[data-demo-implementation-batch="stateful-high-risk"]')).toHaveCount(12);
  await expect(page.locator('[data-demo-implementation-batch="product-storefront"]')).toHaveCount(7);
  await expect(page.locator('[data-demo-implementation-batch="trust-review-pricing"]')).toHaveCount(7);
  await expect(page.locator('[data-copy-ready-kind]')).toHaveCount(26*3);

  const subscription=page.locator('[data-component-id="subscription-management"]');
  await expect(subscription).toHaveAttribute('data-demo-depth-first-batch','true');
  await expect(subscription).toHaveAttribute('data-demo-depth-batch','stateful-high-risk');
  await expect(subscription).toHaveAttribute('data-demo-implementation-evidence','true');
  await subscription.locator('[data-component-depth-audit] summary').click();
  await expect(depthChip(subscription,'complete','Canonical states')).toBeVisible();
  await expect(depthChip(subscription,'complete','Action contracts')).toBeVisible();
  await expect(depthChip(subscription,'complete','Design tokens used')).toBeVisible();
  await expect(depthChip(subscription,'complete','Copy-ready HTML / CSS / JS')).toBeVisible();
  await expect(subscription.locator('[data-demo-token-list] .cx-depth-token')).toHaveCount(6);
  await expect(subscription.locator('[data-demo-implementation-evidence]')).toContainText('BATCH 1 · STATEFUL / HIGH-RISK');
  await expect(subscription.locator('[data-copy-ready-kind="html"]')).toContainText('data-subscription-state');
  await expect(subscription.locator('[data-copy-ready-kind="css"]')).toContainText('@neobrutal/commerce/styles.css');
  await expect(subscription.locator('[data-copy-ready-kind="js"]')).toContainText('subscription.cancel');
  await expect(subscription.locator('[data-copy-ready-kind="js"]')).toContainText('subscription.resume');
  await expect(subscription.locator('[data-copy-ready-kind="js"]')).toContainText('subscription.get');

  const productCard=page.locator('[data-component-id="product-card"]');
  await expect(productCard).toHaveAttribute('data-demo-depth-first-batch','false');
  await expect(productCard).toHaveAttribute('data-demo-depth-batch','product-storefront');
  await expect(productCard).toHaveAttribute('data-demo-implementation-evidence','true');
  await productCard.locator('[data-component-depth-audit] summary').click();
  await expect(depthChip(productCard,'not-applicable','Canonical states')).toBeVisible();
  await expect(depthChip(productCard,'complete','Action contracts')).toBeVisible();
  await expect(depthChip(productCard,'complete','Design tokens used')).toBeVisible();
  await expect(depthChip(productCard,'complete','Copy-ready HTML / CSS / JS')).toBeVisible();
  await expect(productCard.locator('[data-demo-implementation-evidence]')).toContainText('BATCH 2 · PRODUCT / STOREFRONT');
  await expect(productCard.locator('[data-demo-token-list]')).toContainText('--nbc-space-4');
  await expect(productCard.locator('[data-copy-ready-kind="html"]')).toContainText('data-commerce-component="product-card"');
  await expect(productCard.locator('[data-copy-ready-kind="js"]')).toContainText('cart.add');

  const gallery=page.locator('[data-component-id="product-gallery"]');
  await expect(gallery).toHaveAttribute('data-demo-depth-batch','product-storefront');
  await gallery.locator('[data-component-depth-audit] summary').click();
  await expect(depthChip(gallery,'not-applicable','Action contracts')).toBeVisible();
  await expect(depthChip(gallery,'complete','Design tokens used')).toBeVisible();
  await expect(gallery.locator('[data-copy-ready-kind="html"]')).toContainText('aria-pressed="true"');
  await expect(gallery.locator('[data-copy-ready-kind="js"]')).toContainText('nbc-gallery-thumb');

  const license=page.locator('[data-component-id="license-selector"]');
  await license.locator('[data-component-depth-audit] summary').click();
  await expect(license.locator('[data-copy-ready-kind="html"]')).toContainText('type="radio"');
  await expect(license.locator('[data-copy-ready-kind="html"]')).toContainText('checked');

  const trust=page.locator('[data-component-id="trust-strip"]');
  await expect(trust).toHaveAttribute('data-demo-depth-first-batch','false');
  await expect(trust).toHaveAttribute('data-demo-depth-batch','trust-review-pricing');
  await expect(trust).toHaveAttribute('data-demo-implementation-evidence','true');
  await trust.locator('[data-component-depth-audit] summary').click();
  await expect(depthChip(trust,'not-applicable','Canonical states')).toBeVisible();
  await expect(depthChip(trust,'not-applicable','Action contracts')).toBeVisible();
  await expect(depthChip(trust,'complete','Design tokens used')).toBeVisible();
  await expect(depthChip(trust,'complete','Copy-ready HTML / CSS / JS')).toBeVisible();
  await expect(trust.locator('[data-demo-implementation-evidence]')).toContainText('BATCH 3 · TRUST / REVIEW / PRICING');
  await expect(trust.locator('[data-copy-ready-kind="html"]')).toContainText('data-trust-title');
  await expect(trust.locator('[data-copy-ready-kind="js"]')).toContainText('renderTrustEvidence');

  const review=page.locator('[data-component-id="review-summary"]');
  await expect(review).toHaveAttribute('data-demo-depth-batch','trust-review-pricing');
  await review.locator('[data-component-depth-audit] summary').click();
  await expect(review.locator('[data-demo-token-list]')).toContainText('--nbc-yellow');
  await expect(review.locator('[data-copy-ready-kind="html"]')).toContainText('Rating supplied by review data');
  await expect(review.locator('[data-copy-ready-kind="js"]')).toContainText('requires supplied rating and count data');

  const testimonials=page.locator('[data-component-id="testimonials"]');
  await testimonials.locator('[data-component-depth-audit] summary').click();
  await expect(testimonials.locator('[data-copy-ready-kind="html"]')).toContainText('Supplied testimonial text');
  await expect(testimonials.locator('[data-copy-ready-kind="js"]')).toContainText('renderTestimonial');

  const guarantee=page.locator('[data-component-id="guarantee"]');
  await guarantee.locator('[data-component-depth-audit] summary').click();
  await expect(guarantee.locator('[data-copy-ready-kind="html"]')).toContainText('Policy-backed guarantee');
  await expect(guarantee.locator('[data-copy-ready-kind="html"]')).toContainText('without inferring terms');

  const pricing=page.locator('[data-component-id="pricing-tier"]');
  await expect(pricing).toHaveAttribute('data-demo-depth-batch','trust-review-pricing');
  await pricing.locator('[data-component-depth-audit] summary').click();
  await expect(depthChip(pricing,'complete','Action contracts')).toBeVisible();
  await expect(pricing.locator('[data-copy-ready-kind="html"]')).toContainText('5 production sites · 12 months updates');
  await expect(pricing.locator('[data-copy-ready-kind="js"]')).toContainText('cart.add');

  const comparison=page.locator('[data-component-id="plan-comparison"]');
  await comparison.locator('[data-component-depth-audit] summary').click();
  await expect(comparison.locator('[data-copy-ready-kind="html"]')).toContainText('tabindex="0"');
  await expect(comparison.locator('[data-copy-ready-kind="html"]')).toContainText('scope="col"');
  await expect(comparison.locator('[data-copy-ready-kind="js"]')).toContainText('ArrowRight');

  const bundle=page.locator('[data-component-id="bundle-builder"]');
  await bundle.locator('[data-component-depth-audit] summary').click();
  const bundleHtml=bundle.locator('[data-copy-ready-kind="html"]');
  await expect(bundleHtml).toContainText('type="checkbox"');
  await expect(bundleHtml).not.toContainText('checked');
  await expect(bundleHtml).toContainText('data-bundle-total');
  await expect(bundle.locator('[data-copy-ready-kind="js"]')).toContainText('cart.add');

  const remaining=page.locator('[data-component-id="promo-band"]');
  await expect(remaining).toHaveAttribute('data-demo-depth-batch','none');
  await expect(remaining).toHaveAttribute('data-demo-implementation-evidence','false');
  await remaining.locator('[data-component-depth-audit] summary').click();
  await expect(depthChip(remaining,'missing','Design tokens used')).toBeVisible();
  await expect(depthChip(remaining,'missing','Copy-ready HTML / CSS / JS')).toBeVisible();
  await expect(remaining.locator('[data-demo-implementation-evidence]')).toHaveCount(0);

  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(results.violations,'expanded component depth audit WCAG A/AA violations').toEqual([]);
  expect(runtimeFailures,'component depth audit runtime/console failures').toEqual([]);
});

test('v1.1 accumulated depth evidence survives theme and narrow-screen inspection',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForDepthAudit(page);
  const subscription=page.locator('[data-component-id="subscription-management"]');
  const productCard=page.locator('[data-component-id="product-card"]');
  const trust=page.locator('[data-component-id="trust-strip"]');
  const pricing=page.locator('[data-component-id="pricing-tier"]');
  await subscription.locator('[data-component-depth-audit] summary').click();
  await productCard.locator('[data-component-depth-audit] summary').click();
  await trust.locator('[data-component-depth-audit] summary').click();
  await pricing.locator('[data-component-depth-audit] summary').click();

  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  for(const card of [subscription,productCard,trust,pricing]){
    await expect(card.locator('[data-component-depth-audit]')).toBeVisible();
    await expect(card.locator('[data-demo-implementation-evidence]')).toBeVisible();
    await expect(card.locator('.cx-depth-summary')).toContainText('0 missing');
  }
  await expect(productCard.locator('[data-copy-ready-kind="html"] pre')).toBeVisible();
  await expect(trust.locator('[data-copy-ready-kind="html"] pre')).toBeVisible();
  await expect(pricing.locator('[data-copy-ready-kind="html"] pre')).toBeVisible();

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'accumulated component depth implementation evidence must not introduce document horizontal overflow').toBeLessThanOrEqual(1);
});
