import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(`v1.2 pages: ${message}`);process.exit(1)};
const unique=(values,label)=>{if(new Set(values).size!==values.length)fail(`${label} contains duplicate ids`)};
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const exactIds=(label,actual,expected)=>{
  const a=sorted(actual),e=sorted(expected);
  if(JSON.stringify(a)!==JSON.stringify(e))fail(`${label} drifted\nactual: ${a.join(', ')}\nexpected: ${e.join(', ')}`);
};
const requiredText=(value,label)=>{if(typeof value!=='string'||!value.trim())fail(`${label} must be a non-empty string`)};

const expectedCommerce='1.0.0';
const expectedPageLibrary='1.2.0';
const expectedBlockCount=25;
const expectedPageComposedBlockCount=18;
const expectedPromotedBlockCount=7;
const expectedPromotedBlockIds=['trust-strip','testimonials','guarantee','product-detail','product-gallery','order-confirmation','subscription-management'];
const routes=json('storefront/routes.json');
const blocks=json('storefront/blocks.json');
const pages=json('storefront/pages.json');
const lab=read('demo/v10.js');
const html=read('demo/v10.html');

if(routes.version!==expectedCommerce)fail(`frozen route manifest must remain ${expectedCommerce}`);
if(blocks.commerceVersion!==expectedCommerce)fail(`blocks must target frozen Commerce ${expectedCommerce}`);
if(pages.schema!=='neobrutal-commerce/pages@1')fail(`unexpected page library schema: ${pages.schema}`);
if(pages.commerceVersion!==expectedCommerce)fail(`pages must target frozen Commerce ${expectedCommerce}`);
if(pages.pageLibraryVersion!==expectedPageLibrary)fail(`page library must use exact ${expectedPageLibrary}`);

const routeDocs=routes.routes||[];
const blockDocs=blocks.blocks||[];
const pageDocs=pages.pages||[];
const routeIds=routeDocs.map(route=>route.id);
const blockIds=blockDocs.map(block=>block.id);
const pageIds=pageDocs.map(page=>page.id);
if(routeIds.length!==10)fail(`expected exactly 10 frozen production routes, received ${routeIds.length}`);
if(pageIds.length!==10)fail(`expected exactly 10 page contracts, received ${pageIds.length}`);
if(blockIds.length!==expectedBlockCount)fail(`expected exactly ${expectedBlockCount} reusable block contracts, received ${blockIds.length}`);
unique(routeIds,'route manifest');
unique(blockIds,'block manifest');
unique(pageIds,'page library');
exactIds('page ids',pageIds,routeIds);

const routeMap=new Map(routeDocs.map(route=>[route.id,route]));
const blockMap=new Map(blockDocs.map(block=>[block.id,block]));
const statefulRouteIds=[];
for(const route of routeDocs){
  if(!Array.isArray(route.primaryComponents)||route.primaryComponents.length===0)fail(`frozen route ${route.id} must expose primaryComponents`);
  unique(route.primaryComponents,`frozen route ${route.id} primaryComponents`);
  if(route.states!==undefined){
    if(!Array.isArray(route.states)||route.states.length===0)fail(`frozen route ${route.id} states must be a non-empty array when declared`);
    route.states.forEach((state,index)=>requiredText(state,`frozen route ${route.id} state ${index}`));
    unique(route.states,`frozen route ${route.id} states`);
    statefulRouteIds.push(route.id);
  }
}
exactIds('routes with canonical states',statefulRouteIds,['product-soft','checkout','account-license']);
for(const block of blockDocs){
  if(!Array.isArray(block.components)||block.components.length===0)fail(`block ${block.id} must reference at least one component`);
  unique(block.components,`block ${block.id} components`);
}

const knownBlocks=new Set(blockIds);
const usedBlocks=new Set();
for(const page of pageDocs){
  requiredText(page.title,`page ${page.id} title`);
  requiredText(page.description,`page ${page.id} description`);
  if(!Array.isArray(page.blocks)||page.blocks.length===0)fail(`page ${page.id} must compose at least one block`);
  unique(page.blocks,`page ${page.id} block composition`);
  const route=routeMap.get(page.id);
  if(!route)fail(`page ${page.id} has no frozen route contract`);
  const composedComponents=new Set();
  for(const blockId of page.blocks){
    if(!knownBlocks.has(blockId))fail(`page ${page.id} references unknown block ${blockId}`);
    usedBlocks.add(blockId);
    for(const componentId of blockMap.get(blockId).components)composedComponents.add(componentId);
  }
  const missing=route.primaryComponents.filter(componentId=>!composedComponents.has(componentId));
  if(missing.length)fail(`page ${page.id} Blocks → Pages composition missing frozen route components: ${missing.join(', ')}`);
}

if(usedBlocks.size!==expectedPageComposedBlockCount)fail(`expected ${expectedPageComposedBlockCount} Page-composed compatibility Blocks, received ${usedBlocks.size}`);
const promotedBlocks=blockDocs.filter(block=>!usedBlocks.has(block.id));
if(promotedBlocks.length!==expectedPromotedBlockCount)fail(`expected ${expectedPromotedBlockCount} promoted reusable Blocks outside current Page composition, received ${promotedBlocks.length}`);
exactIds('promoted reusable Block ids',promotedBlocks.map(block=>block.id),expectedPromotedBlockIds);
for(const block of promotedBlocks){
  requiredText(block.promotedFrom,`uncomposed block ${block.id} promotedFrom`);
  if(block.promotedFrom===block.id)fail(`uncomposed block ${block.id} cannot promote from itself`);
  const parent=blockMap.get(block.promotedFrom);
  if(!parent)fail(`uncomposed block ${block.id} promotes from unknown compatibility Block ${block.promotedFrom}`);
  if(!usedBlocks.has(parent.id))fail(`uncomposed block ${block.id} compatibility parent ${parent.id} must remain Page-composed`);
  const outsideParent=block.components.filter(componentId=>!parent.components.includes(componentId));
  if(outsideParent.length)fail(`uncomposed block ${block.id} escapes compatibility parent ${parent.id}: ${outsideParent.join(', ')}`);
}
exactIds('product-media promoted Blocks',promotedBlocks.filter(block=>block.promotedFrom==='product-media').map(block=>block.id),['product-detail','product-gallery']);
exactIds('order-success promoted Blocks',promotedBlocks.filter(block=>block.promotedFrom==='order-success').map(block=>block.id),['order-confirmation']);
exactIds('ownership-operations promoted Blocks',promotedBlocks.filter(block=>block.promotedFrom==='ownership-operations').map(block=>block.id),['subscription-management']);
if(usedBlocks.size+promotedBlocks.length!==blockIds.length)fail('Page composition and promoted compatibility accounting must cover every documented Block');

if(/\bconst\s+ROUTES\s*=\s*\[/.test(lab))fail('Page Lab must not hard-code a duplicate route catalog');
for(const marker of [
  "fetchJson('../storefront/routes.json')",
  "fetchJson('../storefront/pages.json')",
  "fetchJson('../storefront/blocks.json')",
  "pageLibrary.schema==='neobrutal-commerce/pages@1'",
  "dataset.pageLibraryReady='true'",
  'dataset.pageLibraryComposedBlocks',
  'data-page-id',
  'data-page-block',
  'data-route-state',
  'data-route-state-empty',
  'current.states',
  'LEGACY_ROUTE_ALIASES',
  'page library ids drifted from frozen routes',
  'promoted compatibility accounting',
  'compatibility parent'
])if(!lab.includes(marker))fail(`Page Lab runtime contract missing marker: ${marker}`);
try{new Function(lab)}catch(error){fail(`demo/v10.js syntax error: ${error.message}`)}

for(const marker of ['PAGE LAB v1.2','id="currentIntent"','id="currentBlocks"','id="currentStates"','ROUTE STATES','id="pageCountBadge"'])if(!html.includes(marker))fail(`Page Lab HTML missing v1.2 marker: ${marker}`);

console.log(`NeoBrutal Commerce Pages v${expectedPageLibrary} passed · 10/10 route-complete page contracts · ${expectedPageComposedBlockCount} Page-composed compatibility Blocks + ${expectedPromotedBlockCount} promoted reusable Blocks · 3 stateful routes · Page Lab derives frozen routes/states`);
