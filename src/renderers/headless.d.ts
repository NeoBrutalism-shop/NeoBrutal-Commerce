import type {ActivationView,CartView,CheckoutQuoteView,LicenseView,Money,ProductView,SeatAssignmentView,SystemState} from '../contracts/index.js';

export interface RenderSpec{
  readonly tag:string|symbol;
  readonly props:Readonly<Record<string,unknown>>;
  readonly children:readonly RenderChild[];
  readonly value?:string;
}
export type RenderChild=RenderSpec|string|number;

export interface ProductCardRenderOptions{
  offerId?:string;
  locale?:string;
  badge?:string;
  ctaHref?:string;
  ctaLabel?:string;
}

export interface OrderSummaryRenderOptions{
  locale?:string;
  ariaLabel?:string;
  heading?:string|false;
  note?:string;
}

export interface StateAction{
  label:string;
  href?:string;
  type?:'button'|'submit'|'reset';
  onClick?:unknown;
}

export interface SystemStateRenderInput{
  state:SystemState;
  title?:string;
  message?:string;
  action?:StateAction;
}

export interface LicenseRenderOptions{
  title?:string;
  kicker?:string;
  note?:string;
}

export interface CollectionRenderOptions{
  heading?:string;
  badge?:string;
}

export declare function createText(value:unknown):RenderSpec;
export declare function createNode(tag:string,props?:Record<string,unknown>,...children:unknown[]):RenderSpec;
export declare function isRenderNode(value:unknown):value is RenderSpec;
export declare function formatMoney(money:Money,locale?:string):string;
export declare function formatCapacity(capacity?:{sites?:number;seats?:number;activations?:number;domains?:number;label?:string}):string;
export declare function createProductCardSpec(product:ProductView,options?:ProductCardRenderOptions):RenderSpec;
export declare function createOrderSummarySpec(source:CartView|CheckoutQuoteView,options?:OrderSummaryRenderOptions):RenderSpec;
export declare function createSystemStateSpec(input:SystemStateRenderInput):RenderSpec;
export declare function createLicenseCardSpec(license:LicenseView,options?:LicenseRenderOptions):RenderSpec;
export declare function createSeatAssignmentSpec(seats:readonly SeatAssignmentView[],options?:CollectionRenderOptions):RenderSpec;
export declare function createActivationListSpec(activations:readonly ActivationView[],options?:CollectionRenderOptions):RenderSpec;
export declare function renderSpecToHtml(spec:RenderChild|null|undefined|false):string;
