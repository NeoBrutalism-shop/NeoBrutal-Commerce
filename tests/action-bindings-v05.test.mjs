import test from 'node:test';
import assert from 'node:assert/strict';
import {createActionAttributes,readCommerceAction} from '../src/actions/bindings.js';
import {createCommerceAction,createActionDispatcher} from '../src/actions/runtime.js';
import {createReferenceRuntime,REFERENCE_PRODUCT} from '../src/adapters/reference.js';
import {bindActionSpec,createCommerceActionButtonSpec,createProductActionCardSpec} from '../src/renderers/action-controls.js';
import {renderSpecToHtml} from '../src/renderers/headless.js';
import {createReactActionBindings} from '../src/renderers/react-actions.js';

test('action attributes round-trip canonical intent',()=>{
  const action=createCommerceAction('cart.add',{productId:'soft',offerId:'team',quantity:1},{source:'product-card'});
  const attrs=createActionAttributes(action);
  assert.equal(attrs['data-commerce-action'],'cart.add');
  const restored=readCommerceAction({getAttribute:name=>attrs[name]??null});
  assert.deepEqual(restored.payload,{productId:'soft',offerId:'team',quantity:1});
  assert.equal(restored.meta.source,'product-card');
});

test('headless action controls serialize safe declarative commands',()=>{
  const action=createCommerceAction('cart.add',{productId:'soft',offerId:'team'});
  const spec=createProductActionCardSpec(REFERENCE_PRODUCT,action,{offerId:'team'});
  const html=renderSpecToHtml(spec);
  assert.match(html,/data-commerce-component="product-card"/);
  assert.match(html,/data-commerce-action="cart.add"/);
  assert.match(html,/data-commerce-payload="\{&quot;productId&quot;:&quot;soft&quot;,&quot;offerId&quot;:&quot;team&quot;\}"/);
  assert.match(html,/ADD NEOBRUTAL SOFT/);
});

test('bound action specs execute through the Commerce dispatcher',async()=>{
  const runtime=createReferenceRuntime();
  const dispatcher=createActionDispatcher(runtime);
  const action=createCommerceAction('cart.add',{productId:'soft',offerId:'team'});
  const bound=bindActionSpec(createCommerceActionButtonSpec(action,{label:'Add Team'}),dispatcher);
  assert.equal(typeof bound.props.onClick,'function');
  const cart=await bound.props.onClick({preventDefault(){}});
  assert.equal(cart.lines.length,1);
  assert.equal(cart.lines[0].offerId,'team');
  assert.equal(cart.total.amount,99);
});

test('React action bindings preserve the same normalized action path',async()=>{
  const runtime=createReferenceRuntime();
  const dispatcher=createActionDispatcher(runtime);
  const React={createElement:(type,props,...children)=>({type,props:props||{},children})};
  const {ActionButton}=createReactActionBindings(React,dispatcher);
  const element=ActionButton({action:createCommerceAction('cart.add',{productId:'soft',offerId:'individual'}),label:'Add'});
  assert.equal(element.type,'button');
  assert.equal(typeof element.props.onClick,'function');
  const cart=await element.props.onClick({preventDefault(){}});
  assert.equal(cart.total.amount,49);
});
