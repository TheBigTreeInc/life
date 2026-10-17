'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Weekly=require('../src/classic-weekly-events.js');
const Game=require('../src/engine.js');
const Food=require('../src/life-pass-057.js');
const classic=(rules={marketFluctuations:false})=>{const g=new Game({mode:'sandbox',ruleset:'classic',seed:560,rules});g.player.classicFoodV2=null;g.player.happiness=62;g.player.classicRelaxation=16;g.player.groceries=1;return g;}

test('DOS state 12 shortage reduces only two happiness in Classic, not Modern or the legacy pure food default',()=>{
 const before={closedWeek:1,groceries:0,fed:false,hunger:0,happiness:62};
 assert.equal(Food.closeWeekFood(before).happiness,54);
 assert.equal(Food.closeWeekFood({...before,missedHappinessLoss:2}).happiness,60);
 assert.throws(()=>Food.closeWeekFood({...before,missedHappinessLoss:-1}),/Invalid prior-week/);
 const c=classic(),p=c.player;p.cash=0;p.groceries=0;c.rand=()=>.9;c.weekend(p);
 assert.equal(p.happiness,60);assert.equal(p.hunger,1);
 const trace=c.classicWeekEvents.find(e=>e.kind==='food-shortage');
 assert.equal(trace?.happinessDelta,-2);assert.equal(trace.sourceState,12);
 const m=new Game({mode:'sandbox',ruleset:'modern',seed:560}),q=m.player;q.cash=0;q.groceries=0;m.rand=()=>.9;m.weekend(q);
 assert.equal(q.happiness,54);assert.equal(m.classicWeekEvents.length,0);
});

test('DOS state 14 shortage stress uses one d4 roll and 30..50 or 30..200 capped to cash',()=>{
 const play=(cash,rolls,relaxation=16)=>{
  let n=0;const event=Weekly.cashStress({shortage:true,relaxation,cash,random:()=>{assert.ok(n<rolls.length,'no extra RNG draws');return rolls[n++];}});
  assert.equal(n,rolls.length);return event;
 };
 assert.deepEqual({...play(50,[0,0])},{sourceState:14,eligible:true,triggered:true,expense:30,happinessDelta:-4,roll:0,floorRoll:null});
 assert.equal(play(700,[0,.999999]).expense,200);
 assert.equal(play(25,[0]).expense,25);
 assert.equal(play(200,[.9999]).triggered,false);
 assert.equal(play(200,[.9999,0,0],10).expense,30,'relaxation floor forces cash-stress branch');
 assert.equal(play(0,[0]).triggered,false,'no cash means no charge and no -4 happiness');
 assert.equal(Weekly.cashStress({shortage:false,relaxation:10,cash:200,random:()=>{throw Error('unexpected RNG');}}).eligible,false);
 for(const bad of [-.001,1,NaN,Infinity])assert.throws(()=>Weekly.cashStress({shortage:true,relaxation:16,cash:200,random:()=>bad}),/Invalid DOS event roll/);
 assert.throws(()=>Weekly.cashStress({shortage:true,relaxation:9,cash:100,random:()=>0}),/Invalid DOS cash stress/);
});

test('DOS state 24 happiness table is pure and not silently mapped to speculative economic phases',()=>{
 assert.deepEqual([1,2,3,4].map(code=>Weekly.headlineHappiness(code,false).delta),[-3,-2,-1,0]);
 assert.deepEqual([1,2,3,4].map(code=>Weekly.headlineHappiness(code,true).delta),[-8,-4,-2,0]);
 assert.equal(Weekly.headlineHappiness(4,true,true).delta,5);
 assert.equal(Weekly.headlineHappiness(4,false,true).delta,0);
 assert.equal(Weekly.headlineHappiness(2,true).triggerVerified,false);
 assert.throws(()=>Weekly.headlineHappiness(5,true),/Invalid DOS headline/);
});

test('four Classic weeks preserve source order, happiness/cash/relaxation trace and deterministic save replay',()=>{
 const g=classic(),p=g.player;p.cash=200;p.groceries=0;p.fed=false;
 g.rand=()=>0;
 const expected=[[170,54,15,1],[140,46,14,2],[110,38,13,3],[80,23,12,4]];
 for(let i=0;i<4;i++){
  g.newWeek();const [cash,joy,relax,hunger]=expected[i];
  assert.equal(p.cash,cash);assert.equal(p.happiness,joy);assert.equal(p.classicRelaxation,relax);assert.equal(p.hunger,hunger);
  const events=g.classicWeekEvents.filter(e=>e.playerId==='player'&&e.closedWeek===i+1);
  const kinds=events.map(e=>e.kind);
  assert.ok(kinds.indexOf('relaxation')<kinds.indexOf('food-shortage'));
  assert.ok(kinds.indexOf('food-shortage')<kinds.indexOf('cash-stress'));
  assert.ok(kinds.indexOf('cash-stress')<kinds.indexOf('weekly-wellbeing'));
  const audit=events.find(e=>e.kind==='weekly-wellbeing');
  assert.equal(audit.happinessAfter,joy);assert.equal(audit.relaxationAfter,relax);assert.equal(audit.cashAfter,cash);
  assert.equal(events.find(e=>e.kind==='cash-stress').expense,30);
  assert.ok(kinds.indexOf('food-week-close')<kinds.indexOf('cash-stress'));
 }
 // Fourth week includes one provisional rent penalty; no hidden source-verified claim.
 assert.equal(expected[3][1]-expected[2][1],-15);
 const snap=g.snapshot();assert.deepEqual(Game.load(snap).snapshot(),snap);
 const restored=Game.load(snap);restored.rand=()=>0;g.newWeek();restored.newWeek();
 assert.deepEqual(restored.snapshot(),g.snapshot());
});

test('ticket and Classic home comfort remain explicit provisional effects; Modern social events unchanged',()=>{
 const g=classic(),p=g.player;p.fed=true;p.cash=150;p.classicWeekendTicket='concert';g.rand=()=>0;
 const before=p.happiness;g.weekend(p);
 assert.equal(p.happiness,before+7-2,'unrefrigerated leftover fresh food spoils before weekly consumption');assert.equal(p.cash,150);
 assert.equal(g.classicWeekEvents.filter(e=>e.kind==='cash-stress').length,0);
 const m=new Game({mode:'sandbox',ruleset:'modern',seed:560});m.player.fed=true;m.player.cash=150;m.rand=()=>0;
 m.weekend(m.player);assert.equal(m.player.cash,138);
});
