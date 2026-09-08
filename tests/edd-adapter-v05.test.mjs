import test from 'node:test';
import assert from 'node:assert/strict';
import {createEddCommerceAdapter,normalizeEddCheckoutState,normalizeEddOrderStatus} from '../src/adapters/edd.js';

function makeTransport(){
  let cart={id:'cart-edd',items:[],subtotal:0,discounts:[],taxes:[],total:0,currency:'USD'};
  let order=null;
  const product={
    download_id:42,
    title:'NeoBrutal Soft',
    excerpt:'Refined Neo-Brutalism for product interfaces.',
    permalink:'/product/soft/',
    currency:'USD',
    price_options:[
      {price_id:'individual',name:'Individual',amount:49,capacity:{sites:1}},
      {price_id:'team',name:'Team',amount:99,capacity:{sites:5,seats:5}},
      {price_id:'agency',name:'Agency',amount:179,capacity:{sites:25}}
    ],
    entitlements:['source-files','12-month-updates']
  };
  const recalc=()=>{
    cart.subtotal=cart.items.reduce((sum,item)=>sum+Number(item.subtotal),0);
    cart.total=cart.subtotal;
    return structuredClone(cart);
  };
  return {
    async listProducts(){return {items:[product],next_cursor:null};},
    async getProduct(id){return String(id)==='42'?product:null;},
    async getCart(){return recalc();},
    async addCartLine({productId,offerId,quantity=1}){
      const amount=offerId==='team'?99:offerId==='agency'?179:49;
      cart.items=[{id:'line-1',download_id:productId,price_id:offerId,quantity,name:`NeoBrutal Soft · ${offerId}`,unit_price:amount,subtotal:amount*quantity}];
      return recalc();
    },
    async removeCartLine(){cart.items=[];return recalc();},
    async quoteCheckout(){return {cart_id:cart.id,status:'ready',subtotal:cart.subtotal,discounts:[],taxes:[],total:cart.total,can_submit:cart.items.length>0,currency:'USD'};},
    async submitOrder(){order={payment_id:9001,status:'complete',items:cart.items,total:cart.total,currency:'USD',created_at:'2026-09-08T00:00:00.000Z',receipt_url:'/receipt/9001'};return structuredClone(order);},
    async getOrder(id){return order&&String(id)==='9001'?structuredClone(order):null;},
    async listCustomerOrders(){return {items:order?[structuredClone(order)]:[],next_cursor:null};},
    async requestRefund(){order={...order,status:'refunded'};return structuredClone(order);}
  };
}

test('EDD adapter normalizes variable prices and a full transaction journey',async()=>{
  const adapter=createEddCommerceAdapter({transport:makeTransport(),capabilities:{discounts:true,invoices:true,refunds:true}});
  assert.equal(adapter.kind,'commerce');
  assert.equal(adapter.capabilities.refunds,true);

  const products=await adapter.listProducts();
  assert.equal(products.items.length,1);
  assert.deepEqual(products.items[0].offers.map(offer=>offer.id),['individual','team','agency']);
  assert.equal(products.items[0].offers[1].price.amount,99);
  assert.equal(products.items[0].offers[1].capacity.seats,5);

  const cart=await adapter.addCartLine({productId:'42',offerId:'team',quantity:1});
  assert.equal(cart.lines[0].productId,'42');
  assert.equal(cart.lines[0].offerId,'team');
  assert.equal(cart.total.amount,99);

  const quote=await adapter.quoteCheckout({cartId:cart.id});
  assert.equal(quote.state,'ready');
  assert.equal(quote.total.amount,99);
  assert.equal(quote.canSubmit,true);

  const order=await adapter.submitOrder({cartId:cart.id,paymentMethodId:'gateway-card',licenseTermsAccepted:true});
  assert.equal(order.id,'9001');
  assert.equal(order.status,'complete');
  assert.equal(order.total.amount,99);
  assert.equal(order.receiptUrl,'/receipt/9001');

  const refunded=await adapter.requestRefund({orderId:order.id,reason:'requested'});
  assert.equal(refunded.status,'refunded');
});

test('EDD state mapping is explicit and rejects unknown provider states',()=>{
  assert.equal(normalizeEddCheckoutState('declined'),'failed');
  assert.equal(normalizeEddCheckoutState('pending'),'processing');
  assert.equal(normalizeEddOrderStatus('completed'),'complete');
  assert.equal(normalizeEddOrderStatus('canceled'),'cancelled');
  assert.throws(()=>normalizeEddCheckoutState('mystery'),/Unsupported EDD checkout state/);
  assert.throws(()=>normalizeEddOrderStatus('mystery'),/Unsupported EDD order status/);
});

test('EDD capability declarations cannot claim refunds without a transport method',()=>{
  const transport=makeTransport();
  delete transport.requestRefund;
  assert.throws(()=>createEddCommerceAdapter({transport,capabilities:{refunds:true}}),/requires transport\.requestRefund/);
});
