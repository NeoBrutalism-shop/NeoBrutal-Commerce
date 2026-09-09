const ROUTES=[
  {id:'home',title:'Storefront home',path:'/',src:'../',description:'Flagship storefront with value proposition, featured product, and journey overview.'},
  {id:'products',title:'Product catalog',path:'/products',src:'../products/',description:'Catalog discovery with product hierarchy, pricing, badges, and direct product entry.'},
  {id:'product',title:'Product detail',path:'/product/soft',src:'../product/soft/',description:'Product media, reviews, trust, license selection, renewal context, and purchase action.'},
  {id:'pricing',title:'Pricing',path:'/pricing',src:'../pricing/',description:'License tiers, comparison table, and optional bundle composition.'},
  {id:'cart',title:'Cart',path:'/cart',src:'../cart/',description:'Persistent cart lines, coupon outcome, and inspectable order summary.'},
  {id:'checkout',title:'Checkout',path:'/checkout',src:'../checkout/',description:'Contact, invoice/tax, payment choice, failure recovery, and provider-authoritative total.'},
  {id:'success',title:'Order success',path:'/order/success',src:'../order/success/',description:'Receipt, transaction confirmation, and entitlement handoff after a successful order.'},
  {id:'account',title:'Account dashboard',path:'/account',src:'../account/',description:'Downloads, purchases, licenses, and provider-authoritative invoice history.'},
  {id:'ownership',title:'License + ownership',path:'/account/license/:id',src:'../account/license/demo-soft-team/',description:'Activations, seats, plan change, transfer/gift, subscription, renewal, and ownership timeline.'},
  {id:'system',title:'System showcase',path:'/components',src:'../components/',description:'Production system states and lifecycle examples used by the storefront.'}
];
const VIEWPORTS={desktop:{label:'1280px preview'},tablet:{label:'834px preview'},mobile:{label:'390px preview'}};
const qs=(selector,scope=document)=>scope.querySelector(selector);
const qsa=(selector,scope=document)=>[...scope.querySelectorAll(selector)];
let current=ROUTES[0];
let theme='light';
let viewport='desktop';

function routeButton(route,index){
  return `<button class="lab-route-button" type="button" data-route="${route.id}" aria-current="${route.id===current.id?'page':'false'}"><span class="lab-route-index">${String(index+1).padStart(2,'0')}</span><span class="lab-route-copy"><strong>${route.title}</strong><code>${route.path}</code></span></button>`;
}
function syncRouteControls(){
  qsa('[data-route]').forEach(button=>button.setAttribute('aria-current',button.dataset.route===current.id?'page':'false'));
  qs('#routeSelect').value=current.id;
  qs('#currentPath').textContent=current.path;
  qs('#currentTitle').textContent=current.title;
  qs('#currentDescription').textContent=current.description;
  qs('#openLive').href=current.src;
  qs('#deviceUrl').textContent=`/NeoBrutal-Commerce${current.path==='/'?'/':current.path}`;
  qs('#labFrame').title=`NeoBrutal Commerce — ${current.title}`;
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
  const url=new URL(location.href);
  url.searchParams.set('route',current.id);
  url.searchParams.set('viewport',viewport);
  history.replaceState(null,'',url);
}
function selectRoute(id,{push=true}={}){
  const route=ROUTES.find(item=>item.id===id)||ROUTES[0];
  current=route;
  syncRouteControls();
  const frame=qs('#labFrame');
  qs('#labStatus').textContent=`Loading ${route.title.toLowerCase()} from the real production route…`;
  frame.src=route.src;
  if(push)syncUrl();
}
function init(){
  const params=new URLSearchParams(location.search);
  const requested=ROUTES.find(route=>route.id===params.get('route'))||ROUTES[0];
  current=requested;
  viewport=VIEWPORTS[params.get('viewport')]?params.get('viewport'):'desktop';
  theme=localStorage.getItem('nbc-lab-theme')==='dark'?'dark':'light';
  qs('#routeNav').innerHTML=ROUTES.map(routeButton).join('');
  qs('#routeSelect').innerHTML=ROUTES.map(route=>`<option value="${route.id}">${route.title} · ${route.path}</option>`).join('');
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
  setViewport(viewport);
  setTheme(theme);
  syncRouteControls();
  qs('#labFrame').src=current.src;
  syncUrl();
}
init();
