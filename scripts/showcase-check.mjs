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
const expectedCategories=['storefront','product','pricing','checkout','account','system'];

for(const file of ['storefront/components.json','storefront/component-showcase.json','storefront/blocks.json','component-explorer.js','component-showcase.js','component-showcase.css','components.html']){
  if(!exists(file))fail(`missing showcase file: ${file}`);
}

const registry=json('storefront/components.json');
const showcase=json('storefront/component-showcase.json');
const blocks=json('storefront/blocks.json');
const explorer=read('component-explorer.js');
const showcaseClient=read('component-showcase.js');
const showcaseHtml=read('components.html');
const components=registry.components||[];
const componentIds=components.map(component=>component.id);
const docs=showcase.components||[];
const docIds=docs.map(component=>component.id);
const blockDocs=blocks.blocks||[];
const blockIds=blockDocs.map(block=>block.id);

if(registry.commerceVersion!==expectedCommerce)fail(`expected Commerce ${expectedCommerce} registry`);
if(showcase.schema!=='neobrutal-commerce/component-showcase@1')fail(`unexpected component showcase schema: ${showcase.schema}`);
if(blocks.schema!=='neobrutal-commerce/blocks@1')fail(`unexpected blocks schema: ${blocks.schema}`);
if(showcase.commerceVersion!==expectedCommerce||blocks.commerceVersion!==expectedCommerce)fail('showcase manifests must target the frozen Commerce v1.0 runtime');
if(showcase.showcaseVersion!==expectedShowcase||blocks.showcaseVersion!==expectedShowcase)fail(`showcase manifests must use exact v${expectedShowcase}`);
if(componentIds.length!==47)fail(`expected exactly 47 registered components, received ${componentIds.length}`);
if(docIds.length!==47)fail(`expected exactly 47 component showcase docs, received ${docIds.length}`);
if(blockIds.length!==18)fail(`expected exactly 18 block showcase docs, received ${blockIds.length}`);
unique(componentIds,'component registry');
unique(docIds,'component showcase');
unique(blockIds,'block showcase');
exactIds('component showcase ids',docIds,componentIds);

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
for(const block of blockDocs){
  validateDoc({...block,variants:['composition']},'block');
  requiredText(block.title,`block ${block.id} title`);
  if(!Array.isArray(block.components)||block.components.length===0)fail(`block ${block.id} must reference component ids`);
  for(const id of block.components)if(!componentIds.includes(id))fail(`block ${block.id} references unknown component ${id}`);
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
const renderedBlockIds=[...renderedBlockSource.matchAll(/\bid\s*:\s*['"]([^'"]+)['"]/g)].map(match=>match[1]);
unique(renderedBlockIds,'rendered block definitions');
exactIds('rendered block ids',renderedBlockIds,blockIds);
if(renderedBlockIds.length!==18)fail(`expected exactly 18 rendered block definitions, received ${renderedBlockIds.length}`);

for(const marker of [
  "fetchJson('./storefront/components.json')",
  "fetchJson('./storefront/component-showcase.json')",
  "fetchJson('./storefront/blocks.json')",
  "dataset.showcaseReady='true'",
  'data-doc-complete',
  'component showcase ids drifted from frozen registry'
])if(!showcaseClient.includes(marker))fail(`showcase runtime contract missing marker: ${marker}`);
try{new Function(showcaseClient)}catch(error){fail(`component-showcase.js syntax error: ${error.message}`)}
for(const marker of ['./component-showcase.css','./component-showcase.js','SHOWCASE v1.1','component-showcase.json','blocks.json'])if(!showcaseHtml.includes(marker))fail(`components.html missing v1.1 marker: ${marker}`);

const categoryCounts=Object.fromEntries(expectedCategories.map(category=>[category,docs.filter(doc=>doc.category===category).length]));
if(Object.values(categoryCounts).reduce((sum,count)=>sum+count,0)!==47)fail('component category counts do not sum to 47');

console.log(`NeoBrutal Commerce v${expectedShowcase} showcase contracts passed · 47/47 component previews · 47/47 documented components · 18/18 documented blocks`);
