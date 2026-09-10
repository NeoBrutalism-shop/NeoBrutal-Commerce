import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const expectedArchitecture=['Components','Blocks','Pages','Applications'];
const expectedAuthorityConcerns=['route-intent','route-states','page-composition','block-composition','component-contracts','runtime-state-semantics','interaction-behavior','normalized-models','canonical-actions','reference-commerce-content'];
const expectedWorkflow=['resolve-route','resolve-page-composition','resolve-component-contracts','resolve-runtime-semantics','resolve-interactions','validate'];
const waitForLab=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-agent-lab-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-agent-contract-version','1.4.0');
  await expect(page.locator('html')).toHaveAttribute('data-agent-authorities','10');
  await expect(page.locator('html')).toHaveAttribute('data-agent-workflow-steps','6');
  await expect(page.locator('html')).toHaveAttribute('data-agent-read-order','13');
  await expect(page.locator('html')).toHaveAttribute('data-agent-review-outputs','12');
  await expect(page.locator('html')).toHaveAttribute('data-agent-prohibitions','7');
};

test('v1.4 Agent Lab is manifest-backed accessible and viewport-tight',async({page})=>{
  const httpFailures=[];const runtimeFailures=[];
  page.on('response',response=>{if(response.status()>=400)httpFailures.push(`${response.status()} ${response.url()}`)});
  page.on('pageerror',error=>runtimeFailures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
  await page.goto('/demo/v14.html',{waitUntil:'networkidle'});
  await waitForLab(page);

  const contract=await page.evaluate(()=>fetch('../storefront/agents.json').then(response=>response.json()));
  expect(contract.schema).toBe('neobrutal-commerce/agents@1');
  expect(contract.agentContractVersion).toBe('1.4.0');
  expect(contract.commerceVersion).toBe('1.0.0');
  expect(contract.distribution).toBe('repository-source');
  expect(contract.architecture).toEqual(expectedArchitecture);
  expect(contract.authorities.map(item=>item.concern)).toEqual(expectedAuthorityConcerns);
  expect(contract.workflow.map(item=>item.id)).toEqual(expectedWorkflow);
  expect(contract.readOrder).toHaveLength(13);
  expect(contract.outputContract).toHaveLength(12);
  expect(contract.prohibitions).toHaveLength(7);

  expect(await page.locator('[data-agent-architecture]').evaluateAll(nodes=>nodes.map(node=>node.dataset.agentArchitecture))).toEqual(expectedArchitecture);
  expect(await page.locator('[data-agent-authority]').evaluateAll(nodes=>nodes.map(node=>node.dataset.agentAuthority))).toEqual(expectedAuthorityConcerns);
  expect(await page.locator('[data-agent-workflow-step]').evaluateAll(nodes=>nodes.map(node=>node.dataset.agentWorkflowStep))).toEqual(expectedWorkflow);
  await expect(page.locator('[data-agent-read-source]')).toHaveCount(13);
  await expect(page.locator('[data-agent-output]')).toHaveCount(12);
  await expect(page.locator('[data-agent-prohibition]')).toHaveCount(7);
  await expect(page.locator('#agentStatus')).toContainText('repository-source');

  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(axe.violations,'Agent Lab WCAG A/AA violations').toEqual([]);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'Agent Lab horizontal overflow').toBeLessThanOrEqual(1);
  expect(httpFailures,'Agent Lab HTTP failures').toEqual([]);
  expect(runtimeFailures,'Agent Lab runtime/console failures').toEqual([]);
});

test('v1.4 Agent Lab derives route Page Block Component coverage without a duplicate route catalog',async({page})=>{
  await page.goto('/demo/v14.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  const source=await page.evaluate(async()=>{
    const get=url=>fetch(url).then(response=>response.json());
    const [routes,pages,blocks,components]=await Promise.all([get('../storefront/routes.json'),get('../storefront/pages.json'),get('../storefront/blocks.json'),get('../storefront/components.json')]);
    return {routes,pages,blocks,components};
  });
  const pageMap=new Map(source.pages.pages.map(item=>[item.id,item]));
  const blockMap=new Map(source.blocks.blocks.map(item=>[item.id,item]));
  const componentIds=new Set(source.components.components.map(item=>item.id));

  const select=page.locator('#agentRouteSelect');
  await expect(select.locator('option')).toHaveCount(source.routes.routes.length);
  expect(await select.locator('option').evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(source.routes.routes.map(route=>route.id));
  await expect(select).toHaveValue('product-soft');

  for(const route of source.routes.routes){
    const pageContract=pageMap.get(route.id);expect(pageContract,`Page contract for ${route.id}`).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(pageContract,'states'),`Page ${route.id} must not duplicate route states`).toBe(false);
    const composed=[...new Set(pageContract.blocks.flatMap(blockId=>blockMap.get(blockId).components))];
    for(const id of composed)expect(componentIds.has(id),`known component ${id}`).toBe(true);
    const missing=route.primaryComponents.filter(id=>!composed.includes(id));
    expect(missing,`route ${route.id} required component coverage`).toEqual([]);

    await select.selectOption(route.id);
    await expect(page.locator('html')).toHaveAttribute('data-selected-route',route.id);
    await expect(page.locator('[data-agent-trace]')).toHaveAttribute('data-trace-route',route.id);
    await expect(page.locator('[data-agent-trace]')).toHaveAttribute('data-trace-page',route.id);
    await expect(page.locator('[data-agent-trace]')).toHaveAttribute('data-trace-required-count',String(route.primaryComponents.length));
    await expect(page.locator('[data-agent-trace]')).toHaveAttribute('data-trace-missing-count','0');
    await expect(page.locator('#traceCoverage')).toHaveText(`${route.primaryComponents.length}/${route.primaryComponents.length} REQUIRED COMPONENTS COVERED`);
    await expect(page.locator('#traceBlocks .agent-chip')).toHaveCount(pageContract.blocks.length);
    await expect(page.locator('#traceRequired .agent-chip')).toHaveCount(route.primaryComponents.length);
    const expectedStateChipCount=(route.states||[]).length||1;
    await expect(page.locator('#traceStates .agent-chip')).toHaveCount(expectedStateChipCount);
  }
});

test('v1.4 Agent Lab exposes representative checkout and ownership traces from canonical manifests',async({page})=>{
  await page.goto('/demo/v14.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  const select=page.locator('#agentRouteSelect');

  await select.selectOption('checkout');
  await expect(page.locator('[data-agent-trace]')).toHaveAttribute('data-trace-required-count','8');
  await expect(page.locator('#traceStates .agent-chip')).toHaveCount(4);
  await expect(page.locator('#traceCoverage')).toHaveText('8/8 REQUIRED COMPONENTS COVERED');
  await expect(page.locator('#traceIntent')).toContainText('checkout');

  await select.selectOption('account-license');
  await expect(page.locator('[data-agent-trace]')).toHaveAttribute('data-trace-required-count','10');
  await expect(page.locator('#traceStates .agent-chip')).toHaveCount(12);
  await expect(page.locator('#traceCoverage')).toHaveText('10/10 REQUIRED COMPONENTS COVERED');
  await expect(page.locator('#traceBlocks .agent-chip')).toHaveCount(4);
  expect(Number(await page.locator('#traceModelCount').textContent())).toBeGreaterThan(0);
  expect(Number(await page.locator('#traceActionCount').textContent())).toBeGreaterThan(0);
  expect(Number(await page.locator('#traceStateCount').textContent())).toBeGreaterThan(0);
});

test('v1.4 Agent Lab theme remains reversible and forced colors preserve focus',async({page},testInfo)=>{
  await page.goto('/demo/v14.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  const theme=page.locator('[data-theme-toggle]');
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');

  if(testInfo.project.name==='chromium'){
    await page.emulateMedia({forcedColors:'active'});
    await page.reload({waitUntil:'networkidle'});
    await waitForLab(page);
    const select=page.locator('#agentRouteSelect');await select.focus();
    const focus=await select.evaluate(node=>({style:getComputedStyle(node).outlineStyle,width:Number.parseFloat(getComputedStyle(node).outlineWidth)||0}));
    expect(focus.style).not.toBe('none');
    expect(focus.width).toBeGreaterThanOrEqual(2);
  }
});

test('capture v1.4 Agent Lab review surfaces',async({page},testInfo)=>{
  test.skip(!new Set(['chromium','mobile-chromium']).has(testInfo.project.name),'Canonical Agent Lab review surfaces use Chromium desktop/mobile.');
  await page.goto('/demo/v14.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  await page.screenshot({path:testInfo.outputPath(`commerce-v14-agent-lab-${testInfo.project.name}.png`),fullPage:true});
});
