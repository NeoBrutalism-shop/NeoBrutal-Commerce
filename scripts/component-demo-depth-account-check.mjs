import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

const base=json('storefront/component-demo-depth.json');
const extension=json('storefront/component-demo-depth-account.json');
const accountEvidence=json('storefront/component-variant-evidence-account.json');
const showcase=json('storefront/component-showcase.json');
const runtime=read('component-depth-variant-extension.js');
const explorer=read('components.html');
const browser=read('tests/component-variant-evidence-account-v11.spec.mjs');

if(base.schema!=='neobrutal-commerce/component-demo-depth@1'||base.showcaseVersion!=='1.1.0'||base.commerceVersion!=='1.0.0'||base.role!=='audit-evidence-only')fail('Base component demo depth authority drifted');
if(extension.schema!=='neobrutal-commerce/component-demo-depth-extension@1'||extension.showcaseVersion!=='1.1.0'||extension.commerceVersion!=='1.0.0'||extension.role!=='audit-evidence-extension')fail('Account depth extension schema/version/role drifted');
if(extension.criterion!=='variants'||extension.status!=='complete')fail('Account depth extension may only promote the variants criterion to complete');
if(extension.baseComplete!==28||extension.extensionComplete!==10||extension.combinedComplete!==38||extension.combinedPartial!==9)fail('Account depth extension accumulated counts drifted');
if(extension.evidenceFile!=='storefront/component-variant-evidence-account.json')fail('Account depth extension must point to the Account variant evidence shard');

const accountIds=(accountEvidence.components||[]).map(component=>component.id);
const extensionIds=extension.components||[];
const excluded=extension.excluded||[];
const excludedIds=excluded.map(item=>item.id);
const expectedExcluded=['purchase-history-row','invoice-history','activation-row','seat-assignment'];
if(extensionIds.length!==10||new Set(extensionIds).size!==10||!same(extensionIds,accountIds))fail('Account depth extension must promote exactly the ten Account evidence components');
if(excluded.length!==4||new Set(excludedIds).size!==4||!same(excludedIds,expectedExcluded)||excluded.some(item=>!item.reason?.trim()))fail('Account depth extension must preserve four explicit source-mismatch exclusions with reasons');
if(extensionIds.some(id=>excludedIds.includes(id)))fail('Account depth extension cannot both promote and exclude a component');

const resolved=new Map();
for(const component of base.components||[]){
  const status={...base.defaultStatus,...(component.overrides||{})};
  resolved.set(component.id,status);
}
if(resolved.size!==47)fail('Base demo depth audit must still cover exact 47 components');
const baseComplete=[...resolved.values()].filter(status=>status.variants==='complete').length;
const basePartial=[...resolved.values()].filter(status=>status.variants==='partial').length;
if(baseComplete!==28||basePartial!==19)fail(`Certified base variant depth must remain 28 complete / 19 partial; got ${baseComplete}/${basePartial}`);
for(const id of extensionIds){
  const status=resolved.get(id);
  if(!status)fail(`Account depth extension references unknown component: ${id}`);
  if(status.variants!=='partial')fail(`Account depth extension must only promote a previously partial component: ${id}`);
  status.variants='complete';
}
for(const id of excludedIds){
  const status=resolved.get(id);
  if(!status||status.variants!=='partial')fail(`Excluded Account component must remain partial: ${id}`);
}
const combinedComplete=[...resolved.values()].filter(status=>status.variants==='complete').length;
const combinedPartial=[...resolved.values()].filter(status=>status.variants==='partial').length;
if(combinedComplete!==38||combinedPartial!==9)fail(`Combined Account variant depth must be 38 complete / 9 partial; got ${combinedComplete}/${combinedPartial}`);

const showcaseIds=new Set((showcase.components||[]).map(component=>component.id));
for(const id of [...extensionIds,...excludedIds])if(!showcaseIds.has(id))fail(`Account depth extension references unknown showcase component: ${id}`);

for(const marker of ['component-demo-depth-account.json','componentDepthAccountReady','componentDepthVariantComplete','componentDepthVariantPartial','All variants','38','9'])if(!runtime.includes(marker))fail(`Account depth runtime missing marker: ${marker}`);
if(!explorer.includes('./component-depth-variant-extension.js'))fail('Components explorer must load Account depth extension runtime');
for(const marker of ['data-component-depth-account-ready','data-component-depth-variant-complete','data-component-depth-variant-partial','38','9','purchase-history-row','invoice-history','activation-row','seat-assignment'])if(!browser.includes(marker))fail(`Account depth Browser QA missing marker: ${marker}`);

console.log('Account variant depth extension passed · certified base 28/19 preserved · combined All variants 38 complete / 9 partial · four Account source mismatches remain partial');
