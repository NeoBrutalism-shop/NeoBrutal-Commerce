import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};

const evidence=json('storefront/component-demo-implementation.json');
const audit=json('storefront/component-demo-depth.json');
const registry=json('storefront/components.json');
const packageManifest=json('package.json');
const tokensCss=read('src/tokens.css');

if(evidence.schema!=='neobrutal-commerce/component-demo-implementation@1'||evidence.showcaseVersion!=='1.1.0'||evidence.commerceVersion!=='1.0.0'||evidence.role!=='implementation-evidence-only')fail('Stateful component implementation evidence schema/version/role drifted');
if(evidence.styleImport!=='@neobrutal/commerce/styles.css'||packageManifest.exports?.['./styles.css']!=='./src/index.css')fail('Copy-ready style import must resolve through the frozen public styles export');

const expected=[...(audit.nextImplementationBatch||[])].sort();
const entries=evidence.components||[];
const ids=entries.map(entry=>entry.id);
if(entries.length!==12||new Set(ids).size!==ids.length||[...ids].sort().join(',')!==expected.join(','))fail('Implementation evidence must cover the exact 12-component first depth batch');
const registryById=new Map(registry.components.map(component=>[component.id,component]));
const definedTokens=new Set([...tokensCss.matchAll(/(--nbc-[\w-]+)\s*:/g)].map(match=>match[1]));
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'nbc-demo-snippets-'));

try{
  for(const entry of entries){
    const component=registryById.get(entry.id);
    if(!component)fail(`Implementation evidence references unknown component: ${entry.id}`);
    if(!Array.isArray(entry.sourceFiles)||entry.sourceFiles.length===0)fail(`${entry.id} has no implementation source files`);
    const sources=[];
    for(const file of entry.sourceFiles){
      const absolute=path.join(root,file);
      if(!fs.existsSync(absolute))fail(`${entry.id} references missing source file: ${file}`);
      sources.push({file,content:read(file)});
    }
    if(!Array.isArray(entry.selectors)||entry.selectors.length===0)fail(`${entry.id} has no source-backed selectors`);
    for(const selector of entry.selectors){
      if(!sources.some(source=>source.content.includes(selector)))fail(`${entry.id} selector is not present in referenced source: ${selector}`);
    }
    if(!Array.isArray(entry.tokens)||entry.tokens.length===0||new Set(entry.tokens).size!==entry.tokens.length)fail(`${entry.id} token map is empty or duplicated`);
    const cssSources=sources.filter(source=>source.file.endsWith('.css'));
    for(const token of entry.tokens){
      if(!/^--nbc-[\w-]+$/.test(token)||!definedTokens.has(token))fail(`${entry.id} references unknown design token: ${token}`);
      if(!cssSources.some(source=>source.content.includes(`var(${token})`)))fail(`${entry.id} token is not used by referenced shipping CSS: ${token}`);
    }

    const copy=entry.copyReady||{};
    for(const kind of ['html','css','js'])if(typeof copy[kind]!=='string'||!copy[kind].trim())fail(`${entry.id} is missing copy-ready ${kind.toUpperCase()}`);
    if(!copy.html.includes(`data-commerce-component=\"${entry.id}\"`))fail(`${entry.id} copy-ready HTML must expose stable component anatomy`);
    if(copy.css.trim()!==`@import '${evidence.styleImport}';`)fail(`${entry.id} copy-ready CSS must use the frozen public style export`);
    if(/provider-specific|stripe|easy digital downloads|woocommerce/i.test(copy.html+copy.js))fail(`${entry.id} copy-ready evidence leaked a provider-specific contract`);

    for(const action of component.actions){
      if(!copy.js.includes(`'${action}'`)&&!copy.js.includes(`\"${action}\"`))fail(`${entry.id} copy-ready JS is missing canonical action ${action}`);
    }
    if(component.actions.length===0&&/createCommerceAction\s*\(/.test(copy.js))fail(`${entry.id} is actionless but copy-ready JS invents a Commerce mutation`);

    const snippetFile=path.join(tempDir,`${entry.id}.mjs`);
    fs.writeFileSync(snippetFile,copy.js);
    const syntax=spawnSync(process.execPath,['--check',snippetFile],{encoding:'utf8'});
    if(syntax.status!==0)fail(`${entry.id} copy-ready JS syntax failed: ${(syntax.stderr||syntax.stdout).trim()}`);
  }

  const byId=new Map(entries.map(entry=>[entry.id,entry]));
  const planJs=byId.get('plan-change')?.copyReady?.js||'';
  if(planJs.indexOf('license.change.quote')<0||planJs.indexOf('license.change.submit')<0||planJs.indexOf('license.change.quote')>planJs.indexOf('license.change.submit'))fail('Plan-change copy-ready evidence must quote before mutation');
  const transferHtml=byId.get('ownership-transfer')?.copyReady?.html||'';
  if(!/pending invitation does not mean ownership moved/i.test(transferHtml))fail('Ownership-transfer copy-ready evidence must preserve invitation versus ownership semantics');
  const subscriptionHtml=byId.get('subscription-management')?.copyReady?.html||'';
  if(!/already-paid access|already paid access|paid access/i.test(subscriptionHtml))fail('Subscription copy-ready evidence must preserve paid-term access semantics');
  const processingHtml=byId.get('processing-state')?.copyReady?.html||'';
  if(!processingHtml.includes('aria-live=\"polite\"')||!processingHtml.includes('nbc-skeleton'))fail('Processing-state copy-ready evidence must preserve explicit status and loading anatomy');

  console.log(`Stateful component implementation evidence passed · ${entries.length}/${expected.length} components · ${entries.reduce((sum,entry)=>sum+entry.tokens.length,0)} source-backed token references · ${entries.length*3} copy-ready snippets`);
} finally {
  fs.rmSync(tempDir,{recursive:true,force:true});
}
