const root=document.documentElement;
const $=(selector,scope=document)=>scope.querySelector(selector);
const $$=(selector,scope=document)=>[...scope.querySelectorAll(selector)];
const priceMap={individual:49,team:99,agency:179};
const planLabel={individual:'Individual',team:'Team',agency:'Agency'};
const licenseLabel={individual:'Individual · 1 site',team:'Team · 5 sites',agency:'Agency · 25 sites'};
let plan='individual';let extras=0;let coupon=false;let cartHasItem=false;let lastCartTrigger=null;

const themeToggle=$('#themeToggle');
function applyTheme(value){root.dataset.theme=value;const dark=value==='dark';themeToggle?.setAttribute('aria-pressed',String(dark));themeToggle?.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');if(themeToggle)themeToggle.textContent=dark?'☼ Light':'◐ Dark';$('meta[name="theme-color"]')?.setAttribute('content',dark?'#171614':'#fff7e8')}
applyTheme(localStorage.getItem('nbc-v02-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
themeToggle?.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('nbc-v02-theme',next);applyTheme(next)});

const promo=$('.promo-band');const promoToggle=$('#promoToggle');
function syncPromo(){if(!promo||!promoToggle)return;const paused=promo.classList.contains('is-paused');promoToggle.textContent=paused?'PLAY →':'PAUSE ‖';promoToggle.setAttribute('aria-pressed',String(paused));promoToggle.setAttribute('aria-label',paused?'Play promotion banner':'Pause promotion banner')}
if(matchMedia('(prefers-reduced-motion: reduce)').matches)promo?.classList.add('is-paused');
promoToggle?.addEventListener('click',()=>{promo?.classList.toggle('is-paused');syncPromo()});syncPromo();

const galleryStage=$('#galleryStage');const galleryLabel=$('#galleryLabel');
const galleryData={sky:{label:'Dashboard kit',className:'v02-gallery-tone-sky',word:'SOFT.'},coral:{label:'Component library',className:'v02-gallery-tone-coral',word:'BUILD.'},lime:{label:'Agent workflow UI',className:'v02-gallery-tone-lime',word:'ACT.'}};
$$('[data-gallery]').forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.gallery;const data=galleryData[value];if(!data||!galleryStage)return;$$('[data-gallery]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));galleryStage.classList.remove('v02-gallery-tone-sky','v02-gallery-tone-coral','v02-gallery-tone-lime');galleryStage.classList.add(data.className);$('strong',galleryStage).textContent=data.word;if(galleryLabel)galleryLabel.textContent=data.label}));

function money(value){return `$${value.toFixed(2)}`}
function currentSubtotal(){return priceMap[plan]+extras}
function currentDiscount(){return coupon?currentSubtotal()*.1:0}
function currentTotal(){return currentSubtotal()-currentDiscount()}
function updateCommerce(){const price=priceMap[plan];const displayPrice=$('#productPrice');if(displayPrice)displayPrice.textContent=`$${price}`;const summaryLicense=$('#summaryLicense');if(summaryLicense)summaryLicense.textContent=licenseLabel[plan];const cartLicense=$('#cartLicense');if(cartLicense)cartLicense.textContent=licenseLabel[plan];const productMoney=money(price);['#summaryProduct','#cartProductPrice'].forEach(id=>{const node=$(id);if(node)node.textContent=productMoney});const extrasMoney=money(extras);['#summaryExtras','#cartExtras'].forEach(id=>{const node=$(id);if(node)node.textContent=extrasMoney});['#summaryExtrasRow','#cartExtrasRow'].forEach(id=>{const node=$(id);if(node)node.hidden=extras===0});const subtotal=currentSubtotal();const discount=currentDiscount();const total=currentTotal();const bundleTotal=$('#bundleTotal');if(bundleTotal)bundleTotal.textContent=`$${extras}`;const checkoutSubtotal=$('#checkoutSubtotal');if(checkoutSubtotal)checkoutSubtotal.textContent=money(subtotal);const discountRow=$('#discountRow');if(discountRow)discountRow.hidden=!coupon;const discountAmount=$('#discountAmount');if(discountAmount)discountAmount.textContent=`−${money(discount)}`;['#checkoutTotal','#cartTotal','#successTotal','#historyTotal'].forEach(id=>{const node=$(id);if(node)node.textContent=money(total)});const successLicense=$('#successLicense');if(successLicense)successLicense.textContent=planLabel[plan];const licensePlan=$('#licensePlan');if(licensePlan)licensePlan.textContent=planLabel[plan]}

$$('input[name="license"]').forEach(input=>input.addEventListener('change',()=>{plan=input.value;updateCommerce()}));
$$('[data-select-plan]').forEach(button=>button.addEventListener('click',()=>{plan=button.dataset.selectPlan;const radio=$(`input[name="license"][value="${plan}"]`);if(radio)radio.checked=true;updateCommerce();$('#product')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});showToast(`${planLabel[plan]} license selected.`)}));
$$('[data-bundle]').forEach(input=>input.addEventListener('change',()=>{extras=$$('[data-bundle]:checked').reduce((sum,item)=>sum+Number(item.value),0);updateCommerce()}));

const cartBackdrop=$('#cartBackdrop');const closeCartButton=$('#closeCart');
function focusableInCart(){return $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',cartBackdrop).filter(node=>!node.hidden)}
function openCart(trigger){if(!cartBackdrop)return;lastCartTrigger=trigger||document.activeElement;cartBackdrop.hidden=false;document.body.style.overflow='hidden';closeCartButton?.focus()}
function closeCart(){if(!cartBackdrop)return;cartBackdrop.hidden=true;document.body.style.overflow='';lastCartTrigger?.focus?.()}
$('#openCart')?.addEventListener('click',event=>openCart(event.currentTarget));
closeCartButton?.addEventListener('click',closeCart);
cartBackdrop?.addEventListener('click',event=>{if(event.target===cartBackdrop)closeCart()});
cartBackdrop?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeCart();return}if(event.key!=='Tab')return;const nodes=focusableInCart();if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
$('#goCheckout')?.addEventListener('click',closeCart);
$('#addToCart')?.addEventListener('click',event=>{cartHasItem=true;const count=$('#cartCount');if(count)count.textContent='1';updateCommerce();showToast(`${planLabel[plan]} license added to cart.`);window.setTimeout(()=>openCart(event.currentTarget),180)});

const couponForm=$('#couponForm');
couponForm?.addEventListener('submit',event=>{event.preventDefault();const value=$('#couponInput')?.value.trim().toUpperCase();const status=$('#couponStatus');coupon=value==='FOUNDRY10';if(status){status.dataset.state=coupon?'success':'error';status.textContent=coupon?'FOUNDRY10 applied · 10% off this demo order.':'Coupon not recognized. Try FOUNDRY10.'}updateCommerce()});

const checkoutForm=$('#checkoutForm');
checkoutForm?.addEventListener('submit',event=>{event.preventDefault();if(!cartHasItem){cartHasItem=true;const count=$('#cartCount');if(count)count.textContent='1'}updateCommerce();const success=$('#orderSuccess');if(success){success.hidden=false;success.focus()}showToast('Demo order completed. Your entitlement is visible below.')});

const tabs=$$('.nbc-account-tab[role="tab"]');
function activateTab(tab,moveFocus=true){tabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;const panel=$(`#${item.getAttribute('aria-controls')}`);if(panel)panel.hidden=!selected});if(moveFocus)tab.focus()}
tabs.forEach((tab,index)=>{tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;tab.addEventListener('click',()=>activateTab(tab,false));tab.addEventListener('keydown',event=>{let next=null;if(event.key==='ArrowRight')next=tabs[(index+1)%tabs.length];if(event.key==='ArrowLeft')next=tabs[(index-1+tabs.length)%tabs.length];if(event.key==='Home')next=tabs[0];if(event.key==='End')next=tabs.at(-1);if(next){event.preventDefault();activateTab(next)}})});

$('#copyLicense')?.addEventListener('click',async event=>{try{await navigator.clipboard.writeText('NEO-SFT-DEMO-7Q2M');showToast('Demo license ID copied.')}catch{showToast('Copy is unavailable in this preview.')}event.currentTarget.textContent='COPIED ✓';window.setTimeout(()=>event.currentTarget.textContent='COPY ID',1000)});
$$('[data-download],#downloadDemo').forEach(button=>button.addEventListener('click',()=>showToast('Demo download prepared. Production would request a signed entitlement URL.')));

const toast=$('#toast');let toastTimer;
function showToast(message){if(!toast)return;toast.textContent=message;toast.hidden=false;window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>{toast.hidden=true},2600)}
updateCommerce();
