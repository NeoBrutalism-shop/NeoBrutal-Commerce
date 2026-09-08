import {createLicensingAdapter} from '../contracts/runtime.js';

const identity=value=>value;
const mapList=(result,normalize)=>({items:(result?.items||[]).map(normalize),nextCursor:result?.nextCursor??null});

function requireBridge(bridge,name){
  const fn=bridge?.[name];
  if(typeof fn!=='function')throw new TypeError(`Licensing bridge is missing method: ${name}`);
  return fn.bind(bridge);
}

export function createLicensingBridgeAdapter({bridge,capabilities={},normalize={}}={}){
  if(!bridge||typeof bridge!=='object')throw new TypeError('Licensing bridge requires an injected bridge object');
  const n={
    license:normalize.license||identity,
    entitlement:normalize.entitlement||identity,
    activation:normalize.activation||identity,
    seat:normalize.seat||identity,
    signedDownload:normalize.signedDownload||identity,
    planChangeQuote:normalize.planChangeQuote||identity,
    transfer:normalize.transfer||identity,
    ownershipEvent:normalize.ownershipEvent||identity
  };
  const listLicenses=requireBridge(bridge,'listLicenses');
  const getLicense=requireBridge(bridge,'getLicense');
  const listEntitlements=requireBridge(bridge,'listEntitlements');
  const adapter={
    capabilities:{activations:false,seats:false,renewals:false,signedDownloads:false,planChanges:false,transfers:false,ownershipHistory:false,...capabilities},
    async listLicenses(query={}){return mapList(await listLicenses(query),n.license);},
    async getLicense(licenseId){const value=await getLicense(licenseId);return value==null?null:n.license(value);},
    async listEntitlements(query={}){return mapList(await listEntitlements(query),n.entitlement);}
  };
  if(adapter.capabilities.activations){const fn=requireBridge(bridge,'listActivations');adapter.listActivations=async licenseId=>mapList(await fn(licenseId),n.activation);}
  if(adapter.capabilities.seats){
    const list=requireBridge(bridge,'listSeats'),assign=requireBridge(bridge,'assignSeat'),remove=requireBridge(bridge,'removeSeat');
    adapter.listSeats=async licenseId=>mapList(await list(licenseId),n.seat);
    adapter.assignSeat=async input=>mapList(await assign(input),n.seat);
    adapter.removeSeat=async input=>mapList(await remove(input),n.seat);
  }
  if(adapter.capabilities.renewals){const fn=requireBridge(bridge,'renewUpdates');adapter.renewUpdates=async input=>n.license(await fn(input));}
  if(adapter.capabilities.signedDownloads){const fn=requireBridge(bridge,'createSignedDownload');adapter.createSignedDownload=async input=>n.signedDownload(await fn(input));}
  if(adapter.capabilities.planChanges){
    const quote=requireBridge(bridge,'quotePlanChange'),change=requireBridge(bridge,'changePlan');
    adapter.quotePlanChange=async input=>n.planChangeQuote(await quote(input));
    adapter.changePlan=async input=>n.license(await change(input));
  }
  if(adapter.capabilities.transfers){
    const list=requireBridge(bridge,'listTransfers'),create=requireBridge(bridge,'createTransfer'),cancel=requireBridge(bridge,'cancelTransfer');
    adapter.listTransfers=async input=>mapList(await list(input),n.transfer);
    adapter.createTransfer=async input=>n.transfer(await create(input));
    adapter.cancelTransfer=async input=>n.transfer(await cancel(input));
  }
  if(adapter.capabilities.ownershipHistory){const fn=requireBridge(bridge,'listOwnershipEvents');adapter.listOwnershipEvents=async input=>mapList(await fn(input),n.ownershipEvent);}
  return createLicensingAdapter(adapter);
}
