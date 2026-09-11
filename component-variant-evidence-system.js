const SYSTEM_VARIANT_EVIDENCE_FILE='./storefront/component-variant-evidence-system.json';
const systemVariantAssert=(condition,message)=>{if(!condition)throw new Error(message)};
const normalizeSystemVariant=value=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const sameSystemVariants=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const escapeSystemVariant=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function waitForAccountDepthStage(){
  if(document.documentElement.dataset.componentDepthAccountReady==='true')return Promise.resolve();
  if(document.documentElement.dataset.componentDepthAccountReady==='error')return Promise.reject(new Error('Account depth extension failed before System variant evidence'));
  return new Promise((resolve,reject)=>{
    const observer=new MutationObserver(()=>{
      if(document.documentElement.dataset.componentDepthAccountReady==='true'){observer.disconnect();resolve()}
      if(document.documentElement.dataset.componentDepthAccountReady==='error'){observer.disconnect();reject(new Error('Account depth extension failed before System variant evidence'))}
    });
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-component-depth-account-ready']});
  });
}

function renderSystemStateProof(entry,variants){
  return `<div class="cx-variant-state-proof" data-variant-state-proof="${escapeSystemVariant(entry.id)}"><p class="cx-variant-proof-note"><strong>Canonical state-backed</strong><span>These documented variants reuse the existing live state authority instead of duplicating state markup.</span></p><ul class="cx-variant-state-list">${variants.map(variant=>`<li class="cx-variant-state-ref" data-variant-state-ref="${escapeSystemVariant(variant.id)}" data-state-id="${escapeSystemVariant(variant.stateId)}"><code>${escapeSystemVariant(variant.stateId)}</code><span>${escapeSystemVariant(variant.label)}</span></li>`).join('')}</ul></div>`;
}

function renderSystemVariantEvidence(entry){
  const rendered=entry.variants.filter(variant=>variant.proofKind==='rendered');
  const stateBacked=entry.variants.filter(variant=>variant.proofKind==='canonical-state');
  const choices=rendered.map((variant,index)=>`<button class="cx-variant-choice nbc-tactile" type="button" data-variant-choice="${escapeSystemVariant(variant.id)}" aria-pressed="${index===0?'true':'false'}">${escapeSystemVariant(variant.label)}</button>`).join('');
  const renderedProof=rendered.length?`<div class="cx-variant-rendered-proof" data-variant-rendered-proof><div class="cx-variant-choices" role="group" aria-label="${escapeSystemVariant(entry.id)} rendered variants">${choices}</div><div class="cx-variant-panel" data-variant-panel data-variant-current="${escapeSystemVariant(rendered[0].id)}">${rendered[0].markup}</div></div>`:'';
  const stateProof=stateBacked.length?renderSystemStateProof(entry,stateBacked):'';
  return `<details class="cx-variant-evidence" data-component-variant-evidence data-variant-batch="${escapeSystemVariant(entry.batchId)}"><summary><span>Variant proof</span><span>${entry.variants.length}/${entry.variants.length}</span></summary><div class="cx-variant-body">${renderedProof}${stateProof}</div></details>`;
}

function bindSystemVariantEvidence(card,entry){
  const details=card.querySelector('[data-component-variant-evidence]');
  const choices=[...details.querySelectorAll('[data-variant-choice]')];
  if(!choices.length)return;
  const panel=details.querySelector('[data-variant-panel]');
  const rendered=new Map(entry.variants.filter(variant=>variant.proofKind==='rendered').map(variant=>[variant.id,variant]));
  systemVariantAssert(panel,`System rendered variant evidence missing panel: ${entry.id}`);
  for(const choice of choices)choice.addEventListener('click',()=>{
    const variant=rendered.get(choice.dataset.variantChoice);
    systemVariantAssert(variant,`unknown System rendered variant choice: ${entry.id}:${choice.dataset.variantChoice}`);
    for(const peer of choices)peer.setAttribute('aria-pressed',String(peer===choice));
    panel.dataset.variantCurrent=variant.id;
    panel.innerHTML=variant.markup;
  });
}

function validateSystemManifest(manifest,showcase){
  systemVariantAssert(manifest.schema==='neobrutal-commerce/component-variant-evidence@4','unexpected System variant evidence schema');
  systemVariantAssert(manifest.showcaseVersion==='1.1.0'&&manifest.commerceVersion==='1.0.0','System variant evidence version drifted');
  systemVariantAssert(manifest.role==='variant-evidence-only','System variant evidence must remain evidence only');
  for(const kind of ['rendered','canonical-state','responsive-backed','interaction-backed','action-backed'])systemVariantAssert(manifest.proofKinds?.[kind],`System variant evidence missing proof kind: ${kind}`);
  systemVariantAssert(manifest.batches?.length===1,'System variant evidence requires exactly one provenance batch');
  const batch=manifest.batches[0];
  const expectedIds=['component-contract','tokens','system-states','ownership-lifecycle'];
  systemVariantAssert(batch.id==='system-foundation'&&batch.ordinal===6&&batch.label==='System + foundation','System variant evidence batch identity drifted');
  systemVariantAssert(sameSystemVariants(batch.componentIds||[],expectedIds),'System variant evidence batch membership drifted');
  const componentIds=(manifest.components||[]).map(entry=>entry.id);
  systemVariantAssert(componentIds.length===4&&new Set(componentIds).size===4&&sameSystemVariants(componentIds,expectedIds),'System variant evidence must cover exact four unique components');
  const showcaseById=new Map((showcase.components||[]).map(component=>[component.id,component]));
  for(const entry of manifest.components){
    const authority=showcaseById.get(entry.id);
    systemVariantAssert(authority,`System variant evidence references unknown showcase component: ${entry.id}`);
    const expectedVariants=(authority.variants||[]).map(normalizeSystemVariant);
    const actualVariants=entry.variants.map(variant=>variant.id);
    systemVariantAssert(expectedVariants.length===actualVariants.length&&sameSystemVariants(expectedVariants,actualVariants),`System variant evidence does not exactly match showcase labels: ${entry.id}`);
    for(const variant of entry.variants){
      systemVariantAssert(variant.id===normalizeSystemVariant(variant.label),`System variant id/label normalization drifted: ${entry.id}:${variant.id}`);
      systemVariantAssert(['rendered','canonical-state'].includes(variant.proofKind),`System extension only accepts rendered or canonical-state proof: ${entry.id}:${variant.id}`);
      if(variant.proofKind==='rendered'){
        systemVariantAssert(typeof variant.markup==='string'&&variant.markup.includes(`data-variant-sample="${entry.id}:${variant.id}"`),`System rendered variant lacks sample identity: ${entry.id}:${variant.id}`);
        systemVariantAssert(!/<script\b|\son[a-z]+\s*=/i.test(variant.markup),`System rendered evidence must remain declarative: ${entry.id}:${variant.id}`);
      }else systemVariantAssert(typeof variant.stateId==='string'&&variant.stateId.trim(),`System canonical-state proof missing state id: ${entry.id}:${variant.id}`);
    }
  }
}

async function initSystemVariantEvidence(){
  try{
    const [evidenceResponse,showcaseResponse]=await Promise.all([
      fetch(SYSTEM_VARIANT_EVIDENCE_FILE,{cache:'no-store'}),
      fetch('./storefront/component-showcase.json',{cache:'no-store'})
    ]);
    if(!evidenceResponse.ok)throw new Error(`System variant evidence request failed: ${evidenceResponse.status}`);
    if(!showcaseResponse.ok)throw new Error(`Component showcase authority request failed: ${showcaseResponse.status}`);
    const [manifest,showcase]=await Promise.all([evidenceResponse.json(),showcaseResponse.json()]);
    validateSystemManifest(manifest,showcase);
    await waitForAccountDepthStage();

    const root=document.documentElement;
    systemVariantAssert(root.dataset.componentVariantReady==='true','System extension requires certified base + Account variant runtime');
    systemVariantAssert(root.dataset.componentVariantAudited==='38'&&root.dataset.componentVariantCount==='100','System extension requires certified Account variant stage 38 components / 100 variants');
    systemVariantAssert(root.dataset.componentVariantRenderedCount==='56'&&root.dataset.componentVariantStateBackedCount==='36','System extension requires certified Account proof split');
    systemVariantAssert(root.dataset.componentVariantResponsiveBackedCount==='4'&&root.dataset.componentVariantInteractionBackedCount==='2'&&root.dataset.componentVariantActionBackedCount==='2'&&root.dataset.componentVariantBatches==='5','System extension requires certified five-batch lineage');

    for(const entry of manifest.components){
      const card=document.querySelector(`[data-component-card][data-component-id="${CSS.escape(entry.id)}"]`);
      systemVariantAssert(card,`System variant evidence missing component card: ${entry.id}`);
      systemVariantAssert(card.dataset.demoVariantEvidence==='false',`System variant component was already marked proven: ${entry.id}`);
      systemVariantAssert(!card.querySelector('[data-component-variant-evidence]'),`System variant component already contains evidence UI: ${entry.id}`);
      const stateBacked=entry.variants.filter(variant=>variant.proofKind==='canonical-state');
      if(stateBacked.length){
        const matrix=card.querySelector(`[data-state-matrix][data-component-state-id="${CSS.escape(entry.id)}"]`);
        systemVariantAssert(matrix,`System canonical-state evidence missing live state matrix: ${entry.id}`);
        const liveStates=new Set([...matrix.querySelectorAll('[data-showcase-state]')].map(button=>button.dataset.showcaseState));
        for(const variant of stateBacked)systemVariantAssert(liveStates.has(variant.stateId),`System canonical-state proof references missing live state: ${entry.id}:${variant.stateId}`);
      }
      const depthAudit=card.querySelector('[data-component-depth-audit]');
      systemVariantAssert(depthAudit,`System variant evidence requires existing depth audit: ${entry.id}`);
      depthAudit.insertAdjacentHTML('beforebegin',renderSystemVariantEvidence(entry));
      card.dataset.demoVariantEvidence='true';
      bindSystemVariantEvidence(card,entry);
    }

    root.dataset.componentVariantAudited='42';
    root.dataset.componentVariantCount='117';
    root.dataset.componentVariantRenderedCount='67';
    root.dataset.componentVariantStateBackedCount='42';
    root.dataset.componentVariantResponsiveBackedCount='4';
    root.dataset.componentVariantInteractionBackedCount='2';
    root.dataset.componentVariantActionBackedCount='2';
    root.dataset.componentVariantBatches='6';
    root.dataset.componentVariantSystemReady='true';
    document.dispatchEvent(new CustomEvent('nbc:system-variant-ready'));
  }catch(error){
    document.documentElement.dataset.componentVariantSystemReady='error';
    console.error(error);
  }
}

initSystemVariantEvidence();
