import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>{console.error(message);process.exit(1)};

for(const file of ['showcase-fixes.css','components.html','components/index.html','package.json']){
  if(!exists(file))fail(`Showcase hardening file missing: ${file}`);
}

const css=read('showcase-fixes.css');
const compact=css.replace(/\s+/g,'');
const explorer=read('components.html');
const system=read('components/index.html');
const manifest=JSON.parse(read('package.json'));
const link='showcase-fixes.css';

if(!explorer.includes(`./${link}`))fail('Component explorer must load showcase-fixes.css');
if(!system.includes(link))fail('System showcase must load showcase-fixes.css');

const requiredCss=[
  '.store-section--pink.store-route{color:var(--nbc-text);background:var(--nbc-surface);border-color:var(--nbc-border);}',
  '.store-section--pink.store-routecode{color:var(--nbc-text)}',
  '.store-section--pink.store-routespan{color:var(--nbc-muted)}',
  '.cx-pagea.nbc-button--primary,.cx-pagea.nbc-button--coral{color:#151515}',
  '.cx-pagea.nbc-button--dark{color:#fff7e8}',
  ':is(.cx-preview,.cx-block-preview).nbc-receipt-grid>div{color:#151515}',
  ':is(.cx-preview,.cx-block-preview)strong+small{display:block;margin-top:.22rem;line-height:1.35;}',
  '.cx-mini-row>span{display:grid;gap:.22rem;min-width:0;}',
  '.cx-mini-row>span>:is(strong,small){min-width:0}',
  '.cx-mini-row>span>small{display:block;margin:0;line-height:1.35;}'
];
for(const marker of requiredCss)if(!compact.includes(marker))fail(`Showcase hardening rule missing: ${marker}`);

if(/transition\s*:\s*all/i.test(css))fail('Showcase hardening must not use transition: all');
if(/:hover[^\{]*\{[^\}]*translate(?:Y)?\(\s*-/i.test(css))fail('Showcase hardening must not introduce upward hover lift');

if((manifest.files||[]).includes(link))fail('Showcase hardening stylesheet must stay outside the frozen npm files allowlist');
if(manifest.exports?.['./showcase-fixes.css']||manifest.exports?.['./showcase-fixes'])fail('Showcase hardening stylesheet must not become a public package export');
if(manifest.scripts?.['check:showcase-hardening']!=='node scripts/showcase-hardening-check.mjs')fail('Showcase hardening checker script is missing');
if(!manifest.scripts?.check?.includes('npm run check:showcase-hardening'))fail('Main quality chain must include showcase hardening checker');

console.log('Showcase hardening passed · dark contrast · helper separation · frozen Commerce 1.0.0 API preserved');
