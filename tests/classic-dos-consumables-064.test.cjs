'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const Food=require('../src/classic-consumables-064.js');
const Price=require('../src/classic-pass2-rules.js');
const classic=(rules={marketFluctuations:false})=>new Game({mode:'sandbox',ruleset:'classic',seed:564,rules});

test('DOS room1.sc new Classic players start with zero happiness, 25 relaxation, no food, six weeks clothes',()=>{
 const g=classic(),p=g.player;
 assert.equal(p.happiness,0);assert.equal(p.classicRelaxation,25);assert.equal(p.groceries,0);
 assert.deepEqual(p.classicFoodV2,{'2':0,'3':0,'4':0,'5':0});
 assert.equal(p.cash,200);assert.equal(p.bank,0);assert.equal(p.experience,10);assert.equal(p.dependability,20);
 assert.equal(p.clothing.casual,6);assert.equal(p.classicRent,325);assert.equal(p.hours,60);
 const m=new Game({mode:'sandbox',ruleset:'modern'}).player;
 assert.equal(m.happiness,62);assert.equal(m.classicRelaxation,16);assert.equal(m.groceries,1);assert.equal(m.classicFoodV2,null);
});

test('DOS Monolith food identities and goods-index price adapt to original original four sale items',()=>{
 assert.deepEqual(Food.MEALS.map(x=>[x.index,x.basePrice,x.happiness]),[[3,79,0],[4,89,1],[2,124,2],[5,65,0]]);
 const g=classic(),p=g.player;p.location='diner';
 for(const item of Food.MEALS){
  const action=g.actions().find(x=>x.id===`classicMeal:${item.index}`);
  assert.ok(action&&action.enabled);assert.equal(action.price,Price.goodsPrice(item.basePrice,100));
 }
 const r=g.act('classicMeal:5');assert.equal(r.ok,true);assert.equal(p.cash,135);
 assert.equal(p.classicFoodV2['5'],1);assert.equal(p.fed,false,'meal is a weekend consumable, not an immediate Modern diner meal');
 assert.ok(!g.actions().some(x=>x.id==='meal'));
});

test('DOS state sequence stores food BEFORE consuming; unrefrigerated fresh is lost and charged -2 joy',()=>{
 const step=Food.week({fresh:4,takeout:Food.start(),hasFridge:false,hasFreezer:false});
 assert.deepEqual(step.sourceStateOrder,[8,10,12,14,16]);
 assert.equal(step.chosen,-1);assert.equal(step.freshAfter,0);assert.equal(step.storageLoss,4);
 assert.equal(step.storagePenalty,-2);assert.equal(step.shortage,false);assert.equal(step.cashStressKind,'spoiled');
 const g=classic(),p=g.player;p.groceries=4;p.happiness=30;p.cash=0;
 g.rand=()=>.99;g.newWeek();
 const event=g.classicWeekEvents.find(e=>e.kind==='food-dos-064');
 assert.equal(event.chosen,-1);assert.equal(event.storageLoss,4);
 assert.equal(p.groceries,0);assert.equal(p.happiness,26,'-2 food storage and -2 studio comfort');
});

test('DOS refrigerator/freezer food caps are applied before automatic weekly consumption',()=>{
 const base={fresh:9,takeout:Food.start(),hasFridge:true,hasFreezer:false};
 const capped=Food.week(base);
 assert.equal(capped.storedBeforeConsumption,6);assert.equal(capped.freshAfter,5);
 assert.equal(capped.storageLoss,3);assert.equal(capped.storagePenalty,-1);
 const freezer=Food.week({...base,hasFreezer:true});
 assert.equal(freezer.freshAfter,8);assert.equal(freezer.storageLoss,0);
 const custom=Food.week({...base,hasFridge:false,spoilage:false});
 assert.equal(custom.freshAfter,8);assert.equal(custom.storagePenalty,0);
});

test('DOS food index 2 survives for a weekly decrement while fast-food 3/4/5 expires',()=>{
 const before={'2':3,'3':2,'4':2,'5':1};
 const week=Food.week({fresh:0,takeout:before,hasFridge:false,hasFreezer:false});
 assert.equal(week.chosen,5);assert.equal(week.shortage,false);
 assert.deepEqual(week.foodAfter,{'2':2,'3':0,'4':0,'5':0});
 assert.equal(week.discardedTakeout,5);
 assert.deepEqual(before,{'2':3,'3':2,'4':2,'5':1},'pure reducer leaves inputs unchanged');
});

test('Monolith weekend food prevents shortage without a fridge; save/load replay persists the item identity',()=>{
 const g=classic(),p=g.player;p.location='diner';p.happiness=15;
 assert.equal(g.act('classicMeal:5').ok,true);
 const snap=g.snapshot(),same=Game.load(snap);
 assert.deepEqual(same.snapshot(),snap);
 g.rand=()=>.99;same.rand=()=>.99;
 g.newWeek();same.newWeek();
 assert.equal(p.hunger,0);assert.equal(p.happiness,13,'studio comfort still applies');
 assert.equal(p.classicFoodV2['5'],0);assert.deepEqual(same.snapshot(),g.snapshot());
 assert.ok(g.classicWeekEvents.some(x=>x.kind==='food-dos-064'&&x.chosen===5));
});

test('Classic no-food winter does not reduce DOS weekly clock; Modern still uses its hunger penalty',()=>{
 const g=classic(),p=g.player;p.cash=0;p.hunger=4;
 g.rand=()=>.99;g.newWeek();assert.equal(p.hours,60);
 const m=new Game({ruleset:'modern',mode:'sandbox'});m.player.hunger=4;
 m.rand=()=>.99;m.newWeek();assert.equal(m.player.hours,28);
});

test('Existing v0.5.63 saves without consumable identity continue their previous pantry behavior',()=>{
 const g=classic(),old=g.snapshot();delete old.players[0].classicFoodV2;
 old.players[0].happiness=62;old.players[0].groceries=3;old.players[0].classicRelaxation=16;
 const restored=Game.load(old);assert.equal(restored.player.classicFoodV2,null);
 restored.player.cash=0;restored.rand=()=>.99;restored.newWeek();
 assert.ok(restored.classicWeekEvents.some(x=>x.kind==='food-week-close'));
 assert.ok(!restored.classicWeekEvents.some(x=>x.kind==='food-dos-064'));
 assert.equal(restored.player.groceries,0);
 const newGame=classic();assert.ok(newGame.player.classicFoodV2);
});

test('Untrusted snapshots reject invalid new Classic DOS food identity and happiness history',()=>{
 const g=classic(),original=g.snapshot();
 for(const bad of [{2:0,3:0,4:0,5:-1},{2:0,3:0,4:0,5:100},[0,0,0,0],{'2':0,'3':0,'4':0,'5':0,'7':1}]){
  const s=structuredClone(original);s.players[0].classicFoodV2=bad;
  assert.throws(()=>Game.load(s),/Invalid Classic DOS consumables/);
 }
 const s=structuredClone(original);s.players[0].classicFoodMealBonusWeek=2;
 assert.throws(()=>Game.load(s),/Invalid DOS food happiness week/);
});

test('Food offer happiness is once per week and cannot be stacked via cheeseburgers and chicken',()=>{
 const g=classic(),p=g.player;p.location='diner';p.cash=500;
 assert.equal(g.act('classicMeal:4').ok,true);assert.equal(p.happiness,1);
 assert.equal(g.act('classicMeal:2').ok,true);assert.equal(p.happiness,1);
 assert.equal(p.classicFoodV2['4'],1);assert.equal(p.classicFoodV2['2'],1);
 const state=Game.load(g.snapshot());assert.equal(state.player.happiness,1);
});
