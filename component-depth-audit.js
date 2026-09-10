const DEPTH_STATUS_ORDER=['complete','partial','missing','not-applicable'];
const escapeDepth=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const sameDepthIds=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const depthAssert=(condition,message)=>{if(!condition)throw new Error(message)};

function waitForShowcaseReady(){
  if(document.documentElement.dataset.showcaseReady==='true')return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const onReady=()=>{cleanup();resolve()};
    const observer=new MutationObserver(()=>{
      if(document.documentElement.dataset.showcaseReady==='true'){cleanup();resolve()}
      if(document.documentElement.dataset.showcaseReady==='error'){cleanup();reject(new Error('showcase runtime failed before component depth audit'))}
    });
    const cleanup=()=>{document.removeEventListener('nbc:showcase-ready',onReady);observer.disconnect()};
    document.addEventListener('nbc:showcase-ready',onReady,{once:true});
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-showcase-ready']});
  });
}

function renderDepthAudit(audit,criteria,firstBatch){
  const groups=DEPTH_STATUS_ORDER.map(status=>{
    const matches=criteria.filter(criterion=>audit[criterion.id]===status);
    if(!matches.length)return '';
    return `<div class="cx-depth-group" data-depth-group="${status}"><strong>${escapeDepth(status.replace('-', ' '))} · ${matches.length}</strong><div class="cx-depth-chips">${matches.map(criterion=>`<span class="cx-depth-chip" data-depth-status="${status}" title="Evidence authority: ${escapeDepth(criterion.evidenceAuthority)}">${escapeDepth(criterion.label)}</span>`).join('')}</div></div>`;
  }).join('');
  const complete=criteria.filter(criterion=>audit[criterion.id]==='complete').length;
  const partial=criteria.filter(criterion=>audit[criterion.id]==='partial').length;
  const missing=criteria.filter(criterion=>audit[criterion.id]==='missing').length;
  const batch=firstBatch?'<p class="cx-depth-first-batch">FIRST DEPTH BATCH · canonical stateful/high-risk component</p>':'';
  return `<details class="cx-depth-audit" data-component-depth-audit><summary><span>Demo depth audit</span><span class="cx-depth-summary">${complete} complete · ${partial} partial · ${missing} missing</span></summary><div class="cx-depth-grid">${groups}</div>${batch}</details>`;
}

async function initComponentDepthAudit(){
  try{
    const response=await fetch('./storefront/component-demo-depth.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Component demo depth request failed: ${response.status}`);
    const manifest=await response.json();
    depthAssert(manifest.schema==='neobrutal-commerce/component-demo-depth@1','unexpected component demo depth schema');
    depthAssert(manifest.showcaseVersion==='1.1.0','component demo depth must remain Showcase v1.1');
    depthAssert(manifest.commerceVersion==='1.0.0','component demo depth must target frozen Commerce v1.0');
    depthAssert(manifest.role==='audit-evidence-only','component demo depth must remain audit evidence only');
    depthAssert(sameDepthIds(manifest.statuses||[],DEPTH_STATUS_ORDER),'component demo depth status taxonomy drifted');
    depthAssert(manifest.criteria?.length===13,'component demo depth must cover the 13 v1.1 audit criteria');
    depthAssert(manifest.components?.length===47,'component demo depth must audit all 47 components');
    await waitForShowcaseReady();
    const cards=[...document.querySelectorAll('[data-component-card]')];
    depthAssert(cards.length===47,'component demo depth requires 47 rendered component cards');
    const cardIds=cards.map(card=>card.dataset.componentId);
    depthAssert(sameDepthIds(cardIds,manifest.components.map(component=>component.id)),'component demo depth ids drifted from rendered component cards');
    const firstBatch=new Set(manifest.nextImplementationBatch||[]);
    const entries=new Map(manifest.components.map(component=>[component.id,component]));
    let missingCells=0;
    let partialCells=0;
    for(const card of cards){
      const entry=entries.get(card.dataset.componentId);
      const audit={...manifest.defaultStatus,...(entry.overrides||{})};
      const missing=manifest.criteria.filter(criterion=>audit[criterion.id]==='missing').length;
      const partial=manifest.criteria.filter(criterion=>audit[criterion.id]==='partial').length;
      missingCells+=missing;
      partialCells+=partial;
      card.dataset.demoDepthMissing=String(missing);
      card.dataset.demoDepthPartial=String(partial);
      card.dataset.demoDepthFirstBatch=String(firstBatch.has(card.dataset.componentId));
      card.querySelector('[data-component-depth-audit]')?.remove();
      const contract=card.querySelector('.cx-contract');
      depthAssert(contract,`component depth audit missing contract panel: ${card.dataset.componentId}`);
      contract.insertAdjacentHTML('beforeend',renderDepthAudit(audit,manifest.criteria,firstBatch.has(card.dataset.componentId)));
    }
    document.documentElement.dataset.componentDepthReady='true';
    document.documentElement.dataset.componentDepthAudited=String(cards.length);
    document.documentElement.dataset.componentDepthMissing=String(missingCells);
    document.documentElement.dataset.componentDepthPartial=String(partialCells);
  }catch(error){
    document.documentElement.dataset.componentDepthReady='error';
    console.error(error);
  }
}

initComponentDepthAudit();
