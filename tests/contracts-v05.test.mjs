import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CHECKOUT_STATES,
  SYSTEM_STATES,
  OWNERSHIP_STATES,
  MEDIA_STATES,
  LICENSE_PLAN_IDS,
  isCheckoutState,
  isSystemState,
  isOwnershipState,
  isMediaState,
  isLicensePlanId,
  assertKnownState,
  createCommerceAdapter,
  createLicensingAdapter,
  composeCommerceRuntime
} from '../src/contracts/runtime.js';

const root=process.cwd();

const commerceStub=()=>({
  async listProducts(){return {items:[]}},
  async getProduct(){return null},
  async getCart(){return {id:'demo',lines:[],subtotal:{amount:0,currency:'USD'},total:{amount:0,currency:'USD'},isEmpty:true}},
  async addCartLine(){return this.getCart()},
  async removeCartLine(){return this.getCart()},
  async quoteCheckout(){return {cartId:'demo',state:'ready',subtotal:{amount:0,currency:'USD'},total:{amount:0,currency:'USD'},canSubmit:true}},
  async submitOrder(){return {id:'order-demo',status:'complete',lines:[],total:{amount:0,currency:'USD'},createdAt:new Date(0).toISOString()}},
  async getOrder(){return null},
  async listCustomerOrders(){return {items:[]}}
});

const licensingStub=()=>({
  async listLicenses(){return {items:[]}},
  async getLicense(){return null},
  async listEntitlements(){return {items:[]}}
});

test('runtime state constants stay synchronized with storefront/states.json',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'storefront/states.json'),'utf8'));
  assert.deepEqual(manifest.checkout.map(state=>state.id),CHECKOUT_STATES);
  assert.deepEqual(manifest.system.map(state=>state.id),SYSTEM_STATES);
  assert.deepEqual(manifest.ownership.map(state=>state.id),OWNERSHIP_STATES);
  assert.deepEqual(manifest.media.map(state=>state.id),MEDIA_STATES);
});

test('license plan IDs stay synchronized with the production catalog',()=>{
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'storefront/catalog.json'),'utf8'));
  const soft=catalog.products.find(product=>product.id==='soft');
  assert.ok(soft,'Soft product must exist in production catalog');
  assert.deepEqual(soft.licenses.map(license=>license.id),LICENSE_PLAN_IDS);
});

test('state guards accept canonical values and reject invented values',()=>{
  assert.equal(isCheckoutState('failed'),true);
  assert.equal(isCheckoutState('declined'),false);
  assert.equal(isSystemState('loading'),true);
  assert.equal(isSystemState('busy'),false);
  assert.equal(isOwnershipState('grace'),true);
  assert.equal(isOwnershipState('paused'),false);
  assert.equal(isMediaState('code'),true);
  assert.equal(isMediaState('video'),false);
  assert.equal(isLicensePlanId('team'),true);
  assert.equal(isLicensePlanId('enterprise'),false);
  assert.equal(assertKnownState('checkout','recovered'),'recovered');
  assert.throws(()=>assertKnownState('checkout','declined'),/Unknown checkout state/);
  assert.throws(()=>assertKnownState('payments','ready'),/Unknown Commerce state group/);
});

test('commerce adapter validates its required transactional surface',()=>{
  assert.throws(()=>createCommerceAdapter({}),/listProducts/);
  const adapter=createCommerceAdapter({...commerceStub(),capabilities:{taxes:true,invoices:true}});
  assert.equal(adapter.kind,'commerce');
  assert.equal(adapter.capabilities.taxes,true);
  assert.equal(adapter.capabilities.invoices,true);
  assert.equal(adapter.capabilities.discounts,false);
  assert.equal(adapter.capabilities.refunds,false);
  assert.equal(Object.isFrozen(adapter),true);
  assert.equal(Object.isFrozen(adapter.capabilities),true);
});

test('licensing capabilities require the methods they advertise',()=>{
  assert.throws(()=>createLicensingAdapter({...licensingStub(),capabilities:{seats:true}}),/listSeats/);
  const adapter=createLicensingAdapter({
    ...licensingStub(),
    capabilities:{activations:true,seats:true,renewals:true,signedDownloads:true},
    async listActivations(){return {items:[]}},
    async listSeats(){return {items:[]}},
    async assignSeat(){return {items:[]}},
    async removeSeat(){return {items:[]}},
    async renewUpdates(){return null},
    async createSignedDownload(){return {url:'https://example.invalid/demo',expiresAt:new Date(0).toISOString()}}
  });
  assert.equal(adapter.kind,'licensing');
  assert.equal(adapter.capabilities.activations,true);
  assert.equal(adapter.capabilities.seats,true);
  assert.equal(adapter.capabilities.renewals,true);
  assert.equal(adapter.capabilities.signedDownloads,true);
});

test('composed runtime keeps commerce and licensing backends replaceable',()=>{
  const runtime=composeCommerceRuntime({commerce:commerceStub(),licensing:licensingStub()});
  assert.equal(runtime.version,'0.5.0-dev');
  assert.equal(runtime.commerce.kind,'commerce');
  assert.equal(runtime.licensing.kind,'licensing');
  assert.equal(Object.isFrozen(runtime),true);
});
