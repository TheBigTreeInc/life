'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../src/life-pass-057.js');
test('preset goals change four victory targets but never game turns or time costs',()=>{
 assert.deepEqual(P.presetGoals('quick'),{wealth:30,happiness:30,education:30,career:30});
 assert.deepEqual(P.presetGoals('standard'),{wealth:50,happiness:50,education:50,career:50});
 assert.deepEqual(P.presetGoals('extended'),{wealth:75,happiness:75,education:75,career:75});
 assert.equal(P.detectPreset({wealth:50,happiness:50,education:50,career:50}),'standard');
 assert.equal(P.detectPreset({wealth:60,happiness:50,education:50,career:50}),'custom');
 assert.throws(()=>P.presetGoals('fake'),/Unknown/);
});
test('goal diagnostics identify which target ends the match without predicting minutes',()=>{
 const r=P.goalDistance({wealth:60,happiness:40,education:51,career:75},P.presetGoals('standard'));
 assert.equal(r.wealth.achieved,true);assert.equal(r.happiness.remaining,10);
 assert.equal(r.education.achieved,true);assert.equal(r.career.remaining,0);
});
test('English and Dutch vocabulary has safe English fallback and storage failures are harmless',()=>{
 assert.equal(P.t('nl','Game settings'),'Spelinstellingen');
 assert.equal(P.t('nl','Career'),'Carrière');assert.equal(P.t('nl','Missing text'),'Missing text');
 assert.equal(P.t('invalid','Match length'),'Match length');
 const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 P.saveLocale(storage,'nl');assert.equal(P.savedLocale(storage),'nl');
 assert.equal(P.savedLocale({getItem(){throw Error('no storage');}}),'en');
});
test('food purchased in closing week is available at week transition (not one week later)',()=>{
 const r=P.closeWeekFood({closedWeek:4,purchasedWeek:4,groceries:1,fed:false,hunger:0,happiness:62});
 assert.equal(r.closedWeek,4);assert.equal(r.purchasedInClosedWeek,true);
 assert.equal(r.consumed,1);assert.equal(r.missed,false);assert.equal(r.groceries,0);assert.equal(r.hunger,0);
});
test('diner/cooked meal does not consume an extra fresh-food portion',()=>{
 const r=P.closeWeekFood({closedWeek:2,purchasedWeek:2,groceries:4,fed:true,hunger:2,happiness:62});
 assert.equal(r.consumed,0);assert.equal(r.groceries,4);assert.equal(r.hunger,1);
});
test('no food increases hunger exactly once and retains Classic cap',()=>{
 let s={closedWeek:1,purchasedWeek:0,groceries:0,fed:false,hunger:3,happiness:9};
 const r=P.closeWeekFood(s);assert.equal(r.missed,true);assert.equal(r.hunger,4);assert.equal(r.happiness,1);
 assert.throws(()=>P.closeWeekFood({...s,purchasedWeek:2}),/Invalid prior-week/);
});

test('Classic weekly reducer records the completed week and never delays pantry use',()=>{
 const Game=require('../src/engine.js');
 const g=new Game({mode:'sandbox',ruleset:'classic',seed:557}),p=g.player;
 p.classicFoodV2=null;p.groceries=3;p.fed=false;p.hunger=2;p.classicFoodPurchasedWeek=1;
 p.owned.push('fridge');p.classicEquipment.fridge={source:'specialty',broken:false};
 g.rand=()=>0.9;g.newWeek();
 assert.equal(g.week,2);assert.equal(p.groceries,2);assert.equal(p.hunger,1);
 const audit=g.classicWeekEvents.find(e=>e.kind==='food-week-close'&&e.playerId===p.id);
 assert.equal(audit.week,2);assert.equal(audit.closedWeek,1);
 assert.equal(audit.purchasedInClosedWeek,true);assert.equal(audit.consumed,1);
 const saved=Game.load(g.snapshot());
 assert.equal(saved.classicWeekEvents.find(e=>e.kind==='food-week-close').closedWeek,1);
});

test('Modern weekly food is unchanged and never receives Classic closing-week telemetry',()=>{
 const Game=require('../src/engine.js');
 const g=new Game({mode:'sandbox',ruleset:'modern',seed:557}),p=g.player;
 p.groceries=1;p.fed=false;p.hunger=0;p.classicFoodPurchasedWeek=1;
 g.rand=()=>0.9;g.newWeek();
 assert.equal(p.groceries,0);assert.equal(p.hunger,0);
 assert.equal(g.classicWeekEvents.find(e=>e.kind==='food-week-close'),undefined);
});

test('v0.5.57 browser bundle carries the locale module, goal sliders, and immutable rule option names',()=>{
 const {readFileSync}=require('node:fs');
 const page=readFileSync('PLAY.html','utf8');const app=readFileSync('src/app.js','utf8');
 for(const anchor of ['id="gameLanguage"','id="goalPreset"','id="paceLanguageSettings"','id="goalsCaption"'])assert.ok(app.includes(anchor),anchor);
 for(const flag of ['forcedReturnHome','carryReturnOvertime','foodSpoilage','overdueRentPenalty','marketFluctuations'])assert.ok(app.includes(flag),flag);
 assert.ok(page.includes('LifePass057='));assert.ok(page.includes('id="board"'));
});
