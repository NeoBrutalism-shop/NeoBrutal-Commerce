import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>{console.error(`v1.3 interactions: ${message}`);process.exit(1)};
const requiredText=(value,label)=>{if(typeof value!=='string'||!value.trim())fail(`${label} must be a non-empty string`)};
const unique=(values,label)=>{if(new Set(values).size!==values.length)fail(`${label} contains duplicates`)};
const same=(label,actual,expected)=>{
  if(JSON.stringify(actual)!==JSON.stringify(expected))fail(`${label} drifted\nactual: ${JSON.stringify(actual)}\nexpected: ${JSON.stringify(expected)}`);
};
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

const requiredFiles=[
  'storefront/interactions.json','src/tokens.css','src/base.css','src/components/media.css','src/components/state.css',
  'storefront/store.js','tests/commerce-v07.spec.mjs','DESIGN.md','README.md','package.json'
];
for(const file of requiredFiles)if(!exists(file))fail(`missing interaction evidence: ${file}`);

const contract=json('storefront/interactions.json');
const pkg=json('package.json');
const tokensCss=read('src/tokens.css');
const baseCss=read('src/base.css');
const mediaCss=read('src/components/media.css');
const stateCss=read('src/components/state.css');
const storeJs=read('storefront/store.js');
const design=read('DESIGN.md');
const readme=read('README.md');

if(contract.schema!=='neobrutal-commerce/interactions@1')fail(`unexpected schema: ${contract.schema}`);
if(contract.interactionVersion!=='1.3.0')fail(`interaction contract must use exact 1.3.0, received ${contract.interactionVersion}`);
if(contract.commerceVersion!=='1.0.0')fail(`interaction contract must target frozen Commerce 1.0.0, received ${contract.commerceVersion}`);
if(pkg.version!=='1.0.0')fail(`package runtime must remain frozen at 1.0.0, received ${pkg.version}`);

const expectedPrinciples=['compress-never-float','cause-state-result','motion-never-carries-meaning','respect-user-preferences'];
const principles=contract.principles||[];
same('principle ids',principles.map(item=>item.id),expectedPrinciples);
unique(principles.map(item=>item.id),'principle ids');
for(const principle of principles)requiredText(principle.description,`principle ${principle.id} description`);

const expectedTokens={
  depth:'--nbc-depth',
  hoverCompression:'--nbc-press-hover',
  activeCompression:'--nbc-press-active',
  pressEase:'--nbc-ease-press',
  releaseEase:'--nbc-ease-release',
  fast:'--nbc-motion-fast',
  standard:'--nbc-motion-standard'
};
same('interaction token bindings',contract.tokens,expectedTokens);
const expectedTokenValues={
  '--nbc-depth':'6px',
  '--nbc-press-hover':'3px',
  '--nbc-press-active':'6px',
  '--nbc-ease-press':'cubic-bezier(.2,.7,.2,1)',
  '--nbc-ease-release':'cubic-bezier(.16,1,.3,1)',
  '--nbc-motion-fast':'100ms',
  '--nbc-motion-standard':'180ms'
};
for(const [token,expected] of Object.entries(expectedTokenValues)){
  const match=tokensCss.match(new RegExp(`${escapeRegExp(token)}\\s*:\\s*([^;]+);`));
  if(!match)fail(`missing token declaration ${token}`);
  if(match[1].trim()!==expected)fail(`${token} drifted from interaction contract: ${match[1].trim()} !== ${expected}`);
}

const expectedPatternIds=['tactile-press','latched-selection','processing-feedback','result-feedback'];
const allowedKinds=['direct-manipulation','selection','status','state-change'];
const patterns=contract.patterns||[];
same('pattern ids',patterns.map(item=>item.id),expectedPatternIds);
unique(patterns.map(item=>item.id),'pattern ids');
for(const pattern of patterns){
  requiredText(pattern.title,`pattern ${pattern.id} title`);
  requiredText(pattern.description,`pattern ${pattern.id} description`);
  requiredText(pattern.selector,`pattern ${pattern.id} selector`);
  requiredText(pattern.reducedMotion,`pattern ${pattern.id} reducedMotion`);
  requiredText(pattern.forcedColors,`pattern ${pattern.id} forcedColors`);
  if(!allowedKinds.includes(pattern.kind))fail(`pattern ${pattern.id} has unknown kind ${pattern.kind}`);
  for(const field of ['triggers','inputs','states','tokenRoles','programmaticState','evidence'])if(!Array.isArray(pattern[field]))fail(`pattern ${pattern.id} missing ${field} array`);
  if(pattern.triggers.length===0||pattern.inputs.length===0||pattern.states.length===0||pattern.evidence.length===0)fail(`pattern ${pattern.id} has incomplete interaction evidence`);
  unique(pattern.triggers,`pattern ${pattern.id} triggers`);
  unique(pattern.inputs,`pattern ${pattern.id} inputs`);
  unique(pattern.states,`pattern ${pattern.id} states`);
  unique(pattern.tokenRoles,`pattern ${pattern.id} tokenRoles`);
  unique(pattern.programmaticState,`pattern ${pattern.id} programmaticState`);
  for(const role of pattern.tokenRoles)if(!(role in expectedTokens))fail(`pattern ${pattern.id} references unknown token role ${role}`);
  for(const evidence of pattern.evidence){
    requiredText(evidence.file,`pattern ${pattern.id} evidence file`);
    requiredText(evidence.marker,`pattern ${pattern.id} evidence marker`);
    if(!exists(evidence.file))fail(`pattern ${pattern.id} evidence file does not exist: ${evidence.file}`);
    if(!read(evidence.file).includes(evidence.marker))fail(`pattern ${pattern.id} evidence marker missing from ${evidence.file}: ${evidence.marker}`);
  }
}

const patternMap=new Map(patterns.map(pattern=>[pattern.id,pattern]));
same('tactile token roles',patternMap.get('tactile-press').tokenRoles,Object.keys(expectedTokens));
same('latched programmatic state',patternMap.get('latched-selection').programmaticState,['aria-selected']);
same('result programmatic state',patternMap.get('result-feedback').programmaticState,['data-state','data-subscription-state']);

for(const marker of [
  '.nbc-tactile:active{transform:translate(0,0);box-shadow:0 0 0 var(--nbc-shadow)}',
  '.nbc-tactile:hover{transform:translate(var(--nbc-press-hover),var(--nbc-press-hover));box-shadow:calc(var(--nbc-depth) - var(--nbc-press-hover)) calc(var(--nbc-depth) - var(--nbc-press-hover)) 0 var(--nbc-shadow)}',
  '.nbc-tactile:active{transform:translate(var(--nbc-press-hover),var(--nbc-press-hover));box-shadow:0 0 0 var(--nbc-shadow)}',
  '@media(prefers-reduced-motion:reduce)',
  '@media(forced-colors:active)'
])if(!baseCss.includes(marker))fail(`tactile physics marker missing: ${marker}`);
if(!mediaCss.includes('.nbc-media-tab[aria-selected="true"]'))fail('latched media selection styling is missing');
for(const marker of ['ArrowLeft','ArrowRight','aria-selected'])if(!storeJs.includes(marker))fail(`keyboard/programmatic selection marker missing: ${marker}`);
for(const marker of ['@keyframes nbc-skeleton-shift','@media(prefers-reduced-motion:reduce){.nbc-skeleton span{animation:none}}','@media(forced-colors:active)'])if(!stateCss.includes(marker))fail(`processing feedback marker missing: ${marker}`);
for(const marker of ['setLifecycleBadge','data-subscription-state'])if(!storeJs.includes(marker))fail(`result feedback marker missing: ${marker}`);

const cssFiles=['src/base.css',...fs.readdirSync(path.join(root,'src/components')).filter(file=>file.endsWith('.css')).map(file=>`src/components/${file}`)];
const css=cssFiles.map(read).join('\n');
if(/transition\s*:\s*all/i.test(css))fail('transition: all is prohibited by the interaction contract');
if(/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css))fail('ordinary upward hover lift is prohibited by the interaction contract');

const exceptions=contract.exceptions||[];
same('interaction exception ids',exceptions.map(item=>item.id),['drag-lift']);
const drag=exceptions[0];
requiredText(drag.description,'drag-lift description');
if(drag.productionPattern!==false)fail('drag-lift must not claim a production pattern until a real draggable interaction exists');
if(!Array.isArray(drag.evidence)||drag.evidence.length===0)fail('drag-lift must cite its design-law evidence');
for(const evidence of drag.evidence){
  if(!exists(evidence.file)||!read(evidence.file).includes(evidence.marker))fail(`drag-lift evidence is stale: ${evidence.file} → ${evidence.marker}`);
}

for(const marker of ['Compress, never float.','Motion communicates cause, state and result.'])if(!design.includes(marker))fail(`DESIGN.md interaction law missing: ${marker}`);
for(const marker of ['Motion & Interaction v1.3','storefront/interactions.json','scripts/interactions-check.mjs'])if(!readme.includes(marker))fail(`README missing v1.3 interaction marker: ${marker}`);
if(pkg.files?.includes('storefront/interactions.json'))fail('v1.3 documentation contract must stay outside the frozen v1.0 npm package files allowlist');
if(pkg.exports?.['./interactions'])fail('v1.3 documentation contract must not create a new v1.0 package export');
if(pkg.scripts?.['check:interactions']!=='node scripts/interactions-check.mjs')fail('check:interactions script is missing');
if(!String(pkg.scripts?.check||'').includes('npm run check:interactions'))fail('main Quality chain does not include check:interactions');

console.log(`NeoBrutal Commerce Interaction v${contract.interactionVersion} passed · ${principles.length} principles · ${patterns.length} production interaction patterns · 1 drag-lift exception · frozen Commerce ${contract.commerceVersion} API preserved`);
