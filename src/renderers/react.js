import {
  createActivationListSpec,
  createLicenseCardSpec,
  createOrderSummarySpec,
  createProductCardSpec,
  createSeatAssignmentSpec,
  createSystemStateSpec,
  isRenderNode
} from './headless.js';

function normalizeReactProps(props={}){
  const next={};
  for(const [key,value] of Object.entries(props)){
    if(value===undefined||value===null||value===false) continue;
    if(key==='class') next.className=value;
    else if(key==='for') next.htmlFor=value;
    else next[key]=value;
  }
  return next;
}

export function renderSpecWithReact(React,spec){
  if(spec===null||spec===undefined||spec===false) return null;
  if(typeof spec==='string'||typeof spec==='number') return spec;
  if(!isRenderNode(spec)) throw new TypeError('Expected a Commerce renderer spec');
  if(typeof spec.tag==='symbol') return spec.value??'';
  if(!React||typeof React.createElement!=='function') throw new TypeError('React bindings require an object with createElement');
  const children=spec.children.map(child=>renderSpecWithReact(React,child));
  return React.createElement(spec.tag,normalizeReactProps(spec.props),...children);
}

export function createReactBindings(React){
  if(!React||typeof React.createElement!=='function') throw new TypeError('React bindings require React.createElement');
  const render=spec=>renderSpecWithReact(React,spec);
  return Object.freeze({
    Spec({spec}){return render(spec);},
    ProductCard({product,...options}){return render(createProductCardSpec(product,options));},
    OrderSummary({source,...options}){return render(createOrderSummarySpec(source,options));},
    SystemState(props){return render(createSystemStateSpec(props));},
    LicenseCard({license,...options}){return render(createLicenseCardSpec(license,options));},
    SeatAssignment({seats,...options}){return render(createSeatAssignmentSpec(seats,options));},
    ActivationList({activations,...options}){return render(createActivationListSpec(activations,options));}
  });
}
