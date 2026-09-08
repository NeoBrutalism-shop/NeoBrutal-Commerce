import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const required=[
  'AGENTS.md','LLMS.md','COMPONENTS.md',
  'docs/ADOPTION.md','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md',
  'docs/RECIPES.md','docs/THEMING.md','docs/MIGRATION.md','docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md',
  'storefront/components.json'
];
for(const file of required){if(!fs.existsSync(path.join(root,file))){console.error(`Missing adoption file: ${file}`);process.exit(1);}}

const manifest=json('storefront/components.json');
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
for(const marker of ['v0.5 → v0.6','v0.6 → v0.7','v0.7 → v0.8','v0.8 → v0.9','storefront/components.json','npm run test:browser']){if(!migration.includes(marker)){console.error(`MIGRATION.md missing marker: ${marker}`);process.exit(1);}}
const providers=read('docs/PROVIDER-EXAMPLES.md');
for(const marker of ['createEddCommerceAdapter','createLicensingBridgeAdapter','capabilities','normalize','cancel_at_period_end']){if(!providers.includes(marker)){console.error(`PROVIDER-EXAMPLES.md missing marker: ${marker}`);process.exit(1);}}

console.log(`NeoBrutal Commerce v0.9 RC adoption docs passed · ${manifest.components.length} machine-readable components · ${routes.routes.length} production routes · recipes/theming/migration/provider examples verified`);
