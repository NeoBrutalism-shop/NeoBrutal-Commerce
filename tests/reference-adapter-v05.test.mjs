import test from 'node:test';
import assert from 'node:assert/strict';
import {createReferenceCommerceAdapter,createReferenceLicensingAdapter,createReferenceRuntime} from '../src/adapters/reference.js';

test('reference commerce adapter completes catalog → cart → quote → order → refund',async()=>{
  const commerce=createReferenceCommerceAdapter();
  const catalog=await commerce.listProducts();
  assert.equal(catalog.items.length,1);
  assert.equal(catalog.items[0].id,'soft');
  assert.deepEqual(catalog.items[0].offers.map(offer=>offer.id),['individual','team','agency']);

  const cart=await commerce.addCartLine({productId:'soft',offerId:'team'});
  assert.equal(cart.isEmpty,false);
  assert.equal(cart.lines.length,1);
  assert.equal(cart.lines[0].offerId,'team');
  assert.equal(cart.total.amount,99);
  assert.equal(cart.total.formatted,'$99.00');

  const quote=await commerce.quoteCheckout({cartId:cart.id,invoice:{requested:true}});
  assert.equal(quote.state,'ready');
  assert.equal(quote.canSubmit,true);
  assert.equal(quote.total.amount,99);

  const order=await commerce.submitOrder({cartId:cart.id,paymentMethodId:'reference-card',licenseTermsAccepted:true});
  assert.equal(order.status,'complete');
  assert.equal(order.lines[0].offerId,'team');
  assert.equal(order.total.amount,99);

  const cleared=await commerce.getCart(cart.id);
  assert.equal(cleared.isEmpty,true);

  const refunded=await commerce.requestRefund({orderId:order.id,reason:'reference-test'});
  assert.equal(refunded.status,'refunded');
  assert.equal(refunded.metadata.refundReason,'reference-test');
});

test('reference commerce adapter rejects invalid purchase operations',async()=>{
  const commerce=createReferenceCommerceAdapter();
  await assert.rejects(()=>commerce.addCartLine({productId:'missing',offerId:'team'}),/Unknown reference product/);
  await assert.rejects(()=>commerce.addCartLine({productId:'soft',offerId:'missing'}),/Unknown reference offer/);
  const empty=await commerce.getCart('empty-cart');
  await assert.rejects(()=>commerce.submitOrder({cartId:empty.id,paymentMethodId:'reference-card',licenseTermsAccepted:true}),/empty cart/);
  await assert.rejects(()=>commerce.submitOrder({cartId:empty.id,paymentMethodId:'reference-card',licenseTermsAccepted:false}),/License terms/);
});

test('reference licensing adapter exercises activations, seats, renewal and signed downloads',async()=>{
  const licensing=createReferenceLicensingAdapter();
  const licenses=await licensing.listLicenses();
  assert.equal(licenses.items.length,1);
  const license=licenses.items[0];
  assert.equal(license.status,'active');
  assert.equal(license.capacity.sites,5);
  assert.equal(license.capacity.seats,5);

  const activations=await licensing.listActivations(license.id);
  assert.equal(activations.items.length,2);

  const beforeSeats=await licensing.listSeats(license.id);
  assert.equal(beforeSeats.items.length,2);
  const afterAssign=await licensing.assignSeat({licenseId:license.id,assignee:{email:'qa@example.com',name:'QA'},role:'member'});
  assert.equal(afterAssign.items.length,3);
  const assigned=afterAssign.items.find(seat=>seat.assignee?.email==='qa@example.com');
  assert.ok(assigned);

  const afterRemove=await licensing.removeSeat({licenseId:license.id,seatId:assigned.id});
  assert.equal(afterRemove.items.length,2);
  assert.equal(afterRemove.items.some(seat=>seat.role==='owner'),true);

  const renewed=await licensing.renewUpdates({licenseId:license.id});
  assert.equal(renewed.updatesThrough,'2028-09-08T00:00:00.000Z');

  const entitlements=await licensing.listEntitlements({licenseId:license.id});
  const source=entitlements.items.find(item=>item.kind==='source-files');
  assert.ok(source);
  const signed=await licensing.createSignedDownload({entitlementId:source.id,releaseId:'v0.5.0'});
  assert.match(signed.url,/v0\.5\.0/);
  assert.equal(signed.releaseId,'v0.5.0');
});

test('reference runtime composes replaceable commerce and licensing adapters',async()=>{
  const runtime=createReferenceRuntime();
  assert.equal(runtime.version,'0.5.0-dev');
  assert.equal(runtime.commerce.kind,'commerce');
  assert.equal(runtime.licensing.kind,'licensing');
  const product=await runtime.commerce.getProduct('soft');
  const license=await runtime.licensing.getLicense('license-reference-team');
  assert.equal(product.id,'soft');
  assert.equal(license.productId,product.id);
});
