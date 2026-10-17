/* DOS startTrn.sc source states. Only verified behavior is executable;
 * remaining states remain in the evidence catalog, not synthetic gameplay.
 */
(function(root){'use strict';
const SOURCE_STATES=Object.freeze({lottery:2,computerBonus:4,relaxation:6,foodStorage:10,foodShortage:12,cashStress:14,consumption:16,workClothing:18,loanDue:20,economicHeadline:24,scandal:26,emergencyClothing:34});
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
// startTrn.sc state 20 is checked during the FOURTH (completed) week.
// The engine opens the next week first and passes closedWeek here. The original
// checks paySched=0 for a reminder and paySched<0 for -1 happiness; our paid
// month counter cannot reproduce every underlying paySched transition.
function loanDueTrace(closedWeek,paidThrough,balance){
 if(!Number.isSafeInteger(closedWeek)||closedWeek<1||closedWeek>10000||!Number.isSafeInteger(paidThrough)||paidThrough<0||paidThrough>10000||
 !Number.isSafeInteger(balance)||balance<0||balance>1e9)throw Error('Invalid DOS loan schedule');
 const due=closedWeek%4===0&&balance>0;
 const dueMonth=Math.floor(closedWeek/4),overdueMonths=due?Math.max(0,dueMonth-paidThrough):0;
 return Object.freeze({sourceState:SOURCE_STATES.loanDue,due,closedWeek,dueMonth,balance,paidThrough,
  missed:due&&overdueMonths>0,overdueMonths,notice:due?(overdueMonths>1?'late':overdueMonths===1?'payment-required':'covered'):'none',
  sourcePenaltyWhenPaySchedNegative:-1,penaltyVerified:false});
}
// startTrn.sc state 10 runs before state 12 weekly food consumption. Appliance
// 21=fridge, 22=freezer, and consumable 1 is fresh food. Source-backed -2/-1.
function foodStorageTrace(before,after,hasFridge,hasFreezer){
 for(const value of [before,after])if(!Number.isSafeInteger(value)||value<0||value>10000)throw Error('Invalid food storage quantity');
 if(after>before||typeof hasFridge!=='boolean'||typeof hasFreezer!=='boolean')throw Error('Invalid appliance state');
 const maximum=hasFridge?(hasFreezer?12:6):0;
 const expected=Math.min(before,maximum);
 if(after!==expected)throw Error('Invalid DOS storage result');
 const lost=before-after;
 return Object.freeze({sourceState:SOURCE_STATES.foodStorage,before,after,lost,storageLimit:hasFridge?maximum:null,
  spoiledFresh:!hasFridge&&before>0,happinessDelta:lost>0?(!hasFridge?-2:-1):0,
  sourceVerified:true,order:'before-consumption'});
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
// startTrn.sc states 12/14, DOS 1.000.060. Only the no-food branch
// (local6 === 0) can currently be reproduced with Life's pantry model.
// Source order: one 0..3 roll at state 12, optional 0..4 relaxation-floor
// override, then (if triggered with cash) one 30..cap draw.
function cashStress({shortage,spoiledFresh=false,relaxation,cash,random}){
 if(typeof shortage!=='boolean'||typeof spoiledFresh!=='boolean'||(shortage&&spoiledFresh)||!Number.isSafeInteger(relaxation)||relaxation<10||relaxation>30||
   !Number.isSafeInteger(cash)||cash<0||cash>1e9||typeof random!=='function')throw Error('Invalid DOS cash stress inputs');
 const draw=max=>{const n=random();if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>=1)throw Error('Invalid DOS event roll');return Math.floor(n*(max+1));};
 if(!shortage&&!spoiledFresh)return Object.freeze({sourceState:SOURCE_STATES.cashStress,eligible:false,triggered:false,expense:0,happinessDelta:0,roll:null,floorRoll:null});
 // startTrn.sc state 14: local6=-1 (unrefrigerated spoiled fresh food)
 // receives Random(0,1), whereas local6=0 (no food) receives Random(0,3).
 const roll=draw(spoiledFresh?1:3),floorRoll=relaxation===10?draw(4):null;
 const eligible=roll===0||floorRoll===0;
 if(!eligible||cash===0)return Object.freeze({sourceState:SOURCE_STATES.cashStress,eligible,triggered:false,expense:0,happinessDelta:0,roll,floorRoll});
 const cap=Math.min(cash,cash<500?50:200);
 const expense=cap>30?30+draw(cap-30):cap;
 return Object.freeze({sourceState:SOURCE_STATES.cashStress,eligible:true,triggered:true,expense,happinessDelta:-4,roll,floorRoll});
}
// Source state 24's actual happiness amounts, *not* a mapping from Life's
// speculative macro phase. Do not apply without the original global373 value.
function headlineHappiness(eventCode,hasInvestments,boomFlag=false){
 if(!Number.isSafeInteger(eventCode)||eventCode<0||eventCode>4||
   typeof hasInvestments!=='boolean'||typeof boomFlag!=='boolean')throw Error('Invalid DOS headline');
 const base=[0,-3,-2,-1,0][eventCode],extra=[0,-5,-2,-1,0][eventCode];
 return Object.freeze({sourceState:SOURCE_STATES.economicHeadline,eventCode,delta:base+(hasInvestments?extra:0)+(eventCode===4&&boomFlag&&hasInvestments?5:0),sourceMapped:true,triggerVerified:false});
}
function emergencyClothingTrace(weeksStranded,amount){
 if(!Number.isSafeInteger(weeksStranded)||weeksStranded<0||weeksStranded>10000||
   !Number.isSafeInteger(amount)||amount<0||amount>10000)throw Error('Invalid DOS emergency clothing trace');
 return Object.freeze({sourceState:SOURCE_STATES.emergencyClothing,consecutiveChecks:weeksStranded,amount,
  // Only the original two-check eligibility is source-linked; $90 and cooldown are not.
  payoutVerified:false,cooldownVerified:false});
}
const api=Object.freeze({schema:'classic-weekly-events.v3',SOURCE_STATES,computerBonus,relaxationStep,loanDueTrace,foodStorageTrace,clothingWarning,foodShortageTrace,cashStress,headlineHappiness,emergencyClothingTrace});
root.LifeClassicWeeklyEvents=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
