/* Classic action clock and original SCI route estimator.
 * Source: Jones DOS Pass-2 room1.sc / WhereShouldIGo.sc / n108.sc.
 * Estimated route ticks are source-derived; conversion to playable clock units
 * remains provisional pending a recorded DOS movement trace.
 */
(function(root){'use strict';
 const TURN_UNITS=60;
 // room1.sc:1315: global475 = marble.moveSpeed * 14; marble.moveSpeed=1 at 1066.
 // Main.sc defaults global475 to 20 before the active-turn override.
 const ROUTE_QUANTUM=14;
 const EMPLOYMENT_ENTRY_UNITS=2;
 function whole(value,label){if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid '+label);return value;}
 function originalTravelTicks(steps,quantum=ROUTE_QUANTUM){
   whole(steps,'waypoint steps');whole(quantum,'route quantum');
   if(!quantum)throw Error('Invalid route quantum');
   return steps===0?0:steps+2*quantum;
 }
 // Convert the original rival's itinerary tick *estimate* into an interval of
 // potential TIMEKEEP advances for every legal initial tick carry. The real
 // marble animation update cadence has not been measured in DOSBox. Therefore
 // this is an audit bound on the AI estimator, NOT a proven movement charge.
 function sourceMotionQuantum(moveSpeed=1){
   whole(moveSpeed,'marble move speed');
   if(moveSpeed<1||moveSpeed>100)throw Error('Invalid marble move speed');
   return 14*moveSpeed;
 }
 function routeClockBounds(steps,{moveSpeed=1,elapsed=0}={}){
   whole(steps,'waypoint steps');whole(elapsed,'clock elapsed');
   if(elapsed>TURN_UNITS)throw Error('Clock exceeds weekly limit');
   const quantum=sourceMotionQuantum(moveSpeed);
   const ticks=originalTravelTicks(steps,quantum);
   const earliest=dosClockFrames(elapsed,0,ticks,quantum);
   const latest=dosClockFrames(elapsed,quantum,ticks,quantum);
   return Object.freeze({steps,marbleMoveSpeed:moveSpeed,quantumTicks:quantum,
     aiEstimateTicks:ticks,minimumAdvances:earliest.advancedUnits,
     maximumAdvances:latest.advancedUnits,
     initialCarryRange:Object.freeze([0,quantum]),
     comparisonOnly:true,observedMovement:false,
     source:'room1.sc:1066,1315,1473-1491 + WhereShouldIGo.sc:23-38'});
 }
 function travelBreakdown(steps,entryBase=1,enterEmployment=false){
   whole(steps,'waypoint steps');whole(entryBase,'entry base');
   const walkingUnits=steps===0?0:entryBase+1+Math.floor(steps/25);
   const serviceUnits=steps>0&&enterEmployment?EMPLOYMENT_ENTRY_UNITS:0;
   const reference=routeClockBounds(steps);
   return Object.freeze({walkingUnits,serviceUnits,units:walkingUnits+serviceUnits,
     estimatedTicks:reference.aiEstimateTicks,quantumTicks:ROUTE_QUANTUM,
     referenceMinimumUnits:reference.minimumAdvances,referenceMaximumUnits:reference.maximumAdvances,
     referenceComparisonOnly:true,
     clockLimit:TURN_UNITS,conversion:'provisional-live-v0.5.33; source comparison v0.5.71'});
 }
 // room1.sc timeKeep.doit: an explicit time charge adds its full nominal cost,
 // then caps global323 at 60. Actions are allowed while global323 is below 60.
 // Our save format records REMAINING units, so a 4-unit application at 58/60
 // spends only the last 2 available units. This is distinct from prorated work PAY.
 function cappedActionCharge(remaining,nominal){
   whole(remaining,'clock remaining');whole(nominal,'nominal charge');
   if(remaining>TURN_UNITS)throw Error('Clock exceeds weekly limit');
   return Object.freeze({nominal,charged:Math.min(remaining,nominal),remainingAfter:Math.max(0,remaining-nominal),
     saturated:remaining<nominal,source:'room1.sc:timeKeep.doit'});
 }
 // Exact TIMEKEEP.doIt implicit tick condition in room1.sc:1473–1488.
 // Increment THEN compare strictly greater than global475 (not >=).
 // This is a reference simulator, NOT a claim that browser rAFs equal SCI ticks.
 function dosClockFrames(current,carry,frames,quantum=ROUTE_QUANTUM){
   whole(current,'clock elapsed');whole(carry,'tick carry');whole(frames,'frames');whole(quantum,'tick quantum');
   if(current>TURN_UNITS||!quantum||carry>quantum)throw Error('Invalid DOS clock state');
   const advances=Math.floor((carry+frames)/(quantum+1));
   const nextCarry=(carry+frames)%(quantum+1);
   return Object.freeze({elapsed:Math.min(TURN_UNITS,current+advances),carry:nextCarry,
     advancedUnits:Math.min(TURN_UNITS-current,advances),quantum});
 }
 // Scenarios show how SCI's implicit timeKeep ticks advance at a chosen
 // global475. This is a *bounded what-if* measurement, not a proved playable
 // walking duration: animation frames, start-carry and moveSpeed are unknown.
 function routeClockScenario(steps,{quantum=ROUTE_QUANTUM,carry=0,elapsed=0}={}){
   whole(steps,'waypoint steps');whole(quantum,'tick quantum');whole(carry,'tick carry');whole(elapsed,'clock elapsed');
   const ticks=originalTravelTicks(steps,quantum);
   const clock=dosClockFrames(elapsed,carry,ticks,quantum);
   return Object.freeze({steps,routeTicks:ticks,quantum,startingCarry:carry,startingElapsed:elapsed,
     ...clock,calibrated:false,classification:'SCI AI estimate mapped to TIMEKEEP for audit only'});
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
 // n108.sc localproc_0: compare DOS take-home pay and remaining arrears.
 // In the original, the rental deductions use the FULL six-unit gross even
 // when a partial shift earned less. Keep as reference only until runtime
 // validation; negative or unexpectedly high net is possible in source code.
 function originalGarnishmentReference(hourly,remaining,rentDebt){
   whole(hourly,'hourly wage');whole(remaining,'work time');whole(rentDebt,'rent arrears');
   if(remaining>6)throw Error('Invalid source shift');
   const fullGross=8*hourly,earnedGross=Math.trunc(fullGross*remaining/6),halfGross=Math.trunc(fullGross/2);
   let net=earnedGross,arrearsAfter=rentDebt;
   if(rentDebt>0){
     if(halfGross>rentDebt){net=fullGross-rentDebt;arrearsAfter=0;}
     else{net=halfGross-2;arrearsAfter=rentDebt-halfGross;}
   }
   return Object.freeze({source:'n108.sc:localproc_0',fullGross,earnedGross,net,arrearsAfter,
     rentCredited:rentDebt-arrearsAfter,comparisonOnly:true,
     anomalous:net<0||net>earnedGross||earnedGross-net!==rentDebt-arrearsAfter});
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
   originalTravelTicks,sourceMotionQuantum,routeClockBounds,travelBreakdown,cappedActionCharge,dosClockFrames,routeClockScenario,workProgress,workStanding,originalGarnishmentReference,paycheck,settlePaycheck});
 root.LifeClassicTime=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
