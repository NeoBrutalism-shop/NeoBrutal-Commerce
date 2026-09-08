import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const components=['button.css','product.css','cart.css','product-detail.css','pricing.css','checkout.css','account.css','license.css'];
const storefrontRoutes=['index.html','products/index.html','product/soft/index.html','pricing/index.html','cart/index.html','checkout/index.html','order/success/index.html','account/index.html','account/license/demo-soft-team/index.html','components/index.html'];
const required=[
  'src/tokens.css','src/base.css','src/index.css',
  ...components.map(file=>`src/components/${file}`),
  'demo/index.html','demo/demo.css','demo/demo.js','demo/v02.html','demo/v02.css','demo/v02.js',
  'storefront/store.css','storefront/store-core.css','storefront/store.js','storefront/catalog.json','storefront/routes.json',
  ...storefrontRoutes,
  'tests/commerce-v02.spec.mjs','tests/commerce-v03.spec.mjs',
  'DESIGN.md','LLMS.md','COMPONENTS.md','docs/EDD-MAPPING.md'
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

const routeManifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/routes.json'),'utf8'));
const routePaths=routeManifest.routes.map(route=>route.path);
for(const route of ['/','/products','/product/soft','/pricing','/cart','/checkout','/order/success','/account','/account/license/:id','/components']){
  if(!routePaths.includes(route)){
    console.error(`v0.3 route contract missing: ${route}`);
    process.exit(1);
  }
}
for(const file of storefrontRoutes){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  if(!html.includes('data-commerce-page')||!html.includes('storefront/store.css')||!html.includes('storefront/store.js')){
    console.error(`v0.3 route shell contract missing: ${file}`);
    process.exit(1);
  }
}

console.log(`NeoBrutal Commerce checks passed · ${(totalBytes/1024).toFixed(1)} KiB CSS · ${components.length} component stylesheets · ${storefrontRoutes.length} v0.3 routes`);
