/* Classic DOS economic-index migration, pass 3.
 * Source verified: eight EconomicIndex domains, 100 initial readings and 10..190
 * bounds; goods prices use Pass-2 source arithmetic. The drift/correlation and
 * wage/market binding below are deterministic COMPATIBILITY APPROXIMATIONS,
 * not a byte-for-byte port of EconomicIndex.sc / JobDItem.
 */
(function(root){'use strict';
const Pass2=root.LifeClassicPass2||(typeof require==='function'?require('./classic-pass2-rules.js'):null);
if(!Pass2)throw Error('Classic Pass-2 rules required');
const keys=Object.freeze(['general','investments','goods','gold','silver','pork','blue','penny']);
const volatile=Object.freeze({general:4,investments:6,goods:5,gold:8,silver:11,pork:13,blue:9,penny:16});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function initial(){return {schema:'classic-economic-indices.v1',readings:Object.fromEntries(keys.map(k=>[k,100])),momentum:Object.fromEntries(keys.map(k=>[k,0]))};}
function validate(value){
 if(!value||value.schema!=='classic-economic-indices.v1'||!value.readings||!value.momentum||
     keys.some(k=>!Number.isInteger(value.readings[k])||value.readings[k]<10||value.readings[k]>190||
       !Number.isInteger(value.momentum[k])||Math.abs(value.momentum[k])>12))throw Error('Invalid Classic economic indices');
 return {schema:'classic-economic-indices.v1',readings:Object.fromEntries(keys.map(k=>[k,value.readings[k]])),
   momentum:Object.fromEntries(keys.map(k=>[k,value.momentum[k]]))};
}
function fromLegacy(goodsIndex=100,main=100){
 const state=initial();state.readings.goods=clamp(Math.floor(goodsIndex),10,190);
 state.readings.general=clamp(Math.round(main),10,190);return state;
}
function advance(state,random){
 const prior=validate(state),next=initial(),changes={};
 // Shared macro trend first; other readings reference that move, not an
 // independent random price multiplier per feature.
 const macroRandom=Math.floor(random()*9)-4;
 const macroDelta=clamp(Math.round(prior.momentum.general*.5+(100-prior.readings.general)*.06+macroRandom),-8,8);
 for(const key of keys){
   const old=prior.readings[key];
   const raw=Math.floor(random()*(volatile[key]*2+1))-volatile[key];
   const anchor=key==='general'?0:key==='goods'?macroDelta*.7:key==='investments'?macroDelta*.85:
     (prior.readings.investments-100)*.045+macroDelta*.45;
   const pull=key==='general'?macroDelta:Math.round((100-old)*.055+prior.momentum[key]*.32+anchor+raw*.38);
   const delta=clamp(pull,-12,12),reading=clamp(old+delta,10,190);
   next.readings[key]=reading;next.momentum[key]=clamp(reading-old,-12,12);
   changes[key]=reading-old;
 }
 return {state:next,changes};
}
function wageQuote(base,reading){
 if(!Number.isSafeInteger(base)||base<1)throw Error('Invalid job base wage');
 // Temporary bridge from original integer price transform to existing playable
 // hourly rates. The DOS-specific wage index is not yet established.
 return Pass2.goodsPrice(base,reading);
}
function marketPrice(previous,fromReading,toReading,base){
 if(!Number.isFinite(previous)||previous<0||!Number.isFinite(base)||base<1)throw Error('Invalid bank price');
 return clamp(Math.round(previous*toReading/Math.max(10,fromReading)),Math.max(1,Math.floor(base*.5)),Math.ceil(base*2.5));
}
const api=Object.freeze({schema:'classic-economic-indices.v1',keys,initial,validate,fromLegacy,advance,wageQuote,marketPrice});
root.LifeClassicEconomy=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
