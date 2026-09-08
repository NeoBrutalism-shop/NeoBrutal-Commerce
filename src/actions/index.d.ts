import type {
  CartView,CheckoutQuoteInput,CheckoutQuoteView,CommerceRuntime,ListResult,LicenseView,OrderView,SeatAssignee,SeatAssignmentView,ActivationView,SignedDownloadView,SubmitOrderInput
} from '../contracts/index.js';

export type CommerceActionType=
  |'cart.add'|'cart.remove'|'checkout.quote'|'checkout.submit'|'order.refund'
  |'license.activations.list'|'license.seats.list'|'seat.assign'|'seat.remove'|'license.renew'|'download.create';

export interface ActionMeta{
  id?:string;
  source?:string;
  correlationId?:string;
  [key:string]:unknown;
}

export interface ActionBase<T extends CommerceActionType,P>{
  type:T;
  payload:P;
  meta?:ActionMeta;
}

export type CartAddAction=ActionBase<'cart.add',{cartId?:string;productId:string;offerId:string;quantity?:number}>;
export type CartRemoveAction=ActionBase<'cart.remove',{cartId:string;lineId:string}>;
export type CheckoutQuoteAction=ActionBase<'checkout.quote',CheckoutQuoteInput>;
export type CheckoutSubmitAction=ActionBase<'checkout.submit',SubmitOrderInput>;
export type OrderRefundAction=ActionBase<'order.refund',{orderId:string;reason?:string}>;
export type ActivationsListAction=ActionBase<'license.activations.list',{licenseId:string}>;
export type SeatsListAction=ActionBase<'license.seats.list',{licenseId:string}>;
export type SeatAssignAction=ActionBase<'seat.assign',{licenseId:string;assignee:SeatAssignee;role?:string}>;
export type SeatRemoveAction=ActionBase<'seat.remove',{licenseId:string;seatId:string}>;
export type LicenseRenewAction=ActionBase<'license.renew',{licenseId:string;offerId?:string}>;
export type DownloadCreateAction=ActionBase<'download.create',{entitlementId:string;releaseId?:string}>;

export type CommerceAction=
  |CartAddAction|CartRemoveAction|CheckoutQuoteAction|CheckoutSubmitAction|OrderRefundAction
  |ActivationsListAction|SeatsListAction|SeatAssignAction|SeatRemoveAction|LicenseRenewAction|DownloadCreateAction;

export type CommerceActionResult=
  CartView|CheckoutQuoteView|OrderView|LicenseView|SignedDownloadView|ListResult<ActivationView>|ListResult<SeatAssignmentView>;

export interface ActionEvent<TAction extends CommerceAction=CommerceAction,TResult=CommerceActionResult>{
  phase:'start'|'success'|'error';
  action:TAction;
  result?:TResult;
  error?:unknown;
}

export interface ActionDispatcher{
  dispatch(action:CartAddAction):Promise<CartView>;
  dispatch(action:CartRemoveAction):Promise<CartView>;
  dispatch(action:CheckoutQuoteAction):Promise<CheckoutQuoteView>;
  dispatch(action:CheckoutSubmitAction):Promise<OrderView>;
  dispatch(action:OrderRefundAction):Promise<OrderView>;
  dispatch(action:ActivationsListAction):Promise<ListResult<ActivationView>>;
  dispatch(action:SeatsListAction):Promise<ListResult<SeatAssignmentView>>;
  dispatch(action:SeatAssignAction):Promise<ListResult<SeatAssignmentView>>;
  dispatch(action:SeatRemoveAction):Promise<ListResult<SeatAssignmentView>>;
  dispatch(action:LicenseRenewAction):Promise<LicenseView>;
  dispatch(action:DownloadCreateAction):Promise<SignedDownloadView>;
}

export declare const ACTION_TYPES:readonly CommerceActionType[];
export declare function isCommerceActionType(value:unknown):value is CommerceActionType;
export declare function createCommerceAction<T extends CommerceActionType,P extends Record<string,unknown>>(type:T,payload?:P,meta?:ActionMeta):Readonly<{type:T;payload:Readonly<P>;meta:Readonly<ActionMeta>}>;

export declare function executeCommerceAction(runtime:CommerceRuntime,action:CartAddAction):Promise<CartView>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:CartRemoveAction):Promise<CartView>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:CheckoutQuoteAction):Promise<CheckoutQuoteView>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:CheckoutSubmitAction):Promise<OrderView>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:OrderRefundAction):Promise<OrderView>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:ActivationsListAction):Promise<ListResult<ActivationView>>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:SeatsListAction):Promise<ListResult<SeatAssignmentView>>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:SeatAssignAction):Promise<ListResult<SeatAssignmentView>>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:SeatRemoveAction):Promise<ListResult<SeatAssignmentView>>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:LicenseRenewAction):Promise<LicenseView>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:DownloadCreateAction):Promise<SignedDownloadView>;

export declare function createActionDispatcher(runtime:CommerceRuntime,options?:{onEvent?:(event:ActionEvent)=>void}):Readonly<ActionDispatcher>;
