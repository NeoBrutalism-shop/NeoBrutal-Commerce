const EXPECTED_SHOWCASE_VERSION='1.1.0';
const EXPECTED_COMMERCE_VERSION='1.0.0';
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const normalize=value=>String(value||'').trim().toLowerCase();

async function fetchJson(url){
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`${url} request failed: ${response.status}`);
  return response.json();
}

function assert(condition,message){
  if(!condition)throw new Error(message);
}

function assertUnique(items,label){
  const ids=items.map(item=>item.id);
  assert(new Set(ids).size===ids.length,`${label} contains duplicate ids`);
}

function sameIds(actual,expected){
  const a=[...actual].sort();
  const b=[...expected].sort();
  return JSON.stringify(a)===JSON.stringify(b);
}

function waitForExplorer(){
  const ready=()=>document.querySelectorAll('[data-component-card]').length===47&&document.querySelectorAll('[data-block-card]').length===18;
  if(ready())return Promise.resolve();
  return new Promise(resolve=>{
    const observer=new MutationObserver(()=>{
      if(!ready())return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.documentElement,{subtree:true,childList:true});
  });
}

function chipRow(label,values){
  return `<div class="cx-doc-row"><dt>${escapeHtml(label)}</dt><dd>${values.map(value=>`<span class="cx-chip">${escapeHtml(value)}</span>`).join('')}</dd></div>`;
}

function designDetails(doc,contract){
  const responsive=contract.responsiveModes[doc.responsiveMode];
  const theme=contract.themeModes[doc.themeMode];
  const a11y=doc.a11y.map(code=>({code,text:contract.a11yRules[code]}));
  return `<details class="cx-doc" data-doc-complete>
    <summary>Design + implementation contract</summary>
    <dl class="cx-doc-grid">
      ${chipRow('Variants',doc.variants)}
      <div class="cx-doc-row"><dt>Responsive</dt><dd><code>${escapeHtml(doc.responsiveMode)}</code><span>${escapeHtml(responsive)}</span></dd></div>
      <div class="cx-doc-row"><dt>Theme</dt><dd><code>${escapeHtml(doc.themeMode)}</code><span>${escapeHtml(theme)}</span></dd></div>
      <div class="cx-doc-row"><dt>Accessibility</dt><dd>${a11y.map(rule=>`<span class="cx-doc-rule"><code>${escapeHtml(rule.code)}</code>${escapeHtml(rule.text)}</span>`).join('')}</dd></div>
    </dl>
  </details>`;
}

function validateContracts(registry,contract,blocks){
  assert(contract.schema==='neobrutal-commerce/component-showcase@1','unexpected component showcase schema');
  assert(blocks.schema==='neobrutal-commerce/blocks@1','unexpected blocks showcase schema');
  assert(contract.showcaseVersion===EXPECTED_SHOWCASE_VERSION,'component showcase version mismatch');
  assert(blocks.showcaseVersion===EXPECTED_SHOWCASE_VERSION,'blocks showcase version mismatch');
  assert(contract.commerceVersion===EXPECTED_COMMERCE_VERSION,'component showcase Commerce version mismatch');
  assert(blocks.commerceVersion===EXPECTED_COMMERCE_VERSION,'blocks showcase Commerce version mismatch');
  assert(registry.commerceVersion===EXPECTED_COMMERCE_VERSION,'component registry Commerce version mismatch');
  assert(registry.components?.length===47,'expected 47 frozen component contracts');
  assert(contract.components?.length===47,'expected 47 showcase component docs');
  assert(blocks.blocks?.length===18,'expected 18 reusable block docs');
  assertUnique(registry.components,'component registry');
  assertUnique(contract.components,'component showcase');
  assertUnique(blocks.blocks,'blocks showcase');
  const registryIds=registry.components.map(component=>component.id);
  const docIds=contract.components.map(component=>component.id);
  assert(sameIds(registryIds,docIds),'component showcase ids drifted from frozen registry');
  const categoryIds=new Set(contract.categories.map(category=>category.id));
  const responsiveIds=new Set(Object.keys(contract.responsiveModes));
  const themeIds=new Set(Object.keys(contract.themeModes));
  const a11yIds=new Set(Object.keys(contract.a11yRules));
  for(const doc of contract.components){
    assert(categoryIds.has(doc.category),`unknown component category: ${doc.id}:${doc.category}`);
    assert(responsiveIds.has(doc.responsiveMode),`unknown responsive mode: ${doc.id}:${doc.responsiveMode}`);
    assert(themeIds.has(doc.themeMode),`unknown theme mode: ${doc.id}:${doc.themeMode}`);
    for(const code of doc.a11y)assert(a11yIds.has(code),`unknown a11y rule: ${doc.id}:${code}`);
  }
  for(const block of blocks.blocks){
    assert(categoryIds.has(block.category),`unknown block category: ${block.id}:${block.category}`);
    assert(responsiveIds.has(block.responsiveMode),`unknown block responsive mode: ${block.id}:${block.responsiveMode}`);
    assert(themeIds.has(block.themeMode),`unknown block theme mode: ${block.id}:${block.themeMode}`);
    for(const code of block.a11y)assert(a11yIds.has(code),`unknown block a11y rule: ${block.id}:${code}`);
    for(const id of block.components)assert(registryIds.includes(id),`block ${block.id} references unknown component ${id}`);
  }
}

function decorateComponents(contract){
  const docs=new Map(contract.components.map(doc=>[doc.id,doc]));
  for(const card of document.querySelectorAll('[data-component-card]')){
    const id=card.dataset.componentId;
    const doc=docs.get(id);
    assert(doc,`rendered component missing showcase doc: ${id}`);
    card.dataset.category=doc.category;
    card.dataset.search=`${card.dataset.search||''} ${normalize(doc.description)} ${normalize(doc.variants.join(' '))} ${normalize(doc.a11y.join(' '))} ${normalize(doc.responsiveMode)} ${normalize(doc.themeMode)}`;
    const header=card.querySelector('.cx-component-head');
    const oldDescription=card.querySelector('.cx-component-description');
    oldDescription?.remove();
    header.insertAdjacentHTML('afterend',`<p class="cx-component-description">${escapeHtml(doc.description)}</p>`);
    const contractPanel=card.querySelector('.cx-contract');
    contractPanel.querySelector('.cx-doc')?.remove();
    contractPanel.insertAdjacentHTML('afterbegin',designDetails(doc,contract));
    const live=contractPanel.querySelector('.cx-live-link');
    if(live)live.href=doc.route;
    const firstChip=contractPanel.querySelector('.cx-chip-row .cx-chip');
    const category=contract.categories.find(item=>item.id===doc.category);
    if(firstChip&&category)firstChip.textContent=category.label;
  }
}

function decorateCategories(contract){
  const counts=new Map(contract.categories.map(category=>[category.id,0]));
  for(const doc of contract.components)counts.set(doc.category,(counts.get(doc.category)||0)+1);
  const all=document.querySelector('#categoryNav [data-category="all"]');
  if(all)all.innerHTML=`All components <span>${contract.components.length}</span>`;
  for(const category of contract.categories){
    const button=document.querySelector(`#categoryNav [data-category="${CSS.escape(category.id)}"]`);
    if(!button)continue;
    button.innerHTML=`${escapeHtml(category.label)} <span>${counts.get(category.id)||0}</span>`;
    button.title=category.description;
  }
}

function decorateBlocks(blocks,contract){
  const byTitle=new Map(blocks.blocks.map(block=>[block.title,block]));
  const seen=new Set();
  for(const card of document.querySelectorAll('[data-block-card]')){
    const title=card.querySelector('h3')?.textContent?.trim();
    const block=byTitle.get(title);
    assert(block,`rendered block missing showcase doc: ${title||'untitled'}`);
    assert(!seen.has(block.id),`rendered block duplicated: ${block.id}`);
    seen.add(block.id);
    card.dataset.blockId=block.id;
    card.dataset.category=block.category;
    card.dataset.search=normalize([block.id,block.title,block.category,block.description,...block.components,block.responsiveMode,block.themeMode,...block.a11y].join(' '));
    const copy=card.querySelector('.cx-block-copy');
    copy.querySelector('.cx-kicker').textContent=`${block.category} block`;
    copy.querySelector('h3').textContent=block.title;
    const paragraph=copy.querySelector(':scope > p:not(.cx-kicker)');
    if(paragraph)paragraph.textContent=block.description;
    const meta=copy.querySelector('.cx-block-meta');
    if(meta)meta.innerHTML=block.components.map(id=>`<span class="cx-chip">${escapeHtml(id)}</span>`).join('');
    copy.querySelector('.cx-doc')?.remove();
    const link=copy.querySelector('a');
    if(link)link.href=block.route;
    if(link)link.insertAdjacentHTML('beforebegin',designDetails(block,contract));
  }
  assert(seen.size===18,'rendered block set did not match 18-block showcase contract');
}

function updateCounts(contract,blocks){
  const componentCount=document.querySelector('#componentCount');
  if(componentCount)componentCount.textContent=String(contract.components.length);
  const componentTab=document.querySelector('#componentsTab span');
  if(componentTab)componentTab.textContent=String(contract.components.length);
  const blockTab=document.querySelector('#blocksTab span');
  if(blockTab)blockTab.textContent=String(blocks.blocks.length);
  const blockStat=[...document.querySelectorAll('.cx-stats div')].find(item=>item.querySelector('span')?.textContent?.trim()==='blocks')?.querySelector('strong');
  if(blockStat)blockStat.textContent=String(blocks.blocks.length);
  const blockCount=document.querySelector('#blockCount');
  if(blockCount)blockCount.textContent=`${blocks.blocks.length} blocks`;
}

async function initShowcaseContracts(){
  try{
    const [registry,contract,blocks]=await Promise.all([
      fetchJson('./storefront/components.json'),
      fetchJson('./storefront/component-showcase.json'),
      fetchJson('./storefront/blocks.json')
    ]);
    validateContracts(registry,contract,blocks);
    await waitForExplorer();
    decorateComponents(contract);
    decorateCategories(contract);
    decorateBlocks(blocks,contract);
    updateCounts(contract,blocks);
    document.documentElement.dataset.showcaseVersion=EXPECTED_SHOWCASE_VERSION;
    document.documentElement.dataset.showcaseReady='true';
    document.dispatchEvent(new CustomEvent('nbc:showcase-ready',{detail:{showcaseVersion:EXPECTED_SHOWCASE_VERSION,components:47,blocks:18}}));
  }catch(error){
    document.documentElement.dataset.showcaseReady='error';
    const main=document.querySelector('#content');
    main?.insertAdjacentHTML('afterbegin',`<div class="cx-contract-error" role="alert"><strong>Showcase contract failed.</strong><span>${escapeHtml(error.message)}</span></div>`);
    console.error(error);
  }
}

initShowcaseContracts();
