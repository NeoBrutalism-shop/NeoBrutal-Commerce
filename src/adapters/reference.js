import {createCommerceAdapter,createLicensingAdapter} from '../contracts/runtime.js';

const clone=value=>structuredClone(value);
const nowIso=()=>new Date().toISOString();
const makeId=(prefix,counter)=>`${prefix}-${String(counter).padStart(4,'0')}`;
const money=(amount,currency='USD')=>Object.freeze({amount:Number(amount),currency,formatted:new Intl.NumberFormat('en-US',{style:'currency',currency}).format(Number(amount))});

const DEFAULT_PRODUCT=Object.freeze({
  id:'soft',
  name:'NeoBrutal Soft',
  kind:'design-system',
  summary:'Refined Neo-Brutalism for SaaS, admin and AI product interfaces.',
  route:'product/soft/',
  offers:Object.freeze([
    Object.freeze({id:'individual',label:'Individual',price:money(49),capacity:Object.freeze({sites:1,label:'1 production site'})}),
    Object.freeze({id:'team',label:'Team',price:money(99),capacity:Object.freeze({sites:5,label:'5 production sites'})}),
    Object.freeze({id:'agency',label:'Agency',price:money(179),capacity:Object.freeze({sites:25,label:'25 production sites'})})
  ]),
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

function findProduct(products,productId){
  return products.find(product=>product.id===productId)||null;
}

function findOffer(product,offerId){
  return product?.offers?.find(offer=>offer.id===offerId)||null;
}

function cartTotals(lines,currency='USD'){
  const subtotalAmount=lines.reduce((sum,line)=>sum+line.subtotal.amount,0);
  return {subtotal:money(subtotalAmount,currency),total:money(subtotalAmount,currency)};
}

export function createReferenceCommerceAdapter({products=[DEFAULT_PRODUCT],currency='USD'}={}){
  const productData=clone(products);
  const carts=new Map();
  const orders=new Map();
  let cartCounter=1;
  let lineCounter=1;
  let orderCounter=1;

  const readCart=(cartId)=>{
    const resolvedId=cartId||'reference-cart';
    let cart=carts.get(resolvedId);
    if(!cart){
      cart={id:resolvedId,lines:[],updatedAt:nowIso()};
      carts.set(resolvedId,cart);
    }
    const totals=cartTotals(cart.lines,currency);
    return {id:cart.id,lines:clone(cart.lines),...totals,isEmpty:cart.lines.length===0,updatedAt:cart.updatedAt};
  };

  const adapter={
    capabilities:{taxes:false,discounts:false,invoices:true,refunds:true},

    async listProducts(query={}){
      return paginate(productData,query);
    },

    async getProduct(productId){
      const product=findProduct(productData,productId);
      return product?clone(product):null;
    },

    async getCart(cartId){
      return readCart(cartId);
    },

    async addCartLine({cartId,productId,offerId,quantity=1}){
      const product=findProduct(productData,productId);
      if(!product)throw new RangeError(`Unknown reference product: ${productId}`);
      const offer=findOffer(product,offerId);
      if(!offer)throw new RangeError(`Unknown reference offer: ${offerId}`);
      const qty=Math.max(1,Math.trunc(Number(quantity)||1));
      const resolvedCartId=cartId||makeId('cart',cartCounter++);
      const cart=carts.get(resolvedCartId)||{id:resolvedCartId,lines:[],updatedAt:nowIso()};
      const existing=cart.lines.find(line=>line.productId===productId&&line.offerId===offerId);
      if(existing){
        existing.quantity+=qty;
        existing.subtotal=money(existing.unitPrice.amount*existing.quantity,currency);
      }else{
        cart.lines.push({
          id:makeId('line',lineCounter++),
          productId,
          offerId,
          quantity:qty,
          label:`${product.name} · ${offer.label}`,
          unitPrice:money(offer.price.amount,currency),
          subtotal:money(offer.price.amount*qty,currency),
          capacity:clone(offer.capacity||{})
        });
      }
      cart.updatedAt=nowIso();
      carts.set(resolvedCartId,cart);
      return readCart(resolvedCartId);
    },

    async removeCartLine({cartId,lineId}){
      const cart=carts.get(cartId);
      if(!cart)return readCart(cartId);
      cart.lines=cart.lines.filter(line=>line.id!==lineId);
      cart.updatedAt=nowIso();
      carts.set(cartId,cart);
      return readCart(cartId);
    },

    async quoteCheckout({cartId}){
      const cart=readCart(cartId);
      return {
        cartId:cart.id,
        state:'ready',
        subtotal:cart.subtotal,
        discounts:[],
        taxes:[],
        total:cart.total,
        canSubmit:!cart.isEmpty,
        messages:cart.isEmpty?['Add at least one product before checkout.']:[]
      };
    },

    async submitOrder({cartId,paymentMethodId,licenseTermsAccepted}){
      if(!licenseTermsAccepted)throw new TypeError('License terms must be accepted before submitting an order');
      if(!paymentMethodId)throw new TypeError('A payment method ID is required');
      const cart=readCart(cartId);
      if(cart.isEmpty)throw new RangeError('Cannot submit an empty cart');
      const id=makeId('order',orderCounter++);
      const order={
        id,
        status:'complete',
        lines:cart.lines.map(line=>({id:line.id,productId:line.productId,offerId:line.offerId,label:line.label,quantity:line.quantity,total:clone(line.subtotal)})),
        total:clone(cart.total),
        createdAt:nowIso(),
        receiptUrl:`/reference/receipts/${id}`,
        metadata:{provider:'reference'}
      };
      orders.set(id,order);
      carts.set(cart.id,{id:cart.id,lines:[],updatedAt:nowIso()});
      return clone(order);
    },

    async getOrder(orderId){
      const order=orders.get(orderId);
      return order?clone(order):null;
    },

    async listCustomerOrders(query={}){
      return paginate([...orders.values()],query);
    },

    async requestRefund({orderId,reason}){
      const order=orders.get(orderId);
      if(!order)throw new RangeError(`Unknown reference order: ${orderId}`);
      order.status='refunded';
      order.metadata={...(order.metadata||{}),refundReason:reason||null};
      orders.set(orderId,order);
      return clone(order);
    }
  };

  return createCommerceAdapter(adapter);
}

export function createReferenceLicensingAdapter({productId='soft',offerId='team'}={}){
  const licenseId='license-reference-team';
  const license={
    id:licenseId,
    productId,
    offerId,
    status:'active',
    maskedKey:'DEMO-KEY-••••',
    capacity:{sites:5,seats:5,label:'5 production sites / 5 team seats'},
    usage:{sites:2,seats:2,activations:2},
    purchasedAt:'2026-09-08T00:00:00.000Z',
    updatesThrough:'2027-09-08T00:00:00.000Z',
    autoRenewal:false,
    metadata:{provider:'reference'}
  };
  const entitlements=[
    {id:'entitlement-source',productId,licenseId,status:'active',kind:'source-files',downloadAllowed:true,updatesAllowed:true,expiresAt:null},
    {id:'entitlement-updates',productId,licenseId,status:'active',kind:'updates',downloadAllowed:true,updatesAllowed:true,expiresAt:'2027-09-08T00:00:00.000Z'}
  ];
  const activations=[
    {id:'activation-app',licenseId,scope:'app.example.com',status:'active',activatedAt:'2026-08-12T00:00:00.000Z',lastSeenAt:'2026-09-08T00:00:00.000Z'},
    {id:'activation-admin',licenseId,scope:'admin.example.com',status:'active',activatedAt:'2026-08-21T00:00:00.000Z',lastSeenAt:'2026-09-07T00:00:00.000Z'}
  ];
  let seats=[
    {id:'seat-owner',licenseId,status:'assigned',assignee:{email:'owner@example.com',name:'Owner'},role:'owner',assignedAt:'2026-09-08T00:00:00.000Z'},
    {id:'seat-developer',licenseId,status:'assigned',assignee:{email:'developer@example.com',name:'Developer'},role:'member',assignedAt:'2026-09-08T00:00:00.000Z'}
  ];
  let seatCounter=1;

  const adapter={
    capabilities:{activations:true,seats:true,renewals:true,signedDownloads:true},

    async listLicenses(query={}){
      return paginate([license],query);
    },

    async getLicense(id){
      return id===licenseId?clone(license):null;
    },

    async listEntitlements(query={}){
      const filtered=query.licenseId?entitlements.filter(item=>item.licenseId===query.licenseId):entitlements;
      return paginate(filtered,query);
    },

    async listActivations(id){
      return {items:id===licenseId?clone(activations):[],nextCursor:null};
    },

    async listSeats(id){
      return {items:id===licenseId?clone(seats):[],nextCursor:null};
    },

    async assignSeat({licenseId:id,assignee,role='member'}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);
      if(!assignee?.email)throw new TypeError('Seat assignee email is required');
      const capacity=license.capacity.seats||0;
      if(seats.length>=capacity)throw new RangeError('No reference seats are available');
      seats=[...seats,{id:makeId('seat',seatCounter++),licenseId,status:'assigned',assignee:clone(assignee),role,assignedAt:nowIso()}];
      license.usage={...(license.usage||{}),seats:seats.length};
      return {items:clone(seats),nextCursor:null};
    },

    async removeSeat({licenseId:id,seatId}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);
      seats=seats.filter(seat=>seat.id!==seatId||seat.role==='owner');
      license.usage={...(license.usage||{}),seats:seats.length};
      return {items:clone(seats),nextCursor:null};
    },

    async renewUpdates({licenseId:id}){
      if(id!==licenseId)throw new RangeError(`Unknown reference license: ${id}`);
      const current=new Date(license.updatesThrough||nowIso());
      current.setUTCFullYear(current.getUTCFullYear()+1);
      license.updatesThrough=current.toISOString();
      license.status='active';
      return clone(license);
    },

    async createSignedDownload({entitlementId,releaseId='latest'}){
      const entitlement=entitlements.find(item=>item.id===entitlementId);
      if(!entitlement||!entitlement.downloadAllowed)throw new RangeError(`Entitlement cannot download: ${entitlementId}`);
      return {url:`/reference/downloads/${encodeURIComponent(releaseId)}?entitlement=${encodeURIComponent(entitlementId)}`,expiresAt:new Date(Date.now()+5*60*1000).toISOString(),releaseId};
    }
  };

  return createLicensingAdapter(adapter);
}

export function createReferenceRuntime(options={}){
  const commerce=createReferenceCommerceAdapter(options.commerce);
  const licensing=createReferenceLicensingAdapter(options.licensing);
  return Object.freeze({version:'0.5.0-dev',commerce,licensing});
}

export {DEFAULT_PRODUCT as REFERENCE_PRODUCT};
