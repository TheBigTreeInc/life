#!/usr/bin/env node
/** Reproducible, read-only pacing baseline: never claims observed DOS runtime. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const Game=require('../src/engine.js');
const Clock=require('../src/classic-time.js');
const root=resolve(import.meta.dirname,'..');
const version=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version;
const game=new Game({ruleset:'classic',mode:'sandbox',seed:557});
const journeys=[];
for(const a of game.places)for(const b of game.places){
 if(a.id===b.id)continue;
 const quote=game.travelQuote(a.id,b.id,60);
 const bounds=Clock.routeClockBounds(quote.steps);
 journeys.push({from:a.id,to:b.id,waypoints:quote.steps,chargedUnits:quote.hours,
  estimatedDosAiTicks:quote.estimatedTicks,dosAiReferenceMin:bounds.minimumAdvances,
  dosAiReferenceMax:bounds.maximumAdvances,referenceOnly:true});
}
const sum=(items,key)=>items.reduce((n,x)=>n+x[key],0);
const sorted=journeys.map(x=>x.chargedUnits).sort((a,b)=>a-b);
const pct=p=>sorted[Math.floor((sorted.length-1)*p)];
// Scripted benchmark journeys measure clock pressure, not real-player behavior.
const scenarios=[
 {id:'groceries-and-home',places:['home','market','home']},
 {id:'employment-and-home',places:['home','agency','home']},
 {id:'job-market-bank-home',places:['home','agency','market','bank','home']},
];
const paths=scenarios.map(s=>{
 let units=0,waypoints=0;const legs=[];
 for(let i=1;i<s.places.length;i++){
  const q=game.travelQuote(s.places[i-1],s.places[i],60);
  units+=q.hours;waypoints+=q.steps;
  legs.push({from:s.places[i-1],to:s.places[i],chargedUnits:q.hours,steps:q.steps});
 }
 return {id:s.id,legs,travelUnits:units,waypoints,remainingBeforeActivities:Math.max(0,60-units),
  feasibleBeforeActivities:units<=60};
});
const report={schema:'the-life-loop.dos-session-pacing.v1',version,seed:557,
 status:'baseline-only',
 caveat:'No DOSBox trace or measured wall-clock game duration is available. DOS rival AI estimates are NOT observed player travel costs. No movement or action charges were modified.',
 evidence:['room1.sc:1315,1473-1491','WhereShouldIGo.sc:23-38','src/classic-time.js','src/engine.js'],
 coverage:{venues:game.places.length,directedJourneys:journeys.length},
 travelSummary:{min:sorted[0],median:pct(.5),p90:pct(.9),max:sorted.at(-1),mean:Number((sum(journeys,'chargedUnits')/journeys.length).toFixed(3)),
  outsideDosAiEstimatorBound:journeys.filter(x=>x.chargedUnits<x.dosAiReferenceMin||x.chargedUnits>x.dosAiReferenceMax).length},
 scriptedItineraries:paths,journeys};
if(process.argv.includes('--write')){
 const p=resolve(root,'docs/reference/dos-session-pacing-075.json');writeFileSync(p,JSON.stringify(report,null,2)+'\n');console.log('Wrote '+p);
}else if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else console.log(`Life ${version}: ${journeys.length} read-only route quotes; scripted travel ranges ${paths.map(p=>p.travelUnits).join(', ')} units. DOSBox measurement outstanding.`);
