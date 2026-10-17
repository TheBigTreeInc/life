const {test}=require('node:test');
const assert=require('node:assert/strict');
const Reference=require('../assets/boards/classic/original-mechanics.v1.json');
const Layout=require('../assets/boards/classic/routes.v1.json');
const D=require('../src/data.js');
const Game=require('../src/engine.js');
const {compile,validate}=require('../src/route-graph.js');
const planner=compile(Layout,D.classicPlaces.map(p=>p.id));
const game=(mode='sandbox')=>new Game({ruleset:'classic',mode,seed:242});

test('Reference imports exactly 170 indexed original waypoints and 13 immutable place identities',()=>{
 assert.equal(Reference.waypoints.length,170);assert.equal(Reference.places.length,13);
 assert.deepEqual(Reference.waypoints.map(x=>x.index),Array.from({length:170},(_,i)=>i+1));
 assert.deepEqual(D.classicPlaces.map(p=>p.placeNum).sort((a,b)=>a-b),Array.from({length:13},(_,i)=>i));
 assert.equal(D.classicPlaces.find(p=>p.id==='home').routeIndex,1);
 assert.equal(D.classicPlaces.find(p=>p.id==='housing').routeIndex,164);
 assert.equal(D.classicPlaces.find(p=>p.id==='cinema').routeIndex,134);
 assert.deepEqual(validate(Layout,D.classicPlaces.map(p=>p.id)),[]);
 for(const venue of D.classicPlaces){
  const source=Reference.places.find(p=>p.placeNum===venue.placeNum);
  assert.equal(source.pathIndex,venue.routeIndex);
  assert.equal(Layout.venues[venue.id].routeIndex,venue.routeIndex);
  assert.equal(Layout.venues[venue.id].businessId,venue.businessId);
 }
});

test('Original circular route chooses short wrap, 170-point directions, and deterministic ties',()=>{
 const reverse=planner.plan('home','housing');
 assert.equal(reverse.steps,7);assert.equal(reverse.direction,'descending');
 assert.deepEqual(reverse.waypointIndices,[1,170,169,168,167,166,165,164]);
 const fast=planner.plan('diner','market');assert.equal(fast.steps,11);
 assert.deepEqual(fast.waypointIndices,[35,34,33,32,31,30,29,28,27,26,25,24]);
 const same=planner.plan('home','home');assert.deepEqual(same.waypointIndices,[1]);assert.equal(same.steps,0);
 for(const a of D.classicPlaces)for(const b of D.classicPlaces){
  const ab=planner.plan(a.id,b.id),ba=planner.plan(b.id,a.id);
  assert.equal(ab.steps,ba.steps);
  assert.equal(ab.waypointIndices.length,ab.steps+1);
  assert.equal(ab.waypointIndices[0],a.routeIndex);
  assert.equal(ab.waypointIndices.at(-1),b.routeIndex);
 }
});

test('All 37 actual DOS jobs have unique job numbers and land on original board company identities',()=>{
 assert.equal(Reference.jobs.length,37);
 assert.equal(D.classicJobs.length,37);
 assert.deepEqual(D.classicJobs.map(j=>j.originalJobNum).sort((a,b)=>a-b),Array.from({length:37},(_,i)=>i+1));
 for(const job of D.classicJobs){
  const record=Reference.jobs.find(x=>x.jobNum===job.originalJobNum);
  const location=D.classicPlaces.find(x=>x.id===job.place);
  assert.equal(job.placeNum,record.placeNum);assert.equal(location.placeNum,record.placeNum);
  assert.equal(job.originalBasePay,record.baseHourlyPay);
  assert.equal(job.originalOccupationIndex,record.occupationIndex);
  const w=D.jobWorkplace(job);
  assert.equal(w.place,location.id);assert.equal(w.routeIndex,location.routeIndex);
 }
 assert.equal(D.classicJobs.find(j=>j.id==='classic-blacks-checker').place,'cinema');
 assert.equal(D.classicJobs.find(j=>j.id==='classic-zmart-clerk').place,'market');
 assert.equal(D.classicJobs.find(j=>j.id==='classic-monolith-cook').originalBasePay,4);
});

test('Route preview and engine charge once: Classic path steps are exact, provisional hours stay bounded',()=>{
 const g=game(),p=g.player;
 const quote=g.travelQuote('home','university');
 assert.equal(quote.steps,74);assert.equal(quote.hours,5);
 assert.equal(quote.waypointIndices.length,75);
 const before=p.hours;assert.equal(g.travel('university').ok,true);assert.equal(before-p.hours,quote.hours);
 assert.equal(g.travel('university').ok,true);assert.equal(p.hours,before-quote.hours);
});

test('Rival evaluates best two/three-stop order by original route distance rather than tile proximity',()=>{
 const g=game();
 const r=g.classicBestItinerary('home',['pawn','housing']);
 assert.deepEqual(r.stops,['housing','pawn']);
 assert.equal(r.steps,27);
 assert.deepEqual(g.classicBestItinerary('home',['pawn','housing']),r);
 assert.equal(g.classicBestItinerary('home',['pawn','housing'],0),null);
 assert.equal(g.classicItinerary('home',['pawn','housing']).steps,33);
});

test('Rival plans sustainable starting employment using hiring, salary, distance, food, rent and clothing',()=>{
 const g=game('solo'),p=g.players.find(x=>x.isAI);
 const first=g.classicAIPlan(p);
 assert.equal(first.bestJob.id,'classic-monolith-cook');
 assert.equal(first.bestJob.originalJobNum,4);
 assert.ok(first.reserve>0);
 assert.ok(first.jobCandidates[0].travelSteps>0);
 assert.equal(g.classicAIPlan(p).jobCandidates[0].score,first.jobCandidates[0].score);
 const before=g.seed;g.classicAIPlan(p);assert.equal(g.seed,before,'planning must not consume RNG');
 p.groceries=0;p.fed=false;p.cash=350;p.classicRentDueWeek=g.week;
 const need=g.classicAIPlan(p);assert.equal(need.foodReserve,g.classicAIFoodPurchase(p).cost);
 assert.deepEqual(need.urgentOrder,['diner'],'spend on essential food before paying an unaffordable rent+food combination');
 p.cash=500;const both=g.classicAIPlan(p);
 assert.equal(both.urgentOrder.length,2);assert.ok(both.urgentOrder.includes('housing'));assert.ok(both.urgentOrder.includes('diner'));
 p.clothing={casual:0,formal:0,business:0};p.cash=10;
 const empty=g.classicAIPlan(p);assert.equal(empty.bestJob,null,'no imaginary affordable uniforms');
});

test('Modern job system, travel plan, and AI remain separate',()=>{
 const g=new Game({ruleset:'modern',mode:'solo',seed:242});
 assert.equal(g.jobs,D.jobs);
 assert.deepEqual(g.travelQuote('home','agency').waypointIndices,[]);
 assert.throws(()=>g.classicAIPlan(),/Classic/);
 assert.throws(()=>g.classicBestItinerary('home',['agency']),/Classic/);
});
