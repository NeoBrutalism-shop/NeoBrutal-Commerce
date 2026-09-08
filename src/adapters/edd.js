import {createCommerceAdapter} from '../contracts/runtime.js';

const REQUIRED_TRANSPORT_METHODS=Object.freeze([
  'listProducts','getProduct','getCart','addCartLine','removeCartLine','quoteCheckout','submitOrder','getOrder','listCustomerOrders'
]);

function assertTransport(transport){
  if(!transport||typeof transport!=='object') throw new TypeError('EDD adapter requires a transport object');
  const missing=REQUIRED_TRANSPORT_METHODS.filter(method=>typeof transport[method]!=='function');
  if(missing.length) throw new TypeError(`EDD transport is missing required method${missing.length===1?'':'s'}: ${missing.join(', ')}`);
}

function firstDefined(...values){
  return values.find(value=>value!==undefined&&value!==null);
}

function asNumber(value,label){
  const amount=typeof value==='number'?value:Number(value);
  if(!Number.isFinite(amount)) throw new TypeError(`EDD ${label} must be numeric`);
  return amount;
}

export function normalizeEddMoney(value,{currency='USD'}={}){
  if(value&&typeof value==='object'&&!Array.isArray(value)){
    const amount=asNumber(firstDefined(value.amount,value.value,value.total,value.price), 'money amount');
    return Object.freeze({amount,currency:String(value.currency||currency),...(value.formatted?{formatted:String(value.formatted)}:{})});
  }
  return Object.freeze({amount:asNumber(value,'money amount'),currency:String(currency)});
}

function mapCapacity(value){
  if(!value||typeof value!=='object') return undefined;
  const output={};
  for(const key of ['sites','seats','activations','domains']){
    if(value[key]!==undefined&&value[key]!==null) output[key]=Number(value[key]);
  }
  if(value.label) output.label=String(value.label);
  return Object.keys(output).length?Object.freeze(output):undefined;
}

function normalizeOffer(raw,index,currency){
  const id=String(firstDefined(raw?.id,raw?.price_id,raw?.priceId,index));
  const label=String(firstDefined(raw?.label,raw?.name,raw?.title,`Option ${index+1}`));
  const priceValue=firstDefined(raw?.price,raw?.amount,raw?.value);
  return Object.freeze({
    id,
    label,
    price:normalizeEddMoney(priceValue,{currency:firstDefined(raw?.currency,currency)}),
    ...(mapCapacity(raw?.capacity)?{capacity:mapCapacity(raw.capacity)}:{}),
    ...(raw?.metadata?{metadata:Object.freeze({...raw.metadata})}:{})
  });
}

export function normalizeEddProduct(raw,{currency='USD'}={}){
  if(!raw||typeof raw!=='object') throw new TypeError('EDD product must be an object');
  const id=String(firstDefined(raw.id,raw.download_id,raw.downloadId));
  const name=String(firstDefined(raw.name,raw.title));
  const summary=String(firstDefined(raw.summary,raw.excerpt,raw.description,''));
  if(!id||!name) throw new TypeError('EDD product requires id and name');
  const sourceOffers=firstDefined(raw.offers,raw.price_options,raw.prices,raw.variable_prices);
  const offers=Array.isArray(sourceOffers)&&sourceOffers.length
    ?sourceOffers.map((offer,index)=>normalizeOffer(offer,index,firstDefined(raw.currency,currency)))
    :[normalizeOffer({id:'default',label:firstDefined(raw.price_label,'Standard'),price:firstDefined(raw.price,raw.amount,0),currency:raw.currency},0,currency)];
  return Object.freeze({
    id,
    name,
    kind:String(firstDefined(raw.kind,'digital-product')),
    summary,
    ...(firstDefined(raw.route,raw.permalink)?{route:String(firstDefined(raw.route,raw.permalink))}:{}),
    offers:Object.freeze(offers),
    entitlements:Object.freeze(Array.isArray(raw.entitlements)?raw.entitlements.map(String):[]),
    ...(Array.isArray(raw.media)?{media:Object.freeze(raw.media.map(String))}:{}),
    ...(raw.status?{status:String(raw.status)}:{}),
    metadata:Object.freeze({provider:'edd',...(raw.metadata||{})})
  });
}

function normalizeDiscount(raw,index,currency){
  return Object.freeze({id:String(firstDefined(raw?.id,raw?.code,index)),label:String(firstDefined(raw?.label,raw?.name,raw?.code,'Discount')),amount:normalizeEddMoney(firstDefined(raw?.amount,raw?.value,0),{currency:firstDefined(raw?.currency,currency)})});
}

function normalizeTax(raw,index,currency){
  return Object.freeze({id:String(firstDefined(raw?.id,index)),label:String(firstDefined(raw?.label,raw?.name,'Tax')),amount:normalizeEddMoney(firstDefined(raw?.amount,raw?.value,0),{currency:firstDefined(raw?.currency,currency)}),...(raw?.rate!==undefined?{rate:Number(raw.rate)}:{})});
}

function normalizeCartLine(raw,index,currency){
  const quantity=Math.max(1,Math.trunc(Number(firstDefined(raw?.quantity,raw?.qty,1))||1));
  const unit=normalizeEddMoney(firstDefined(raw?.unit_price,raw?.unitPrice,raw?.price,0),{currency:firstDefined(raw?.currency,currency)});
  const subtotal=normalizeEddMoney(firstDefined(raw?.subtotal,raw?.line_total,raw?.total,unit.amount*quantity),{currency:unit.currency});
  return Object.freeze({
    id:String(firstDefined(raw?.id,raw?.cart_item_id,raw?.cartItemId,index)),
    productId:String(firstDefined(raw?.product_id,raw?.download_id,raw?.productId)),
    offerId:String(firstDefined(raw?.offer_id,raw?.price_id,raw?.offerId,'default')),
    quantity,
    label:String(firstDefined(raw?.label,raw?.name,raw?.title,'Digital product')),
    unitPrice:unit,
    subtotal,
    ...(mapCapacity(raw?.capacity)?{capacity:mapCapacity(raw.capacity)}:{}),
    ...(raw?.metadata?{metadata:Object.freeze({...raw.metadata})}:{})
  });
}

export function normalizeEddCart(raw,{currency='USD'}={}){
  if(!raw||typeof raw!=='object') throw new TypeError('EDD cart must be an object');
  const resolvedCurrency=String(firstDefined(raw.currency,currency));
  const sourceLines=firstDefined(raw.lines,raw.items,[]);
  const lines=(Array.isArray(sourceLines)?sourceLines:[]).map((line,index)=>normalizeCartLine(line,index,resolvedCurrency));
  const subtotal=normalizeEddMoney(firstDefined(raw.subtotal,lines.reduce((sum,line)=>sum+line.subtotal.amount,0)),{currency:resolvedCurrency});
  const discounts=(Array.isArray(raw.discounts)?raw.discounts:[]).map((item,index)=>normalizeDiscount(item,index,resolvedCurrency));
  const taxes=(Array.isArray(raw.taxes)?raw.taxes:[]).map((item,index)=>normalizeTax(item,index,resolvedCurrency));
  const total=normalizeEddMoney(firstDefined(raw.total,subtotal.amount-discounts.reduce((sum,item)=>sum+item.amount.amount,0)+taxes.reduce((sum,item)=>sum+item.amount.amount,0)),{currency:resolvedCurrency});
  return Object.freeze({
    id:String(firstDefined(raw.id,raw.cart_id,raw.cartId,'edd-cart')),
    lines:Object.freeze(lines),
    subtotal,
    discounts:Object.freeze(discounts),
    taxes:Object.freeze(taxes),
    total,
    isEmpty:Boolean(firstDefined(raw.is_empty,raw.isEmpty,lines.length===0)),
    ...(firstDefined(raw.updated_at,raw.updatedAt)?{updatedAt:String(firstDefined(raw.updated_at,raw.updatedAt))}:{}),
    metadata:Object.freeze({provider:'edd',...(raw.metadata||{})})
  });
}

export function normalizeEddCheckoutState(value){
  const state=String(value||'ready').toLowerCase();
  if(['ready','idle','new'].includes(state)) return 'ready';
  if(['processing','pending','in-progress','in_progress'].includes(state)) return 'processing';
  if(['failed','declined','error'].includes(state)) return 'failed';
  if(['recovered','success','complete','completed'].includes(state)) return 'recovered';
  throw new RangeError(`Unsupported EDD checkout state: ${value}`);
}

export function normalizeEddQuote(raw,{currency='USD'}={}){
  if(!raw||typeof raw!=='object') throw new TypeError('EDD checkout quote must be an object');
  const resolvedCurrency=String(firstDefined(raw.currency,currency));
  return Object.freeze({
    cartId:String(firstDefined(raw.cart_id,raw.cartId,raw.id,'edd-cart')),
    state:normalizeEddCheckoutState(firstDefined(raw.state,raw.status,'ready')),
    subtotal:normalizeEddMoney(firstDefined(raw.subtotal,0),{currency:resolvedCurrency}),
    discounts:Object.freeze((Array.isArray(raw.discounts)?raw.discounts:[]).map((item,index)=>normalizeDiscount(item,index,resolvedCurrency))),
    taxes:Object.freeze((Array.isArray(raw.taxes)?raw.taxes:[]).map((item,index)=>normalizeTax(item,index,resolvedCurrency))),
    total:normalizeEddMoney(firstDefined(raw.total,0),{currency:resolvedCurrency}),
    canSubmit:Boolean(firstDefined(raw.can_submit,raw.canSubmit,true)),
    messages:Object.freeze(Array.isArray(raw.messages)?raw.messages.map(String):[]),
    metadata:Object.freeze({provider:'edd',...(raw.metadata||{})})
  });
}

export function normalizeEddOrderStatus(value){
  const state=String(value||'pending').toLowerCase();
  if(['pending','processing'].includes(state)) return 'pending';
  if(['complete','completed','success'].includes(state)) return 'complete';
  if(['failed','error'].includes(state)) return 'failed';
  if(['cancelled','canceled'].includes(state)) return 'cancelled';
  if(['refunded','refund'].includes(state)) return 'refunded';
  throw new RangeError(`Unsupported EDD order status: ${value}`);
}

export function normalizeEddOrder(raw,{currency='USD'}={}){
  if(!raw||typeof raw!=='object') throw new TypeError('EDD order must be an object');
  const resolvedCurrency=String(firstDefined(raw.currency,currency));
  const sourceLines=firstDefined(raw.lines,raw.items,[]);
  const lines=(Array.isArray(sourceLines)?sourceLines:[]).map((line,index)=>Object.freeze({
    id:String(firstDefined(line?.id,line?.order_item_id,index)),
    productId:String(firstDefined(line?.product_id,line?.download_id,line?.productId)),
    offerId:String(firstDefined(line?.offer_id,line?.price_id,line?.offerId,'default')),
    label:String(firstDefined(line?.label,line?.name,line?.title,'Digital product')),
    quantity:Math.max(1,Math.trunc(Number(firstDefined(line?.quantity,line?.qty,1))||1)),
    total:normalizeEddMoney(firstDefined(line?.total,line?.subtotal,line?.line_total,0),{currency:firstDefined(line?.currency,resolvedCurrency)})
  }));
  return Object.freeze({
    id:String(firstDefined(raw.id,raw.order_id,raw.payment_id)),
    status:normalizeEddOrderStatus(firstDefined(raw.status,raw.state)),
    lines:Object.freeze(lines),
    total:normalizeEddMoney(firstDefined(raw.total,0),{currency:resolvedCurrency}),
    ...(firstDefined(raw.customer_id,raw.customerId)?{customerId:String(firstDefined(raw.customer_id,raw.customerId))}:{}),
    createdAt:String(firstDefined(raw.created_at,raw.createdAt,new Date(0).toISOString())),
    ...(firstDefined(raw.receipt_url,raw.receiptUrl)?{receiptUrl:String(firstDefined(raw.receipt_url,raw.receiptUrl))}:{}),
    metadata:Object.freeze({provider:'edd',...(raw.metadata||{})})
  });
}

function normalizeList(raw,mapper){
  const items=Array.isArray(raw)?raw:Array.isArray(raw?.items)?raw.items:[];
  return Object.freeze({items:Object.freeze(items.map(mapper)),nextCursor:firstDefined(raw?.next_cursor,raw?.nextCursor,null)});
}

export function createEddCommerceAdapter({transport,currency='USD',capabilities={}}={}){
  assertTransport(transport);
  const caps=Object.freeze({taxes:false,discounts:false,invoices:false,refunds:false,...capabilities});
  if(caps.refunds&&typeof transport.requestRefund!=='function') throw new TypeError('EDD refunds capability requires transport.requestRefund');
  const adapter={
    capabilities:caps,
    async listProducts(input={}){return normalizeList(await transport.listProducts(input),item=>normalizeEddProduct(item,{currency}));},
    async getProduct(productId){const value=await transport.getProduct(productId);return value?normalizeEddProduct(value,{currency}):null;},
    async getCart(cartId){return normalizeEddCart(await transport.getCart(cartId),{currency});},
    async addCartLine(input){return normalizeEddCart(await transport.addCartLine(input),{currency});},
    async removeCartLine(input){return normalizeEddCart(await transport.removeCartLine(input),{currency});},
    async quoteCheckout(input){return normalizeEddQuote(await transport.quoteCheckout(input),{currency});},
    async submitOrder(input){return normalizeEddOrder(await transport.submitOrder(input),{currency});},
    async getOrder(orderId){const value=await transport.getOrder(orderId);return value?normalizeEddOrder(value,{currency}):null;},
    async listCustomerOrders(query={}){return normalizeList(await transport.listCustomerOrders(query),item=>normalizeEddOrder(item,{currency}));}
  };
  if(caps.refunds){
    adapter.requestRefund=async input=>normalizeEddOrder(await transport.requestRefund(input),{currency});
  }
  return createCommerceAdapter(adapter);
}

export {REQUIRED_TRANSPORT_METHODS as EDD_REQUIRED_TRANSPORT_METHODS};
