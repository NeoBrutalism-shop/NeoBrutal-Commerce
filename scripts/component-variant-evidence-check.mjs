import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const normalize=value=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

const evidence=json('storefront/component-variant-evidence.json');
const showcase=json('storefront/component-showcase.json');
const components=json('storefront/components.json');
const depth=json('storefront/component-demo-depth.json');
const runtime=read('component-variant-evidence.js');
const css=read('component-variant-evidence.css');
const explorer=read('components.html');
const browser=read('tests/component-variant-evidence-v11.spec.mjs');

if(evidence.schema!=='neobrutal-commerce/component-variant-evidence@1')fail('Unexpected component variant evidence schema');
if(evidence.showcaseVersion!=='1.1.0'||evidence.commerceVersion!=='1.0.0'||evidence.role!=='variant-evidence-only')fail('Component variant evidence version/role drifted');
if(evidence.batch?.id!=='storefront-core'||evidence.batch?.ordinal!==1||evidence.batch?.label!=='Storefront core')fail('First component variant evidence batch provenance drifted');

const expectedIds=['product-card','trust-strip','promo-band','badge','price-block'];
const componentIds=evidence.components?.map(entry=>entry.id)||[];
if(!same(evidence.batch?.componentIds||[],expectedIds)||!same(componentIds,expectedIds)||componentIds.length!==5)fail('First variant evidence batch must cover exact five storefront-core components');
if(new Set(componentIds).size!==5)fail('Duplicate component in variant evidence batch');

const frozenIds=new Set((components.components||[]).map(component=>component.id));
const showcaseById=new Map((showcase.components||[]).map(component=>[component.id,component]));
let totalVariants=0;
for(const entry of evidence.components){
  if(!frozenIds.has(entry.id))fail(`Variant evidence references unknown frozen component: ${entry.id}`);
  const authority=showcaseById.get(entry.id);
  if(!authority)fail(`Variant evidence missing showcase authority: ${entry.id}`);
  if(!Array.isArray(entry.variants)||entry.variants.length===0)fail(`Variant evidence has no samples: ${entry.id}`);
  const variantIds=entry.variants.map(variant=>variant.id);
  if(new Set(variantIds).size!==variantIds.length)fail(`Duplicate variant id: ${entry.id}`);
  const expectedVariantIds=(authority.variants||[]).map(normalize);
  if(!same(variantIds,expectedVariantIds)||variantIds.length!==expectedVariantIds.length)fail(`Variant evidence does not exactly match showcase variants: ${entry.id}`);
  for(const variant of entry.variants){
    if(variant.id!==normalize(variant.label))fail(`Variant evidence id/label normalization drifted: ${entry.id}:${variant.id}`);
    if(typeof variant.markup!=='string'||!variant.markup.trim())fail(`Variant evidence missing markup: ${entry.id}:${variant.id}`);
    if(!variant.markup.includes(`data-variant-sample="${entry.id}:${variant.id}"`))fail(`Variant evidence missing explicit sample identity: ${entry.id}:${variant.id}`);
    if(/<script\b|\son[a-z]+\s*=/i.test(variant.markup))fail(`Variant evidence must remain declarative markup: ${entry.id}:${variant.id}`);
    totalVariants++;
  }
}
if(totalVariants!==13)fail(`First variant evidence batch must contain exact 13 variants, got ${totalVariants}`);

const byId=new Map(evidence.components.map(entry=>[entry.id,new Map(entry.variants.map(variant=>[variant.id,variant.markup]))]));
const sample=(component,variant)=>byId.get(component)?.get(variant)||'';
if(!sample('product-card','accent-badge').includes('nbc-badge--coral'))fail('Product-card accent-badge proof must visibly use the coral badge variant');
if(!/nbc-button--primary[^\"]*nbc-tactile|nbc-tactile[^\"]*nbc-button--primary/.test(sample('product-card','primary-action')))fail('Product-card primary-action proof must use the real tactile primary action class');
if(!sample('trust-strip','policy-support-fact').includes('Render only support terms supplied'))fail('Trust-strip policy proof must remain supplied-data authoritative');
for(const variant of ['informational','highlighted-offer']){
  const markup=sample('promo-band',variant).toLowerCase();
  if(!markup.includes('no countdown')&&!markup.includes('without urgency'))fail(`Promo-band ${variant} must explicitly reject fabricated urgency`);
}
if(!sample('badge','coral').includes('nbc-badge--coral')||!sample('badge','lime').includes('nbc-badge--lime'))fail('Badge variant proofs must use shipping accent classes');
if(!sample('price-block','one-time').toLowerCase().includes('no recurring charge'))fail('Price one-time proof must make non-recurring consequence explicit');
if(!sample('price-block','recurring').toLowerCase().includes('renews annually'))fail('Recurring price proof must disclose renewal cadence');
if(!sample('price-block','license-scoped').includes('5 production sites')||!sample('price-block','license-scoped').includes('12 months of updates'))fail('License-scoped price proof must keep capacity and update term visible');

const resolvedVariants=new Map((depth.components||[]).map(entry=>[entry.id,(entry.overrides||{}).variants??depth.defaultStatus?.variants]));
if([...resolvedVariants.values()].filter(status=>status==='complete').length!==5||[...resolvedVariants.values()].filter(status=>status==='partial').length!==42)fail('Variant audit must remain exact at 5 complete / 42 partial');
for(const id of expectedIds)if(resolvedVariants.get(id)!=='complete')fail(`First-batch component must have complete variant status: ${id}`);
for(const [id,status] of resolvedVariants)if(!expectedIds.includes(id)&&status!=='partial')fail(`Uncovered component variant status must remain partial: ${id}`);

for(const marker of ['component-variant-evidence.json','VARIANT_BATCH_IDS','data-component-variant-evidence','dataset.demoVariantEvidence','dataset.componentVariantReady','dataset.componentVariantAudited','dataset.componentVariantCount','aria-pressed','data-variant-current'])if(!runtime.includes(marker))fail(`Variant runtime missing marker: ${marker}`);
if(/transition\s*:\s*all/i.test(css)||/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css))fail('Variant evidence UI violates tactile motion laws');
if(!css.includes('.cx-variant-choice:hover{transform:translateY(1px)')||!css.includes('translateY(2px)'))fail('Variant evidence controls must compress downward on hover/press');
for(const marker of ['prefers-reduced-motion','forced-colors',':focus-visible'])if(!css.includes(marker))fail(`Variant evidence CSS missing accessibility marker: ${marker}`);
for(const marker of ['./component-variant-evidence.css','./component-variant-evidence.js'])if(!explorer.includes(marker))fail(`components.html missing variant evidence asset: ${marker}`);
if(explorer.indexOf('./component-variant-evidence.js')>explorer.indexOf('./component-depth-audit.js'))fail('Variant evidence runtime must load before depth audit runtime');
for(const marker of ['13','data-component-variant-evidence','data-variant-choice','data-variant-current','AxeBuilder','aria-pressed','product-card','trust-strip','promo-band','badge','price-block'])if(!browser.includes(marker))fail(`Variant evidence Browser QA missing marker: ${marker}`);

console.log(`Component variant evidence passed · ${componentIds.length}/47 components · ${totalVariants} exact variants · 5 complete / 42 partial`);
