import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const components=['button.css','product.css','cart.css','product-detail.css','pricing.css','checkout.css','account.css','license.css','table.css','review.css','media.css','state.css','lifecycle.css','summary.css'];
const storefrontRoutes=['index.html','products/index.html','product/soft/index.html','pricing/index.html','cart/index.html','checkout/index.html','order/success/index.html','account/index.html','account/license/demo-soft-team/index.html','components/index.html'];
const contractFiles=[
  'src/contracts/runtime.js','src/contracts/index.d.ts','src/contracts/README.md',
  'src/actions/runtime.js','src/actions/index.d.ts','src/actions/README.md','src/actions/bindings.js','src/actions/bindings.d.ts',
  'src/adapters/reference.js','src/adapters/reference.d.ts','src/adapters/edd.js','src/adapters/edd.d.ts','src/adapters/licensing-bridge.js','src/adapters/licensing-bridge.d.ts',
  'src/renderers/headless.js','src/renderers/headless.d.ts','src/renderers/react.js','src/renderers/react.d.ts','src/renderers/README.md',
  'src/renderers/action-controls.js','src/renderers/action-controls.d.ts','src/renderers/react-actions.js','src/renderers/react-actions.d.ts',
  'src/renderers/ownership.js','src/renderers/ownership.d.ts','src/renderers/react-ownership.js','src/renderers/react-ownership.d.ts',
  'tests/contracts-v05.test.mjs','tests/reference-adapter-v05.test.mjs','tests/renderers-v05.test.mjs','tests/actions-v05.test.mjs','tests/action-bindings-v05.test.mjs','tests/edd-adapter-v05.test.mjs','tests/ownership-v06.test.mjs','tests/edd-lifecycle-v06.test.mjs'
];
const required=['src/tokens.css','src/base.css','src/index.css',...components.map(file=>`src/components/${file}`),...contractFiles,'demo/index.html','demo/demo.css','demo/demo.js','demo/v02.html','demo/v02.css','demo/v02.js','storefront/store.css','storefront/store.js','storefront/catalog.json','storefront/routes.json','storefront/states.json',...storefrontRoutes,'tests/commerce-v02.spec.mjs','tests/commerce-v03.spec.mjs','tests/commerce-v04.spec.mjs','tests/commerce-v06.spec.mjs','DESIGN.md','LLMS.md','COMPONENTS.md','docs/EDD-MAPPING.md','docs/OWNERSHIP-LIFECYCLE.md','package.json'];
for(const file of required){if(!fs.existsSync(path.join(root,file))){console.error(`Missing required file: ${file}`);process.exit(1);}}

const cssFiles=required.filter(file=>file.endsWith('.css'));
const css=cssFiles.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
if(/transition\s*:\s*all/i.test(css)){console.error('transition: all is prohibited');process.exit(1);}
if(/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css)){console.error('Upward hover lift is prohibited');process.exit(1);}
const storefrontCss=fs.readFileSync(path.join(root,'storefront/store.css'),'utf8');
if(/@import/i.test(storefrontCss)){console.error('Storefront stylesheet must be self-contained');process.exit(1);}
const entry=fs.readFileSync(path.join(root,'src/index.css'),'utf8');
for(const component of components){if(!entry.includes(component)){console.error(`Component stylesheet not exported: ${component}`);process.exit(1);}}
const totalBytes=cssFiles.reduce((sum,file)=>sum+fs.statSync(path.join(root,file)).size,0);
if(totalBytes>116*1024){console.error(`CSS budget exceeded: ${(totalBytes/1024).toFixed(1)} KiB / 116 KiB`);process.exit(1);}

const v02=fs.readFileSync(path.join(root,'demo/v02.html'),'utf8');
for(const marker of ['v02-hero','nbc-gallery-stage','nbc-mini-cart','nbc-checkout-shell','nbc-account','nbc-license-card']){if(!v02.includes(marker)){console.error(`v0.2 workflow marker missing: ${marker}`);process.exit(1);}}

const packageManifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(packageManifest.version!=='0.6.0-dev'){console.error(`Expected v0.6 development package version, received ${packageManifest.version}`);process.exit(1);}
const expectedExports={
  './contracts':['./src/contracts/index.d.ts','./src/contracts/runtime.js'],
  './actions':['./src/actions/index.d.ts','./src/actions/runtime.js'],
  './actions/bindings':['./src/actions/bindings.d.ts','./src/actions/bindings.js'],
  './adapters/reference':['./src/adapters/reference.d.ts','./src/adapters/reference.js'],
  './adapters/edd':['./src/adapters/edd.d.ts','./src/adapters/edd.js'],
  './adapters/licensing-bridge':['./src/adapters/licensing-bridge.d.ts','./src/adapters/licensing-bridge.js'],
  './renderers/headless':['./src/renderers/headless.d.ts','./src/renderers/headless.js'],
  './renderers/react':['./src/renderers/react.d.ts','./src/renderers/react.js'],
  './renderers/action-controls':['./src/renderers/action-controls.d.ts','./src/renderers/action-controls.js'],
  './renderers/react-actions':['./src/renderers/react-actions.d.ts','./src/renderers/react-actions.js'],
  './renderers/ownership':['./src/renderers/ownership.d.ts','./src/renderers/ownership.js'],
  './renderers/react-ownership':['./src/renderers/react-ownership.d.ts','./src/renderers/react-ownership.js']
};
for(const [key,[types,defaultPath]] of Object.entries(expectedExports)){const value=packageManifest.exports?.[key];if(value?.types!==types||value?.default!==defaultPath){console.error(`Package ${key} export is missing or inconsistent`);process.exit(1);}}
if(packageManifest.scripts?.['test:ownership']!=='node --test tests/ownership-v06.test.mjs tests/edd-lifecycle-v06.test.mjs'){console.error('v0.6 ownership test script is missing or changed unexpectedly');process.exit(1);}

const routeManifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/routes.json'),'utf8'));
const catalogManifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/catalog.json'),'utf8'));
const stateManifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/states.json'),'utf8'));
for(const [name,manifest] of Object.entries({routes:routeManifest,catalog:catalogManifest,states:stateManifest})){if(manifest.version!=='0.6.0-dev'){console.error(`Expected v0.6 development ${name} manifest, received ${manifest.version}`);process.exit(1);}}
const routePaths=routeManifest.routes.map(route=>route.path);
for(const route of ['/','/products','/product/soft','/pricing','/cart','/checkout','/order/success','/account','/account/license/:id','/components']){if(!routePaths.includes(route)){console.error(`Production route contract missing: ${route}`);process.exit(1);}}
for(const file of storefrontRoutes){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  if(!html.includes('data-commerce-page')||!html.includes('storefront/store.css')||!html.includes('storefront/store.js')){console.error(`Production route shell contract missing: ${file}`);process.exit(1);}
  if(!html.includes('COMMERCE v0.6')){console.error(`Production route has stale Commerce version chrome: ${file}`);process.exit(1);}
  for(const match of html.matchAll(/<td\b([^>]*)>/g)){if(!/\bdata-label=/.test(match[1])){console.error(`Responsive table cell missing data-label: ${file}`);process.exit(1);}}
}
const productionMarkers={
  'product/soft/index.html':['product-media','review-summary','testimonials','guarantee'],
  'checkout/index.html':['invoice-details','payment-failure','payment-recovery','processing-state'],
  'account/index.html':['license-card','invoice-history'],
  'account/license/demo-soft-team/index.html':['seat-assignment','renewal-state','plan-change','ownership-transfer','subscription-management','ownership-timeline'],
  'components/index.html':['system-states','ownership-lifecycle']
};
for(const [file,markers] of Object.entries(productionMarkers)){const html=fs.readFileSync(path.join(root,file),'utf8');for(const marker of markers){if(!html.includes(`data-commerce-component=\"${marker}\"`)){console.error(`Production component contract missing ${marker}: ${file}`);process.exit(1);}}}

const requiredStates={checkout:['ready','processing','failed','recovered'],system:['empty','loading','error','offline','permission','unsupported'],ownership:['active','grace','expired','cancelled','refunded'],ownershipOperation:['ready','quoted','processing','complete','failed'],subscription:['active','cancel_at_period_end','cancelled','past_due'],media:['preview','code','files']};
for(const [group,ids] of Object.entries(requiredStates)){const actual=new Set((stateManifest[group]||[]).map(state=>state.id));for(const id of ids){if(!actual.has(id)){console.error(`v0.6 state contract missing ${group}:${id}`);process.exit(1);}}}
const soft=catalogManifest.products.find(product=>product.id==='soft');
if(!soft)throw new Error('Production catalog must include the Soft reference product');
if((soft.licenses||[]).map(license=>license.id).join(',')!=='individual,team,agency'){console.error('Unexpected Soft license plan contract');process.exit(1);}
for(const capability of ['plan-changes','transfers','gifts','subscriptions','invoice-history','ownership-history']){if(!(soft.ownershipCapabilities||[]).includes(capability)){console.error(`Soft ownership capability missing: ${capability}`);process.exit(1);}}

const runtime=fs.readFileSync(path.join(root,'src/contracts/runtime.js'),'utf8');
for(const marker of ['OWNERSHIP_OPERATION_STATES','SUBSCRIPTION_STATES','invoiceHistory','subscriptions','planChanges','transfers','ownershipHistory','createCommerceAdapter','createLicensingAdapter','composeCommerceRuntime',"version:'0.6.0-dev'"]){if(!runtime.includes(marker)){console.error(`v0.6 runtime contract missing: ${marker}`);process.exit(1);}}
const declarations=fs.readFileSync(path.join(root,'src/contracts/index.d.ts'),'utf8');
for(const marker of ['interface PlanChangeQuoteView','interface OwnershipTransferView','interface OwnershipEventView','interface SubscriptionView','interface InvoiceView','planChanges:boolean','transfers:boolean','ownershipHistory:boolean',"readonly version:'0.6.0-dev'"]){if(!declarations.includes(marker)){console.error(`v0.6 type contract missing: ${marker}`);process.exit(1);}}
const actions=fs.readFileSync(path.join(root,'src/actions/runtime.js'),'utf8');
for(const marker of ['license.change.quote','license.change.submit','license.transfer.create','license.transfer.cancel','license.history.list','subscription.cancel','subscription.resume','invoice.list']){if(!actions.includes(marker)){console.error(`v0.6 action contract missing: ${marker}`);process.exit(1);}}
const bridge=fs.readFileSync(path.join(root,'src/adapters/licensing-bridge.js'),'utf8');
for(const marker of ['createLicensingBridgeAdapter','quotePlanChange','createTransfer','listOwnershipEvents']){if(!bridge.includes(marker)){console.error(`v0.6 licensing bridge missing: ${marker}`);process.exit(1);}}
const referenceAdapter=fs.readFileSync(path.join(root,'src/adapters/reference.js'),'utf8');
for(const marker of ['invoiceHistory:true','subscriptions:true','planChanges:true','transfers:true','ownershipHistory:true','quotePlanChange','changePlan','createTransfer','listOwnershipEvents','cancelSubscription','resumeSubscription']){if(!referenceAdapter.includes(marker)){console.error(`v0.6 reference lifecycle missing: ${marker}`);process.exit(1);}}
const eddAdapter=fs.readFileSync(path.join(root,'src/adapters/edd.js'),'utf8');
for(const marker of ['normalizeEddInvoice','normalizeEddSubscription','invoiceHistory','subscriptions','listInvoices','cancelSubscription','resumeSubscription']){if(!eddAdapter.includes(marker)){console.error(`v0.6 EDD lifecycle integration missing: ${marker}`);process.exit(1);}}
const ownershipRenderer=fs.readFileSync(path.join(root,'src/renderers/ownership.js'),'utf8');
for(const marker of ['createPlanChangeSpec','createTransferListSpec','createSubscriptionSpec','createInvoiceHistorySpec','createOwnershipTimelineSpec']){if(!ownershipRenderer.includes(marker)){console.error(`v0.6 ownership renderer missing: ${marker}`);process.exit(1);}}
const reactOwnership=fs.readFileSync(path.join(root,'src/renderers/react-ownership.js'),'utf8');
for(const marker of ['createReactOwnershipBindings','PlanChange','TransferList','Subscription','InvoiceHistory','OwnershipTimeline']){if(!reactOwnership.includes(marker)){console.error(`v0.6 React ownership renderer missing: ${marker}`);process.exit(1);}}

console.log(`NeoBrutal Commerce v0.6-dev checks passed · ${(totalBytes/1024).toFixed(1)} KiB CSS · ${components.length} component stylesheets · ${storefrontRoutes.length} production routes · lifecycle contracts + actions + EDD/licensing bridges + ownership renderers`);
