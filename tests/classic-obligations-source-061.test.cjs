'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Weekly=require('../src/classic-weekly-events.js');
const Clock=require('../src/classic-time.js');
const Game=require('../src/engine.js');
const classic=(rules={})=>{const g=new Game({mode:'sandbox',ruleset:'classic',seed:561,rules});g.player.classicFoodV2=null;g.player.happiness=62;g.player.classicRelaxation=16;g.player.groceries=1;return g;};

test('DOS state 10: no fridge loses fresh food and -2 happiness; fridge/freezer caps lose -1',()=>{
 const none=Weekly.foodStorageTrace(4,0,false,false);
 assert.deepEqual({lost:none.lost,joy:none.happinessDelta,spoiled:none.spoiledFresh}, {lost:4,joy:-2,spoiled:true});
 assert.deepEqual({lost:Weekly.foodStorageTrace(7,6,true,false).lost,joy:Weekly.foodStorageTrace(7,6,true,false).happinessDelta},{lost:1,joy:-1});
 assert.equal(Weekly.foodStorageTrace(13,12,true,true).happinessDelta,-1);
 assert.equal(Weekly.foodStorageTrace(6,6,true,false).happinessDelta,0);
 assert.throws(()=>Weekly.foodStorageTrace(7,7,true,false),/Invalid DOS storage result/);
});

test('Classic compatibility consumes the meal before spoiling leftovers, but charges correct source happiness',()=>{
 const g=classic(),p=g.player;p.groceries=3;p.fed=false;p.cash=0;g.rand=()=>.999;
 const before=p.happiness;g.weekend(p);
 assert.equal(p.groceries,0);assert.equal(p.hunger,0);
 assert.equal(p.happiness,before-2);
 const loss=g.classicWeekEvents.find(e=>e.kind==='food-storage');
 assert.equal(loss.closedWeek,1);assert.equal(loss.happinessDelta,-2);
 assert.equal(loss.compatibilityOrder,true);
 assert.equal(loss.sourceState,10);
 const saved=Game.load(g.snapshot());assert.equal(saved.player.happiness,p.happiness);
});

test('Source storage cap penalty and custom no-spoilage rule stay distinct',()=>{
 const cap=classic(),p=cap.player;p.fed=true;p.groceries=9;p.owned.push('fridge');
 const before=p.happiness;cap.rand=()=>.999;cap.weekend(p);
 assert.equal(p.groceries,6);assert.equal(p.happiness,before-1);
 const custom=classic({foodSpoilage:false}),q=custom.player;q.fed=true;q.groceries=9;q.owned.push('fridge');
 const joy=q.happiness;custom.rand=()=>.999;custom.weekend(q);
 assert.equal(q.groceries,9);assert.equal(q.happiness,joy);
 assert.equal(custom.classicWeekEvents.filter(e=>e.kind==='food-storage').length,0);
 const modern=new Game({mode:'sandbox',ruleset:'modern',seed:561});modern.player.groceries=9;modern.player.fed=true;
 modern.rand=()=>.999;modern.weekend(modern.player);
 assert.equal(modern.classicWeekEvents.length,0);
});

test('DOS spoiled-food local6=-1 uses a d2 stress draw, unlike no-food d4',()=>{
 const lottery=Weekly.cashStress({shortage:false,spoiledFresh:true,relaxation:16,cash:100,random:()=>.4});
 assert.equal(lottery.roll,0);assert.equal(lottery.triggered,true);
 assert.equal(lottery.expense>=30,true);
 const noFood=Weekly.cashStress({shortage:true,relaxation:16,cash:100,random:()=>.4});
 assert.equal(noFood.roll,1);assert.equal(noFood.triggered,false);
 assert.throws(()=>Weekly.cashStress({shortage:true,spoiledFresh:true,relaxation:16,cash:10,random:()=>.4}),/Invalid DOS cash stress/);
});

test('Loan check uses finished weeks 4, 8 and 12; first missed bill is reminder, later one is provisional -1',()=>{
 const g=classic(),p=g.player;p.groceries=0;p.fed=true;p.debt=800;p.classicLoanPaidThrough=0;p.classicRentDueWeek=100;p.cash=0;
 g.rand=()=>.999;g.week=4;const h=p.happiness;g.newWeek();
 const first=g.classicWeekEvents.filter(e=>e.kind==='loan-due');
 assert.equal(first.length,1);assert.equal(first[0].closedWeek,4);assert.equal(first[0].notice,'payment-required');
 // Happiness can change from housing comfort, but loan's first reminder must not deduct extra -3.
 assert.equal(p.happiness,h-2); // low-cost housing comfort -2
 g.week=8;const before=p.happiness;g.newWeek();
 const second=g.classicWeekEvents.filter(e=>e.kind==='loan-due').at(-1);
 assert.equal(second.closedWeek,8);assert.equal(second.overdueMonths,2);
 assert.equal(second.notice,'late');assert.equal(p.happiness,before-3); // -1 late + -2 housing
 const restored=Game.load(g.snapshot());assert.deepEqual(restored.classicWeekEvents,g.classicWeekEvents);
});

test('DOS n108.sc reference: 1, 3, 6 unit paychecks have full-gross rent basis and anomalies',()=>{
 const results=[1,3,6].map(h=>Clock.originalGarnishmentReference(7,h,100));
 assert.deepEqual(results.map(x=>x.earnedGross),[9,28,56]);
 assert.deepEqual(results.map(x=>x.net),[26,26,26]);
 assert.deepEqual(results.map(x=>x.arrearsAfter),[72,72,72]);
 assert.equal(results[0].anomalous,true);assert.equal(results[2].anomalous,true); // $2 fee is not credited to debt
 assert.equal(results[2].source,'n108.sc:localproc_0');
 assert.equal(Clock.originalGarnishmentReference(7,1,10).net,46);
 assert.equal(Clock.originalGarnishmentReference(7,6,0).net,56);
 assert.throws(()=>Clock.originalGarnishmentReference(7,7,0),/Invalid source shift/);
 // The production quote is still bounded by actually earned partial gross.
 const live=Clock.paycheck(7,1,100);assert.equal(live.gross,9);assert.ok(live.net<=9);
});
