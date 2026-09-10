import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Frozen v1.0 provenance: all ten real production routes remain exercised below.
const showcaseRoutes=['/components.html','/demo/v10.html'];
const waitForShowcaseContracts=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-showcase-version','1.1.0');
  await expect(page.locator('html')).toHaveAttribute('data-showcase-state-examples','42');
  await expect(page.locator('html')).toHaveAttribute('data-promoted-blocks-ready','true');
};
const waitForPageLibrary=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-page-library-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-page-library-version','1.2.0');
  await expect(page.locator('html')).toHaveAttribute('data-page-library-pages','10');
  await expect(page.locator('html')).toHaveAttribute('data-page-library-blocks','23');
  await expect(page.locator('html')).toHaveAttribute('data-page-library-composed-blocks','18');
};
const gridTrackCount=async locator=>locator.evaluate(node=>getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length);

for(const route of showcaseRoutes){
  test(`v1.0 GitHub Pages showcase is accessible ${route}`,async({page})=>{
    const httpFailures=[];
    const runtimeFailures=[];
    page.on('response',response=>{if(response.status()>=400)httpFailures.push(`${response.status()} ${response.url()}`)});
    page.on('pageerror',error=>runtimeFailures.push(error.message));
    page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
    await page.goto(route,{waitUntil:'networkidle'});
    if(route==='/components.html'){
      await waitForShowcaseContracts(page);
      await expect(page.locator('[data-component-card]')).toHaveCount(47);
      await expect(page.locator('[data-component-card] [data-doc-complete]')).toHaveCount(47);
      await expect(page.locator('[data-state-matrix]')).toHaveCount(12);
      await expect(page.locator('[data-showcase-state]')).toHaveCount(42);
      await expect(page.locator('[data-block-preview-for]')).toHaveCount(23);
    }else{
      await waitForPageLibrary(page);
    }
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(results.violations,`${route} WCAG A/AA violations`).toEqual([]);
    expect(httpFailures,`${route} HTTP failures`).toEqual([]);
    expect(runtimeFailures,`${route} runtime/console failures`).toEqual([]);
  });
}

test('v1.0 flagship connects to permanent component explorer without visual-layout changes',async({page})=>{
  await page.goto('/');
  const links=page.locator('a[href="components.html"]');
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveText('Components');
  await expect(links.last()).toContainText('EXPLORE COMPONENTS');
});

test('v1.1 component explorer renders complete frozen components and documented reusable blocks',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForShowcaseContracts(page);
  await expect(page.locator('[data-component-card]')).toHaveCount(47);
  await expect(page.locator('[data-preview-for]')).toHaveCount(47);
  await expect(page.locator('[data-component-card] [data-doc-complete]')).toHaveCount(47);
  await expect(page.locator('[data-preview-for]').filter({hasText:'Contract registered. Open the live route for full context.'})).toHaveCount(0);
  await expect(page.locator('[data-component-id="subscription-management"]')).toBeVisible();
  await expect(page.locator('[data-component-id="product-media"]')).toBeVisible();

  const comparison=page.locator('[data-component-id="plan-comparison"]');
  await expect(comparison.locator('.cx-component-description')).toContainText('Semantic comparison table');
  await comparison.locator('.cx-doc summary').click();
  await expect(comparison.locator('.cx-doc')).toContainText('contained-scroll');
  await expect(comparison.locator('.cx-doc')).toContainText('table-semantics');
  await expect(comparison.locator('.cx-doc')).toContainText('Wide semantic content scrolls only inside a keyboard-reachable local container.');

  await page.getByRole('tab',{name:/Blocks/}).click();
  await expect(page.locator('[data-block-card]')).toHaveCount(23);
  await expect(page.locator('[data-block-id]')).toHaveCount(23);
  await expect(page.locator('[data-block-preview-for]')).toHaveCount(23);
  await expect(page.locator('[data-block-card] [data-doc-complete]')).toHaveCount(23);
  const blockIds=await page.locator('[data-block-id]').evaluateAll(nodes=>nodes.map(node=>node.dataset.blockId).sort());
  const blockPreviewIds=await page.locator('[data-block-preview-for]').evaluateAll(nodes=>nodes.map(node=>node.dataset.blockPreviewFor).sort());
  expect(new Set(blockPreviewIds).size).toBe(23);
  expect(blockPreviewIds).toEqual(blockIds);
  await expect(page.locator('[data-block-id="checkout-shell"]')).toBeVisible();
  await expect(page.locator('[data-block-id="ownership-operations"]')).toBeVisible();
  for(const promotedId of ['trust-strip','testimonials','guarantee','product-detail','product-gallery']){
    await expect(page.locator(`[data-block-id="${promotedId}"]`)).toBeVisible();
    await expect(page.locator(`[data-block-preview-for="${promotedId}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-block-id="trust-strip"] .nbc-trust')).toContainText('12 months of updates');
  await expect(page.locator('[data-block-id="testimonials"] .nbc-review-grid')).toBeVisible();
  await expect(page.locator('[data-block-id="guarantee"] .nbc-trust')).toContainText('Fit guarantee');
  await expect(page.locator('[data-block-id="product-detail"]')).toContainText('NeoBrutal Soft.');
  await expect(page.locator('[data-block-id="product-detail"] .nbc-feature-list')).toContainText('Light + dark themes');
  await expect(page.locator('[data-block-id="product-gallery"] .nbc-product-art')).toBeVisible();
  await expect(page.locator('[data-block-id="product-gallery"] button')).toHaveCount(3);
  const checkoutBlock=page.locator('[data-block-id="checkout-shell"]');
  await checkoutBlock.locator('.cx-doc summary').click();
  await expect(checkoutBlock.locator('.cx-doc')).toContainText('grid-to-stack');
  await expect(checkoutBlock.locator('.cx-doc')).toContainText('current-location');

  const mediaBlock=page.locator('[data-block-id="product-media"]');
  const mediaPreview=mediaBlock.locator('[data-block-preview-for="product-media"]');
  await expect(mediaPreview).toHaveAttribute('data-block-current-state','preview');
  await mediaBlock.locator('[data-block-media-state="code"]').click();
  await expect(mediaBlock.locator('[data-block-media-state="code"]')).toHaveAttribute('aria-pressed','true');
  await expect(mediaBlock.locator('[data-block-media-state="preview"]')).toHaveAttribute('aria-pressed','false');
  await expect(mediaPreview).toHaveAttribute('data-block-current-state','code');
  await expect(mediaBlock.locator('[data-block-media-panel]')).toContainText('Implementation code view is active.');

  const licenseBlock=page.locator('[data-block-id="license-purchase"]');
  const teamLicense=licenseBlock.getByRole('radio',{name:/Team/});
  await teamLicense.click();
  await expect(teamLicense).toBeChecked();

  const bundleBlock=page.locator('[data-block-id="bundle-builder"]');
  const figmaSource=bundleBlock.getByRole('checkbox',{name:/Figma source/});
  await figmaSource.click();
  await expect(figmaSource).toBeChecked();
});

test('v1.1 live canonical state matrices expose and switch real registry states',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForShowcaseContracts(page);
  await expect(page.locator('[data-state-matrix]')).toHaveCount(12);
  await expect(page.locator('[data-showcase-state]')).toHaveCount(42);

  const subscription=page.locator('[data-component-id="subscription-management"]');
  const subscriptionMatrix=subscription.locator('[data-state-matrix]');
  await expect(subscriptionMatrix.locator('[data-showcase-state]')).toHaveCount(4);
  await subscriptionMatrix.locator('[data-showcase-state="past_due"]').click();
  await expect(subscriptionMatrix.locator('[data-showcase-state="past_due"]')).toHaveAttribute('aria-pressed','true');
  await expect(subscriptionMatrix.locator('[data-state-result]')).toContainText('Subscription past due');
  await expect(subscriptionMatrix.locator('[data-state-result]')).toContainText('Billing recovery is required');
  await expect(subscription.locator('[data-preview-for]')).toHaveAttribute('data-showcase-current-state','past_due');

  const system=page.locator('[data-component-id="system-states"]');
  const systemMatrix=system.locator('[data-state-matrix]');
  await expect(systemMatrix.locator('[data-showcase-state]')).toHaveCount(6);
  await systemMatrix.locator('[data-showcase-state="offline"]').click();
  await expect(systemMatrix.locator('[data-state-result]')).toContainText('Network access is unavailable');

  const planChange=page.locator('[data-component-id="plan-change"]');
  await expect(planChange.locator('[data-showcase-state]')).toHaveCount(5);
  await planChange.locator('[data-showcase-state="quoted"]').click();
  await expect(planChange.locator('[data-state-result]')).toContainText('Provider-authoritative price/capacity consequences');
});

test('v1.1 component explorer search, categories, theme, manifest metadata, and live source interactions work',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForShowcaseContracts(page);
  const search=page.locator('#componentSearch');
  await search.fill('subscription.cancel');
  const visible=page.locator('[data-component-card]:visible');
  await expect(visible).toHaveCount(1);
  await expect(visible).toHaveAttribute('data-component-id','subscription-management');
  await search.fill('');
  await search.fill('reduced-motion');
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(1);
  await expect(page.locator('[data-component-card]:visible')).toHaveAttribute('data-component-id','processing-state');
  await search.fill('');
  await page.locator('#categoryNav button[data-category="product"]').click();
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(8);
  await expect(page.locator('#categoryNav button[data-category="product"] span')).toHaveText('8');
  const theme=page.locator('#themeToggle');
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('#categoryNav button[data-category="all"]').click();
  const subscription=page.locator('[data-component-id="subscription-management"]');
  await expect(subscription.locator('.cx-component-description')).toContainText('Subscription billing controls');
  const action=subscription.locator('[data-demo-action="subscription"]');
  await action.click();
  await expect(action).toHaveText('RESUME RENEWAL');
});

test('v1.2 Page Lab derives all ten real production routes and exposes Blocks → Pages composition',async({page})=>{
  await page.goto('/demo/v10.html?route=checkout&viewport=mobile',{waitUntil:'networkidle'});
  await waitForPageLibrary(page);
  await expect(page.locator('.lab-route-button')).toHaveCount(10);
  await expect(page.locator('[data-page-id]')).toHaveCount(10);
  const pageIds=await page.locator('[data-page-id]').evaluateAll(nodes=>nodes.map(node=>node.dataset.pageId).sort());
  expect(pageIds).toEqual(['account','account-license','cart','checkout','components','home','order-success','pricing','product-soft','products']);
  await expect(page.locator('#labStage')).toHaveAttribute('data-viewport','mobile');
  await expect(page.locator('#labStage')).not.toHaveAttribute('aria-pressed',/.+/);
  await expect(page.locator('#currentPath')).toHaveText('/checkout');
  await expect(page.locator('#currentIntent')).toHaveText('checkout');
  await expect(page.locator('#labFrame')).toHaveAttribute('src','../checkout/');
  await expect(page.frameLocator('#labFrame').locator('[data-commerce-page="checkout"]')).toBeVisible();
  const checkoutBlocks=await page.locator('#currentBlocks [data-page-block]').evaluateAll(nodes=>nodes.map(node=>node.dataset.pageBlock));
  expect(checkoutBlocks).toEqual(['checkout-shell','payment-recovery']);
  await page.getByRole('button',{name:/Tablet/}).click();
  await expect(page.locator('#labStage')).toHaveAttribute('data-viewport','tablet');

  const ownershipButton=page.locator('.lab-route-button[data-route="account-license"]');
  const routeSelect=page.locator('#routeSelect');
  if(await ownershipButton.isVisible()){
    await ownershipButton.click();
  }else{
    await expect(routeSelect).toBeVisible();
    await expect(routeSelect.locator('option')).toHaveCount(10);
    await routeSelect.selectOption('account-license');
  }
  await expect(ownershipButton).toHaveAttribute('aria-current','page');
  await expect(routeSelect).toHaveValue('account-license');
  await expect(page.locator('#currentPath')).toHaveText('/account/license/:id');
  await expect(page.locator('#currentIntent')).toHaveText('license-lifecycle');
  await expect(page.locator('#labFrame')).toHaveAttribute('src','../account/license/demo-soft-team/');
  await expect(page.frameLocator('#labFrame').locator('[data-commerce-page="license-detail"]')).toBeVisible();
  await expect(page.locator('#currentBlocks [data-page-block]')).toHaveCount(4);
  await page.locator('#labTheme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.frameLocator('#labFrame').locator('html')).toHaveAttribute('data-theme','dark');
});

test('v1.2 Page Lab preserves legacy deep links while canonicalizing route identity',async({page})=>{
  await page.goto('/demo/v10.html?route=product&viewport=desktop',{waitUntil:'networkidle'});
  await waitForPageLibrary(page);
  await expect(page.locator('#routeSelect')).toHaveValue('product-soft');
  await expect(page.locator('#currentPath')).toHaveText('/product/soft');
  await expect(page.locator('#currentIntent')).toHaveText('product-detail');
  const productBlocks=await page.locator('#currentBlocks [data-page-block]').evaluateAll(nodes=>nodes.map(node=>node.dataset.pageBlock));
  expect(productBlocks).toEqual(['product-media','trust-band','license-purchase']);
  expect(new URL(page.url()).searchParams.get('route')).toBe('product-soft');
});

test('v1.1 showcase surfaces do not introduce horizontal overflow',async({page})=>{
  for(const route of showcaseRoutes){
    await page.goto(route,{waitUntil:'networkidle'});
    if(route==='/components.html')await waitForShowcaseContracts(page);
    else await waitForPageLibrary(page);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow,`${route} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});

test('v1.1 block previews prove grid-to-stack and contained-scroll behavior',async({page},testInfo)=>{
  test.skip(!new Set(['chromium','mobile-chromium']).has(testInfo.project.name),'Canonical responsive block proof uses Chromium desktop/mobile.');
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForShowcaseContracts(page);
  await page.getByRole('tab',{name:/Blocks/}).click();
  const mobile=testInfo.project.name==='mobile-chromium';
  const checkoutCard=page.locator('[data-block-id="checkout-shell"]');
  const checkoutShell=checkoutCard.locator('.nbc-checkout-shell');
  const pricingGrid=page.locator('[data-block-id="pricing-trio"] .nbc-plan-grid');
  const blockCardTracks=await gridTrackCount(checkoutCard);
  const checkoutTracks=await gridTrackCount(checkoutShell);
  const pricingTracks=await gridTrackCount(pricingGrid);
  if(mobile){
    expect(blockCardTracks,'mobile block card should stack copy and preview').toBe(1);
    expect(checkoutTracks,'checkout split should stack on mobile').toBe(1);
    expect(pricingTracks,'pricing trio should stack on mobile').toBe(1);
    const compare=page.locator('[data-block-id="plan-comparison"] .nbc-compare-wrap');
    await compare.focus();
    await expect(compare).toBeFocused();
    const before=await compare.evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,scrollLeft:node.scrollLeft}));
    expect(before.scrollWidth,'plan comparison should overflow only inside its local container').toBeGreaterThan(before.clientWidth);
    await compare.evaluate(node=>{node.scrollLeft=node.scrollWidth-node.clientWidth});
    const after=await compare.evaluate(node=>node.scrollLeft);
    expect(after,'keyboard-focusable comparison container should be horizontally scrollable').toBeGreaterThan(0);
  }else{
    expect(blockCardTracks,'desktop block card should keep copy and preview columns').toBe(2);
    expect(checkoutTracks,'checkout split should retain two desktop columns').toBe(2);
    expect(pricingTracks,'pricing trio should retain three desktop columns').toBe(3);
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'Blocks tab horizontal overflow').toBeLessThanOrEqual(1);
});

test('v1.2 Page Lab chrome responds without changing the selected production viewport',async({page},testInfo)=>{
  test.skip(!new Set(['chromium','mobile-chromium']).has(testInfo.project.name),'Canonical Page Lab responsive proof uses Chromium desktop/mobile.');
  await page.goto('/demo/v10.html?route=pricing&viewport=desktop',{waitUntil:'networkidle'});
  await waitForPageLibrary(page);
  const mobile=testInfo.project.name==='mobile-chromium';
  const shellTracks=await gridTrackCount(page.locator('.lab-shell'));
  if(mobile){
    expect(shellTracks,'mobile Page Lab should stack sidebar and workspace').toBe(1);
    await expect(page.locator('.lab-route-nav')).toBeHidden();
    await expect(page.locator('.lab-route-select')).toBeVisible();
  }else{
    expect(shellTracks,'desktop Page Lab should retain navigation and workspace columns').toBe(2);
    await expect(page.locator('.lab-route-nav')).toBeVisible();
    await expect(page.locator('.lab-route-select')).toBeHidden();
  }
  await expect(page.locator('#labStage')).toHaveAttribute('data-viewport','desktop');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'Page Lab document horizontal overflow').toBeLessThanOrEqual(1);
});

test('capture v1.1 permanent showcase review surfaces',async({page},testInfo)=>{
  test.skip(!new Set(['chromium','mobile-chromium']).has(testInfo.project.name),'Canonical showcase review captures use Chromium desktop/mobile.');
  test.setTimeout(120_000);
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await waitForShowcaseContracts(page);
  await page.screenshot({path:testInfo.outputPath(`commerce-v11-showcase-explorer-${testInfo.project.name}.png`),fullPage:true});
  await page.getByRole('tab',{name:/Blocks/}).click();
  await page.screenshot({path:testInfo.outputPath(`commerce-v11-showcase-blocks-${testInfo.project.name}.png`),fullPage:true});
  await page.goto('/demo/v10.html?route=product',{waitUntil:'networkidle'});
  await waitForPageLibrary(page);
  await page.screenshot({path:testInfo.outputPath(`commerce-v11-showcase-lab-${testInfo.project.name}.png`),fullPage:true});
});

test('capture v1.2 Page Library and Page Lab review surface',async({page},testInfo)=>{
  test.skip(!new Set(['chromium','mobile-chromium']).has(testInfo.project.name),'Canonical v1.2 Page Lab captures use Chromium desktop/mobile.');
  test.setTimeout(120_000);
  const preview=testInfo.project.name==='mobile-chromium'?'mobile':'desktop';
  await page.goto(`/demo/v10.html?route=account-license&viewport=${preview}`,{waitUntil:'networkidle'});
  await waitForPageLibrary(page);
  await page.screenshot({path:testInfo.outputPath(`commerce-v12-page-lab-${testInfo.project.name}.png`),fullPage:true});
});