const INVOICE_VARIANT_FILE='./storefront/component-variant-evidence-invoice-details.json';
const INVOICE_IMPLEMENTATION_FILE='./storefront/component-demo-implementation-invoice-details.json';
const invoiceAssert=(condition,message)=>{if(!condition)throw new Error(message)};
const normalizeInvoiceVariant=value=>String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const escapeInvoice=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const sameInvoiceIds=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

function waitForInvoicePrerequisite(key){
  if(document.documentElement.dataset[key]==='true')return Promise.resolve();
  if(document.documentElement.dataset[key]==='error')return Promise.reject(new Error(`${key} failed before invoice-details evidence`));
  return new Promise((resolve,reject)=>{
    const observer=new MutationObserver(()=>{
      if(document.documentElement.dataset[key]==='true'){observer.disconnect();resolve()}
      if(document.documentElement.dataset[key]==='error'){observer.disconnect();reject(new Error(`${key} failed before invoice-details evidence`))}
    });
    observer.observe(document.documentElement,{attributes:true});
  });
}

function validateInvoiceVariantManifest(manifest,showcase){
  invoiceAssert(manifest.schema==='neobrutal-commerce/component-variant-evidence@4','unexpected invoice-details variant evidence schema');
  invoiceAssert(manifest.showcaseVersion==='1.1.0'&&manifest.commerceVersion==='1.0.0','invoice-details variant evidence version drifted');
  invoiceAssert(manifest.role==='variant-evidence-only','invoice-details variant evidence must remain evidence only');
  invoiceAssert(manifest.batches?.length===1,'invoice-details variant evidence requires one provenance batch');
  const batch=manifest.batches[0];
  invoiceAssert(batch.id==='invoice-details-residual'&&batch.ordinal===7&&batch.label==='Invoice details residual','invoice-details variant batch identity drifted');
  invoiceAssert(sameInvoiceIds(batch.componentIds||[],['invoice-details']),'invoice-details variant batch membership drifted');
  invoiceAssert(manifest.components?.length===1&&manifest.components[0].id==='invoice-details','invoice-details variant evidence must cover exactly one component');
  const entry=manifest.components[0];
  const authority=(showcase.components||[]).find(component=>component.id==='invoice-details');
  invoiceAssert(authority,'invoice-details showcase authority missing');
  const expected=(authority.variants||[]).map(normalizeInvoiceVariant);
  const actual=entry.variants.map(variant=>variant.id);
  invoiceAssert(expected.length===3&&sameInvoiceIds(expected,actual),'invoice-details evidence must exactly match the three documented variants');
  for(const variant of entry.variants){
    invoiceAssert(variant.id===normalizeInvoiceVariant(variant.label),`invoice-details variant id/label normalization drifted: ${variant.id}`);
    invoiceAssert(variant.proofKind==='rendered',`invoice-details residual accepts rendered proof only: ${variant.id}`);
    invoiceAssert(typeof variant.markup==='string'&&variant.markup.includes(`data-variant-sample="invoice-details:${variant.id}"`),`invoice-details rendered proof lacks sample identity: ${variant.id}`);
    invoiceAssert(!/<script\b|\son[a-z]+\s*=/i.test(variant.markup),`invoice-details rendered proof must remain declarative: ${variant.id}`);
    invoiceAssert(!/tax rate|jurisdiction|vat rate|sales tax rate|invoice status|paid invoice|open invoice/i.test(variant.markup),`invoice-details rendered proof invents provider-authoritative tax or invoice outcome: ${variant.id}`);
  }
  return entry;
}

function validateInvoiceImplementation(manifest,registry){
  invoiceAssert(manifest.schema==='neobrutal-commerce/component-demo-implementation@1','unexpected invoice-details implementation evidence schema');
  invoiceAssert(manifest.showcaseVersion==='1.1.0'&&manifest.commerceVersion==='1.0.0','invoice-details implementation evidence version drifted');
  invoiceAssert(manifest.role==='implementation-evidence-only'&&manifest.batchId==='invoice-details-residual','invoice-details implementation evidence identity drifted');
  invoiceAssert(manifest.styleImport==='@neobrutal/commerce/styles.css','invoice-details implementation evidence must use public style export');
  invoiceAssert(manifest.components?.length===1&&manifest.components[0].id==='invoice-details','invoice-details implementation evidence must cover exactly one component');
  const contract=(registry.components||[]).find(component=>component.id==='invoice-details');
  invoiceAssert(contract&&contract.actions?.length===0,'invoice-details must remain actionless in frozen component authority');
  invoiceAssert(sameInvoiceIds(contract.models||[],['CheckoutQuoteView','InvoiceView']),'invoice-details normalized model authority drifted');
  const evidence=manifest.components[0];
  invoiceAssert(evidence.copyReady?.html?.includes('data-commerce-component="invoice-details"'),'invoice-details copy-ready HTML missing stable anatomy');
  invoiceAssert(evidence.copyReady?.css?.trim()==="@import '@neobrutal/commerce/styles.css';",'invoice-details copy-ready CSS must use frozen public style export');
  invoiceAssert(!/createCommerceAction\s*\(/.test(evidence.copyReady?.js||''),'invoice-details copy-ready JS must not invent a Commerce action');
  invoiceAssert((evidence.copyReady?.js||'').includes('data-invoice-requested'),'invoice-details copy-ready JS must expose requested/not-requested input state');
  invoiceAssert(!(evidence.copyReady?.js||'').match(/tax\s*=|rate\s*=|jurisdiction|invoice\.status/i),'invoice-details copy-ready JS must not calculate or infer provider-authoritative outcomes');
  return evidence;
}

function renderInvoiceVariantEvidence(entry){
  const choices=entry.variants.map((variant,index)=>`<button class="cx-variant-choice nbc-tactile" type="button" data-variant-choice="${escapeInvoice(variant.id)}" aria-pressed="${index===0?'true':'false'}">${escapeInvoice(variant.label)}</button>`).join('');
  return `<details class="cx-variant-evidence" data-component-variant-evidence data-variant-batch="invoice-details-residual"><summary><span>Variant proof</span><span>3/3</span></summary><div class="cx-variant-body"><div class="cx-variant-rendered-proof" data-variant-rendered-proof><div class="cx-variant-choices" role="group" aria-label="invoice-details rendered variants">${choices}</div><div class="cx-variant-panel" data-variant-panel data-variant-current="${escapeInvoice(entry.variants[0].id)}">${entry.variants[0].markup}</div></div></div></details>`;
}

function renderInvoiceImplementationEvidence(evidence){
  const sources=evidence.sourceFiles.map(file=>`<code>${escapeInvoice(file)}</code>`).join(' · ');
  const tokens=evidence.tokens.map(token=>`<code class="cx-depth-token">${escapeInvoice(token)}</code>`).join('');
  const code=['html','css','js'].map(kind=>`<section class="cx-depth-code" data-invoice-copy-ready-kind="${kind}"><strong>${kind.toUpperCase()}</strong><pre tabindex="0"><code>${escapeInvoice(evidence.copyReady[kind])}</code></pre></section>`).join('');
  return `<div class="cx-depth-evidence" data-invoice-implementation-evidence><div class="cx-depth-evidence-head"><div><strong>Residual implementation evidence</strong><p>Reusable invoice-request anatomy and local validation only. Tax, totals, jurisdiction, and invoice outcomes remain provider-authoritative.</p></div><span>BATCH 6 · INVOICE DETAILS RESIDUAL</span></div><div class="cx-depth-source"><strong>Sources</strong><p>${sources}</p></div><div class="cx-depth-token-list" data-invoice-token-list>${tokens}</div><div class="cx-depth-code-grid">${code}</div></div>`;
}

function bindInvoiceVariants(card,entry){
  const details=card.querySelector('[data-component-variant-evidence]');
  const panel=details?.querySelector('[data-variant-panel]');
  const choices=[...(details?.querySelectorAll('[data-variant-choice]')||[])];
  invoiceAssert(details&&panel&&choices.length===3,'invoice-details rendered variant controls are incomplete');
  const variants=new Map(entry.variants.map(variant=>[variant.id,variant]));
  for(const choice of choices)choice.addEventListener('click',()=>{
    const variant=variants.get(choice.dataset.variantChoice);
    invoiceAssert(variant,`unknown invoice-details variant choice: ${choice.dataset.variantChoice}`);
    for(const peer of choices)peer.setAttribute('aria-pressed',String(peer===choice));
    panel.dataset.variantCurrent=variant.id;
    panel.innerHTML=variant.markup;
  });
}

function invoiceDepthChip(card,label){
  return [...card.querySelectorAll('[data-component-depth-audit] .cx-depth-chip')].find(chip=>chip.textContent.trim()===label);
}

function promoteInvoiceVariantDepth(card){
  const chip=invoiceDepthChip(card,'All variants');
  invoiceAssert(chip?.dataset.depthStatus==='partial','invoice-details All variants audit must be partial before residual promotion');
  const completeGroup=card.querySelector('[data-component-depth-audit] [data-depth-group="complete"] .cx-depth-chips');
  invoiceAssert(completeGroup,'invoice-details complete audit group missing');
  chip.dataset.depthStatus='complete';
  completeGroup.append(chip);
  const audit=card.querySelector('[data-component-depth-audit]');
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
  invoiceAssert(summary,'invoice-details audit summary missing');
  summary.textContent=`${complete} complete · ${partial} partial · ${missing} missing`;
  card.dataset.demoDepthPartial=String(partial);
}

async function initInvoiceDetailsEvidence(){
  try{
    const [variantResponse,implementationResponse,showcaseResponse,registryResponse]=await Promise.all([
      fetch(INVOICE_VARIANT_FILE,{cache:'no-store'}),
      fetch(INVOICE_IMPLEMENTATION_FILE,{cache:'no-store'}),
      fetch('./storefront/component-showcase.json',{cache:'no-store'}),
      fetch('./storefront/components.json',{cache:'no-store'})
    ]);
    for(const [label,response] of [['variant',variantResponse],['implementation',implementationResponse],['showcase',showcaseResponse],['registry',registryResponse]])if(!response.ok)throw new Error(`invoice-details ${label} evidence request failed: ${response.status}`);
    const [variantManifest,implementationManifest,showcase,registry]=await Promise.all([variantResponse.json(),implementationResponse.json(),showcaseResponse.json(),registryResponse.json()]);
    const variantEntry=validateInvoiceVariantManifest(variantManifest,showcase);
    const implementationEvidence=validateInvoiceImplementation(implementationManifest,registry);
    await Promise.all([
      waitForInvoicePrerequisite('componentVariantSystemReady'),
      waitForInvoicePrerequisite('componentDepthSystemReady'),
      waitForInvoicePrerequisite('componentImplementationReady')
    ]);

    const root=document.documentElement;
    invoiceAssert(root.dataset.componentVariantAudited==='42'&&root.dataset.componentVariantCount==='117'&&root.dataset.componentVariantBatches==='6','invoice-details residual requires certified System variant stage 42/117 across six batches');
    invoiceAssert(root.dataset.componentDepthVariantComplete==='42'&&root.dataset.componentDepthVariantPartial==='5','invoice-details residual requires certified System depth stage 42 complete / 5 partial');
    invoiceAssert(root.dataset.componentImplementationAudited==='43'&&root.dataset.componentImplementationBatches==='5','invoice-details residual requires certified 43-component implementation checkpoint');

    const card=document.querySelector('[data-component-card][data-component-id="invoice-details"]');
    invoiceAssert(card,'invoice-details component card missing');
    invoiceAssert(card.dataset.demoVariantEvidence==='false','invoice-details variant evidence was already promoted');
    invoiceAssert(!card.querySelector('[data-component-variant-evidence]'),'invoice-details already contains variant proof');
    const depthAudit=card.querySelector('[data-component-depth-audit]');
    invoiceAssert(depthAudit,'invoice-details depth audit missing');
    depthAudit.insertAdjacentHTML('beforebegin',renderInvoiceVariantEvidence(variantEntry));
    depthAudit.insertAdjacentHTML('beforeend',renderInvoiceImplementationEvidence(implementationEvidence));
    bindInvoiceVariants(card,variantEntry);
    card.dataset.demoVariantEvidence='true';
    card.dataset.invoiceImplementationEvidence='true';
    promoteInvoiceVariantDepth(card);

    root.dataset.componentVariantInvoiceReady='true';
    root.dataset.componentVariantInvoiceAudited='43';
    root.dataset.componentVariantInvoiceCount='120';
    root.dataset.componentVariantInvoiceRenderedCount='70';
    root.dataset.componentVariantInvoiceStateBackedCount='42';
    root.dataset.componentVariantInvoiceResponsiveBackedCount='4';
    root.dataset.componentVariantInvoiceInteractionBackedCount='2';
    root.dataset.componentVariantInvoiceActionBackedCount='2';
    root.dataset.componentVariantInvoiceBatches='7';
    root.dataset.componentDepthInvoiceReady='true';
    root.dataset.componentDepthInvoiceVariantComplete='43';
    root.dataset.componentDepthInvoiceVariantPartial='4';
    root.dataset.componentImplementationInvoiceReady='true';
    root.dataset.componentImplementationInvoiceEvidence='1';
    root.dataset.componentImplementationCombined='44';
    document.dispatchEvent(new CustomEvent('nbc:invoice-details-evidence-ready'));
  }catch(error){
    document.documentElement.dataset.componentVariantInvoiceReady='error';
    document.documentElement.dataset.componentDepthInvoiceReady='error';
    document.documentElement.dataset.componentImplementationInvoiceReady='error';
    console.error(error);
  }
}

initInvoiceDetailsEvidence();
