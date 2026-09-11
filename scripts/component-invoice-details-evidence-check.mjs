import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>{console.error(`v1.1 invoice-details evidence: ${message}`);process.exit(1)};
const same=(a,b)=>[...a].sort().join(',')===[...b].sort().join(',');
const normalize=value=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const required=[
  'storefront/component-variant-evidence-invoice-details.json',
  'storefront/component-demo-implementation-invoice-details.json',
  'storefront/component-showcase.json',
  'storefront/components.json',
  'src/contracts/index.d.ts',
  'src/components/cart.css',
  'src/tokens.css',
  'component-explorer.js',
  'component-invoice-details-evidence.js',
  'components.html'
];
for(const file of required)if(!exists(file))fail(`missing required file: ${file}`);

const variant=json('storefront/component-variant-evidence-invoice-details.json');
const implementation=json('storefront/component-demo-implementation-invoice-details.json');
const showcase=json('storefront/component-showcase.json');
const registry=json('storefront/components.json');
const declarations=read('src/contracts/index.d.ts');
const tokensCss=read('src/tokens.css');
const runtime=read('component-invoice-details-evidence.js');
const html=read('components.html');

if(variant.schema!=='neobrutal-commerce/component-variant-evidence@4'||variant.showcaseVersion!=='1.1.0'||variant.commerceVersion!=='1.0.0'||variant.role!=='variant-evidence-only')fail('variant evidence schema/version/role drifted');
if(variant.batches?.length!==1)fail('variant evidence must expose exactly one residual batch');
const batch=variant.batches[0];
if(batch.id!=='invoice-details-residual'||batch.ordinal!==7||batch.label!=='Invoice details residual'||!same(batch.componentIds||[],['invoice-details']))fail('variant residual batch identity drifted');
if(variant.components?.length!==1||variant.components[0].id!=='invoice-details'||variant.components[0].batchId!==batch.id)fail('variant evidence must cover invoice-details only');
const showcaseInvoice=showcase.components.find(component=>component.id==='invoice-details');
if(!showcaseInvoice)fail('invoice-details showcase authority missing');
const expectedVariants=(showcaseInvoice.variants||[]).map(normalize);
const evidenceVariants=variant.components[0].variants||[];
if(!same(expectedVariants,evidenceVariants.map(item=>item.id))||expectedVariants.join(',')!=='individual,business-invoice,validation')fail('variant evidence does not exactly match documented invoice-details labels');
for(const item of evidenceVariants){
  if(item.id!==normalize(item.label)||item.proofKind!=='rendered')fail(`invalid rendered variant identity: ${item.id}`);
  if(typeof item.markup!=='string'||!item.markup.includes(`data-variant-sample="invoice-details:${item.id}"`))fail(`rendered variant lacks exact sample identity: ${item.id}`);
  if(/<script\b|\son[a-z]+\s*=/i.test(item.markup))fail(`rendered variant must remain declarative: ${item.id}`);
  if(/tax rate|jurisdiction|vat rate|sales tax rate|invoice status\s*[:=-]\s*(?:paid|refunded|void|open)|(?:paid|refunded|void|open) invoice/i.test(item.markup))fail(`rendered variant invents provider-authoritative outcome: ${item.id}`);
}
const individual=evidenceVariants.find(item=>item.id==='individual')?.markup||'';
const business=evidenceVariants.find(item=>item.id==='business-invoice')?.markup||'';
const validation=evidenceVariants.find(item=>item.id==='validation')?.markup||'';
if(!individual.includes('type="checkbox"')||!/not requested/i.test(individual)||!/provider-normalized quote values remain authoritative/i.test(individual))fail('individual invoice variant must prove request-off semantics without tax inference');
if(!business.includes('Company / legal name')||!business.includes('Tax ID')||!/do not predict tax treatment or invoice status/i.test(business))fail('business invoice variant must expose invoice inputs while disclaiming provider outcomes');
if(!validation.includes('required')||!validation.includes('aria-invalid="true"')||!validation.includes('aria-describedby')||!/local input guidance/i.test(validation))fail('validation variant must expose recoverable local input validation');

if(implementation.schema!=='neobrutal-commerce/component-demo-implementation@1'||implementation.showcaseVersion!=='1.1.0'||implementation.commerceVersion!=='1.0.0'||implementation.role!=='implementation-evidence-only'||implementation.batchId!=='invoice-details-residual')fail('implementation evidence identity drifted');
if(implementation.styleImport!=='@neobrutal/commerce/styles.css')fail('implementation evidence must use the frozen public styles import');
if(implementation.components?.length!==1||implementation.components[0].id!=='invoice-details')fail('implementation evidence must cover invoice-details only');
const contract=registry.components.find(component=>component.id==='invoice-details');
if(!contract||contract.kind!=='input'||!same(contract.models||[],['CheckoutQuoteView','InvoiceView'])||(contract.actions||[]).length!==0||(contract.states||[]).length!==0)fail('frozen invoice-details component authority drifted');
if(!declarations.includes('export interface InvoiceDetails{requested:boolean;legalName?:string;billingAddress?:BillingAddress;taxId?:string;}'))fail('InvoiceDetails contract shape drifted');
const evidence=implementation.components[0];
if(!Array.isArray(evidence.sourceFiles)||!same(evidence.sourceFiles,['src/components/cart.css','component-explorer.js','src/contracts/index.d.ts']))fail('invoice-details implementation source set drifted');
const sources=evidence.sourceFiles.map(file=>({file,content:read(file)}));
for(const selector of evidence.selectors||[])if(!sources.some(source=>source.content.includes(selector)))fail(`selector is not present in referenced source: ${selector}`);
const definedTokens=new Set([...tokensCss.matchAll(/(--nbc-[\w-]+)\s*:/g)].map(match=>match[1]));
const cssSource=read('src/components/cart.css');
for(const token of evidence.tokens||[]){
  if(!definedTokens.has(token))fail(`unknown design token: ${token}`);
  if(!cssSource.includes(`var(${token})`))fail(`token is not used by shipping checkout-field CSS: ${token}`);
}
const copy=evidence.copyReady||{};
for(const kind of ['html','css','js'])if(typeof copy[kind]!=='string'||!copy[kind].trim())fail(`missing copy-ready ${kind}`);
if(!copy.html.includes('data-commerce-component="invoice-details"')||!copy.html.includes('data-invoice-request')||!copy.html.includes('autocomplete="organization"'))fail('copy-ready invoice HTML lacks stable request/input anatomy');
if(copy.css.trim()!=="@import '@neobrutal/commerce/styles.css';")fail('copy-ready CSS must use frozen public styles export');
if(/createCommerceAction\s*\(/.test(copy.js))fail('actionless invoice-details must not invent a Commerce action');
if(!copy.js.includes('data-invoice-requested')||!copy.js.includes('setCustomValidity')||!copy.js.includes('legalName.required=requested'))fail('copy-ready JS must model request visibility and recoverable local validation');
if(/tax\s*=|rate\s*=|jurisdiction|invoice\.status|stripe|woocommerce|easy digital downloads/i.test(copy.js))fail('copy-ready JS leaked provider-specific or provider-authoritative outcome logic');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'nbc-invoice-evidence-'));
try{
  const snippet=path.join(temp,'invoice-details.mjs');
  fs.writeFileSync(snippet,copy.js);
  const syntax=spawnSync(process.execPath,['--check',snippet],{encoding:'utf8'});
  if(syntax.status!==0)fail(`copy-ready JS syntax failed: ${(syntax.stderr||syntax.stdout).trim()}`);
}finally{fs.rmSync(temp,{recursive:true,force:true})}

for(const marker of [
  "INVOICE_VARIANT_FILE='./storefront/component-variant-evidence-invoice-details.json'",
  "INVOICE_IMPLEMENTATION_FILE='./storefront/component-demo-implementation-invoice-details.json'",
  "componentVariantAudited==='42'",
  "componentVariantCount==='117'",
  "componentImplementationAudited==='43'",
  "data-invoice-variant-evidence",
  "data-invoice-implementation-evidence",
  "componentInvoiceEvidenceReady='true'",
  "componentInvoiceVariantEvidence='3'",
  "componentInvoiceImplementationEvidence='1'"
])if(!runtime.includes(marker))fail(`invoice evidence runtime missing marker: ${marker}`);
if(runtime.includes("dataset.demoVariantEvidence='true'")||runtime.includes('promoteInvoiceVariantDepth'))fail('invoice evidence-only slice must not silently promote the certified aggregate audit');
if(!html.includes('./component-invoice-details-evidence.js'))fail('components.html does not load invoice-details residual evidence runtime');

console.log('Invoice-details residual evidence passed: exact 3/3 rendered variants + 1 source-backed actionless implementation proof; certified 42/117 System and 43-component implementation checkpoints remain unchanged.');
