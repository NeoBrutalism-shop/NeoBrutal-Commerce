import type {ActivationView,EntitlementView,LicenseView,LicensingAdapter,LicensingAdapterCapabilities,ListResult,OwnershipEventView,OwnershipTransferView,PlanChangeQuoteView,SeatAssignmentView,SignedDownloadView} from '../contracts/index.js';

export interface LicensingBridge{
  listLicenses(query?:Record<string,unknown>):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
  getLicense(licenseId:string):Promise<unknown|null>;
  listEntitlements(query?:Record<string,unknown>):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
  listActivations?(licenseId:string):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
  listSeats?(licenseId:string):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
  assignSeat?(input:Record<string,unknown>):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
  removeSeat?(input:Record<string,unknown>):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
  renewUpdates?(input:Record<string,unknown>):Promise<unknown>;
  createSignedDownload?(input:Record<string,unknown>):Promise<unknown>;
  quotePlanChange?(input:Record<string,unknown>):Promise<unknown>;
  changePlan?(input:Record<string,unknown>):Promise<unknown>;
  listTransfers?(input:Record<string,unknown>):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
  createTransfer?(input:Record<string,unknown>):Promise<unknown>;
  cancelTransfer?(input:Record<string,unknown>):Promise<unknown>;
  listOwnershipEvents?(input:Record<string,unknown>):Promise<{items:readonly unknown[];nextCursor?:string|null}>;
}

export interface LicensingBridgeNormalizers{
  license?:(value:unknown)=>LicenseView;
  entitlement?:(value:unknown)=>EntitlementView;
  activation?:(value:unknown)=>ActivationView;
  seat?:(value:unknown)=>SeatAssignmentView;
  signedDownload?:(value:unknown)=>SignedDownloadView;
  planChangeQuote?:(value:unknown)=>PlanChangeQuoteView;
  transfer?:(value:unknown)=>OwnershipTransferView;
  ownershipEvent?:(value:unknown)=>OwnershipEventView;
}

export interface LicensingBridgeOptions{bridge:LicensingBridge;capabilities?:Partial<LicensingAdapterCapabilities>;normalize?:LicensingBridgeNormalizers;}
export declare function createLicensingBridgeAdapter(options:LicensingBridgeOptions):Readonly<LicensingAdapter & {kind:'licensing';capabilities:Readonly<LicensingAdapterCapabilities>}>;
