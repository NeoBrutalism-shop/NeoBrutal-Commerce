import {renderSpecWithReact} from './react.js';
import {createInvoiceHistorySpec,createOwnershipTimelineSpec,createPlanChangeSpec,createSubscriptionSpec,createTransferListSpec} from './ownership.js';

export function createReactOwnershipBindings(React){
  if(!React||typeof React.createElement!=='function')throw new TypeError('React ownership bindings require React.createElement');
  const render=spec=>renderSpecWithReact(React,spec);
  return Object.freeze({
    PlanChange({quote,...options}){return render(createPlanChangeSpec(quote,options));},
    TransferList({transfers,...options}){return render(createTransferListSpec(transfers,options));},
    Subscription({subscription,...options}){return render(createSubscriptionSpec(subscription,options));},
    InvoiceHistory({invoices,...options}){return render(createInvoiceHistorySpec(invoices,options));},
    OwnershipTimeline({events,...options}){return render(createOwnershipTimelineSpec(events,options));}
  });
}
