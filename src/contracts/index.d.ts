export type CheckoutState='ready'|'processing'|'failed'|'recovered';
export type SystemState='empty'|'loading'|'error'|'offline'|'permission'|'unsupported';
export type OwnershipState='active'|'grace'|'expired'|'cancelled'|'refunded';
export type MediaState='preview'|'code'|'files';
export type LicensePlanId='individual'|'team'|'agency';
export type OrderStatus='pending'|'complete'|'failed'|'cancelled'|'refunded';

export interface Money{
  amount:number;
  currency:string;
  formatted?:string;
}

export interface ListResult<T>{
  items:readonly T[];
  nextCursor?:string|null;
}

export interface LicenseCapacity{
  sites?:number;
  seats?:number;
  activations?:number;
  domains?:number;
  label?:string;
}

export interface ReviewSummary{
  rating:number;
  count:number;
  source?:string;
}

export interface GuaranteeContract{
  days?:number;
  label?:string;
  policySource:string;
}

export interface RenewalTerms{
  updateEligibilityMonths?:number;
  existingLicensedVersionsRemainOwned:boolean;
  autoRenewal?:boolean;
  interval?:string;
}

export interface ProductOffer{
  id:string;
  label:string;
  price:Money;
  capacity?:LicenseCapacity;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface ProductView{
  id:string;
  name:string;
  kind:string;
  summary:string;
  route?:string;
  offers:readonly ProductOffer[];
  entitlements:readonly string[];
  media?:readonly MediaState[];
  reviewSummary?:ReviewSummary;
  guarantee?:GuaranteeContract;
  renewal?:RenewalTerms;
  status?:string;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface CartLineView{
  id:string;
  productId:string;
  offerId:string;
  quantity:number;
  label:string;
  unitPrice:Money;
  subtotal:Money;
  capacity?:LicenseCapacity;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface DiscountLineView{
  id:string;
  label:string;
  amount:Money;
}

export interface TaxLineView{
  id:string;
  label:string;
  amount:Money;
  rate?:number;
}

export interface CartView{
  id:string;
  lines:readonly CartLineView[];
  subtotal:Money;
  discounts?:readonly DiscountLineView[];
  taxes?:readonly TaxLineView[];
  total:Money;
  isEmpty:boolean;
  updatedAt?:string;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface CheckoutContact{
  email:string;
  name?:string;
  company?:string;
}

export interface BillingAddress{
  line1?:string;
  line2?:string;
  city?:string;
  region?:string;
  postalCode?:string;
  country:string;
}

export interface InvoiceDetails{
  requested:boolean;
  legalName?:string;
  billingAddress?:BillingAddress;
  taxId?:string;
}

export interface CheckoutQuoteInput{
  cartId:string;
  contact?:CheckoutContact;
  billingAddress?:BillingAddress;
  invoice?:InvoiceDetails;
  paymentMethodId?:string;
  couponCodes?:readonly string[];
}

export interface CheckoutQuoteView{
  cartId:string;
  state:CheckoutState;
  subtotal:Money;
  discounts?:readonly DiscountLineView[];
  taxes?:readonly TaxLineView[];
  total:Money;
  canSubmit:boolean;
  messages?:readonly string[];
  metadata?:Readonly<Record<string,unknown>>;
}

export interface SubmitOrderInput extends CheckoutQuoteInput{
  paymentMethodId:string;
  licenseTermsAccepted:boolean;
}

export interface OrderLineView{
  id:string;
  productId:string;
  offerId:string;
  label:string;
  quantity:number;
  total:Money;
}

export interface OrderView{
  id:string;
  status:OrderStatus;
  lines:readonly OrderLineView[];
  total:Money;
  customerId?:string;
  createdAt:string;
  receiptUrl?:string;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface CustomerOrderQuery{
  customerId?:string;
  email?:string;
  cursor?:string;
  limit?:number;
}

export interface EntitlementView{
  id:string;
  productId:string;
  licenseId?:string;
  status:OwnershipState;
  kind:string;
  downloadAllowed:boolean;
  updatesAllowed:boolean;
  expiresAt?:string|null;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface ActivationView{
  id:string;
  licenseId:string;
  scope:string;
  status:string;
  activatedAt:string;
  lastSeenAt?:string|null;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface SeatAssignee{
  id?:string;
  email:string;
  name?:string;
}

export interface SeatAssignmentView{
  id:string;
  licenseId:string;
  status:'assigned'|'available';
  assignee?:SeatAssignee;
  role?:string;
  assignedAt?:string|null;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface LicenseUsage{
  sites?:number;
  seats?:number;
  activations?:number;
}

export interface LicenseView{
  id:string;
  productId:string;
  offerId:string;
  status:OwnershipState;
  maskedKey?:string;
  capacity:LicenseCapacity;
  usage?:LicenseUsage;
  purchasedAt?:string;
  updatesThrough?:string|null;
  autoRenewal?:boolean;
  metadata?:Readonly<Record<string,unknown>>;
}

export interface SignedDownloadView{
  url:string;
  expiresAt:string;
  releaseId?:string;
}

export interface CommerceAdapterCapabilities{
  taxes:boolean;
  discounts:boolean;
  invoices:boolean;
  refunds:boolean;
}

export interface LicensingAdapterCapabilities{
  activations:boolean;
  seats:boolean;
  renewals:boolean;
  signedDownloads:boolean;
}

export interface CommerceAdapter{
  capabilities?:Partial<CommerceAdapterCapabilities>;
  listProducts(input?:{cursor?:string;limit?:number}):Promise<ListResult<ProductView>>;
  getProduct(productId:string):Promise<ProductView|null>;
  getCart(cartId?:string):Promise<CartView>;
  addCartLine(input:{cartId?:string;productId:string;offerId:string;quantity?:number}):Promise<CartView>;
  removeCartLine(input:{cartId:string;lineId:string}):Promise<CartView>;
  quoteCheckout(input:CheckoutQuoteInput):Promise<CheckoutQuoteView>;
  submitOrder(input:SubmitOrderInput):Promise<OrderView>;
  getOrder(orderId:string):Promise<OrderView|null>;
  listCustomerOrders(query?:CustomerOrderQuery):Promise<ListResult<OrderView>>;
  requestRefund?(input:{orderId:string;reason?:string}):Promise<OrderView>;
}

export interface LicensingAdapter{
  capabilities?:Partial<LicensingAdapterCapabilities>;
  listLicenses(query?:{customerId?:string;email?:string;cursor?:string;limit?:number}):Promise<ListResult<LicenseView>>;
  getLicense(licenseId:string):Promise<LicenseView|null>;
  listEntitlements(query?:{customerId?:string;licenseId?:string;productId?:string;cursor?:string;limit?:number}):Promise<ListResult<EntitlementView>>;
  listActivations?(licenseId:string):Promise<ListResult<ActivationView>>;
  listSeats?(licenseId:string):Promise<ListResult<SeatAssignmentView>>;
  assignSeat?(input:{licenseId:string;assignee:SeatAssignee;role?:string}):Promise<ListResult<SeatAssignmentView>>;
  removeSeat?(input:{licenseId:string;seatId:string}):Promise<ListResult<SeatAssignmentView>>;
  renewUpdates?(input:{licenseId:string;offerId?:string}):Promise<LicenseView>;
  createSignedDownload?(input:{entitlementId:string;releaseId?:string}):Promise<SignedDownloadView>;
}

export declare const CHECKOUT_STATES:readonly CheckoutState[];
export declare const SYSTEM_STATES:readonly SystemState[];
export declare const OWNERSHIP_STATES:readonly OwnershipState[];
export declare const MEDIA_STATES:readonly MediaState[];
export declare const LICENSE_PLAN_IDS:readonly LicensePlanId[];
export declare const COMMERCE_REQUIRED_METHODS:readonly string[];
export declare const LICENSING_REQUIRED_METHODS:readonly string[];

export declare function isCheckoutState(value:unknown):value is CheckoutState;
export declare function isSystemState(value:unknown):value is SystemState;
export declare function isOwnershipState(value:unknown):value is OwnershipState;
export declare function isMediaState(value:unknown):value is MediaState;
export declare function isLicensePlanId(value:unknown):value is LicensePlanId;

export declare function assertKnownState(group:'checkout',value:string):CheckoutState;
export declare function assertKnownState(group:'system',value:string):SystemState;
export declare function assertKnownState(group:'ownership',value:string):OwnershipState;
export declare function assertKnownState(group:'media',value:string):MediaState;

export declare function createCommerceAdapter<T extends CommerceAdapter>(adapter:T):Readonly<Omit<T,'capabilities'> & {kind:'commerce';capabilities:Readonly<CommerceAdapterCapabilities>}>;
export declare function createLicensingAdapter<T extends LicensingAdapter>(adapter:T):Readonly<Omit<T,'capabilities'> & {kind:'licensing';capabilities:Readonly<LicensingAdapterCapabilities>}>;

export interface CommerceRuntime<C extends CommerceAdapter=CommerceAdapter,L extends LicensingAdapter=LicensingAdapter>{
  readonly version:'0.5.0';
  readonly commerce:ReturnType<typeof createCommerceAdapter<C>>;
  readonly licensing:ReturnType<typeof createLicensingAdapter<L>>;
}

export declare function composeCommerceRuntime<C extends CommerceAdapter,L extends LicensingAdapter>(input:{commerce:C;licensing:L}):CommerceRuntime<C,L>;
