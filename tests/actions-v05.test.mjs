import test from 'node:test';
import assert from 'node:assert/strict';
import {createReferenceRuntime} from '../src/adapters/reference.js';
import {ACTION_TYPES,createActionDispatcher,createCommerceAction,executeCommerceAction,isCommerceActionType} from '../src/actions/runtime.js';

test('action types are canonical and unknown commands are rejected',()=>{
  assert.ok(ACTION_TYPES.includes('cart.add'));
  assert.ok(ACTION_TYPES.includes('seat.assign'));
  assert.equal(isCommerceActionType('license.renew'),true);
  assert.equal(isCommerceActionType('cart.magic'),false);
  assert.throws(()=>createCommerceAction('cart.magic',{}),/Unknown Commerce action/);
});

test('commerce purchase commands execute through the normalized runtime',async()=>{
  const runtime=createReferenceRuntime();
  const cart=await executeCommerceAction(runtime,createCommerceAction('cart.add',{productId:'soft',offerId:'team'}));
  assert.equal(cart.total.amount,99);
  const quote=await executeCommerceAction(runtime,{type:'checkout.quote',payload:{cartId:cart.id}});
  assert.equal(quote.canSubmit,true);
  assert.equal(quote.total.amount,99);
  const order=await executeCommerceAction(runtime,{type:'checkout.submit',payload:{cartId:cart.id,paymentMethodId:'demo-card',licenseTermsAccepted:true}});
  assert.equal(order.status,'complete');
  assert.equal(order.total.amount,99);
  const refund=await executeCommerceAction(runtime,{type:'order.refund',payload:{orderId:order.id,reason:'test'}});
  assert.equal(refund.status,'refunded');
});

test('licensing commands cover query, seat, renewal and download capabilities',async()=>{
  const runtime=createReferenceRuntime();
  const activations=await executeCommerceAction(runtime,{type:'license.activations.list',payload:{licenseId:'license-reference-team'}});
  assert.equal(activations.items.length,2);
  const before=await executeCommerceAction(runtime,{type:'license.seats.list',payload:{licenseId:'license-reference-team'}});
  assert.equal(before.items.length,2);
  const assigned=await executeCommerceAction(runtime,{type:'seat.assign',payload:{licenseId:'license-reference-team',assignee:{email:'qa@example.com'},role:'member'}});
  assert.equal(assigned.items.length,3);
  const removable=assigned.items.find(item=>item.assignee?.email==='qa@example.com');
  const after=await executeCommerceAction(runtime,{type:'seat.remove',payload:{licenseId:'license-reference-team',seatId:removable.id}});
  assert.equal(after.items.length,2);
  const renewed=await executeCommerceAction(runtime,{type:'license.renew',payload:{licenseId:'license-reference-team'}});
  assert.equal(renewed.status,'active');
  assert.match(renewed.updatesThrough,/2028-/);
  const download=await executeCommerceAction(runtime,{type:'download.create',payload:{entitlementId:'entitlement-source',releaseId:'v0.5'}});
  assert.equal(download.releaseId,'v0.5');
  assert.match(download.url,/reference\/downloads\/v0\.5/);
});

test('action dispatcher emits stable lifecycle events and preserves action identity',async()=>{
  const runtime=createReferenceRuntime();
  const events=[];
  const dispatcher=createActionDispatcher(runtime,{onEvent:event=>events.push(event)});
  const action=createCommerceAction('cart.add',{productId:'soft',offerId:'individual'},{source:'test'});
  const result=await dispatcher.dispatch(action);
  assert.equal(result.total.amount,49);
  assert.deepEqual(events.map(event=>event.phase),['start','success']);
  assert.ok(events[0].action.meta.id);
  assert.equal(events[0].action.meta.id,events[1].action.meta.id);
  assert.equal(events[0].action.meta.source,'test');
});

test('action dispatcher emits error before rethrowing unsupported capability failures',async()=>{
  const runtime=createReferenceRuntime();
  const limited={...runtime,commerce:{...runtime.commerce,capabilities:{...runtime.commerce.capabilities,refunds:false}}};
  const events=[];
  const dispatcher=createActionDispatcher(limited,{onEvent:event=>events.push(event)});
  await assert.rejects(()=>dispatcher.dispatch({type:'order.refund',payload:{orderId:'missing'}}),/Unsupported Commerce capability: refunds/);
  assert.deepEqual(events.map(event=>event.phase),['start','error']);
  assert.equal(events[1].error instanceof Error,true);
});
