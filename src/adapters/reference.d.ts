import type {CommerceAdapter,CommerceRuntime,LicensingAdapter,ProductView} from '../contracts/index.js';

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

export declare const REFERENCE_PRODUCT:Readonly<ProductView>;

export declare function createReferenceCommerceAdapter(options?:ReferenceCommerceOptions):ReturnType<typeof import('../contracts/index.js').createCommerceAdapter<CommerceAdapter>>;
export declare function createReferenceLicensingAdapter(options?:ReferenceLicensingOptions):ReturnType<typeof import('../contracts/index.js').createLicensingAdapter<LicensingAdapter>>;
export declare function createReferenceRuntime(options?:ReferenceRuntimeOptions):CommerceRuntime;
