import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const version='1.0.0';
const rcVersion='0.9.0-rc.1';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const write=(file,content)=>fs.writeFileSync(path.join(root,file),content);
const writeJson=(file,value,space=2)=>write(file,`${JSON.stringify(value,null,space)}\n`);
const replaceRequired=(source,from,to,label)=>{
  if(!source.includes(from))throw new Error(`Missing promotion marker in ${label}: ${from}`);
  return source.replace(from,to);
};

const pkg=JSON.parse(read('package.json'));
pkg.version=version;
pkg.private=false;
pkg.style='./src/index.css';
pkg.sideEffects=['**/*.css'];
pkg.files=['src','storefront/catalog.json','storefront/routes.json','storefront/states.json','storefront/components.json','AGENTS.md','LLMS.md','COMPONENTS.md','DESIGN.md','docs','README.md','CHANGELOG.md','LICENSE.md'];
pkg.repository={type:'git',url:'git+https://github.com/NeoBrutalism-shop/NeoBrutal-Commerce.git'};
pkg.homepage='https://github.com/NeoBrutalism-shop/NeoBrutal-Commerce#readme';
pkg.bugs={url:'https://github.com/NeoBrutalism-shop/NeoBrutal-Commerce/issues'};
pkg.keywords=['neobrutalism','design-system','commerce','ecommerce','css','ui','dark-mode','light-mode','tactile-ui','accessibility','react','headless','digital-products','licensing-ui'];
pkg.publishConfig={access:'public',provenance:true};
pkg.scripts['check:package']='node scripts/package-check.mjs';
pkg.scripts.check='npm run check:static && npm run check:docs && npm run check:package && npm run check:release && npm run test:contracts && npm run test:renderers && npm run test:actions && npm run test:integrations && npm run test:ownership && npm run test:performance';
pkg.scripts['pack:dry-run']='npm pack --dry-run --json';
pkg.devDependencies={'@axe-core/playwright':'4.13.0','@playwright/test':'1.63.0'};
pkg.license='PolyForm-Noncommercial-1.0.0';
writeJson('package.json',pkg);

for(const file of ['src/contracts/runtime.js','src/contracts/index.d.ts','tests/contracts-v05.test.mjs','tests/reference-adapter-v05.test.mjs','tests/ownership-v06.test.mjs']){
  const source=read(file);
  if(!source.includes(rcVersion))throw new Error(`${file} is missing ${rcVersion}`);
  write(file,source.replaceAll(rcVersion,version));
}

for(const file of ['storefront/catalog.json','storefront/routes.json','storefront/states.json']){
  const value=JSON.parse(read(file));
  value.version=version;
  writeJson(file,value);
}
const registry=JSON.parse(read('storefront/components.json'));
registry.commerceVersion=version;
writeJson('storefront/components.json',registry,0);

const routeFiles=['index.html','products/index.html','product/soft/index.html','pricing/index.html','cart/index.html','checkout/index.html','order/success/index.html','account/index.html','account/license/demo-soft-team/index.html','components/index.html'];
for(const file of routeFiles){
  let html=read(file);
  html=html.replaceAll('COMMERCE v0.9 RC','COMMERCE v1.0');
  html=html.replaceAll('v0.9.0-rc.1','v1.0.0');
  html=html.replaceAll('v0.9 RC','v1.0');
  if(html.includes('COMMERCE v0.9 RC')||html.includes('v0.9.0-rc.1'))throw new Error(`Stale RC chrome in ${file}`);
  write(file,html);
}

let v09Visual=read('tests/commerce-v09-visual.spec.mjs');
v09Visual=replaceRequired(v09Visual,"  expect(packageManifest.version).toBe('0.9.0-rc.1');\n  expect(baseline.version).toBe(packageManifest.version);","  test.skip(packageManifest.version!=='0.9.0-rc.1','Historical v0.9 RC fingerprints only run against the v0.9 RC package identity.');\n  expect(baseline.version).toBe('0.9.0-rc.1');",'tests/commerce-v09-visual.spec.mjs');
write('tests/commerce-v09-visual.spec.mjs',v09Visual);

let check=read('scripts/check.mjs');
check=replaceRequired(check,"const rcVersion='0.9.0-rc.1';","const releaseVersion='1.0.0';",'scripts/check.mjs version');
check=check.replaceAll('rcVersion','releaseVersion');
check=replaceRequired(check,"'docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md'];","'docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md','docs/PUBLIC-RELEASE.md'];",'scripts/check.mjs adoption files');
check=replaceRequired(check,"'tests/commerce-v02.spec.mjs','tests/commerce-v03.spec.mjs','tests/commerce-v04.spec.mjs','tests/commerce-v06.spec.mjs','tests/commerce-v07.spec.mjs','tests/commerce-v08-visual.spec.mjs','tests/commerce-v09.spec.mjs','tests/commerce-v09-visual.spec.mjs','tests/visual-baselines-v07.json','tests/visual-baselines-v08.json','tests/visual-baselines-v09.json','tests/public-api-v09.json',","'tests/commerce-v02.spec.mjs','tests/commerce-v03.spec.mjs','tests/commerce-v04.spec.mjs','tests/commerce-v06.spec.mjs','tests/commerce-v07.spec.mjs','tests/commerce-v08-visual.spec.mjs','tests/commerce-v09.spec.mjs','tests/commerce-v09-visual.spec.mjs','tests/commerce-v10-visual.spec.mjs','tests/visual-baselines-v07.json','tests/visual-baselines-v08.json','tests/visual-baselines-v09.json','tests/public-api-v09.json','tests/public-api-v10.json',",'scripts/check.mjs tests');
check=replaceRequired(check,"'scripts/performance.mjs','scripts/docs-check.mjs','scripts/release-check.mjs','DESIGN.md'","'scripts/performance.mjs','scripts/docs-check.mjs','scripts/package-check.mjs','scripts/release-check.mjs','DESIGN.md'",'scripts/check.mjs scripts');
check=replaceRequired(check,"'package.json','playwright.config.mjs','.github/workflows/browser-qa.yml'","'package.json','package-lock.json','LICENSE.md','playwright.config.mjs','.github/workflows/browser-qa.yml','.github/workflows/release.yml'",'scripts/check.mjs package files');
check=replaceRequired(check,"if(packageManifest.version!==releaseVersion)fail(`Expected exact v0.9 RC package version ${releaseVersion}, received ${packageManifest.version}`);","if(packageManifest.version!==releaseVersion)fail(`Expected exact v1.0 package version ${releaseVersion}, received ${packageManifest.version}`);\nif(packageManifest.private!==false)fail('v1.0 package must be public');\nif(packageManifest.license!=='PolyForm-Noncommercial-1.0.0')fail('v1.0 package license is not exact');\nif(packageManifest.scripts?.['check:package']!=='node scripts/package-check.mjs')fail('Package tarball conformance script is missing');",'scripts/check.mjs package identity');
check=check.replaceAll('v0.9 release freeze script','v1.0 release freeze script');
check=check.replaceAll('COMMERCE v0.9 RC','COMMERCE v1.0');
check=check.replaceAll('Production route has stale Commerce RC chrome','Production route has stale Commerce v1.0 chrome');
check=check.replaceAll('v0.9 RC runtime version contract missing','v1.0 runtime version contract missing');
check=check.replaceAll('v0.9 RC TypeScript runtime version contract missing','v1.0 TypeScript runtime version contract missing');
check=replaceRequired(check,"if(v09Baseline.version!==releaseVersion||v09Baseline.platform!=='linux')fail('v0.9 RC visual baseline identity/platform must be exact');","if(v09Baseline.version!=='0.9.0-rc.1'||v09Baseline.platform!=='linux')fail('v0.9 RC historical visual baseline identity/platform must remain exact');",'scripts/check.mjs v09 historical baseline');
const v09Marker="const v09Visual=read('tests/commerce-v09-visual.spec.mjs');\nfor(const marker of ['v0.9 RC','visual-baselines-v09.json','createHash','home','product','checkout','account','ownership','chromium','mobile-chromium','pixels drifted from reviewed v0.9 RC baseline'])if(!v09Visual.includes(marker))fail(`v0.9 RC exact visual lock missing: ${marker}`);";
check=replaceRequired(check,v09Marker,`${v09Marker}\nconst v10Visual=read('tests/commerce-v10-visual.spec.mjs');\nfor(const marker of ['v1.0','home','product','checkout','account','ownership','chromium','mobile-chromium'])if(!v10Visual.includes(marker))fail(\`v1.0 visual candidate missing: ${marker}\`);`,'scripts/check.mjs v10 visual');
check=check.replaceAll('RC release file still contains dev version','Release file still contains dev version');
check=check.replaceAll('NeoBrutal Commerce ${releaseVersion} checks passed','NeoBrutal Commerce ${releaseVersion} checks passed');
write('scripts/check.mjs',check);

let docsCheck=read('scripts/docs-check.mjs');
docsCheck=replaceRequired(docsCheck,"'docs/RECIPES.md','docs/THEMING.md','docs/MIGRATION.md','docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md',","'docs/RECIPES.md','docs/THEMING.md','docs/MIGRATION.md','docs/PROVIDER-EXAMPLES.md','docs/RELEASE-CANDIDATE.md','docs/PUBLIC-RELEASE.md',",'scripts/docs-check.mjs required');
docsCheck=replaceRequired(docsCheck,"['v0.5 → v0.6','v0.6 → v0.7','v0.7 → v0.8','v0.8 → v0.9','storefront/components.json','npm run test:browser']","['v0.5 → v0.6','v0.6 → v0.7','v0.7 → v0.8','v0.8 → v0.9','v0.9.0-rc.1 → v1.0.0','storefront/components.json','npm run test:browser']",'scripts/docs-check.mjs migration markers');
docsCheck=docsCheck.replace('NeoBrutal Commerce v0.9 RC adoption docs passed','NeoBrutal Commerce v1.0 adoption docs passed');
write('scripts/docs-check.mjs',docsCheck);

let quality=read('.github/workflows/quality.yml');
quality=quality.replaceAll('actions/checkout@v4','actions/checkout@v6').replaceAll('actions/setup-node@v4','actions/setup-node@v6').replace('node-version: 22','node-version: 24');
quality=replaceRequired(quality,'          node --check scripts/performance.mjs','          node --check scripts/performance.mjs\n          node --check scripts/package-check.mjs\n          node --check scripts/release-check.mjs\n          node --check tests/commerce-v10-visual.spec.mjs','quality syntax');
write('.github/workflows/quality.yml',quality);

let browser=read('.github/workflows/browser-qa.yml');
browser=browser.replaceAll('actions/checkout@v4','actions/checkout@v6').replaceAll('actions/setup-node@v4','actions/setup-node@v6').replace('node-version: 22','node-version: 24');
browser=replaceRequired(browser,'run: npm install --no-audit --no-fund','run: npm ci --ignore-scripts --no-audit --no-fund','browser deterministic install');
write('.github/workflows/browser-qa.yml',browser);

let readme=read('README.md');
readme=replaceRequired(readme,'`0.9.0-rc.1` — release candidate with the public Commerce contract frozen from stable v0.8, connected production-store stress coverage, and fresh canonical visual review before v1.0.','`1.0.0` — public release with the Commerce API frozen through the reviewed v0.9 RC, public npm packaging, source-available noncommercial licensing, trusted-publishing release automation, and the full production quality/browser contract.','README status');
readme=replaceRequired(readme,'## Start here','## Install\n\n```bash\nnpm install @neobrutal/commerce\n```\n\nThe public package is source-available under PolyForm Noncommercial 1.0.0. Commercial use requires a separate written commercial license. See `LICENSE.md` and `docs/PUBLIC-RELEASE.md`.\n\n## Start here','README install');
readme=readme.replace('- `docs/RELEASE-CANDIDATE.md` — v0.9 freeze, stress and final merge gates','- `docs/RELEASE-CANDIDATE.md` — historical v0.9 freeze, stress and merge gates\n- `docs/PUBLIC-RELEASE.md` — v1.0 public package, licensing and publish contract');
readme=readme.replace('- v0.9 public API freeze and connected production storefront stress contract','- v1.0 public API freeze, package tarball contract and connected production storefront stress contract');
readme=readme.replace('- `tests/public-api-v09.json` — v0.9 RC freeze snapshot','- `tests/public-api-v09.json` — historical v0.9 RC freeze snapshot\n- `tests/public-api-v10.json` — v1.0 public API freeze snapshot');
readme=readme.replace('the v0.9 public API freeze','the v1.0 public API freeze and package tarball contract');
readme=replaceRequired(readme,'## License\n\n`UNLICENSED` while the public-core/commercial packaging strategy is finalized.','## License\n\n`PolyForm-Noncommercial-1.0.0` for the public package. See `LICENSE.md` for the canonical terms link and required notice. Commercial use requires a separate written commercial license.','README license');
write('README.md',readme);

const oldChangelog=read('CHANGELOG.md');
const historyAt=oldChangelog.indexOf('## [0.9.0-rc.1]');
if(historyAt<0)throw new Error('Missing v0.9 changelog history');
const history=oldChangelog.slice(historyAt);
write('CHANGELOG.md',`# Changelog\n\nAll notable NeoBrutal Commerce changes are recorded here. v1.0 freezes the public contract that survived the v0.9 release candidate and treats future breaking changes as major-version work.\n\n## [Unreleased]\n\n- Post-v1 changes must preserve the public API freeze unless they are explicitly scheduled for a major release.\n\n## [1.0.0] — Public Release\n\n- Promoted package, runtime, TypeScript declarations, manifests and production route chrome to exact \`1.0.0\` / \`COMMERCE v1.0\` identity.\n- Made \`@neobrutal/commerce\` publicly publishable with an explicit package file allowlist and tarball dry-run verification.\n- Adopted \`PolyForm-Noncommercial-1.0.0\` for the public package; commercial use requires a separate written commercial license.\n- Added npm trusted-publishing/OIDC release automation with provenance-ready public package metadata and no long-lived publish token in the workflow.\n- Added \`package-lock.json\` and exact top-level QA dependency versions for release/install reproducibility.\n- Froze the v1 public API in \`tests/public-api-v10.json\` from the reviewed \`0.9.0-rc.1\` contract with no intentional breaking API change.\n- Preserved v0.9 visual fingerprints as historical provenance and introduced separate v1.0 canonical visual candidates for review and exact fingerprint locking.\n\n${history}`);

let migration=read('docs/MIGRATION.md');
if(!migration.includes('## v0.9.0-rc.1 → v1.0.0')){
  const firstBreak=migration.indexOf('\n');
  const section='\n\n## v0.9.0-rc.1 → v1.0.0\n\nThere is no intentional breaking public API change between the reviewed RC and v1.0. Package/runtime/type/manifest identity moves to `1.0.0`; the npm package becomes public and uses `PolyForm-Noncommercial-1.0.0`. Existing provider adapters and normalized model/action/state identifiers remain frozen.\n\nFor package consumers, install `@neobrutal/commerce@1.0.0` and review `LICENSE.md` before commercial use. The v0.9 visual baseline remains historical; v1.0 has its own canonical visual lock.\n';
  migration=migration.slice(0,firstBreak)+section+migration.slice(firstBreak);
}
write('docs/MIGRATION.md',migration);

for(const file of ['scripts/promote-v10.mjs','scripts/fix-promoter.mjs','scripts/promote-v10-core.mjs','.github/workflows/v10-promote.yml']){
  const target=path.join(root,file);
  if(fs.existsSync(target))fs.rmSync(target);
}

console.log('NeoBrutal Commerce v1.0 existing-file promotion prepared.');
