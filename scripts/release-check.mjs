import fs from 'node:fs';
import path from 'node:path';
import {ACTION_TYPES} from '../src/actions/runtime.js';
import {CHECKOUT_STATES,SYSTEM_STATES,OWNERSHIP_STATES,OWNERSHIP_OPERATION_STATES,SUBSCRIPTION_STATES,MEDIA_STATES,LICENSE_PLAN_IDS} from '../src/contracts/runtime.js';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(`v1.0 release: ${message}`);process.exit(1)};
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const same=(label,actual,expected)=>{
  const a=sorted(actual),e=sorted(expected);
  if(JSON.stringify(a)!==JSON.stringify(e))fail(`${label} drifted\nactual: ${a.join(', ')}\nexpected: ${e.join(', ')}`);
};
const version='1.0.0';

const snapshot=json('tests/public-api-v10.json');
const pkg=json('package.json');
const routes=json('storefront/routes.json');
const registry=json('storefront/components.json');
const declarations=read('src/contracts/index.d.ts');
const tokens=read('src/tokens.css');

if(snapshot.schema!=='neobrutal-commerce/public-api-freeze@1')fail('unexpected API freeze schema');
if(snapshot.frozenFrom!=='0.9.0-rc.1')fail(`v1 freeze baseline must remain 0.9.0-rc.1, received ${snapshot.frozenFrom}`);
if(snapshot.candidate!==version)fail(`v1 freeze candidate must be ${version}, received ${snapshot.candidate}`);
if(pkg.version!==version||pkg.private!==false)fail('package must be exact public v1.0.0');
if(pkg.license!=='PolyForm-Noncommercial-1.0.0')fail('v1 license must use the exact SPDX PolyForm Noncommercial identifier');
if(pkg.repository?.url!=='git+https://github.com/NeoBrutalism-shop/NeoBrutal-Commerce.git')fail('package repository metadata is not canonical');
if(pkg.publishConfig?.access!=='public'||pkg.publishConfig?.provenance!==true)fail('public/provenance publishConfig is incomplete');
const expectedFiles=['src','storefront/catalog.json','storefront/routes.json','storefront/states.json','storefront/components.json','AGENTS.md','LLMS.md','COMPONENTS.md','DESIGN.md','docs','README.md','CHANGELOG.md','LICENSE.md'];
same('package files allowlist',pkg.files||[],expectedFiles);

same('package exports',Object.keys(pkg.exports||{}),snapshot.packageExports);
same('canonical actions',ACTION_TYPES,snapshot.actionTypes);
same('checkout states',CHECKOUT_STATES,snapshot.states.checkout);
same('system states',SYSTEM_STATES,snapshot.states.system);
same('ownership states',OWNERSHIP_STATES,snapshot.states.ownership);
same('ownership-operation states',OWNERSHIP_OPERATION_STATES,snapshot.states.ownershipOperation);
same('subscription states',SUBSCRIPTION_STATES,snapshot.states.subscription);
same('media states',MEDIA_STATES,snapshot.states.media);
same('license-plan ids',LICENSE_PLAN_IDS,snapshot.states.licensePlans);
same('production routes',routes.routes.map(route=>route.path),snapshot.routes);
same('component ids',registry.components.map(component=>component.id),snapshot.componentIds);

const actualTokens=[...new Set(tokens.match(/--nbc-[a-z0-9-]+(?=\s*:)/g)||[])];
same('semantic tokens',actualTokens,snapshot.semanticTokens);
for(const marker of snapshot.typeMarkers){
  if(!declarations.includes(`interface ${marker}`))fail(`normalized type marker missing: ${marker}`);
}

for(const file of ['LICENSE.md','docs/PUBLIC-RELEASE.md','scripts/package-check.mjs','.github/workflows/release.yml','tests/public-api-v10.json','tests/commerce-v10-visual.spec.mjs','package-lock.json']){
  if(!fs.existsSync(path.join(root,file)))fail(`missing public-release file: ${file}`);
}
const license=read('LICENSE.md');
for(const marker of ['PolyForm Noncommercial License 1.0.0','https://polyformproject.org/licenses/noncommercial/1.0.0','Required Notice: Copyright 2026 NeoBrutalism-shop']){
  if(!license.includes(marker))fail(`license notice missing: ${marker}`);
}
const release=read('docs/PUBLIC-RELEASE.md');
for(const marker of ['Public package','Supply-chain release','v1 API freeze','Release gates','PolyForm-Noncommercial-1.0.0','release.yml','1.0.0']){
  if(!release.includes(marker))fail(`public-release guide missing marker: ${marker}`);
}
const workflow=read('.github/workflows/release.yml');
for(const marker of ['actions/checkout@v6','actions/setup-node@v6','node-version: 24','id-token: write','registry-url: https://registry.npmjs.org','npm ci','npm run check','npm run test:browser','npm publish --access public']){
  if(!workflow.includes(marker))fail(`release workflow missing marker: ${marker}`);
}
if(/NPM_TOKEN|NODE_AUTH_TOKEN/.test(workflow))fail('release workflow must not use a long-lived npm publish token');

console.log(`NeoBrutal Commerce ${version} release freeze passed · ${snapshot.packageExports.length} exports · ${snapshot.actionTypes.length} actions · ${snapshot.componentIds.length} components · ${snapshot.semanticTokens.length} semantic tokens`);
