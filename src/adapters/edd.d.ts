import type {CartView,CheckoutQuoteInput,CheckoutQuoteView,CommerceAdapter,CommerceAdapterCapabilities,CustomerOrderQuery,InvoiceView,OrderView,ProductView,SubmitOrderInput,SubscriptionView} from '../contracts/index.js';

export interface EddBridgeMoney{amount?:number|string;value?:number|string;total?:number|string;price?:number|string;currency?:string;formatted?:string}
export interface EddBridgeOffer{id?:string|number;price_id?:string|number;priceId?:string|number;label?:string;name?:string;title?:string;price?:EddBridgeMoney|number|string;amount?:number|string;value?:number|string;currency?:string;capacity?:Record<string,unknown>;metadata?:Record<string,unknown>}
export interface EddBridgeProduct{id?:string|number;download_id?:string|number;downloadId?:string|number;name?:string;title?:string;summary?:string;excerpt?:string;description?:string;kind?:string;route?:string;permalink?:string;currency?:string;price?:EddBridgeMoney|number|string;amount?:number|string;price_label?:string;offers?:readonly EddBridgeOffer[];price_options?:readonly EddBridgeOffer[];prices?:readonly EddBridgeOffer[];variable_prices?:readonly EddBridgeOffer[];entitlements?:readonly string[];media?:readonly string[];status?:string;metadata?:Record<string,unknown>}
export interface EddBridgeList<T>{items:readonly T[];next_cursor?:string|null;nextCursor?:string|null}
export interface EddBridgeCart{[key:string]:unknown}
export interface EddBridgeQuote{[key:string]:unknown}
export interface EddBridgeOrder{[key:string]:unknown}
export interface EddBridgeInvoice{[key:string]:unknown}
export interface EddBridgeSubscription{[key:string]:unknown}

export interface EddTransport{
  listProducts(input?:{cursor?:string;limit?:number}):Promise<EddBridgeList<EddBridgeProduct>|readonly EddBridgeProduct[]>;
  getProduct(productId:string):Promise<EddBridgeProduct|null>;
  getCart(cartId?:string):Promise<EddBridgeCart>;
  addCartLine(input:{cartId?:string;productId:string;offerId:string;quantity?:number}):Promise<EddBridgeCart>;
  removeCartLine(input:{cartId:string;lineId:string}):Promise<EddBridgeCart>;
  quoteCheckout(input:CheckoutQuoteInput):Promise<EddBridgeQuote>;
  submitOrder(input:SubmitOrderInput):Promise<EddBridgeOrder>;
  getOrder(orderId:string):Promise<EddBridgeOrder|null>;
  listCustomerOrders(query?:CustomerOrderQuery):Promise<EddBridgeList<EddBridgeOrder>|readonly EddBridgeOrder[]>;
  requestRefund?(input:{orderId:string;reason?:string}):Promise<EddBridgeOrder>;
  listInvoices?(query?:{customerId?:string;orderId?:string;cursor?:string;limit?:number}):Promise<EddBridgeList<EddBridgeInvoice>|readonly EddBridgeInvoice[]>;
  getSubscription?(subscriptionId:string):Promise<EddBridgeSubscription|null>;
  cancelSubscription?(input:{subscriptionId:string;reason?:string}):Promise<EddBridgeSubscription>;
  resumeSubscription?(input:{subscriptionId:string}):Promise<EddBridgeSubscription>;
}

export interface EddCommerceAdapterOptions{transport:EddTransport;currency?:string;capabilities?:Partial<CommerceAdapterCapabilities>;}

export declare const EDD_REQUIRED_TRANSPORT_METHODS:readonly string[];
export declare function normalizeEddMoney(value:unknown,options?:{currency?:string}):Readonly<{amount:number;currency:string;formatted?:string}>;
export declare function normalizeEddProduct(value:EddBridgeProduct,options?:{currency?:string}):ProductView;
export declare function normalizeEddCart(value:EddBridgeCart,options?:{currency?:string}):CartView;
export declare function normalizeEddCheckoutState(value:unknown):CheckoutQuoteView['state'];
export declare function normalizeEddQuote(value:EddBridgeQuote,options?:{currency?:string}):CheckoutQuoteView;
export declare function normalizeEddOrderStatus(value:unknown):OrderView['status'];
export declare function normalizeEddOrder(value:EddBridgeOrder,options?:{currency?:string}):OrderView;
export declare function normalizeEddInvoiceStatus(value:unknown):InvoiceView['status'];
export declare function normalizeEddInvoice(value:EddBridgeInvoice,options?:{currency?:string}):InvoiceView;
export declare function normalizeEddSubscriptionState(value:unknown):SubscriptionView['status'];
export declare function normalizeEddSubscription(value:EddBridgeSubscription,options?:{currency?:string}):SubscriptionView;
export declare function createEddCommerceAdapter(options:EddCommerceAdapterOptions):ReturnType<typeof import('../contracts/index.js').createCommerceAdapter<CommerceAdapter>>;
