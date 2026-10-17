/* DOS Jones 1.000.060 consumable identity and week boundary.
 * Source: room1.sc Player init, market.sc and fastFood.sc CostDItems,
 * startTrn.sc states 8, 10, 12, 14, 16, Goods.sc Consumable.doit.
 * New Classic games use this model. Old saves keep their legacy pantry path.
 */
(function(root,factory){
 const api=factory();if(root)root.LifeClassicConsumables=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window,function(){'use strict';
 const MEALS=Object.freeze([
  Object.freeze({index:3,name:'Hamburgers',basePrice:79,happiness:0}),
  Object.freeze({index:4,name:'Cheeseburgers',basePrice:89,happiness:1}),
  Object.freeze({index:2,name:'Astro Chicken',basePrice:124,happiness:2}),
  Object.freeze({index:5,name:'Fries',basePrice:65,happiness:0})]);
 const KEYS=['2','3','4','5'];
 const start=()=>({'2':0,'3':0,'4':0,'5':0});
 // Interoperable legacy takeaway shape (indices 3,4,5), intentionally a view;
 // index #2 (Astro Chicken) remains a separate long-lived DOS consumable.
 function legacyCategories(items){
  const state=items==null?start():validate(items);
  return Object.freeze({'3':state['3'],'4':state['4'],'5':state['5']});
 }

 function validate(s){
  if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length!==4||
    !KEYS.every(k=>Object.hasOwn(s,k)&&Number.isSafeInteger(s[k])&&s[k]>=0&&s[k]<=10))throw Error('Invalid Classic DOS consumables');
  return Object.fromEntries(KEYS.map(k=>[k,s[k]]));
 }
 function week({fresh,takeout,hasFridge,hasFreezer,spoilage=true,alreadyFed=false}){
  const item=validate(takeout);
  if(!Number.isSafeInteger(fresh)||fresh<0||fresh>10000||[hasFridge,hasFreezer,spoilage,alreadyFed].some(x=>typeof x!=='boolean'))throw Error('Invalid DOS food state');
  // The original picks the highest index with food in state 8, before state 10.
  const sourceFood=[5,4,3,2,1].find(n=>n===1?fresh>0:item[n]>0)||0;
  let stored=fresh,loss=0,storagePenalty=0,spoiled=false;
  if(spoilage&&fresh){
   const capacity=!hasFridge?0:hasFreezer?12:6;
   stored=Math.min(fresh,capacity);loss=fresh-stored;
   if(loss){spoiled=!hasFridge;storagePenalty=spoiled?-2:-1;}
  }
  // State 12 discards food indices 3/4/5; index 2 lasts and state 16
  // decrements it. Source index 1 is marked spoiled (local6=-1) if lost.
  const chosen=sourceFood===1&&spoiled?-1:sourceFood;
  const shortage=chosen===0&&!alreadyFed;
  let freshAfter=stored;
  if(freshAfter>0)freshAfter--; // state 16: Consumable.doit for item #1
  const after={...item};
  if(after['2']>0)after['2']--;
  for(const k of ['3','4','5'])after[k]=0;
  const hadFood=!!chosen||alreadyFed;
  return Object.freeze({sourceStateOrder:[8,10,12,14,16],chosen,hadFood,shortage,
   freshBefore:fresh,freshAfter,storedBeforeConsumption:stored,
   foodAfter:after,discardedTakeout: item['3']+item['4']+item['5'],
   storageLoss:loss,storagePenalty,spoiledFresh:spoiled,
   // Dedicated over-time hunger remains Life compatibility: DOS never had this stat.
   hungerIncrease:shortage?1:0,shortagePenalty:shortage?-2:0,
   cashStressKind:alreadyFed?null:chosen===0?'shortage':chosen===-1?'spoiled':null});
 }
 return Object.freeze({schema:'classic-consumables.v1',MEALS,start,validate,legacyCategories,week});
});
