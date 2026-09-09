const COMPONENT_CATEGORIES={
  storefront:['product-card','trust-strip','promo-band','badge','price-block'],
  product:['product-detail','product-gallery','product-media','review-summary','testimonials','guarantee','license-selector','renewal-note'],
  pricing:['pricing-tier','plan-comparison','bundle-builder'],
  checkout:['cart-item','order-summary','coupon','checkout-field','invoice-details','checkout-steps','payment-method','payment-failure','payment-recovery','processing-state','order-confirmation','receipt','download-entitlement'],
  account:['account-nav','download-row','purchase-history-row','license-card','invoice-history','license-status','activation-row','update-eligibility','seat-assignment','renewal-state','plan-change','ownership-transfer','subscription-management','ownership-timeline'],
  system:['component-contract','tokens','system-states','ownership-lifecycle']
};
const CATEGORY_BY_ID=Object.fromEntries(Object.entries(COMPONENT_CATEGORIES).flatMap(([category,ids])=>ids.map(id=>[id,category])));
const CATEGORY_LABELS={storefront:'Storefront',product:'Product + trust',pricing:'Pricing',checkout:'Cart + checkout',account:'Account + ownership',system:'System + foundation'};
const ROUTES={
  'product-card':'./products/','trust-strip':'./product/soft/','promo-band':'./','badge':'./products/','price-block':'./product/soft/',
  'product-detail':'./product/soft/','product-gallery':'./product/soft/','product-media':'./product/soft/','review-summary':'./product/soft/','testimonials':'./product/soft/','guarantee':'./product/soft/','license-selector':'./product/soft/','renewal-note':'./product/soft/',
  'pricing-tier':'./pricing/','plan-comparison':'./pricing/','bundle-builder':'./pricing/',
  'cart-item':'./cart/','order-summary':'./checkout/','coupon':'./cart/','checkout-field':'./checkout/','invoice-details':'./checkout/','checkout-steps':'./checkout/','payment-method':'./checkout/','payment-failure':'./checkout/','payment-recovery':'./checkout/','processing-state':'./checkout/','order-confirmation':'./order/success/','receipt':'./order/success/','download-entitlement':'./account/',
  'account-nav':'./account/','download-row':'./account/','purchase-history-row':'./account/','license-card':'./account/','invoice-history':'./account/','license-status':'./account/license/demo-soft-team/','activation-row':'./account/license/demo-soft-team/','update-eligibility':'./account/license/demo-soft-team/','seat-assignment':'./account/license/demo-soft-team/','renewal-state':'./account/license/demo-soft-team/','plan-change':'./account/license/demo-soft-team/','ownership-transfer':'./account/license/demo-soft-team/','subscription-management':'./account/license/demo-soft-team/','ownership-timeline':'./account/license/demo-soft-team/',
  'component-contract':'./components/','tokens':'./components/','system-states':'./components/','ownership-lifecycle':'./components/'
};
const BLOCKS=[
  {id:'storefront-hero',title:'Storefront hero',category:'storefront',description:'Primary value proposition, product proof, and two-action conversion path.',components:['promo-band','badge','price-block'],route:'./',markup:`<div class="store-card" data-tone="yellow"><p class="store-kicker">DESIGN SYSTEM · DIGITAL PRODUCT</p><h2>Commerce that feels physical.</h2><p>Bold hierarchy, honest pricing, tactile actions.</p><p class="store-price">$49 <small>/ individual</small></p><div class="store-actions-row"><button class="nbc-button nbc-button--dark nbc-tactile">SHOP NOW →</button><button class="nbc-button nbc-tactile">SEE DETAILS</button></div></div>`},
  {id:'product-grid',title:'Product grid',category:'storefront',description:'Discoverable catalog cards with price, category, and direct product action.',components:['product-card','badge','price-block'],route:'./products/',markup:`<div class="store-grid"><article class="nbc-product-card"><span class="nbc-badge">Design system</span><div class="nbc-product-art"><strong>SOFT.</strong></div><h3>NeoBrutal Soft</h3><div class="nbc-price"><strong>$49</strong><span>Individual</span></div></article><article class="nbc-product-card"><span class="nbc-badge nbc-badge--coral">Bundle</span><div class="nbc-product-art" style="background:var(--nbc-coral)"><strong>TEAM.</strong></div><h3>Team license</h3><div class="nbc-price"><strong>$149</strong><span>5 sites</span></div></article></div>`},
  {id:'trust-band',title:'Trust + guarantee band',category:'product',description:'Evidence-led trust without fake urgency or fabricated security claims.',components:['trust-strip','review-summary','guarantee'],route:'./product/soft/',markup:`<div class="cx-mini-stack"><div class="nbc-rating"><div class="nbc-stars" aria-label="4.9 out of 5"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div><strong>4.9 / 5</strong></div><div class="nbc-trust"><span class="nbc-trust-mark">✓</span><div><strong>Fit guarantee</strong><p>Policy-backed refund language stays explicit.</p></div></div></div>`},
  {id:'product-media',title:'Product media deck',category:'product',description:'Preview, code, and files as explicit media states.',components:['product-gallery','product-media'],route:'./product/soft/',markup:`<div class="cx-mini-stack"><div class="nbc-product-art"><strong>SOFT.</strong></div><div class="store-actions-row"><button class="nbc-button nbc-tactile">PREVIEW</button><button class="nbc-button nbc-tactile">CODE</button><button class="nbc-button nbc-tactile">FILES</button></div></div>`},
  {id:'license-purchase',title:'License purchase panel',category:'product',description:'Capacity and renewal scope remain beside the price before commitment.',components:['license-selector','price-block','renewal-note'],route:'./product/soft/',markup:`<div class="nbc-license-selector"><label class="nbc-license-option"><input type="radio" name="block-license" checked><span><strong>Individual</strong><small>1 production site</small></span><span class="price">$49</span></label><label class="nbc-license-option"><input type="radio" name="block-license"><span><strong>Team</strong><small>5 production sites</small></span><span class="price">$149</span></label><p class="store-kicker">12 months of updates included</p></div>`},
  {id:'pricing-trio',title:'Pricing trio',category:'pricing',description:'Three license capacities with consequence visible before purchase.',components:['pricing-tier','price-block'],route:'./pricing/',markup:`<div class="nbc-plan-grid"><article class="nbc-plan-card"><h3>Individual</h3><div class="nbc-price"><strong>$49</strong></div><button class="nbc-button nbc-tactile">CHOOSE</button></article><article class="nbc-plan-card" data-featured="true"><span class="nbc-plan-ribbon">POPULAR</span><h3>Team</h3><div class="nbc-price"><strong>$149</strong></div><button class="nbc-button nbc-button--dark nbc-tactile">CHOOSE</button></article><article class="nbc-plan-card"><h3>Agency</h3><div class="nbc-price"><strong>$299</strong></div><button class="nbc-button nbc-tactile">CHOOSE</button></article></div>`},
  {id:'plan-comparison',title:'Plan comparison',category:'pricing',description:'Responsive tabular comparison that keeps license scope inspectable.',components:['plan-comparison'],route:'./pricing/',markup:`<div class="nbc-compare-wrap" tabindex="0"><table class="nbc-compare"><thead><tr><th>Capacity</th><th>Individual</th><th>Team</th><th>Agency</th></tr></thead><tbody><tr><th>Production sites</th><td>1</td><td>5</td><td>25</td></tr><tr><th>Updates</th><td class="nbc-yes">✓</td><td class="nbc-yes">✓</td><td class="nbc-yes">✓</td></tr></tbody></table></div>`},
  {id:'bundle-builder',title:'Bundle builder',category:'pricing',description:'Optional extras begin unselected and totals remain visible.',components:['bundle-builder'],route:'./pricing/',markup:`<div class="nbc-bundle"><label class="nbc-bundle-option"><input type="checkbox"><span><strong>Figma source</strong><small>Add editable source files</small></span><strong>+$20</strong></label><label class="nbc-bundle-option"><input type="checkbox"><span><strong>Team onboarding</strong><small>Implementation session</small></span><strong>+$50</strong></label><div class="nbc-bundle-total"><span>Total</span><strong>$49</strong></div></div>`},
  {id:'cart-summary',title:'Cart + order summary',category:'checkout',description:'Line context and authoritative totals stay visible together.',components:['cart-item','coupon','order-summary'],route:'./cart/',markup:`<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>NeoBrutal Soft</strong><small class="store-kicker">Team license</small></span><strong>$149</strong></div><div class="nbc-coupon"><input value="WELCOME10" aria-label="Coupon"><button class="nbc-button nbc-tactile">APPLY</button></div><div class="store-summary"><div class="store-summary-row"><span>Subtotal</span><strong>$149</strong></div><div class="store-summary-row" data-total><span>Total</span><strong>$149</strong></div></div></div>`},
  {id:'checkout-shell',title:'Checkout split',category:'checkout',description:'Contact/payment workflow paired with persistent order context.',components:['checkout-field','checkout-steps','payment-method','order-summary'],route:'./checkout/',markup:`<div class="nbc-checkout-shell"><div class="nbc-checkout-card"><div class="nbc-checkout-steps"><div class="nbc-checkout-step" aria-current="step">1 <strong>Contact</strong></div><div class="nbc-checkout-step">2 <strong>Payment</strong></div><div class="nbc-checkout-step">3 <strong>Done</strong></div></div><div class="cx-mini-field"><label>Email</label><input value="you@example.com"></div><label class="nbc-payment-method"><input type="radio" checked><strong>Card</strong></label></div><aside class="nbc-checkout-card"><strong>Order summary</strong><div class="store-summary-row"><span>Total</span><strong>$149</strong></div><button class="nbc-button nbc-button--primary nbc-tactile">PAY $149 →</button></aside></div>`},
  {id:'payment-recovery',title:'Payment recovery',category:'checkout',description:'Failure preserves checkout context and exposes a safe retry path.',components:['payment-failure','payment-recovery','processing-state'],route:'./checkout/',markup:`<div class="cx-mini-stack"><div class="nbc-state" data-state="error"><strong>Payment was not completed.</strong><span>Your cart and invoice details are still here.</span><div class="nbc-state-actions"><button class="nbc-button nbc-button--primary nbc-tactile">RETRY PAYMENT</button><button class="nbc-button nbc-tactile">CHANGE METHOD</button></div></div></div>`},
  {id:'order-success',title:'Order success + receipt',category:'checkout',description:'Transaction confirmation stays distinct from entitlement and billing records.',components:['order-confirmation','receipt','download-entitlement'],route:'./order/success/',markup:`<div class="nbc-order-success"><p class="store-kicker">ORDER COMPLETE</p><h2>Your license is ready.</h2><span class="nbc-order-number">#NBC-1042</span><div class="nbc-receipt-grid"><div><span>Paid</span><strong>$149</strong></div><div><span>Plan</span><strong>Team</strong></div><div><span>Updates</span><strong>12 months</strong></div></div></div>`},
  {id:'account-dashboard',title:'Account dashboard',category:'account',description:'Downloads, purchases, licenses, and invoices under one stable navigation model.',components:['account-nav','download-row','purchase-history-row','invoice-history'],route:'./account/',markup:`<div class="nbc-account"><nav class="nbc-account-nav"><button class="nbc-account-tab" aria-selected="true">Downloads</button><button class="nbc-account-tab" aria-selected="false">Purchases</button><button class="nbc-account-tab" aria-selected="false">Licenses</button></nav><div class="nbc-account-panel"><div class="nbc-download-row"><div class="nbc-download-meta"><strong>NeoBrutal Soft</strong><small>Eligible through Sep 2027</small></div><span class="nbc-download-version">v1.0</span><button class="nbc-button nbc-tactile">DOWNLOAD</button></div></div></div>`},
  {id:'license-dashboard',title:'License dashboard',category:'account',description:'Scope, entitlement, activations, and update eligibility without conflating billing.',components:['license-card','license-status','activation-row','update-eligibility'],route:'./account/license/demo-soft-team/',markup:`<article class="nbc-license-card"><div class="nbc-license-head"><div><p class="store-kicker">TEAM LICENSE</p><h3>NeoBrutal Soft</h3></div><span class="nbc-license-status">Active</span></div><div class="nbc-license-grid"><div class="nbc-license-stat"><span>Sites</span><strong>3 / 5</strong></div><div class="nbc-license-stat"><span>Updates</span><strong>Eligible</strong></div><div class="nbc-license-stat"><span>Renewal</span><strong>Sep 2027</strong></div></div><div class="nbc-site-row"><code>app.example.com</code><button class="nbc-button nbc-tactile">MANAGE</button></div></article>`},
  {id:'seat-management',title:'Seat management',category:'account',description:'Seat assignment remains separate from device/site activation.',components:['seat-assignment'],route:'./account/license/demo-soft-team/',markup:`<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>Ana Rivera</strong><small class="store-kicker">ana@example.com</small></span><button class="nbc-button nbc-tactile">REMOVE</button></div><div class="cx-mini-field"><label>Assign a seat</label><input placeholder="teammate@example.com"><button class="nbc-button nbc-button--primary nbc-tactile">ASSIGN SEAT →</button></div></div>`},
  {id:'ownership-operations',title:'Ownership operations',category:'account',description:'Plan change, transfer/gift, and subscription actions expose consequence before mutation.',components:['plan-change','ownership-transfer','subscription-management','renewal-state'],route:'./account/license/demo-soft-team/',markup:`<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>Change plan</strong><small class="store-kicker">Quote before apply</small></span><button class="nbc-button nbc-tactile">QUOTE CHANGE →</button></div><div class="cx-mini-row"><span><strong>Transfer / gift</strong><small class="store-kicker">Invitation first</small></span><button class="nbc-button nbc-tactile">CREATE INVITE</button></div><div class="cx-mini-row"><span><strong>Annual renewal</strong><small class="store-kicker">Active · Sep 2027</small></span><button class="nbc-button nbc-tactile">CANCEL RENEWAL</button></div></div>`},
  {id:'ownership-timeline',title:'Ownership timeline',category:'account',description:'Audit history renders provider-returned events rather than reconstructing them.',components:['ownership-timeline','ownership-lifecycle'],route:'./account/license/demo-soft-team/',markup:`<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>Plan upgraded</strong><small class="store-kicker">Team · today</small></span><span class="nbc-license-status">Complete</span></div><div class="cx-mini-row"><span><strong>Seat assigned</strong><small class="store-kicker">Ana Rivera · 2h ago</small></span><span class="nbc-license-status">Active</span></div><div class="cx-mini-row"><span><strong>License purchased</strong><small class="store-kicker">Order #NBC-1042</small></span><span class="nbc-license-status">Paid</span></div></div>`},
  {id:'system-states',title:'System-state matrix',category:'system',description:'Empty, loading, error, offline, permission, and unsupported use one predictable anatomy.',components:['system-states'],route:'./components/',markup:`<div class="store-grid"><article class="nbc-state" data-state="empty"><strong>Nothing here yet.</strong><span>Keep the next action visible.</span></article><article class="nbc-state" data-state="error"><strong>Provider error.</strong><span>Preserve context for retry.</span></article><article class="nbc-state" data-state="offline"><strong>You are offline.</strong><span>Keep local state intact.</span></article></div>`}
];

const qs=(selector,scope=document)=>scope.querySelector(selector);
const qsa=(selector,scope=document)=>[...scope.querySelectorAll(selector)];
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const label=id=>id.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
const chipRow=(title,items)=>items?.length?`<div class="cx-chip-row" aria-label="${escapeHtml(title)}">${items.map(item=>`<span class="cx-chip">${escapeHtml(item)}</span>`).join('')}</div>`:'';

function previewFor(id){
  switch(id){
    case 'product-card': return `<article class="nbc-product-card"><span class="nbc-badge">Design system</span><div class="nbc-product-art"><strong>SOFT.</strong></div><h3>NeoBrutal Soft</h3><p>Production UI system.</p><div class="nbc-price"><strong>$49</strong><span>Individual</span></div><button class="nbc-button nbc-button--primary nbc-tactile">ADD TO CART →</button></article>`;
    case 'trust-strip': return `<div class="nbc-trust"><span class="nbc-trust-mark">✓</span><div><strong>12 months of updates</strong><p>Entitlement scope is explicit before purchase.</p></div></div>`;
    case 'promo-band': return `<div class="store-card" data-tone="pink"><p class="store-kicker">LAUNCH WEEK</p><h3>Team license includes onboarding.</h3><p>No countdown. No fake scarcity. The actual commercial consequence is stated.</p></div>`;
    case 'badge': return `<div class="store-actions-row"><span class="nbc-badge">Design system</span><span class="nbc-badge nbc-badge--coral">Bundle</span><span class="nbc-badge nbc-badge--lime">Active</span></div>`;
    case 'price-block': return `<div class="cx-mini-stack"><div class="nbc-price"><strong>$149</strong><span>/ Team</span><del>$179</del></div><p class="store-kicker">5 production sites · 12 months updates</p></div>`;
    case 'product-detail': return `<div class="cx-mini-stack"><span class="nbc-badge">Complete system</span><h2>NeoBrutal Soft.</h2><p>Refined Neo-Brutalism for SaaS, admin, developer and AI products.</p><ul class="nbc-feature-list"><li>Light + dark themes</li><li>Fluid clamp() foundation</li><li>Agent-readable contracts</li></ul></div>`;
    case 'product-gallery': return `<div class="cx-mini-stack"><div class="nbc-product-art"><strong>SOFT.</strong></div><div class="store-actions-row"><button class="nbc-button nbc-tactile">01</button><button class="nbc-button nbc-tactile">02</button><button class="nbc-button nbc-tactile">03</button></div></div>`;
    case 'product-media': return `<div class="cx-mini-stack" data-demo-media><div class="store-actions-row"><button class="nbc-button nbc-button--primary nbc-tactile" aria-pressed="true" data-media-state="preview">PREVIEW</button><button class="nbc-button nbc-tactile" aria-pressed="false" data-media-state="code">CODE</button><button class="nbc-button nbc-tactile" aria-pressed="false" data-media-state="files">FILES</button></div><div class="nbc-product-art" data-media-panel><strong>PREVIEW</strong></div></div>`;
    case 'review-summary': return `<div class="nbc-rating"><div class="nbc-stars" aria-label="4.9 out of 5 stars"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div><strong>4.9 / 5</strong><small>128 verified buyers</small></div>`;
    case 'testimonials': return `<div class="nbc-review-grid"><article class="nbc-review"><blockquote>“The tactile grammar makes actions obvious without making the UI noisy.”</blockquote><footer><strong>Example customer</strong><span>Product team</span></footer></article></div>`;
    case 'guarantee': return `<div class="nbc-trust"><span class="nbc-trust-mark">↺</span><div><strong>Fit guarantee</strong><p>Refund and support terms are policy data, never inferred by the component.</p></div></div>`;
    case 'license-selector': return `<div class="nbc-license-selector"><label class="nbc-license-option"><input type="radio" name="license-demo" checked><span><strong>Individual</strong><small>1 production site</small></span><span class="price">$49</span></label><label class="nbc-license-option"><input type="radio" name="license-demo"><span><strong>Team</strong><small>5 production sites</small></span><span class="price">$149</span></label></div>`;
    case 'renewal-note': return `<div class="nbc-update-card" data-eligible="true"><div><strong>Updates included through 08 Sep 2027</strong><small>Already licensed versions remain attached to ownership.</small></div><span class="nbc-license-status">Eligible</span></div>`;
    case 'pricing-tier': return `<article class="nbc-plan-card" data-featured="true"><span class="nbc-plan-ribbon">POPULAR</span><p class="store-kicker">TEAM</p><h3>For product teams</h3><div class="nbc-price"><strong>$149</strong></div><ul class="nbc-feature-list"><li>5 production sites</li><li>12 months updates</li></ul><button class="nbc-button nbc-button--dark nbc-tactile">CHOOSE TEAM →</button></article>`;
    case 'plan-comparison': return `<div class="nbc-compare-wrap" tabindex="0"><table class="nbc-compare"><thead><tr><th>Plan</th><th>Sites</th><th>Updates</th></tr></thead><tbody><tr><th>Individual</th><td>1</td><td class="nbc-yes">✓</td></tr><tr><th>Team</th><td>5</td><td class="nbc-yes">✓</td></tr><tr><th>Agency</th><td>25</td><td class="nbc-yes">✓</td></tr></tbody></table></div>`;
    case 'bundle-builder': return `<div class="nbc-bundle"><label class="nbc-bundle-option"><input type="checkbox"><span><strong>Figma source</strong><small>Optional extra</small></span><strong>+$20</strong></label><label class="nbc-bundle-option"><input type="checkbox"><span><strong>Onboarding</strong><small>Optional session</small></span><strong>+$50</strong></label><div class="nbc-bundle-total"><span>Total</span><strong>$49</strong></div></div>`;
    case 'cart-item': return `<div class="cx-mini-row"><div><strong>NeoBrutal Soft</strong><small class="store-kicker">Team · qty 1</small></div><strong>$149</strong><button class="nbc-button nbc-tactile">REMOVE</button></div>`;
    case 'order-summary': return `<div class="store-summary"><div class="store-summary-row"><span>Soft · Team</span><strong>$149.00</strong></div><div class="store-summary-row"><span>Tax</span><strong>$0.00</strong></div><div class="store-summary-row" data-total><span>Total</span><strong>$149.00</strong></div></div>`;
    case 'coupon': return `<div class="nbc-coupon" data-demo-coupon><input value="WELCOME10" aria-label="Coupon code"><button class="nbc-button nbc-tactile" data-demo-action="coupon">APPLY</button><span class="nbc-coupon-status" data-state="success" hidden>Coupon applied. New total is visible in the quote.</span></div>`;
    case 'checkout-field': return `<div class="cx-mini-stack"><div class="cx-mini-field"><label for="demo-email">Email</label><input id="demo-email" type="email" value="buyer@example.com" autocomplete="email"></div><div class="cx-mini-field"><label for="demo-country">Country</label><select id="demo-country"><option>India</option><option>United States</option></select></div></div>`;
    case 'invoice-details': return `<div class="cx-mini-stack"><div class="cx-mini-field"><label>Company / legal name</label><input value="Northstar Studio"></div><div class="cx-mini-field"><label>Tax ID</label><input value="IN-EXAMPLE-001"></div><p class="store-kicker">Provider quote remains authoritative for tax outcome.</p></div>`;
    case 'checkout-steps': return `<div class="nbc-checkout-steps"><div class="nbc-checkout-step" aria-current="step"><span>01</span><strong>Contact</strong></div><div class="nbc-checkout-step"><span>02</span><strong>Payment</strong></div><div class="nbc-checkout-step"><span>03</span><strong>Done</strong></div></div>`;
    case 'payment-method': return `<div class="nbc-payment-list"><label class="nbc-payment-method"><input type="radio" name="pay-demo" checked><span><strong>Card</strong><small>Secure provider handoff</small></span></label><label class="nbc-payment-method"><input type="radio" name="pay-demo"><span><strong>PayPal</strong><small>Provider redirect</small></span></label></div>`;
    case 'payment-failure': return `<article class="nbc-state" data-state="error"><strong>Payment provider returned an error.</strong><span>The quote and customer input remain available.</span><div class="nbc-state-actions"><button class="nbc-button nbc-tactile">TRY AGAIN</button></div></article>`;
    case 'payment-recovery': return `<article class="nbc-state" data-state="success" data-demo-recovery><strong>Payment method updated.</strong><span>Review the same quote before submitting again.</span><div class="nbc-state-actions"><button class="nbc-button nbc-button--primary nbc-tactile" data-demo-action="recovery">SUBMIT AGAIN →</button></div></article>`;
    case 'processing-state': return `<article class="nbc-state" data-state="loading"><strong>Submitting order…</strong><span>Repeat submit is blocked while processing.</span><div class="nbc-skeleton" aria-hidden="true"><span></span><span></span><span></span></div></article>`;
    case 'order-confirmation': return `<div class="nbc-order-success"><p class="store-kicker">ORDER COMPLETE</p><h2>Thanks — your order is confirmed.</h2><span class="nbc-order-number">#NBC-1042</span></div>`;
    case 'receipt': return `<div class="nbc-receipt-grid"><div><span>Paid</span><strong>$149</strong></div><div><span>Plan</span><strong>Team</strong></div><div><span>Invoice</span><strong>INV-1042</strong></div></div>`;
    case 'download-entitlement': return `<div class="nbc-update-card" data-eligible="true"><div><strong>Soft v1.0</strong><small>Signed download · eligible through Sep 2027</small></div><button class="nbc-button nbc-button--primary nbc-tactile">CREATE DOWNLOAD</button></div>`;
    case 'account-nav': return `<nav class="nbc-account-nav"><button class="nbc-account-tab" aria-selected="true">Downloads <span>2</span></button><button class="nbc-account-tab" aria-selected="false">Purchases <span>4</span></button><button class="nbc-account-tab" aria-selected="false">Licenses <span>1</span></button></nav>`;
    case 'download-row': return `<div class="nbc-download-row"><div class="nbc-download-meta"><strong>NeoBrutal Soft</strong><small>Updates eligible</small></div><span class="nbc-download-version">v1.0</span><button class="nbc-button nbc-tactile">DOWNLOAD</button></div>`;
    case 'purchase-history-row': return `<div class="nbc-history-row"><div class="nbc-history-meta"><strong>Order #NBC-1042</strong><small>08 Sep 2026 · Team license</small></div><strong>$149</strong><button class="nbc-button nbc-tactile">VIEW</button></div>`;
    case 'license-card': return `<article class="nbc-license-card"><div class="nbc-license-head"><div><p class="store-kicker">TEAM LICENSE</p><h3>NeoBrutal Soft · v1.0.0</h3></div><span class="nbc-license-status">Active</span></div><div class="nbc-license-key"><span>NBC-SOFT-••••-1042</span><button class="nbc-button nbc-tactile">COPY</button></div><div class="nbc-license-grid"><div class="nbc-license-stat"><span>Sites</span><strong>3 / 5</strong></div><div class="nbc-license-stat"><span>Seats</span><strong>4 / 5</strong></div><div class="nbc-license-stat"><span>Updates</span><strong>Eligible</strong></div></div></article>`;
    case 'invoice-history': return `<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>INV-1042</strong><small class="store-kicker">08 Sep 2026 · Paid</small></span><strong>$149</strong></div><div class="cx-mini-row"><span><strong>INV-0911</strong><small class="store-kicker">08 Sep 2025 · Paid</small></span><strong>$149</strong></div></div>`;
    case 'license-status': return `<div class="store-actions-row"><span class="nbc-license-status">Active</span><span class="nbc-license-status nbc-license-status--warning">Grace</span><span class="nbc-license-status nbc-license-status--expired">Expired</span></div>`;
    case 'activation-row': return `<div class="nbc-site-row"><code>app.example.com</code><span class="nbc-license-status">Active</span></div><div class="nbc-site-row"><code>staging.example.com</code><button class="nbc-button nbc-tactile">DEACTIVATE</button></div>`;
    case 'update-eligibility': return `<div class="nbc-update-card" data-eligible="true"><div><strong>Updates available</strong><small>Your current term includes v1.0 and signed downloads.</small></div><span class="nbc-license-status">Eligible</span></div>`;
    case 'seat-assignment': return `<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>Ana Rivera</strong><small class="store-kicker">ana@example.com</small></span><button class="nbc-button nbc-tactile">REMOVE</button></div><div class="cx-mini-field"><label>Assign seat</label><input placeholder="teammate@example.com"><button class="nbc-button nbc-button--primary nbc-tactile">ASSIGN</button></div></div>`;
    case 'renewal-state': return `<div class="cx-mini-row"><span><strong>Annual renewal</strong><small class="store-kicker">Next billing · 08 Sep 2027</small></span><span class="nbc-license-status">Active</span></div>`;
    case 'plan-change': return `<div class="cx-mini-stack"><div class="cx-mini-field"><label>Target plan</label><select><option>Agency</option><option>Individual</option></select></div><div class="cx-mini-field"><label>Effective</label><select><option>Immediately</option><option>Next term</option></select></div><button class="nbc-button nbc-button--primary nbc-tactile">QUOTE CHANGE →</button><p class="store-kicker">Quote before mutation.</p></div>`;
    case 'ownership-transfer': return `<div class="cx-mini-stack"><div class="cx-mini-field"><label>Transfer type</label><select><option>Gift</option><option>Ownership transfer</option></select></div><div class="cx-mini-field"><label>Recipient</label><input value="recipient@example.com"></div><button class="nbc-button nbc-button--primary nbc-tactile">CREATE INVITATION →</button><p class="store-kicker">Pending invitation ≠ ownership moved.</p></div>`;
    case 'subscription-management': return `<div class="cx-mini-row" data-demo-subscription data-state="active"><span><strong>Annual subscription</strong><small class="store-kicker" data-subscription-copy>Active · renews 08 Sep 2027</small></span><button class="nbc-button nbc-tactile" data-demo-action="subscription">CANCEL RENEWAL</button></div>`;
    case 'ownership-timeline': return `<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>Plan upgraded</strong><small class="store-kicker">Team · today</small></span><span class="nbc-license-status">Complete</span></div><div class="cx-mini-row"><span><strong>Seat assigned</strong><small class="store-kicker">Ana · 2h ago</small></span><span class="nbc-license-status">Active</span></div><div class="cx-mini-row"><span><strong>License purchased</strong><small class="store-kicker">Order #NBC-1042</small></span><span class="nbc-license-status">Paid</span></div></div>`;
    case 'component-contract': return `<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>Model</strong><small class="store-kicker">Normalized data</small></span><code>ProductView</code></div><div class="cx-mini-row"><span><strong>Action</strong><small class="store-kicker">Canonical command</small></span><code>cart.add</code></div><div class="cx-mini-row"><span><strong>State</strong><small class="store-kicker">Explicit taxonomy</small></span><code>ready</code></div></div>`;
    case 'tokens': return `<div class="cx-token-grid"><div class="cx-token cx-token--yellow">yellow</div><div class="cx-token cx-token--coral">coral</div><div class="cx-token cx-token--lime">lime</div><div class="cx-token cx-token--sky">sky</div></div><div class="cx-mini-row"><code>--nbc-depth</code><strong>6px</strong></div><div class="cx-mini-row"><code>--nbc-press-hover</code><strong>3px</strong></div>`;
    case 'system-states': return `<div class="store-grid"><article class="nbc-state" data-state="empty"><strong>Nothing here yet.</strong><span>Show the next meaningful action.</span></article><article class="nbc-state" data-state="error"><strong>Provider error.</strong><span>Keep context available for retry.</span></article></div>`;
    case 'ownership-lifecycle': return `<div class="cx-mini-stack"><div class="cx-mini-row"><span><strong>Active renewal</strong><small class="store-kicker">Updates + downloads eligible</small></span><span class="nbc-license-status">Active</span></div><div class="cx-mini-row"><span><strong>Grace period</strong><small class="store-kicker">Recovery window</small></span><span class="nbc-license-status nbc-license-status--warning">Grace</span></div><div class="cx-mini-row"><span><strong>Refunded order</strong><small class="store-kicker">Policy decides entitlement</small></span><span class="nbc-license-status nbc-license-status--expired">Refunded</span></div></div>`;
    default:return `<div class="nbc-state" data-state="empty"><strong>${escapeHtml(label(id))}</strong><span>Contract registered. Open the live route for full context.</span></div>`;
  }
}

function renderComponent(component){
  const category=CATEGORY_BY_ID[component.id]||'system';
  const search=[component.id,component.kind,category,...(component.models||[]),...(component.actions||[]),...(component.states||[]),...(component.agentRules||[])].join(' ').toLowerCase();
  return `<article class="cx-component-card" data-component-card data-component-id="${escapeHtml(component.id)}" data-category="${category}" data-search="${escapeHtml(search)}">
    <header class="cx-component-head"><div class="cx-component-title"><h3>${escapeHtml(label(component.id))}</h3><code>${escapeHtml(component.id)}</code></div><span class="cx-kind">${escapeHtml(component.kind)}</span></header>
    <div class="cx-preview" data-preview-for="${escapeHtml(component.id)}">${previewFor(component.id)}</div>
    <div class="cx-contract"><div class="cx-chip-row"><span class="cx-chip">${escapeHtml(CATEGORY_LABELS[category])}</span></div>${chipRow('Models',component.models)}${chipRow('Actions',component.actions)}${chipRow('States',component.states)}<details><summary>Agent rules · ${component.agentRules?.length||0}</summary><ul>${(component.agentRules||[]).map(rule=>`<li>${escapeHtml(rule)}</li>`).join('')}</ul></details><a class="cx-live-link" href="${ROUTES[component.id]||'./components/'}">Open live route →</a></div>
  </article>`;
}

function renderBlock(block){
  const search=[block.id,block.title,block.category,block.description,...block.components].join(' ').toLowerCase();
  return `<article class="cx-block-card" data-block-card data-search="${escapeHtml(search)}"><div class="cx-block-copy"><p class="cx-kicker">${escapeHtml(block.category)} block</p><h3>${escapeHtml(block.title)}</h3><p>${escapeHtml(block.description)}</p><div class="cx-block-meta">${block.components.map(id=>`<span class="cx-chip">${escapeHtml(id)}</span>`).join('')}</div><a class="nbc-button nbc-tactile" href="${block.route}">OPEN LIVE ROUTE →</a></div><div class="cx-block-preview">${block.markup}</div></article>`;
}

let registry=[];
let mode='components';
let category='all';
let query='';

function applyFilters(){
  if(mode==='components'){
    const cards=qsa('[data-component-card]');
    let visible=0;
    for(const card of cards){
      const categoryMatch=category==='all'||card.dataset.category===category;
      const searchMatch=!query||card.dataset.search.includes(query);
      card.hidden=!(categoryMatch&&searchMatch);
      if(!card.hidden)visible++;
    }
    qs('#resultCount').textContent=`${visible} component${visible===1?'':'s'}`;
    qs('#resultHint').textContent=query||category!=='all'?`Filtered from ${registry.length} frozen contracts.`:'Showing the complete frozen registry.';
    qs('#componentEmpty').hidden=visible!==0;
  }else{
    const cards=qsa('[data-block-card]');
    let visible=0;
    for(const card of cards){
      const match=!query||card.dataset.search.includes(query);
      card.hidden=!match;
      if(match)visible++;
    }
    qs('#blockCount').textContent=`${visible} block${visible===1?'':'s'}`;
    qs('#blockEmpty').hidden=visible!==0;
  }
}

function setMode(next){
  mode=next;
  const components=mode==='components';
  qs('#componentsTab').setAttribute('aria-selected',String(components));
  qs('#blocksTab').setAttribute('aria-selected',String(!components));
  qs('#componentsPanel').hidden=!components;
  qs('#blocksPanel').hidden=components;
  qs('#categoryNav').hidden=!components;
  applyFilters();
}

function setTheme(theme){
  document.documentElement.dataset.theme=theme;
  localStorage.setItem('nbc-showcase-theme',theme);
  const toggle=qs('#themeToggle');
  const dark=theme==='dark';
  toggle.textContent=dark?'☀ Light':'◐ Dark';
  toggle.setAttribute('aria-pressed',String(dark));
}

function wirePreviewInteractions(){
  document.addEventListener('click',event=>{
    const mediaButton=event.target.closest('[data-media-state]');
    if(mediaButton){
      const shell=mediaButton.closest('[data-demo-media]');
      qsa('[data-media-state]',shell).forEach(button=>{button.setAttribute('aria-pressed',String(button===mediaButton));button.classList.toggle('nbc-button--primary',button===mediaButton)});
      qs('[data-media-panel]',shell).innerHTML=`<strong>${escapeHtml(mediaButton.dataset.mediaState.toUpperCase())}</strong>`;
      return;
    }
    const action=event.target.closest('[data-demo-action]');
    if(!action)return;
    if(action.dataset.demoAction==='coupon'){
      const shell=action.closest('[data-demo-coupon]');
      const status=qs('.nbc-coupon-status',shell);status.hidden=false;action.textContent='APPLIED ✓';action.disabled=true;
    }
    if(action.dataset.demoAction==='recovery'){
      const shell=action.closest('[data-demo-recovery]');
      shell.dataset.state='loading';qs('strong',shell).textContent='Submitting recovered payment…';action.disabled=true;action.textContent='PROCESSING…';
      setTimeout(()=>{shell.dataset.state='success';qs('strong',shell).textContent='Recovered payment accepted.';qs('span',shell).textContent='The order can now continue to confirmation.';action.textContent='COMPLETE ✓'},650);
    }
    if(action.dataset.demoAction==='subscription'){
      const shell=action.closest('[data-demo-subscription]');
      const active=shell.dataset.state==='active';shell.dataset.state=active?'cancel_at_period_end':'active';qs('[data-subscription-copy]',shell).textContent=active?'Cancels at term end · access preserved':'Active · renews 08 Sep 2027';action.textContent=active?'RESUME RENEWAL':'CANCEL RENEWAL';
    }
  });
}

async function init(){
  const stored=localStorage.getItem('nbc-showcase-theme');
  setTheme(stored==='dark'?'dark':'light');
  qs('#themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  qs('#focusSearch').addEventListener('click',()=>qs('#componentSearch').focus());
  qs('#componentsTab').addEventListener('click',()=>setMode('components'));
  qs('#blocksTab').addEventListener('click',()=>setMode('blocks'));
  qsa('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;qsa('[data-category]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));applyFilters()}));
  qs('#componentSearch').addEventListener('input',event=>{query=event.currentTarget.value.trim().toLowerCase();applyFilters()});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)){event.preventDefault();qs('#componentSearch').focus()}});
  qs('#blockGrid').innerHTML=BLOCKS.map(renderBlock).join('');
  try{
    const response=await fetch('./storefront/components.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`Registry request failed: ${response.status}`);
    const payload=await response.json();
    registry=payload.components||[];
    if(payload.commerceVersion!=='1.0.0')throw new Error(`Expected Commerce 1.0.0 registry, received ${payload.commerceVersion}`);
    const known=new Set(Object.values(COMPONENT_CATEGORIES).flat());
    const registryIds=registry.map(component=>component.id);
    const missing=registryIds.filter(id=>!known.has(id));
    const stale=[...known].filter(id=>!registryIds.includes(id));
    if(missing.length||stale.length)throw new Error(`Explorer/registry drift. Missing explorer IDs: ${missing.join(', ')||'none'}; stale explorer IDs: ${stale.join(', ')||'none'}`);
    qs('#componentGrid').innerHTML=registry.map(renderComponent).join('');
    qs('#componentCount').textContent=String(registry.length);
    qs('#resultCount').textContent=`${registry.length} components`;
    wirePreviewInteractions();
    applyFilters();
  }catch(error){
    qs('#componentGrid').innerHTML=`<div class="cx-empty"><strong>Component registry could not load.</strong><span>${escapeHtml(error.message)}</span><a href="./storefront/components.json">Open registry directly →</a></div>`;
    console.error(error);
  }
}

init();
