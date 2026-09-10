const variantAssert=(condition,message)=>{if(!condition)throw new Error(message)};
const sameVariantIds=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const escapeVariant=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const PROOF_KINDS=new Set(['rendered','canonical-state']);

function waitForVariantShowcase(){
  if(document.documentElement.dataset.showcaseReady==='true')return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const onReady=()=>{cleanup();resolve()};
    const observer=new MutationObserver(()=>{
      if(document.documentElement.dataset.showcaseReady==='true'){cleanup();resolve()}
      if(document.documentElement.dataset.showcaseReady==='error'){cleanup();reject(new Error('showcase runtime failed before variant evidence'))}
    });
    const cleanup=()=>{document.removeEventListener('nbc:showcase-ready',onReady);observer.disconnect()};
    document.addEventListener('nbc:showcase-ready',onReady,{once:true});
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-showcase-ready']});
  });
}

function renderStateBackedProof(entry,variants){
  return `<div class="cx-variant-state-proof" data-variant-state-proof="${escapeVariant(entry.id)}"><p class="cx-variant-proof-note"><strong>Canonical state-backed</strong><span>These documented variants reuse the existing live state authority instead of duplicating state markup.</span></p><ul class="cx-variant-state-list">${variants.map(variant=>`<li class="cx-variant-state-ref" data-variant-state-ref="${escapeVariant(variant.id)}" data-state-id="${escapeVariant(variant.stateId)}"><code>${escapeVariant(variant.stateId)}</code><span>${escapeVariant(variant.label)}</span></li>`).join('')}</ul></div>`;
}

function renderVariantEvidence(entry){
  const rendered=entry.variants.filter(variant=>variant.proofKind==='rendered');
  const stateBacked=entry.variants.filter(variant=>variant.proofKind==='canonical-state');
  const choices=rendered.map((variant,index)=>`<button class="cx-variant-choice nbc-tactile" type="button" data-variant-choice="${escapeVariant(variant.id)}" aria-pressed="${index===0?'true':'false'}">${escapeVariant(variant.label)}</button>`).join('');
  const renderedProof=rendered.length?`<div class="cx-variant-rendered-proof" data-variant-rendered-proof><div class="cx-variant-choices" role="group" aria-label="${escapeVariant(entry.id)} rendered variants">${choices}</div><div class="cx-variant-panel" data-variant-panel data-variant-current="${escapeVariant(rendered[0].id)}">${rendered[0].markup}</div></div>`:'';
  const stateProof=stateBacked.length?renderStateBackedProof(entry,stateBacked):'';
  return `<details class="cx-variant-evidence" data-component-variant-evidence data-variant-batch="${escapeVariant(entry.batchId)}"><summary><span>Variant proof</span><span>${entry.variants.length}/${entry.variants.length}</span></summary><div class="cx-variant-body">${renderedProof}${stateProof}</div></details>`;
}

function validateStateBackedProof(card,entry){
  const stateBacked=entry.variants.filter(variant=>variant.proofKind==='canonical-state');
  if(!stateBacked.length)return;
  const matrix=card.querySelector(`[data-state-matrix][data-component-state-id="${CSS.escape(entry.id)}"]`);
  variantAssert(matrix,`canonical-state variant evidence missing live state matrix: ${entry.id}`);
  const liveStateIds=[...matrix.querySelectorAll('[data-showcase-state]')].map(button=>button.dataset.showcaseState);
  const referencedStateIds=stateBacked.map(variant=>variant.stateId);
  for(const stateId of referencedStateIds)variantAssert(liveStateIds.includes(stateId),`canonical-state variant evidence references missing live state: ${entry.id}:${stateId}`);
}

function bindVariantEvidence(card,entry){
  const details=card.querySelector('[data-component-variant-evidence]');
  const panel=details.querySelector('[data-variant-panel]');
  const choices=[...details.querySelectorAll('[data-variant-choice]')];
  const rendered=new Map(entry.variants.filter(variant=>variant.proofKind==='rendered').map(variant=>[variant.id,variant]));
  if(!choices.length)return;
  variantAssert(panel,'rendered variant evidence missing panel: '+entry.id);
  for(const choice of choices)choice.addEventListener('click',()=>{
    const variant=rendered.get(choice.dataset.variantChoice);
    variantAssert(variant,`unknown rendered variant choice: ${entry.id}:${choice.dataset.variantChoice}`);
    for(const peer of choices)peer.setAttribute('aria-pressed',String(peer===choice));
    panel.dataset.variantCurrent=variant.id;
    panel.innerHTML=variant.markup;
  });
}

function validateManifest(manifest){
  variantAssert(manifest.schema==='neobrutal-commerce/component-variant-evidence@2','unexpected component variant evidence schema');
  variantAssert(manifest.showcaseVersion==='1.1.0'&&manifest.commerceVersion==='1.0.0','component variant evidence versions drifted');
  variantAssert(manifest.role==='variant-evidence-only','component variant evidence must remain evidence only');
  variantAssert(Array.isArray(manifest.batches)&&manifest.batches.length>0,'component variant evidence requires ordered batches');
  variantAssert(Array.isArray(manifest.components)&&manifest.components.length>0,'component variant evidence requires component proof');
  const batchIds=manifest.batches.map(batch=>batch.id);
  variantAssert(new Set(batchIds).size===batchIds.length,'component variant evidence contains duplicate batch ids');
  manifest.batches.forEach((batch,index)=>{
    variantAssert(batch.ordinal===index+1,`component variant evidence batch ordinal drifted: ${batch.id}`);
    variantAssert(Array.isArray(batch.componentIds)&&batch.componentIds.length>0,`component variant evidence batch has no members: ${batch.id}`);
    variantAssert(new Set(batch.componentIds).size===batch.componentIds.length,`component variant evidence batch contains duplicate members: ${batch.id}`);
  });
  const componentIds=manifest.components.map(entry=>entry.id);
  variantAssert(new Set(componentIds).size===componentIds.length,'component variant evidence contains duplicate component ids');
  const batchedIds=manifest.batches.flatMap(batch=>batch.componentIds);
  variantAssert(new Set(batchedIds).size===batchedIds.length,'component variant evidence batches overlap');
  variantAssert(sameVariantIds(componentIds,batchedIds),'component variant evidence batch membership does not match component proof');
  const batches=new Map(manifest.batches.map(batch=>[batch.id,batch]));
  for(const entry of manifest.components){
    const batch=batches.get(entry.batchId);
    variantAssert(batch?.componentIds.includes(entry.id),`component variant evidence provenance drifted: ${entry.id}`);
    variantAssert(Array.isArray(entry.variants)&&entry.variants.length>0,`component variant evidence missing variants: ${entry.id}`);
    variantAssert(new Set(entry.variants.map(variant=>variant.id)).size===entry.variants.length,`duplicate variant id: ${entry.id}`);
    for(const variant of entry.variants){
      variantAssert(PROOF_KINDS.has(variant.proofKind),`unknown variant proof kind: ${entry.id}:${variant.id}:${variant.proofKind}`);
      if(variant.proofKind==='rendered')variantAssert(typeof variant.markup==='string'&&variant.markup.trim(),`rendered variant evidence missing markup: ${entry.id}:${variant.id}`);
      if(variant.proofKind==='canonical-state')variantAssert(typeof variant.stateId==='string'&&variant.stateId.trim(),`canonical-state variant evidence missing state id: ${entry.id}:${variant.id}`);
    }
  }
}

async function initComponentVariantEvidence(){
  try{
    const response=await fetch('./storefront/component-variant-evidence.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Component variant evidence request failed: ${response.status}`);
    const manifest=await response.json();
    validateManifest(manifest);
    const totalVariants=manifest.components.reduce((sum,entry)=>sum+entry.variants.length,0);
    const renderedVariants=manifest.components.reduce((sum,entry)=>sum+entry.variants.filter(variant=>variant.proofKind==='rendered').length,0);
    const stateBackedVariants=totalVariants-renderedVariants;
    await waitForVariantShowcase();
    const cards=[...document.querySelectorAll('[data-component-card]')];
    variantAssert(cards.length===47,'component variant evidence requires 47 rendered component cards');
    const evidenceById=new Map(manifest.components.map(entry=>[entry.id,entry]));
    for(const card of cards){
      const entry=evidenceById.get(card.dataset.componentId);
      card.dataset.demoVariantEvidence=String(Boolean(entry));
      card.querySelector('[data-component-variant-evidence]')?.remove();
      if(!entry)continue;
      validateStateBackedProof(card,entry);
      const contract=card.querySelector('.cx-contract');
      variantAssert(contract,`component variant evidence missing contract panel: ${entry.id}`);
      contract.insertAdjacentHTML('beforeend',renderVariantEvidence(entry));
      bindVariantEvidence(card,entry);
    }
    document.documentElement.dataset.componentVariantReady='true';
    document.documentElement.dataset.componentVariantAudited=String(evidenceById.size);
    document.documentElement.dataset.componentVariantCount=String(totalVariants);
    document.documentElement.dataset.componentVariantRenderedCount=String(renderedVariants);
    document.documentElement.dataset.componentVariantStateBackedCount=String(stateBackedVariants);
    document.documentElement.dataset.componentVariantBatches=String(manifest.batches.length);
  }catch(error){
    document.documentElement.dataset.componentVariantReady='error';
    console.error(error);
  }
}

initComponentVariantEvidence();
