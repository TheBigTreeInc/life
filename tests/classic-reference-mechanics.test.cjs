const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const classic=()=>new Game({ruleset:'classic',mode:'sandbox',seed:43,goals:{wealth:50,happiness:50,education:50,career:50}});

test('Printed Quick Reference: Classic wealth includes durable possessions, Modern remains unchanged',()=>{
 const g=classic(),p=g.player;assert.equal(g.classicGoalStats(p).wealth,2);
 p.owned=['fridge','computer'];assert.equal(g.classicOwnedValue(p),845);
 assert.equal(g.classicGoalStats(p).wealth,10.45);assert.equal(g.finances(p).netWorth,1045);
 p.owned.push('computer');assert.equal(g.classicOwnedValue(p),845,'duplicate inventory entries do not mint asset value');
 p.owned=['computer'];assert.equal(g.classicGoalStats(p).wealth,7.9);
 const modern=new Game({ruleset:'modern',mode:'sandbox'});
 const start=modern.scores(modern.player).wealth;
 modern.player.owned.push('fridge');assert.equal(modern.scores(modern.player).wealth,start);
});

test('Printed Quick Reference: unfinished university study advances Classic education points',()=>{
 const g=classic(),p=g.player;assert.equal(g.classicGoalStats(p).education,1);
 p.classicProgress={'junior-college':5};assert.equal(g.classicGoalStats(p).education,5.5);
 p.classicProgress={'junior-college':9};assert.equal(g.classicGoalStats(p).education,9.1);
 p.classicDegrees=['junior-college'];delete p.classicProgress['junior-college'];
 assert.equal(g.classicGoalStats(p).education,10);
 assert.equal(Game.load(g.snapshot()).classicGoalStats(Game.load(g.snapshot()).player).education,10);
});

test('Relative rescue only happens after two stranded Classic weeks and is accounted for',()=>{
 const g=classic(),p=g.player;p.cash=0;p.bank=0;p.clothing={casual:0,formal:0,business:0};p.groceries=0;p.owned=[];
 assert.equal(g.classicStranded(p),true);
 g.newWeek();assert.equal(p.cash,0);assert.equal(p.classicHardshipWeeks,1);
 g.newWeek();assert.equal(p.cash,90);assert.equal(p.classicReliefCount,1);assert.equal(p.classicHardshipWeeks,0);
 assert.ok(p.ledger.some(x=>x.category==='relief'&&x.net===90));
 assert.equal(Game.load(g.snapshot()).player.classicReliefCount,1);
});

test('Relative rescue does not trigger when clothing or protected savings or pawnable goods prevent softlock',()=>{
 for(const setup of [p=>p.clothing.casual=3,p=>p.bank=100,p=>p.owned.push('computer')]){
  const g=classic(),p=g.player;p.cash=0;p.bank=0;p.clothing={casual:0,formal:0,business:0};p.groceries=0;p.owned=[];
  setup(p);g.rand=()=>0.99;g.newWeek();g.newWeek();assert.equal(p.classicReliefCount,0);
 }
 const modern=new Game({ruleset:'modern',mode:'sandbox'});modern.player.cash=0;
 modern.player.clothing={casual:0,formal:0,business:0};modern.newWeek();modern.newWeek();
 assert.equal(modern.player.classicReliefCount,0);
});
