'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');const fs=require('node:fs');
const Game=require('../src/engine.js');
const report=()=>JSON.parse(execFileSync(process.execPath,['tools/dos-session-pacing-075.mjs','--json'],{encoding:'utf8'}));
test('read-only pacing report audits 156 directed routes without changing games',()=>{
 const a=report(),b=report();assert.deepEqual(a,b);assert.equal(a.coverage.directedJourneys,156);
 assert.equal(a.coverage.venues,13);assert.equal(a.status,'baseline-only');
 assert.equal(a.journeys.length,156);assert(a.journeys.every(x=>x.referenceOnly));
 assert.equal(a.version,require('../package.json').version);
});
test('pacing route charges match engine and conserve scripted journey time',()=>{
 const a=report(),g=new Game({ruleset:'classic',mode:'sandbox',seed:557});
 for(const j of a.journeys){const q=g.travelQuote(j.from,j.to,60);assert.equal(q.hours,j.chargedUnits);assert.equal(q.steps,j.waypoints);}
 for(const p of a.scriptedItineraries){assert.equal(p.travelUnits,p.legs.reduce((s,x)=>s+x.chargedUnits,0));assert.equal(p.remainingBeforeActivities,Math.max(0,60-p.travelUnits));}
});
test('bundled pacing report is current and explicitly not a DOS runtime claim',()=>{
 const saved=JSON.parse(fs.readFileSync('docs/reference/dos-session-pacing-075.json','utf8'));
 assert.deepEqual(saved,report());assert.match(saved.caveat,/No DOSBox trace/);
});
