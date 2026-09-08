import type {InvoiceView,OwnershipEventView,OwnershipTransferView,PlanChangeQuoteView,SubscriptionView} from '../contracts/index.js';
import type {OwnershipRenderOptions} from './ownership.js';

export interface ReactOwnershipBindings{
  PlanChange(props:{quote:PlanChangeQuoteView}&OwnershipRenderOptions):unknown;
  TransferList(props:{transfers:readonly OwnershipTransferView[]}&OwnershipRenderOptions):unknown;
  Subscription(props:{subscription:SubscriptionView}&OwnershipRenderOptions):unknown;
  InvoiceHistory(props:{invoices:readonly InvoiceView[]}&OwnershipRenderOptions):unknown;
  OwnershipTimeline(props:{events:readonly OwnershipEventView[]}&OwnershipRenderOptions):unknown;
}
export declare function createReactOwnershipBindings(React:{createElement:(type:unknown,props:unknown,...children:unknown[])=>unknown}):Readonly<ReactOwnershipBindings>;
