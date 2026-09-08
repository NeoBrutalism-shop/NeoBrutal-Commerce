import type {ActionDispatcher,CommerceAction,CommerceActionResult} from './index.js';

export interface ActionBindingCallbacks<TResult=CommerceActionResult>{
  onStart?:(action:CommerceAction,event?:unknown)=>void;
  onResult?:(result:TResult,action:CommerceAction,event?:unknown)=>void;
  onError?:(error:unknown,action:CommerceAction,event?:unknown)=>void;
}

export declare function createActionAttributes(action:CommerceAction):Readonly<Record<string,string>>;
export declare function readCommerceAction(element:{getAttribute(name:string):string|null}):Readonly<CommerceAction>|null;
export declare function createActionHandler(dispatcher:ActionDispatcher,action:CommerceAction,callbacks?:ActionBindingCallbacks):(event?:unknown)=>Promise<CommerceActionResult>;
export declare function bindCommerceActions(root:{addEventListener(type:string,listener:(event:any)=>void):void;removeEventListener(type:string,listener:(event:any)=>void):void;contains?(node:unknown):boolean},dispatcher:ActionDispatcher,options?:ActionBindingCallbacks&{selector?:string}):Readonly<{unbind():void}>;
