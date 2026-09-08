import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {CHECKOUT_STATES,SYSTEM_STATES,OWNERSHIP_STATES,OWNERSHIP_OPERATION_STATES,SUBSCRIPTION_STATES,MEDIA_STATES,LICENSE_PLAN_IDS,isCheckoutState,isSystemState,isOwnershipState,isOwnershipOperationState,isSubscriptionState,isMediaState,isLicensePlanId,assertKnownState,createCommerceAdapter,createLicensingAdapter,composeCommerceRuntime} from '../src/contracts/runtime.js';

const root=process.cwd();
const commerceStub=()=>({async listProducts(){return {items:[]}},async getProduct(){return null},async getCart(){return {id:'demo',lines:[],subtotal:{amount:0,currency:'USD'},total:{amount:0,currency:'USD'},isEmpty:true}},async addCartLine(){return this.getCart()},async removeCartLine(){return this.getCart()},async quoteCheckout(){return {cartId:'demo',state:'ready',subtotal:{amount:0,currency:'USD'},total:{amount:0,currency:'USD'},canSubmit:true}},async submitOrder(){return {id:'order-demo',status:'complete',lines:[],total:{amount:0,currency:'USD'},createdAt:new Date(0).toISOString()}},async getOrder(){return null},async listCustomerOrders(){return {items:[]}}});
const licensingStub=()=>({async listLicenses(){return {items:[]}},async getLicense(){return null},async listEntitlements(){return {items:[]}}});

test('runtime state constants stay synchronized with storefront/states.json',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/states.json'),'utf8'));
  assert.deepEqual(manifest.checkout.map(state=>state.id),CHECKOUT_STATES);
  assert.deepEqual(manifest.system.map(state=>state.id),SYSTEM_STATES);
  assert.deepEqual(manifest.ownership.map(state=>state.id),OWNERSHIP_STATES);
  assert.deepEqual(manifest.ownershipOperation.map(state=>state.id),OWNERSHIP_OPERATION_STATES);
  assert.deepEqual(manifest.subscription.map(state=>state.id),SUBSCRIPTION_STATES);
  assert.deepEqual(manifest.media.map(state=>state.id),MEDIA_STATES);
});

test('license plan IDs stay synchronized with production catalog',()=>{
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'storefront/catalog.json'),'utf8'));
  const soft=catalog.products.find(product=>product.id==='soft');
  assert.deepEqual(soft.licenses.map(license=>license.id),LICENSE_PLAN_IDS);
});

test('state guards reject invented values across legacy and lifecycle groups',()=>{
  assert.equal(isCheckoutState('failed'),true);assert.equal(isCheckoutState('declined'),false);
  assert.equal(isSystemState('loading'),true);assert.equal(isSystemState('busy'),false);
  assert.equal(isOwnershipState('grace'),true);assert.equal(isOwnershipState('paused'),false);
  assert.equal(isOwnershipOperationState('quoted'),true);assert.equal(isOwnershipOperationState('approved'),false);
  assert.equal(isSubscriptionState('cancel_at_period_end'),true);assert.equal(isSubscriptionState('paused'),false);
  assert.equal(isMediaState('code'),true);assert.equal(isMediaState('video'),false);
  assert.equal(isLicensePlanId('team'),true);assert.equal(isLicensePlanId('enterprise'),false);
  assert.equal(assertKnownState('ownershipOperation','complete'),'complete');
  assert.throws(()=>assertKnownState('subscription','paused'),/Unknown subscription state/);
});

test('commerce adapter validates required and capability surfaces',()=>{
  assert.throws(()=>createCommerceAdapter({}),/listProducts/);
  assert.throws(()=>createCommerceAdapter({...commerceStub(),capabilities:{subscriptions:true}}),/getSubscription/);
  const adapter=createCommerceAdapter({...commerceStub(),capabilities:{taxes:true,invoices:true}});
  assert.equal(adapter.kind,'commerce');assert.equal(adapter.capabilities.taxes,true);assert.equal(adapter.capabilities.invoiceHistory,false);assert.equal(adapter.capabilities.subscriptions,false);assert.equal(Object.isFrozen(adapter),true);
});

test('licensing capabilities require methods they advertise',()=>{
  assert.throws(()=>createLicensingAdapter({...licensingStub(),capabilities:{seats:true}}),/listSeats/);
  assert.throws(()=>createLicensingAdapter({...licensingStub(),capabilities:{planChanges:true}}),/quotePlanChange/);
  const adapter=createLicensingAdapter({...licensingStub(),capabilities:{ownershipHistory:true},async listOwnershipEvents(){return {items:[]}}});
  assert.equal(adapter.capabilities.ownershipHistory,true);
});

test('composed runtime keeps transaction and licensing backends replaceable',()=>{
  const runtime=composeCommerceRuntime({commerce:commerceStub(),licensing:licensingStub()});
  assert.equal(runtime.version,'0.7.0');assert.equal(runtime.commerce.kind,'commerce');assert.equal(runtime.licensing.kind,'licensing');assert.equal(Object.isFrozen(runtime),true);
});
