import fs from 'node:fs';
import path from 'node:path';
import {ACTION_TYPES} from '../src/actions/runtime.js';
import {
  CHECKOUT_STATES,SYSTEM_STATES,OWNERSHIP_STATES,OWNERSHIP_OPERATION_STATES,SUBSCRIPTION_STATES,MEDIA_STATES,LICENSE_PLAN_IDS
} from '../src/contracts/runtime.js';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(`v0.9 release freeze: ${message}`);process.exit(1)};
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const same=(label,actual,expected)=>{
  const a=sorted(actual),e=sorted(expected);
  if(JSON.stringify(a)!==JSON.stringify(e))fail(`${label} drifted\nactual: ${a.join(', ')}\nexpected: ${e.join(', ')}`);
};
const rcVersion='0.9.0-rc.1';

const snapshot=json('tests/public-api-v09.json');
const pkg=json('package.json');
const routes=json('storefront/routes.json');
const registry=json('storefront/components.json');
const declarations=read('src/contracts/index.d.ts');
const tokens=read('src/tokens.css');

if(snapshot.schema!=='neobrutal-commerce/public-api-freeze@1')fail('unexpected API freeze schema');
if(snapshot.frozenFrom!=='0.8.0')fail(`freeze baseline must remain v0.8.0, received ${snapshot.frozenFrom}`);
if(snapshot.candidate!==rcVersion)fail(`freeze candidate must be ${rcVersion}, received ${snapshot.candidate}`);
if(pkg.version!==rcVersion)fail(`expected exact RC version ${rcVersion}, received ${pkg.version}`);
if(pkg.private!==true)fail('pre-v1 package must remain private to prevent accidental npm publication');
if(pkg.license!=='UNLICENSED')fail('pre-v1 licensing status changed without an explicit packaging decision');

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

for(const file of ['CHANGELOG.md','CONTRIBUTING.md','SECURITY.md','docs/RELEASE-CANDIDATE.md','tests/commerce-v09.spec.mjs','tests/commerce-v09-visual.spec.mjs']){
  if(!fs.existsSync(path.join(root,file)))fail(`missing release-candidate repo file: ${file}`);
}
const release=read('docs/RELEASE-CANDIDATE.md');
for(const marker of ['API freeze','production storefront stress','visual regression','v1.0','UNLICENSED',rcVersion]){
  if(!release.includes(marker))fail(`release-candidate guide missing marker: ${marker}`);
}

console.log(`NeoBrutal Commerce ${rcVersion} API freeze passed · ${snapshot.packageExports.length} exports · ${snapshot.actionTypes.length} actions · ${snapshot.componentIds.length} components · ${snapshot.semanticTokens.length} semantic tokens`);
