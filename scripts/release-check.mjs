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

for(const file of ['LICENSE.md','docs/PUBLIC-RELEASE.md','scripts/package-check.mjs','.github/workflows/release.yml','tests/public-api-v10.json','tests/commerce-v10-visual.spec.mjs','tests/visual-baselines-v10.json','package-lock.json']){
  if(!fs.existsSync(path.join(root,file)))fail(`missing public-release file: ${file}`);
}
const license=read('LICENSE.md');
for(const marker of ['PolyForm Noncommercial License 1.0.0','https://polyformproject.org/licenses/noncommercial/1.0.0','Required Notice: Copyright 2026 NeoBrutalism-shop']){
  if(!license.includes(marker))fail(`license notice missing: ${marker}`);
}
const release=read('docs/PUBLIC-RELEASE.md');
for(const marker of ['Public package','Supply-chain release','Production activation boundary','Safe preflight','v1 API freeze','Visual freeze','Release gates','PolyForm-Noncommercial-1.0.0','release.yml','visual-baselines-v10.json','1.0.0']){
  if(!release.includes(marker))fail(`public-release guide missing marker: ${marker}`);
}
const visual=json('tests/visual-baselines-v10.json');
if(visual.version!==version||visual.platform!=='linux')fail('v1 visual baseline identity/platform must remain exact');
if(visual.source?.workflowRun!==34304046291||visual.source?.headSha!=='b48ee9491999ce1c998314f7b709ccfe1a1becd4'||visual.source?.artifactId!==10086065314)fail('v1 visual baseline provenance drifted from reviewed Browser QA #105 artifact');
if(visual.surfaces.map(surface=>surface.id).join(',')!=='home,product,checkout,account,ownership')fail('v1 visual baseline surfaces are incomplete or reordered');
for(const project of ['chromium','mobile-chromium'])for(const surface of ['home','product','checkout','account','ownership']){
  const entry=visual.projects?.[project]?.[surface];
  if(!entry||!/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isInteger(entry.width)||!Number.isInteger(entry.height))fail(`v1 visual fingerprint missing or invalid: ${project}/${surface}`);
}
const visualSpec=read('tests/commerce-v10-visual.spec.mjs');
for(const marker of ['visual-baselines-v10.json','createHash','pixels drifted from reviewed v1.0 baseline','chromium','mobile-chromium']){
  if(!visualSpec.includes(marker))fail(`v1 exact visual lock missing: ${marker}`);
}
const workflow=read('.github/workflows/release.yml').replace(/\r\n/g,'\n');
const permissionsIndex=workflow.indexOf('\npermissions:\n');
const jobsIndex=workflow.indexOf('\njobs:\n');
if(!workflow.startsWith('name: Publish Commerce\n\non:\n')||permissionsIndex<0||jobsIndex<0||permissionsIndex>=jobsIndex)fail('release workflow header structure drifted');
const triggerBlock=workflow.slice(workflow.indexOf('on:\n'),permissionsIndex).trim();
if(triggerBlock!==`on:\n  release:\n    types: [published]`)fail('release workflow must trigger only when a GitHub Release is published');
const permissionBlock=workflow.slice(permissionsIndex+1,jobsIndex).trim();
if(permissionBlock!==`permissions:\n  contents: read\n  id-token: write`)fail('release workflow permissions must remain exact: contents read + OIDC id-token write');

const orderedSteps=[
  '- name: Verify release tag',
  '- name: Install exact QA dependencies',
  '- name: Quality and package gates',
  '- name: Install Chromium Firefox and WebKit',
  '- name: Browser release gates',
  '- name: Publish public package with npm trusted publishing'
];
let previous=-1;
for(const marker of orderedSteps){
  const index=workflow.indexOf(marker);
  if(index<0)fail(`release workflow missing ordered step: ${marker}`);
  if(index<=previous)fail(`release workflow step order drifted at: ${marker}`);
  previous=index;
}
for(const marker of [
  'actions/checkout@v6',
  'actions/setup-node@v6',
  'node-version: 24',
  'registry-url: https://registry.npmjs.org',
  `process.env.GITHUB_REF_NAME!=='v'+p.version`,
  'run: npm ci --ignore-scripts --no-audit --no-fund',
  'run: npm run check',
  'run: npx playwright install --with-deps chromium firefox webkit',
  'run: npm run test:browser',
  'run: npm publish --access public'
]){
  if(!workflow.includes(marker))fail(`release workflow missing marker: ${marker}`);
}
if((workflow.match(/run:\s*npm publish --access public/g)||[]).length!==1)fail('release workflow must contain exactly one public npm publish command');
if(/NPM_TOKEN|NODE_AUTH_TOKEN|\bsecrets\./.test(workflow))fail('release workflow must use tokenless npm trusted publishing only');

console.log(`NeoBrutal Commerce ${version} release freeze passed · ${snapshot.packageExports.length} exports · ${snapshot.actionTypes.length} actions · ${snapshot.componentIds.length} components · ${snapshot.semanticTokens.length} semantic tokens · release-only OIDC publish path locked`);
