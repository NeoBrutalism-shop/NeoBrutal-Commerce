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

function renderImplementationEvidence(evidence){
  if(!evidence)return '';
  const tokens=evidence.tokens.map(token=>`<code class="cx-depth-token">${escapeDepth(token)}</code>`).join('');
  const sources=evidence.sourceFiles.map(file=>`<code>${escapeDepth(file)}</code>`).join(' · ');
  const codeBlocks=['html','css','js'].map(kind=>`<section class="cx-depth-code" data-copy-ready-kind="${kind}"><strong>${kind.toUpperCase()}</strong><pre tabindex="0"><code>${escapeDepth(evidence.copyReady[kind])}</code></pre></section>`).join('');
  return `<div class="cx-depth-evidence" data-demo-implementation-evidence><div class="cx-depth-evidence-head"><div><strong>Implementation evidence</strong><p>Source-backed tokens and copy-ready anatomy. Runtime meaning still comes from the frozen Commerce authorities.</p></div><span>12-COMPONENT BATCH</span></div><div class="cx-depth-source"><strong>Sources</strong><p>${sources}</p></div><div class="cx-depth-token-list" data-demo-token-list>${tokens}</div><div class="cx-depth-code-grid">${codeBlocks}</div></div>`;
}

function renderDepthAudit(audit,criteria,firstBatch,evidence){
  const groups=DEPTH_STATUS_ORDER.map(status=>{
    const matches=criteria.filter(criterion=>audit[criterion.id]===status);
    if(!matches.length)return '';
    return `<div class="cx-depth-group" data-depth-group="${status}"><strong>${escapeDepth(status.replace('-', ' '))} · ${matches.length}</strong><div class="cx-depth-chips">${matches.map(criterion=>`<span class="cx-depth-chip" data-depth-status="${status}" title="Evidence authority: ${escapeDepth(criterion.evidenceAuthority)}">${escapeDepth(criterion.label)}</span>`).join('')}</div></div>`;
  }).join('');
  const complete=criteria.filter(criterion=>audit[criterion.id]==='complete').length;
  const partial=criteria.filter(criterion=>audit[criterion.id]==='partial').length;
  const missing=criteria.filter(criterion=>audit[criterion.id]==='missing').length;
  const batch=firstBatch?'<p class="cx-depth-first-batch">FIRST DEPTH BATCH · canonical stateful/high-risk component</p>':'';
  return `<details class="cx-depth-audit" data-component-depth-audit><summary><span>Demo depth audit</span><span class="cx-depth-summary">${complete} complete · ${partial} partial · ${missing} missing</span></summary><div class="cx-depth-grid">${groups}</div>${batch}${renderImplementationEvidence(evidence)}</details>`;
}

async function initComponentDepthAudit(){
  try{
    const [auditResponse,implementationResponse]=await Promise.all([
      fetch('./storefront/component-demo-depth.json',{cache:'no-store'}),
      fetch('./storefront/component-demo-implementation.json',{cache:'no-store'})
    ]);
    if(!auditResponse.ok)throw new Error(`Component demo depth request failed: ${auditResponse.status}`);
    if(!implementationResponse.ok)throw new Error(`Component demo implementation request failed: ${implementationResponse.status}`);
    const [manifest,implementation]=await Promise.all([auditResponse.json(),implementationResponse.json()]);
    depthAssert(manifest.schema==='neobrutal-commerce/component-demo-depth@1','unexpected component demo depth schema');
    depthAssert(manifest.showcaseVersion==='1.1.0','component demo depth must remain Showcase v1.1');
    depthAssert(manifest.commerceVersion==='1.0.0','component demo depth must target frozen Commerce v1.0');
    depthAssert(manifest.role==='audit-evidence-only','component demo depth must remain audit evidence only');
    depthAssert(sameDepthIds(manifest.statuses||[],DEPTH_STATUS_ORDER),'component demo depth status taxonomy drifted');
    depthAssert(manifest.criteria?.length===13,'component demo depth must cover the 13 v1.1 audit criteria');
    depthAssert(manifest.components?.length===47,'component demo depth must audit all 47 components');
    depthAssert(implementation.schema==='neobrutal-commerce/component-demo-implementation@1','unexpected component demo implementation schema');
    depthAssert(implementation.showcaseVersion==='1.1.0'&&implementation.commerceVersion==='1.0.0','component demo implementation versions drifted');
    depthAssert(implementation.role==='implementation-evidence-only','component demo implementation must remain evidence only');
    depthAssert(sameDepthIds(implementation.components.map(component=>component.id),manifest.nextImplementationBatch||[]),'component demo implementation must cover the exact first batch');
    await waitForShowcaseReady();
    const cards=[...document.querySelectorAll('[data-component-card]')];
    depthAssert(cards.length===47,'component demo depth requires 47 rendered component cards');
    const cardIds=cards.map(card=>card.dataset.componentId);
    depthAssert(sameDepthIds(cardIds,manifest.components.map(component=>component.id)),'component demo depth ids drifted from rendered component cards');
    const firstBatch=new Set(manifest.nextImplementationBatch||[]);
    const entries=new Map(manifest.components.map(component=>[component.id,component]));
    const implementationById=new Map(implementation.components.map(component=>[component.id,component]));
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
      card.dataset.demoImplementationEvidence=String(implementationById.has(card.dataset.componentId));
      card.querySelector('[data-component-depth-audit]')?.remove();
      const contract=card.querySelector('.cx-contract');
      depthAssert(contract,`component depth audit missing contract panel: ${card.dataset.componentId}`);
      contract.insertAdjacentHTML('beforeend',renderDepthAudit(audit,manifest.criteria,firstBatch.has(card.dataset.componentId),implementationById.get(card.dataset.componentId)));
    }
    document.documentElement.dataset.componentDepthReady='true';
    document.documentElement.dataset.componentDepthAudited=String(cards.length);
    document.documentElement.dataset.componentDepthMissing=String(missingCells);
    document.documentElement.dataset.componentDepthPartial=String(partialCells);
    document.documentElement.dataset.componentImplementationReady='true';
    document.documentElement.dataset.componentImplementationAudited=String(implementation.components.length);
  }catch(error){
    document.documentElement.dataset.componentDepthReady='error';
    document.documentElement.dataset.componentImplementationReady='error';
    console.error(error);
  }
}

initComponentDepthAudit();
