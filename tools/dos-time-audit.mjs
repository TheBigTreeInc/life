#!/usr/bin/env node
/** Read-only timing audit. Does not mutate game state or infer a DOS tick-to-hour conversion. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const Game=require('../src/engine.js');
const Clock=require('../src/classic-time.js');
const version=JSON.parse(readFileSync(resolve(import.meta.dirname,'../package.json'),'utf8')).version;
const g=new Game({ruleset:'classic',mode:'sandbox',seed:553});
const travel=[];
for(const from of g.places)for(const to of g.places){
 if(from.id===to.id)continue;
 const q=g.travelQuote(from.id,to.id,60);
 const bounded=Clock.routeClockBounds(q.steps);
 if(q.estimatedTicks!==bounded.aiEstimateTicks||q.hours!==q.walkingHours+q.entryHours)throw Error('Timing oracle diverged');
 travel.push({from:from.name,to:to.name,placeFrom:from.id,placeTo:to.id,waypoints:q.steps,sourceAiEstimateTicks:q.estimatedTicks,
  provisionalPlayerClockUnits:q.hours,employmentEntryUnits:q.entryHours,
  sourceReferenceMin:bounded.minimumAdvances,sourceReferenceMax:bounded.maximumAdvances,
  // These references describe the DOS AI estimate, not observed player travel.
  referenceComparisonOnly:true,requiresDosBoxCalibration:true});
}
const employment=[];
for(const remaining of [0,1,2,3,4,5,60]){
 const quote=Clock.cappedActionCharge(remaining,4);
 employment.push({clockRemaining:remaining,nominalTime:4,charged:quote.charged,clockAfter:quote.remainingAfter,allowed:remaining>0});
}
const differences=travel.filter(x=>x.provisionalPlayerClockUnits<x.sourceReferenceMin||x.provisionalPlayerClockUnits>x.sourceReferenceMax);
const report={schema:'the-life-loop.dos-clock-audit.v2',version,source:'Jones DOS 1.000.060 room1.sc timeKeep + employment.sc; WhereShouldIGo.sc AI estimate',
 note:'Source AI route estimate and frame bounds are NOT verified player clock conversion. No browser animation frames are used for gameplay. Actual DOSBox traces are still required.',
 evidence:{motionSpeed:'room1.sc:1066 moveSpeed=1',activeQuantum:'room1.sc:1315 global475=moveSpeed*14',
  tickThreshold:'room1.sc:1484 ++carry > global475',aiRoute:'WhereShouldIGo.sc:23-38 steps + 2*global475'},
 constants:{clockLimit:Clock.TURN_UNITS,defaultQuantum:Clock.ROUTE_QUANTUM,employmentEntry:Clock.EMPLOYMENT_ENTRY_UNITS},
 coverage:{venues:g.places.length,directedLegs:travel.length,legsOutsideSourceAiFrameEstimate:differences.length,
  sourceEstimateNotPlayerCharge:true},dosFrameBoundary:[14,15,29,30].map(frames=>({frames,...Clock.dosClockFrames(0,0,frames)})),
 employment,travel};
if(process.argv.includes('--write')){
 const output=resolve(import.meta.dirname,'../docs/reference/dos-route-clock-071.json');
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(`Wrote ${output}`);
}else if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else{
 console.log('DOS timing audit — The Life Loop v'+version);
 console.log(`${travel.length} directed legs checked against the source AI tick estimate; no cost mutation.`);
 console.log(`${differences.length} legs have live clock quotes outside the source-AI-estimator bound (NOT proof of a bug).`);
 console.log('Explicit 4-unit Employment charge at week end:');
 console.table(employment);
 console.log('Sample route checks:');
 console.table(travel.filter(x=>x.placeFrom==='home'&&['agency','bank','market','cinema'].includes(x.placeTo)));
 console.log('Caveat:',report.note);
}
