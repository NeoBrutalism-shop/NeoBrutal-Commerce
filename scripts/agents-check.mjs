import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>{console.error(message);process.exit(1)};
const exact=(actual,expected,label)=>{
  if(!Array.isArray(actual)||actual.length!==expected.length||actual.some((value,index)=>value!==expected[index]))fail(`${label} must remain exact: ${expected.join(' → ')}`);
};
const uniqueStrings=(values,label)=>{
  if(!Array.isArray(values)||values.length===0)fail(`${label} must be a non-empty array`);
  if(values.some(value=>typeof value!=='string'||!value.trim()))fail(`${label} must contain non-empty strings`);
  if(new Set(values).size!==values.length)fail(`${label} must not contain duplicates`);
};

const agent=json('storefront/agents.json');
const packageManifest=json('package.json');
const routes=json('storefront/routes.json');
const components=json('storefront/components.json');
const blocks=json('storefront/blocks.json');
const pages=json('storefront/pages.json');
const states=json('storefront/states.json');
const showcase=json('storefront/component-showcase.json');
const componentStates=json('storefront/component-states.json');
const interactions=json('storefront/interactions.json');
const catalog=json('storefront/catalog.json');

if(agent.schema!=='neobrutal-commerce/agents@1')fail('Unexpected v1.4 agent contract schema');
if(agent.agentContractVersion!=='1.4.0')fail(`Expected agent contract version 1.4.0, received ${agent.agentContractVersion}`);
if(agent.commerceVersion!==packageManifest.version||packageManifest.version!=='1.0.0')fail('v1.4 agent contract must preserve frozen Commerce 1.0.0');
if(agent.distribution!=='repository-source')fail('v1.4 agent contract must remain explicitly repository-source while the npm package is frozen at Commerce 1.0.0');
exact(agent.architecture,['Components','Blocks','Pages','Applications'],'Agent architecture');

const expectedReadOrder=[
  'AGENTS.md',
  'LLMS.md',
  'docs/AGENT-PLAYBOOK.md',
  'storefront/routes.json',
  'storefront/components.json',
  'storefront/blocks.json',
  'storefront/pages.json',
  'storefront/states.json',
  'storefront/component-showcase.json',
  'storefront/component-states.json',
  'storefront/interactions.json',
  'storefront/catalog.json',
  'docs/AI-COMPONENT-NOTES.md'
];
exact(agent.readOrder,expectedReadOrder,'Agent read order');
for(const file of agent.readOrder)if(!exists(file))fail(`Agent read-order source is missing: ${file}`);

const expectedAuthorities={
  'route-intent':'storefront/routes.json',
  'route-states':'storefront/routes.json',
  'page-composition':'storefront/pages.json',
  'block-composition':'storefront/blocks.json',
  'component-contracts':'storefront/components.json',
  'runtime-state-semantics':'storefront/states.json',
  'interaction-behavior':'storefront/interactions.json',
  'normalized-models':'src/contracts/index.d.ts',
  'canonical-actions':'src/actions/runtime.js',
  'reference-commerce-content':'storefront/catalog.json'
};
if(!Array.isArray(agent.authorities)||agent.authorities.length!==Object.keys(expectedAuthorities).length)fail('Agent concern authority set must contain exactly 10 entries');
const authorityConcerns=agent.authorities.map(entry=>entry.concern);
uniqueStrings(authorityConcerns,'Agent authority concerns');
for(const entry of agent.authorities){
  if(expectedAuthorities[entry.concern]!==entry.source)fail(`Unexpected authority for ${entry.concern}: ${entry.source}`);
  if(typeof entry.rule!=='string'||!entry.rule.trim())fail(`Agent authority ${entry.concern} is missing its rule`);
  if(!exists(entry.source))fail(`Agent authority source is missing: ${entry.source}`);
}
for(const concern of Object.keys(expectedAuthorities))if(!authorityConcerns.includes(concern))fail(`Agent authority concern is missing: ${concern}`);

if(routes.version!==packageManifest.version||states.version!==packageManifest.version||catalog.version!==packageManifest.version)fail('Frozen route/state/catalog versions must remain synchronized with Commerce 1.0.0');
if(components.schema!=='neobrutal-commerce/components@1'||components.commerceVersion!==packageManifest.version)fail('Component execution contract identity drifted');
if(blocks.schema!=='neobrutal-commerce/blocks@1'||blocks.showcaseVersion!=='1.1.0'||blocks.commerceVersion!==packageManifest.version)fail('Block composition contract identity drifted');
if(pages.schema!=='neobrutal-commerce/pages@1'||pages.pageLibraryVersion!=='1.2.0'||pages.commerceVersion!==packageManifest.version)fail('Page composition contract identity drifted');
if(showcase.schema!=='neobrutal-commerce/component-showcase@1'||showcase.showcaseVersion!=='1.1.0'||showcase.commerceVersion!==packageManifest.version)fail('Component showcase guidance identity drifted');
if(componentStates.schema!=='neobrutal-commerce/component-states@1'||componentStates.showcaseVersion!=='1.1.0'||componentStates.commerceVersion!==packageManifest.version)fail('Component state examples identity drifted');
if(interactions.schema!=='neobrutal-commerce/interactions@1'||interactions.interactionVersion!=='1.3.0'||interactions.commerceVersion!==packageManifest.version)fail('Interaction authority identity drifted');

const documentationLayerManifests=[
  'storefront/component-showcase.json',
  'storefront/component-states.json',
  'storefront/blocks.json',
  'storefront/pages.json',
  'storefront/interactions.json',
  'storefront/agents.json'
];
const packageFiles=packageManifest.files||[];
const packageAllows=file=>packageFiles.some(entry=>{
  const normalized=String(entry).replace(/\/$/,'');
  return file===normalized||file.startsWith(`${normalized}/`);
});
for(const file of documentationLayerManifests)if(packageAllows(file))fail(`Frozen Commerce 1.0.0 npm allowlist must not silently publish documentation-layer manifest: ${file}`);

const expectedWorkflow=[
  'resolve-route',
  'resolve-page-composition',
  'resolve-component-contracts',
  'resolve-runtime-semantics',
  'resolve-interactions',
  'validate'
];
if(!Array.isArray(agent.workflow))fail('Agent workflow must be an array');
exact(agent.workflow.map(step=>step.id),expectedWorkflow,'Agent workflow');
for(const step of agent.workflow){
  uniqueStrings(step.sources,`Agent workflow ${step.id} sources`);
  uniqueStrings(step.produces,`Agent workflow ${step.id} outputs`);
  for(const source of step.sources)if(!exists(source))fail(`Agent workflow ${step.id} source is missing: ${source}`);
}

const expectedOutputs=[
  'routesAffected','pageContracts','blockContracts','componentContracts','normalizedModels','canonicalActions','canonicalStates','capabilityGates','interactionPatterns','accessibility','responsiveBehavior','testsChanged'
];
exact(agent.outputContract,expectedOutputs,'Agent review output contract');
const expectedProhibitions=[
  'no-provider-shaped-contracts','no-invented-actions','no-invented-states','no-page-state-duplication','no-interaction-taxonomy-duplication','no-capability-by-provider-name','no-fabricated-commerce-facts'
];
if(!Array.isArray(agent.prohibitions))fail('Agent prohibitions must be an array');
exact(agent.prohibitions.map(item=>item.id),expectedProhibitions,'Agent prohibitions');
for(const item of agent.prohibitions)if(typeof item.description!=='string'||!item.description.trim())fail(`Agent prohibition ${item.id} is missing its description`);

const componentIds=components.components.map(component=>component.id);
uniqueStrings(componentIds,'Component IDs');
const knownComponents=new Set(componentIds);
const blockIds=blocks.blocks.map(block=>block.id);
uniqueStrings(blockIds,'Block IDs');
const knownBlocks=new Set(blockIds);
const routeIds=routes.routes.map(route=>route.id);
const pageIds=pages.pages.map(page=>page.id);
uniqueStrings(routeIds,'Route IDs');
uniqueStrings(pageIds,'Page IDs');
exact(pageIds,routeIds,'Route/Page identity order');

for(const route of routes.routes){
  uniqueStrings(route.primaryComponents,`Route ${route.id} primaryComponents`);
  for(const component of route.primaryComponents)if(!knownComponents.has(component))fail(`Route ${route.id} references unknown component ${component}`);
}
for(const page of pages.pages){
  if(Object.prototype.hasOwnProperty.call(page,'states'))fail(`Page ${page.id} duplicates route runtime states`);
  uniqueStrings(page.blocks,`Page ${page.id} blocks`);
  for(const block of page.blocks)if(!knownBlocks.has(block))fail(`Page ${page.id} references unknown Block ${block}`);
}
for(const block of blocks.blocks){
  uniqueStrings(block.components,`Block ${block.id} components`);
  for(const component of block.components)if(!knownComponents.has(component))fail(`Block ${block.id} references unknown component ${component}`);
}

const canonicalStates=new Set(Object.values(states).flatMap(value=>Array.isArray(value)?value.map(item=>item.id):[]));
for(const route of routes.routes){
  if(route.states!==undefined){
    uniqueStrings(route.states,`Route ${route.id} states`);
    for(const state of route.states)if(!canonicalStates.has(state))fail(`Route ${route.id} references unknown canonical state ${state}`);
  }
}
uniqueStrings(components.canonicalActions||[],'Canonical component actions');
const canonicalActions=new Set(components.canonicalActions);
const actionRuntime=read('src/actions/runtime.js');
for(const action of canonicalActions)if(!actionRuntime.includes(action))fail(`Component registry action is absent from canonical runtime: ${action}`);
for(const component of components.components){
  for(const state of component.states||[])if(!canonicalStates.has(state))fail(`Component ${component.id} references unknown canonical state ${state}`);
  for(const action of component.actions||[])if(!canonicalActions.has(action))fail(`Component ${component.id} references unknown canonical action ${action}`);
}

const readme=read('README.md');
let previous=-1;
for(const source of expectedReadOrder){
  const index=readme.indexOf(`\`${source}\``);
  if(index<0)fail(`README coding-agent order is missing ${source}`);
  if(index<=previous)fail(`README coding-agent order drifted at ${source}`);
  previous=index;
}

const docRequirements={
  'AGENTS.md':['storefront/agents.json','repository-source','Authority by concern','storefront/blocks.json','storefront/pages.json','storefront/interactions.json','Components → Blocks → Pages → Applications'],
  'LLMS.md':['LLM Guidance v1.4','storefront/agents.json','repository-source','Authority by concern','storefront/blocks.json','storefront/pages.json','storefront/interactions.json','Components → Blocks → Pages → Applications'],
  'docs/AGENT-PLAYBOOK.md':['storefront/agents.json','repository-source','Authority by concern','storefront/blocks.json','storefront/pages.json','storefront/interactions.json','pageContracts','blockContracts','interactionPatterns']
};
for(const [file,markers] of Object.entries(docRequirements)){
  const content=read(file);
  for(const marker of markers)if(!content.includes(marker))fail(`${file} missing v1.4 agent marker: ${marker}`);
}

if(packageManifest.scripts?.['check:agents']!=='node scripts/agents-check.mjs')fail('Dedicated v1.4 agent conformance script is missing');
if(!packageManifest.scripts?.check?.includes('npm run check:agents'))fail('Main quality chain does not execute v1.4 agent conformance');

console.log(`NeoBrutal Commerce Agent ${agent.agentContractVersion} passed · ${agent.authorities.length} authorities · ${agent.workflow.length} workflow steps · ${agent.outputContract.length} review outputs · ${agent.distribution} · frozen Commerce ${packageManifest.version} API preserved`);
