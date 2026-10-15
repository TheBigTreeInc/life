/* Classic turn lifecycle: an explicit, inspectable boundary between a
 * completed player's turn and the shared beginning of the next week.
 * Source evidence: Jones DOS Pass-2 Player.endTurn / startTrn. The phase
 * ordering inside startTrn remains a migration approximation, not byte parity.
 */
(function(root){'use strict';
const DECAY=3, JOURNAL_LIMIT=72;
const PHASES=Object.freeze(['turn-close','economy','living','rent','loan','reset','week-ready']);
function whole(n,label){if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid '+label);return n;}
function closeTurn(week,dependability,lastClosedWeek=0){
 whole(week,'week');whole(dependability,'dependability');whole(lastClosedWeek,'last close');
 if(week<1||lastClosedWeek>week)throw Error('Invalid Classic close ordering');
 const applied=lastClosedWeek!==week;
 return Object.freeze({applied,before:dependability,after:applied?Math.max(0,dependability-DECAY):dependability,
   lastClosedWeek:applied?week:lastClosedWeek,decay:applied?Math.min(DECAY,dependability):0});
}
function rentAssessment(week,rentDueWeek,rent,lastChargedWeek=0){
 whole(week,'week');whole(rentDueWeek,'rent due week');whole(rent,'rent');whole(lastChargedWeek,'last rent charge');
 if(week<1||rent<1||lastChargedWeek>week)throw Error('Invalid rent assessment');
 const due=week>rentDueWeek&&lastChargedWeek!==week;
 return Object.freeze({due,charge:due?rent:0,nextDueWeek:due?rentDueWeek+4:rentDueWeek,
   lastChargedWeek:due?week:lastChargedWeek});
}
function append(journal,entry){
 if(!Array.isArray(journal)||journal.length>JOURNAL_LIMIT)throw Error('Invalid turn journal');
 if(!entry||!PHASES.includes(entry.phase)||typeof entry.playerId!=='string'||!entry.playerId||entry.playerId.length>24||
   !Number.isSafeInteger(entry.week)||entry.week<1||!Number.isSafeInteger(entry.amount)||entry.amount<0||entry.amount>100000000)
   throw Error('Invalid turn event');
 if(journal.length&&entry.week<journal[journal.length-1].week)throw Error('Turn events are out of order');
 return [...journal, Object.freeze({...entry})].slice(-JOURNAL_LIMIT);
}
function validate(journal,maxWeek,ids){
 if(!Array.isArray(journal)||journal.length>JOURNAL_LIMIT)throw Error('Invalid Classic turn journal');
 let lastWeek=0;
 return journal.map(e=>{
  if(!e||!PHASES.includes(e.phase)||!Number.isSafeInteger(e.week)||e.week<1||e.week>maxWeek||e.week<lastWeek||
    !ids.includes(e.playerId)||!Number.isSafeInteger(e.amount)||e.amount<0||e.amount>100000000)throw Error('Invalid Classic turn journal');
  lastWeek=e.week;
  return {...e};
 });
}
const api=Object.freeze({schema:'classic-turn-sequence.v1',DECAY,JOURNAL_LIMIT,PHASES,closeTurn,rentAssessment,append,validate});
root.LifeClassicTurnSequence=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
