'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),path=require('node:path');
const Game=require('../src/engine.js');
const Journey=require('../src/classic-journey.js');
const Weekly=require('../src/classic-weekly-events.js');
const root=path.resolve(__dirname,'..');
const load=p=>readFileSync(path.join(root,p),'utf8');
const classic=()=>new Game({mode:'sandbox',ruleset:'classic',seed:539});

test('travel lifecycle describes separate departure/arrival without changing the game',()=>{
 const game=classic(),before=JSON.stringify(game.snapshot());
 const to='agency',from=game.player.location,q=game.travelQuote(from,to,game.player.hours);
 const departing=Journey.create('departing',game.getPlace(to).name,q);
 assert.match(departing.message,/On the road/);assert.match(departing.message,/clock units/);
 assert.match(Journey.create('arrived','Career Center').message,/choose an action/);
 assert.match(Journey.create('awaiting-host','Career Center').message,/awaiting host/);
 assert.equal(Journey.create('idle').message,'');
 assert.equal(JSON.stringify(game.snapshot()),before,'presentation must not touch gameplay state');
 assert.throws(()=>Journey.create('succeeded','Home'),/Unknown journey/);
 assert.throws(()=>Journey.create('arrived',''),/Invalid journey/);
 assert.throws(()=>Journey.create('departing','Home',{hours:-2}),/Invalid journey cost/);
});
test('arrivals render on the road SVG and are hidden after a subsequent departure',()=>{
 const js=load('src/route-overlay.js'),app=load('src/app.js');
 assert.match(js,/showArrival\(place\)/);
 assert.match(js,/clearArrival\(\)/);
 assert.match(js,/this\.cancel\(\);this\.clearArrival\(\);/);
 assert.match(app,/routeOverlay\.showArrival\(target\)/);
 assert.match(app,/setClassicJourney\('departing'/);
 assert.match(app,/setClassicJourney\('arrived'/);
 assert.match(app,/setClassicJourney\('awaiting-host'/);
 assert.ok(load('index.html').includes('id="classicJourneyStatus"'));
 assert.ok(load('styles.css').includes('.classic-journey-status[data-phase="arrived"]'));
});
test('camera manual override requires an actual swipe while the pawn is moving',()=>{
 const js=load('src/app.js');
 assert.match(js,/Math\.abs\(e\.clientX-boardPanOrigin\.x\)>9/);
 assert.match(js,/boardPanOrigin\.pointerId===e\.pointerId/);
 assert.match(js,/boardManualPan=true;boardPanOrigin=null;/);
 assert.match(js,/if\(boardManualPan\|\|!game\.isClassic/);
});
test('DOS food-shortage state 12 is a trace, not an additional penalty or RNG draw',()=>{
 const g=classic(),p=g.player;p.fed=false;p.groceries=0;p.cash=0;
 g.weekend(p);
 const e=g.classicWeekEvents.find(x=>x.kind==='food-shortage');
 assert.equal(e?.sourceState,12);assert.equal(e.shortage,true);assert.equal(e.hungerAfter,p.hunger);
 assert.equal(Weekly.foodShortageTrace(true,0,0,0).shortage,false);
 assert.throws(()=>Weekly.foodShortageTrace(false,1,2,0));
 const m=new Game({mode:'sandbox',ruleset:'modern',seed:539}),mp=m.player;mp.fed=false;mp.groceries=0;
 m.weekend(mp);assert.equal(m.classicWeekEvents.length,0);
});
test('DOS emergency clothing state 34 records existing two-check assistance with provisional payout',()=>{
 const g=classic(),p=g.player;p.cash=0;p.bank=0;p.owned=[];p.classicHardshipWeeks=1;
 for(const k of Object.keys(p.clothing))p.clothing[k]=0;
 const notes=[];g.classicEmergencyRelief(p,notes);
 assert.equal(p.cash,90);assert.equal(p.classicHardshipWeeks,0);
 const event=g.classicWeekEvents.find(x=>x.kind==='emergency-clothing');
 assert.equal(event?.sourceState,34);assert.equal(event.amount,90);
 assert.equal(event.consecutiveChecks,2);
 assert.equal(event.payoutVerified,false);assert.equal(event.cooldownVerified,false);
 assert.equal(Game.load(g.snapshot()).classicWeekEvents.some(x=>x.sourceState===34),true);
 assert.throws(()=>Weekly.emergencyClothingTrace(-1,90));
});
