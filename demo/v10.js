const EXPECTED_PAGE_LIBRARY_VERSION='1.2.0';
const EXPECTED_COMMERCE_VERSION='1.0.0';
const EXPECTED_BLOCK_COUNT=24;
const EXPECTED_PAGE_COMPOSED_BLOCK_COUNT=18;
const EXPECTED_PROMOTED_BLOCK_COUNT=6;
const VIEWPORTS={desktop:{label:'1280px preview'},tablet:{label:'834px preview'},mobile:{label:'390px preview'}};
const FROZEN_V10_ROUTE_IDS=[
  {id:'home',canonical:'home'},
  {id:'products',canonical:'products'},
  {id:'product',canonical:'product-soft'},
  {id:'pricing',canonical:'pricing'},
  {id:'cart',canonical:'cart'},
  {id:'checkout',canonical:'checkout'},
  {id:'success',canonical:'order-success'},
  {id:'account',canonical:'account'},
  {id:'ownership',canonical:'account-license'},
  {id:'system',canonical:'components'}
];
const LEGACY_ROUTE_ALIASES=Object.fromEntries(FROZEN_V10_ROUTE_IDS.map(route=>[route.id,route.canonical]));
const qs=(selector,scope=document)=>scope.querySelector(selector);
const qsa=(selector,scope=document)=>[...scope.querySelectorAll(selector)];
let ROUTES=[];
let current=null;
let theme='light';
let viewport='desktop';

async function fetchJson(url){
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`${url} request failed: ${response.status}`);
  return response.json();
}
function assert(condition,message){if(!condition)throw new Error(message)}
function sameIds(actual,expected){
  const a=[...actual].sort();
  const b=[...expected].sort();
  return JSON.stringify(a)===JSON.stringify(b);
}
function routeSrc(route){
  const target=route.example||route.path;
  return target==='/'?'../':`..${target.replace(/\/$/,'')}/`;
}
function buildPageLibrary(routeManifest,pageLibrary,blockManifest){
  assert(routeManifest.version===EXPECTED_COMMERCE_VERSION,'route manifest Commerce version mismatch');
  assert(pageLibrary.schema==='neobrutal-commerce/pages@1','unexpected page library schema');
  assert(pageLibrary.pageLibraryVersion===EXPECTED_PAGE_LIBRARY_VERSION,'page library version mismatch');
  assert(pageLibrary.commerceVersion===EXPECTED_COMMERCE_VERSION,'page library Commerce version mismatch');
  assert(blockManifest.schema==='neobrutal-commerce/blocks@1','unexpected blocks schema');
  assert(blockManifest.commerceVersion===EXPECTED_COMMERCE_VERSION,'blocks Commerce version mismatch');
  assert(routeManifest.routes?.length===10,'expected 10 frozen production routes');
  assert(pageLibrary.pages?.length===10,'expected 10 page library contracts');
  assert(blockManifest.blocks?.length===EXPECTED_BLOCK_COUNT,`expected ${EXPECTED_BLOCK_COUNT} documented Blocks`);
  const routeIds=routeManifest.routes.map(route=>route.id);
  const pagesById=new Map(pageLibrary.pages.map(page=>[page.id,page]));
  assert(pagesById.size===10,'page library contains duplicate ids');
  assert(sameIds([...pagesById.keys()],routeIds),'page library ids drifted from frozen routes');
  const blockMap=new Map(blockManifest.blocks.map(block=>[block.id,block]));
  const blockIds=new Set(blockMap.keys());
  assert(blockIds.size===EXPECTED_BLOCK_COUNT,'block library contains duplicate ids');
  const usedBlocks=new Set();
  for(const page of pageLibrary.pages){
    assert(page.title?.trim(),`missing page title: ${page.id}`);
    assert(page.description?.trim(),`missing page description: ${page.id}`);
    assert(Array.isArray(page.blocks)&&page.blocks.length>0,`page ${page.id} must compose at least one block`);
    for(const blockId of page.blocks){
      assert(blockIds.has(blockId),`page ${page.id} references unknown block ${blockId}`);
      usedBlocks.add(blockId);
    }
  }
  assert(usedBlocks.size===EXPECTED_PAGE_COMPOSED_BLOCK_COUNT,`expected ${EXPECTED_PAGE_COMPOSED_BLOCK_COUNT} Page-composed compatibility Blocks`);
  const promotedBlocks=blockManifest.blocks.filter(block=>!usedBlocks.has(block.id));
  assert(promotedBlocks.length===EXPECTED_PROMOTED_BLOCK_COUNT,`expected ${EXPECTED_PROMOTED_BLOCK_COUNT} promoted reusable Blocks`);
  for(const block of promotedBlocks){
    assert(typeof block.promotedFrom==='string'&&block.promotedFrom.trim(),`uncomposed block ${block.id} must declare promotedFrom`);
    const parent=blockMap.get(block.promotedFrom);
    assert(parent,`uncomposed block ${block.id} references unknown compatibility parent ${block.promotedFrom}`);
    assert(usedBlocks.has(parent.id),`uncomposed block ${block.id} compatibility parent ${parent.id} must remain Page-composed`);
    assert(block.components.every(componentId=>parent.components.includes(componentId)),`uncomposed block ${block.id} must remain a component subset of compatibility parent ${parent.id}`);
  }
  assert(usedBlocks.size+promotedBlocks.length===blockIds.size,'promoted compatibility accounting must cover every documented Block');
  ROUTES=routeManifest.routes.map(route=>{
    const page=pagesById.get(route.id);
    return {...route,...page,src:routeSrc(route)};
  });
  return {blockCount:blockIds.size,composedBlockCount:usedBlocks.size};
}
function routeButton(route,index){
  return `<button class="lab-route-button" type="button" data-route="${route.id}" data-page-id="${route.id}" aria-current="${route.id===current.id?'page':'false'}"><span class="lab-route-index">${String(index+1).padStart(2,'0')}</span><span class="lab-route-copy"><strong>${route.title}</strong><code>${route.path}</code></span></button>`;
}
function renderPageContract(){
  qs('#currentIntent').textContent=current.intent;
  qs('#currentBlocks').innerHTML=current.blocks.map(block=>`<span class="lab-block-chip" data-page-block="${block}">${block}</span>`).join('');
  const states=Array.isArray(current.states)?current.states:[];
  qs('#currentStates').innerHTML=states.length
    ? states.map(state=>`<span class="lab-state-chip" data-route-state="${state}">${state}</span>`).join('')
    : '<span class="lab-state-empty" data-route-state-empty>No explicit route states</span>';
}
function syncRouteControls(){
  qsa('[data-route]').forEach(button=>button.setAttribute('aria-current',button.dataset.route===current.id?'page':'false'));
  qs('#routeSelect').value=current.id;
  qs('#currentPath').textContent=current.path;
  qs('#currentTitle').textContent=current.title;
  qs('#currentDescription').textContent=current.description;
  qs('#openLive').href=current.src;
  qs('#deviceUrl').textContent=`/NeoBrutal-Commerce${current.path==='/'?'/':current.example||current.path}`;
  qs('#labFrame').title=`NeoBrutal Commerce — ${current.title}`;
  renderPageContract();
}
function applyThemeToFrame(){
  try{
    const doc=qs('#labFrame').contentDocument;
    if(!doc?.documentElement)return;
    doc.documentElement.dataset.theme=theme;
    doc.documentElement.style.colorScheme=theme;
    const nativeToggle=doc.querySelector('[data-theme-toggle]');
    if(nativeToggle){nativeToggle.textContent=theme==='dark'?'☀ Light':'◐ Dark';nativeToggle.setAttribute('aria-pressed',String(theme==='dark'))}
  }catch(error){console.warn('Could not sync theme into framed route',error)}
}
function setTheme(next){
  theme=next;
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  localStorage.setItem('nbc-lab-theme',theme);
  const toggle=qs('#labTheme');
  const dark=theme==='dark';
  toggle.textContent=dark?'☀ Light':'◐ Dark';
  toggle.setAttribute('aria-pressed',String(dark));
  applyThemeToFrame();
}
function setViewport(next){
  viewport=VIEWPORTS[next]?next:'desktop';
  qs('#labStage').dataset.viewport=viewport;
  qs('#viewportLabel').textContent=VIEWPORTS[viewport].label;
  qsa('button[data-viewport]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.viewport===viewport)));
  syncUrl();
}
function syncUrl(){
  if(!current)return;
  const url=new URL(location.href);
  url.searchParams.set('route',current.id);
  url.searchParams.set('viewport',viewport);
  history.replaceState(null,'',url);
}
function selectRoute(id,{push=true}={}){
  const canonical=LEGACY_ROUTE_ALIASES[id]||id;
  const route=ROUTES.find(item=>item.id===canonical)||ROUTES[0];
  current=route;
  syncRouteControls();
  const frame=qs('#labFrame');
  qs('#labStatus').textContent=`Loading ${route.title.toLowerCase()} from the real production route…`;
  frame.src=route.src;
  if(push)syncUrl();
}
async function init(){
  try{
    const [routeManifest,pageLibrary,blockManifest]=await Promise.all([
      fetchJson('../storefront/routes.json'),
      fetchJson('../storefront/pages.json'),
      fetchJson('../storefront/blocks.json')
    ]);
    const {blockCount,composedBlockCount}=buildPageLibrary(routeManifest,pageLibrary,blockManifest);
    const params=new URLSearchParams(location.search);
    const requestedId=LEGACY_ROUTE_ALIASES[params.get('route')]||params.get('route');
    current=ROUTES.find(route=>route.id===requestedId)||ROUTES[0];
    viewport=VIEWPORTS[params.get('viewport')]?params.get('viewport'):'desktop';
    theme=localStorage.getItem('nbc-lab-theme')==='dark'?'dark':'light';
    qs('#routeNav').innerHTML=ROUTES.map(routeButton).join('');
    qs('#routeSelect').innerHTML=ROUTES.map(route=>`<option value="${route.id}">${route.title} · ${route.path}</option>`).join('');
    qs('#pageCountBadge').textContent=`${ROUTES.length} PAGES`;
    qs('#routeNav').addEventListener('click',event=>{const button=event.target.closest('[data-route]');if(button)selectRoute(button.dataset.route)});
    qs('#routeSelect').addEventListener('change',event=>selectRoute(event.currentTarget.value));
    qsa('button[data-viewport]').forEach(button=>button.addEventListener('click',()=>setViewport(button.dataset.viewport)));
    qs('#labTheme').addEventListener('click',()=>setTheme(theme==='dark'?'light':'dark'));
    qs('#labFrame').addEventListener('load',()=>{applyThemeToFrame();qs('#labStatus').textContent=`Live: ${current.title} · ${current.path} · ${VIEWPORTS[viewport].label} · ${theme} theme`});
    document.addEventListener('keydown',event=>{
      if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;
      if(event.key==='ArrowRight'&&event.altKey){event.preventDefault();const index=ROUTES.findIndex(route=>route.id===current.id);selectRoute(ROUTES[(index+1)%ROUTES.length].id)}
      if(event.key==='ArrowLeft'&&event.altKey){event.preventDefault();const index=ROUTES.findIndex(route=>route.id===current.id);selectRoute(ROUTES[(index-1+ROUTES.length)%ROUTES.length].id)}
    });
    syncRouteControls();
    setViewport(viewport);
    setTheme(theme);
    qs('#labFrame').src=current.src;
    syncUrl();
    document.documentElement.dataset.pageLibraryVersion=EXPECTED_PAGE_LIBRARY_VERSION;
    document.documentElement.dataset.pageLibraryPages=String(ROUTES.length);
    document.documentElement.dataset.pageLibraryBlocks=String(blockCount);
    document.documentElement.dataset.pageLibraryComposedBlocks=String(composedBlockCount);
    document.documentElement.dataset.pageLibraryReady='true';
    document.dispatchEvent(new CustomEvent('nbc:page-library-ready',{detail:{pageLibraryVersion:EXPECTED_PAGE_LIBRARY_VERSION,pages:ROUTES.length,blocks:blockCount,composedBlocks:composedBlockCount}}));
  }catch(error){
    document.documentElement.dataset.pageLibraryReady='error';
    qs('#labStatus').textContent=`Page library failed: ${error.message}`;
    console.error(error);
  }
}
init();
