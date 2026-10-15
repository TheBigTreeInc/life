/* Classic household compatibility adapter.
 * Uses only saved inventory / equipment condition: no RNG and no new fields.
 * Entertainment and rest recovery amounts remain gameplay approximations;
 * hot-tub appliance #28 is not mapped until its original item identity exists.
 */
(function(root){'use strict';
function inspect(player){
 if(!player||!Array.isArray(player.owned)||!player.classicEquipment||typeof player.classicEquipment!=='object')throw Error('Invalid Classic household');
 const working=id=>player.owned.includes(id)&&player.classicEquipment[id]?.broken!==true;
 const stereo=working('stereo'),vcr=working('vcr'),fridge=working('fridge'),freezer=working('freezer');
 return Object.freeze({computer:working('computer'),fridge,freezer,stereo,vcr,
  coldStorage:fridge?(freezer?12:6):0,comfortBonus:(stereo?3:0)+(vcr?3:0)});
}
function restQuote(player){
 const home=inspect(player);
 if(!Number.isSafeInteger(player.classicRelaxation)||player.classicRelaxation<10||player.classicRelaxation>30||
  !Number.isFinite(player.happiness)||!Number.isFinite(player.energy))throw Error('Invalid Classic rest attributes');
 const happiness=Math.max(0,Math.min(100-player.happiness,16+home.comfortBonus));
 const energy=Math.max(0,Math.min(100-player.energy,24));
 const relaxation=Math.min(30-player.classicRelaxation,6);
 return Object.freeze({home,happiness,energy,relaxation,needed:happiness>0||energy>0||relaxation>0});
}
// Source-independent maintenance planning: the 20% repair price is a Life Loop
// approximation. This is a read-only quote and does not reserve or spend cash.
const REPAIR_ORDER=Object.freeze(['fridge','freezer','computer','stereo','vcr']);
function repairCandidates(player,referencePrices,reserve=0){
 inspect(player);
 if(!referencePrices||typeof referencePrices!=='object'||!Number.isSafeInteger(player.cash)||player.cash<0||
    !Number.isSafeInteger(reserve)||reserve<0)throw Error('Invalid maintenance budget');
 const discretionary=Math.max(0,player.cash-reserve);
 const choices=REPAIR_ORDER.filter(id=>player.owned.includes(id)&&player.classicEquipment[id]?.broken===true)
  .map(id=>{
   const value=referencePrices[id];
   if(!Number.isSafeInteger(value)||value<=0)throw Error('Invalid reference value for '+id);
   const cost=Math.ceil(value*.20);
   return Object.freeze({id,cost,affordable:cost<=discretionary,protectsEssentials:cost<=discretionary,estimatedCashAfter:player.cash-cost});
  });
 return Object.freeze({reserve,discretionary,choices:Object.freeze(choices),best:choices.find(q=>q.affordable)||null});
}
const api=Object.freeze({schema:'classic-household.v2',inspect,restQuote,repairCandidates});
root.LifeClassicHousehold=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
