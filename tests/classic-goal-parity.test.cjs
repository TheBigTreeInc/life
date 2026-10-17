const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Goals=require('../src/classic-goals.js');
const Game=require('../src/engine.js');
const targets={wealth:20,happiness:70,education:50,career:60};
const stat=(wealth,happiness,education,career)=>({wealth,happiness,education,career});
const classic=(goals=targets,mode='sandbox')=>new Game({ruleset:'classic',mode,goals,seed:8058});

test('Source viewGoals.sc: target-weighted progress, not mean of four independent percentages',()=>{
 // Capped total 20+35+0+60 = 115 out of 200 = 57.5 -> floor 57.
 assert.equal(Goals.progress(stat(10000,35,0,60),targets),57);
 assert.equal(Goals.progress(stat(20,70,50,60),targets),100);
 assert.equal(Goals.progress(stat(2000,70,50,60),targets),100,'overshooting wealth does not overshoot the overall gauge');
 assert.equal(Goals.progress(stat(0,0,0,0),targets),0);
 // Equal-weight mean would incorrectly give 50% here.
 assert.equal(Goals.progress(stat(10,0,0,0),{wealth:10,happiness:90,education:10,career:10}),8);
});
test('DOS career formula floors reliability / 8, awards 10-point steps only while employed',()=>{
 for(const [d,v] of [[0,0],[7,0],[8,10],[15,10],[16,20],[40,50],[63,70],[64,80],[80,100],[100,100],[200,100]])
  assert.equal(Goals.careerStat(d,true),v,d);
 assert.equal(Goals.careerStat(100,false),0);
 assert.throws(()=>Goals.careerStat(-1,true),/dependability/);
});
test('DOS university award formula has a genuine zero-degree zero point floor',()=>{
 for(const [d,v] of [[0,0],[1,10],[2,19],[3,28],[11,100]])assert.equal(Goals.educationStat(d),v);
 assert.throws(()=>Goals.educationStat(-1),/diplomas/);
});
test('Original victory uses four independent raw goals, not the weighted display',()=>{
 assert.equal(Goals.won(stat(20,70,50,60),targets),true);
 assert.equal(Goals.won(stat(999999,70,49,60),targets),false);
 assert.equal(Goals.progress(stat(999999,70,49,60),targets),99);
 assert.throws(()=>Goals.progress(stat(0,0,0,0),{...targets,career:0}),/goal career/);
 assert.throws(()=>Goals.progress(stat(-1,0,0,0),targets),/stat wealth/);
});
test('Engine Classic goal values, weighted leaderboard, and save/load obey reference equations',()=>{
 const g=classic(),p=g.player;
 assert.equal(p.happiness,0,'DOS room1.sc Player default initializes happiness at zero');
 assert.equal(g.classicGoalStats(p).education,0);
 p.classicProgress={'junior-college':9};assert.equal(g.classicGoalStats(p).education,0);
 p.cash=2000;p.happiness=35;p.classicDegrees=[];p.job='classic-monolith-cook';p.dependability=48;
 const score=g.classicGoalStats(p);
 assert.deepEqual(score,stat(20,35,0,60));assert.equal(g.progress(p),57);
 assert.deepEqual(g.scores(p),{wealth:100,happiness:50,education:0,career:100});
 const snapshot=g.snapshot(),loaded=Game.load(snapshot);
 assert.deepEqual(loaded.classicGoalStats(loaded.player),score);assert.equal(loaded.progress(loaded.player),57);
 assert.deepEqual(loaded.snapshot(),snapshot);
});
test('Classic cash-to-goal points is integer-truncated, and Jones receives own targets',()=>{
 const g=classic(targets,'solo'),p=g.player,r=g.players.find(x=>x.isAI);
 p.cash=2099;p.bank=0;assert.equal(g.classicGoalStats(p).wealth,20);
 assert.equal(g.progress(p),Goals.progress(g.classicGoalStats(p),g.goalTargets(p)));
 assert.equal(g.progress(r),Goals.progress(g.classicGoalStats(r),g.goalTargets(r)));
});
test('Modern and Custom Classic house rules remain independent of formula implementation',()=>{
 const modern=new Game({ruleset:'modern',mode:'sandbox',goals:targets});
 const before={scores:modern.scores(modern.player),progress:modern.progress(modern.player)};
 assert.deepEqual({scores:modern.scores(modern.player),progress:modern.progress(modern.player)},before);
 const custom=new Game({ruleset:'classic',mode:'sandbox',goals:targets,rules:{forcedReturnHome:false,foodSpoilage:false}});
 assert.equal(custom.settings.rules.forcedReturnHome,false);
 assert.equal(custom.progress(custom.player),Goals.progress(custom.classicGoalStats(custom.player),custom.goalTargets(custom.player)));
 assert.deepEqual(Game.load(custom.snapshot()).settings.rules,custom.settings.rules);
});
test('Board source and offline packager wire the same source goal module',()=>{
 const source=readFileSync('index.html','utf8'),builder=readFileSync('tools/build-offline.mjs','utf8');
 assert.match(source,/src\/classic-goals\.js/);assert.match(builder,/'classic-goals'/);
 assert.match(readFileSync('src/app.js','utf8'),/game\.progress\(p\)/);
});
