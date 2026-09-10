const PROMOTED_BLOCK_IDS=['trust-strip','testimonials','guarantee','product-detail','product-gallery','order-confirmation','subscription-management'];
const PROMOTION_GROUPS={
  'trust-band':['trust-strip','testimonials','guarantee'],
  'product-media':['product-detail','product-gallery'],
  'order-success':['order-confirmation'],
  'ownership-operations':['subscription-management']
};
const BLOCK_PREVIEWS={
  'trust-strip':`<div class="nbc-trust"><span class="nbc-trust-mark">✓</span><div><strong>12 months of updates</strong><p>Entitlement scope is explicit before purchase.</p></div></div>`,
  'testimonials':`<div class="nbc-review-grid"><article class="nbc-review"><blockquote>“The tactile grammar makes actions obvious without making the UI noisy.”</blockquote><footer><strong>Example customer</strong><span>Product team</span></footer></article></div>`,
  'guarantee':`<div class="nbc-trust"><span class="nbc-trust-mark">↺</span><div><strong>Fit guarantee</strong><p>Refund and support terms are policy data, never inferred by the component.</p></div></div>`,
  'product-detail':`<div class="cx-mini-stack"><span class="nbc-badge">Complete system</span><h2>NeoBrutal Soft.</h2><p>Refined Neo-Brutalism for SaaS, admin, developer and AI products.</p><ul class="nbc-feature-list"><li>Light + dark themes</li><li>Fluid clamp() foundation</li><li>Agent-readable contracts</li></ul></div>`,
  'product-gallery':`<div class="cx-mini-stack" data-promoted-gallery><div class="nbc-product-art"><strong data-block-gallery-current>SOFT. · 01</strong></div><div class="store-actions-row" role="group" aria-label="Product gallery previews"><button class="nbc-button nbc-tactile" type="button" data-block-gallery-index="01" aria-label="Show product preview 1" aria-pressed="true">01</button><button class="nbc-button nbc-tactile" type="button" data-block-gallery-index="02" aria-label="Show product preview 2" aria-pressed="false">02</button><button class="nbc-button nbc-tactile" type="button" data-block-gallery-index="03" aria-label="Show product preview 3" aria-pressed="false">03</button></div></div>`,
  'order-confirmation':`<div class="nbc-order-success"><p class="store-kicker">ORDER COMPLETE</p><h2>Thanks — your order is confirmed.</h2><span class="nbc-order-number">#NBC-1042</span></div>`,
  'subscription-management':`<article class="nbc-lifecycle" data-promoted-subscription data-subscription-state="active"><div class="nbc-lifecycle-head"><div><p class="store-kicker">Billing subscription</p><h3>$99 / year</h3></div><span class="nbc-lifecycle-badge" data-state="active" data-block-subscription-badge>ACTIVE</span></div><dl class="nbc-lifecycle-facts"><div><dt>Renews</dt><dd>08 Sep 2027</dd></div><div><dt>Current term</dt><dd>Already paid</dd></div></dl><p class="nbc-lifecycle-note" data-block-subscription-note aria-live="polite">Canceling schedules renewal to end after the paid term; it does not erase the current license.</p><div class="nbc-subscription-actions"><button class="nbc-button nbc-tactile" type="button" data-block-subscription-cancel>CANCEL FUTURE RENEWAL</button><button class="nbc-button nbc-button--primary nbc-tactile" type="button" data-block-subscription-resume hidden>RESUME RENEWAL</button></div></article>`
};
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function assert(condition,message){if(!condition)throw new Error(message)}
function sameIds(actual,expected){return JSON.stringify([...actual].sort())===JSON.stringify([...expected].sort())}
function renderPromotedBlock(block){
  const markup=BLOCK_PREVIEWS[block.id];
  assert(markup,`missing promoted Block preview: ${block.id}`);
  const search=[block.id,block.title,block.category,block.description,...block.components,block.promotedFrom].join(' ').toLowerCase();
  return `<article class="cx-block-card" data-block-card data-search="${escapeHtml(search)}"><div class="cx-block-copy"><p class="cx-kicker">${escapeHtml(block.category)} block</p><h3>${escapeHtml(block.title)}</h3><p>${escapeHtml(block.description)}</p><div class="cx-block-meta">${block.components.map(id=>`<span class="cx-chip">${escapeHtml(id)}</span>`).join('')}</div><a class="nbc-button nbc-tactile" href="${escapeHtml(block.route)}">OPEN LIVE ROUTE →</a></div><div class="cx-block-preview">${markup}</div></article>`;
}

function wirePromotedBlockInteractions(grid){
  grid.addEventListener('click',event=>{
    const galleryButton=event.target.closest('[data-block-gallery-index]');
    if(galleryButton){
      const gallery=galleryButton.closest('[data-promoted-gallery]');
      if(!gallery)return;
      gallery.querySelectorAll('[data-block-gallery-index]').forEach(item=>item.setAttribute('aria-pressed',String(item===galleryButton)));
      const current=gallery.querySelector('[data-block-gallery-current]');
      if(current)current.textContent=`SOFT. · ${galleryButton.dataset.blockGalleryIndex}`;
      return;
    }
    const subscriptionButton=event.target.closest('[data-block-subscription-cancel],[data-block-subscription-resume]');
    if(!subscriptionButton)return;
    const subscription=subscriptionButton.closest('[data-promoted-subscription]');
    if(!subscription)return;
    const cancel=subscription.querySelector('[data-block-subscription-cancel]');
    const resume=subscription.querySelector('[data-block-subscription-resume]');
    const badge=subscription.querySelector('[data-block-subscription-badge]');
    const note=subscription.querySelector('[data-block-subscription-note]');
    if(subscriptionButton.matches('[data-block-subscription-cancel]')){
      subscription.dataset.subscriptionState='cancel_at_period_end';
      if(badge){badge.dataset.state='cancel_at_period_end';badge.textContent='CANCEL AT PERIOD END'}
      if(cancel)cancel.hidden=true;
      if(resume)resume.hidden=false;
      if(note)note.textContent='Future renewal is cancelled. Access continues through 08 Sep 2027; the current license is not revoked.';
      return;
    }
    subscription.dataset.subscriptionState='active';
    if(badge){badge.dataset.state='active';badge.textContent='ACTIVE'}
    if(resume)resume.hidden=true;
    if(cancel)cancel.hidden=false;
    if(note)note.textContent='Renewal resumed. The next provider-authoritative billing date remains 08 Sep 2027.';
  });
}

async function initPromotedBlocks(){
  try{
    const response=await fetch('./storefront/blocks.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Blocks request failed: ${response.status}`);
    const manifest=await response.json();
    assert(manifest.schema==='neobrutal-commerce/blocks@1','unexpected Blocks schema');
    assert(manifest.commerceVersion==='1.0.0','promoted Blocks must target frozen Commerce 1.0.0');
    assert(manifest.showcaseVersion==='1.1.0','promoted Blocks must remain in Showcase v1.1');
    const promoted=manifest.blocks.filter(block=>block.promotedFrom!==undefined);
    assert(promoted.length===PROMOTED_BLOCK_IDS.length,'promoted Block count drifted');
    assert(sameIds(promoted.map(block=>block.id),PROMOTED_BLOCK_IDS),'promoted Block ids drifted');
    for(const [parentId,expectedIds] of Object.entries(PROMOTION_GROUPS)){
      const family=promoted.filter(block=>block.promotedFrom===parentId);
      assert(family.length===expectedIds.length,`${parentId} promoted Block count drifted`);
      assert(sameIds(family.map(block=>block.id),expectedIds),`${parentId} promoted Block ids drifted`);
    }
    for(const block of promoted){
      assert(PROMOTION_GROUPS[block.promotedFrom]?.includes(block.id),`promoted Block has unexpected compatibility parent: ${block.id}`);
      assert(block.components.length===1&&block.components[0]===block.id,`promoted Block must map directly to its frozen component: ${block.id}`);
    }
    const grid=document.querySelector('#blockGrid');
    assert(grid,'missing Block explorer grid');
    grid.insertAdjacentHTML('beforeend',promoted.map(renderPromotedBlock).join(''));
    wirePromotedBlockInteractions(grid);
    document.documentElement.dataset.promotedBlocksReady='true';
  }catch(error){
    document.documentElement.dataset.promotedBlocksReady='error';
    console.error(error);
  }
}

initPromotedBlocks();
