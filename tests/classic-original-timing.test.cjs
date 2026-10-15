'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const Clock=require('../src/classic-time.js');
const make=()=>new Game({ruleset:'classic',mode:'sandbox',seed:713});
test('Original AI 170-point ring uses 20-tick quantum and 40-tick travel overhead per nonempty leg',()=>{
 assert.equal(Clock.TURN_UNITS,60);assert.equal(Clock.ROUTE_QUANTUM,20);
 assert.equal(Clock.originalTravelTicks(0),0);assert.equal(Clock.originalTravelTicks(7),47);
 assert.equal(Clock.originalTravelTicks(85),125);
 assert.throws(()=>Clock.originalTravelTicks(-1),/Invalid/);
});
test('Travel quotes distinguish original AI ticks from provisional spending units; agency entry is charged once',()=>{
 const g=make(),p=g.player;
 const agency=g.travelQuote('home','agency');
 assert.equal(agency.estimatedTicks,agency.steps+40);
 assert.equal(agency.entryHours,2);
 assert.equal(agency.hours,agency.walkingHours+2);
 const food=g.travelQuote('home','cinema');assert.equal(food.entryHours,0);
 const before=g.snapshot(),cash=p.cash;
 assert.equal(g.travel('agency').ok,true);
 assert.equal(p.hours,60-agency.hours);assert.equal(p.weekActions,1);assert.equal(p.cash,cash);
 assert.equal(g.travel('agency').ok,true);assert.equal(p.hours,60-agency.hours);
 assert.equal(g.travelQuote('agency','agency').estimatedTicks,0);
 assert.notDeepEqual(g.snapshot(),before);
});
test('Not enough units for Employment entry makes travel atomic, including action count and position',()=>{
 const g=make(),p=g.player,quote=g.travelQuote('home','agency');p.hours=quote.hours-1;
 const before=g.snapshot();assert.equal(g.travel('agency').ok,false);
 assert.deepEqual(g.snapshot(),before);
});
test('Three-leg Classic itineraries sum source estimates per leg and choose lower source-tick route',()=>{
 const g=make();const stops=['housing','pawn','bank'];
 const best=g.classicBestItinerary('home',stops,60);
 assert.ok(best);assert.equal(best.estimatedTicks,best.steps+40*3);
 const candidates=stops.flatMap(a=>stops.filter(b=>b!==a).flatMap(b=>stops.filter(c=>c!==a&&c!==b).map(c=>g.classicItinerary('home',[a,b,c])))).filter(x=>x.feasible);
 assert.equal(best.estimatedTicks,Math.min(...candidates.map(x=>x.estimatedTicks)));
 assert.deepEqual(g.classicBestItinerary('home',stops,60),best);
});
test('Late-turn partial work awards one source work credit but does not carry fractional gross',()=>{
 const g=make(),p=g.player;p.location='diner';p.job='classic-monolith-cook';p.wage=7;p.hours=2;p.energy=100;p.experience=9;p.dependability=19;
 const a=g.actions().find(x=>x.id==='work');assert.equal(a.hours,2);
 assert.equal(g.act('work').ok,true);assert.equal(p.hours,0);
 assert.equal(p.cash,218);assert.equal(p.workSessions,1);
 assert.equal(p.experience,10);assert.equal(p.dependability,20);assert.equal(p.classicWageRemainder,0);assert.equal(p.classicWorkHourCredit,0);
});
test('Modern route quotes and six-hour work remain unchanged',()=>{
 const g=new Game({ruleset:'modern',mode:'sandbox',seed:713}),p=g.player;
 const quote=g.travelQuote('home','agency');assert.equal(quote.estimatedTicks,null);assert.equal(quote.entryHours,0);
 assert.equal(quote.hours,g.travelCost('home','agency'));
 p.location='diner';p.job='server';p.wage=11;p.hours=2;
 assert.equal(g.actions().find(a=>a.id==='work').enabled,false);
});
