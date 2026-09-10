import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const required=[
  'AGENTS.md','LLMS.md','COMPONENTS.md',
  'docs/ADOPTION.md','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md',
  'docs/RECIPES.md','docs/THEMING.md','docs/MIGRATION.md','docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md','docs/PUBLIC-RELEASE.md',
  'docs/V1.1-COMPONENT-DEMO-DEPTH-AUDIT.md',
  'storefront/components.json','storefront/component-showcase.json','storefront/component-states.json','storefront/component-demo-depth.json','storefront/blocks.json',
  'component-depth-audit.js','component-depth-audit.css','tests/component-demo-depth-v11.spec.mjs'
];
for(const file of required){if(!fs.existsSync(path.join(root,file))){console.error(`Missing adoption file: ${file}`);process.exit(1);}}

const manifest=json('storefront/components.json');
const showcase=json('storefront/component-showcase.json');
const stateExamples=json('storefront/component-states.json');
const demoDepth=json('storefront/component-demo-depth.json');
const blocks=json('storefront/blocks.json');
const packageManifest=json('package.json');
const routes=json('storefront/routes.json');
const states=json('storefront/states.json');
if(manifest.schema!=='neobrutal-commerce/components@1'){console.error('Unexpected component registry schema');process.exit(1);}
if(manifest.commerceVersion!==packageManifest.version){console.error(`Component registry version ${manifest.commerceVersion} does not match package ${packageManifest.version}`);process.exit(1);}
if(!Array.isArray(manifest.components)||manifest.components.length<40){console.error('Component registry is incomplete');process.exit(1);}
const ids=manifest.components.map(component=>component.id);
if(new Set(ids).size!==ids.length){console.error('Duplicate component id in storefront/components.json');process.exit(1);}
const known=new Set(ids);
for(const route of routes.routes){for(const id of route.primaryComponents||[]){if(!known.has(id)){console.error(`Route ${route.path} references undocumented component ${id}`);process.exit(1);}}}

if(showcase.schema!=='neobrutal-commerce/component-showcase@1'||showcase.showcaseVersion!=='1.1.0'||showcase.commerceVersion!==packageManifest.version){console.error('v1.1 component showcase contract is missing or version-inconsistent');process.exit(1);}
if(stateExamples.schema!=='neobrutal-commerce/component-states@1'||stateExamples.showcaseVersion!=='1.1.0'||stateExamples.commerceVersion!==packageManifest.version){console.error('v1.1 component state showcase contract is missing or version-inconsistent');process.exit(1);}
if(demoDepth.schema!=='neobrutal-commerce/component-demo-depth@1'||demoDepth.showcaseVersion!=='1.1.0'||demoDepth.commerceVersion!==packageManifest.version||demoDepth.role!=='audit-evidence-only'){console.error('v1.1 component demo depth audit is missing or version-inconsistent');process.exit(1);}
if(blocks.schema!=='neobrutal-commerce/blocks@1'||blocks.showcaseVersion!=='1.1.0'||blocks.commerceVersion!==packageManifest.version){console.error('v1.1 blocks showcase contract is missing or version-inconsistent');process.exit(1);}

const canonicalActions=new Set(manifest.canonicalActions||[]);
const actionRuntime=read('src/actions/runtime.js');
for(const action of canonicalActions){if(!actionRuntime.includes(action)){console.error(`Component registry action is not canonical runtime action: ${action}`);process.exit(1);}}
const canonicalStates=new Set(Object.values(states).flatMap(value=>Array.isArray(value)?value.map(item=>item.id):[]));
for(const component of manifest.components){
  for(const field of ['models','actions','states','agentRules']){if(!Array.isArray(component[field])){console.error(`${component.id} missing ${field} array`);process.exit(1);}}
  if(!component.kind||component.agentRules.length===0){console.error(`${component.id} missing agent semantics`);process.exit(1);}
  for(const action of component.actions){if(!canonicalActions.has(action)){console.error(`${component.id} uses unknown action ${action}`);process.exit(1);}}
  for(const state of component.states){if(!canonicalStates.has(state)){console.error(`${component.id} uses unknown state ${state}`);process.exit(1);}}
}

const expectedDepthCriteria=['preview','variants','canonical-states','edge-states','themes','devices','interaction','accessibility','tokens','api','actions','copy-ready','llm-usage'];
const allowedDepthStatuses=['complete','partial','missing','not-applicable'];
const depthCriteria=(demoDepth.criteria||[]).map(item=>item.id);
if(JSON.stringify(depthCriteria)!==JSON.stringify(expectedDepthCriteria)){console.error(`Component demo depth criteria drifted: ${depthCriteria.join(', ')}`);process.exit(1);}
if(JSON.stringify(demoDepth.statuses)!==JSON.stringify(allowedDepthStatuses)){console.error('Component demo depth status taxonomy drifted');process.exit(1);}
for(const criterion of demoDepth.criteria){if(!criterion.label?.trim()||!criterion.evidenceAuthority?.trim()){console.error(`Component demo depth criterion missing label/evidence authority: ${criterion.id}`);process.exit(1);}}
if(Object.keys(demoDepth.defaultStatus||{}).sort().join(',')!==[...expectedDepthCriteria].sort().join(',')){console.error('Component demo depth default status must cover every checklist criterion exactly');process.exit(1);}
for(const [criterion,status] of Object.entries(demoDepth.defaultStatus)){if(!allowedDepthStatuses.includes(status)){console.error(`Component demo depth default uses unknown status: ${criterion}:${status}`);process.exit(1);}}
const depthComponents=demoDepth.components||[];
const depthIds=depthComponents.map(component=>component.id);
if(depthIds.length!==ids.length||new Set(depthIds).size!==depthIds.length||[...depthIds].sort().join(',')!==[...ids].sort().join(',')){console.error('Component demo depth audit must cover the exact frozen 47-component registry');process.exit(1);}
const manifestById=new Map(manifest.components.map(component=>[component.id,component]));
const resolvedDepth=new Map();
for(const audit of depthComponents){
  const source=manifestById.get(audit.id);
  if(!source){console.error(`Component demo depth audit references unknown component: ${audit.id}`);process.exit(1);}
  const overrides=audit.overrides||{};
  for(const [criterion,status] of Object.entries(overrides)){
    if(!expectedDepthCriteria.includes(criterion)){console.error(`Component demo depth override uses unknown criterion: ${audit.id}:${criterion}`);process.exit(1);}
    if(!allowedDepthStatuses.includes(status)){console.error(`Component demo depth override uses unknown status: ${audit.id}:${criterion}:${status}`);process.exit(1);}
  }
  const resolved={...demoDepth.defaultStatus,...overrides};
  const expectedStateStatus=source.states.length?'complete':'not-applicable';
  const expectedActionStatus=source.actions.length?'complete':'not-applicable';
  if(resolved['canonical-states']!==expectedStateStatus){console.error(`Component demo state applicability drifted: ${audit.id} expected ${expectedStateStatus}`);process.exit(1);}
  if(resolved.actions!==expectedActionStatus){console.error(`Component demo action applicability drifted: ${audit.id} expected ${expectedActionStatus}`);process.exit(1);}
  resolvedDepth.set(audit.id,resolved);
}
const statefulIds=manifest.components.filter(component=>component.states.length).map(component=>component.id).sort();
const stateExampleIds=(stateExamples.components||[]).map(component=>component.id).sort();
if(statefulIds.join(',')!==stateExampleIds.join(',')){console.error('Component demo depth stateful set drifted from live canonical-state evidence');process.exit(1);}
if([...(demoDepth.nextImplementationBatch||[])].sort().join(',')!==statefulIds.join(',')){console.error('First component demo depth implementation batch must equal the exact stateful component set');process.exit(1);}
const depthCounts=Object.fromEntries(expectedDepthCriteria.map(criterion=>[criterion,Object.fromEntries(allowedDepthStatuses.map(status=>[status,0]))]));
for(const resolved of resolvedDepth.values())for(const criterion of expectedDepthCriteria)depthCounts[criterion][resolved[criterion]]++;
if(depthCounts.preview.complete!==47||depthCounts.accessibility.complete!==47){console.error('Existing 47/47 preview and accessibility coverage must remain complete');process.exit(1);}
if(depthCounts['canonical-states'].complete!==12||depthCounts['canonical-states']['not-applicable']!==35){console.error('Canonical-state audit must remain 12 complete / 35 not-applicable until the frozen registry changes');process.exit(1);}
if(depthCounts.actions.complete!==16||depthCounts.actions['not-applicable']!==31){console.error('Action-contract audit must remain 16 complete / 31 not-applicable until the frozen registry changes');process.exit(1);}
if(depthCounts.tokens.missing!==47||depthCounts['copy-ready'].missing!==47){console.error('Audit baseline must not overclaim per-component tokens or copy-ready implementation before evidence ships');process.exit(1);}

const depthClient=read('component-depth-audit.js');
const depthCss=read('component-depth-audit.css');
const depthBrowser=read('tests/component-demo-depth-v11.spec.mjs');
try{new Function(depthClient)}catch(error){console.error(`component-depth-audit.js syntax error: ${error.message}`);process.exit(1);}
if(/transition\s*:\s*all/i.test(depthCss)||/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(depthCss)){console.error('Component demo depth UI violates motion/tactile laws');process.exit(1);}
for(const marker of ['component-demo-depth.json','data-component-depth-audit','dataset.componentDepthReady','dataset.componentDepthAudited','nextImplementationBatch']){if(!depthClient.includes(marker)){console.error(`Component demo depth runtime missing marker: ${marker}`);process.exit(1);}}
for(const marker of ['47*13','data-demo-depth-first-batch','Canonical states','Action contracts','Design tokens used','Copy-ready HTML / CSS / JS','AxeBuilder']){if(!depthBrowser.includes(marker)){console.error(`Component demo depth Browser QA missing marker: ${marker}`);process.exit(1);}}
const explorerHtml=read('components.html');
for(const marker of ['./component-depth-audit.css','./component-depth-audit.js','demo-depth audit']){if(!explorerHtml.includes(marker)){console.error(`components.html missing component demo depth marker: ${marker}`);process.exit(1);}}

const componentsDoc=read('COMPONENTS.md');
const documentedBlockCount=`${blocks.blocks.length} / ${blocks.blocks.length}`;
for(const marker of ['Showcase v1.1 / Commerce v1.0','47 / 47',documentedBlockCount,'42 / 42','storefront/component-showcase.json','storefront/component-states.json','storefront/blocks.json','scripts/showcase-check.mjs']){if(!componentsDoc.includes(marker)){console.error(`COMPONENTS.md missing v1.1 showcase marker: ${marker}`);process.exit(1);}}
for(const block of blocks.blocks){if(!componentsDoc.includes(`\`${block.id}\``)){console.error(`COMPONENTS.md missing current Block id: ${block.id}`);process.exit(1);}}
const depthDoc=read('docs/V1.1-COMPONENT-DEMO-DEPTH-AUDIT.md');
for(const marker of ['v1.1 Component demo depth audit','audit evidence only','47','12','16','Design tokens used','Copy-ready HTML / CSS / JS','First implementation-depth batch','storefront/component-demo-depth.json']){if(!depthDoc.includes(marker)){console.error(`Component demo depth audit doc missing marker: ${marker}`);process.exit(1);}}
for(const id of demoDepth.nextImplementationBatch){if(!depthDoc.includes(`\`${id}\``)){console.error(`Component demo depth audit doc missing first-batch component: ${id}`);process.exit(1);}}
const agents=read('AGENTS.md');
for(const marker of ['storefront/components.json','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md','Read before write','Do not guess']){if(!agents.includes(marker)){console.error(`AGENTS.md missing adoption marker: ${marker}`);process.exit(1);}}
const adoption=read('docs/ADOPTION.md');
for(const marker of ['normalized runtime','capability','data-theme','npm run check']){if(!adoption.includes(marker)){console.error(`ADOPTION.md missing marker: ${marker}`);process.exit(1);}}
const playbook=read('docs/AGENT-PLAYBOOK.md');
for(const marker of ['Read before write','Do not guess','Validation loop','storefront/routes.json']){if(!playbook.includes(marker)){console.error(`AGENT-PLAYBOOK.md missing marker: ${marker}`);process.exit(1);}}
const notes=read('docs/AI-COMPONENT-NOTES.md');
for(const marker of ['product-media','checkout','plan-change','ownership-transfer','subscription-management','system-states']){if(!notes.includes(marker)){console.error(`AI-COMPONENT-NOTES.md missing marker: ${marker}`);process.exit(1);}}
const recipes=read('docs/RECIPES.md');
for(const marker of ['createReferenceRuntime','createProductCardSpec','bindCommerceActions','createReactActionBindings','createEddCommerceAdapter','createLicensingBridgeAdapter']){if(!recipes.includes(marker)){console.error(`RECIPES.md missing marker: ${marker}`);process.exit(1);}}
const theming=read('docs/THEMING.md');
for(const marker of ['--nbc-bg','--nbc-depth','--nbc-space-7','--nbc-text-display','forced-colors']){if(!theming.includes(marker)){console.error(`THEMING.md missing marker: ${marker}`);process.exit(1);}}
const migration=read('docs/MIGRATION.md');
for(const marker of ['v0.5 → v0.6','v0.6 → v0.7','v0.7 → v0.8','v0.8 → v0.9','v0.9.0-rc.1 → v1.0.0','storefront/components.json','npm run test:browser']){if(!migration.includes(marker)){console.error(`MIGRATION.md missing marker: ${marker}`);process.exit(1);}}
const providers=read('docs/PROVIDER-EXAMPLES.md');
for(const marker of ['createEddCommerceAdapter','createLicensingBridgeAdapter','capabilities','normalize','cancel_at_period_end']){if(!providers.includes(marker)){console.error(`PROVIDER-EXAMPLES.md missing marker: ${marker}`);process.exit(1);}}

const documentedStates=stateExamples.components.reduce((sum,component)=>sum+component.states.length,0);
console.log(`NeoBrutal Commerce v1.0 adoption docs + Showcase v1.1 passed · ${manifest.components.length} components · ${blocks.blocks.length} blocks · ${documentedStates} live states · ${routes.routes.length} production routes · component demo depth audit ${depthComponents.length}/${manifest.components.length}`);
