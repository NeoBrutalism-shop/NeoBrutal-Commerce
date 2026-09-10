import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const normalize=value=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const count=(value,needle)=>(value.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;

const evidence=json('storefront/component-variant-evidence.json');
const showcase=json('storefront/component-showcase.json');
const components=json('storefront/components.json');
const states=json('storefront/component-states.json');
const interactions=json('storefront/interactions.json');
const depth=json('storefront/component-demo-depth.json');
const pricingImplementation=json('storefront/component-demo-implementation-trust-pricing.json');
const checkoutImplementation=json('storefront/component-demo-implementation-cart-checkout.json');
const statefulImplementation=json('storefront/component-demo-implementation.json');
const accountImplementation=json('storefront/component-demo-implementation-account-ownership.json');
const pricingCss=read('src/components/pricing.css');
const cartCss=read('src/components/cart.css');
const summaryCss=read('src/components/summary.css');
const checkoutCss=read('src/components/checkout.css');
const licenseCss=read('src/components/license.css');
const actionRuntime=read('src/actions/runtime.js');
const actionTests=read('tests/actions-v05.test.mjs');
const explorerRuntime=read('component-explorer.js');
const runtime=read('component-variant-evidence.js');
const css=read('component-variant-evidence.css');
const explorer=read('components.html');
const browser=read('tests/component-variant-evidence-v11.spec.mjs');

if(evidence.schema!=='neobrutal-commerce/component-variant-evidence@4')fail('Unexpected component variant evidence schema');
if(evidence.showcaseVersion!=='1.1.0'||evidence.commerceVersion!=='1.0.0'||evidence.role!=='variant-evidence-only')fail('Component variant evidence version/role drifted');
for(const kind of ['rendered','canonical-state','responsive-backed','interaction-backed','action-backed'])if(!evidence.proofKinds?.[kind])fail(`Variant evidence must document ${kind} proof kind`);

const expectedBatches=[
  {id:'storefront-core',ordinal:1,label:'Storefront core',componentIds:['product-card','trust-strip','promo-band','badge','price-block']},
  {id:'product-trust',ordinal:2,label:'Product + trust',componentIds:['product-detail','product-gallery','product-media','review-summary','testimonials','guarantee','license-selector','renewal-note']},
  {id:'pricing',ordinal:3,label:'Pricing',componentIds:['pricing-tier','plan-comparison','bundle-builder']},
  {id:'checkout',ordinal:4,label:'Cart + checkout',componentIds:['cart-item','order-summary','coupon','checkout-field','checkout-steps','payment-method','payment-failure','payment-recovery','processing-state','order-confirmation','receipt','download-entitlement']}
];
if(!Array.isArray(evidence.batches)||evidence.batches.length!==expectedBatches.length)fail('Variant evidence must preserve exact four-batch accumulated provenance');
for(const expected of expectedBatches){
  const batch=evidence.batches.find(item=>item.id===expected.id);
  if(!batch||batch.ordinal!==expected.ordinal||batch.label!==expected.label||!same(batch.componentIds||[],expected.componentIds))fail(`Variant evidence batch provenance drifted: ${expected.id}`);
}
const expectedIds=expectedBatches.flatMap(batch=>batch.componentIds);
const componentIds=evidence.components?.map(entry=>entry.id)||[];
if(componentIds.length!==28||new Set(componentIds).size!==28||!same(componentIds,expectedIds))fail('Accumulated variant evidence must cover exact 28 storefront + product/trust + pricing + checkout components');
if(componentIds.includes('invoice-details'))fail('Invoice-details must remain outside variant-complete evidence until source-backed implementation evidence exists');

const batchById=new Map(evidence.batches.map(batch=>[batch.id,batch]));
const frozenById=new Map((components.components||[]).map(component=>[component.id,component]));
const showcaseById=new Map((showcase.components||[]).map(component=>[component.id,component]));
const stateById=new Map((states.components||[]).map(component=>[component.id,new Set(component.states.map(state=>state.id))]));
const interactionById=new Map((interactions.patterns||[]).map(pattern=>[pattern.id,pattern]));
let totalVariants=0;
let renderedVariants=0;
let stateBackedVariants=0;
let responsiveBackedVariants=0;
let interactionBackedVariants=0;
let actionBackedVariants=0;

for(const entry of evidence.components){
  const frozen=frozenById.get(entry.id);
  if(!frozen)fail(`Variant evidence references unknown frozen component: ${entry.id}`);
  const batch=batchById.get(entry.batchId);
  if(!batch?.componentIds.includes(entry.id))fail(`Variant evidence component has invalid batch provenance: ${entry.id}`);
  const authority=showcaseById.get(entry.id);
  if(!authority)fail(`Variant evidence missing showcase authority: ${entry.id}`);
  if(!Array.isArray(entry.variants)||entry.variants.length===0)fail(`Variant evidence has no samples: ${entry.id}`);
  const variantIds=entry.variants.map(variant=>variant.id);
  if(new Set(variantIds).size!==variantIds.length)fail(`Duplicate variant id: ${entry.id}`);
  const expectedVariantIds=(authority.variants||[]).map(normalize);
  if(!same(variantIds,expectedVariantIds)||variantIds.length!==expectedVariantIds.length)fail(`Variant evidence does not exactly match showcase variants: ${entry.id}`);
  for(const variant of entry.variants){
    if(variant.id!==normalize(variant.label))fail(`Variant evidence id/label normalization drifted: ${entry.id}:${variant.id}`);
    if(variant.proofKind==='rendered'){
      if(typeof variant.markup!=='string'||!variant.markup.trim())fail(`Rendered variant evidence missing markup: ${entry.id}:${variant.id}`);
      for(const field of ['stateId','responsiveMode','viewport','selectors','interactionId','interactionState','actionId','resultModel'])if(variant[field]!==undefined)fail(`Rendered variant evidence must not claim backing identity: ${entry.id}:${variant.id}:${field}`);
      if(!variant.markup.includes(`data-variant-sample="${entry.id}:${variant.id}"`))fail(`Rendered variant evidence missing explicit sample identity: ${entry.id}:${variant.id}`);
      if(/<script\b|\son[a-z]+\s*=/i.test(variant.markup))fail(`Variant evidence must remain declarative markup: ${entry.id}:${variant.id}`);
      renderedVariants++;
    }else if(variant.proofKind==='canonical-state'){
      for(const field of ['markup','responsiveMode','viewport','selectors','interactionId','interactionState','actionId','resultModel'])if(variant[field]!==undefined)fail(`Canonical-state variant evidence must not duplicate another proof authority: ${entry.id}:${variant.id}:${field}`);
      if(variant.stateId!==variant.id)fail(`Canonical-state variant must reference the exact normalized variant id: ${entry.id}:${variant.id}`);
      if(!stateById.get(entry.id)?.has(variant.stateId))fail(`Canonical-state variant references unknown state: ${entry.id}:${variant.stateId}`);
      stateBackedVariants++;
    }else if(variant.proofKind==='responsive-backed'){
      for(const field of ['markup','stateId','interactionId','interactionState','actionId','resultModel'])if(variant[field]!==undefined)fail(`Responsive-backed variant evidence must not duplicate another proof authority: ${entry.id}:${variant.id}:${field}`);
      if(variant.responsiveMode!==authority.responsiveMode)fail(`Responsive-backed proof must reference authoritative responsiveMode: ${entry.id}:${variant.id}`);
      if(!['desktop','narrow'].includes(variant.viewport))fail(`Responsive-backed proof uses unsupported viewport: ${entry.id}:${variant.id}`);
      if(!Array.isArray(variant.selectors)||!variant.selectors.length||new Set(variant.selectors).size!==variant.selectors.length||variant.selectors.some(selector=>typeof selector!=='string'||!selector.trim()))fail(`Responsive-backed proof requires unique selectors: ${entry.id}:${variant.id}`);
      responsiveBackedVariants++;
    }else if(variant.proofKind==='interaction-backed'){
      for(const field of ['markup','stateId','responsiveMode','viewport','actionId','resultModel'])if(variant[field]!==undefined)fail(`Interaction-backed variant evidence must not duplicate another proof authority: ${entry.id}:${variant.id}:${field}`);
      const interaction=interactionById.get(variant.interactionId);
      if(!interaction)fail(`Interaction-backed proof references unknown interaction: ${entry.id}:${variant.id}:${variant.interactionId}`);
      if(!interaction.states?.includes(variant.interactionState))fail(`Interaction-backed proof references unsupported interaction state: ${entry.id}:${variant.id}:${variant.interactionState}`);
      if(!Array.isArray(variant.selectors)||!variant.selectors.length||new Set(variant.selectors).size!==variant.selectors.length)fail(`Interaction-backed proof requires unique live selectors: ${entry.id}:${variant.id}`);
      interactionBackedVariants++;
    }else if(variant.proofKind==='action-backed'){
      for(const field of ['markup','stateId','responsiveMode','viewport','interactionId','interactionState'])if(variant[field]!==undefined)fail(`Action-backed variant evidence must not duplicate another proof authority: ${entry.id}:${variant.id}:${field}`);
      if(!frozen.actions.includes(variant.actionId))fail(`Action-backed proof references non-component action: ${entry.id}:${variant.id}:${variant.actionId}`);
      if(!frozen.models.includes(variant.resultModel))fail(`Action-backed proof references non-component result model: ${entry.id}:${variant.id}:${variant.resultModel}`);
      if(!Array.isArray(variant.selectors)||!variant.selectors.length||new Set(variant.selectors).size!==variant.selectors.length)fail(`Action-backed proof requires unique live selectors: ${entry.id}:${variant.id}`);
      actionBackedVariants++;
    }else fail(`Unknown variant proof kind: ${entry.id}:${variant.id}:${variant.proofKind}`);
    totalVariants++;
  }
}
if(totalVariants!==65||renderedVariants!==48||stateBackedVariants!==10||responsiveBackedVariants!==4||interactionBackedVariants!==2||actionBackedVariants!==1)fail(`Accumulated variant evidence must contain 65 exact variants · 48 rendered / 10 canonical-state-backed / 4 responsive-backed / 2 interaction-backed / 1 action-backed; got ${totalVariants} · ${renderedVariants}/${stateBackedVariants}/${responsiveBackedVariants}/${interactionBackedVariants}/${actionBackedVariants}`);

const byId=new Map(evidence.components.map(entry=>[entry.id,new Map(entry.variants.map(variant=>[variant.id,variant]))]));
const rendered=(component,variant)=>byId.get(component)?.get(variant)?.markup||'';
const proof=(component,variant)=>byId.get(component)?.get(variant);

if(!rendered('product-card','accent-badge').includes('nbc-badge--coral'))fail('Product-card accent-badge proof must visibly use the coral badge variant');
if(!/nbc-button--primary[^\"]*nbc-tactile|nbc-tactile[^\"]*nbc-button--primary/.test(rendered('product-card','primary-action')))fail('Product-card primary-action proof must use the real tactile primary action class');
if(!rendered('trust-strip','policy-support-fact').includes('Render only support terms supplied'))fail('Trust-strip policy proof must remain supplied-data authoritative');
for(const variant of ['informational','highlighted-offer']){const markup=rendered('promo-band',variant).toLowerCase();if(!markup.includes('no countdown')&&!markup.includes('without urgency'))fail(`Promo-band ${variant} must explicitly reject fabricated urgency`);}
if(!rendered('badge','coral').includes('nbc-badge--coral')||!rendered('badge','lime').includes('nbc-badge--lime'))fail('Badge variant proofs must use shipping accent classes');
if(!rendered('price-block','one-time').toLowerCase().includes('no recurring charge'))fail('Price one-time proof must make non-recurring consequence explicit');
if(!rendered('price-block','recurring').toLowerCase().includes('renews annually'))fail('Recurring price proof must disclose renewal cadence');
if(!rendered('price-block','license-scoped').includes('5 production sites')||!rendered('price-block','license-scoped').includes('12 months of updates'))fail('License-scoped price proof must keep capacity and update term visible');

if(!rendered('product-detail','default').includes('nbc-product-detail')||rendered('product-detail','default').includes('nbc-product-buybox'))fail('Product-detail default proof must preserve the base product-detail anatomy without a purchase panel');
const purchaseDetail=rendered('product-detail','with-purchase-panel');
for(const marker of ['nbc-product-detail','nbc-product-buybox','nbc-license-selector','nbc-renewal-note','nbc-purchase-actions','nbc-button--primary'])if(!purchaseDetail.includes(marker))fail(`Product-detail purchase-panel proof missing shipping anatomy: ${marker}`);
if(!rendered('product-gallery','selected-thumbnail').includes('aria-pressed="true"')||!rendered('product-gallery','unselected-thumbnail').includes('aria-pressed="false"'))fail('Product-gallery proofs must expose selected and unselected programmatic state');
for(const state of ['preview','code','files']){const variant=proof('product-media',state);if(variant?.proofKind!=='canonical-state'||variant.stateId!==state)fail(`Product-media ${state} must remain canonical-state-backed`);}
if(rendered('review-summary','rating-summary').includes('<small')||!rendered('review-summary','rating-plus-count').includes('<small'))fail('Review-summary proofs must visibly distinguish rating-only from rating-plus-count');
if(!rendered('review-summary','rating-plus-count').toLowerCase().includes('supplied'))fail('Review-summary count proof must state supplied-data provenance');
if(count(rendered('testimonials','single'),'<article class="nbc-review"')!==1||count(rendered('testimonials','stacked'),'<article class="nbc-review"')!==2)fail('Testimonials proofs must visibly distinguish single and stacked layouts');
for(const variant of ['guarantee','refund-policy'])if(!rendered('guarantee',variant).toLowerCase().includes('policy'))fail(`Guarantee ${variant} proof must remain policy-backed`);
if(rendered('license-selector','unselected').includes(' checked')||!rendered('license-selector','selected').includes(' checked'))fail('License-selector selected/unselected proofs must preserve native radio state');
const licenseComparison=rendered('license-selector','capacity-comparison');
if(!licenseComparison.includes('1 production site')||!licenseComparison.includes('5 production sites')||count(licenseComparison,'nbc-license-option')!==2)fail('License-selector capacity comparison must keep both supplied capacities visible');
if(!rendered('renewal-note','one-time-updates-window').toLowerCase().includes('no automatic renewal'))fail('One-time updates-window proof must make non-renewal consequence explicit');
const renewalDisclosure=rendered('renewal-note','renewal-disclosure').toLowerCase();
if(!renewalDisclosure.includes('billing cadence')||!renewalDisclosure.includes('supplied'))fail('Renewal disclosure proof must keep provider/offer authority explicit');

const pricingDefault=rendered('pricing-tier','default');
const pricingFeatured=rendered('pricing-tier','featured');
if(!pricingDefault.includes('nbc-plan-card')||pricingDefault.includes('data-featured="true"')||pricingDefault.includes('nbc-plan-ribbon'))fail('Pricing-tier default proof must use the unfeatured shipping plan-card anatomy');
if(!pricingFeatured.includes('nbc-plan-card')||!pricingFeatured.includes('data-featured="true"')||!pricingFeatured.includes('nbc-plan-ribbon'))fail('Pricing-tier featured proof must use shipping featured/ribbon anatomy');
for(const [id,markup] of [['default',pricingDefault],['featured',pricingFeatured]])if(!markup.includes('production site')||!markup.includes('12 months updates'))fail(`Pricing-tier ${id} proof must keep capacity and updates consequence visible`);
const noExtras=rendered('bundle-builder','no-extras');
const selectedExtras=rendered('bundle-builder','selected-extras');
if(!noExtras.includes('nbc-bundle')||noExtras.includes(' checked')||!noExtras.includes('data-bundle-total>$49'))fail('Bundle-builder no-extras proof must start unselected at the base total');
if(!selectedExtras.includes('nbc-bundle')||!selectedExtras.includes(' checked')||!selectedExtras.includes('data-bundle-total>$69'))fail('Bundle-builder selected-extras proof must expose selected native state and updated total');
for(const [id,viewport] of [['desktop-table','desktop'],['narrow-scroll-container','narrow']]){const variant=proof('plan-comparison',id);if(variant?.proofKind!=='responsive-backed'||variant.responsiveMode!=='contained-scroll'||variant.viewport!==viewport)fail(`Plan-comparison ${id} must remain contained-scroll responsive-backed proof`);if(!same(variant.selectors||[],['.nbc-compare-wrap','.nbc-compare']))fail(`Plan-comparison ${id} must reference the exact live comparison wrapper/table selectors`);}
const pricingImplementationById=new Map((pricingImplementation.components||[]).map(entry=>[entry.id,entry]));
const planImplementation=pricingImplementationById.get('plan-comparison');
if(!planImplementation||!same(planImplementation.selectors||[],['.nbc-compare-wrap','.nbc-compare','.nbc-compare thead th']))fail('Plan-comparison implementation evidence selector authority drifted');
for(const marker of ['.nbc-plan-card[data-featured="true"]','.nbc-plan-ribbon','.nbc-compare-wrap{overflow-x:auto','.nbc-compare-wrap:focus','.nbc-compare{width:100%;min-width:44rem','.nbc-bundle-option:has(input:checked)'])if(!pricingCss.includes(marker))fail(`Shipping pricing CSS missing variant/responsive authority: ${marker}`);

const cartDefault=rendered('cart-item','default');
const cartRemovable=rendered('cart-item','removable');
if(!cartDefault.includes('nbc-cart-item')||cartDefault.includes('<button'))fail('Cart-item default proof must preserve line anatomy without inventing removal UI');
if(!cartRemovable.includes('nbc-cart-item')||!cartRemovable.includes('<button')||!cartRemovable.includes('nbc-cart-price'))fail('Cart-item removable proof must preserve line context plus an explicit removal control');
if(!rendered('order-summary','cart-quote').includes('normalized CartView')||!rendered('order-summary','checkout-quote').includes('CheckoutQuoteView'))fail('Order-summary proofs must distinguish cart totals from provider-authoritative checkout quote totals');
const couponReady=rendered('coupon','ready');
const couponAccepted=rendered('coupon','accepted');
const couponRejected=rendered('coupon','rejected');
if(couponReady.includes('data-state="success"')||couponReady.includes('data-state="error"'))fail('Coupon ready proof must not pre-claim an outcome');
if(!couponAccepted.includes('data-state="success"')||!couponAccepted.toLowerCase().includes('authoritative updated total'))fail('Coupon accepted proof must expose success text without hiding authoritative totals');
if(!couponRejected.includes('data-state="error"')||!couponRejected.toLowerCase().includes('authoritative total is unchanged'))fail('Coupon rejected proof must expose error text without inventing a changed total');
if(!rendered('checkout-field','filled').includes('value="buyer@example.com"'))fail('Checkout-field filled proof must visibly contain input');
if(!rendered('checkout-field','invalid').includes('aria-invalid="true"')||!rendered('checkout-field','invalid').includes('Enter a valid email address'))fail('Checkout-field invalid proof must expose programmatic and textual recovery state');
if(!rendered('checkout-field','disabled').includes(' disabled'))fail('Checkout-field disabled proof must use native disabled semantics');
for(const state of ['ready','processing','failed','recovered']){const variant=proof('checkout-steps',state);if(variant?.proofKind!=='canonical-state'||variant.stateId!==state)fail(`Checkout-steps ${state} must reuse canonical state authority`);}
if(!rendered('payment-method','selected').includes(' checked')||rendered('payment-method','unselected').includes(' checked'))fail('Payment-method proofs must preserve native selected/unselected radio state');
if(proof('payment-failure','failed')?.proofKind!=='canonical-state')fail('Payment-failure failed must remain canonical-state-backed');
if(proof('payment-recovery','recovered')?.proofKind!=='canonical-state')fail('Payment-recovery recovered must remain canonical-state-backed');
for(const state of ['processing','complete']){const variant=proof('payment-recovery',state);if(variant?.proofKind!=='interaction-backed'||variant.interactionId!=='result-feedback'||variant.interactionState!==state)fail(`Payment-recovery ${state} must reuse result-feedback interaction authority`);if(!same(variant.selectors||[],['[data-demo-recovery]','[data-demo-action="recovery"]']))fail(`Payment-recovery ${state} must reference exact live recovery selectors`);}
if(proof('processing-state','processing')?.proofKind!=='canonical-state')fail('Processing-state processing must remain canonical-state-backed');
const orderComplete=rendered('order-confirmation','complete');
if(!orderComplete.includes('nbc-order-success')||!orderComplete.includes('nbc-order-number')||!orderComplete.toLowerCase().includes('entitlement'))fail('Order-confirmation complete proof must report transaction result without falsely claiming entitlement delivery');
for(const [id,viewport] of [['summary-grid','desktop'],['stacked-facts','narrow']]){const variant=proof('receipt',id);if(variant?.proofKind!=='responsive-backed'||variant.responsiveMode!=='grid-to-stack'||variant.viewport!==viewport)fail(`Receipt ${id} must remain grid-to-stack responsive-backed proof`);if(!same(variant.selectors||[],['.nbc-receipt-grid','.nbc-receipt-grid div']))fail(`Receipt ${id} must reference exact live receipt selectors`);}
if(!rendered('download-entitlement','eligible').includes('data-eligible="true"')||!rendered('download-entitlement','eligible').toLowerCase().includes('signed url is requested only'))fail('Download-entitlement eligible proof must keep signed download deferred until action');
if(!rendered('download-entitlement','ineligible').includes('data-eligible="false"')||!rendered('download-entitlement','ineligible').includes(' disabled'))fail('Download-entitlement ineligible proof must expose unavailable consequence and disabled action');
const signedReady=proof('download-entitlement','signed-ready');
if(signedReady?.proofKind!=='action-backed'||signedReady.actionId!=='download.create'||signedReady.resultModel!=='SignedDownloadView')fail('Download-entitlement signed-ready must be action-backed by download.create -> SignedDownloadView');
if(!same(signedReady.selectors||[],['.nbc-update-card[data-eligible="true"]','button']))fail('Download-entitlement signed-ready must reference the exact eligible live action surface');

const statefulIds=new Set((statefulImplementation.components||[]).map(entry=>entry.id));
for(const id of ['checkout-steps','payment-failure','payment-recovery','processing-state'])if(!statefulIds.has(id))fail(`Checkout variant proof missing stateful implementation authority: ${id}`);
const checkoutImplementationIds=new Set((checkoutImplementation.components||[]).map(entry=>entry.id));
for(const id of ['cart-item','order-summary','coupon','checkout-field','payment-method','order-confirmation','receipt'])if(!checkoutImplementationIds.has(id))fail(`Checkout variant proof missing cart/checkout implementation authority: ${id}`);
const accountImplementationIds=new Set((accountImplementation.components||[]).map(entry=>entry.id));
if(!accountImplementationIds.has('download-entitlement'))fail('Download-entitlement variant proof missing account/ownership implementation authority');
const resultFeedback=interactionById.get('result-feedback');
if(!resultFeedback||resultFeedback.inputs?.[0]!=='action-result'||!resultFeedback.states?.includes('processing')||!resultFeedback.states?.includes('complete'))fail('result-feedback interaction authority must preserve action-result processing/complete states');
for(const marker of ['download.create','createSignedDownload','signedDownloads'])if(!actionRuntime.includes(marker))fail(`Canonical action runtime missing signed-download authority: ${marker}`);
for(const marker of ["type:'download.create'","download.releaseId","download.url","reference\\/downloads"])if(!actionTests.includes(marker))fail(`Action tests missing signed-download result proof: ${marker}`);
for(const marker of ['.nbc-cart-item','.nbc-checkout-field'])if(!cartCss.includes(marker))fail(`Shipping cart CSS missing checkout variant authority: ${marker}`);
for(const marker of ['.nbc-summary','.nbc-summary-row[data-total="true"]'])if(!summaryCss.includes(marker))fail(`Shipping summary CSS missing checkout variant authority: ${marker}`);
for(const marker of ['.nbc-coupon-status[data-state="success"]','.nbc-coupon-status[data-state="error"]','.nbc-payment-method:has(input:checked)','.nbc-order-success','.nbc-receipt-grid','@media(max-width:38rem)'])if(!checkoutCss.includes(marker))fail(`Shipping checkout CSS missing variant/responsive authority: ${marker}`);
for(const marker of ['.nbc-update-card[data-eligible="true"]','.nbc-update-card[data-eligible="false"]'])if(!licenseCss.includes(marker))fail(`Shipping entitlement CSS missing eligibility authority: ${marker}`);
for(const marker of ['cart-item','order-summary','coupon','checkout-field','checkout-steps','payment-method','payment-failure','payment-recovery','processing-state','order-confirmation','receipt','download-entitlement','data-demo-recovery','data-demo-action="recovery"','Submitting recovered payment','Recovered payment accepted'])if(!explorerRuntime.includes(marker))fail(`Live component explorer missing checkout preview/interaction authority: ${marker}`);

const resolvedVariants=new Map((depth.components||[]).map(entry=>[entry.id,(entry.overrides||{}).variants??depth.defaultStatus?.variants]));
if([...resolvedVariants.values()].filter(status=>status==='complete').length!==28||[...resolvedVariants.values()].filter(status=>status==='partial').length!==19)fail('Variant audit must remain exact at 28 complete / 19 partial');
for(const id of expectedIds)if(resolvedVariants.get(id)!=='complete')fail(`Accumulated variant-evidence component must be complete: ${id}`);
for(const [id,status] of resolvedVariants)if(!expectedIds.includes(id)&&status!=='partial')fail(`Uncovered component variant status must remain partial: ${id}`);
if(resolvedVariants.get('invoice-details')!=='partial')fail('Invoice-details variants must remain partial');

for(const marker of ['component-variant-evidence.json','PROOF_KINDS','responsive-backed','interaction-backed','action-backed','data-component-variant-evidence','data-variant-state-proof','data-variant-state-ref','data-variant-responsive-proof','data-variant-responsive-ref','data-variant-interaction-proof','data-variant-interaction-ref','data-variant-action-proof','data-variant-action-ref','dataset.demoVariantEvidence','dataset.componentVariantReady','dataset.componentVariantAudited','dataset.componentVariantCount','dataset.componentVariantRenderedCount','dataset.componentVariantStateBackedCount','dataset.componentVariantResponsiveBackedCount','dataset.componentVariantInteractionBackedCount','dataset.componentVariantActionBackedCount','dataset.componentVariantBatches','aria-pressed','data-variant-current'])if(!runtime.includes(marker))fail(`Variant runtime missing marker: ${marker}`);
if(/transition\s*:\s*all/i.test(css)||/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css))fail('Component variant evidence UI violates tactile motion laws');
for(const marker of ['prefers-reduced-motion','forced-colors',':focus-visible','.cx-variant-state-proof','.cx-variant-state-ref'])if(!css.includes(marker))fail(`Variant evidence CSS missing accessibility/proof marker: ${marker}`);
for(const marker of ['./component-variant-evidence.css','./component-variant-evidence.js'])if(!explorer.includes(marker))fail(`components.html missing variant evidence asset: ${marker}`);
if(explorer.indexOf('./component-variant-evidence.js')>explorer.indexOf('./component-depth-audit.js'))fail('Variant evidence runtime must load before depth audit runtime');
for(const marker of ['65','48','10','4','2','1','data-component-variant-evidence','data-variant-choice','data-variant-current','data-variant-state-ref','data-variant-responsive-ref','data-variant-interaction-ref','data-variant-action-ref','data-responsive-mode','data-responsive-viewport','data-interaction-id','data-action-id','AxeBuilder','aria-pressed','cart-item','order-summary','coupon','checkout-field','checkout-steps','payment-method','payment-failure','payment-recovery','processing-state','order-confirmation','receipt','download-entitlement'])if(!browser.includes(marker))fail(`Variant evidence Browser QA missing marker: ${marker}`);

console.log(`Component variant evidence passed · ${componentIds.length}/47 components · ${totalVariants} exact variants · ${renderedVariants} rendered / ${stateBackedVariants} canonical-state-backed / ${responsiveBackedVariants} responsive-backed / ${interactionBackedVariants} interaction-backed / ${actionBackedVariants} action-backed · 28 complete / 19 partial`);
