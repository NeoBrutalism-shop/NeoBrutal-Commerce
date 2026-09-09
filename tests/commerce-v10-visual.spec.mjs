import {test} from '@playwright/test';

const surfaces=[
  ['home','/'],
  ['product','/product/soft/'],
  ['checkout','/checkout/'],
  ['account','/account/'],
  ['ownership','/account/license/demo-soft-team/']
];
const canonicalProjects=new Set(['chromium','mobile-chromium']);

test('capture v1.0 canonical visual candidates',async({page},testInfo)=>{
  test.skip(!canonicalProjects.has(testInfo.project.name),`${testInfo.project.name} remains behavioral/accessibility coverage rather than a canonical pixel engine.`);
  for(const [id,route] of surfaces){
    await page.goto(route,{waitUntil:'networkidle'});
    await page.screenshot({path:testInfo.outputPath(`commerce-v10-candidate-${id}-${testInfo.project.name}.png`),fullPage:true});
  }
});
