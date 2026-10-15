/* DOS startTrn.sc source states. Only verified behavior is executable;
 * remaining states remain in the evidence catalog, not synthetic gameplay.
 */
(function(root){'use strict';
const SOURCE_STATES=Object.freeze({lottery:2,computerBonus:4,relaxation:6,foodStorage:10,foodShortage:12,consumption:16,workClothing:18,loanDue:20,economicHeadline:24,scandal:26,emergencyClothing:34});
function computerBonus(ownsComputer,random){
 if(!ownsComputer)return Object.freeze({sourceState:SOURCE_STATES.computerBonus,eligible:false,awarded:0});
 if(typeof random!=='function')throw Error('Random source required');
 const win=Math.floor(random()*7)===0;
 return Object.freeze({sourceState:SOURCE_STATES.computerBonus,eligible:true,awarded:win?20+Math.floor(random()*81):0});
}
// DOS state 6 reduces relaxation by one to a minimum of ten without item 28.
// The Life Loop has no faithful hot-tub item yet: do not substitute a stereo.
function relaxationStep(before,hasHotTub=false){
 if(!Number.isSafeInteger(before)||before<10||before>30||typeof hasHotTub!=='boolean')throw Error('Invalid DOS relaxation state');
 const after=hasHotTub?before:Math.max(10,before-1);
 return Object.freeze({sourceState:SOURCE_STATES.relaxation,before,after,hasHotTub,delta:after-before});
}
// DOS state 20 checks the loan schedule every fourth week. Delinquency
// consequences retain the game's existing compatibility rules.
function loanDueTrace(week,paidThrough,balance){
 if(!Number.isSafeInteger(week)||week<1||week>10000||!Number.isSafeInteger(paidThrough)||paidThrough<0||paidThrough>10000||
 !Number.isSafeInteger(balance)||balance<0||balance>1e9)throw Error('Invalid DOS loan schedule');
 const due=week>1&&week%4===1&&balance>0;
 const dueMonth=Math.floor((week-1)/4);
 return Object.freeze({sourceState:SOURCE_STATES.loanDue,due,dueMonth,balance,paidThrough,missed:due&&paidThrough<dueMonth,
  penaltyVerified:false});
}
function foodStorageTrace(before,after,hasFridge,hasFreezer){
 for(const value of [before,after])if(!Number.isSafeInteger(value)||value<0||value>10000)throw Error('Invalid food storage quantity');
 if(typeof hasFridge!=='boolean'||typeof hasFreezer!=='boolean')throw Error('Invalid appliance state');
 return Object.freeze({sourceState:SOURCE_STATES.foodStorage,before,after,lost:Math.max(0,before-after),
  storageLimit:hasFridge?(hasFreezer?12:6):null,
  // The original has a conditional spoilage roll without a recovered rate.
  probabilityVerified:false});
}
function clothingWarning(weeksBefore,weeksAfter){
 if(!Number.isSafeInteger(weeksBefore)||!Number.isSafeInteger(weeksAfter)||weeksBefore<0||weeksAfter<0||weeksAfter>weeksBefore)throw Error('Invalid clothing wear');
 return Object.freeze({sourceState:SOURCE_STATES.workClothing,oneWeekRemaining:weeksBefore>1&&weeksAfter===1,expired:weeksBefore===1&&weeksAfter===0});
}
function foodShortageTrace(hadMeal,pantryBefore,pantryAfter,hungerAfter){
 if(typeof hadMeal!=='boolean'||![pantryBefore,pantryAfter,hungerAfter].every(Number.isSafeInteger)||
   pantryBefore<0||pantryAfter<0||pantryAfter>pantryBefore||hungerAfter<0||hungerAfter>4)throw Error('Invalid DOS food-shortage trace');
 // State 12 verifies food shortage handling. The existing hunger reduction is
 // intentionally not modified: DOS consumables ID 3–5 are not modeled yet.
 return Object.freeze({sourceState:SOURCE_STATES.foodShortage,shortage:!hadMeal&&pantryBefore===0,pantryUsed:pantryBefore-pantryAfter,hungerAfter});
}
function emergencyClothingTrace(weeksStranded,amount){
 if(!Number.isSafeInteger(weeksStranded)||weeksStranded<0||weeksStranded>10000||
   !Number.isSafeInteger(amount)||amount<0||amount>10000)throw Error('Invalid DOS emergency clothing trace');
 return Object.freeze({sourceState:SOURCE_STATES.emergencyClothing,consecutiveChecks:weeksStranded,amount,
  // Only the original two-check eligibility is source-linked; $90 and cooldown are not.
  payoutVerified:false,cooldownVerified:false});
}
const api=Object.freeze({schema:'classic-weekly-events.v2',SOURCE_STATES,computerBonus,relaxationStep,loanDueTrace,foodStorageTrace,clothingWarning,foodShortageTrace,emergencyClothingTrace});
root.LifeClassicWeeklyEvents=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
