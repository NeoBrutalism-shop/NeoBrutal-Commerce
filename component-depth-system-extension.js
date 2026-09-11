const SYSTEM_DEPTH_EXTENSION_FILE='./storefront/component-demo-depth-system.json';
const systemDepthAssert=(condition,message)=>{if(!condition)throw new Error(message)};

function waitForSystemPrerequisite(key){
  if(document.documentElement.dataset[key]==='true')return Promise.resolve();
  if(document.documentElement.dataset[key]==='error')return Promise.reject(new Error(`${key} failed before System depth extension`));
  return new Promise((resolve,reject)=>{
    const observer=new MutationObserver(()=>{
      if(document.documentElement.dataset[key]==='true'){observer.disconnect();resolve()}
      if(document.documentElement.dataset[key]==='error'){observer.disconnect();reject(new Error(`${key} failed before System depth extension`))}
    });
    observer.observe(document.documentElement,{attributes:true});
  });
}

function systemDepthChip(card,label){
  return [...card.querySelectorAll('[data-component-depth-audit] .cx-depth-chip')].find(chip=>chip.textContent.trim()===label);
}

function recountSystemDepth(card){
  const audit=card.querySelector('[data-component-depth-audit]');
  systemDepthAssert(audit,`System depth extension missing audit: ${card.dataset.componentId}`);
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
  systemDepthAssert(summary,`System depth extension missing summary: ${card.dataset.componentId}`);
  summary.textContent=`${complete} complete · ${partial} partial · ${missing} missing`;
  card.dataset.demoDepthPartial=String(partial);
  card.dataset.demoDepthMissing=String(missing);
}

function promoteSystemVariantDepth(card){
  const chip=systemDepthChip(card,'All variants');
  systemDepthAssert(chip,`System depth extension missing All variants chip: ${card.dataset.componentId}`);
  systemDepthAssert(chip.dataset.depthStatus==='partial',`System depth extension expected partial variant status before promotion: ${card.dataset.componentId}`);
  const completeGroup=card.querySelector('[data-component-depth-audit] [data-depth-group="complete"] .cx-depth-chips');
  systemDepthAssert(completeGroup,`System depth extension missing complete group: ${card.dataset.componentId}`);
  chip.dataset.depthStatus='complete';
  completeGroup.append(chip);
  recountSystemDepth(card);
}

async function initSystemDepthExtension(){
  try{
    const response=await fetch(SYSTEM_DEPTH_EXTENSION_FILE,{cache:'no-store'});
    if(!response.ok)throw new Error(`System depth extension request failed: ${response.status}`);
    const extension=await response.json();
    systemDepthAssert(extension.schema==='neobrutal-commerce/component-demo-depth-extension@1','unexpected System depth extension schema');
    systemDepthAssert(extension.showcaseVersion==='1.1.0'&&extension.commerceVersion==='1.0.0','System depth extension version drifted');
    systemDepthAssert(extension.role==='audit-evidence-extension'&&extension.criterion==='variants'&&extension.status==='complete','System depth extension authority drifted');
    systemDepthAssert(extension.baseComplete===38&&extension.extensionComplete===4&&extension.combinedComplete===42&&extension.combinedPartial===5,'System depth extension counts drifted');
    systemDepthAssert(Array.isArray(extension.components)&&extension.components.length===4&&new Set(extension.components).size===4,'System depth extension must promote exact four unique components');
    systemDepthAssert(Array.isArray(extension.remainingPartial)&&extension.remainingPartial.length===5&&new Set(extension.remainingPartial.map(item=>item.id)).size===5,'System depth extension must preserve exact five remaining partial components');

    await Promise.all([waitForSystemPrerequisite('componentDepthAccountReady'),waitForSystemPrerequisite('componentVariantReady')]);
    systemDepthAssert(document.documentElement.dataset.componentVariantAudited==='42','System depth promotion requires combined 42-component variant evidence');
    systemDepthAssert(document.documentElement.dataset.componentVariantCount==='117','System depth promotion requires combined 117-variant evidence');
    systemDepthAssert(document.documentElement.dataset.componentDepthVariantComplete==='38'&&document.documentElement.dataset.componentDepthVariantPartial==='9','System depth promotion requires certified Account depth stage 38 complete / 9 partial');

    for(const id of extension.components){
      const card=document.querySelector(`[data-component-card][data-component-id="${CSS.escape(id)}"]`);
      systemDepthAssert(card,`System depth extension missing component card: ${id}`);
      systemDepthAssert(card.dataset.demoVariantEvidence==='true',`System depth extension cannot promote unproven variants: ${id}`);
      promoteSystemVariantDepth(card);
    }
    for(const {id} of extension.remainingPartial){
      const card=document.querySelector(`[data-component-card][data-component-id="${CSS.escape(id)}"]`);
      systemDepthAssert(card,`System depth extension missing remaining partial card: ${id}`);
      systemDepthAssert(card.dataset.demoVariantEvidence==='false',`System depth remaining partial unexpectedly gained variant evidence: ${id}`);
      const chip=systemDepthChip(card,'All variants');
      systemDepthAssert(chip?.dataset.depthStatus==='partial',`System depth remaining component must stay partial: ${id}`);
    }

    const cards=[...document.querySelectorAll('[data-component-card]')];
    const variantChips=cards.map(card=>systemDepthChip(card,'All variants'));
    systemDepthAssert(variantChips.every(Boolean),'System depth extension requires an All variants chip on all 47 cards');
    const complete=variantChips.filter(chip=>chip.dataset.depthStatus==='complete').length;
    const partial=variantChips.filter(chip=>chip.dataset.depthStatus==='partial').length;
    systemDepthAssert(complete===extension.combinedComplete&&partial===extension.combinedPartial,`System depth combined status drifted: ${complete} complete / ${partial} partial`);
    document.documentElement.dataset.componentDepthPartial=String(cards.reduce((sum,card)=>sum+Number(card.dataset.demoDepthPartial||0),0));
    document.documentElement.dataset.componentDepthVariantComplete=String(complete);
    document.documentElement.dataset.componentDepthVariantPartial=String(partial);
    document.documentElement.dataset.componentDepthSystemReady='true';
  }catch(error){
    document.documentElement.dataset.componentDepthSystemReady='error';
    console.error(error);
  }
}

initSystemDepthExtension();
