const root=document.documentElement;
const qs=(selector,scope=document)=>scope.querySelector(selector);
const qsa=(selector,scope=document)=>[...scope.querySelectorAll(selector)];
const expectedPatternIds=['tactile-press','latched-selection','processing-feedback','result-feedback'];
const expectedExceptionIds=['drag-lift'];

function assert(condition,message){if(!condition)throw new Error(`Motion Lab: ${message}`)}
async function fetchJson(url){
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`Motion Lab: ${url} returned ${response.status}`);
  return response.json();
}
function same(actual,expected){return JSON.stringify(actual)===JSON.stringify(expected)}
function label(value){return String(value).replaceAll('-',' ').replaceAll('_',' ').toUpperCase()}
function textNode(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node}
function chip(value){return textNode('span',value,'motion-chip')}
function contractRow(term,values,{chips=true}={}){
  const row=document.createElement('dl');row.className='motion-contract-row';
  const dt=textNode('dt',term);const dd=document.createElement('dd');
  const list=Array.isArray(values)?values:[values];
  if(chips){for(const value of list.length?list:['none'])dd.append(chip(value))}
  else dd.append(textNode('p',list.join(' · '),'motion-contract-copy'));
  row.append(dt,dd);return row;
}
function renderPattern(pattern){
  const card=qs(`[data-interaction-pattern="${pattern.id}"]`);
  assert(card,`missing live slot for ${pattern.id}`);
  qs('[data-pattern-kind]',card).textContent=label(pattern.kind);
  qs('[data-pattern-title]',card).textContent=pattern.title;
  qs('[data-pattern-description]',card).textContent=pattern.description;
  const contract=qs('[data-pattern-contract]',card);contract.replaceChildren();
  contract.append(
    contractRow('Selector',pattern.selector),
    contractRow('Triggers',pattern.triggers),
    contractRow('Inputs',pattern.inputs),
    contractRow('States',pattern.states),
    contractRow('Programmatic',pattern.programmaticState),
    contractRow('Reduced motion',pattern.reducedMotion,{chips:false}),
    contractRow('Forced colors',pattern.forcedColors,{chips:false})
  );
}
function renderTokens(contract){
  const grid=qs('#tokenGrid');grid.replaceChildren();
  const styles=getComputedStyle(root);
  for(const [role,token] of Object.entries(contract.tokens)){
    const item=document.createElement('div');item.className='motion-token-item';item.dataset.tokenRole=role;
    const dt=textNode('dt',label(role));
    const dd=document.createElement('dd');
    const value=styles.getPropertyValue(token).trim();
    dd.append(textNode('strong',token),textNode('code',value||'unresolved'));
    item.append(dt,dd);grid.append(item);
  }
}
function wirePreferenceReadout(){
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  const output=qs('#systemMotion');
  const sync=()=>{output.textContent=query.matches?'REDUCE':'NO PREFERENCE';output.dataset.systemMotion=query.matches?'reduce':'no-preference'};
  sync();query.addEventListener?.('change',sync);

  const toggle=qs('#motionPreviewToggle');const status=qs('#motionPreviewStatus');
  toggle.addEventListener('click',()=>{
    const active=toggle.getAttribute('aria-pressed')!=='true';
    toggle.setAttribute('aria-pressed',String(active));
    if(active)root.dataset.motionPreview='reduced';else delete root.dataset.motionPreview;
    toggle.textContent=active?'REDUCED MOTION PREVIEW: ON':'PREVIEW REDUCED MOTION';
    status.textContent=active
      ? 'Preview override on for this lab. Operating-system preference remains authoritative.'
      : 'Preview override off. Operating-system preference remains authoritative.';
  });
}
function wirePressProof(){
  let presses=0;const button=qs('#pressDemo');const result=qs('#pressResult');
  button.addEventListener('click',()=>{presses+=1;result.textContent=`Activation ${presses} complete. The hit target stayed stable through pointerdown → click.`});
}
async function boot(){
  root.dataset.interactionLabReady='loading';
  try{
    const contract=await fetchJson('../storefront/interactions.json');
    assert(contract.schema==='neobrutal-commerce/interactions@1',`unexpected schema ${contract.schema}`);
    assert(contract.interactionVersion==='1.3.0',`unexpected interaction version ${contract.interactionVersion}`);
    assert(contract.commerceVersion==='1.0.0',`unexpected Commerce version ${contract.commerceVersion}`);
    const patternIds=(contract.patterns||[]).map(pattern=>pattern.id);
    const exceptionIds=(contract.exceptions||[]).map(exception=>exception.id);
    assert(same(patternIds,expectedPatternIds),`pattern ids drifted: ${patternIds.join(', ')}`);
    assert(same(exceptionIds,expectedExceptionIds),`exception ids drifted: ${exceptionIds.join(', ')}`);
    assert(qsa('[data-interaction-pattern]').length===expectedPatternIds.length,'live pattern slot count drifted');
    for(const pattern of contract.patterns)renderPattern(pattern);
    const drag=contract.exceptions[0];
    assert(drag.productionPattern===false,'drag-lift must remain a non-production exception');
    qs('#dragDescription').textContent=`${drag.description} NeoBrutal Commerce does not currently ship a production drag interaction, so this lab does not fake one.`;
    renderTokens(contract);
    qs('#patternCount').textContent=`${contract.patterns.length} PATTERNS`;
    root.dataset.interactionVersion=contract.interactionVersion;
    root.dataset.interactionPatterns=String(contract.patterns.length);
    root.dataset.interactionExceptions=String(contract.exceptions.length);
    root.dataset.interactionLabReady='true';
    qs('#motionStatus').textContent=`Interaction v${contract.interactionVersion} ready · ${contract.patterns.length}/${contract.patterns.length} production patterns · ${contract.exceptions.length} explicit exception · Commerce ${contract.commerceVersion} frozen`;
  }catch(error){
    root.dataset.interactionLabReady='error';
    qs('#motionStatus').textContent=error.message;
    throw error;
  }
}

wirePreferenceReadout();
wirePressProof();
boot();
