#!/usr/bin/env node
/** Read-only timing audit. Does not mutate game state or infer a DOS tick-to-hour conversion. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Game=require('../src/engine.js');
const Clock=require('../src/classic-time.js');
const g=new Game({ruleset:'classic',mode:'sandbox',seed:553});
const travel=[];
for(const from of g.places)for(const to of g.places){
 if(from.id===to.id)continue;
 const q=g.travelQuote(from.id,to.id,60);
 if(q.estimatedTicks!==Clock.originalTravelTicks(q.steps)||q.hours!==q.walkingHours+q.entryHours)throw Error('Timing oracle diverged');
 travel.push({from:from.name,to:to.name,placeFrom:from.id,placeTo:to.id,waypoints:q.steps,sourceAiEstimateTicks:q.estimatedTicks,
  provisionalPlayerClockUnits:q.hours,employmentEntryUnits:q.entryHours});
}
const employment=[];
for(const remaining of [0,1,2,3,4,5,60]){
 const quote=Clock.cappedActionCharge(remaining,4);
 employment.push({clockRemaining:remaining,nominalTime:4,charged:quote.charged,clockAfter:quote.remainingAfter,allowed:remaining>0});
}
const report={schema:'the-life-loop.dos-clock-audit.v1',version:'0.5.59',source:'Jones DOS 1.000.060 room1.sc timeKeep + employment.sc; WhereShouldIGo.sc AI estimate',
 note:'Source AI tick estimate is NOT a verified player time conversion. No browser animation frames are used for gameplay.',
 constants:{clockLimit:Clock.TURN_UNITS,defaultQuantum:Clock.ROUTE_QUANTUM,employmentEntry:Clock.EMPLOYMENT_ENTRY_UNITS},
 coverage:{venues:g.places.length,directedLegs:travel.length},dosFrameBoundary:[20,21,41,42].map(frames=>({frames,...Clock.dosClockFrames(0,0,frames)})),
 employment,travel};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else{
 console.log('DOS timing audit — The Life Loop v0.5.59');
 console.log(`${travel.length} directed legs checked against the source AI tick estimate; no cost mutation.`);
 console.log('Explicit 4-unit Employment charge at week end:');
 console.table(employment);
 console.log('Sample route checks:');
 console.table(travel.filter(x=>x.placeFrom==='home'&&['agency','bank','market','cinema'].includes(x.placeTo)));
 console.log('Caveat:',report.note);
}
