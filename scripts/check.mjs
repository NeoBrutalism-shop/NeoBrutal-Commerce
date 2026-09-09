import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>{console.error(message);process.exit(1)};
const releaseVersion='1.0.0';

const components=['button.css','product.css','cart.css','product-detail.css','pricing.css','checkout.css','account.css','license.css','table.css','review.css','media.css','state.css','lifecycle.css','summary.css'];
const storefrontRoutes=['index.html','products/index.html','product/soft/index.html','pricing/index.html','cart/index.html','checkout/index.html','order/success/index.html','account/index.html','account/license/demo-soft-team/index.html','components/index.html'];
const contractFiles=[
  'src/contracts/runtime.js','src/contracts/index.d.ts','src/contracts/README.md',
  'src/actions/runtime.js','src/actions/index.d.ts','src/actions/README.md','src/actions/bindings.js','src/actions/bindings.d.ts',
  'src/adapters/reference.js','src/adapters/reference.d.ts','src/adapters/edd.js','src/adapters/edd.d.ts','src/adapters/licensing-bridge.js','src/adapters/licensing-bridge.d.ts',
  'src/renderers/headless.js','src/renderers/headless.d.ts','src/renderers/react.js','src/renderers/react.d.ts','src/renderers/README.md',
  'src/renderers/action-controls.js','src/renderers/action-controls.d.ts','src/renderers/react-actions.js','src/renderers/react-actions.d.ts',
  'src/renderers/ownership.js','src/renderers/ownership.d.ts','src/renderers/react-ownership.js','src/renderers/react-ownership.d.ts'
];
const adoptionFiles=['AGENTS.md','LLMS.md','COMPONENTS.md','docs/ADOPTION.md','docs/AGENT-PLAYBOOK.md','docs/AI-COMPONENT-NOTES.md','docs/RECIPES.md','docs/THEMING.md','docs/MIGRATION.md','docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md','docs/PUBLIC-RELEASE.md'];
const required=[
  'src/tokens.css','src/base.css','src/index.css',...components.map(file=>`src/components/${file}`),...contractFiles,
  'demo/index.html','demo/demo.css','demo/demo.js','demo/v02.html','demo/v02.css','demo/v02.js',
  'storefront/store.css','storefront/store.js','storefront/catalog.json','storefront/routes.json','storefront/states.json','storefront/components.json',...storefrontRoutes,
  'tests/contracts-v05.test.mjs','tests/reference-adapter-v05.test.mjs','tests/renderers-v05.test.mjs','tests/actions-v05.test.mjs','tests/action-bindings-v05.test.mjs','tests/edd-adapter-v05.test.mjs','tests/ownership-v06.test.mjs','tests/edd-lifecycle-v06.test.mjs',
  'tests/commerce-v02.spec.mjs','tests/commerce-v03.spec.mjs','tests/commerce-v04.spec.mjs','tests/commerce-v06.spec.mjs','tests/commerce-v07.spec.mjs','tests/commerce-v08-visual.spec.mjs','tests/commerce-v09.spec.mjs','tests/commerce-v09-visual.spec.mjs','tests/commerce-v10-visual.spec.mjs','tests/visual-baselines-v07.json','tests/visual-baselines-v08.json','tests/visual-baselines-v09.json','tests/visual-baselines-v10.json','tests/public-api-v09.json','tests/public-api-v10.json',
  'scripts/performance.mjs','scripts/docs-check.mjs','scripts/package-check.mjs','scripts/release-check.mjs','DESIGN.md','docs/EDD-MAPPING.md','docs/OWNERSHIP-LIFECYCLE.md','CHANGELOG.md','CONTRIBUTING.md','SECURITY.md',...adoptionFiles,
  'package.json','package-lock.json','LICENSE.md','playwright.config.mjs','.github/workflows/browser-qa.yml','.github/workflows/release.yml'
];
const showcaseFiles=['.nojekyll','components.html','component-explorer.css','component-explorer.js','demo/v10.html','demo/v10.css','demo/v10.js','tests/commerce-showcase-v10.spec.mjs'];
for(const file of required)if(!exists(file))fail(`Missing required file: ${file}`);
for(const file of showcaseFiles)if(!exists(file))fail(`Missing permanent showcase file: ${file}`);

const cssFiles=required.filter(file=>file.endsWith('.css'));
const css=cssFiles.map(read).join('\n');
if(/transition\s*:\s*all/i.test(css))fail('transition: all is prohibited');
if(/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css))fail('Upward hover lift is prohibited');
const showcaseCss=['component-explorer.css','demo/v10.css'].map(read).join('\n');
if(/transition\s*:\s*all/i.test(showcaseCss))fail('Showcase transition: all is prohibited');
if(/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(showcaseCss))fail('Showcase upward hover lift is prohibited');
const baseCss=read('src/base.css');
if(!baseCss.includes('.nbc-tactile:active{transform:translate(0,0);box-shadow:0 0 0 var(--nbc-shadow)}'))fail('Touch/coarse tactile active state must consume shadow without moving its hit target');
if(!baseCss.includes('.nbc-tactile:active{transform:translate(var(--nbc-press-hover),var(--nbc-press-hover));box-shadow:0 0 0 var(--nbc-shadow)}'))fail('Fine-pointer tactile active state must stay at the hover-compressed hit position while consuming shadow');
if(/@import/i.test(read('storefront/store.css')))fail('Storefront stylesheet must be self-contained');
const entry=read('src/index.css');
for(const component of components)if(!entry.includes(component))fail(`Component stylesheet not exported: ${component}`);
const totalBytes=cssFiles.reduce((sum,file)=>sum+fs.statSync(path.join(root,file)).size,0);
if(totalBytes>116*1024)fail(`CSS budget exceeded: ${(totalBytes/1024).toFixed(1)} KiB / 116 KiB`);

const packageManifest=json('package.json');
if(packageManifest.version!==releaseVersion)fail(`Expected exact v1.0 package version ${releaseVersion}, received ${packageManifest.version}`);
if(packageManifest.private!==false)fail('v1.0 package must be public');
if(packageManifest.license!=='PolyForm-Noncommercial-1.0.0')fail('v1.0 package license is not exact');
if(packageManifest.scripts?.['check:package']!=='node scripts/package-check.mjs')fail('Package tarball conformance script is missing');
if(packageManifest.scripts?.['check:docs']!=='node scripts/docs-check.mjs')fail('Documentation conformance script is missing');
if(packageManifest.scripts?.['check:release']!=='node scripts/release-check.mjs')fail('v1.0 release freeze script is missing');
if(packageManifest.scripts?.['test:performance']!=='node scripts/performance.mjs')fail('Performance regression script is missing');
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
for(const [key,[types,defaultPath]] of Object.entries(expectedExports)){
  const value=packageManifest.exports?.[key];
  if(value?.types!==types||value?.default!==defaultPath)fail(`Package ${key} export is missing or inconsistent`);
}

const manifests={catalog:json('storefront/catalog.json'),routes:json('storefront/routes.json'),states:json('storefront/states.json')};
for(const [name,manifest] of Object.entries(manifests))if(manifest.version!==releaseVersion)fail(`Expected ${releaseVersion} ${name} manifest, received ${manifest.version}`);
const registry=json('storefront/components.json');
if(registry.commerceVersion!==releaseVersion)fail(`Expected ${releaseVersion} component registry, received ${registry.commerceVersion}`);
if(registry.components.length<40)fail('Component registry is incomplete');

const routePaths=manifests.routes.routes.map(route=>route.path);
for(const route of ['/','/products','/product/soft','/pricing','/cart','/checkout','/order/success','/account','/account/license/:id','/components'])if(!routePaths.includes(route))fail(`Production route contract missing: ${route}`);
for(const file of storefrontRoutes){
  const html=read(file);
  if(!html.includes('data-commerce-page')||!html.includes('storefront/store.css')||!html.includes('storefront/store.js'))fail(`Production route shell contract missing: ${file}`);
  if(!html.includes('COMMERCE v1.0'))fail(`Production route has stale Commerce v1.0 chrome: ${file}`);
  for(const match of html.matchAll(/<td\b([^>]*)>/g))if(!/\bdata-label=/.test(match[1]))fail(`Responsive table cell missing data-label: ${file}`);
}

const requiredStates={checkout:['ready','processing','failed','recovered'],system:['empty','loading','error','offline','permission','unsupported'],ownership:['active','grace','expired','cancelled','refunded'],ownershipOperation:['ready','quoted','processing','complete','failed'],subscription:['active','cancel_at_period_end','cancelled','past_due'],media:['preview','code','files']};
for(const [group,ids] of Object.entries(requiredStates)){
  const actual=new Set((manifests.states[group]||[]).map(state=>state.id));
  for(const id of ids)if(!actual.has(id))fail(`State contract missing ${group}:${id}`);
}
const soft=manifests.catalog.products.find(product=>product.id==='soft');
if(!soft)fail('Production catalog must include Soft');
if((soft.licenses||[]).map(license=>license.id).join(',')!=='individual,team,agency')fail('Unexpected Soft license plan contract');
for(const capability of ['plan-changes','transfers','gifts','subscriptions','invoice-history','ownership-history'])if(!(soft.ownershipCapabilities||[]).includes(capability))fail(`Soft ownership capability missing: ${capability}`);

const runtime=read('src/contracts/runtime.js');
const declarations=read('src/contracts/index.d.ts');
if(!runtime.includes(`version:'${releaseVersion}'`))fail('v1.0 runtime version contract missing');
if(!declarations.includes(`readonly version:'${releaseVersion}'`))fail('v1.0 TypeScript runtime version contract missing');
for(const marker of ['OWNERSHIP_OPERATION_STATES','SUBSCRIPTION_STATES','createCommerceAdapter','createLicensingAdapter','composeCommerceRuntime'])if(!runtime.includes(marker))fail(`Runtime contract missing: ${marker}`);
for(const marker of ['interface PlanChangeQuoteView','interface OwnershipTransferView','interface OwnershipEventView','interface SubscriptionView','interface InvoiceView'])if(!declarations.includes(marker))fail(`Type contract missing: ${marker}`);

const actions=read('src/actions/runtime.js');
for(const marker of ['cart.add','checkout.submit','license.change.quote','license.transfer.create','subscription.cancel','invoice.list'])if(!actions.includes(marker))fail(`Action contract missing: ${marker}`);
const bridge=read('src/adapters/licensing-bridge.js');
for(const marker of ['createLicensingBridgeAdapter','quotePlanChange','createTransfer','listOwnershipEvents'])if(!bridge.includes(marker))fail(`Licensing bridge missing: ${marker}`);
const edd=read('src/adapters/edd.js');
for(const marker of ['normalizeEddInvoice','normalizeEddSubscription','listInvoices','cancelSubscription','resumeSubscription'])if(!edd.includes(marker))fail(`EDD lifecycle integration missing: ${marker}`);
const ownershipRenderer=read('src/renderers/ownership.js');
for(const marker of ['createPlanChangeSpec','createTransferListSpec','createSubscriptionSpec','createInvoiceHistorySpec','createOwnershipTimelineSpec'])if(!ownershipRenderer.includes(marker))fail(`Ownership renderer missing: ${marker}`);

const browserConfig=read('playwright.config.mjs');
for(const marker of ["name:'chromium'","name:'mobile-chromium'","name:'firefox'","name:'webkit'"])if(!browserConfig.includes(marker))fail(`Browser project missing: ${marker}`);
if(!read('.github/workflows/browser-qa.yml').includes('chromium firefox webkit'))fail('Browser workflow must install Chromium, Firefox and WebKit');
const v07=read('tests/commerce-v07.spec.mjs');
for(const marker of ['strict accessibility','keyboard operable','reduced-motion','forced-colors','responsive matrix','layout-shift'])if(!v07.includes(marker))fail(`v0.7 hardening regression missing: ${marker}`);
const v08Visual=read('tests/commerce-v08-visual.spec.mjs');
for(const marker of ['Historical v0.8 fingerprints','visual-baselines-v08.json','home','product','checkout','account','ownership'])if(!v08Visual.includes(marker))fail(`v0.8 historical visual provenance missing: ${marker}`);
const v09Baseline=json('tests/visual-baselines-v09.json');
if(v09Baseline.version!=='0.9.0-rc.1'||v09Baseline.platform!=='linux')fail('v0.9 RC historical visual baseline identity/platform must remain exact');
if(v09Baseline.source?.workflowRun!==34286822589||v09Baseline.source?.headSha!=='d2d7c7a6c64d77914d3c79b8b37f609760ad9df7'||v09Baseline.source?.artifactId!==10079901742)fail('v0.9 RC visual baseline provenance drifted from reviewed Browser QA #94 artifact');
if(v09Baseline.surfaces.map(surface=>surface.id).join(',')!=='home,product,checkout,account,ownership')fail('v0.9 RC visual baseline surfaces are incomplete or reordered');
for(const project of ['chromium','mobile-chromium'])for(const surface of ['home','product','checkout','account','ownership']){
  const entry=v09Baseline.projects?.[project]?.[surface];
  if(!entry||!/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isInteger(entry.width)||!Number.isInteger(entry.height))fail(`v0.9 RC visual fingerprint missing or invalid: ${project}/${surface}`);
}
const v09Visual=read('tests/commerce-v09-visual.spec.mjs');
for(const marker of ['v0.9 RC','visual-baselines-v09.json','createHash','home','product','checkout','account','ownership','chromium','mobile-chromium','pixels drifted from reviewed v0.9 RC baseline'])if(!v09Visual.includes(marker))fail(`v0.9 RC exact visual lock missing: ${marker}`);
const v10Baseline=json('tests/visual-baselines-v10.json');
if(v10Baseline.version!==releaseVersion||v10Baseline.platform!=='linux')fail('v1.0 visual baseline identity/platform must remain exact');
if(v10Baseline.source?.workflowRun!==34304046291||v10Baseline.source?.headSha!=='b48ee9491999ce1c998314f7b709ccfe1a1becd4'||v10Baseline.source?.artifactId!==10086065314)fail('v1.0 visual baseline provenance drifted from reviewed Browser QA #105 artifact');
if(v10Baseline.surfaces.map(surface=>surface.id).join(',')!=='home,product,checkout,account,ownership')fail('v1.0 visual baseline surfaces are incomplete or reordered');
for(const project of ['chromium','mobile-chromium'])for(const surface of ['home','product','checkout','account','ownership']){
  const entry=v10Baseline.projects?.[project]?.[surface];
  if(!entry||!/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isInteger(entry.width)||!Number.isInteger(entry.height))fail(`v1.0 visual fingerprint missing or invalid: ${project}/${surface}`);
}
const v10Visual=read('tests/commerce-v10-visual.spec.mjs');
for(const marker of ['v1.0 canonical visual fingerprints remain stable','visual-baselines-v10.json','createHash','home','product','checkout','account','ownership','chromium','mobile-chromium','pixels drifted from reviewed v1.0 baseline'])if(!v10Visual.includes(marker))fail(`v1.0 exact visual lock missing: ${marker}`);
const v09Stress=read('tests/commerce-v09.spec.mjs');
for(const marker of ['plan-comparison','download-row','invoice-history','Agency applied','Individual scheduled'])if(!v09Stress.includes(marker))fail(`v0.9 production stress coverage missing: ${marker}`);

const flagship=read('index.html');
if((flagship.match(/href="components\.html"/g)||[]).length!==2)fail('Flagship must connect both existing Components entry points to components.html without adding visual chrome');
const explorer=read('components.html');
for(const marker of ['Components + Blocks','47 contracts.','18 blocks','10 pages','componentGrid','blockGrid','demo/v10.html','storefront/components.json'])if(!explorer.includes(marker))fail(`Permanent component explorer missing marker: ${marker}`);
const explorerScript=read('component-explorer.js');
for(const component of registry.components)if(!explorerScript.includes(`'${component.id}'`))fail(`Permanent explorer does not map frozen component: ${component.id}`);
const blockEntries=explorerScript.match(/\{id:'[^']+',title:'[^']+',category:/g)||[];
if(blockEntries.length!==18)fail(`Permanent explorer must expose exactly 18 reviewed composition blocks, received ${blockEntries.length}`);
const lab=read('demo/v10.html');
for(const marker of ['APPLICATION LAB v1.0','REAL ROUTES · NO COPIES','Desktop','Tablet','Mobile','labFrame','components.html'])if(!lab.includes(marker))fail(`Permanent application lab missing marker: ${marker}`);
const labScript=read('demo/v10.js');
for(const marker of ["id:'home'","id:'products'","id:'product'","id:'pricing'","id:'cart'","id:'checkout'","id:'success'","id:'account'","id:'ownership'","id:'system'"])if(!labScript.includes(marker))fail(`Application lab route missing: ${marker}`);
const showcaseSpec=read('tests/commerce-showcase-v10.spec.mjs');
for(const marker of ['47','18','all ten real production routes','WCAG A/AA','horizontal overflow','permanent showcase review surfaces'])if(!showcaseSpec.includes(marker))fail(`Showcase browser contract missing: ${marker}`);
const readme=read('README.md');
for(const marker of ['## Live surfaces','https://neobrutalism-shop.github.io/NeoBrutal-Commerce/','https://neobrutalism-shop.github.io/NeoBrutal-Commerce/components.html','https://neobrutalism-shop.github.io/NeoBrutal-Commerce/demo/v10.html','Any future custom domain is an alias'])if(!readme.includes(marker))fail(`Permanent GitHub Pages documentation missing: ${marker}`);

for(const file of ['package.json','src/contracts/runtime.js','src/contracts/index.d.ts','storefront/catalog.json','storefront/routes.json','storefront/states.json','storefront/components.json','README.md','tests/contracts-v05.test.mjs','tests/reference-adapter-v05.test.mjs','tests/ownership-v06.test.mjs']){
  if(read(file).includes('0.8.0-dev'))fail(`Release file still contains dev version: ${file}`);
}

console.log(`NeoBrutal Commerce ${releaseVersion} checks passed · ${(totalBytes/1024).toFixed(1)} KiB CSS · ${components.length} component stylesheets · ${storefrontRoutes.length} production routes · ${registry.components.length} agent-readable components · 3 permanent GitHub Pages surfaces`);
