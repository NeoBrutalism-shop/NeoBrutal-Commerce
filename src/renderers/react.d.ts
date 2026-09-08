import type {ActivationView,CartView,CheckoutQuoteView,LicenseView,ProductView,SeatAssignmentView} from '../contracts/index.js';
import type {CollectionRenderOptions,LicenseRenderOptions,OrderSummaryRenderOptions,ProductCardRenderOptions,RenderChild,SystemStateRenderInput} from './headless.js';

export interface ReactLike{
  createElement(type:unknown,props:Record<string,unknown>|null,...children:unknown[]):unknown;
}

export interface CommerceReactBindings{
  Spec(props:{spec:RenderChild}):unknown;
  ProductCard(props:{product:ProductView}&ProductCardRenderOptions):unknown;
  OrderSummary(props:{source:CartView|CheckoutQuoteView}&OrderSummaryRenderOptions):unknown;
  SystemState(props:SystemStateRenderInput):unknown;
  LicenseCard(props:{license:LicenseView}&LicenseRenderOptions):unknown;
  SeatAssignment(props:{seats:readonly SeatAssignmentView[]}&CollectionRenderOptions):unknown;
  ActivationList(props:{activations:readonly ActivationView[]}&CollectionRenderOptions):unknown;
}

export declare function renderSpecWithReact(React:ReactLike,spec:RenderChild|null|undefined|false):unknown;
export declare function createReactBindings(React:ReactLike):Readonly<CommerceReactBindings>;
