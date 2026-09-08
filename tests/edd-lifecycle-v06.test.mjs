import test from 'node:test';
import assert from 'node:assert/strict';
import {createEddCommerceAdapter,normalizeEddInvoiceStatus,normalizeEddSubscriptionState} from '../src/adapters/edd.js';

function transport(){
  let subscription={subscription_id:'sub-1',license_id:'license-1',status:'active',interval:'year',recurring_amount:'99',currency:'USD',next_payment:'2027-09-08T00:00:00.000Z',payment_method_label:'Demo method'};
  return {
    async listProducts(){return {items:[]}},async getProduct(){return null},async getCart(){return {id:'cart',items:[],subtotal:0,total:0,currency:'USD'}},async addCartLine(){return this.getCart()},async removeCartLine(){return this.getCart()},async quoteCheckout(){return {cart_id:'cart',status:'ready',subtotal:0,total:0,currency:'USD'}},async submitOrder(){return {payment_id:'order-1',status:'complete',items:[],total:0,currency:'USD',created_at:'2026-09-08T00:00:00.000Z'}},async getOrder(){return null},async listCustomerOrders(){return {items:[]}},
    async listInvoices(){return {items:[{invoice_id:'inv-1',payment_id:'order-1',invoice_number:'NBC-INV-1',status:'paid',issued_at:'2026-09-08T00:00:00.000Z',total:'99',currency:'USD',taxes:[{id:'tax-1',name:'VAT',amount:'0'}],download_url:'/invoice/inv-1'}]}},
    async getSubscription(id){return id==='sub-1'?structuredClone(subscription):null},
    async cancelSubscription(){subscription={...subscription,status:'pending-cancel',cancel_at_period_end:true};return structuredClone(subscription)},
    async resumeSubscription(){subscription={...subscription,status:'active',cancel_at_period_end:false};return structuredClone(subscription)}
  };
}

test('EDD bridge normalizes invoice history and recurring billing lifecycle',async()=>{
  const adapter=createEddCommerceAdapter({transport:transport(),capabilities:{invoiceHistory:true,subscriptions:true}});
  assert.equal(adapter.capabilities.invoiceHistory,true);assert.equal(adapter.capabilities.subscriptions,true);
  const invoices=await adapter.listInvoices({orderId:'order-1'});assert.equal(invoices.items.length,1);assert.equal(invoices.items[0].number,'NBC-INV-1');assert.equal(invoices.items[0].status,'paid');assert.equal(invoices.items[0].total.amount,99);
  const subscription=await adapter.getSubscription('sub-1');assert.equal(subscription.status,'active');assert.equal(subscription.amount.amount,99);
  const cancelled=await adapter.cancelSubscription({subscriptionId:'sub-1'});assert.equal(cancelled.status,'cancel_at_period_end');assert.equal(cancelled.cancelAtPeriodEnd,true);
  const resumed=await adapter.resumeSubscription({subscriptionId:'sub-1'});assert.equal(resumed.status,'active');assert.equal(resumed.cancelAtPeriodEnd,false);
});

test('EDD billing state maps are explicit and reject unknown states',()=>{
  assert.equal(normalizeEddInvoiceStatus('voided'),'void');
  assert.equal(normalizeEddInvoiceStatus('refund'),'refunded');
  assert.equal(normalizeEddSubscriptionState('pending-cancel'),'cancel_at_period_end');
  assert.equal(normalizeEddSubscriptionState('overdue'),'past_due');
  assert.throws(()=>normalizeEddInvoiceStatus('mystery'),/Unsupported EDD invoice status/);
  assert.throws(()=>normalizeEddSubscriptionState('mystery'),/Unsupported EDD subscription state/);
});

test('EDD lifecycle capabilities require matching transport methods',()=>{
  const base=transport();delete base.listInvoices;
  assert.throws(()=>createEddCommerceAdapter({transport:base,capabilities:{invoiceHistory:true}}),/requires transport\.listInvoices/);
  const missing=transport();delete missing.resumeSubscription;
  assert.throws(()=>createEddCommerceAdapter({transport:missing,capabilities:{subscriptions:true}}),/requires transport\.resumeSubscription/);
});
