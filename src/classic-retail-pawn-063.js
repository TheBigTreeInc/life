/* DOS Jones 1.000.060 market.sc, pawnShop.sc and economicIndex.sc.
 * Original arithmetic with explicit boundaries. The Life Loop keeps a
 * reference-price proxy because item-specific pricePaid is not yet tracked.
 * Event/headline functions are evidence-only until the full source RNG state
 * and monthly index trend are migrated.
 */
(function(root){'use strict';
const Pass2=root.LifeClassicPass2||(typeof require==='function'?require('./classic-pass2-rules.js'):null);
if(!Pass2)throw Error('DOS adjusted-price source adapter required');
const MARKET=Object.freeze([{units:1,basePrice:55},{units:2,basePrice:100},{units:4,basePrice:190}]);
const int=(x,label)=>{if(!Number.isSafeInteger(x))throw Error('Invalid '+label);return x;};
function pawnQuote(pricePaid,goodsIndex){
 int(pricePaid,'purchase price');int(goodsIndex,'goods index');
 if(pricePaid<1||pricePaid>1000000||goodsIndex<10||goodsIndex>190)throw Error('Invalid DOS pawn inputs');
 const adjusted=Pass2.goodsPrice(pricePaid,goodsIndex);
 return Object.freeze({payout:Math.trunc(adjusted*4/10),redemption:Math.trunc(pricePaid/2),referencePaid:pricePaid,goodsIndex,source:'pawnShop.sc:775-815'});
}
function marketQuotes(goodsIndex){
 int(goodsIndex,'goods index');if(goodsIndex<10||goodsIndex>190)throw Error('Invalid DOS goods index');
 return MARKET.map(m=>Object.freeze({...m,price:Pass2.goodsPrice(m.basePrice,goodsIndex)}));
}
// economicIndex.sc 41-145: a read-only exact per-index source comparator.
// Never alters the live compatibility economy or consumes game RNG.
function economicIndexStep({reading,index=0,risk=4,parent=0,crisis=0,boom=false},draw){
 [reading,index,risk,parent,crisis].forEach((v,i)=>int(v,['reading','index','risk','parent','crisis'][i]));
 if(reading<10||reading>190||index< -6||index>6||risk<0||risk>10||parent< -50||parent>50||crisis<0||crisis>3||typeof boom!=='boolean'||typeof draw!=='function')throw Error('Invalid DOS index state');
 const roll=(lo,hi)=>{const n=draw(lo,hi);if(!Number.isSafeInteger(n)||n<lo||n>hi)throw Error('Invalid DOS random draw');return n;};
 if(crisis){index=index> -3?Math.max(-3,index-3):index-1;}
 else if(boom){index=index<3?Math.min(3,index+3):index+1;}
 const high=reading<40?2:reading<70?1:0;
 const low=reading>160?2:reading>130?1:0;
 const trend=roll(-3-low,3+high);
 if(trend<index)index=Math.max(-3-low,index-1);
 else if(trend>index)index=Math.min(3+high,index+1);
 const min=index<0?-3+2*index:-3;
 const max=index>0?3+2*index:3;
 let adjustment=roll(min,max);
 if(adjustment===min)adjustment-=roll(0,risk*Math.abs(index));
 // Intentionally mirror the original second comparison to 'lowerRange',
 // NOT to upperRange: it can be true after the first deduction.
 if(adjustment===min)adjustment+=roll(0,risk*Math.abs(index));
 let next=reading+adjustment+Math.trunc(parent/3);
 if(crisis)next=Math.trunc(next*(16+crisis)/20);
 else if(boom)next=Math.trunc(next*11/10);
 return Object.freeze({index,reading:Math.max(10,Math.min(190,next)),adjustment});
}
// economicIndex.sc:205-220; returns only the original event eligibility and
// draws. Trigger frequency depends on global374, which is not modeled yet.
function headlineEligibility({reading,week,global374},draw){
 [reading,week,global374].forEach((v,i)=>int(v,['reading','week','global374'][i]));
 if(reading<10||reading>190||week<1||week>10000||global374<0||global374>10000||typeof draw!=='function')throw Error('Invalid DOS headline inputs');
 const roll=(max)=>{const n=draw(0,max);if(!Number.isSafeInteger(n)||n<0||n>max)throw Error('Invalid DOS event roll');return n;};
 let crisis=0,boom=false;
 if(reading>=80&&week>=4&&roll(global374*20)===0)crisis=roll(2)+1;
 else if(reading<=120)boom=roll(global374*30)===0;
 return Object.freeze({crisis,boom,source:'economicIndex.sc:205-220',integrated:false});
}
const api=Object.freeze({schema:'classic-retail-pawn-economy.v1',MARKET,pawnQuote,marketQuotes,economicIndexStep,headlineEligibility});
root.LifeClassicRetailPawn=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
