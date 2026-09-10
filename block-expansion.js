const PROMOTED_BLOCK_IDS=['trust-strip','testimonials','guarantee'];
const BLOCK_PREVIEWS={
  'trust-strip':`<div class="nbc-trust"><span class="nbc-trust-mark">✓</span><div><strong>12 months of updates</strong><p>Entitlement scope is explicit before purchase.</p></div></div>`,
  'testimonials':`<div class="nbc-review-grid"><article class="nbc-review"><blockquote>“The tactile grammar makes actions obvious without making the UI noisy.”</blockquote><footer><strong>Example customer</strong><span>Product team</span></footer></article></div>`,
  'guarantee':`<div class="nbc-trust"><span class="nbc-trust-mark">↺</span><div><strong>Fit guarantee</strong><p>Refund and support terms are policy data, never inferred by the component.</p></div></div>`
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

async function initPromotedBlocks(){
  try{
    const response=await fetch('./storefront/blocks.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Blocks request failed: ${response.status}`);
    const manifest=await response.json();
    assert(manifest.schema==='neobrutal-commerce/blocks@1','unexpected Blocks schema');
    assert(manifest.commerceVersion==='1.0.0','promoted Blocks must target frozen Commerce 1.0.0');
    assert(manifest.showcaseVersion==='1.1.0','promoted Blocks must remain in Showcase v1.1');
    const promoted=manifest.blocks.filter(block=>block.promotedFrom==='trust-band');
    assert(promoted.length===PROMOTED_BLOCK_IDS.length,'trust-band promoted Block count drifted');
    assert(sameIds(promoted.map(block=>block.id),PROMOTED_BLOCK_IDS),'trust-band promoted Block ids drifted');
    for(const block of promoted){
      assert(block.components.length===1&&block.components[0]===block.id,`promoted Block must map directly to its frozen component: ${block.id}`);
    }
    const grid=document.querySelector('#blockGrid');
    assert(grid,'missing Block explorer grid');
    grid.insertAdjacentHTML('beforeend',promoted.map(renderPromotedBlock).join(''));
    document.documentElement.dataset.promotedBlocksReady='true';
  }catch(error){
    document.documentElement.dataset.promotedBlocksReady='error';
    console.error(error);
  }
}

initPromotedBlocks();
