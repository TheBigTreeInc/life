'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const classic=()=>new Game({ruleset:'classic',mode:'sandbox',seed:777});
test('Jones skips unaffordable prioritized rent trip and can plan a local food trip',()=>{
 const g=classic(),p=g.player;
 p.job='classic-monolith-cook';p.wage=10;p.classicRaises=2;
 p.location='diner';p.cash=1500;p.hours=10;p.groceries=0;p.fed=false;
 p.classicRent=325;p.classicRentDueWeek=g.week;
 const original=g.travelCost.bind(g);
 g.travelCost=(a,b)=>b==='housing'?60:original(a,b);
 const d=g.classicSourceDecision(p);
 assert.ok(d,'later feasible choice should be considered');
 assert.notEqual(d.destination,'housing');
 assert.equal(d.ruleId,27);
});
test('infeasible candidates remain pure across save/replay and do not affect Modern',()=>{
 const g=classic(),p=g.player;p.location='diner';p.cash=1500;p.groceries=0;p.fed=false;p.job='classic-monolith-cook';p.wage=10;p.classicRaises=2;p.hours=10;
 p.classicRentDueWeek=g.week;
 const before=g.snapshot();const initial=g.classicSourceDecision(p);
 assert.deepEqual(g.snapshot(),before);
 assert.deepEqual(g.classicSourceDecision(p),initial);
 const clone=Game.load(before);assert.deepEqual(clone.classicSourceDecision(clone.player),clone.classicSourceDecision(clone.player));
 const modern=new Game({ruleset:'modern',seed:777});assert.throws(()=>modern.classicSourceDecision(),/Classic-only/);
});
