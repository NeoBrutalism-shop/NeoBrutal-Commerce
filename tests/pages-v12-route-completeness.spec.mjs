import {test,expect} from '@playwright/test';

test('v1.2 page compositions cover every frozen route primary component through Blocks',async({page})=>{
  await page.goto('/demo/v10.html?route=components',{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('data-page-library-ready','true');

  const proof=await page.evaluate(async()=>{
    const fetchJson=async url=>{
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok)throw new Error(`${url} request failed: ${response.status}`);
      return response.json();
    };
    const [routes,pages,blocks]=await Promise.all([
      fetchJson('../storefront/routes.json'),
      fetchJson('../storefront/pages.json'),
      fetchJson('../storefront/blocks.json')
    ]);
    const pageMap=new Map(pages.pages.map(item=>[item.id,item]));
    const blockMap=new Map(blocks.blocks.map(item=>[item.id,item]));
    return routes.routes.map(route=>{
      const pageContract=pageMap.get(route.id);
      const composed=new Set(pageContract.blocks.flatMap(blockId=>blockMap.get(blockId).components));
      return {
        id:route.id,
        blocks:pageContract.blocks,
        missing:route.primaryComponents.filter(componentId=>!composed.has(componentId))
      };
    });
  });

  expect(proof).toHaveLength(10);
  expect(proof.filter(item=>item.missing.length),JSON.stringify(proof,null,2)).toEqual([]);
  const system=proof.find(item=>item.id==='components');
  expect(system.blocks).toEqual(['system-states','trust-band']);

  await expect(page.locator('[data-page-block]')).toHaveCount(2);
  await expect(page.locator('[data-page-block]').nth(0)).toHaveText('system-states');
  await expect(page.locator('[data-page-block]').nth(1)).toHaveText('trust-band');
});

test('v1.2 block explorer exposes the added route-completeness component contracts',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('data-showcase-ready','true');
  await page.getByRole('tab',{name:/Blocks/}).click();

  const expected={
    'product-media':['product-detail','product-gallery','product-media'],
    'trust-band':['trust-strip','review-summary','testimonials','guarantee'],
    'checkout-shell':['checkout-field','invoice-details','checkout-steps','payment-method','order-summary'],
    'account-dashboard':['account-nav','download-row','purchase-history-row','license-card','invoice-history'],
    'system-states':['component-contract','tokens','system-states','ownership-lifecycle']
  };

  for(const [blockId,componentIds] of Object.entries(expected)){
    const block=page.locator(`[data-block-id="${blockId}"]`);
    await expect(block).toBeVisible();
    const chips=await block.locator('.cx-block-meta .cx-chip').allTextContents();
    expect(chips,blockId).toEqual(componentIds);
  }
});
