import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const same=(a,b)=>[...a].sort().join(',')===[...b].sort().join(',');
const required=[
  'AGENTS.md','LLMS.md','COMPONENTS.md',
  'docs/ADOPTION.md','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md',
  'docs/RECIPES.md','docs/THEMING.md','docs/MIGRATION.md','docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md','docs/PUBLIC-RELEASE.md',
  'docs/V1.1-COMPONENT-DEMO-DEPTH-AUDIT.md','docs/V1.1-ACCOUNT-VARIANT-EVIDENCE.md',
  'storefront/components.json','storefront/component-showcase.json','storefront/component-states.json','storefront/component-demo-depth.json','storefront/component-demo-depth-account.json','storefront/component-variant-evidence.json','storefront/component-variant-evidence-account.json',
  'storefront/component-demo-implementation.json','storefront/component-demo-implementation-product.json','storefront/component-demo-implementation-trust-pricing.json','storefront/component-demo-implementation-cart-checkout.json','storefront/component-demo-implementation-account-ownership.json','storefront/blocks.json',
  'component-depth-audit.js','component-depth-variant-extension.js','component-depth-audit.css','component-variant-evidence.js','component-variant-evidence.css',
  'tests/component-demo-depth-v11.spec.mjs','tests/component-variant-evidence-v11.spec.mjs','tests/component-variant-evidence-account-v11.spec.mjs','scripts/component-demo-implementation-check.mjs','scripts/component-variant-evidence-check.mjs','scripts/component-variant-evidence-account-check.mjs','scripts/component-demo-depth-account-check.mjs'
];
for(const file of required)if(!fs.existsSync(path.join(root,file)))fail(`Missing adoption file: ${file}`);

const manifest=json('storefront/components.json');
const showcase=json('storefront/component-showcase.json');
const stateExamples=json('storefront/component-states.json');
const demoDepth=json('storefront/component-demo-depth.json');
const accountDepthExtension=json('storefront/component-demo-depth-account.json');
const blocks=json('storefront/blocks.json');
const packageManifest=json('package.json');
const routes=json('storefront/routes.json');
const states=json('storefront/states.json');
if(manifest.schema!=='neobrutal-commerce/components@1')fail('Unexpected component registry schema');
if(manifest.commerceVersion!==packageManifest.version)fail(`Component registry version ${manifest.commerceVersion} does not match package ${packageManifest.version}`);
if(!Array.isArray(manifest.components)||manifest.components.length!==47)fail('Frozen component registry must remain exact at 47 components');
const ids=manifest.components.map(component=>component.id);
if(new Set(ids).size!==ids.length)fail('Duplicate component id in storefront/components.json');
const known=new Set(ids);
for(const route of routes.routes)for(const id of route.primaryComponents||[])if(!known.has(id))fail(`Route ${route.path} references undocumented component ${id}`);

if(showcase.schema!=='neobrutal-commerce/component-showcase@1'||showcase.showcaseVersion!=='1.1.0'||showcase.commerceVersion!==packageManifest.version)fail('v1.1 component showcase contract is missing or version-inconsistent');
if(stateExamples.schema!=='neobrutal-commerce/component-states@1'||stateExamples.showcaseVersion!=='1.1.0'||stateExamples.commerceVersion!==packageManifest.version)fail('v1.1 component state showcase contract is missing or version-inconsistent');
if(demoDepth.schema!=='neobrutal-commerce/component-demo-depth@1'||demoDepth.showcaseVersion!=='1.1.0'||demoDepth.commerceVersion!==packageManifest.version||demoDepth.role!=='audit-evidence-only')fail('v1.1 component demo depth audit is missing or version-inconsistent');
if(accountDepthExtension.schema!=='neobrutal-commerce/component-demo-depth-extension@1'||accountDepthExtension.showcaseVersion!=='1.1.0'||accountDepthExtension.commerceVersion!==packageManifest.version||accountDepthExtension.role!=='audit-evidence-extension')fail('v1.1 Account demo depth extension is missing or version-inconsistent');
if(accountDepthExtension.combinedComplete!==38||accountDepthExtension.combinedPartial!==9)fail('v1.1 Account demo depth extension must report 38 complete / 9 partial variants');
if(blocks.schema!=='neobrutal-commerce/blocks@1'||blocks.showcaseVersion!=='1.1.0'||blocks.commerceVersion!==packageManifest.version)fail('v1.1 blocks showcase contract is missing or version-inconsistent');

const canonicalActions=new Set(manifest.canonicalActions||[]);
const actionRuntime=read('src/actions/runtime.js');
for(const action of canonicalActions)if(!actionRuntime.includes(action))fail(`Component registry action is not canonical runtime action: ${action}`);
const canonicalStates=new Set(Object.values(states).flatMap(value=>Array.isArray(value)?value.map(item=>item.id):[]));
for(const component of manifest.components){
  for(const field of ['models','actions','states','agentRules'])if(!Array.isArray(component[field]))fail(`${component.id} missing ${field} array`);
  if(!component.kind||component.agentRules.length===0)fail(`${component.id} missing agent semantics`);
  for(const action of component.actions)if(!canonicalActions.has(action))fail(`${component.id} uses unknown action ${action}`);
  for(const state of component.states)if(!canonicalStates.has(state))fail(`${component.id} uses unknown state ${state}`);
}

const expectedDepthCriteria=['preview','variants','canonical-states','edge-states','themes','devices','interaction','accessibility','tokens','api','actions','copy-ready','llm-usage'];
const allowedDepthStatuses=['complete','partial','missing','not-applicable'];
const depthCriteria=(demoDepth.criteria||[]).map(item=>item.id);
if(JSON.stringify(depthCriteria)!==JSON.stringify(expectedDepthCriteria))fail(`Component demo depth criteria drifted: ${depthCriteria.join(', ')}`);
if(JSON.stringify(demoDepth.statuses)!==JSON.stringify(allowedDepthStatuses))fail('Component demo depth status taxonomy drifted');
for(const criterion of demoDepth.criteria)if(!criterion.label?.trim()||!criterion.evidenceAuthority?.trim())fail(`Component demo depth criterion missing label/evidence authority: ${criterion.id}`);
if(Object.keys(demoDepth.defaultStatus||{}).sort().join(',')!==[...expectedDepthCriteria].sort().join(','))fail('Component demo depth default status must cover every checklist criterion exactly');
for(const [criterion,status] of Object.entries(demoDepth.defaultStatus))if(!allowedDepthStatuses.includes(status))fail(`Component demo depth default uses unknown status: ${criterion}:${status}`);

const depthComponents=demoDepth.components||[];
const depthIds=depthComponents.map(component=>component.id);
if(depthIds.length!==47||new Set(depthIds).size!==47||!same(depthIds,ids))fail('Component demo depth audit must cover the exact frozen 47-component registry');
const manifestById=new Map(manifest.components.map(component=>[component.id,component]));
const resolvedDepth=new Map();
for(const audit of depthComponents){
  const source=manifestById.get(audit.id);
  if(!source)fail(`Component demo depth audit references unknown component: ${audit.id}`);
  const overrides=audit.overrides||{};
  for(const [criterion,status] of Object.entries(overrides)){
    if(!expectedDepthCriteria.includes(criterion))fail(`Component demo depth override uses unknown criterion: ${audit.id}:${criterion}`);
    if(!allowedDepthStatuses.includes(status))fail(`Component demo depth override uses unknown status: ${audit.id}:${criterion}:${status}`);
  }
  const resolved={...demoDepth.defaultStatus,...overrides};
  const expectedStateStatus=source.states.length?'complete':'not-applicable';
  const expectedActionStatus=source.actions.length?'complete':'not-applicable';
  if(resolved['canonical-states']!==expectedStateStatus)fail(`Component demo state applicability drifted: ${audit.id} expected ${expectedStateStatus}`);
  if(resolved.actions!==expectedActionStatus)fail(`Component demo action applicability drifted: ${audit.id} expected ${expectedActionStatus}`);
  resolvedDepth.set(audit.id,resolved);
}

const statefulIds=manifest.components.filter(component=>component.states.length).map(component=>component.id).sort();
const stateExampleIds=(stateExamples.components||[]).map(component=>component.id).sort();
if(!same(statefulIds,stateExampleIds))fail('Component demo depth stateful set drifted from live canonical-state evidence');
const batches=demoDepth.implementationBatches||[];
if(batches.length!==5||batches.map(batch=>batch.ordinal).join(',')!=='1,2,3,4,5')fail('Component demo implementation batch lineage must contain ordered batches 1 through 5');
if(!same(demoDepth.nextImplementationBatch||[],statefulIds)||!same(batches[0].componentIds||[],statefulIds))fail('First component demo depth implementation batch must remain the exact stateful component set');
const implementationIds=batches.flatMap(batch=>batch.componentIds||[]);
if(implementationIds.length!==43||new Set(implementationIds).size!==43)fail('Accumulated implementation evidence batch membership must cover 43 unique components');
for(const file of batches.map(batch=>batch.evidenceFile))if(!required.includes(file))fail(`Implementation batch evidence file is not adoption-required: ${file}`);
const implementationSet=new Set(implementationIds);
for(const [id,resolved] of resolvedDepth){
  const expectedImplementationStatus=implementationSet.has(id)?'complete':'missing';
  if(resolved.tokens!==expectedImplementationStatus||resolved['copy-ready']!==expectedImplementationStatus)fail(`Component implementation evidence status drifted: ${id} expected ${expectedImplementationStatus}`);
}

const depthCounts=Object.fromEntries(expectedDepthCriteria.map(criterion=>[criterion,Object.fromEntries(allowedDepthStatuses.map(status=>[status,0]))]));
for(const resolved of resolvedDepth.values())for(const criterion of expectedDepthCriteria)depthCounts[criterion][resolved[criterion]]++;
if(depthCounts.preview.complete!==47||depthCounts.accessibility.complete!==47)fail('Existing 47/47 preview and accessibility coverage must remain complete');
if(depthCounts.variants.complete!==28||depthCounts.variants.partial!==19)fail('Certified four-batch base variant audit must remain exact at 28 complete / 19 partial before the Account extension is applied');
if(depthCounts['canonical-states'].complete!==12||depthCounts['canonical-states']['not-applicable']!==35)fail('Canonical-state audit must remain 12 complete / 35 not-applicable until the frozen registry changes');
if(depthCounts.actions.complete!==16||depthCounts.actions['not-applicable']!==31)fail('Action-contract audit must remain 16 complete / 31 not-applicable until the frozen registry changes');
if(depthCounts.tokens.complete!==43||depthCounts.tokens.missing!==4||depthCounts['copy-ready'].complete!==43||depthCounts['copy-ready'].missing!==4)fail('Accumulated demo implementation evidence must remain exact at 43 complete / 4 missing for token and copy-ready criteria');

const depthClient=read('component-depth-audit.js');
const depthExtensionClient=read('component-depth-variant-extension.js');
const depthCss=read('component-depth-audit.css');
const depthBrowser=read('tests/component-demo-depth-v11.spec.mjs');
const variantBrowser=read('tests/component-variant-evidence-v11.spec.mjs');
const accountVariantBrowser=read('tests/component-variant-evidence-account-v11.spec.mjs');
try{new Function(depthClient)}catch(error){fail(`component-depth-audit.js syntax error: ${error.message}`)}
try{new Function(depthExtensionClient)}catch(error){fail(`component-depth-variant-extension.js syntax error: ${error.message}`)}
if(/transition\s*:\s*all/i.test(depthCss)||/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(depthCss))fail('Component demo depth UI violates motion/tactile laws');
for(const marker of ['component-demo-depth.json','implementationBatches','data-component-depth-audit','dataset.componentDepthReady','dataset.componentImplementationAudited','dataset.componentImplementationBatches','data-demo-depth-first-batch'])if(!depthClient.includes(marker))fail(`Component demo depth runtime missing marker: ${marker}`);
for(const marker of ['component-demo-depth-account.json','componentDepthAccountReady','componentDepthVariantComplete','componentDepthVariantPartial','All variants'])if(!depthExtensionClient.includes(marker))fail(`Component depth extension runtime missing marker: ${marker}`);
for(const marker of ['47*13','data-demo-depth-first-batch','data-demo-depth-batch','Canonical states','Action contracts','Design tokens used','Copy-ready HTML / CSS / JS','AxeBuilder','43','trust-review-pricing','cart-checkout','account-ownership'])if(!depthBrowser.includes(marker))fail(`Component demo depth Browser QA missing marker: ${marker}`);
for(const marker of ['100','56','36','4','2','data-component-variant-evidence','data-variant-choice','data-variant-current','data-variant-state-ref','data-variant-responsive-ref','data-variant-interaction-ref','data-variant-action-ref','data-responsive-mode','data-responsive-viewport','data-showcase-state','data-media-state','AxeBuilder','aria-pressed','product-card','trust-strip','promo-band','badge','price-block','product-detail','product-gallery','product-media','review-summary','testimonials','guarantee','license-selector','renewal-note','pricing-tier','plan-comparison','bundle-builder','cart-item','order-summary','coupon','checkout-field','checkout-steps','payment-method','payment-failure','payment-recovery','processing-state','order-confirmation','receipt','download-entitlement'])if(!variantBrowser.includes(marker))fail(`Component variant evidence Browser QA missing marker: ${marker}`);
for(const marker of ['38','100','56','36','account-nav','download-row','license-card','license-status','update-eligibility','renewal-state','plan-change','ownership-transfer','subscription-management','ownership-timeline','purchase-history-row','invoice-history','activation-row','seat-assignment','pending-invitation','license.transfer.create','OwnershipTransferView','AxeBuilder'])if(!accountVariantBrowser.includes(marker))fail(`Account variant evidence Browser QA missing marker: ${marker}`);
const explorerHtml=read('components.html');
for(const marker of ['./component-depth-audit.css','./component-depth-audit.js','./component-depth-variant-extension.js','./component-variant-evidence.css','./component-variant-evidence.js','demo-depth audit'])if(!explorerHtml.includes(marker))fail(`components.html missing component demo depth marker: ${marker}`);

const componentsDoc=read('COMPONENTS.md');
const documentedBlockCount=`${blocks.blocks.length} / ${blocks.blocks.length}`;
for(const marker of ['Showcase v1.1 / Commerce v1.0','47 / 47',documentedBlockCount,'42 / 42','storefront/component-showcase.json','storefront/component-states.json','storefront/blocks.json','scripts/showcase-check.mjs'])if(!componentsDoc.includes(marker))fail(`COMPONENTS.md missing v1.1 showcase marker: ${marker}`);
for(const block of blocks.blocks)if(!componentsDoc.includes(`\`${block.id}\``))fail(`COMPONENTS.md missing current Block id: ${block.id}`);

const depthDoc=read('docs/V1.1-COMPONENT-DEMO-DEPTH-AUDIT.md');
for(const marker of ['v1.1 Component demo depth audit','audit evidence only','47','12','43','4','28','All variants','19','65','48','10','4','2','1','canonical-state','responsive-backed','interaction-backed','action-backed','Design tokens used','Copy-ready HTML / CSS / JS','First implementation-depth batch','Second implementation-depth batch','Third implementation-depth batch','Fourth implementation-depth batch','Fifth implementation-depth batch','First variant-evidence batch','Second variant-evidence batch','Third variant-evidence batch','Fourth variant-evidence batch','Product + trust','Pricing','Cart + checkout','contained-scroll','result-feedback','download.create','SignedDownloadView','invoice-details','storefront/component-demo-depth.json','storefront/component-variant-evidence.json','storefront/component-demo-implementation.json','storefront/component-demo-implementation-product.json','storefront/component-demo-implementation-trust-pricing.json','storefront/component-demo-implementation-cart-checkout.json','storefront/component-demo-implementation-account-ownership.json'])if(!depthDoc.includes(marker))fail(`Component demo depth audit doc missing marker: ${marker}`);
for(const batch of batches)for(const id of batch.componentIds)if(!depthDoc.includes(`\`${id}\``))fail(`Component demo depth audit doc missing batch component: ${id}`);

const accountVariantDoc=read('docs/V1.1-ACCOUNT-VARIANT-EVIDENCE.md');
for(const marker of ['Account + ownership variant evidence','38 / 47','100 authoritative variants','56 rendered','36 canonical-state-backed','4 responsive-backed','2 interaction-backed','2 action-backed','storefront/component-variant-evidence-account.json','storefront/component-demo-depth-account.json','account-nav','download-row','license-card','license-status','update-eligibility','renewal-state','plan-change','ownership-transfer','subscription-management','ownership-timeline','purchase-history-row','invoice-history','activation-row','seat-assignment','pending invitation','license.transfer.create','OwnershipTransferView','past_due','cancel_at_period_end'])if(!accountVariantDoc.includes(marker))fail(`Account variant evidence report missing marker: ${marker}`);

const agents=read('AGENTS.md');
for(const marker of ['storefront/components.json','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md','Read before write','Do not guess'])if(!agents.includes(marker))fail(`AGENTS.md missing adoption marker: ${marker}`);
const adoption=read('docs/ADOPTION.md');
for(const marker of ['normalized runtime','capability','data-theme','npm run check'])if(!adoption.includes(marker))fail(`ADOPTION.md missing marker: ${marker}`);
const playbook=read('docs/AGENT-PLAYBOOK.md');
for(const marker of ['Read before write','Do not guess','Validation loop','storefront/routes.json'])if(!playbook.includes(marker))fail(`AGENT-PLAYBOOK.md missing marker: ${marker}`);
const notes=read('docs/AI-COMPONENT-NOTES.md');
for(const marker of ['product-media','checkout','plan-change','ownership-transfer','subscription-management','system-states'])if(!notes.includes(marker))fail(`AI-COMPONENT-NOTES.md missing marker: ${marker}`);
const recipes=read('docs/RECIPES.md');
for(const marker of ['createReferenceRuntime','createProductCardSpec','bindCommerceActions','createReactActionBindings','createEddCommerceAdapter','createLicensingBridgeAdapter'])if(!recipes.includes(marker))fail(`RECIPES.md missing marker: ${marker}`);
const theming=read('docs/THEMING.md');
for(const marker of ['--nbc-bg','--nbc-depth','--nbc-space-7','--nbc-text-display','forced-colors'])if(!theming.includes(marker))fail(`THEMING.md missing marker: ${marker}`);
const migration=read('docs/MIGRATION.md');
for(const marker of ['v0.5 → v0.6','v0.6 → v0.7','v0.7 → v0.8','v0.8 → v0.9','v0.9.0-rc.1 → v1.0.0','storefront/components.json','npm run test:browser'])if(!migration.includes(marker))fail(`MIGRATION.md missing marker: ${marker}`);
const providers=read('docs/PROVIDER-EXAMPLES.md');
for(const marker of ['createEddCommerceAdapter','createLicensingBridgeAdapter','capabilities','normalize','cancel_at_period_end'])if(!providers.includes(marker))fail(`PROVIDER-EXAMPLES.md missing marker: ${marker}`);

await import('./component-demo-implementation-check.mjs');
await import('./component-variant-evidence-check.mjs');
const documentedStates=stateExamples.components.reduce((sum,component)=>sum+component.states.length,0);
console.log(`NeoBrutal Commerce v1.0 adoption docs + Showcase v1.1 passed · ${manifest.components.length} components · ${blocks.blocks.length} blocks · ${documentedStates} live states · ${routes.routes.length} production routes · component demo depth audit ${depthComponents.length}/${manifest.components.length} · implementation evidence ${implementationIds.length}/47 · certified base variant evidence 28/47 · Account extension ${accountDepthExtension.combinedComplete}/47`);