import test from 'node:test';
import assert from 'node:assert/strict';
import {createReferenceRuntime} from '../src/adapters/reference.js';
import {createLicensingBridgeAdapter} from '../src/adapters/licensing-bridge.js';
import {createActionDispatcher,createCommerceAction} from '../src/actions/runtime.js';
import {OWNERSHIP_OPERATION_STATES,SUBSCRIPTION_STATES} from '../src/contracts/runtime.js';

test('v0.6 runtime exposes canonical operation and subscription states',()=>{
  assert.deepEqual(OWNERSHIP_OPERATION_STATES,['ready','quoted','processing','complete','failed']);
  assert.deepEqual(SUBSCRIPTION_STATES,['active','cancel_at_period_end','cancelled','past_due']);
  assert.equal(createReferenceRuntime().version,'0.7.0-dev');
});

test('plan changes quote upgrades and protect unsafe immediate downgrades',async()=>{
  const runtime=createReferenceRuntime();
  const quote=await runtime.licensing.quotePlanChange({licenseId:'license-reference-team',toOfferId:'agency'});
  assert.equal(quote.state,'quoted');
  assert.equal(quote.direction,'upgrade');
  assert.equal(quote.adjustment.amount,80);
  const upgraded=await runtime.licensing.changePlan({licenseId:quote.licenseId,toOfferId:quote.toOfferId,quoteId:quote.id});
  assert.equal(upgraded.offerId,'agency');
  assert.equal(upgraded.capacity.sites,25);

  const downgrade=await runtime.licensing.quotePlanChange({licenseId:quote.licenseId,toOfferId:'individual',effective:'immediate'});
  assert.equal(downgrade.direction,'downgrade');
  assert.match(downgrade.messages[0],/exceeds the target plan/i);
  await assert.rejects(()=>runtime.licensing.changePlan({licenseId:quote.licenseId,toOfferId:'individual',effective:'immediate'}),/exceeds the target plan capacity/);
  const scheduled=await runtime.licensing.changePlan({licenseId:quote.licenseId,toOfferId:'individual',effective:'next_term'});
  assert.equal(scheduled.offerId,'agency');
  assert.equal(scheduled.metadata.scheduledOfferId,'individual');
});

test('ownership actions cover plan change transfer history subscription and invoices',async()=>{
  const runtime=createReferenceRuntime();
  const events=[];
  const actions=createActionDispatcher(runtime,{onEvent:event=>events.push(event)});

  const quote=await actions.dispatch(createCommerceAction('license.change.quote',{licenseId:'license-reference-team',toOfferId:'agency'}));
  assert.equal(quote.toOfferId,'agency');
  const changed=await actions.dispatch(createCommerceAction('license.change.submit',{licenseId:'license-reference-team',toOfferId:'agency',quoteId:quote.id}));
  assert.equal(changed.offerId,'agency');

  const transfer=await actions.dispatch(createCommerceAction('license.transfer.create',{licenseId:'license-reference-team',kind:'gift',recipient:{email:'recipient@example.invalid'}}));
  assert.equal(transfer.status,'pending');
  const transferList=await actions.dispatch(createCommerceAction('license.transfers.list',{licenseId:'license-reference-team'}));
  assert.equal(transferList.items.length,1);
  const cancelled=await actions.dispatch(createCommerceAction('license.transfer.cancel',{transferId:transfer.id}));
  assert.equal(cancelled.status,'cancelled');

  const subscription=await actions.dispatch(createCommerceAction('subscription.get',{subscriptionId:'subscription-reference-team'}));
  assert.equal(subscription.status,'active');
  const cancelSubscription=await actions.dispatch(createCommerceAction('subscription.cancel',{subscriptionId:subscription.id,reason:'owner-choice'}));
  assert.equal(cancelSubscription.status,'cancel_at_period_end');
  assert.equal(cancelSubscription.cancelAtPeriodEnd,true);
  const resumed=await actions.dispatch(createCommerceAction('subscription.resume',{subscriptionId:subscription.id}));
  assert.equal(resumed.status,'active');
  assert.equal(resumed.cancelAtPeriodEnd,false);

  const cart=await runtime.commerce.addCartLine({productId:'soft',offerId:'team'});
  const order=await runtime.commerce.submitOrder({cartId:cart.id,paymentMethodId:'reference-card',licenseTermsAccepted:true});
  const invoiceList=await actions.dispatch(createCommerceAction('invoice.list',{orderId:order.id}));
  assert.equal(invoiceList.items.length,1);
  assert.equal(invoiceList.items[0].status,'paid');
  await runtime.commerce.requestRefund({orderId:order.id,reason:'test'});
  const refundedInvoices=await actions.dispatch(createCommerceAction('invoice.list',{orderId:order.id}));
  assert.equal(refundedInvoices.items[0].status,'refunded');

  const history=await actions.dispatch(createCommerceAction('license.history.list',{licenseId:'license-reference-team'}));
  assert.ok(history.items.some(item=>item.type==='license.plan_changed'));
  assert.ok(history.items.some(item=>item.type==='license.gift_created'));
  assert.ok(events.every(event=>['start','success'].includes(event.phase)));
});

test('licensing bridge normalizes provider objects and capability methods',async()=>{
  const rawLicense={provider_id:'raw-1',plan:'team'};
  const bridge=createLicensingBridgeAdapter({
    bridge:{
      async listLicenses(){return {items:[rawLicense]}},
      async getLicense(){return rawLicense},
      async listEntitlements(){return {items:[{provider_id:'ent-1'}]}},
      async quotePlanChange(){return {provider_quote:'q1'}},
      async changePlan(){return {...rawLicense,plan:'agency'}},
      async listOwnershipEvents(){return {items:[{provider_event:'e1'}]}}
    },
    capabilities:{planChanges:true,ownershipHistory:true},
    normalize:{
      license:value=>({id:value.provider_id,productId:'soft',offerId:value.plan,status:'active',capacity:{sites:value.plan==='agency'?25:5}}),
      entitlement:value=>({id:value.provider_id,productId:'soft',status:'active',kind:'source-files',downloadAllowed:true,updatesAllowed:true}),
      planChangeQuote:value=>({id:value.provider_quote,licenseId:'raw-1',fromOfferId:'team',toOfferId:'agency',direction:'upgrade',effective:'immediate',state:'quoted',adjustment:{amount:80,currency:'USD'}}),
      ownershipEvent:value=>({id:value.provider_event,licenseId:'raw-1',type:'license.plan_changed',occurredAt:'2026-09-08T00:00:00.000Z',summary:'Plan changed'})
    }
  });
  const licenses=await bridge.listLicenses();
  assert.equal(licenses.items[0].id,'raw-1');
  const quote=await bridge.quotePlanChange({licenseId:'raw-1',toOfferId:'agency'});
  assert.equal(quote.adjustment.amount,80);
  const history=await bridge.listOwnershipEvents({licenseId:'raw-1'});
  assert.equal(history.items[0].type,'license.plan_changed');
});
