import type {
  CommerceAdapter,
  CommerceAdapterCapabilities,
  CommerceRuntime,
  LicensingAdapter,
  LicensingAdapterCapabilities,
  ProductView
} from '../contracts/index.js';

export interface ReferenceCommerceOptions{
  products?:readonly ProductView[];
  currency?:string;
}

export interface ReferenceLicensingOptions{
  productId?:string;
  offerId?:string;
}

export interface ReferenceRuntimeOptions{
  commerce?:ReferenceCommerceOptions;
  licensing?:ReferenceLicensingOptions;
}

export type ReferenceCommerceAdapter=Readonly<CommerceAdapter & {
  readonly kind:'commerce';
  readonly capabilities:Readonly<CommerceAdapterCapabilities>;
}>;

export type ReferenceLicensingAdapter=Readonly<LicensingAdapter & {
  readonly kind:'licensing';
  readonly capabilities:Readonly<LicensingAdapterCapabilities>;
}>;

export declare const REFERENCE_PRODUCT:Readonly<ProductView>;
export declare function createReferenceCommerceAdapter(options?:ReferenceCommerceOptions):ReferenceCommerceAdapter;
export declare function createReferenceLicensingAdapter(options?:ReferenceLicensingOptions):ReferenceLicensingAdapter;
export declare function createReferenceRuntime(options?:ReferenceRuntimeOptions):CommerceRuntime;
