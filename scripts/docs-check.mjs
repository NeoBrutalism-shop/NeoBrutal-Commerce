import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const required=['AGENTS.md','docs/ADOPTION.md','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md','storefront/components.json','LLMS.md','COMPONENTS.md'];
for(const file of required){if(!fs.existsSync(path.join(root,file))){console.error(`Missing v0.8 adoption file: ${file}`);process.exit(1);}}

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
for(const marker of ['storefront/components.json','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md','Read before write','Do not guess']){if(!agents.includes(marker)){console.error(`AGENTS.md missing v0.8 marker: ${marker}`);process.exit(1);}}
const adoption=read('docs/ADOPTION.md');
for(const marker of ['normalized runtime','capability','data-theme','npm run check']){if(!adoption.includes(marker)){console.error(`ADOPTION.md missing marker: ${marker}`);process.exit(1);}}
const playbook=read('docs/AGENT-PLAYBOOK.md');
for(const marker of ['Read before write','Do not guess','Validation loop','storefront/routes.json']){if(!playbook.includes(marker)){console.error(`AGENT-PLAYBOOK.md missing marker: ${marker}`);process.exit(1);}}
const notes=read('docs/AI-COMPONENT-NOTES.md');
for(const marker of ['product-media','checkout','plan-change','ownership-transfer','subscription-management','system-states']){if(!notes.includes(marker)){console.error(`AI-COMPONENT-NOTES.md missing marker: ${marker}`);process.exit(1);}}

console.log(`NeoBrutal Commerce v0.8 adoption docs passed · ${manifest.components.length} machine-readable components · ${routes.routes.length} production routes`);
