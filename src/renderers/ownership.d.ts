import type {InvoiceView,OwnershipEventView,OwnershipTransferView,PlanChangeQuoteView,SubscriptionView} from '../contracts/index.js';
import type {RenderSpec} from './headless.js';

export interface OwnershipRenderOptions{locale?:string;kicker?:string;heading?:string;emptyMessage?:string;}
export declare function createPlanChangeSpec(quote:PlanChangeQuoteView,options?:OwnershipRenderOptions):RenderSpec;
export declare function createTransferListSpec(transfers:readonly OwnershipTransferView[],options?:OwnershipRenderOptions):RenderSpec;
export declare function createSubscriptionSpec(subscription:SubscriptionView,options?:OwnershipRenderOptions):RenderSpec;
export declare function createInvoiceHistorySpec(invoices:readonly InvoiceView[],options?:OwnershipRenderOptions):RenderSpec;
export declare function createOwnershipTimelineSpec(events:readonly OwnershipEventView[],options?:OwnershipRenderOptions):RenderSpec;
