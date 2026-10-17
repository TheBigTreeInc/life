/* DOS startTrn states 10, 12, 16: food classes and source-linked order.
 * Food item 1 is fresh; 3..5 are short-lived consumables (unidentified here).
 * A same-week purchased/starter fresh portion can be eaten before spoilage
 * as a compatibility meal. DOS exact no-fridge purchase UX is pending. */
(function(root,factory){const api=factory();if(root)root.LifeClassicFood=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window==='undefined'?null:window,function(){
'use strict';
const SHORT_IDS=Object.freeze(['3','4','5']);
function validCount(n){return Number.isSafeInteger(n)&&n>=0&&n<=10000;}
function normalize(input){const raw=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const stock={};for(const id of SHORT_IDS){if(raw[id]!==undefined&&!validCount(raw[id]))throw Error('Invalid Classic short-lived food');stock[id]=raw[id]||0;}return stock;}
function transition({fresh,shortLived={},fed=false,fridge=false,freezer=false,spoilage=true,justPurchased=false}){
 if(!validCount(fresh)||![fed,fridge,freezer,spoilage,justPurchased].every(x=>typeof x==='boolean'))throw Error('Invalid Classic food inputs');
 const temporary=normalize(shortLived),before=fresh;let remaining=fresh;let preparedMeal=false,spoiled=0;
 // Current-game compatibility: a new purchase (or initial starter food) can
 // provide ONE ready meal this week even without cold storage.
 if(!fridge&&spoilage&&justPurchased&&!fed&&remaining>0){remaining--;preparedMeal=true;}
 const capacity=fridge?(freezer?12:6):0;
 if(spoilage){const kept=Math.min(remaining,capacity);spoiled=remaining-kept;remaining=kept;}
 // All identifiers 3..5 expire at the state-12 check. One may satisfy hunger.
 const temporaryTotal=SHORT_IDS.reduce((s,id)=>s+temporary[id],0);
 const ateTemporary=!fed&&!preparedMeal&&temporaryTotal>0;
 const ateFresh=!fed&&!preparedMeal&&!ateTemporary&&remaining>0;
 if(ateFresh)remaining--;
 const ate=!!(fed||preparedMeal||ateTemporary||ateFresh);
 return Object.freeze({sourceStates:Object.freeze([10,12,16]),before,after:remaining,
  spoiled,storageLimit:fridge?capacity:null,ate,ateFresh,ateTemporary,ateFreshThisWeek:preparedMeal,
  clearedShortLived:temporaryTotal,shortLived:Object.freeze({'3':0,'4':0,'5':0}),
  shortage:!ate,consumed:preparedMeal||ateFresh||ateTemporary?1:0});
}
return Object.freeze({schema:'classic-food.v1',SHORT_IDS,normalize,transition});
});
