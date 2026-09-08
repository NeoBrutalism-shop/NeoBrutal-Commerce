import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const KiB=1024;
const readSize=file=>fs.statSync(path.join(root,file)).size;
const walk=(dir,extensions)=>{
  const out=[];
  for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    const rel=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(rel,extensions));
    else if(extensions.some(ext=>entry.name.endsWith(ext)))out.push(rel);
  }
  return out;
};

const cssFiles=walk('src',['.css']);
const runtimeJs=[...walk('src/contracts',['.js']),...walk('src/actions',['.js']),...walk('src/adapters',['.js']),...walk('src/renderers',['.js'])];
const productionHtml=['index.html','products/index.html','product/soft/index.html','pricing/index.html','cart/index.html','checkout/index.html','order/success/index.html','account/index.html','account/license/demo-soft-team/index.html','components/index.html'];

const budgets={
  coreCss:116*KiB,
  storefrontJs:40*KiB,
  runtimeJs:180*KiB,
  productionHtmlTotal:100*KiB,
  productionHtmlSingle:32*KiB
};

const measurements={
  coreCss:cssFiles.reduce((sum,file)=>sum+readSize(file),0),
  storefrontJs:readSize('storefront/store.js'),
  runtimeJs:runtimeJs.reduce((sum,file)=>sum+readSize(file),0),
  productionHtmlTotal:productionHtml.reduce((sum,file)=>sum+readSize(file),0)
};

for(const [name,value] of Object.entries(measurements)){
  if(value>budgets[name])throw new Error(`${name} budget exceeded: ${(value/KiB).toFixed(1)} KiB / ${(budgets[name]/KiB).toFixed(1)} KiB`);
}
for(const file of productionHtml){
  const size=readSize(file);
  if(size>budgets.productionHtmlSingle)throw new Error(`${file} exceeds single-route HTML budget: ${(size/KiB).toFixed(1)} KiB / ${(budgets.productionHtmlSingle/KiB).toFixed(1)} KiB`);
}

console.log('Commerce performance budgets passed');
for(const [name,value] of Object.entries(measurements))console.log(`- ${name}: ${(value/KiB).toFixed(1)} KiB / ${(budgets[name]/KiB).toFixed(1)} KiB`);
