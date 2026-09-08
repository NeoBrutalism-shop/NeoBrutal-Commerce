import test from 'node:test';
import assert from 'node:assert/strict';
import {createReferenceCommerceAdapter,createReferenceLicensingAdapter,createReferenceRuntime} from '../src/adapters/reference.js';

test('reference commerce adapter completes catalog → cart → quote → order → refund',async()=>{
  const commerce=createReferenceCommerceAdapter();
  const catalog=await commerce.listProducts();
  assert.equal(catalog.items.length,1);assert.equal(catalog.items[0].id,'soft');assert.deepEqual(catalog.items[0].offers.map(offer=>offer.id),['individual','team','agency']);
  const cart=await commerce.addCartLine({productId:'soft',offerId:'team'});
  assert.equal(cart.isEmpty,false);assert.equal(cart.lines.length,1);assert.equal(cart.lines[0].offerId,'team');assert.equal(cart.total.amount,99);assert.equal(cart.total.formatted,'$99.00');
  const quote=await commerce.quoteCheckout({cartId:cart.id,invoice:{requested:true}});assert.equal(quote.state,'ready');assert.equal(quote.canSubmit,true);assert.equal(quote.total.amount,99);
  const order=await commerce.submitOrder({cartId:cart.id,paymentMethodId:'reference-card',licenseTermsAccepted:true});assert.equal(order.status,'complete');assert.equal(order.lines[0].offerId,'team');assert.equal(order.total.amount,99);
  assert.equal((await commerce.getCart(cart.id)).isEmpty,true);
  const refunded=await commerce.requestRefund({orderId:order.id,reason:'reference-test'});assert.equal(refunded.status,'refunded');assert.equal(refunded.metadata.refundReason,'reference-test');
});

test('reference commerce adapter rejects invalid purchase operations',async()=>{
  const commerce=createReferenceCommerceAdapter();
  await assert.rejects(()=>commerce.addCartLine({productId:'missing',offerId:'team'}),/Unknown reference product/);
  await assert.rejects(()=>commerce.addCartLine({productId:'soft',offerId:'missing'}),/Unknown reference offer/);
  const empty=await commerce.getCart('empty-cart');
  await assert.rejects(()=>commerce.submitOrder({cartId:empty.id,paymentMethodId:'reference-card',licenseTermsAccepted:true}),/empty cart/);
  await assert.rejects(()=>commerce.submitOrder({cartId:empty.id,paymentMethodId:'reference-card',licenseTermsAccepted:false}),/License terms/);
});

test('reference licensing adapter keeps activation seat renewal and download behavior',async()=>{
  const licensing=createReferenceLicensingAdapter();const license=(await licensing.listLicenses()).items[0];
  assert.equal(license.status,'active');assert.equal(license.capacity.sites,5);assert.equal(license.capacity.seats,5);assert.equal((await licensing.listActivations(license.id)).items.length,2);
  const afterAssign=await licensing.assignSeat({licenseId:license.id,assignee:{email:'qa@example.invalid',name:'QA'},role:'member'});assert.equal(afterAssign.items.length,3);
  const assigned=afterAssign.items.find(seat=>seat.assignee?.email==='qa@example.invalid');assert.ok(assigned);
  assert.equal((await licensing.removeSeat({licenseId:license.id,seatId:assigned.id})).items.length,2);
  assert.equal((await licensing.renewUpdates({licenseId:license.id})).updatesThrough,'2028-09-08T00:00:00.000Z');
  const source=(await licensing.listEntitlements({licenseId:license.id})).items.find(item=>item.kind==='source-files');
  const signed=await licensing.createSignedDownload({entitlementId:source.id,releaseId:'v0.7.0'});assert.match(signed.url,/v0\.7\.0/);assert.equal(signed.releaseId,'v0.7.0');
});

test('reference runtime composes replaceable commerce and licensing adapters',async()=>{
  const runtime=createReferenceRuntime();assert.equal(runtime.version,'0.7.0');assert.equal(runtime.commerce.kind,'commerce');assert.equal(runtime.licensing.kind,'licensing');
  const product=await runtime.commerce.getProduct('soft');const license=await runtime.licensing.getLicense('license-reference-team');assert.equal(product.id,'soft');assert.equal(license.productId,product.id);
});
