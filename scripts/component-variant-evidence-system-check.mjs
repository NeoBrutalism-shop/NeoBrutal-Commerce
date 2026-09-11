import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const normalize=value=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

const base=json('storefront/component-variant-evidence.json');
const account=json('storefront/component-variant-evidence-account.json');
const system=json('storefront/component-variant-evidence-system.json');
const showcase=json('storefront/component-showcase.json');
const components=json('storefront/components.json');
const states=json('storefront/component-states.json');
const statefulImplementation=json('storefront/component-demo-implementation.json');
const accountImplementation=json('storefront/component-demo-implementation-account-ownership.json');
const packageManifest=json('package.json');
const contractTypes=read('src/contracts/index.d.ts');
const tokenCss=read('src/tokens.css');
const explorer=read('component-explorer.js');
const explorerHtml=read('components.html');
const baseRuntime=read('component-variant-evidence.js');
const systemRuntime=read('component-variant-evidence-system.js');
const browser=read('tests/component-variant-evidence-system-v11.spec.mjs');
const report=read('docs/V1.1-SYSTEM-VARIANT-EVIDENCE.md');

for(const manifest of [base,account,system]){
  if(manifest.schema!=='neobrutal-commerce/component-variant-evidence@4'||manifest.showcaseVersion!=='1.1.0'||manifest.commerceVersion!=='1.0.0'||manifest.role!=='variant-evidence-only')fail('System variant evidence shard version/schema/role drifted');
  for(const kind of ['rendered','canonical-state','responsive-backed','interaction-backed','action-backed'])if(!manifest.proofKinds?.[kind])fail(`System variant evidence must preserve ${kind} proof kind`);
}
if(JSON.stringify(system.proofKinds)!==JSON.stringify(base.proofKinds)||JSON.stringify(account.proofKinds)!==JSON.stringify(base.proofKinds))fail('System variant evidence proof-kind contract drifted from certified lineage');

const expectedSystemIds=['component-contract','tokens','system-states','ownership-lifecycle'];
const remainingPartialIds=['invoice-details','purchase-history-row','invoice-history','activation-row','seat-assignment'];
if(system.batches?.length!==1)fail('System variant evidence must contain exactly one provenance batch');
const systemBatch=system.batches[0];
if(systemBatch.id!=='system-foundation'||systemBatch.ordinal!==6||systemBatch.label!=='System + foundation'||!same(systemBatch.componentIds||[],expectedSystemIds))fail('System variant evidence batch provenance drifted');
const systemIds=(system.components||[]).map(entry=>entry.id);
if(systemIds.length!==4||new Set(systemIds).size!==4||!same(systemIds,expectedSystemIds))fail('System variant evidence must cover exact four System + foundation components');
for(const id of remainingPartialIds)if(systemIds.includes(id))fail(`System variant evidence must not promote residual partial component: ${id}`);

const manifests=[base,account,system];
const batches=manifests.flatMap(manifest=>manifest.batches||[]);
const evidenceComponents=manifests.flatMap(manifest=>manifest.components||[]);
const batchedIds=batches.flatMap(batch=>batch.componentIds||[]);
const componentIds=evidenceComponents.map(entry=>entry.id);
if(batches.length!==6||batches.map(batch=>batch.ordinal).join(',')!=='1,2,3,4,5,6'||new Set(batches.map(batch=>batch.id)).size!==6)fail('Combined variant evidence must preserve ordered batches 1 through 6');
if(componentIds.length!==42||new Set(componentIds).size!==42||batchedIds.length!==42||new Set(batchedIds).size!==42||!same(componentIds,batchedIds))fail('Combined variant evidence must cover 42 unique component IDs with non-overlapping provenance');
for(const id of remainingPartialIds)if(componentIds.includes(id))fail(`Residual partial component unexpectedly gained variant evidence: ${id}`);

const frozenById=new Map((components.components||[]).map(component=>[component.id,component]));
const showcaseById=new Map((showcase.components||[]).map(component=>[component.id,component]));
const stateById=new Map((states.components||[]).map(component=>[component.id,new Set(component.states.map(state=>state.id))]));
let totalVariants=0;
let renderedVariants=0;
let stateBackedVariants=0;
let responsiveBackedVariants=0;
let interactionBackedVariants=0;
let actionBackedVariants=0;
for(const entry of evidenceComponents){
  const authority=showcaseById.get(entry.id);
  if(!frozenById.has(entry.id)||!authority)fail(`Combined System evidence references unknown component authority: ${entry.id}`);
  const expectedVariantIds=(authority.variants||[]).map(normalize);
  const actualVariantIds=(entry.variants||[]).map(variant=>variant.id);
  if(expectedVariantIds.length!==actualVariantIds.length||!same(expectedVariantIds,actualVariantIds))fail(`Variant evidence does not exactly match showcase labels: ${entry.id}`);
  for(const variant of entry.variants){
    if(variant.id!==normalize(variant.label))fail(`Variant id/label normalization drifted: ${entry.id}:${variant.id}`);
    if(variant.proofKind==='rendered')renderedVariants++;
    else if(variant.proofKind==='canonical-state')stateBackedVariants++;
    else if(variant.proofKind==='responsive-backed')responsiveBackedVariants++;
    else if(variant.proofKind==='interaction-backed')interactionBackedVariants++;
    else if(variant.proofKind==='action-backed')actionBackedVariants++;
    else fail(`Unknown proof kind in combined System evidence: ${entry.id}:${variant.id}`);
    totalVariants++;
  }
}
if(totalVariants!==117||renderedVariants!==67||stateBackedVariants!==42||responsiveBackedVariants!==4||interactionBackedVariants!==2||actionBackedVariants!==2)fail(`Combined System evidence must contain 117 variants · 67 rendered / 42 canonical-state-backed / 4 responsive-backed / 2 interaction-backed / 2 action-backed; got ${totalVariants} · ${renderedVariants}/${stateBackedVariants}/${responsiveBackedVariants}/${interactionBackedVariants}/${actionBackedVariants}`);

const systemById=new Map(system.components.map(entry=>[entry.id,new Map(entry.variants.map(variant=>[variant.id,variant]))]));
for(const entry of system.components){
  for(const variant of entry.variants){
    if(variant.proofKind==='rendered'){
      if(typeof variant.markup!=='string'||!variant.markup.includes(`data-variant-sample="${entry.id}:${variant.id}"`))fail(`Rendered System variant lacks exact sample identity: ${entry.id}:${variant.id}`);
      if(/<script\b|\son[a-z]+\s*=/i.test(variant.markup))fail(`Rendered System evidence must remain declarative: ${entry.id}:${variant.id}`);
    }
  }
}

for(const [variantId,marker] of [['model','ProductView'],['action','cart.add'],['state','ready']]){
  const markup=systemById.get('component-contract')?.get(variantId)?.markup||'';
  if(!markup.includes(marker))fail(`Component-contract ${variantId} proof lost frozen exemplar ${marker}`);
}
if(!contractTypes.includes('export interface ProductView')||!contractTypes.includes("export type CheckoutState='ready'|'processing'|'failed'|'recovered';"))fail('Component-contract model/state exemplar authority drifted');
if(!(components.canonicalActions||[]).includes('cart.add'))fail('Component-contract action exemplar must remain canonical cart.add');
for(const marker of ["case 'component-contract'",'ProductView','cart.add','Explicit taxonomy'])if(!explorer.includes(marker))fail(`Component-contract live explorer anatomy missing marker: ${marker}`);

const tokenVariants=systemById.get('tokens');
for(const marker of ['--nbc-yellow','--nbc-coral','--nbc-lime','--nbc-sky'])if(!tokenVariants?.get('semantic-colors')?.markup.includes(marker)||!tokenCss.includes(marker))fail(`Semantic token proof lost shipping token: ${marker}`);
for(const [variantId,markers] of [['depth',['--nbc-depth','6px']],['press',['--nbc-press-hover','3px','--nbc-press-active','6px']]])for(const marker of markers)if(!tokenVariants?.get(variantId)?.markup.includes(marker)||!tokenCss.includes(marker))fail(`Token ${variantId} proof lost exact shipping marker: ${marker}`);
for(const marker of ["case 'tokens'",'--nbc-depth','--nbc-press-hover'])if(!explorer.includes(marker))fail(`Tokens live explorer anatomy missing marker: ${marker}`);

const systemStates=systemById.get('system-states');
for(const stateId of ['empty','loading','error','offline','permission','unsupported']){
  const variant=systemStates?.get(stateId);
  if(variant?.proofKind!=='canonical-state'||variant.stateId!==stateId||!stateById.get('system-states')?.has(stateId))fail(`System-states proof must reuse exact canonical state: ${stateId}`);
}
if(!statefulImplementation.components.some(component=>component.id==='system-states'&&component.copyReady?.js.includes("['empty','loading','error','offline','permission','unsupported']")))fail('System-states proof lost source-backed six-state implementation authority');

if(!contractTypes.includes("export type OwnershipState='active'|'grace'|'expired'|'cancelled'|'refunded';"))fail('Ownership lifecycle frozen OwnershipState taxonomy drifted');
const lifecycle=systemById.get('ownership-lifecycle');
for(const stateId of ['active','grace','expired','cancelled','refunded']){
  const variant=lifecycle?.get(stateId);
  if(variant?.proofKind!=='rendered'||!variant.markup.includes(`data-state="${stateId}"`)||!variant.markup.includes('related records remain separate'))fail(`Ownership-lifecycle proof must render exact normalized state without conflating records: ${stateId}`);
}
const lifecycleContract=frozenById.get('ownership-lifecycle');
if(!same(lifecycleContract?.models||[],['LicenseView','SubscriptionView','OwnershipEventView']))fail('Ownership-lifecycle frozen model boundary drifted');
if(!accountImplementation.components.some(component=>component.id==='ownership-lifecycle'&&component.copyReady?.html.includes('Do not infer one lifecycle record from another.')))fail('Ownership-lifecycle proof lost implementation separation guardrail');

for(const marker of ['component-variant-evidence-account.json','VARIANT_EVIDENCE_FILES','mergeVariantManifests'])if(!baseRuntime.includes(marker))fail(`Certified base + Account runtime marker drifted: ${marker}`);
for(const marker of ['component-variant-evidence-system.json','componentVariantSystemReady','componentDepthAccountReady','system-foundation','42','117'])if(!systemRuntime.includes(marker))fail(`System additive runtime missing marker: ${marker}`);
if(!explorerHtml.includes('./component-variant-evidence-system.js'))fail('Components explorer must load additive System variant runtime');
for(const marker of ['42','117','67','component-contract','tokens','system-states','ownership-lifecycle','invoice-details','purchase-history-row','invoice-history','activation-row','seat-assignment','AxeBuilder'])if(!browser.includes(marker))fail(`System variant Browser QA missing marker: ${marker}`);
for(const marker of ['System + foundation variant evidence','42 / 47','117 authoritative variants','67 rendered','42 canonical-state-backed','4 responsive-backed','2 interaction-backed','2 action-backed','component-contract','tokens','system-states','ownership-lifecycle','invoice-details','purchase-history-row','invoice-history','activation-row','seat-assignment'])if(!report.includes(marker))fail(`System variant evidence report missing marker: ${marker}`);
const systemCommand=packageManifest.scripts?.['check:system-variants']||'';
if(!systemCommand.includes('component-variant-evidence-system-check.mjs')||!systemCommand.includes('component-demo-depth-system-check.mjs'))fail('package.json must expose both System variant static checks');
if(!(packageManifest.scripts?.check||'').includes('check:system-variants'))fail('npm run check must include check:system-variants');

console.log('System variant evidence passed · 4 components · 17 variants · combined 42/47 components / 117 variants · 67 rendered / 42 canonical-state-backed / 4 responsive-backed / 2 interaction-backed / 2 action-backed · exact five residual components remain partial');
