import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const components=['button.css','product.css','cart.css','product-detail.css','pricing.css','checkout.css','account.css','license.css','table.css','review.css','media.css','state.css','lifecycle.css','summary.css'];
const storefrontRoutes=['index.html','products/index.html','product/soft/index.html','pricing/index.html','cart/index.html','checkout/index.html','order/success/index.html','account/index.html','account/license/demo-soft-team/index.html','components/index.html'];
const contractFiles=[
  'src/contracts/runtime.js','src/contracts/index.d.ts','src/contracts/README.md',
  'src/actions/runtime.js','src/actions/index.d.ts','src/actions/README.md','src/actions/bindings.js','src/actions/bindings.d.ts',
  'src/adapters/reference.js','src/adapters/reference.d.ts','src/adapters/edd.js','src/adapters/edd.d.ts',
  'src/renderers/headless.js','src/renderers/headless.d.ts','src/renderers/react.js','src/renderers/react.d.ts','src/renderers/README.md',
  'src/renderers/action-controls.js','src/renderers/action-controls.d.ts','src/renderers/react-actions.js','src/renderers/react-actions.d.ts',
  'tests/contracts-v05.test.mjs','tests/reference-adapter-v05.test.mjs','tests/renderers-v05.test.mjs','tests/actions-v05.test.mjs',
  'tests/action-bindings-v05.test.mjs','tests/edd-adapter-v05.test.mjs'
];
const required=[
  'src/tokens.css','src/base.css','src/index.css',
  ...components.map(file=>`src/components/${file}`),
  ...contractFiles,
  'demo/index.html','demo/demo.css','demo/demo.js','demo/v02.html','demo/v02.css','demo/v02.js',
  'storefront/store.css','storefront/store.js','storefront/catalog.json','storefront/routes.json','storefront/states.json',
  ...storefrontRoutes,
  'tests/commerce-v02.spec.mjs','tests/commerce-v03.spec.mjs','tests/commerce-v04.spec.mjs',
  'DESIGN.md','LLMS.md','COMPONENTS.md','docs/EDD-MAPPING.md','package.json'
];

for(const file of required){
  if(!fs.existsSync(path.join(root,file))){
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}

const cssFiles=required.filter(file=>file.endsWith('.css'));
const css=cssFiles.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
if(/transition\s*:\s*all/i.test(css)){
  console.error('transition: all is prohibited');
  process.exit(1);
}
if(/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css)){
  console.error('Upward hover lift is prohibited');
  process.exit(1);
}
const storefrontCss=fs.readFileSync(path.join(root,'storefront/store.css'),'utf8');
if(/@import/i.test(storefrontCss)){
  console.error('Storefront stylesheet must be self-contained to keep route asset resolution context-stable');
  process.exit(1);
}

const entry=fs.readFileSync(path.join(root,'src/index.css'),'utf8');
for(const component of components){
  if(!entry.includes(component)){
    console.error(`Component stylesheet not exported: ${component}`);
    process.exit(1);
  }
}

const totalBytes=cssFiles.reduce((sum,file)=>sum+fs.statSync(path.join(root,file)).size,0);
if(totalBytes>112*1024){
  console.error(`CSS budget exceeded: ${(totalBytes/1024).toFixed(1)} KiB / 112 KiB`);
  process.exit(1);
}

const v02=fs.readFileSync(path.join(root,'demo/v02.html'),'utf8');
for(const marker of ['v02-hero','nbc-gallery-stage','nbc-mini-cart','nbc-checkout-shell','nbc-account','nbc-license-card']){
  if(!v02.includes(marker)){
    console.error(`v0.2 workflow marker missing: ${marker}`);
    process.exit(1);
  }
}

const packageManifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(packageManifest.version!=='0.5.0'){
  console.error(`Expected stable v0.5.0 package version, received ${packageManifest.version}`);
  process.exit(1);
}
const expectedExports={
  './contracts':['./src/contracts/index.d.ts','./src/contracts/runtime.js'],
  './actions':['./src/actions/index.d.ts','./src/actions/runtime.js'],
  './actions/bindings':['./src/actions/bindings.d.ts','./src/actions/bindings.js'],
  './adapters/reference':['./src/adapters/reference.d.ts','./src/adapters/reference.js'],
  './adapters/edd':['./src/adapters/edd.d.ts','./src/adapters/edd.js'],
  './renderers/headless':['./src/renderers/headless.d.ts','./src/renderers/headless.js'],
  './renderers/react':['./src/renderers/react.d.ts','./src/renderers/react.js'],
  './renderers/action-controls':['./src/renderers/action-controls.d.ts','./src/renderers/action-controls.js'],
  './renderers/react-actions':['./src/renderers/react-actions.d.ts','./src/renderers/react-actions.js']
};
for(const [key,[types,defaultPath]] of Object.entries(expectedExports)){
  const value=packageManifest.exports?.[key];
  if(value?.types!==types||value?.default!==defaultPath){
    console.error(`Package ${key} export is missing or inconsistent`);
    process.exit(1);
  }
}
if(packageManifest.scripts?.['test:contracts']!=='node --test tests/contracts-v05.test.mjs tests/reference-adapter-v05.test.mjs'){
  console.error('v0.5 contract/reference test script is missing or changed unexpectedly');
  process.exit(1);
}
if(packageManifest.scripts?.['test:renderers']!=='node --test tests/renderers-v05.test.mjs'){
  console.error('v0.5 renderer test script is missing or changed unexpectedly');
  process.exit(1);
}
if(packageManifest.scripts?.['test:actions']!=='node --test tests/actions-v05.test.mjs'){
  console.error('v0.5 action test script is missing or changed unexpectedly');
  process.exit(1);
}
if(packageManifest.scripts?.['test:integrations']!=='node --test tests/action-bindings-v05.test.mjs tests/edd-adapter-v05.test.mjs'){
  console.error('v0.5 integration test script is missing or changed unexpectedly');
  process.exit(1);
}

const routeManifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/routes.json'),'utf8'));
const catalogManifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/catalog.json'),'utf8'));
const stateManifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/states.json'),'utf8'));
for(const [name,manifest] of Object.entries({routes:routeManifest,catalog:catalogManifest,states:stateManifest})){
  if(manifest.version!=='0.5.0'){
    console.error(`Expected stable v0.5.0 ${name} manifest, received ${manifest.version}`);
    process.exit(1);
  }
}

const routePaths=routeManifest.routes.map(route=>route.path);
for(const route of ['/','/products','/product/soft','/pricing','/cart','/checkout','/order/success','/account','/account/license/:id','/components']){
  if(!routePaths.includes(route)){
    console.error(`Production route contract missing: ${route}`);
    process.exit(1);
  }
}
for(const file of storefrontRoutes){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  if(!html.includes('data-commerce-page')||!html.includes('storefront/store.css')||!html.includes('storefront/store.js')){
    console.error(`Production route shell contract missing: ${file}`);
    process.exit(1);
  }
  for(const match of html.matchAll(/<td\b([^>]*)>/g)){
    if(!/\bdata-label=/.test(match[1])){
      console.error(`Responsive table cell missing data-label: ${file}`);
      process.exit(1);
    }
  }
}

const productionMarkers={
  'product/soft/index.html':['product-media','review-summary','testimonials','guarantee'],
  'checkout/index.html':['invoice-details','payment-failure','payment-recovery','processing-state'],
  'account/license/demo-soft-team/index.html':['seat-assignment','renewal-state'],
  'components/index.html':['system-states','ownership-lifecycle']
};
for(const [file,markers] of Object.entries(productionMarkers)){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const marker of markers){
    if(!html.includes(`data-commerce-component=\"${marker}\"`)){
      console.error(`Production component contract missing ${marker}: ${file}`);
      process.exit(1);
    }
  }
}

const requiredStates={checkout:['ready','processing','failed','recovered'],system:['empty','loading','error','offline','permission','unsupported'],ownership:['active','grace','expired','cancelled','refunded'],media:['preview','code','files']};
for(const [group,ids] of Object.entries(requiredStates)){
  const actual=new Set((stateManifest[group]||[]).map(state=>state.id));
  for(const id of ids){
    if(!actual.has(id)){
      console.error(`v0.5 state contract missing ${group}:${id}`);
      process.exit(1);
    }
  }
}

const soft=catalogManifest.products.find(product=>product.id==='soft');
if(!soft){
  console.error('Production catalog must include the Soft reference product');
  process.exit(1);
}
const planIds=(soft.licenses||[]).map(license=>license.id);
if(planIds.join(',')!=='individual,team,agency'){
  console.error(`Unexpected Soft license plan contract: ${planIds.join(',')}`);
  process.exit(1);
}

const runtime=fs.readFileSync(path.join(root,'src/contracts/runtime.js'),'utf8');
for(const marker of ['CHECKOUT_STATES','SYSTEM_STATES','OWNERSHIP_STATES','MEDIA_STATES','createCommerceAdapter','createLicensingAdapter','composeCommerceRuntime',"version:'0.5.0'"]){
  if(!runtime.includes(marker)){
    console.error(`v0.5 runtime contract missing: ${marker}`);
    process.exit(1);
  }
}
const declarations=fs.readFileSync(path.join(root,'src/contracts/index.d.ts'),'utf8');
for(const marker of ['interface ProductView','interface CartView','interface CheckoutQuoteView','interface OrderView','interface LicenseView','interface EntitlementView','interface CommerceAdapter','interface LicensingAdapter',"readonly version:'0.5.0'"]){
  if(!declarations.includes(marker)){
    console.error(`v0.5 type contract missing: ${marker}`);
    process.exit(1);
  }
}
const actions=fs.readFileSync(path.join(root,'src/actions/runtime.js'),'utf8');
for(const marker of ['ACTION_TYPES','createCommerceAction','executeCommerceAction','createActionDispatcher','cart.add','checkout.submit','seat.assign','license.renew','download.create']){
  if(!actions.includes(marker)){
    console.error(`v0.5 action contract missing: ${marker}`);
    process.exit(1);
  }
}
const actionBindings=fs.readFileSync(path.join(root,'src/actions/bindings.js'),'utf8');
for(const marker of ['createActionAttributes','readCommerceAction','createActionHandler','bindCommerceActions']){
  if(!actionBindings.includes(marker)){
    console.error(`v0.5 action binding missing: ${marker}`);
    process.exit(1);
  }
}
const referenceAdapter=fs.readFileSync(path.join(root,'src/adapters/reference.js'),'utf8');
for(const marker of ['createReferenceCommerceAdapter','createReferenceLicensingAdapter','createReferenceRuntime','requestRefund','assignSeat','createSignedDownload','composeCommerceRuntime']){
  if(!referenceAdapter.includes(marker)){
    console.error(`v0.5 reference adapter missing: ${marker}`);
    process.exit(1);
  }
}
const eddAdapter=fs.readFileSync(path.join(root,'src/adapters/edd.js'),'utf8');
for(const marker of ['createEddCommerceAdapter','normalizeEddProduct','normalizeEddCart','normalizeEddQuote','normalizeEddOrder','normalizeEddCheckoutState','normalizeEddOrderStatus']){
  if(!eddAdapter.includes(marker)){
    console.error(`v0.5 EDD adapter missing: ${marker}`);
    process.exit(1);
  }
}
const headlessRenderer=fs.readFileSync(path.join(root,'src/renderers/headless.js'),'utf8');
for(const marker of ['createProductCardSpec','createOrderSummarySpec','createSystemStateSpec','createLicenseCardSpec','createSeatAssignmentSpec','createActivationListSpec','renderSpecToHtml']){
  if(!headlessRenderer.includes(marker)){
    console.error(`v0.5 headless renderer missing: ${marker}`);
    process.exit(1);
  }
}
const reactRenderer=fs.readFileSync(path.join(root,'src/renderers/react.js'),'utf8');
for(const marker of ['renderSpecWithReact','createReactBindings','ProductCard','OrderSummary','SystemState','LicenseCard','SeatAssignment','ActivationList']){
  if(!reactRenderer.includes(marker)){
    console.error(`v0.5 React renderer missing: ${marker}`);
    process.exit(1);
  }
}
const actionControls=fs.readFileSync(path.join(root,'src/renderers/action-controls.js'),'utf8');
for(const marker of ['createCommerceActionButtonSpec','createCommerceActionLinkSpec','createProductActionCardSpec','bindActionSpec']){
  if(!actionControls.includes(marker)){
    console.error(`v0.5 renderer action control missing: ${marker}`);
    process.exit(1);
  }
}
const reactActions=fs.readFileSync(path.join(root,'src/renderers/react-actions.js'),'utf8');
for(const marker of ['createReactActionBindings','ActionButton','ActionLink','ProductActionCard']){
  if(!reactActions.includes(marker)){
    console.error(`v0.5 React action binding missing: ${marker}`);
    process.exit(1);
  }
}

for(const file of ['package.json','src/contracts/runtime.js','src/contracts/index.d.ts','src/adapters/reference.js','storefront/catalog.json','storefront/routes.json','storefront/states.json']){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  if(text.includes('0.5.0-dev')){
    console.error(`Stable v0.5 release file still contains dev version: ${file}`);
    process.exit(1);
  }
}

console.log(`NeoBrutal Commerce v0.5.0 checks passed · ${(totalBytes/1024).toFixed(1)} KiB CSS · ${components.length} component stylesheets · ${storefrontRoutes.length} production routes · typed adapters + renderers + actions + EDD integration`);
