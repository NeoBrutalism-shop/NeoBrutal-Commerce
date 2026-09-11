import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

const base=json('storefront/component-demo-depth.json');
const account=json('storefront/component-demo-depth-account.json');
const system=json('storefront/component-demo-depth-system.json');
const systemEvidence=json('storefront/component-variant-evidence-system.json');
const showcase=json('storefront/component-showcase.json');
const runtime=read('component-depth-system-extension.js');
const explorer=read('components.html');
const browser=read('tests/component-variant-evidence-system-v11.spec.mjs');

if(base.schema!=='neobrutal-commerce/component-demo-depth@1'||base.showcaseVersion!=='1.1.0'||base.commerceVersion!=='1.0.0'||base.role!=='audit-evidence-only')fail('Base component demo depth authority drifted');
for(const [label,extension] of [['Account',account],['System',system]])if(extension.schema!=='neobrutal-commerce/component-demo-depth-extension@1'||extension.showcaseVersion!=='1.1.0'||extension.commerceVersion!=='1.0.0'||extension.role!=='audit-evidence-extension'||extension.criterion!=='variants'||extension.status!=='complete')fail(`${label} depth extension schema/version/role drifted`);
if(account.baseComplete!==28||account.extensionComplete!==10||account.combinedComplete!==38||account.combinedPartial!==9)fail('Certified Account depth lineage must remain 28 + 10 = 38 complete / 9 partial');
if(system.baseComplete!==38||system.extensionComplete!==4||system.combinedComplete!==42||system.combinedPartial!==5)fail('System depth extension must advance 38 + 4 = 42 complete / 5 partial');
if(system.evidenceFile!=='storefront/component-variant-evidence-system.json')fail('System depth extension must point to System variant evidence shard');

const systemIds=(systemEvidence.components||[]).map(component=>component.id);
const extensionIds=system.components||[];
const remaining=system.remainingPartial||[];
const remainingIds=remaining.map(item=>item.id);
const expectedSystemIds=['component-contract','tokens','system-states','ownership-lifecycle'];
const expectedRemaining=['invoice-details','purchase-history-row','invoice-history','activation-row','seat-assignment'];
if(extensionIds.length!==4||new Set(extensionIds).size!==4||!same(extensionIds,expectedSystemIds)||!same(extensionIds,systemIds))fail('System depth extension must promote exact four System evidence components');
if(remaining.length!==5||new Set(remainingIds).size!==5||!same(remainingIds,expectedRemaining)||remaining.some(item=>!item.reason?.trim()))fail('System depth extension must preserve exact five remaining partial components with reasons');
if(extensionIds.some(id=>remainingIds.includes(id)))fail('System depth extension cannot both promote and retain a component as partial');

const resolved=new Map();
for(const component of base.components||[])resolved.set(component.id,{...base.defaultStatus,...(component.overrides||{})});
if(resolved.size!==47)fail('Base demo depth audit must still cover exact 47 components');
const baseComplete=[...resolved.values()].filter(status=>status.variants==='complete').length;
const basePartial=[...resolved.values()].filter(status=>status.variants==='partial').length;
if(baseComplete!==28||basePartial!==19)fail(`Certified base variant depth must remain 28 complete / 19 partial; got ${baseComplete}/${basePartial}`);
for(const id of account.components||[]){
  const status=resolved.get(id);
  if(!status||status.variants!=='partial')fail(`Account depth lineage must promote a previously partial component: ${id}`);
  status.variants='complete';
}
if([...resolved.values()].filter(status=>status.variants==='complete').length!==38||[...resolved.values()].filter(status=>status.variants==='partial').length!==9)fail('Account depth stage must remain 38 complete / 9 partial before System promotion');
for(const id of extensionIds){
  const status=resolved.get(id);
  if(!status||status.variants!=='partial')fail(`System depth extension must only promote a previously partial component: ${id}`);
  status.variants='complete';
}
for(const id of remainingIds)if(resolved.get(id)?.variants!=='partial')fail(`Residual component must remain partial after System extension: ${id}`);
const combinedComplete=[...resolved.values()].filter(status=>status.variants==='complete').length;
const combinedPartial=[...resolved.values()].filter(status=>status.variants==='partial').length;
if(combinedComplete!==42||combinedPartial!==5)fail(`Combined System variant depth must be 42 complete / 5 partial; got ${combinedComplete}/${combinedPartial}`);

const showcaseIds=new Set((showcase.components||[]).map(component=>component.id));
for(const id of [...extensionIds,...remainingIds])if(!showcaseIds.has(id))fail(`System depth extension references unknown showcase component: ${id}`);

for(const marker of ['component-demo-depth-system.json','componentDepthSystemReady','componentDepthAccountReady','componentDepthVariantComplete','componentDepthVariantPartial','All variants','42','5'])if(!runtime.includes(marker))fail(`System depth runtime missing marker: ${marker}`);
if(!explorer.includes('./component-depth-variant-extension.js')||!explorer.includes('./component-depth-system-extension.js')||explorer.indexOf('./component-depth-system-extension.js')<explorer.indexOf('./component-depth-variant-extension.js'))fail('Components explorer must load System depth extension after Account depth extension');
for(const marker of ['data-component-depth-system-ready','data-component-depth-variant-complete','data-component-depth-variant-partial','42','5','invoice-details','purchase-history-row','invoice-history','activation-row','seat-assignment'])if(!browser.includes(marker))fail(`System depth Browser QA missing marker: ${marker}`);

console.log('System variant depth extension passed · certified base 28/19 and Account 38/9 preserved · combined All variants 42 complete / 5 partial');
