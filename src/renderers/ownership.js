import {assertKnownState} from '../contracts/runtime.js';
import {createNode,formatMoney} from './headless.js';

const stateBadge=(state,label=state)=>createNode('span',{class:'nbc-lifecycle-badge','data-state':state},String(label).replaceAll('_',' ').toUpperCase());

export function createPlanChangeSpec(quote,options={}){
  const state=assertKnownState('ownershipOperation',quote?.state);
  if(!quote?.licenseId||!quote?.fromOfferId||!quote?.toOfferId)throw new TypeError('Plan change renderer requires a normalized quote');
  const adjustment=quote.adjustment?.amount===0?'No price change':`${quote.adjustment.amount>0?'+':''}${formatMoney(quote.adjustment,options.locale)}`;
  return createNode('section',{class:'nbc-lifecycle','data-commerce-component':'plan-change','data-state':state},
    createNode('div',{class:'nbc-lifecycle-head'},createNode('div',{},createNode('small',{},options.kicker??'Plan change'),createNode('h3',{},options.heading??`${quote.fromOfferId} → ${quote.toOfferId}`)),stateBadge(state)),
    createNode('dl',{class:'nbc-lifecycle-facts'},
      createNode('div',{},createNode('dt',{},'Direction'),createNode('dd',{},quote.direction)),
      createNode('div',{},createNode('dt',{},'Effective'),createNode('dd',{},quote.effective.replaceAll('_',' '))),
      createNode('div',{},createNode('dt',{},'Adjustment'),createNode('dd',{},adjustment)),
      quote.nextTermAmount?createNode('div',{},createNode('dt',{},'Next term'),createNode('dd',{},formatMoney(quote.nextTermAmount,options.locale))):null
    ),
    (quote.messages||[]).map(message=>createNode('p',{class:'nbc-lifecycle-note'},message))
  );
}

export function createTransferListSpec(transfers,options={}){
  const items=Array.isArray(transfers)?transfers:[];
  return createNode('section',{class:'nbc-lifecycle','data-commerce-component':'ownership-transfer'},
    createNode('div',{class:'nbc-lifecycle-head'},createNode('div',{},createNode('small',{},options.kicker??'Ownership transfer'),createNode('h3',{},options.heading??'Gift & transfer invitations')),createNode('span',{class:'nbc-lifecycle-badge'},`${items.length} ${items.length===1?'record':'records'}`)),
    createNode('div',{class:'nbc-transfer-list'},items.length?items.map(item=>createNode('article',{class:'nbc-transfer-row','data-transfer-id':item.id,'data-state':item.status},
      createNode('div',{},createNode('strong',{},`${item.kind==='gift'?'Gift':'Transfer'} · ${item.recipient.email}`),createNode('small',{},item.expiresAt?`Expires ${item.expiresAt}`:'No expiry supplied')),stateBadge(item.status)
    )):createNode('p',{class:'nbc-lifecycle-note'},options.emptyMessage??'No active transfer or gift invitations.'))
  );
}

export function createSubscriptionSpec(subscription,options={}){
  const state=assertKnownState('subscription',subscription?.status);
  if(!subscription?.id)throw new TypeError('Subscription renderer requires a subscription');
  return createNode('section',{class:'nbc-lifecycle','data-commerce-component':'subscription-management','data-subscription-id':subscription.id,'data-state':state},
    createNode('div',{class:'nbc-lifecycle-head'},createNode('div',{},createNode('small',{},options.kicker??'Billing lifecycle'),createNode('h3',{},options.heading??'Update subscription')),stateBadge(state)),
    createNode('dl',{class:'nbc-lifecycle-facts'},
      createNode('div',{},createNode('dt',{},'Amount'),createNode('dd',{},`${formatMoney(subscription.amount,options.locale)} / ${subscription.interval}`)),
      createNode('div',{},createNode('dt',{},subscription.cancelAtPeriodEnd?'Access through':'Renews'),createNode('dd',{},subscription.renewsAt??'Provider-managed')),
      subscription.paymentMethodLabel?createNode('div',{},createNode('dt',{},'Payment'),createNode('dd',{},subscription.paymentMethodLabel)):null
    ),
    createNode('p',{class:'nbc-lifecycle-note'},subscription.cancelAtPeriodEnd?'Cancellation is scheduled for the end of the paid term. Existing licensed versions remain governed by the license terms.':'Cancellation should never imply immediate loss of already-paid access unless the provider explicitly returns that policy.')
  );
}

export function createInvoiceHistorySpec(invoices,options={}){
  const items=Array.isArray(invoices)?invoices:[];
  return createNode('section',{class:'nbc-lifecycle','data-commerce-component':'invoice-history'},
    createNode('div',{class:'nbc-lifecycle-head'},createNode('div',{},createNode('small',{},options.kicker??'Billing records'),createNode('h3',{},options.heading??'Invoices & receipts')),createNode('span',{class:'nbc-lifecycle-badge'},`${items.length} ${items.length===1?'record':'records'}`)),
    createNode('table',{class:'nbc-table'},
      createNode('thead',{},createNode('tr',{},createNode('th',{},'Invoice'),createNode('th',{},'Issued'),createNode('th',{},'Status'),createNode('th',{},'Total'))),
      createNode('tbody',{},items.map(item=>createNode('tr',{},
        createNode('td',{'data-label':'Invoice'},item.number),createNode('td',{'data-label':'Issued'},item.issuedAt),createNode('td',{'data-label':'Status'},item.status),createNode('td',{'data-label':'Total'},formatMoney(item.total,options.locale))
      )))
    )
  );
}

export function createOwnershipTimelineSpec(events,options={}){
  const items=Array.isArray(events)?events:[];
  return createNode('section',{class:'nbc-lifecycle','data-commerce-component':'ownership-timeline'},
    createNode('div',{class:'nbc-lifecycle-head'},createNode('div',{},createNode('small',{},options.kicker??'Audit trail'),createNode('h3',{},options.heading??'Ownership timeline')),createNode('span',{class:'nbc-lifecycle-badge'},`${items.length} events`)),
    createNode('ol',{class:'nbc-timeline'},items.map(item=>createNode('li',{'data-event-id':item.id},createNode('strong',{},item.summary),createNode('small',{},[item.occurredAt,item.actor].filter(Boolean).join(' · ')))))
  );
}
