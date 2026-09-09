import fs from 'node:fs';

const file='scripts/promote-v10.mjs';
let source=fs.readFileSync(file,'utf8');
const start=source.indexOf("write('tests/commerce-v10-visual.spec.mjs',");
const end=source.indexOf("\n\nwrite('LICENSE.md'",start);
if(start<0||end<0)throw new Error('Could not locate v1 visual generator block');
const replacement=[
  "write('tests/commerce-v10-visual.spec.mjs',[",
  "  \"import {test} from '@playwright/test';\",",
  "  '',",
  "  'const surfaces=[',",
  "  \"  ['home','/'],\",",
  "  \"  ['product','/product/soft/'],\",",
  "  \"  ['checkout','/checkout/'],\",",
  "  \"  ['account','/account/'],\",",
  "  \"  ['ownership','/account/license/demo-soft-team/']\",",
  "  '];',",
  "  \"const canonicalProjects=new Set(['chromium','mobile-chromium']);\",",
  "  '',",
  "  \"test('capture v1.0 canonical visual candidates',async({page},testInfo)=>{\",",
  "  \"  test.skip(!canonicalProjects.has(testInfo.project.name),testInfo.project.name+' remains behavioral/accessibility coverage rather than a canonical pixel engine.');\",",
  "  '  for(const [id,route] of surfaces){',",
  "  \"    await page.goto(route,{waitUntil:'networkidle'});\",",
  "  \"    await page.screenshot({path:testInfo.outputPath('commerce-v10-candidate-'+id+'-'+testInfo.project.name+'.png'),fullPage:true});\",",
  "  '  }',",
  "  '});',",
  "  ''",
  "].join('\\n'));"
].join('\n');
source=source.slice(0,start)+replacement+source.slice(end);
fs.writeFileSync(file,source);
console.log('Promoter syntax patched.');
