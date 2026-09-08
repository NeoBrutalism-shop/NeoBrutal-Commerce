import type {ActionDispatcher,CommerceAction} from '../actions/index.js';
import type {ActionBindingCallbacks} from '../actions/bindings.js';
import type {ProductView} from '../contracts/index.js';
import type {RenderSpec} from './headless.js';
import type {CommerceActionControlOptions,ProductActionCardOptions} from './action-controls.js';

export interface ReactLike{
  createElement(type:any,props?:any,...children:any[]):any;
}

export interface ReactActionBindings{
  Spec(props:{spec:RenderSpec}):any;
  ActionButton(props:{action:CommerceAction}&CommerceActionControlOptions):any;
  ActionLink(props:{action:CommerceAction}&CommerceActionControlOptions):any;
  ProductActionCard(props:{product:ProductView;action:CommerceAction}&ProductActionCardOptions):any;
}

export declare function createReactActionBindings(React:ReactLike,dispatcher:ActionDispatcher,callbacks?:ActionBindingCallbacks):Readonly<ReactActionBindings>;
