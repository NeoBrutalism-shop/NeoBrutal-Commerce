import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>{console.error(`v1.1 showcase: ${message}`);process.exit(1)};
const unique=(values,label)=>{if(new Set(values).size!==values.length)fail(`${label} contains duplicate ids`)};
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const exactIds=(label,actual,expected)=>{
  const a=sorted(actual),e=sorted(expected);
  if(JSON.stringify(a)!==JSON.stringify(e))fail(`${label} drifted\nactual: ${a.join(', ')}\nexpected: ${e.join(', ')}`);
};
const requiredText=(value,label)=>{if(typeof value!=='string'||!value.trim())fail(`${label} must be a non-empty string`)};
const expectedCommerce='1.0.0';
const expectedShowcase='1.1.0';
const expectedBlockCount=24;
const expectedBaseBlockCount=18;
const expectedPromotedBlockIds=['trust-strip','testimonials','guarantee','product-detail','product-gallery','order-confirmation'];
const expectedPromotionGroups={
  'trust-band':['trust-strip','testimonials','guarantee'],
  'product-media':['product-detail','product-gallery'],
  'order-success':['order-confirmation']
};
const expectedCategories=['storefront','product','pricing','checkout','account','system'];
const allowedStateTones=['neutral','info','warning','danger','success'];

for(const file of ['storefront/components.json','storefront/component-showcase.json','storefront/component-states.json','storefront/blocks.json','component-explorer.js','block-expansion.js','component-showcase.js','component-showcase.css','components.html']){
  if(!exists(file))fail(`missing showcase file: ${file}`);
}

const registry=json('storefront/components.json');
const showcase=json('storefront/component-showcase.json');
const stateExamples=json('storefront/component-states.json');
const blocks=json('storefront/blocks.json');
const explorer=read('component-explorer.js');
const blockExpansion=read('block-expansion.js');
const showcaseClient=read('component-showcase.js');
const showcaseCss=read('component-showcase.css');
const showcaseHtml=read('components.html');
const components=registry.components||[];
const componentIds=components.map(component=>component.id);
const docs=showcase.components||[];
const docIds=docs.map(component=>component.id);
const statefulComponents=components.filter(component=>Array.isArray(component.states)&&component.states.length>0);
const stateDocs=stateExamples.components||[];
const blockDocs=blocks.blocks||[];
const blockIds=blockDocs.map(block=>block.id);
const baseBlockDocs=blockDocs.filter(block=>block.promotedFrom===undefined);
const promotedBlockDocs=blockDocs.filter(block=>block.promotedFrom!==undefined);

if(registry.commerceVersion!==expectedCommerce)fail(`expected Commerce ${expectedCommerce} registry`);
if(showcase.schema!=='neobrutal-commerce/component-showcase@1')fail(`unexpected component showcase schema: ${showcase.schema}`);
if(stateExamples.schema!=='neobrutal-commerce/component-states@1')fail(`unexpected component states schema: ${stateExamples.schema}`);
if(blocks.schema!=='neobrutal-commerce/blocks@1')fail(`unexpected blocks schema: ${blocks.schema}`);
for(const [label,manifest] of [['component showcase',showcase],['component states',stateExamples],['blocks',blocks]]){
  if(manifest.commerceVersion!==expectedCommerce)fail(`${label} must target frozen Commerce ${expectedCommerce}`);
  if(manifest.showcaseVersion!==expectedShowcase)fail(`${label} must use exact Showcase ${expectedShowcase}`);
}
if(componentIds.length!==47)fail(`expected exactly 47 registered components, received ${componentIds.length}`);
if(docIds.length!==47)fail(`expected exactly 47 component showcase docs, received ${docIds.length}`);
if(blockIds.length!==expectedBlockCount)fail(`expected exactly ${expectedBlockCount} block showcase docs, received ${blockIds.length}`);
if(baseBlockDocs.length!==expectedBaseBlockCount)fail(`expected ${expectedBaseBlockCount} compatibility Blocks, received ${baseBlockDocs.length}`);
exactIds('promoted Block ids',promotedBlockDocs.map(block=>block.id),expectedPromotedBlockIds);
for(const [parentId,expectedIds] of Object.entries(expectedPromotionGroups)){
  exactIds(`${parentId} promoted Block ids`,promotedBlockDocs.filter(block=>block.promotedFrom===parentId).map(block=>block.id),expectedIds);
}
unique(componentIds,'component registry');
unique(docIds,'component showcase');
unique(stateDocs.map(component=>component.id),'component states showcase');
unique(blockIds,'block showcase');
exactIds('component showcase ids',docIds,componentIds);
exactIds('stateful component ids',stateDocs.map(component=>component.id),statefulComponents.map(component=>component.id));

const stateRegistry=new Map(statefulComponents.map(component=>[component.id,component.states]));
let totalStateExamples=0;
for(const component of stateDocs){
  const expected=stateRegistry.get(component.id);
  if(!expected)fail(`state examples reference non-stateful component: ${component.id}`);
  if(!Array.isArray(component.states)||component.states.length===0)fail(`state examples missing for ${component.id}`);
  const ids=component.states.map(state=>state.id);
  unique(ids,`${component.id} state examples`);
  exactIds(`${component.id} canonical states`,ids,expected);
  for(const state of component.states){
    requiredText(state.title,`${component.id}:${state.id} title`);
    requiredText(state.consequence,`${component.id}:${state.id} consequence`);
    if(!allowedStateTones.includes(state.tone))fail(`${component.id}:${state.id} has unknown state tone ${state.tone}`);
  }
  totalStateExamples+=component.states.length;
}
if(totalStateExamples!==42)fail(`expected exactly 42 canonical live state examples, received ${totalStateExamples}`);

const categoryIds=(showcase.categories||[]).map(category=>category.id);
exactIds('showcase categories',categoryIds,expectedCategories);
for(const category of showcase.categories){
  requiredText(category.label,`category ${category.id} label`);
  requiredText(category.description,`category ${category.id} description`);
}
const responsiveIds=Object.keys(showcase.responsiveModes||{});
const themeIds=Object.keys(showcase.themeModes||{});
const a11yIds=Object.keys(showcase.a11yRules||{});
if(responsiveIds.length<5)fail('responsive-mode taxonomy is incomplete');
if(themeIds.length<3)fail('theme-mode taxonomy is incomplete');
if(a11yIds.length<15)fail('accessibility-rule taxonomy is incomplete');
for(const [id,text] of Object.entries(showcase.responsiveModes||{}))requiredText(text,`responsive mode ${id}`);
for(const [id,text] of Object.entries(showcase.themeModes||{}))requiredText(text,`theme mode ${id}`);
for(const [id,text] of Object.entries(showcase.a11yRules||{}))requiredText(text,`a11y rule ${id}`);

const validateRoute=(route,label)=>{
  requiredText(route,`${label} route`);
  if(!route.startsWith('./')||route.startsWith('../')||route.includes('://'))fail(`${label} route must remain GitHub Pages base-path-safe: ${route}`);
};
const validateDoc=(doc,label)=>{
  requiredText(doc.id,`${label} id`);
  requiredText(doc.description,`${label} ${doc.id} description`);
  if(!expectedCategories.includes(doc.category))fail(`${label} ${doc.id} has unknown category ${doc.category}`);
  validateRoute(doc.route,`${label} ${doc.id}`);
  if(!Array.isArray(doc.variants)||doc.variants.length===0||doc.variants.some(value=>typeof value!=='string'||!value.trim()))fail(`${label} ${doc.id} variants are incomplete`);
  if(!responsiveIds.includes(doc.responsiveMode))fail(`${label} ${doc.id} has unknown responsive mode ${doc.responsiveMode}`);
  if(!themeIds.includes(doc.themeMode))fail(`${label} ${doc.id} has unknown theme mode ${doc.themeMode}`);
  if(!Array.isArray(doc.a11y)||doc.a11y.length===0)fail(`${label} ${doc.id} must declare accessibility expectations`);
  for(const code of doc.a11y)if(!a11yIds.includes(code))fail(`${label} ${doc.id} references unknown a11y rule ${code}`);
};
for(const doc of docs)validateDoc(doc,'component');
const blockMap=new Map(blockDocs.map(block=>[block.id,block]));
for(const block of blockDocs){
  validateDoc({...block,variants:['composition']},'block');
  requiredText(block.title,`block ${block.id} title`);
  if(!Array.isArray(block.components)||block.components.length===0)fail(`block ${block.id} must reference component ids`);
  unique(block.components,`block ${block.id} components`);
  for(const id of block.components)if(!componentIds.includes(id))fail(`block ${block.id} references unknown component ${id}`);
  if(block.promotedFrom!==undefined){
    requiredText(block.promotedFrom,`block ${block.id} promotedFrom`);
    if(block.promotedFrom===block.id)fail(`block ${block.id} cannot promote from itself`);
    const parent=blockMap.get(block.promotedFrom);
    if(!parent)fail(`block ${block.id} promotes from unknown block ${block.promotedFrom}`);
    const outsideParent=block.components.filter(id=>!parent.components.includes(id));
    if(outsideParent.length)fail(`block ${block.id} contains components outside compatibility parent ${parent.id}: ${outsideParent.join(', ')}`);
    if(block.components.length!==1||block.components[0]!==block.id)fail(`promoted Block ${block.id} must map directly to its frozen component`);
  }
}

const previewStart=explorer.indexOf('function previewFor(id){');
const previewEnd=explorer.indexOf('\nfunction renderComponent',previewStart);
if(previewStart<0||previewEnd<0)fail('could not locate previewFor(id) implementation');
const previewSource=explorer.slice(previewStart,previewEnd);
const previewIds=[...previewSource.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)].map(match=>match[1]);
unique(previewIds,'previewFor(id)');
exactIds('dedicated component preview cases',previewIds,componentIds);
if(previewIds.length!==47)fail(`expected exactly 47 dedicated preview cases, received ${previewIds.length}`);
const fallback='Contract registered. Open the live route for full context.';
if(!previewSource.includes(fallback))fail('unknown-component fallback marker must remain explicit for runtime diagnostics');

const blocksStart=explorer.indexOf('const BLOCKS=[');
const blocksEnd=explorer.indexOf('\n];',blocksStart);
if(blocksStart<0||blocksEnd<0)fail('could not locate rendered BLOCKS definitions');
const renderedBlockSource=explorer.slice(blocksStart,blocksEnd);
const renderedBaseBlockIds=[...renderedBlockSource.matchAll(/\bid\s*:\s*['"]([^'"]+)['"]/g)].map(match=>match[1]);
unique(renderedBaseBlockIds,'rendered base block definitions');
exactIds('rendered base block ids',renderedBaseBlockIds,baseBlockDocs.map(block=>block.id));
if(renderedBaseBlockIds.length!==expectedBaseBlockCount)fail(`expected exactly ${expectedBaseBlockCount} base rendered block definitions, received ${renderedBaseBlockIds.length}`);
const renderedBasePreviews=[...renderedBlockSource.matchAll(/\{id\s*:\s*['"]([^'"]+)['"][\s\S]*?\bmarkup\s*:\s*`([^`]*)`\}/g)].map(match=>({id:match[1],markup:match[2]}));
const renderedBasePreviewIds=renderedBasePreviews.map(block=>block.id);
unique(renderedBasePreviewIds,'rendered base block previews');
exactIds('rendered base block preview ids',renderedBasePreviewIds,baseBlockDocs.map(block=>block.id));
if(renderedBasePreviews.length!==expectedBaseBlockCount)fail(`expected exactly ${expectedBaseBlockCount} explicit base block previews, received ${renderedBasePreviews.length}`);
for(const block of renderedBasePreviews){
  requiredText(block.markup,`block ${block.id} live preview markup`);
  if(!/<[a-z][\s\S]*>/i.test(block.markup))fail(`block ${block.id} live preview must contain rendered HTML`);
  if(block.markup.includes(fallback))fail(`block ${block.id} live preview must not use the component fallback`);
}

const promotedListStart=blockExpansion.indexOf('const PROMOTED_BLOCK_IDS=[');
const promotedListEnd=blockExpansion.indexOf('];',promotedListStart);
if(promotedListStart<0||promotedListEnd<0)fail('could not locate PROMOTED_BLOCK_IDS');
const promotedListSource=blockExpansion.slice(promotedListStart,promotedListEnd);
const renderedPromotedIds=[...promotedListSource.matchAll(/['"]([^'"]+)['"]/g)].map(match=>match[1]);
unique(renderedPromotedIds,'promoted rendered block definitions');
exactIds('promoted rendered block ids',renderedPromotedIds,expectedPromotedBlockIds);
const previewMapStart=blockExpansion.indexOf('const BLOCK_PREVIEWS={');
const previewMapEnd=blockExpansion.indexOf('\n};',previewMapStart);
if(previewMapStart<0||previewMapEnd<0)fail('could not locate promoted BLOCK_PREVIEWS');
const promotedPreviewSource=blockExpansion.slice(previewMapStart,previewMapEnd);
const promotedPreviewIds=[...promotedPreviewSource.matchAll(/['"]([^'"]+)['"]\s*:/g)].map(match=>match[1]);
unique(promotedPreviewIds,'promoted block previews');
exactIds('promoted block preview ids',promotedPreviewIds,expectedPromotedBlockIds);
const promotedPreviewMarkupCount=(promotedPreviewSource.match(/`<[\s\S]*?`/g)||[]).length;
if(promotedPreviewMarkupCount!==expectedPromotedBlockIds.length)fail(`expected ${expectedPromotedBlockIds.length} explicit promoted block preview markup literals, received ${promotedPreviewMarkupCount}`);
exactIds('all rendered block ids',[...renderedBaseBlockIds,...renderedPromotedIds],blockIds);
exactIds('all explicit block preview ids',[...renderedBasePreviewIds,...promotedPreviewIds],blockIds);

for(const marker of [
  "fetchJson('./storefront/components.json')",
  "fetchJson('./storefront/component-showcase.json')",
  "fetchJson('./storefront/component-states.json')",
  "fetchJson('./storefront/blocks.json')",
  "dataset.showcaseReady='true'",
  'data-doc-complete',
  'data-state-matrix',
  'data-showcase-state',
  'dataset.blockPreviewFor',
  'dataset.blockMediaState',
  'wireBlockInteractions',
  'live state component ids drifted from frozen registry',
  'component showcase ids drifted from frozen registry',
  'promotedFrom',
  'component subset of compatibility parent'
])if(!showcaseClient.includes(marker))fail(`showcase runtime contract missing marker: ${marker}`);
for(const marker of ['PROMOTED_BLOCK_IDS','PROMOTION_GROUPS','BLOCK_PREVIEWS','block.promotedFrom!==undefined',"'product-media':['product-detail','product-gallery']","'order-success':['order-confirmation']","dataset.promotedBlocksReady='true'"])if(!blockExpansion.includes(marker))fail(`promoted Block runtime contract missing marker: ${marker}`);
for(const marker of ['[data-block-preview-for][data-responsive-mode="contained-scroll"]','[data-block-card][data-responsive-mode="grid-to-stack"]','grid-template-columns:1fr'])if(!showcaseCss.includes(marker))fail(`showcase responsive proof missing marker: ${marker}`);
try{new Function(showcaseClient)}catch(error){fail(`component-showcase.js syntax error: ${error.message}`)}
try{new Function(blockExpansion)}catch(error){fail(`block-expansion.js syntax error: ${error.message}`)}
for(const marker of ['./component-showcase.css','./block-expansion.js','./component-showcase.js','SHOWCASE v1.1','component-showcase.json','blocks.json','24 reusable blocks'])if(!showcaseHtml.includes(marker))fail(`components.html missing v1.1 marker: ${marker}`);

const categoryCounts=Object.fromEntries(expectedCategories.map(category=>[category,docs.filter(doc=>doc.category===category).length]));
if(Object.values(categoryCounts).reduce((sum,count)=>sum+count,0)!==47)fail('component category counts do not sum to 47');

console.log(`NeoBrutal Commerce v${expectedShowcase} showcase contracts passed · 47/47 component previews · 47/47 documented components · ${expectedBlockCount}/${expectedBlockCount} block previews · ${expectedBlockCount}/${expectedBlockCount} documented blocks · ${promotedBlockDocs.length} promoted compatibility Blocks · ${statefulComponents.length} stateful components / ${totalStateExamples} live canonical states`);
