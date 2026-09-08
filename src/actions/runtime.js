export const ACTION_TYPES=Object.freeze([
  'cart.add','cart.remove','checkout.quote','checkout.submit','order.refund','invoice.list',
  'subscription.get','subscription.cancel','subscription.resume',
  'license.activations.list','license.seats.list','seat.assign','seat.remove','license.renew','download.create',
  'license.change.quote','license.change.submit','license.transfers.list','license.transfer.create','license.transfer.cancel','license.history.list'
]);

const ACTION_SET=new Set(ACTION_TYPES);
let dispatcherCounter=1;

export function isCommerceActionType(value){return typeof value==='string'&&ACTION_SET.has(value);}

export function createCommerceAction(type,payload={},meta={}){
  if(!isCommerceActionType(type)) throw new RangeError(`Unknown Commerce action: ${type}`);
  if(!payload||typeof payload!=='object'||Array.isArray(payload)) throw new TypeError('Commerce action payload must be an object');
  if(!meta||typeof meta!=='object'||Array.isArray(meta)) throw new TypeError('Commerce action meta must be an object');
  return Object.freeze({type,payload:Object.freeze({...payload}),meta:Object.freeze({...meta})});
}

function normalizeAction(action){
  if(!action||typeof action!=='object') throw new TypeError('Commerce action must be an object');
  return createCommerceAction(action.type,action.payload||{},action.meta||{});
}

function requireMethod(adapter,method,capability){
  if(capability&&adapter.capabilities?.[capability]!==true) throw new Error(`Unsupported Commerce capability: ${capability}`);
  const fn=adapter?.[method];
  if(typeof fn!=='function') throw new Error(`Unsupported Commerce action method: ${method}`);
  return fn.bind(adapter);
}

export async function executeCommerceAction(runtime,action){
  if(!runtime?.commerce||!runtime?.licensing) throw new TypeError('Commerce action execution requires a composed runtime');
  const command=normalizeAction(action);
  const p=command.payload;
  switch(command.type){
    case 'cart.add': return runtime.commerce.addCartLine(p);
    case 'cart.remove': return runtime.commerce.removeCartLine(p);
    case 'checkout.quote': return runtime.commerce.quoteCheckout(p);
    case 'checkout.submit': return runtime.commerce.submitOrder(p);
    case 'order.refund': return requireMethod(runtime.commerce,'requestRefund','refunds')(p);
    case 'invoice.list': return requireMethod(runtime.commerce,'listInvoices','invoiceHistory')(p);
    case 'subscription.get': return requireMethod(runtime.commerce,'getSubscription','subscriptions')(p.subscriptionId);
    case 'subscription.cancel': return requireMethod(runtime.commerce,'cancelSubscription','subscriptions')(p);
    case 'subscription.resume': return requireMethod(runtime.commerce,'resumeSubscription','subscriptions')(p);
    case 'license.activations.list': return requireMethod(runtime.licensing,'listActivations','activations')(p.licenseId);
    case 'license.seats.list': return requireMethod(runtime.licensing,'listSeats','seats')(p.licenseId);
    case 'seat.assign': return requireMethod(runtime.licensing,'assignSeat','seats')(p);
    case 'seat.remove': return requireMethod(runtime.licensing,'removeSeat','seats')(p);
    case 'license.renew': return requireMethod(runtime.licensing,'renewUpdates','renewals')(p);
    case 'download.create': return requireMethod(runtime.licensing,'createSignedDownload','signedDownloads')(p);
    case 'license.change.quote': return requireMethod(runtime.licensing,'quotePlanChange','planChanges')(p);
    case 'license.change.submit': return requireMethod(runtime.licensing,'changePlan','planChanges')(p);
    case 'license.transfers.list': return requireMethod(runtime.licensing,'listTransfers','transfers')(p);
    case 'license.transfer.create': return requireMethod(runtime.licensing,'createTransfer','transfers')(p);
    case 'license.transfer.cancel': return requireMethod(runtime.licensing,'cancelTransfer','transfers')(p);
    case 'license.history.list': return requireMethod(runtime.licensing,'listOwnershipEvents','ownershipHistory')(p);
    default: throw new RangeError(`Unknown Commerce action: ${command.type}`);
  }
}

function actionEvent(phase,action,extra={}){return Object.freeze({phase,action,...extra});}

export function createActionDispatcher(runtime,{onEvent}={}){
  if(typeof onEvent!=='undefined'&&typeof onEvent!=='function') throw new TypeError('onEvent must be a function');
  const emit=event=>{if(onEvent)onEvent(event);};
  return Object.freeze({
    async dispatch(input){
      const base=normalizeAction(input);
      const action=base.meta.id?base:createCommerceAction(base.type,base.payload,{...base.meta,id:`action-${dispatcherCounter++}`});
      emit(actionEvent('start',action));
      try{
        const result=await executeCommerceAction(runtime,action);
        emit(actionEvent('success',action,{result}));
        return result;
      }catch(error){
        emit(actionEvent('error',action,{error}));
        throw error;
      }
    }
  });
}
