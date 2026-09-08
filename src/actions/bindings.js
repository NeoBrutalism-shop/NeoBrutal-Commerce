import {createCommerceAction} from './runtime.js';

function json(value){
  return JSON.stringify(value??{});
}

export function createActionAttributes(action){
  const normalized=createCommerceAction(action.type,action.payload||{},action.meta||{});
  const attrs={
    'data-commerce-action':normalized.type,
    'data-commerce-payload':json(normalized.payload)
  };
  if(Object.keys(normalized.meta).length) attrs['data-commerce-meta']=json(normalized.meta);
  return Object.freeze(attrs);
}

export function readCommerceAction(element){
  if(!element||typeof element.getAttribute!=='function') throw new TypeError('Action element must support getAttribute');
  const type=element.getAttribute('data-commerce-action');
  if(!type) return null;
  let payload={};
  let meta={};
  const payloadText=element.getAttribute('data-commerce-payload');
  const metaText=element.getAttribute('data-commerce-meta');
  try{
    if(payloadText) payload=JSON.parse(payloadText);
    if(metaText) meta=JSON.parse(metaText);
  }catch(error){
    throw new TypeError(`Invalid Commerce action data attributes: ${error.message}`);
  }
  return createCommerceAction(type,payload,meta);
}

export function createActionHandler(dispatcher,action,{onStart,onResult,onError}={}){
  if(!dispatcher||typeof dispatcher.dispatch!=='function') throw new TypeError('Action handler requires a dispatcher');
  const normalized=createCommerceAction(action.type,action.payload||{},action.meta||{});
  return async function commerceActionHandler(event){
    if(event?.preventDefault) event.preventDefault();
    if(onStart) onStart(normalized,event);
    try{
      const result=await dispatcher.dispatch(normalized);
      if(onResult) onResult(result,normalized,event);
      return result;
    }catch(error){
      if(onError) onError(error,normalized,event);
      throw error;
    }
  };
}

export function bindCommerceActions(root,dispatcher,{selector='[data-commerce-action]',onStart,onResult,onError}={}){
  if(!root||typeof root.addEventListener!=='function'||typeof root.removeEventListener!=='function') throw new TypeError('Action binding root must be an EventTarget-like element');
  if(!dispatcher||typeof dispatcher.dispatch!=='function') throw new TypeError('Action binding requires a dispatcher');
  const listener=async event=>{
    const origin=event?.target;
    const control=origin?.closest?.(selector);
    if(!control) return;
    if(typeof root.contains==='function'&&!root.contains(control)) return;
    const action=readCommerceAction(control);
    if(!action) return;
    event.preventDefault?.();
    const previouslyDisabled='disabled' in control?control.disabled:undefined;
    if('disabled' in control) control.disabled=true;
    control.setAttribute?.('aria-busy','true');
    if(onStart) onStart(action,control,event);
    try{
      const result=await dispatcher.dispatch(action);
      if(onResult) onResult(result,action,control,event);
    }catch(error){
      if(onError) onError(error,action,control,event);
    }finally{
      control.removeAttribute?.('aria-busy');
      if('disabled' in control&&typeof previouslyDisabled==='boolean') control.disabled=previouslyDisabled;
    }
  };
  root.addEventListener('click',listener);
  return Object.freeze({unbind(){root.removeEventListener('click',listener);}});
}
