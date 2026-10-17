'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Food=require('../src/classic-food.js');
const Game=require('../src/engine.js');
const classic=()=>new Game({ruleset:'classic',mode:'sandbox',seed:557});
test('DOS weekly food ordering: storage state 10, short-lived clear 12, meal 16',()=>{
 const r=Food.transition({fresh:9,fridge:true,freezer:false,shortLived:{'3':2,'4':1,'5':0}});
 assert.deepEqual(r.sourceStates,[10,12,16]);assert.equal(r.spoiled,3);
 assert.equal(r.ateTemporary,true);assert.equal(r.consumed,1);assert.equal(r.after,6);
 assert.deepEqual(r.shortLived,{'3':0,'4':0,'5':0});assert.equal(r.clearedShortLived,3);
});
test('fresh stores to freezer capacity, then consumes only one portion',()=>{
 const r=Food.transition({fresh:18,fridge:true,freezer:true});
 assert.equal(r.spoiled,6);assert.equal(r.after,11);assert.equal(r.ate,true);
});
test('no refrigeration: same-week compatibility meal, remaining fresh spoils',()=>{
 const r=Food.transition({fresh:4,justPurchased:true});
 assert.equal(r.ate,true);assert.equal(r.after,0);assert.equal(r.spoiled,3);
 const old=Food.transition({fresh:3});assert.equal(old.shortage,true);assert.equal(old.spoiled,3);
});
test('disabled spoilage does not erase food and permits standard consumption',()=>{
 const r=Food.transition({fresh:4,spoilage:false});
 assert.equal(r.after,3);assert.equal(r.spoiled,0);assert.equal(r.ate,true);
});
test('already fed does not consume saved fresh or use prepared meals',()=>{
 const r=Food.transition({fresh:3,fridge:true,fed:true,shortLived:{'3':1}});
 assert.equal(r.after,3);assert.equal(r.clearedShortLived,1);assert.equal(r.consumed,0);
});
test('Classic save keeps typed food, old saves receive safe empty categories',()=>{
 const g=classic(),s=g.snapshot();g.player.classicShortFood={'3':2,'4':0,'5':1};
 assert.deepEqual(Game.load(g.snapshot()).snapshot(),g.snapshot());
 delete s.players[0].classicShortFood;
 assert.deepEqual(Game.load(s).player.classicShortFood,{'3':0,'4':0,'5':0});
 s.players[0].classicShortFood={'3':-1};assert.throws(()=>Game.load(s),/Invalid Classic short-lived food/);
});
test('Short-lived food consumed once and cleared in next-week source events',()=>{
 const g=classic(),p=g.player;p.groceries=0;p.classicShortFood={'3':2,'4':0,'5':0};
 g.endTurn();assert.equal(p.groceries,0);assert.equal(p.hunger,0);
 assert.deepEqual(p.classicShortFood,{'3':0,'4':0,'5':0});
 const ev=g.classicWeekEvents.find(e=>e.kind==='food-cleanup');assert.equal(ev.sourceState,12);
});
