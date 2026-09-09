import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(`v1.1 showcase: ${message}`);process.exit(1)};

const registry=json('storefront/components.json');
const explorer=read('component-explorer.js');
const components=registry.components||[];
const componentIds=components.map(component=>component.id);

if(componentIds.length!==47)fail(`expected exactly 47 registered components, received ${componentIds.length}`);
if(new Set(componentIds).size!==componentIds.length)fail('component registry contains duplicate ids');

const previewStart=explorer.indexOf('function previewFor(id){');
const previewEnd=explorer.indexOf('\nfunction renderComponent',previewStart);
if(previewStart<0||previewEnd<0)fail('could not locate previewFor(id) implementation');
const previewSource=explorer.slice(previewStart,previewEnd);
const previewIds=[...previewSource.matchAll(/case\s+['"]([^'"]+)['"]\s*:/g)].map(match=>match[1]);
const previewSet=new Set(previewIds);

if(previewSet.size!==previewIds.length)fail('previewFor(id) contains duplicate component cases');
const missing=componentIds.filter(id=>!previewSet.has(id));
const orphaned=previewIds.filter(id=>!componentIds.includes(id));
if(missing.length)fail(`registered components without dedicated previews: ${missing.join(', ')}`);
if(orphaned.length)fail(`dedicated previews without registered components: ${orphaned.join(', ')}`);
if(previewIds.length!==47)fail(`expected exactly 47 dedicated preview cases, received ${previewIds.length}`);

const fallback='Contract registered. Open the live route for full context.';
if(!previewSource.includes(fallback))fail('unknown-component fallback marker must remain explicit for runtime diagnostics');

console.log(`NeoBrutal Commerce v1.1 showcase completeness passed · ${componentIds.length}/${componentIds.length} registered components have dedicated live previews`);
