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
const depth=json('storefront/component-demo-depth.json');
const runtime=read('component-variant-evidence.js');
const css=read('component-variant-evidence.css');
const explorer=read('components.html');
const browser=read('tests/component-variant-evidence-v11.spec.mjs');

if(evidence.schema!=='neobrutal-commerce/component-variant-evidence@2')fail('Unexpected component variant evidence schema');
if(evidence.showcaseVersion!=='1.1.0'||evidence.commerceVersion!=='1.0.0'||evidence.role!=='variant-evidence-only')fail('Component variant evidence version/role drifted');
if(!evidence.proofKinds?.rendered||!evidence.proofKinds?.['canonical-state'])fail('Variant evidence must document rendered and canonical-state proof kinds');

const expectedBatches=[
  {id:'storefront-core',ordinal:1,label:'Storefront core',componentIds:['product-card','trust-strip','promo-band','badge','price-block']},
  {id:'product-trust',ordinal:2,label:'Product + trust',componentIds:['product-detail','product-gallery','product-media','review-summary','testimonials','guarantee','license-selector','renewal-note']}
];
if(!Array.isArray(evidence.batches)||evidence.batches.length!==expectedBatches.length)fail('Variant evidence must preserve exact two-batch accumulated provenance');
for(const expected of expectedBatches){
  const batch=evidence.batches.find(item=>item.id===expected.id);
  if(!batch||batch.ordinal!==expected.ordinal||batch.label!==expected.label||!same(batch.componentIds||[],expected.componentIds))fail(`Variant evidence batch provenance drifted: ${expected.id}`);
}
const expectedIds=expectedBatches.flatMap(batch=>batch.componentIds);
const componentIds=evidence.components?.map(entry=>entry.id)||[];
if(componentIds.length!==13||new Set(componentIds).size!==13||!same(componentIds,expectedIds))fail('Accumulated variant evidence must cover exact 13 storefront + product/trust components');

const batchById=new Map(evidence.batches.map(batch=>[batch.id,batch]));
const frozenIds=new Set((components.components||[]).map(component=>component.id));
const showcaseById=new Map((showcase.components||[]).map(component=>[component.id,component]));
const stateById=new Map((states.components||[]).map(component=>[component.id,new Set(component.states.map(state=>state.id))]));
let totalVariants=0;
let renderedVariants=0;
let stateBackedVariants=0;

for(const entry of evidence.components){
  if(!frozenIds.has(entry.id))fail(`Variant evidence references unknown frozen component: ${entry.id}`);
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
      if(variant.stateId!==undefined)fail(`Rendered variant evidence must not claim canonical state identity: ${entry.id}:${variant.id}`);
      if(!variant.markup.includes(`data-variant-sample="${entry.id}:${variant.id}"`))fail(`Rendered variant evidence missing explicit sample identity: ${entry.id}:${variant.id}`);
      if(/<script\b|\son[a-z]+\s*=/i.test(variant.markup))fail(`Variant evidence must remain declarative markup: ${entry.id}:${variant.id}`);
      renderedVariants++;
    }else if(variant.proofKind==='canonical-state'){
      if(variant.markup!==undefined)fail(`Canonical-state variant evidence must not duplicate markup: ${entry.id}:${variant.id}`);
      if(variant.stateId!==variant.id)fail(`Canonical-state variant must reference the exact normalized variant id: ${entry.id}:${variant.id}`);
      if(!stateById.get(entry.id)?.has(variant.stateId))fail(`Canonical-state variant references unknown state: ${entry.id}:${variant.stateId}`);
      stateBackedVariants++;
    }else fail(`Unknown variant proof kind: ${entry.id}:${variant.id}:${variant.proofKind}`);
    totalVariants++;
  }
}
if(totalVariants!==31||renderedVariants!==28||stateBackedVariants!==3)fail(`Accumulated variant evidence must contain 31 exact variants · 28 rendered / 3 canonical-state-backed; got ${totalVariants} · ${renderedVariants}/${stateBackedVariants}`);

const byId=new Map(evidence.components.map(entry=>[entry.id,new Map(entry.variants.map(variant=>[variant.id,variant]))]));
const rendered=(component,variant)=>byId.get(component)?.get(variant)?.markup||'';
const proof=(component,variant)=>byId.get(component)?.get(variant);

if(!rendered('product-card','accent-badge').includes('nbc-badge--coral'))fail('Product-card accent-badge proof must visibly use the coral badge variant');
if(!/nbc-button--primary[^\"]*nbc-tactile|nbc-tactile[^\"]*nbc-button--primary/.test(rendered('product-card','primary-action')))fail('Product-card primary-action proof must use the real tactile primary action class');
if(!rendered('trust-strip','policy-support-fact').includes('Render only support terms supplied'))fail('Trust-strip policy proof must remain supplied-data authoritative');
for(const variant of ['informational','highlighted-offer']){
  const markup=rendered('promo-band',variant).toLowerCase();
  if(!markup.includes('no countdown')&&!markup.includes('without urgency'))fail(`Promo-band ${variant} must explicitly reject fabricated urgency`);
}
if(!rendered('badge','coral').includes('nbc-badge--coral')||!rendered('badge','lime').includes('nbc-badge--lime'))fail('Badge variant proofs must use shipping accent classes');
if(!rendered('price-block','one-time').toLowerCase().includes('no recurring charge'))fail('Price one-time proof must make non-recurring consequence explicit');
if(!rendered('price-block','recurring').toLowerCase().includes('renews annually'))fail('Recurring price proof must disclose renewal cadence');
if(!rendered('price-block','license-scoped').includes('5 production sites')||!rendered('price-block','license-scoped').includes('12 months of updates'))fail('License-scoped price proof must keep capacity and update term visible');

if(!rendered('product-detail','default').includes('nbc-product-detail')||rendered('product-detail','default').includes('nbc-product-buybox'))fail('Product-detail default proof must preserve the base product-detail anatomy without a purchase panel');
const purchaseDetail=rendered('product-detail','with-purchase-panel');
for(const marker of ['nbc-product-detail','nbc-product-buybox','nbc-license-selector','nbc-renewal-note','nbc-purchase-actions','nbc-button--primary'])if(!purchaseDetail.includes(marker))fail(`Product-detail purchase-panel proof missing shipping anatomy: ${marker}`);
if(!rendered('product-gallery','selected-thumbnail').includes('nbc-gallery-thumb')||!rendered('product-gallery','selected-thumbnail').includes('aria-pressed="true"'))fail('Product-gallery selected proof must expose programmatic selected state');
if(!rendered('product-gallery','unselected-thumbnail').includes('nbc-gallery-thumb')||!rendered('product-gallery','unselected-thumbnail').includes('aria-pressed="false"'))fail('Product-gallery unselected proof must expose programmatic unselected state');
for(const state of ['preview','code','files']){
  const variant=proof('product-media',state);
  if(variant?.proofKind!=='canonical-state'||variant.stateId!==state)fail(`Product-media ${state} must remain canonical-state-backed`);
}
if(rendered('review-summary','rating-summary').includes('<small')||!rendered('review-summary','rating-plus-count').includes('<small'))fail('Review-summary proofs must visibly distinguish rating-only from rating-plus-count');
if(!rendered('review-summary','rating-plus-count').toLowerCase().includes('supplied'))fail('Review-summary count proof must state supplied-data provenance');
if(count(rendered('testimonials','single'),'<article class="nbc-review"')!==1||count(rendered('testimonials','stacked'),'<article class="nbc-review"')!==2)fail('Testimonials proofs must visibly distinguish single and stacked layouts');
for(const variant of ['guarantee','refund-policy'])if(!rendered('guarantee',variant).toLowerCase().includes('policy'))fail(`Guarantee ${variant} proof must remain policy-backed`);
if(rendered('license-selector','unselected').includes(' checked')||!rendered('license-selector','selected').includes(' checked'))fail('License-selector selected/unselected proofs must preserve native radio state');
const comparison=rendered('license-selector','capacity-comparison');
if(!comparison.includes('1 production site')||!comparison.includes('5 production sites')||count(comparison,'nbc-license-option')!==2)fail('License-selector capacity comparison must keep both supplied capacities visible');
if(!rendered('renewal-note','one-time-updates-window').toLowerCase().includes('no automatic renewal'))fail('One-time updates-window proof must make non-renewal consequence explicit');
const renewalDisclosure=rendered('renewal-note','renewal-disclosure').toLowerCase();
if(!renewalDisclosure.includes('billing cadence')||!renewalDisclosure.includes('supplied'))fail('Renewal disclosure proof must keep provider/offer authority explicit');

const resolvedVariants=new Map((depth.components||[]).map(entry=>[entry.id,(entry.overrides||{}).variants??depth.defaultStatus?.variants]));
if([...resolvedVariants.values()].filter(status=>status==='complete').length!==13||[...resolvedVariants.values()].filter(status=>status==='partial').length!==34)fail('Variant audit must remain exact at 13 complete / 34 partial');
for(const id of expectedIds)if(resolvedVariants.get(id)!=='complete')fail(`Accumulated variant-evidence component must be complete: ${id}`);
for(const [id,status] of resolvedVariants)if(!expectedIds.includes(id)&&status!=='partial')fail(`Uncovered component variant status must remain partial: ${id}`);

for(const marker of ['component-variant-evidence.json','PROOF_KINDS','data-component-variant-evidence','data-variant-state-proof','data-variant-state-ref','dataset.demoVariantEvidence','dataset.componentVariantReady','dataset.componentVariantAudited','dataset.componentVariantCount','dataset.componentVariantRenderedCount','dataset.componentVariantStateBackedCount','dataset.componentVariantBatches','aria-pressed','data-variant-current'])if(!runtime.includes(marker))fail(`Variant runtime missing marker: ${marker}`);
if(/transition\s*:\s*all/i.test(css)||/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css))fail('Variant evidence UI violates motion/tactile laws');
if(!css.includes('.cx-variant-choice:hover{transform:translateY(1px)')||!css.includes('translateY(2px)'))fail('Variant evidence controls must compress downward on hover/press');
for(const marker of ['prefers-reduced-motion','forced-colors',':focus-visible','.cx-variant-state-proof','.cx-variant-state-ref'])if(!css.includes(marker))fail(`Variant evidence CSS missing accessibility/proof marker: ${marker}`);
for(const marker of ['./component-variant-evidence.css','./component-variant-evidence.js'])if(!explorer.includes(marker))fail(`components.html missing variant evidence asset: ${marker}`);
if(explorer.indexOf('./component-variant-evidence.js')>explorer.indexOf('./component-depth-audit.js'))fail('Variant evidence runtime must load before depth audit runtime');
for(const marker of ['31','28','3','data-component-variant-evidence','data-variant-choice','data-variant-current','data-variant-state-ref','data-showcase-state','data-media-state','AxeBuilder','aria-pressed','product-detail','product-gallery','product-media','review-summary','testimonials','guarantee','license-selector','renewal-note'])if(!browser.includes(marker))fail(`Variant evidence Browser QA missing marker: ${marker}`);

console.log(`Component variant evidence passed · ${componentIds.length}/47 components · ${totalVariants} exact variants · ${renderedVariants} rendered / ${stateBackedVariants} canonical-state-backed · 13 complete / 34 partial`);
