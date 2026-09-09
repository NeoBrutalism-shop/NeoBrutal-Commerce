const freezeList=(values)=>Object.freeze([...values]);

export const CHECKOUT_STATES=freezeList(['ready','processing','failed','recovered']);
export const SYSTEM_STATES=freezeList(['empty','loading','error','offline','permission','unsupported']);
export const OWNERSHIP_STATES=freezeList(['active','grace','expired','cancelled','refunded']);
export const OWNERSHIP_OPERATION_STATES=freezeList(['ready','quoted','processing','complete','failed']);
export const SUBSCRIPTION_STATES=freezeList(['active','cancel_at_period_end','cancelled','past_due']);
export const MEDIA_STATES=freezeList(['preview','code','files']);
export const LICENSE_PLAN_IDS=freezeList(['individual','team','agency']);

export const COMMERCE_REQUIRED_METHODS=freezeList(['listProducts','getProduct','getCart','addCartLine','removeCartLine','quoteCheckout','submitOrder','getOrder','listCustomerOrders']);
export const LICENSING_REQUIRED_METHODS=freezeList(['listLicenses','getLicense','listEntitlements']);

const COMMERCE_CAPABILITY_METHODS=Object.freeze({invoiceHistory:freezeList(['listInvoices']),subscriptions:freezeList(['getSubscription','cancelSubscription','resumeSubscription'])});
const LICENSING_CAPABILITY_METHODS=Object.freeze({activations:freezeList(['listActivations']),seats:freezeList(['listSeats','assignSeat','removeSeat']),renewals:freezeList(['renewUpdates']),signedDownloads:freezeList(['createSignedDownload']),planChanges:freezeList(['quotePlanChange','changePlan']),transfers:freezeList(['listTransfers','createTransfer','cancelTransfer']),ownershipHistory:freezeList(['listOwnershipEvents'])});

function hasOwnMethod(value,key){return value!=null&&typeof value[key]==='function';}
function assertObject(value,label){if(value==null||typeof value!=='object'||Array.isArray(value))throw new TypeError(`${label} must be an object`);}
function assertMethods(value,methods,label){const missing=methods.filter(method=>!hasOwnMethod(value,method));if(missing.length)throw new TypeError(`${label} is missing required method${missing.length===1?'':'s'}: ${missing.join(', ')}`);}
function normalizeCapabilities(input,defaults={}){if(input==null)return Object.freeze({...defaults});assertObject(input,'Adapter capabilities');return Object.freeze({...defaults,...input});}
function makeStateGuard(values){const allowed=new Set(values);return (value)=>typeof value==='string'&&allowed.has(value);}

export const isCheckoutState=makeStateGuard(CHECKOUT_STATES);
export const isSystemState=makeStateGuard(SYSTEM_STATES);
export const isOwnershipState=makeStateGuard(OWNERSHIP_STATES);
export const isOwnershipOperationState=makeStateGuard(OWNERSHIP_OPERATION_STATES);
export const isSubscriptionState=makeStateGuard(SUBSCRIPTION_STATES);
export const isMediaState=makeStateGuard(MEDIA_STATES);
export const isLicensePlanId=makeStateGuard(LICENSE_PLAN_IDS);

export function assertKnownState(group,value){
  const groups={checkout:CHECKOUT_STATES,system:SYSTEM_STATES,ownership:OWNERSHIP_STATES,ownershipOperation:OWNERSHIP_OPERATION_STATES,subscription:SUBSCRIPTION_STATES,media:MEDIA_STATES};
  const values=groups[group];
  if(!values)throw new TypeError(`Unknown Commerce state group: ${group}`);
  if(!values.includes(value))throw new TypeError(`Unknown ${group} state: ${String(value)}. Expected one of: ${values.join(', ')}`);
  return value;
}

export function createCommerceAdapter(adapter){
  assertObject(adapter,'Commerce adapter');assertMethods(adapter,COMMERCE_REQUIRED_METHODS,'Commerce adapter');
  const capabilities=normalizeCapabilities(adapter.capabilities,{taxes:false,discounts:false,invoices:false,refunds:false,invoiceHistory:false,subscriptions:false});
  for(const [capability,methods] of Object.entries(COMMERCE_CAPABILITY_METHODS))if(capabilities[capability])assertMethods(adapter,methods,`Commerce adapter capability "${capability}"`);
  return Object.freeze({...adapter,kind:'commerce',capabilities});
}

export function createLicensingAdapter(adapter){
  assertObject(adapter,'Licensing adapter');assertMethods(adapter,LICENSING_REQUIRED_METHODS,'Licensing adapter');
  const capabilities=normalizeCapabilities(adapter.capabilities,{activations:false,seats:false,renewals:false,signedDownloads:false,planChanges:false,transfers:false,ownershipHistory:false});
  for(const [capability,methods] of Object.entries(LICENSING_CAPABILITY_METHODS))if(capabilities[capability])assertMethods(adapter,methods,`Licensing adapter capability "${capability}"`);
  return Object.freeze({...adapter,kind:'licensing',capabilities});
}

export function composeCommerceRuntime({commerce,licensing}){
  const commerceAdapter=createCommerceAdapter(commerce);const licensingAdapter=createLicensingAdapter(licensing);
  return Object.freeze({version:'1.0.0',commerce:commerceAdapter,licensing:licensingAdapter});
}
