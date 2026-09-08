import type {
  ActivationView,CartView,CheckoutQuoteInput,CheckoutQuoteView,CommerceRuntime,InvoiceView,LicenseView,ListResult,OrderView,OwnershipEventView,OwnershipTransferView,PlanChangeEffective,PlanChangeQuoteView,SeatAssignee,SeatAssignmentView,SignedDownloadView,SubmitOrderInput,SubscriptionView,TransferKind,TransferRecipient
} from '../contracts/index.js';

export type CommerceActionType=
  |'cart.add'|'cart.remove'|'checkout.quote'|'checkout.submit'|'order.refund'|'invoice.list'
  |'subscription.get'|'subscription.cancel'|'subscription.resume'
  |'license.activations.list'|'license.seats.list'|'seat.assign'|'seat.remove'|'license.renew'|'download.create'
  |'license.change.quote'|'license.change.submit'|'license.transfers.list'|'license.transfer.create'|'license.transfer.cancel'|'license.history.list';

export interface ActionMeta{id?:string;source?:string;correlationId?:string;[key:string]:unknown;}
export interface ActionBase<T extends CommerceActionType,P>{type:T;payload:P;meta?:ActionMeta;}

export type CartAddAction=ActionBase<'cart.add',{cartId?:string;productId:string;offerId:string;quantity?:number}>;
export type CartRemoveAction=ActionBase<'cart.remove',{cartId:string;lineId:string}>;
export type CheckoutQuoteAction=ActionBase<'checkout.quote',CheckoutQuoteInput>;
export type CheckoutSubmitAction=ActionBase<'checkout.submit',SubmitOrderInput>;
export type OrderRefundAction=ActionBase<'order.refund',{orderId:string;reason?:string}>;
export type InvoiceListAction=ActionBase<'invoice.list',{customerId?:string;orderId?:string;cursor?:string;limit?:number}>;
export type SubscriptionGetAction=ActionBase<'subscription.get',{subscriptionId:string}>;
export type SubscriptionCancelAction=ActionBase<'subscription.cancel',{subscriptionId:string;reason?:string}>;
export type SubscriptionResumeAction=ActionBase<'subscription.resume',{subscriptionId:string}>;
export type ActivationsListAction=ActionBase<'license.activations.list',{licenseId:string}>;
export type SeatsListAction=ActionBase<'license.seats.list',{licenseId:string}>;
export type SeatAssignAction=ActionBase<'seat.assign',{licenseId:string;assignee:SeatAssignee;role?:string}>;
export type SeatRemoveAction=ActionBase<'seat.remove',{licenseId:string;seatId:string}>;
export type LicenseRenewAction=ActionBase<'license.renew',{licenseId:string;offerId?:string}>;
export type DownloadCreateAction=ActionBase<'download.create',{entitlementId:string;releaseId?:string}>;
export type PlanChangeQuoteAction=ActionBase<'license.change.quote',{licenseId:string;toOfferId:string;effective?:PlanChangeEffective}>;
export type PlanChangeSubmitAction=ActionBase<'license.change.submit',{licenseId:string;toOfferId:string;effective?:PlanChangeEffective;quoteId?:string}>;
export type TransferListAction=ActionBase<'license.transfers.list',{licenseId:string;cursor?:string;limit?:number}>;
export type TransferCreateAction=ActionBase<'license.transfer.create',{licenseId:string;kind:TransferKind;recipient:TransferRecipient}>;
export type TransferCancelAction=ActionBase<'license.transfer.cancel',{transferId:string}>;
export type OwnershipHistoryAction=ActionBase<'license.history.list',{licenseId:string;cursor?:string;limit?:number}>;

export type CommerceAction=
  |CartAddAction|CartRemoveAction|CheckoutQuoteAction|CheckoutSubmitAction|OrderRefundAction|InvoiceListAction
  |SubscriptionGetAction|SubscriptionCancelAction|SubscriptionResumeAction
  |ActivationsListAction|SeatsListAction|SeatAssignAction|SeatRemoveAction|LicenseRenewAction|DownloadCreateAction
  |PlanChangeQuoteAction|PlanChangeSubmitAction|TransferListAction|TransferCreateAction|TransferCancelAction|OwnershipHistoryAction;

export type CommerceActionResult=
  CartView|CheckoutQuoteView|OrderView|LicenseView|SignedDownloadView|SubscriptionView|null|OwnershipTransferView|PlanChangeQuoteView
  |ListResult<ActivationView>|ListResult<SeatAssignmentView>|ListResult<InvoiceView>|ListResult<OwnershipTransferView>|ListResult<OwnershipEventView>;

export interface ActionEvent<TAction extends CommerceAction=CommerceAction,TResult=CommerceActionResult>{phase:'start'|'success'|'error';action:TAction;result?:TResult;error?:unknown;}

export interface ActionDispatcher{
  dispatch(action:CartAddAction):Promise<CartView>;
  dispatch(action:CartRemoveAction):Promise<CartView>;
  dispatch(action:CheckoutQuoteAction):Promise<CheckoutQuoteView>;
  dispatch(action:CheckoutSubmitAction):Promise<OrderView>;
  dispatch(action:OrderRefundAction):Promise<OrderView>;
  dispatch(action:InvoiceListAction):Promise<ListResult<InvoiceView>>;
  dispatch(action:SubscriptionGetAction):Promise<SubscriptionView|null>;
  dispatch(action:SubscriptionCancelAction):Promise<SubscriptionView>;
  dispatch(action:SubscriptionResumeAction):Promise<SubscriptionView>;
  dispatch(action:ActivationsListAction):Promise<ListResult<ActivationView>>;
  dispatch(action:SeatsListAction):Promise<ListResult<SeatAssignmentView>>;
  dispatch(action:SeatAssignAction):Promise<ListResult<SeatAssignmentView>>;
  dispatch(action:SeatRemoveAction):Promise<ListResult<SeatAssignmentView>>;
  dispatch(action:LicenseRenewAction):Promise<LicenseView>;
  dispatch(action:DownloadCreateAction):Promise<SignedDownloadView>;
  dispatch(action:PlanChangeQuoteAction):Promise<PlanChangeQuoteView>;
  dispatch(action:PlanChangeSubmitAction):Promise<LicenseView>;
  dispatch(action:TransferListAction):Promise<ListResult<OwnershipTransferView>>;
  dispatch(action:TransferCreateAction):Promise<OwnershipTransferView>;
  dispatch(action:TransferCancelAction):Promise<OwnershipTransferView>;
  dispatch(action:OwnershipHistoryAction):Promise<ListResult<OwnershipEventView>>;
}

export declare const ACTION_TYPES:readonly CommerceActionType[];
export declare function isCommerceActionType(value:unknown):value is CommerceActionType;
export declare function createCommerceAction<T extends CommerceActionType,P extends Record<string,unknown>>(type:T,payload?:P,meta?:ActionMeta):Readonly<{type:T;payload:Readonly<P>;meta:Readonly<ActionMeta>}>;
export declare function executeCommerceAction(runtime:CommerceRuntime,action:CommerceAction):Promise<CommerceActionResult>;
export declare function createActionDispatcher(runtime:CommerceRuntime,options?:{onEvent?:(event:ActionEvent)=>void}):Readonly<ActionDispatcher>;
