const root=document.documentElement;
const qs=(selector,scope=document)=>scope.querySelector(selector);
const expectedArchitecture=['Components','Blocks','Pages','Applications'];
const expectedCounts={authorities:10,workflow:6,readOrder:13,outputs:12,prohibitions:7};

function assert(condition,message){if(!condition)throw new Error(`Agent Lab: ${message}`)}
async function fetchJson(url){
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`Agent Lab: ${url} returned ${response.status}`);
  return response.json();
}
function same(actual,expected){return JSON.stringify(actual)===JSON.stringify(expected)}
function label(value){return String(value).replaceAll('-',' ').replaceAll('_',' ').replace(/([a-z])([A-Z])/g,'$1 $2').toUpperCase()}
function unique(values){return [...new Set(values)]}
function textNode(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node}
function chip(value,{tone=''}={}){const node=textNode('span',value,'agent-chip');if(tone)node.dataset.tone=tone;return node}
function replaceWithChips(target,values,{empty='NONE ON THIS ROUTE',tone=''}={}){
  target.replaceChildren();
  const list=values.length?values:[empty];
  for(const value of list)target.append(chip(value,{tone:values.length?tone:'muted'}));
}

function renderArchitecture(contract){
  const list=qs('#architectureList');list.replaceChildren();
  for(const [index,layer] of contract.architecture.entries()){
    const item=document.createElement('li');
    item.dataset.agentArchitecture=layer;
    item.append(textNode('span',String(index+1).padStart(2,'0'),'agent-step-index'),textNode('strong',layer));
    if(index<contract.architecture.length-1)item.append(textNode('span','→','agent-architecture-arrow'));
    list.append(item);
  }
}
function renderAuthorities(contract){
  const grid=qs('#authorityGrid');grid.replaceChildren();
  for(const authority of contract.authorities){
    const article=document.createElement('article');article.className='agent-authority-card';article.dataset.agentAuthority=authority.concern;
    const head=document.createElement('div');head.className='agent-authority-head';
    head.append(textNode('span',label(authority.concern),'agent-authority-concern'),textNode('code',authority.source));
    article.append(head,textNode('p',authority.rule));
    grid.append(article);
  }
}
function renderWorkflow(contract){
  const list=qs('#workflowList');list.replaceChildren();
  for(const [index,step] of contract.workflow.entries()){
    const item=document.createElement('li');item.dataset.agentWorkflowStep=step.id;
    const head=document.createElement('div');head.className='agent-workflow-head';
    head.append(textNode('span',String(index+1).padStart(2,'0'),'agent-step-index'),textNode('h3',label(step.id)));
    const sources=document.createElement('div');sources.className='agent-workflow-group';sources.append(textNode('strong','SOURCES'));
    for(const source of step.sources)sources.append(chip(source));
    const outputs=document.createElement('div');outputs.className='agent-workflow-group';outputs.append(textNode('strong','PRODUCES'));
    for(const output of step.produces)outputs.append(chip(output,{tone:'lime'}));
    item.append(head,sources,outputs);list.append(item);
  }
}
function renderReadOrder(contract){
  const list=qs('#readOrderList');list.replaceChildren();
  for(const source of contract.readOrder){
    const item=document.createElement('li');item.dataset.agentReadSource=source;
    item.append(textNode('code',source));list.append(item);
  }
}
function renderOutputs(contract){
  const list=qs('#outputList');list.replaceChildren();
  for(const output of contract.outputContract){
    const item=document.createElement('li');item.dataset.agentOutput=output;
    item.append(textNode('span','✓','agent-output-check'),textNode('code',output));list.append(item);
  }
}
function renderProhibitions(contract){
  const list=qs('#prohibitionList');list.replaceChildren();
  for(const itemContract of contract.prohibitions){
    const item=document.createElement('li');item.dataset.agentProhibition=itemContract.id;
    item.append(textNode('strong',label(itemContract.id)),textNode('p',itemContract.description));list.append(item);
  }
}

function routeMaps(data){
  return {
    routes:new Map(data.routes.routes.map(route=>[route.id,route])),
    pages:new Map(data.pages.pages.map(page=>[page.id,page])),
    blocks:new Map(data.blocks.blocks.map(block=>[block.id,block])),
    components:new Map(data.components.components.map(component=>[component.id,component]))
  };
}
function renderTrace(routeId,data,maps){
  const route=maps.routes.get(routeId);assert(route,`unknown route ${routeId}`);
  const page=maps.pages.get(routeId);assert(page,`route ${routeId} has no Page contract`);
  assert(!Object.prototype.hasOwnProperty.call(page,'states'),`Page ${page.id} duplicates route runtime states`);
  assert(Array.isArray(page.blocks)&&page.blocks.length>0,`Page ${page.id} has no Blocks`);

  const blocks=page.blocks.map(id=>{const block=maps.blocks.get(id);assert(block,`Page ${page.id} references unknown Block ${id}`);return block});
  const composedIds=unique(blocks.flatMap(block=>block.components||[]));
  const missing=route.primaryComponents.filter(id=>!composedIds.includes(id));
  assert(missing.length===0,`route ${route.id} is missing required composed components: ${missing.join(', ')}`);
  const componentContracts=composedIds.map(id=>{const component=maps.components.get(id);assert(component,`Block composition references unknown component ${id}`);return component});
  const models=unique(componentContracts.flatMap(component=>component.models||[]));
  const actions=unique(componentContracts.flatMap(component=>component.actions||[]));
  const componentStates=unique(componentContracts.flatMap(component=>component.states||[]));
  const routeStates=route.states||[];

  const trace=qs('[data-agent-trace]');
  trace.dataset.traceRoute=route.id;
  trace.dataset.tracePage=page.id;
  trace.dataset.traceRequiredCount=String(route.primaryComponents.length);
  trace.dataset.traceComposedCount=String(composedIds.length);
  trace.dataset.traceMissingCount=String(missing.length);
  root.dataset.selectedRoute=route.id;

  qs('#traceRouteTitle').textContent=page.title;
  qs('#traceRoutePath').textContent=route.path;
  qs('#traceIntent').textContent=`Intent: ${route.intent} · Authority: storefront/routes.json`;
  qs('#traceCoverage').textContent=`${route.primaryComponents.length}/${route.primaryComponents.length} REQUIRED COMPONENTS COVERED`;
  const pageTarget=qs('#tracePage');pageTarget.replaceChildren(textNode('strong',page.title),textNode('p',page.description));
  replaceWithChips(qs('#traceBlocks'),page.blocks,{tone:'sky'});
  replaceWithChips(qs('#traceRequired'),route.primaryComponents,{tone:'lime'});
  replaceWithChips(qs('#traceStates'),routeStates,{tone:'coral'});
  qs('#traceComponentCount').textContent=String(composedIds.length);
  qs('#traceModelCount').textContent=String(models.length);
  qs('#traceActionCount').textContent=String(actions.length);
  qs('#traceStateCount').textContent=String(componentStates.length);
}
function populateRoutes(data,maps){
  const select=qs('#agentRouteSelect');select.replaceChildren();
  for(const route of data.routes.routes){
    const page=maps.pages.get(route.id);assert(page,`route ${route.id} has no Page while populating selector`);
    const option=document.createElement('option');option.value=route.id;option.textContent=`${page.title} · ${route.path}`;select.append(option);
  }
  const initial=maps.routes.has('product-soft')?'product-soft':data.routes.routes[0]?.id;
  assert(initial,'route manifest is empty');select.value=initial;renderTrace(initial,data,maps);
  select.addEventListener('change',()=>renderTrace(select.value,data,maps));
}

async function boot(){
  root.dataset.agentLabReady='loading';
  try{
    const [agent,routes,pages,blocks,components]=await Promise.all([
      fetchJson('../storefront/agents.json'),
      fetchJson('../storefront/routes.json'),
      fetchJson('../storefront/pages.json'),
      fetchJson('../storefront/blocks.json'),
      fetchJson('../storefront/components.json')
    ]);
    assert(agent.schema==='neobrutal-commerce/agents@1',`unexpected schema ${agent.schema}`);
    assert(agent.agentContractVersion==='1.4.0',`unexpected agent version ${agent.agentContractVersion}`);
    assert(agent.commerceVersion==='1.0.0',`unexpected Commerce version ${agent.commerceVersion}`);
    assert(agent.distribution==='repository-source',`unexpected distribution ${agent.distribution}`);
    assert(same(agent.architecture,expectedArchitecture),'architecture order drifted');
    assert(agent.authorities?.length===expectedCounts.authorities,`expected ${expectedCounts.authorities} authorities`);
    assert(agent.workflow?.length===expectedCounts.workflow,`expected ${expectedCounts.workflow} workflow steps`);
    assert(agent.readOrder?.length===expectedCounts.readOrder,`expected ${expectedCounts.readOrder} read-order sources`);
    assert(agent.outputContract?.length===expectedCounts.outputs,`expected ${expectedCounts.outputs} review outputs`);
    assert(agent.prohibitions?.length===expectedCounts.prohibitions,`expected ${expectedCounts.prohibitions} prohibitions`);
    assert(routes.version==='1.0.0','route manifest must remain Commerce 1.0.0');
    assert(pages.schema==='neobrutal-commerce/pages@1'&&pages.commerceVersion==='1.0.0','Page contract identity drifted');
    assert(blocks.schema==='neobrutal-commerce/blocks@1'&&blocks.commerceVersion==='1.0.0','Block contract identity drifted');
    assert(components.schema==='neobrutal-commerce/components@1'&&components.commerceVersion==='1.0.0','Component contract identity drifted');
    assert(routes.routes.length===pages.pages.length,'Route/Page count drifted');

    renderArchitecture(agent);renderAuthorities(agent);renderWorkflow(agent);renderReadOrder(agent);renderOutputs(agent);renderProhibitions(agent);
    const data={agent,routes,pages,blocks,components};const maps=routeMaps(data);populateRoutes(data,maps);

    qs('#authorityCount').textContent=`${agent.authorities.length} AUTHORITIES`;
    qs('#workflowCount').textContent=`${agent.workflow.length} WORKFLOW STEPS`;
    root.dataset.agentContractVersion=agent.agentContractVersion;
    root.dataset.agentAuthorities=String(agent.authorities.length);
    root.dataset.agentWorkflowSteps=String(agent.workflow.length);
    root.dataset.agentReadOrder=String(agent.readOrder.length);
    root.dataset.agentReviewOutputs=String(agent.outputContract.length);
    root.dataset.agentProhibitions=String(agent.prohibitions.length);
    root.dataset.agentLabReady='true';
    qs('#agentStatus').textContent=`Agent Contract v${agent.agentContractVersion} ready · ${agent.authorities.length} authorities · ${agent.workflow.length} workflow steps · ${agent.outputContract.length} review outputs · ${agent.distribution} · Commerce ${agent.commerceVersion} frozen`;
  }catch(error){
    root.dataset.agentLabReady='error';
    qs('#agentStatus').textContent=error.message;
    throw error;
  }
}

boot();
