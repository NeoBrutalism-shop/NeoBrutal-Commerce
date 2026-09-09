import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const fail=message=>{console.error(`v1.0 package: ${message}`);process.exit(1)};
const packed=spawnSync('npm',['pack','--dry-run','--json','--ignore-scripts'],{cwd:root,encoding:'utf8'});
if(packed.status!==0)fail(`npm pack dry-run failed: ${packed.stderr||packed.stdout}`);
let report;try{report=JSON.parse(packed.stdout)}catch{fail('npm pack --json did not return parseable JSON')}
const entry=report?.[0];
if(!entry)fail('npm pack returned no package report');
if(entry.name!=='@neobrutal/commerce'||entry.version!=='1.0.0')fail(`unexpected pack identity ${entry.name}@${entry.version}`);
const files=new Set((entry.files||[]).map(file=>file.path));
for(const required of ['package.json','README.md','LICENSE.md','src/index.css','src/contracts/runtime.js','src/contracts/index.d.ts','storefront/catalog.json','storefront/routes.json','storefront/states.json','storefront/components.json','docs/ADOPTION.md','AGENTS.md','LLMS.md'])if(!files.has(required))fail(`public tarball missing ${required}`);
const leaked=[...files].filter(file=>file.startsWith('tests/')||file.startsWith('demo/')||file.startsWith('.github/')||/^(account|cart|checkout|components|order|pricing|product|products)\//.test(file)||file==='index.html'||file==='storefront/store.js'||file==='storefront/store.css');
if(leaked.length)fail(`public tarball leaked internal/demo surface: ${leaked.join(', ')}`);
const exportPaths=[];
for(const value of Object.values(pkg.exports||{})){
  if(typeof value==='string')exportPaths.push(value);
  else for(const target of Object.values(value||{}))if(typeof target==='string')exportPaths.push(target);
}
for(const target of exportPaths){
  const normalized=target.replace(/^\.\//,'');
  if(!files.has(normalized))fail(`export target missing from tarball: ${target}`);
}
if(entry.unpackedSize>450*1024)fail(`unpacked npm package budget exceeded: ${entry.unpackedSize} bytes / ${450*1024}`);
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
if(lock.lockfileVersion!==3||lock.version!=='1.0.0'||lock.packages?.['']?.version!=='1.0.0')fail('package-lock identity must be exact v1.0.0 lockfileVersion 3');
console.log(`NeoBrutal Commerce 1.0.0 package dry-run passed · ${files.size} files · ${entry.unpackedSize} unpacked bytes`);
