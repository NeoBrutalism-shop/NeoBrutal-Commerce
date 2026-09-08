import {assertKnownState} from '../contracts/runtime.js';

const TEXT=Symbol('text');

const DEFAULT_SYSTEM_COPY={
  empty:['Nothing here yet.','There is no content to show yet.'],
  loading:['Loading…','This content is still being prepared.'],
  error:['Something went wrong.','The current context is preserved so you can recover safely.'],
  offline:['You appear to be offline.','Local commerce state should remain intact until the connection returns.'],
  permission:['Permission required.','This account cannot complete the requested action.'],
  unsupported:['This action is unavailable.','Use a supported alternate path instead of hiding the capability.']
};

function compactChildren(values){
  return values.flat(Infinity).filter(value=>value!==null&&value!==undefined&&value!==false).map(value=>typeof value==='number'?String(value):value);
}

export function createText(value){
  return Object.freeze({tag:TEXT,value:String(value)});
}

export function createNode(tag,props={},...children){
  if(typeof tag!=='string'||!tag) throw new TypeError('Renderer nodes require a non-empty tag');
  return Object.freeze({tag,props:Object.freeze({...props}),children:Object.freeze(compactChildren(children))});
}

export function isRenderNode(value){
  return Boolean(value&&typeof value==='object'&&(value.tag===TEXT||typeof value.tag==='string'));
}

export function formatMoney(money,locale='en-US'){
  if(!money||typeof money.amount!=='number'||!money.currency) throw new TypeError('Money requires amount and currency');
  if(money.formatted) return money.formatted;
  return new Intl.NumberFormat(locale,{style:'currency',currency:money.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(money.amount);
}

export function formatCapacity(capacity={}){
  if(capacity.label) return capacity.label;
  const parts=[];
  if(Number.isFinite(capacity.sites)) parts.push(`${capacity.sites} production ${capacity.sites===1?'site':'sites'}`);
  if(Number.isFinite(capacity.seats)) parts.push(`${capacity.seats} ${capacity.seats===1?'seat':'seats'}`);
  if(Number.isFinite(capacity.activations)) parts.push(`${capacity.activations} ${capacity.activations===1?'activation':'activations'}`);
  if(Number.isFinite(capacity.domains)) parts.push(`${capacity.domains} ${capacity.domains===1?'domain':'domains'}`);
  return parts.join(' · ');
}

function offerFor(product,offerId){
  const offers=Array.isArray(product?.offers)?product.offers:[];
  if(!offers.length) throw new TypeError('Product renderer requires at least one offer');
  if(!offerId) return offers[0];
  const offer=offers.find(item=>item.id===offerId);
  if(!offer) throw new RangeError(`Unknown offer: ${offerId}`);
  return offer;
}

function artLabel(product){
  const last=String(product.name||'PRODUCT').trim().split(/\s+/).pop()||'PRODUCT';
  return last.slice(0,8).toUpperCase();
}

export function createProductCardSpec(product,options={}){
  if(!product?.id||!product?.name||!product?.summary) throw new TypeError('Product renderer requires id, name and summary');
  const offer=offerFor(product,options.offerId);
  const capacity=formatCapacity(offer.capacity||{});
  const ctaHref=options.ctaHref??product.route;
  const badge=options.badge??product.status??product.kind;
  return createNode('article',{
    class:'nbc-product-card',
    'data-commerce-component':'product-card',
    'data-product-id':product.id,
    'data-offer-id':offer.id
  },
    badge?createNode('span',{class:'nbc-badge'},badge):null,
    createNode('div',{class:'nbc-product-art','aria-hidden':'true'},createNode('strong',{},artLabel(product))),
    createNode('h3',{},product.name),
    createNode('p',{},product.summary),
    createNode('div',{class:'nbc-price'},
      createNode('strong',{},formatMoney(offer.price,options.locale)),
      createNode('span',{},capacity||offer.label)
    ),
    ctaHref?createNode('a',{class:'nbc-button nbc-tactile',href:ctaHref},options.ctaLabel??`VIEW ${product.name.toUpperCase()} →`):null
  );
}

function summaryRows(source,locale){
  const rows=[];
  if(Array.isArray(source.lines)){
    for(const line of source.lines){
      rows.push({label:line.label,value:formatMoney(line.subtotal||line.total||line.unitPrice,locale)});
    }
  }
  rows.push({label:'Subtotal',value:formatMoney(source.subtotal,locale)});
  for(const discount of source.discounts||[]){
    const text=formatMoney(discount.amount,locale);
    rows.push({label:discount.label,value:discount.amount.amount>0?`−${text}`:text});
  }
  for(const tax of source.taxes||[]){
    rows.push({label:tax.label,value:formatMoney(tax.amount,locale)});
  }
  rows.push({label:'Total',value:formatMoney(source.total,locale),total:true});
  return rows;
}

export function createOrderSummarySpec(source,options={}){
  if(!source?.subtotal||!source?.total) throw new TypeError('Order summary requires subtotal and total');
  return createNode('section',{
    class:'nbc-summary',
    'data-commerce-component':'order-summary',
    'aria-label':options.ariaLabel??'Order summary'
  },
    options.heading===false?null:createNode('h3',{},options.heading??'Order summary'),
    createNode('dl',{class:'nbc-summary-list'},summaryRows(source,options.locale).map(row=>createNode('div',{class:'nbc-summary-row','data-total':row.total?'true':undefined},
      createNode('dt',{},row.label),
      createNode('dd',{},row.value)
    ))),
    options.note?createNode('p',{class:'nbc-summary-note'},options.note):null
  );
}

export function createSystemStateSpec(input){
  const state=assertKnownState('system',input?.state);
  const [defaultTitle,defaultMessage]=DEFAULT_SYSTEM_COPY[state];
  const action=input?.action;
  const actionTag=action?.href?'a':'button';
  const actionProps=action?{
    class:'nbc-button nbc-tactile',
    ...(action.href?{href:action.href}:{type:action.type??'button'}),
    ...(action.onClick?{onClick:action.onClick}:{})
  }:null;
  return createNode('section',{
    class:'nbc-state',
    'data-commerce-component':'system-state',
    'data-state':state,
    ...(state==='loading'?{'aria-live':'polite'}:{})
  },
    createNode('strong',{},input?.title??defaultTitle),
    createNode('span',{},input?.message??defaultMessage),
    state==='loading'?createNode('div',{class:'nbc-skeleton','aria-hidden':'true'},createNode('span'),createNode('span'),createNode('span')):null,
    action?createNode('div',{class:'nbc-state-actions'},createNode(actionTag,actionProps,action.label)):null
  );
}

function licenseStatusClass(status){
  if(status==='grace') return 'nbc-license-status nbc-license-status--warning';
  if(['expired','cancelled','refunded'].includes(status)) return 'nbc-license-status nbc-license-status--expired';
  return 'nbc-license-status';
}

function capacityStat(label,used,capacity){
  if(!Number.isFinite(capacity)) return null;
  return createNode('div',{class:'nbc-license-stat'},createNode('span',{},label),createNode('strong',{},`${Number.isFinite(used)?used:0} / ${capacity}`));
}

export function createLicenseCardSpec(license,options={}){
  const status=assertKnownState('ownership',license?.status);
  if(!license?.id||!license?.productId||!license?.offerId) throw new TypeError('License renderer requires id, productId and offerId');
  const stats=[
    capacityStat('Sites',license.usage?.sites,license.capacity?.sites),
    capacityStat('Seats',license.usage?.seats,license.capacity?.seats),
    capacityStat('Activations',license.usage?.activations,license.capacity?.activations)
  ].filter(Boolean);
  return createNode('article',{
    class:'nbc-license-card',
    'data-commerce-component':'license-card',
    'data-license-id':license.id,
    'data-state':status
  },
    createNode('div',{class:'nbc-license-head'},
      createNode('div',{},
        options.kicker?createNode('span',{class:'nbc-badge'},options.kicker):null,
        createNode('h3',{},options.title??`${license.productId} · ${license.offerId}`)
      ),
      createNode('span',{class:licenseStatusClass(status),'data-state':status},status.toUpperCase())
    ),
    license.maskedKey?createNode('div',{class:'nbc-license-key'},createNode('span',{},license.maskedKey)):null,
    stats.length?createNode('div',{class:'nbc-license-grid'},stats):null,
    license.updatesThrough?createNode('div',{class:'nbc-update-card','data-eligible':String(status==='active'||status==='grace')},
      createNode('div',{},createNode('strong',{},'Update eligibility'),createNode('small',{},`Through ${license.updatesThrough}`))
    ):null,
    options.note?createNode('p',{class:'nbc-entitlement-note'},options.note):null
  );
}

export function createSeatAssignmentSpec(seats,options={}){
  const items=Array.isArray(seats)?seats:[];
  return createNode('section',{
    class:'nbc-lifecycle',
    'data-commerce-component':'seat-assignment'
  },
    createNode('div',{class:'nbc-lifecycle-head'},
      createNode('h3',{},options.heading??'Seat assignments'),
      options.badge?createNode('span',{class:'nbc-lifecycle-badge','data-state':'active'},options.badge):null
    ),
    createNode('div',{class:'nbc-seat-list'},items.map(seat=>createNode('div',{class:'nbc-seat-row','data-seat-id':seat.id,'data-state':seat.status},
      createNode('div',{},
        createNode('strong',{},seat.assignee?.email??'Available seat'),
        createNode('small',{},seat.status==='assigned'?[seat.role,seat.assignedAt].filter(Boolean).join(' · '):'Ready to assign')
      )
    )))
  );
}

export function createActivationListSpec(activations,options={}){
  const items=Array.isArray(activations)?activations:[];
  return createNode('section',{
    class:'nbc-license-card',
    'data-commerce-component':'activation-list'
  },
    createNode('h3',{},options.heading??'Activation sites'),
    createNode('div',{class:'nbc-site-list'},items.map(item=>createNode('div',{class:'nbc-site-row','data-activation-id':item.id,'data-state':item.status},
      createNode('code',{},item.scope),
      createNode('span',{},item.status)
    )))
  );
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function renderProps(props){
  return Object.entries(props||{}).filter(([,value])=>value!==undefined&&value!==null&&value!==false&&typeof value!=='function').map(([key,value])=>{
    if(value===true) return ` ${escapeHtml(key)}`;
    return ` ${escapeHtml(key)}="${escapeHtml(value)}"`;
  }).join('');
}

export function renderSpecToHtml(spec){
  if(spec===null||spec===undefined||spec===false) return '';
  if(typeof spec==='string'||typeof spec==='number') return escapeHtml(spec);
  if(spec.tag===TEXT) return escapeHtml(spec.value);
  if(!isRenderNode(spec)) throw new TypeError('Expected a renderer spec node');
  const children=spec.children.map(renderSpecToHtml).join('');
  return `<${spec.tag}${renderProps(spec.props)}>${children}</${spec.tag}>`;
}
