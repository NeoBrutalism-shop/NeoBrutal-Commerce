import {test,expect} from '@playwright/test';

const expectedStates={
  'product-soft':['preview','code','files'],
  checkout:['ready','processing','failed','recovered'],
  'account-license':['active','grace','expired','cancelled','refunded','ready','quoted','processing','complete','failed','cancel_at_period_end','past_due']
};

test('v1.2 Page Lab derives canonical route states without copying them into Pages',async({page})=>{
  await page.goto('/demo/v10.html?route=account-license',{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('data-page-library-ready','true');

  const expectStates=async states=>{
    const chips=page.locator('[data-route-state]');
    await expect(chips).toHaveCount(states.length);
    expect(await chips.allTextContents()).toEqual(states);
    expect(await chips.evaluateAll(nodes=>nodes.map(node=>node.dataset.routeState))).toEqual(states);
    await expect(page.locator('[data-route-state-empty]')).toHaveCount(0);
  };
  const selectRoute=async routeId=>{
    const control=page.locator(`[data-route="${routeId}"]`);
    await expect(control).toBeVisible();
    await control.click();
    await expect(control).toHaveAttribute('aria-current','page');
  };

  await expectStates(expectedStates['account-license']);

  await selectRoute('checkout');
  await expect(page.locator('#currentIntent')).toHaveText('checkout');
  await expectStates(expectedStates.checkout);

  await selectRoute('product-soft');
  await expect(page.locator('#currentIntent')).toHaveText('product-detail');
  await expectStates(expectedStates['product-soft']);

  await selectRoute('home');
  await expect(page.locator('#currentIntent')).toHaveText('storefront-home');
  await expect(page.locator('[data-route-state]')).toHaveCount(0);
  await expect(page.locator('[data-route-state-empty]')).toHaveText('No explicit route states');

  const authority=await page.evaluate(async()=>{
    const fetchJson=async url=>{
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok)throw new Error(`${url} request failed: ${response.status}`);
      return response.json();
    };
    const [routes,pages]=await Promise.all([
      fetchJson('../storefront/routes.json'),
      fetchJson('../storefront/pages.json')
    ]);
    return {
      pageStateFields:pages.pages.filter(item=>Object.prototype.hasOwnProperty.call(item,'states')).map(item=>item.id),
      routeStates:routes.routes.filter(item=>Array.isArray(item.states)).map(item=>[item.id,item.states])
    };
  });

  expect(authority.pageStateFields).toEqual([]);
  expect(authority.routeStates).toEqual(Object.entries(expectedStates));
});
