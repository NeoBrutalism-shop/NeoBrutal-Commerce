import {createCommerceAdapter,createLicensingAdapter,composeCommerceRuntime} from '../contracts/runtime.js';

const clone=value=>structuredClone(value);
const nowIso=()=>new Date().toISOString();
const makeId=(prefix,counter)=>`${prefix}-${String(counter).padStart(4,'0')}`;
const money=(amount,currency='USD')=>Object.freeze({amount:Number(amount),currency,formatted:new Intl.NumberFormat('en-US',{style:'currency',currency}).format(Number(amount))});

const OFFER_DATA=Object.freeze({
  individual:Object.freeze({id:'individual',label:'Individual',price:49,capacity:Object.freeze({sites:1,seats:1,label:'1 production site'})}),
  team:Object.freeze({id:'team',label:'Team',price:99,capacity:Object.freeze({sites:5,seats:5,label:'5 production sites / 5 team seats'})}),
  agency:Object.freeze({id:'agency',label:'Agency',price:179,capacity:Object.freeze({sites:25,seats:25,label:'25 production sites / 25 team seats'})})
});

const DEFAULT_PRODUCT=Object.freeze({
  id:'soft',
  name:'NeoBrutal Soft',
  kind:'design-system',
  summary:'Refined Neo-Brutalism for SaaS, admin and AI product interfaces.',
  route:'product/soft/',
  offers:Object.freeze(Object.values(OFFER_DATA).map(offer=>Object.freeze({id:offer.id,label:offer.label,price:money(offer.price),capacity:offer.capacity}))),
  entitlements:Object.freeze(['source-files','12-month-updates','commercial-use']),
  media:Object.freeze(['preview','code','files']),
  reviewSummary:Object.freeze({rating:4.9,count:38,source:'verified-buyers'}),
  guarantee:Object.freeze({days:30,policySource:'commerce-adapter'}),
  renewal:Object.freeze({updateEligibilityMonths:12,existingLicensedVersionsRemainOwned:true})
});

function paginate(items,{cursor,limit=50}={}){
  const start=cursor?Math.max(0,Number(cursor)||0):0;
  const size=Math.max(1,Math.min(100,Number(limit)||50));
  const page=items.slice(start,start+size);
  const next=start+size<items.length?String(start+size):null;
  return {items:clone(page),nextCursor:next};
}
function findProduct(products,productId){return products.find(product=>product.id===productId)||null;}
function findOffer(product,offerId){return product?.offers?.find(offer=>offer.id===offerId)||null;}
function cartTotals(lines,currency='USD'){
  const subtotalAmount=lines.reduce((sum,line)=>sum+line.subtotal.amount,0);
  return {subtotal:money(subtotalAmount,currency),total:money(subtotalAmount,currency)};
}

export function createReferenceCommerceAdapter({products=[DEFAULT_PRODUCT],currency='USD'}={}){
  const productData=clone(products);
  const carts=new Map();
  const orders=new Map();
  const invoices=new Map();
  const subscriptions=new Map([['subscription-reference-team',{
    id:'subscription-reference-team',licenseId:'license-reference-team',status:'active',interval:'year',amount:money(99,currency),renewsAt:'2027-09-08T00:00:00.000Z',cancelAtPeriodEnd:false,paymentMethodLabel:'•••• 4242',metadata:{provider:'reference'}
  }]]);
  let cartCounter=1,lineCounter=1,orderCounter=1,invoiceCounter=1;

  const readCart=(cartId)=>{
    const resolvedId=cartId||'reference-cart';
    let cart=carts.get(resolvedId);
    if(!cart){cart={id:resolvedId,lines:[],updatedAt:nowIso()};carts.set(resolvedId,cart);}
    const totals=cartTotals(cart.lines,currency);
    return {id:cart.id,lines:clone(cart.lines),...totals,isEmpty:cart.lines.length===0,updatedAt:cart.updatedAt};
  };

  const adapter={
    capabilities:{taxes:false,discounts:false,invoices:true,refunds:true,invoiceHistory:true,subscriptions:true},
    async listProducts(query={}){return paginate(productData,query);},
    async getProduct(productId){const product=findProduct(productData,productId);return product?clone(product):null;},
    async getCart(cartId){return readCart(cartId);},
    async addCartLine({cartId,productId,offerId,quantity=1}){
      const product=findProduct(productData,productId);if(!product)throw new RangeError(`Unknown reference product: ${productId}`);
      const offer=findOffer(product,offerId);if(!offer)throw new RangeError(`Unknown reference offer: ${offerId}`);
      const qty=Math.max(1,Math.trunc(Number(quantity)||1));
      const resolvedCartId=cartId||makeId('cart',cartCounter++);
      const cart=carts.get(resolvedCartId)||{id:resolvedCartId,lines:[],updatedAt:nowIso()};
      const existing=cart.lines.find(line=>line.productId===productId&&line.offerId===offerId);
      if(existing){existing.quantity+=qty;existing.subtotal=money(existing.unitPrice.amount*existing.quantity,currency);}
      else cart.lines.push({id:makeId('line',lineCounter++),productId,offerId,quantity:qty,label:`${product.name} · ${offer.label}`,unitPrice:money(offer.price.amount,currency),subtotal:money(offer.price.amount*qty,currency),capacity:clone(offer.capacity||{})});
      cart.updatedAt=nowIso();carts.set(resolvedCartId,cart);return readCart(resolvedCartId);
    },
    async removeCartLine({cartId,lineId}){const cart=carts.get(cartId);if(!cart)return readCart(cartId);cart.lines=cart.lines.filter(line=>line.id!==lineId);cart.updatedAt=nowIso();carts.set(cartId,cart);return readCart(cartId);},
    async quoteCheckout({cartId}){const cart=readCart(cartId);return {cartId:cart.id,state:'ready',subtotal:cart.subtotal,discounts:[],taxes:[],total:cart.total,canSubmit:!cart.isEmpty,messages:cart.isEmpty?['Add at least one product before checkout.']:[]};},
    async submitOrder({cartId,paymentMethodId,licenseTermsAccepted}){
      if(!licenseTermsAccepted)throw new TypeError('License terms must be accepted before submitting an order');
      if(!paymentMethodId)throw new TypeError('A payment method ID is required');
      const cart=readCart(cartId);if(cart.isEmpty)throw new RangeError('Cannot submit an empty cart');
      const id=makeId('order',orderCounter++);
      const order={id,status:'complete',lines:cart.lines.map(line=>({id:line.id,productId:line.productId,offerId:line.offerId,label:line.label,quantity:line.quantity,total:clone(line.subtotal)})),total:clone(cart.total),createdAt:nowIso(),receiptUrl:`/reference/receipts/${id}`,metadata:{provider:'reference'}};
      orders.set(id,order);
      const invoice={id:makeId('invoice',invoiceCounter++),orderId:id,number:`NBC-${id.toUpperCase()}`,status:'paid',issuedAt:order.createdAt,total:clone(order.total),taxes:[],downloadUrl:`/reference/invoices/${id}.pdf`,metadata:{provider:'reference'}};
      invoices.set(invoice.id,invoice);
      carts.set(cart.id,{id:cart.id,lines:[],updatedAt:nowIso()});return clone(order);
    },
    async getOrder(orderId){const order=orders.get(orderId);return order?clone(order):null;},
    async listCustomerOrders(query={}){return paginate([...orders.values()],query);},
    async requestRefund({orderId,reason}){
      const order=orders.get(orderId);if(!order)throw new RangeError(`Unknown reference order: ${orderId}`);
      order.status='refunded';order.metadata={...(order.metadata||{}),refundReason:reason||null};orders.set(orderId,order);
      for(const invoice of invoices.values()){if(invoice.orderId===orderId){invoice.status='refunded';invoice.metadata={...(invoice.metadata||{}),refundReason:reason||null};}}
      return clone(order);
    },
    async listInvoices(query={}){const items=[...invoices.values()].filter(item=>!query.orderId||item.orderId===query.orderId);return paginate(items,query);},
    async getSubscription(subscriptionId){const value=subscriptions.get(subscriptionId);return value?clone(value):null;},
    async cancelSubscription({subscriptionId,reason}){
      const value=subscriptions.get(subscriptionId);if(!value)throw new RangeError(`Unknown reference subscription: ${subscriptionId}`);
      value.status='cancel_at_period_end';value.cancelAtPeriodEnd=true;value.metadata={...(value.metadata||{}),cancelReason:reason||null};subscriptions.set(subscriptionId,value);return clone(value);
    },
    async resumeSubscription({subscriptionId}){
      const value=subscriptions.get(subscriptionId);if(!value)throw new RangeError(`Unknown reference subscription: ${subscriptionId}`);
      value.status='active';value.cancelAtPeriodEnd=false;value.metadata={...(value.metadata||{}),cancelReason:null};subscriptions.set(subscriptionId,value);return clone(value);
    }
  };
  return createCommerceAdapter(adapter);
}

export function createReferenceLicensingAdapter({productId='soft',offerId='team'}={}){
  const licenseId='license-reference-team';
  const initialOffer=OFFER_DATA[offerId]||OFFER_DATA.team;
  const license={id:licenseId,productId,offerId:initialOffer.id,status:'active',maskedKey:'DEMO-KEY-••••',capacity:clone(initialOffer.capacity),usage:{sites:2,seats:2,activations:2},purchasedAt:'2026-09-08T00:00:00.000Z',updatesThrough:'2027-09-08T00:00:00.000Z',autoRenewal:true,metadata:{provider:'reference'}};
  const entitlements=[{id:'entitlement-source',productId,licenseId,status:'active',kind:'source-files',downloadAllowed:true,updatesAllowed:true,expiresAt:null},{id:'entitlement-updates',productId,licenseId,status:'active',kind:'updates',downloadAllowed:true,updatesAllowed:true,expiresAt:'2027-09-08T00:00:00.000Z'}];
  const activations=[{id:'activation-app',licenseId,scope:'app.example.com',status:'active',activatedAt:'2026-08-12T00:00:00.000Z',lastSeenAt:'2026-09-08T00:00:00.000Z'},{id:'activation-admin',licenseId,scope:'admin.example.com',status:'active',activatedAt:'2026-08-21T00:00:00.000Z',lastSeenAt:'2026-09-07T00:00:00.000Z'}];
  let seats=[{id:'seat-owner',licenseId,status:'assigned',assignee:{email:'owner@example.com',name:'Owner'},role:'owner',assignedAt:'2026-09-08T00:00:00.000Z'},{id:'seat-developer',licenseId,status:'assigned',assignee:{email:'developer@example.com',name:'Developer'},role:'member',assignedAt:'2026-09-08T00:00:00.000Z'}];
  let transfers=[];
  let events=[
    {id:'event-purchase',licenseId,type:'license.purchased',occurredAt:'2026-09-08T00:00:00.000Z',summary:'Team license purchased',actor:'owner@example.com'},
    {id:'event-activation',licenseId,type:'activation.added',occurredAt:'2026-09-08T00:10:00.000Z',summary:'2 production sites activated',actor:'owner@example.com'}
  ];
  let seatCounter=1,transferCounter=1,eventCounter=1,quoteCounter=1;
  const pushEvent=(type,summary,actor='owner@example.com',metadata={})=>{events=[...events,{id:makeId('event',eventCounter++),licenseId,type,occurredAt:nowIso(),summary,actor,metadata:clone(metadata)}];};

  const adapter={
    capabilities:{activations:true,seats:true,renewals:true,signedDownloads:true,planChanges:true,transfers:true,ownershipHistory:true},
    async listLicenses(query={}){return paginate([license],query);},
    async getLicense(id){return id===licenseId?clone(license):null;},
    async listEntitlements(query={}){const filtered=query.licenseId?entitlements.filter(item=>item.licenseId===query.licenseId):entitlements;return paginate(filtered,query);},
    async listActivations(id){return {items:id===licenseId?clone(activations):[],nextCursor:null};},
    async listSeats(id){return {items:id===licenseId?clone(seats):[],nextCursor:null};},
    async assignSeat({licenseId:id,assignee,role='member'}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);if(!assignee?.email)throw new TypeError('Seat assignee email is required');
      const capacity=license.capacity.seats||0;if(seats.length>=capacity)throw new RangeError('No reference seats are available');
      seats=[...seats,{id:makeId('seat',seatCounter++),licenseId,status:'assigned',assignee:clone(assignee),role,assignedAt:nowIso()}];license.usage={...(license.usage||{}),seats:seats.length};pushEvent('seat.assigned',`Seat assigned to ${assignee.email}`);return {items:clone(seats),nextCursor:null};
    },
    async removeSeat({licenseId:id,seatId}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);const target=seats.find(seat=>seat.id===seatId);if(target?.role==='owner')throw new RangeError('The owner seat cannot be removed');
      seats=seats.filter(seat=>seat.id!==seatId);license.usage={...(license.usage||{}),seats:seats.length};pushEvent('seat.removed',`Seat removed${target?.assignee?.email?` for ${target.assignee.email}`:''}`);return {items:clone(seats),nextCursor:null};
    },
    async renewUpdates({licenseId:id}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);const current=new Date(license.updatesThrough||nowIso());current.setUTCFullYear(current.getUTCFullYear()+1);license.updatesThrough=current.toISOString();license.status='active';pushEvent('license.renewed',`Updates renewed through ${license.updatesThrough.slice(0,10)}`);return clone(license);
    },
    async createSignedDownload({entitlementId,releaseId='latest'}){const entitlement=entitlements.find(item=>item.id===entitlementId);if(!entitlement||!entitlement.downloadAllowed)throw new RangeError(`Entitlement cannot download: ${entitlementId}`);return {url:`/reference/downloads/${encodeURIComponent(releaseId)}?entitlement=${encodeURIComponent(entitlementId)}`,expiresAt:new Date(Date.now()+5*60*1000).toISOString(),releaseId};},
    async quotePlanChange({licenseId:id,toOfferId,effective='immediate'}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);const from=OFFER_DATA[license.offerId],to=OFFER_DATA[toOfferId];if(!to)throw new RangeError(`Unknown reference offer: ${toOfferId}`);
      const direction=to.price>from.price?'upgrade':to.price<from.price?'downgrade':'lateral';const overCapacity=(license.usage?.sites||0)>(to.capacity.sites||Infinity)||(license.usage?.seats||0)>(to.capacity.seats||Infinity);
      const messages=[];if(direction==='downgrade'&&overCapacity&&effective==='immediate')messages.push('Current usage exceeds the target plan. Remove excess sites/seats or schedule the downgrade for the next term.');
      return {id:makeId('quote',quoteCounter++),licenseId,fromOfferId:from.id,toOfferId:to.id,direction,effective,state:'quoted',adjustment:money(to.price-from.price),nextTermAmount:money(to.price),messages};
    },
    async changePlan({licenseId:id,toOfferId,effective='immediate',quoteId}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);const from=OFFER_DATA[license.offerId],to=OFFER_DATA[toOfferId];if(!to)throw new RangeError(`Unknown reference offer: ${toOfferId}`);
      const overCapacity=(license.usage?.sites||0)>(to.capacity.sites||Infinity)||(license.usage?.seats||0)>(to.capacity.seats||Infinity);
      if(effective==='immediate'&&overCapacity)throw new RangeError('Current usage exceeds the target plan capacity');
      if(effective==='next_term'){license.metadata={...(license.metadata||{}),scheduledOfferId:toOfferId};pushEvent('license.plan_change_scheduled',`${from.label} → ${to.label} scheduled for next term`,'owner@example.com',{quoteId});return clone(license);}
      license.offerId=to.id;license.capacity=clone(to.capacity);license.metadata={...(license.metadata||{}),scheduledOfferId:null};pushEvent('license.plan_changed',`${from.label} → ${to.label}`,'owner@example.com',{quoteId});return clone(license);
    },
    async listTransfers({licenseId:id,...query}){return paginate(transfers.filter(item=>item.licenseId===id),query);},
    async createTransfer({licenseId:id,kind,recipient}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);if(!['gift','transfer'].includes(kind))throw new RangeError(`Unknown transfer kind: ${kind}`);if(!recipient?.email)throw new TypeError('Transfer recipient email is required');
      const item={id:makeId('transfer',transferCounter++),licenseId,kind,status:'pending',recipient:clone(recipient),createdAt:nowIso(),expiresAt:new Date(Date.now()+7*24*60*60*1000).toISOString(),metadata:{provider:'reference'}};transfers=[...transfers,item];pushEvent(`license.${kind}_created`,`${kind==='gift'?'Gift':'Transfer'} invitation sent to ${recipient.email}`);return clone(item);
    },
    async cancelTransfer({transferId}){const item=transfers.find(value=>value.id===transferId);if(!item)throw new RangeError(`Unknown reference transfer: ${transferId}`);item.status='cancelled';pushEvent('license.transfer_cancelled',`Transfer ${transferId} cancelled`);return clone(item);},
    async listOwnershipEvents({licenseId:id,...query}){return paginate(events.filter(item=>item.licenseId===id).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)),query);}
  };
  return createLicensingAdapter(adapter);
}

export function createReferenceRuntime(options={}){return composeCommerceRuntime({commerce:createReferenceCommerceAdapter(options.commerce),licensing:createReferenceLicensingAdapter(options.licensing)});}
export {DEFAULT_PRODUCT as REFERENCE_PRODUCT};
