import test from 'node:test';
import assert from 'node:assert/strict';
import {REFERENCE_PRODUCT,createReferenceRuntime} from '../src/adapters/reference.js';
import {
  createActivationListSpec,
  createLicenseCardSpec,
  createOrderSummarySpec,
  createProductCardSpec,
  createSeatAssignmentSpec,
  createSystemStateSpec,
  renderSpecToHtml
} from '../src/renderers/headless.js';
import {createReactBindings} from '../src/renderers/react.js';

test('headless product renderer preserves normalized product and offer anatomy',()=>{
  const spec=createProductCardSpec(REFERENCE_PRODUCT,{offerId:'team'});
  const html=renderSpecToHtml(spec);
  assert.match(html,/data-commerce-component="product-card"/);
  assert.match(html,/data-product-id="soft"/);
  assert.match(html,/data-offer-id="team"/);
  assert.match(html,/\$99\.00/);
  assert.match(html,/5 production sites/);
  assert.match(html,/href="product\/soft\/"/);
});

test('renderer HTML serialization escapes model content',()=>{
  const product={...REFERENCE_PRODUCT,id:'unsafe',name:'<Soft & Co>',summary:'Use <script>never<\/script>',offers:REFERENCE_PRODUCT.offers};
  const html=renderSpecToHtml(createProductCardSpec(product));
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/&lt;Soft &amp; Co&gt;/);
  assert.match(html,/Use &lt;script&gt;never&lt;\/script&gt;/);
});

test('order summary consumes normalized cart totals without provider knowledge',async()=>{
  const runtime=createReferenceRuntime();
  const cart=await runtime.commerce.addCartLine({productId:'soft',offerId:'team'});
  const spec=createOrderSummarySpec(cart);
  const html=renderSpecToHtml(spec);
  assert.match(html,/NeoBrutal Soft · Team/);
  assert.match(html,/Subtotal/);
  assert.match(html,/Total/);
  assert.match(html,/\$99\.00/);
  assert.match(html,/data-commerce-component="order-summary"/);
});

test('system state renderer enforces the shared state taxonomy',()=>{
  assert.throws(()=>createSystemStateSpec({state:'mystery'}),/Unknown system state/);
  const loading=renderSpecToHtml(createSystemStateSpec({state:'loading'}));
  assert.match(loading,/data-state="loading"/);
  assert.match(loading,/aria-live="polite"/);
  assert.match(loading,/nbc-skeleton/);
});

test('license seat and activation renderers consume licensing view models',async()=>{
  const runtime=createReferenceRuntime();
  const license=await runtime.licensing.getLicense('license-reference-team');
  const seats=await runtime.licensing.listSeats('license-reference-team');
  const activations=await runtime.licensing.listActivations('license-reference-team');

  const licenseHtml=renderSpecToHtml(createLicenseCardSpec(license,{title:'NeoBrutal Soft · Team'}));
  assert.match(licenseHtml,/data-commerce-component="license-card"/);
  assert.match(licenseHtml,/DEMO-KEY-••••/);
  assert.match(licenseHtml,/2 \/ 5/);

  const seatHtml=renderSpecToHtml(createSeatAssignmentSpec(seats.items));
  assert.match(seatHtml,/data-commerce-component="seat-assignment"/);
  assert.match(seatHtml,/owner@example\.com/);

  const activationHtml=renderSpecToHtml(createActivationListSpec(activations.items));
  assert.match(activationHtml,/data-commerce-component="activation-list"/);
  assert.match(activationHtml,/app\.example\.com/);
});

test('React bindings are a thin translation of the same headless spec',()=>{
  const React={createElement:(type,props,...children)=>({type,props,children})};
  const {ProductCard,SystemState}=createReactBindings(React);
  const card=ProductCard({product:REFERENCE_PRODUCT,offerId:'individual'});
  assert.equal(card.type,'article');
  assert.equal(card.props.className,'nbc-product-card');
  assert.equal(card.props['data-commerce-component'],'product-card');
  assert.equal(card.props['data-offer-id'],'individual');

  const state=SystemState({state:'offline'});
  assert.equal(state.type,'section');
  assert.equal(state.props['data-state'],'offline');
});
