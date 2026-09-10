import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const fail=message=>{console.error(message);process.exit(1)};
const same=(a,b)=>[...a].sort().join(',')===[...b].sort().join(',');
const FIRST_BATCH=['product-media','checkout-steps','payment-failure','payment-recovery','processing-state','license-status','update-eligibility','renewal-state','plan-change','ownership-transfer','subscription-management','system-states'];
const SECOND_BATCH=['product-card','badge','price-block','product-detail','product-gallery','license-selector','renewal-note'];
const THIRD_BATCH=['trust-strip','review-summary','testimonials','guarantee','pricing-tier','plan-comparison','bundle-builder'];

const audit=json('storefront/component-demo-depth.json');
const registry=json('storefront/components.json');
const packageManifest=json('package.json');
const tokensCss=read('src/tokens.css');
const batches=audit.implementationBatches||[];
if(batches.length!==3)fail('Component implementation evidence must expose exactly three audited batches');
const first=batches[0],second=batches[1],third=batches[2];
if(first.id!=='stateful-high-risk'||first.ordinal!==1||first.evidenceFile!=='storefront/component-demo-implementation.json'||!same(first.componentIds||[],FIRST_BATCH))fail('First implementation batch provenance drifted');
if(second.id!=='product-storefront'||second.ordinal!==2||second.evidenceFile!=='storefront/component-demo-implementation-product.json'||!same(second.componentIds||[],SECOND_BATCH))fail('Second product/storefront implementation batch provenance drifted');
if(third.id!=='trust-review-pricing'||third.ordinal!==3||third.evidenceFile!=='storefront/component-demo-implementation-trust-pricing.json'||!same(third.componentIds||[],THIRD_BATCH))fail('Third trust/review/pricing implementation batch provenance drifted');
if(!same(audit.nextImplementationBatch||[],FIRST_BATCH))fail('Legacy first implementation batch alias drifted');

const batchFiles=batches.map(batch=>({batch,evidence:json(batch.evidenceFile)}));
const entries=[];
for(const {batch,evidence} of batchFiles){
  if(evidence.schema!=='neobrutal-commerce/component-demo-implementation@1'||evidence.showcaseVersion!=='1.1.0'||evidence.commerceVersion!=='1.0.0'||evidence.role!=='implementation-evidence-only')fail(`Component implementation evidence schema/version/role drifted: ${batch.id}`);
  if(evidence.styleImport!=='@neobrutal/commerce/styles.css'||packageManifest.exports?.['./styles.css']!=='./src/index.css')fail('Copy-ready style import must resolve through the frozen public styles export');
  if(evidence.batchId&&evidence.batchId!==batch.id)fail(`Implementation evidence batch id drifted: ${batch.id}`);
  const ids=(evidence.components||[]).map(entry=>entry.id);
  if(!same(ids,batch.componentIds||[]))fail(`Implementation evidence must cover exact batch membership: ${batch.id}`);
  for(const entry of evidence.components||[])entries.push({...entry,batchId:batch.id});
}
const ids=entries.map(entry=>entry.id);
if(entries.length!==26||new Set(ids).size!==26||!same(ids,[...FIRST_BATCH,...SECOND_BATCH,...THIRD_BATCH]))fail('Accumulated implementation evidence must cover exact 26-component set');

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
    for(const selector of entry.selectors)if(!sources.some(source=>source.content.includes(selector)))fail(`${entry.id} selector is not present in referenced source: ${selector}`);
    if(!Array.isArray(entry.tokens)||entry.tokens.length===0||new Set(entry.tokens).size!==entry.tokens.length)fail(`${entry.id} token map is empty or duplicated`);
    const cssSources=sources.filter(source=>source.file.endsWith('.css'));
    for(const token of entry.tokens){
      if(!/^--nbc-[\w-]+$/.test(token)||!definedTokens.has(token))fail(`${entry.id} references unknown design token: ${token}`);
      if(!cssSources.some(source=>source.content.includes(`var(${token})`)))fail(`${entry.id} token is not used by referenced shipping CSS: ${token}`);
    }
    const copy=entry.copyReady||{};
    for(const kind of ['html','css','js'])if(typeof copy[kind]!=='string'||!copy[kind].trim())fail(`${entry.id} is missing copy-ready ${kind.toUpperCase()}`);
    if(!copy.html.includes(`data-commerce-component="${entry.id}"`))fail(`${entry.id} copy-ready HTML must expose stable component anatomy`);
    if(copy.css.trim()!==`@import '@neobrutal/commerce/styles.css';`)fail(`${entry.id} copy-ready CSS must use the frozen public style export`);
    if(/provider-specific|stripe|easy digital downloads|woocommerce/i.test(copy.html+copy.js))fail(`${entry.id} copy-ready evidence leaked a provider-specific contract`);
    for(const action of component.actions)if(!copy.js.includes(`'${action}'`)&&!copy.js.includes(`"${action}"`))fail(`${entry.id} copy-ready JS is missing canonical action ${action}`);
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
  if(!processingHtml.includes('aria-live="polite"')||!processingHtml.includes('nbc-skeleton'))fail('Processing-state copy-ready evidence must preserve explicit status and loading anatomy');
  const productCardJs=byId.get('product-card')?.copyReady?.js||'';
  if(!productCardJs.includes('cart.add'))fail('Product-card copy-ready evidence must preserve canonical cart.add action');
  const galleryHtml=byId.get('product-gallery')?.copyReady?.html||'';
  if(!galleryHtml.includes('aria-pressed="true"')||!galleryHtml.includes('nbc-gallery-thumb'))fail('Product-gallery copy-ready evidence must preserve keyboard-operable button anatomy');
  const selectorHtml=byId.get('license-selector')?.copyReady?.html||'';
  if(!selectorHtml.includes('type="radio"')||!selectorHtml.includes('checked'))fail('License-selector copy-ready evidence must expose an inspectable selected capacity');

  const trustHtml=byId.get('trust-strip')?.copyReady?.html||'';
  if(!/supplied|verified/i.test(trustHtml)||/secure checkout|guaranteed security/i.test(trustHtml))fail('Trust-strip evidence must remain supplied-data truth, not fabricated trust claims');
  const reviewHtml=byId.get('review-summary')?.copyReady?.html||'';
  const reviewJs=byId.get('review-summary')?.copyReady?.js||'';
  if(/4\.9|128 verified/i.test(reviewHtml)||!reviewJs.includes('rating')||!reviewJs.includes('count'))fail('Review-summary evidence must consume supplied rating/count rather than hard-code social proof');
  const testimonialsHtml=byId.get('testimonials')?.copyReady?.html||'';
  if(!/supplied testimonial|supplied customer/i.test(testimonialsHtml))fail('Testimonials evidence must make supplied content provenance explicit');
  const guaranteeHtml=byId.get('guarantee')?.copyReady?.html||'';
  if(!/policy-backed|supplied refund|without inferring/i.test(guaranteeHtml))fail('Guarantee evidence must preserve policy-data semantics');
  const pricingHtml=byId.get('pricing-tier')?.copyReady?.html||'';
  if(!/production sites/i.test(pricingHtml)||!/months updates/i.test(pricingHtml))fail('Pricing-tier evidence must keep capacity and update term beside the price/action');
  const comparisonHtml=byId.get('plan-comparison')?.copyReady?.html||'';
  if(!comparisonHtml.includes('<table')||!comparisonHtml.includes('tabindex="0"')||!comparisonHtml.includes('scope="col"'))fail('Plan-comparison evidence must remain semantic and keyboard-scrollable');
  const bundleHtml=byId.get('bundle-builder')?.copyReady?.html||'';
  if(!bundleHtml.includes('type="checkbox"')||/type="checkbox"[^>]*checked/i.test(bundleHtml)||!bundleHtml.includes('nbc-bundle-total'))fail('Bundle-builder evidence must start optional extras unselected and keep total inspectable');

  console.log(`Component implementation evidence passed · ${entries.length}/47 components · ${batches.length} batches · ${entries.reduce((sum,entry)=>sum+entry.tokens.length,0)} source-backed token references · ${entries.length*3} copy-ready snippets`);
} finally {
  fs.rmSync(tempDir,{recursive:true,force:true});
}
