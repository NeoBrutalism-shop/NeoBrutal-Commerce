import type {ActionBindingCallbacks,ActionDispatcher,CommerceAction} from '../actions/index.js';
import type {ProductView} from '../contracts/index.js';
import type {RenderNode,ProductCardOptions} from './headless.js';

export interface CommerceActionControlOptions{
  label?:string;
  className?:string;
  disabled?:boolean;
  ariaLabel?:string;
  href?:string;
}

export interface ProductActionCardOptions extends ProductCardOptions{
  actionLabel?:string;
  actionClassName?:string;
}

export declare function createCommerceActionButtonSpec(action:CommerceAction,options?:CommerceActionControlOptions):RenderNode;
export declare function createCommerceActionLinkSpec(action:CommerceAction,options?:CommerceActionControlOptions):RenderNode;
export declare function createProductActionCardSpec(product:ProductView,action:CommerceAction,options?:ProductActionCardOptions):RenderNode;
export declare function bindActionSpec(spec:RenderNode,dispatcher:ActionDispatcher,callbacks?:ActionBindingCallbacks):RenderNode;
