import {test} from '@playwright/test';

const surfaces=[['home','/'],['product','/product/soft/'],['checkout','/checkout/'],['account','/account/'],['ownership','/account/license/demo-soft-team/']];

test('capture v0.8 canonical visual candidates',async({page},testInfo)=>{
  test.skip(!['chromium','mobile-chromium'].includes(testInfo.project.name),'Canonical v0.8 pixel surfaces are desktop/mobile Chromium; Firefox/WebKit remain behavioral and accessibility gates.');
  for(const [id,route] of surfaces){
    await page.goto(route,{waitUntil:'networkidle'});
    await page.screenshot({path:testInfo.outputPath(`commerce-v08-candidate-${id}-${testInfo.project.name}.png`),fullPage:true});
  }
});
