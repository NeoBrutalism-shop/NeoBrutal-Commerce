import {renderSpecWithReact} from './react.js';
import {bindActionSpec,createCommerceActionButtonSpec,createCommerceActionLinkSpec,createProductActionCardSpec} from './action-controls.js';

export function createReactActionBindings(React,dispatcher,callbacks={}){
  if(!React||typeof React.createElement!=='function') throw new TypeError('React action bindings require React.createElement');
  if(!dispatcher||typeof dispatcher.dispatch!=='function') throw new TypeError('React action bindings require an ActionDispatcher');
  const render=spec=>renderSpecWithReact(React,bindActionSpec(spec,dispatcher,callbacks));
  return Object.freeze({
    Spec({spec}){return render(spec);},
    ActionButton({action,...options}){return render(createCommerceActionButtonSpec(action,options));},
    ActionLink({action,...options}){return render(createCommerceActionLinkSpec(action,options));},
    ProductActionCard({product,action,...options}){return render(createProductActionCardSpec(product,action,options));}
  });
}
