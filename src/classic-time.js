/* Classic action clock and original SCI route estimator.
 * Source: Jones DOS Pass-2 room1.sc / WhereShouldIGo.sc / n108.sc.
 * Estimated route ticks are source-derived; conversion to playable clock units
 * remains provisional pending a recorded DOS movement trace.
 */
(function(root){'use strict';
 const TURN_UNITS=60;
 const ROUTE_QUANTUM=20;
 const EMPLOYMENT_ENTRY_UNITS=2;
 function whole(value,label){if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid '+label);return value;}
 function originalTravelTicks(steps,quantum=ROUTE_QUANTUM){
   whole(steps,'waypoint steps');whole(quantum,'route quantum');
   if(!quantum)throw Error('Invalid route quantum');
   return steps===0?0:steps+2*quantum;
 }
 function travelBreakdown(steps,entryBase=1,enterEmployment=false){
   whole(steps,'waypoint steps');whole(entryBase,'entry base');
   const walkingUnits=steps===0?0:entryBase+1+Math.floor(steps/25);
   const serviceUnits=steps>0&&enterEmployment?EMPLOYMENT_ENTRY_UNITS:0;
   return Object.freeze({walkingUnits,serviceUnits,units:walkingUnits+serviceUnits,
     estimatedTicks:originalTravelTicks(steps),quantumTicks:ROUTE_QUANTUM,
     clockLimit:TURN_UNITS,conversion:'provisional-v0.5.33'});
 }
 function workProgress(remaining){whole(remaining,'work time');return remaining>0?1:0;}
 // n108.sc: dismissal is checked before the single low-reliability warning.
 // The warning is gated to one eligible attempt per weekly action turn.
 function workStanding(dependability,requiredDependability,warningAlreadyShown=false){
   whole(dependability,'dependability');whole(requiredDependability,'job dependability');
   if(dependability<requiredDependability-5)return 'dismissal';
   if(dependability<requiredDependability-2&&!warningAlreadyShown)return 'warning';
   return 'ready';
 }
 // Provisional *garnishment* calculation, isolated from source-derived gross.
 // Exact n108.sc temp0/temp1 overwrite and debt-fee ordering need a DOS trace.
 function paycheck(hourly,remaining,rentDebt=0){
   whole(hourly,'hourly wage');whole(remaining,'work time');whole(rentDebt,'rent arrears');
   const gross=Math.floor(hourly*8*Math.min(6,remaining)/6);
   const fullGross=hourly*8;
   const garnished=Math.min(rentDebt,Math.floor(gross/2));
   const fee=garnished>0&&garnished<rentDebt?Math.min(2,gross-garnished):0;
   // Source warns some DOS debt paths work from fullGross, not partial gross.
   // This is a *comparison bound*, not an alternative proven DOS payoff rule.
   const fullGrossBasis=Math.min(gross,rentDebt,Math.floor(fullGross/2));
   return Object.freeze({fullGross,gross,garnished,fee,net:gross-garnished-fee,
     arrearsAfter:rentDebt-garnished,fullGrossBasis,
     fullGrossBasisDifference:fullGrossBasis-garnished,
     semantics:'provisional-garnishment-v0.5.35'});
 }
 // Authoritative in-game settlement: preview and action share the same quote.
 // Pure and guarded so cash, debt, fee and net cannot silently diverge.
 function settlePaycheck(cash,rentDebt,quote){
   whole(cash,'cash');whole(rentDebt,'rent arrears');
   if(!quote||!Object.isFrozen(quote)||quote.garnished>rentDebt||quote.arrearsAfter!==rentDebt-quote.garnished||
      quote.gross!==quote.net+quote.garnished+quote.fee||quote.net<0)throw Error('Invalid paycheck settlement');
   return Object.freeze({cashBefore:cash,cashAfter:cash+quote.net,
     rentDebtBefore:rentDebt,rentDebtAfter:quote.arrearsAfter,
     gross:quote.gross,garnished:quote.garnished,fee:quote.fee,net:quote.net});
 }

 const api=Object.freeze({schema:'classic-time.v1',TURN_UNITS,ROUTE_QUANTUM,EMPLOYMENT_ENTRY_UNITS,
   originalTravelTicks,travelBreakdown,workProgress,workStanding,paycheck,settlePaycheck});
 root.LifeClassicTime=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
