import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const normalize=value=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const count=(value,needle)=>(value.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;

const base=json('storefront/component-variant-evidence.json');
const account=json('storefront/component-variant-evidence-account.json');
const showcase=json('storefront/component-showcase.json');
const components=json('storefront/components.json');
const states=json('storefront/component-states.json');
const accountImplementation=json('storefront/component-demo-implementation-account-ownership.json');
const statefulImplementation=json('storefront/component-demo-implementation.json');
const contractTypes=read('src/contracts/index.d.ts');
const accountCss=read('src/components/account.css');
const licenseCss=read('src/components/license.css');
const lifecycleCss=read('src/components/lifecycle.css');
const runtime=read('component-variant-evidence.js');
const browser=read('tests/component-variant-evidence-account-v11.spec.mjs');

for(const manifest of [base,account]){
  if(manifest.schema!=='neobrutal-commerce/component-variant-evidence@4'||manifest.showcaseVersion!=='1.1.0'||manifest.commerceVersion!=='1.0.0'||manifest.role!=='variant-evidence-only')fail('Account variant evidence shard version/schema/role drifted');
  for(const kind of ['rendered','canonical-state','responsive-backed','interaction-backed','action-backed'])if(!manifest.proofKinds?.[kind])fail(`Account variant evidence must preserve ${kind} proof kind`);
}
if(JSON.stringify(account.proofKinds)!==JSON.stringify(base.proofKinds))fail('Account variant evidence proof-kind contract drifted from the certified baseline');

const expectedAccountIds=['account-nav','download-row','license-card','license-status','update-eligibility','renewal-state','plan-change','ownership-transfer','subscription-management','ownership-timeline'];
const excludedAccountIds=['purchase-history-row','invoice-history','activation-row','seat-assignment'];
if(account.batches?.length!==1)fail('Account variant evidence must contain exactly one provenance batch');
const batch=account.batches[0];
if(batch.id!=='account-ownership'||batch.ordinal!==5||batch.label!=='Account + ownership'||!same(batch.componentIds||[],expectedAccountIds))fail('Account variant evidence batch provenance drifted');
const accountIds=account.components?.map(entry=>entry.id)||[];
if(accountIds.length!==10||new Set(accountIds).size!==10||!same(accountIds,expectedAccountIds))fail('Account variant evidence must cover the exact ten source-consistent Account + ownership components');
for(const id of excludedAccountIds)if(accountIds.includes(id))fail(`Account variant evidence must keep source-mismatched component partial: ${id}`);

const manifests=[base,account];
const batches=manifests.flatMap(manifest=>manifest.batches||[]);
const evidenceComponents=manifests.flatMap(manifest=>manifest.components||[]);
const batchIds=batches.map(item=>item.id);
const batchedIds=batches.flatMap(item=>item.componentIds||[]);
const componentIds=evidenceComponents.map(item=>item.id);
if(batches.length!==5||batches.map(item=>item.ordinal).join(',')!=='1,2,3,4,5'||new Set(batchIds).size!==5)fail('Combined variant evidence must preserve ordered batches 1 through 5');
if(componentIds.length!==38||new Set(componentIds).size!==38||batchedIds.length!==38||new Set(batchedIds).size!==38||!same(componentIds,batchedIds))fail('Combined variant evidence must cover 38 unique component IDs with non-overlapping provenance');

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
  const frozen=frozenById.get(entry.id);
  const authority=showcaseById.get(entry.id);
  if(!frozen||!authority)fail(`Combined variant evidence references unknown component authority: ${entry.id}`);
  const expectedVariantIds=(authority.variants||[]).map(normalize);
  const actualVariantIds=(entry.variants||[]).map(variant=>variant.id);
  if(!same(expectedVariantIds,actualVariantIds)||expectedVariantIds.length!==actualVariantIds.length)fail(`Variant evidence does not exactly match showcase labels: ${entry.id}`);
  for(const variant of entry.variants){
    if(variant.id!==normalize(variant.label))fail(`Variant id/label normalization drifted: ${entry.id}:${variant.id}`);
    if(variant.proofKind==='rendered'){
      if(typeof variant.markup!=='string'||!variant.markup.includes(`data-variant-sample="${entry.id}:${variant.id}"`))fail(`Rendered Account variant lacks exact sample identity: ${entry.id}:${variant.id}`);
      if(/<script\b|\son[a-z]+\s*=/i.test(variant.markup))fail(`Rendered Account evidence must remain declarative: ${entry.id}:${variant.id}`);
      renderedVariants++;
    }else if(variant.proofKind==='canonical-state'){
      if(normalize(variant.stateId)!==variant.id)fail(`Canonical Account variant must normalize to its exact state ID: ${entry.id}:${variant.id}:${variant.stateId}`);
      if(!stateById.get(entry.id)?.has(variant.stateId))fail(`Canonical Account variant references unknown state: ${entry.id}:${variant.stateId}`);
      stateBackedVariants++;
    }else if(variant.proofKind==='responsive-backed')responsiveBackedVariants++;
    else if(variant.proofKind==='interaction-backed')interactionBackedVariants++;
    else if(variant.proofKind==='action-backed'){
      if(!frozen.actions.includes(variant.actionId)||!frozen.models.includes(variant.resultModel))fail(`Action-backed Account proof escapes frozen component contract: ${entry.id}:${variant.id}`);
      if(!Array.isArray(variant.selectors)||!variant.selectors.length)fail(`Action-backed Account proof requires live selectors: ${entry.id}:${variant.id}`);
      actionBackedVariants++;
    }else fail(`Unknown proof kind in combined Account evidence: ${entry.id}:${variant.id}`);
    totalVariants++;
  }
}
if(totalVariants!==100||renderedVariants!==56||stateBackedVariants!==36||responsiveBackedVariants!==4||interactionBackedVariants!==2||actionBackedVariants!==2)fail(`Combined variant evidence must contain 100 variants · 56 rendered / 36 canonical-state-backed / 4 responsive-backed / 2 interaction-backed / 2 action-backed; got ${totalVariants} · ${renderedVariants}/${stateBackedVariants}/${responsiveBackedVariants}/${interactionBackedVariants}/${actionBackedVariants}`);

const accountById=new Map(account.components.map(entry=>[entry.id,new Map(entry.variants.map(variant=>[variant.id,variant]))]));
const rendered=(component,variant)=>accountById.get(component)?.get(variant)?.markup||'';
const proof=(component,variant)=>accountById.get(component)?.get(variant);

const navCurrent=rendered('account-nav','current');
const navInactive=rendered('account-nav','inactive');
if(!navCurrent.includes('<nav')||!navCurrent.includes('<a ')||!navCurrent.includes('aria-current="page"'))fail('Account-nav current proof must use real navigation links and aria-current');
if(navInactive.includes('aria-current='))fail('Account-nav inactive proof must not falsely expose current location');
if(!accountCss.includes('.nbc-account-nav')||!accountCss.includes('.nbc-account-tab'))fail('Account-nav proof lost shipping account anatomy');

const downloadEligible=rendered('download-row','eligible');
const downloadUnavailable=rendered('download-row','unavailable');
if(!downloadEligible.includes('nbc-download-row')||downloadEligible.includes(' disabled'))fail('Download-row eligible proof must expose an available action');
if(!downloadUnavailable.includes('nbc-download-row')||!downloadUnavailable.includes(' disabled')||!downloadUnavailable.toLowerCase().includes('normalized entitlement'))fail('Download-row unavailable proof must visibly disable access and preserve entitlement authority');
if(!accountImplementation.components.some(component=>component.id==='download-row')||!frozenById.get('download-row')?.models.includes('EntitlementView')||!frozenById.get('download-row')?.actions.includes('download.create'))fail('Download-row evidence must remain backed by EntitlementView + download.create');

const activeLicense=rendered('license-card','active');
const limitedLicense=rendered('license-card','limited');
const expiredLicense=rendered('license-card','expired-context');
for(const markup of [activeLicense,limitedLicense,expiredLicense])for(const marker of ['nbc-license-card','nbc-license-head','nbc-license-key','nbc-license-grid'])if(!markup.includes(marker))fail(`License-card rendered proof missing shipping anatomy: ${marker}`);
if(!activeLicense.includes('3 / 5')||!activeLicense.includes('4 / 5')||!activeLicense.includes('>Active<'))fail('License-card active proof must expose supplied scope and active status');
if(!limitedLicense.includes('5 / 5')||!limitedLicense.toLowerCase().includes('capacity'))fail('License-card limited proof must derive limitation from normalized capacity/usage, not invent a lifecycle state');
if(!expiredLicense.includes('nbc-license-status--expired')||!expiredLicense.includes('Review renewal eligibility'))fail('License-card expired-context proof must expose expired consequence and recovery context');
if(!licenseCss.includes('.nbc-license-card')||!licenseCss.includes('.nbc-license-grid'))fail('License-card variant evidence lost shipping license CSS authority');

for(const [id,statesForComponent] of Object.entries({
  'license-status':['active','grace','expired','cancelled','refunded'],
  'update-eligibility':['active','grace','expired'],
  'renewal-state':['active','grace','expired','cancelled','past_due'],
  'plan-change':['ready','quoted','processing','complete','failed'],
  'ownership-transfer':['ready','processing','complete','failed'],
  'subscription-management':['active','cancel_at_period_end','cancelled','past_due']
})){
  for(const stateId of statesForComponent){
    const variant=proof(id,normalize(stateId));
    if(variant?.proofKind!=='canonical-state'||variant.stateId!==stateId)fail(`Account canonical variant must reference exact frozen state: ${id}:${stateId}`);
  }
}
if(!statefulImplementation.components.some(component=>component.id==='plan-change')||!statefulImplementation.components.some(component=>component.id==='ownership-transfer')||!statefulImplementation.components.some(component=>component.id==='subscription-management'))fail('Stateful Account variant evidence lost implementation provenance');
if(!lifecycleCss.includes('data-state="cancel_at_period_end"')||!lifecycleCss.includes('data-state="past_due"'))fail('Stateful Account variant evidence lost shipping lifecycle styling');

const pending=proof('ownership-transfer','pending-invitation');
if(pending?.proofKind!=='action-backed'||pending.actionId!=='license.transfer.create'||pending.resultModel!=='OwnershipTransferView')fail('Pending invitation must remain action-backed by license.transfer.create + OwnershipTransferView');
if(!contractTypes.includes("export type TransferStatus='pending'|'accepted'|'cancelled'|'expired';"))fail('OwnershipTransferView pending-result authority drifted');
const transferImplementation=statefulImplementation.components.find(component=>component.id==='ownership-transfer');
if(!transferImplementation?.copyReady?.js.includes("license.transfer.create")||!transferImplementation?.copyReady?.html.includes('pending invitation does not mean ownership moved'))fail('Pending invitation proof must preserve invitation-not-ownership semantic guardrail');

const timeline=rendered('ownership-timeline','chronological-event-list');
if(!timeline.includes('<ol class="nbc-timeline"')||count(timeline,'<li>')<2||!timeline.includes('Provider-returned event'))fail('Ownership timeline proof must use shipping chronological-list anatomy with provider-returned event provenance');
if(!accountImplementation.components.some(component=>component.id==='ownership-timeline')||!frozenById.get('ownership-timeline')?.models.includes('OwnershipEventView')||!frozenById.get('ownership-timeline')?.actions.includes('license.history.list'))fail('Ownership timeline proof must remain backed by OwnershipEventView + license.history.list');

const purchase=frozenById.get('purchase-history-row');
const invoices=frozenById.get('invoice-history');
const activation=frozenById.get('activation-row');
const seats=frozenById.get('seat-assignment');
if(!purchase?.models.includes('OrderView')||!contractTypes.includes("export type OrderStatus='pending'|'complete'|'failed'|'cancelled'|'refunded';"))fail('Purchase-history exclusion authority drifted');
if(!invoices?.models.includes('InvoiceView')||!contractTypes.includes("export type InvoiceStatus='paid'|'refunded'|'void';"))fail('Invoice-history exclusion authority drifted');
if(activation?.actions.some(action=>/remove|deactivate/i.test(action)))fail('Activation-row exclusion should be revisited because a removal action now exists');
if(seats?.models.includes('LicenseView')||seats?.models.includes('LicenseCapacity'))fail('Seat-assignment exclusion should be revisited because capacity authority now exists');

for(const marker of ['component-variant-evidence-account.json','mergeVariantManifests','VARIANT_EVIDENCE_FILES'])if(!runtime.includes(marker))fail(`Variant runtime missing Account evidence aggregation marker: ${marker}`);
for(const marker of ['38','100','56','36','account-nav','download-row','license-card','license-status','update-eligibility','renewal-state','plan-change','ownership-transfer','subscription-management','ownership-timeline','pending-invitation','license.transfer.create','OwnershipTransferView','AxeBuilder'])if(!browser.includes(marker))fail(`Account variant Browser QA missing marker: ${marker}`);

console.log('Account variant evidence passed · 10 components · 35 variants · combined 38/47 components / 100 variants · 56 rendered / 36 canonical-state-backed / 4 responsive-backed / 2 interaction-backed / 2 action-backed · 4 Account source mismatches remain partial');
