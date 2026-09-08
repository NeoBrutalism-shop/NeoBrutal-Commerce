import {createActionAttributes,createActionHandler,readCommerceAction} from '../actions/bindings.js';
import {createNode,createProductCardSpec,isRenderNode} from './headless.js';

export function createCommerceActionButtonSpec(action,{label='Continue',className='nbc-button nbc-tactile',disabled=false,ariaLabel}={}){
  return createNode('button',{
    class:className,
    type:'button',
    disabled:disabled||undefined,
    ...(ariaLabel?{'aria-label':ariaLabel}:{}),
    ...createActionAttributes(action)
  },label);
}

export function createCommerceActionLinkSpec(action,{label='Continue',href='#',className='nbc-button nbc-tactile',ariaLabel}={}){
  return createNode('a',{
    class:className,
    href,
    ...(ariaLabel?{'aria-label':ariaLabel}:{}),
    ...createActionAttributes(action)
  },label);
}

export function createProductActionCardSpec(product,action,options={}){
  const base=createProductCardSpec(product,{...options,ctaHref:false});
  const label=options.actionLabel??`ADD ${product.name.toUpperCase()} →`;
  return createNode(base.tag,base.props,...base.children,createCommerceActionButtonSpec(action,{label,className:options.actionClassName}));
}

function actionFromProps(props){
  if(!props?.['data-commerce-action']) return null;
  return readCommerceAction({getAttribute(name){const value=props[name];return value===undefined||value===null?null:String(value);}});
}

export function bindActionSpec(spec,dispatcher,callbacks={}){
  if(spec===null||spec===undefined||spec===false||typeof spec==='string'||typeof spec==='number') return spec;
  if(!isRenderNode(spec)||typeof spec.tag==='symbol') return spec;
  const action=actionFromProps(spec.props);
  const props=action?{...spec.props,onClick:createActionHandler(dispatcher,action,callbacks)}:spec.props;
  const children=spec.children.map(child=>bindActionSpec(child,dispatcher,callbacks));
  return createNode(spec.tag,props,...children);
}
