import type {ActionDispatcher,CommerceAction} from '../actions/index.js';
import type {ActionBindingCallbacks} from '../actions/bindings.js';
import type {ProductView} from '../contracts/index.js';
import type {RenderSpec,ProductCardRenderOptions} from './headless.js';

export interface CommerceActionControlOptions{
  label?:string;
  className?:string;
  disabled?:boolean;
  ariaLabel?:string;
  href?:string;
}

export interface ProductActionCardOptions extends ProductCardRenderOptions{
  actionLabel?:string;
  actionClassName?:string;
}

export declare function createCommerceActionButtonSpec(action:CommerceAction,options?:CommerceActionControlOptions):RenderSpec;
export declare function createCommerceActionLinkSpec(action:CommerceAction,options?:CommerceActionControlOptions):RenderSpec;
export declare function createProductActionCardSpec(product:ProductView,action:CommerceAction,options?:ProductActionCardOptions):RenderSpec;
export declare function bindActionSpec(spec:RenderSpec,dispatcher:ActionDispatcher,callbacks?:ActionBindingCallbacks):RenderSpec;
