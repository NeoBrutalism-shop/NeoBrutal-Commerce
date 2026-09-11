const ACCOUNT_DEPTH_EXTENSION_FILE='./storefront/component-demo-depth-account.json';
const depthExtensionAssert=(condition,message)=>{if(!condition)throw new Error(message)};

function waitForRootDataset(key){
  if(document.documentElement.dataset[key]==='true')return Promise.resolve();
  if(document.documentElement.dataset[key]==='error')return Promise.reject(new Error(`${key} failed before Account depth extension`));
  return new Promise((resolve,reject)=>{
    const observer=new MutationObserver(()=>{
      if(document.documentElement.dataset[key]==='true'){observer.disconnect();resolve()}
      if(document.documentElement.dataset[key]==='error'){observer.disconnect();reject(new Error(`${key} failed before Account depth extension`))}
    });
    observer.observe(document.documentElement,{attributes:true});
  });
}

function depthCriterionChip(card,label){
  return [...card.querySelectorAll('[data-component-depth-audit] .cx-depth-chip')].find(chip=>chip.textContent.trim()===label);
}

function recountDepthAudit(card){
  const audit=card.querySelector('[data-component-depth-audit]');
  depthExtensionAssert(audit,`Account depth extension missing audit: ${card.dataset.componentId}`);
  for(const group of audit.querySelectorAll('[data-depth-group]')){
    const status=group.dataset.depthGroup;
    const count=group.querySelectorAll('.cx-depth-chip').length;
    const heading=group.querySelector(':scope > strong');
    if(heading)heading.textContent=`${status.replace('-', ' ')} · ${count}`;
  }
  const complete=audit.querySelectorAll('.cx-depth-chip[data-depth-status="complete"]').length;
  const partial=audit.querySelectorAll('.cx-depth-chip[data-depth-status="partial"]').length;
  const missing=audit.querySelectorAll('.cx-depth-chip[data-depth-status="missing"]').length;
  const summary=audit.querySelector('.cx-depth-summary');
  depthExtensionAssert(summary,`Account depth extension missing summary: ${card.dataset.componentId}`);
  summary.textContent=`${complete} complete · ${partial} partial · ${missing} missing`;
  card.dataset.demoDepthPartial=String(partial);
  card.dataset.demoDepthMissing=String(missing);
}

function promoteVariantDepth(card){
  const chip=depthCriterionChip(card,'All variants');
  depthExtensionAssert(chip,`Account depth extension missing All variants chip: ${card.dataset.componentId}`);
  depthExtensionAssert(chip.dataset.depthStatus==='partial',`Account depth extension expected partial variant status before promotion: ${card.dataset.componentId}`);
  const completeGroup=card.querySelector('[data-component-depth-audit] [data-depth-group="complete"] .cx-depth-chips');
  depthExtensionAssert(completeGroup,`Account depth extension missing complete group: ${card.dataset.componentId}`);
  chip.dataset.depthStatus='complete';
  completeGroup.append(chip);
  recountDepthAudit(card);
}

async function initAccountDepthExtension(){
  try{
    const response=await fetch(ACCOUNT_DEPTH_EXTENSION_FILE,{cache:'no-store'});
    if(!response.ok)throw new Error(`Account depth extension request failed: ${response.status}`);
    const extension=await response.json();
    depthExtensionAssert(extension.schema==='neobrutal-commerce/component-demo-depth-extension@1','unexpected Account depth extension schema');
    depthExtensionAssert(extension.showcaseVersion==='1.1.0'&&extension.commerceVersion==='1.0.0','Account depth extension version drifted');
    depthExtensionAssert(extension.role==='audit-evidence-extension'&&extension.criterion==='variants'&&extension.status==='complete','Account depth extension authority drifted');
    depthExtensionAssert(extension.baseComplete===28&&extension.extensionComplete===10&&extension.combinedComplete===38&&extension.combinedPartial===9,'Account depth extension counts drifted');
    depthExtensionAssert(Array.isArray(extension.components)&&extension.components.length===10&&new Set(extension.components).size===10,'Account depth extension must promote exact ten unique components');
    depthExtensionAssert(Array.isArray(extension.excluded)&&extension.excluded.length===4&&new Set(extension.excluded.map(item=>item.id)).size===4,'Account depth extension must preserve four explicit exclusions');

    await Promise.all([waitForRootDataset('componentDepthReady'),waitForRootDataset('componentVariantReady')]);
    depthExtensionAssert(document.documentElement.dataset.componentVariantAudited==='38','Account depth promotion requires combined 38-component variant evidence');
    depthExtensionAssert(document.documentElement.dataset.componentVariantCount==='100','Account depth promotion requires combined 100-variant evidence');

    for(const id of extension.components){
      const card=document.querySelector(`[data-component-card][data-component-id="${CSS.escape(id)}"]`);
      depthExtensionAssert(card,`Account depth extension missing component card: ${id}`);
      depthExtensionAssert(card.dataset.demoVariantEvidence==='true',`Account depth extension cannot promote unproven variants: ${id}`);
      promoteVariantDepth(card);
    }
    for(const {id} of extension.excluded){
      const card=document.querySelector(`[data-component-card][data-component-id="${CSS.escape(id)}"]`);
      depthExtensionAssert(card,`Account depth extension missing excluded component card: ${id}`);
      depthExtensionAssert(card.dataset.demoVariantEvidence==='false',`Account depth exclusion unexpectedly gained variant evidence: ${id}`);
      const chip=depthCriterionChip(card,'All variants');
      depthExtensionAssert(chip?.dataset.depthStatus==='partial',`Account depth exclusion must remain partial: ${id}`);
    }

    const cards=[...document.querySelectorAll('[data-component-card]')];
    const variantChips=cards.map(card=>depthCriterionChip(card,'All variants'));
    depthExtensionAssert(variantChips.every(Boolean),'Account depth extension requires an All variants chip on all 47 cards');
    const complete=variantChips.filter(chip=>chip.dataset.depthStatus==='complete').length;
    const partial=variantChips.filter(chip=>chip.dataset.depthStatus==='partial').length;
    depthExtensionAssert(complete===extension.combinedComplete&&partial===extension.combinedPartial,`Account depth combined status drifted: ${complete} complete / ${partial} partial`);
    document.documentElement.dataset.componentDepthPartial=String(cards.reduce((sum,card)=>sum+Number(card.dataset.demoDepthPartial||0),0));
    document.documentElement.dataset.componentDepthVariantComplete=String(complete);
    document.documentElement.dataset.componentDepthVariantPartial=String(partial);
    document.documentElement.dataset.componentDepthAccountReady='true';
  }catch(error){
    document.documentElement.dataset.componentDepthAccountReady='error';
    console.error(error);
  }
}

initAccountDepthExtension();
