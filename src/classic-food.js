/* Legacy Classic food compat for older local game branches (states 10/12/16).
 * New DOS campaigns use src/classic-consumables-064.js instead. */
(function(root,factory){const api=factory();if(root)root.LifeClassicFood=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window==='undefined'?null:window,function(){
'use strict';
const SHORT_IDS=Object.freeze(['3','4','5']);
function validCount(n){return Number.isSafeInteger(n)&&n>=0&&n<=10000;}
function normalize(input){const raw=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const stock={};for(const id of SHORT_IDS){if(raw[id]!==undefined&&!validCount(raw[id]))throw Error('Invalid Classic short-lived food');stock[id]=raw[id]||0;}return stock;}
function transition({fresh,shortLived={},fed=false,fridge=false,freezer=false,spoilage=true,justPurchased=false}){
 if(!validCount(fresh)||![fed,fridge,freezer,spoilage,justPurchased].every(x=>typeof x==='boolean'))throw Error('Invalid Classic food inputs');
 const temporary=normalize(shortLived),before=fresh;let remaining=fresh;let preparedMeal=false,spoiled=0;
 // Legacy compatibility: fresh bought this week may feed once without refrigeration.
 if(!fridge&&spoilage&&justPurchased&&!fed&&remaining>0){remaining--;preparedMeal=true;}
 const capacity=fridge?(freezer?12:6):0;
 if(spoilage){const kept=Math.min(remaining,capacity);spoiled=remaining-kept;remaining=kept;}
 const temporaryTotal=SHORT_IDS.reduce((sum,id)=>sum+temporary[id],0);
 const ateTemporary=!fed&&!preparedMeal&&temporaryTotal>0;
 const ateFresh=!fed&&!preparedMeal&&!ateTemporary&&remaining>0;
 if(ateFresh)remaining--;
 const ate=!!(fed||preparedMeal||ateTemporary||ateFresh);
 return Object.freeze({sourceStates:Object.freeze([10,12,16]),before,after:remaining,
  spoiled,storageLimit:fridge?capacity:null,ate,ateFresh,ateTemporary,ateFreshThisWeek:preparedMeal,
  clearedShortLived:temporaryTotal,shortLived:Object.freeze({'3':0,'4':0,'5':0}),
  shortage:!ate,consumed:preparedMeal||ateFresh||ateTemporary?1:0});
}
return Object.freeze({schema:'classic-food.v1-compat',SHORT_IDS,normalize,transition});
});
