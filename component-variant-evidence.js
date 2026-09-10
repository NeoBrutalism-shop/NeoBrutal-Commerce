const VARIANT_BATCH_IDS=['product-card','trust-strip','promo-band','badge','price-block'];
const variantAssert=(condition,message)=>{if(!condition)throw new Error(message)};
const sameVariantIds=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const escapeVariant=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

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

function renderVariantEvidence(entry){
  const first=entry.variants[0];
  const choices=entry.variants.map((variant,index)=>`<button class="cx-variant-choice nbc-tactile" type="button" data-variant-choice="${escapeVariant(variant.id)}" aria-pressed="${index===0?'true':'false'}">${escapeVariant(variant.label)}</button>`).join('');
  return `<details class="cx-variant-evidence" data-component-variant-evidence><summary><span>Variant proof</span><span>${entry.variants.length}/${entry.variants.length}</span></summary><div class="cx-variant-body"><div class="cx-variant-choices" role="group" aria-label="${escapeVariant(entry.id)} variants">${choices}</div><div class="cx-variant-panel" data-variant-panel data-variant-current="${escapeVariant(first.id)}">${first.markup}</div></div></details>`;
}

function bindVariantEvidence(card,entry){
  const details=card.querySelector('[data-component-variant-evidence]');
  const panel=details.querySelector('[data-variant-panel]');
  const choices=[...details.querySelectorAll('[data-variant-choice]')];
  const byId=new Map(entry.variants.map(variant=>[variant.id,variant]));
  for(const choice of choices)choice.addEventListener('click',()=>{
    const variant=byId.get(choice.dataset.variantChoice);
    variantAssert(variant,`unknown variant choice: ${entry.id}:${choice.dataset.variantChoice}`);
    for(const peer of choices)peer.setAttribute('aria-pressed',String(peer===choice));
    panel.dataset.variantCurrent=variant.id;
    panel.innerHTML=variant.markup;
  });
}

async function initComponentVariantEvidence(){
  try{
    const response=await fetch('./storefront/component-variant-evidence.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Component variant evidence request failed: ${response.status}`);
    const manifest=await response.json();
    variantAssert(manifest.schema==='neobrutal-commerce/component-variant-evidence@1','unexpected component variant evidence schema');
    variantAssert(manifest.showcaseVersion==='1.1.0'&&manifest.commerceVersion==='1.0.0','component variant evidence versions drifted');
    variantAssert(manifest.role==='variant-evidence-only','component variant evidence must remain evidence only');
    variantAssert(manifest.batch?.id==='storefront-core'&&manifest.batch?.ordinal===1,'component variant evidence batch provenance drifted');
    variantAssert(sameVariantIds(manifest.batch.componentIds||[],VARIANT_BATCH_IDS),'component variant batch membership drifted');
    variantAssert(manifest.components?.length===5,'component variant evidence must cover exact five-component first batch');
    variantAssert(sameVariantIds(manifest.components.map(entry=>entry.id),VARIANT_BATCH_IDS),'component variant evidence ids drifted');
    const totalVariants=manifest.components.reduce((sum,entry)=>sum+(entry.variants?.length||0),0);
    variantAssert(totalVariants===13,'component variant evidence must expose exact 13 first-batch variants');
    await waitForVariantShowcase();
    const cards=[...document.querySelectorAll('[data-component-card]')];
    variantAssert(cards.length===47,'component variant evidence requires 47 rendered component cards');
    const evidenceById=new Map(manifest.components.map(entry=>[entry.id,entry]));
    for(const card of cards){
      const entry=evidenceById.get(card.dataset.componentId);
      card.dataset.demoVariantEvidence=String(Boolean(entry));
      card.querySelector('[data-component-variant-evidence]')?.remove();
      if(!entry)continue;
      variantAssert(Array.isArray(entry.variants)&&entry.variants.length>0,`component variant evidence missing variants: ${entry.id}`);
      variantAssert(new Set(entry.variants.map(variant=>variant.id)).size===entry.variants.length,`duplicate variant id: ${entry.id}`);
      const contract=card.querySelector('.cx-contract');
      variantAssert(contract,`component variant evidence missing contract panel: ${entry.id}`);
      contract.insertAdjacentHTML('beforeend',renderVariantEvidence(entry));
      bindVariantEvidence(card,entry);
    }
    document.documentElement.dataset.componentVariantReady='true';
    document.documentElement.dataset.componentVariantAudited=String(evidenceById.size);
    document.documentElement.dataset.componentVariantCount=String(totalVariants);
  }catch(error){
    document.documentElement.dataset.componentVariantReady='error';
    console.error(error);
  }
}

initComponentVariantEvidence();
