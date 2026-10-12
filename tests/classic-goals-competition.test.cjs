const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const prefs=require('../src/setup-preferences.js');
const base={ruleset:'classic',mode:'solo',goals:{wealth:50,happiness:50,education:50,career:50},seed:1337};

test('Classic starts with exactly $200 in hand, zero savings, while Modern balance remains untouched',()=>{
 const c=new Game({...base,mode:'sandbox'}),m=new Game({ruleset:'modern',mode:'sandbox'});
 assert.equal(c.player.cash,200);assert.equal(c.player.bank,0);assert.equal(c.wealth(c.player),200);
 assert.equal(c.player.history[0].netWorth,200);
 assert.equal(m.player.cash,250);assert.equal(m.player.bank,100);assert.equal(m.player.history[0].netWorth,350);
});
test('Classic four goal formulas reflect original goal-point statistics',()=>{
 const g=new Game({...base,mode:'sandbox'}),p=g.player;
 assert.deepEqual(g.classicGoalStats(p),{wealth:2,happiness:62,education:1,career:0});
 assert.deepEqual(g.scores(p),{wealth:4,happiness:100,education:2,career:0});
 p.cash=3500;p.bank=500;p.invested=500;p.happiness=43;p.classicDegrees=['junior-college','trade-school'];p.job='classic-monolith-cook';p.dependability=40;
 assert.deepEqual(g.classicGoalStats(p),{wealth:45,happiness:43,education:19,career:50});
 assert.deepEqual(g.scores(p),{wealth:90,happiness:86,education:38,career:100});
 p.job=null;assert.equal(g.scores(p).career,0);
});
test('Classic victory needs all four independent authentic thresholds, not arbitrary progress averages',()=>{
 const g=new Game({...base,mode:'sandbox'}),p=g.player;
 p.cash=5000;p.happiness=50;p.classicDegrees=['junior-college','trade-school','academic','pre-engineering','engineering','electronics'];p.dependability=40;
 g.checkWin();assert.equal(g.winner,null,'even high dependability does not grant unemployed Career goal');
 p.job='classic-monolith-cook';g.checkWin();assert.equal(g.winner,'player');
});
test('Jones difficulty adjusts the total independently by +40/0/-40, wealth stays within ten points',()=>{
 for(const [difficulty,expected] of Object.entries({easy:240,fair:200,hard:160})){
  const g=new Game({...base,jonesDifficulty:difficulty});
  const human=g.players[0],rival=g.players.at(-1);
  assert.equal(g.goalPoints(human),200);assert.equal(g.goalPoints(rival),expected);
  assert.ok(Math.abs(g.goalTargets(rival).wealth-g.goalTargets(human).wealth)<=10);
  for(const key of D.GOAL_KEYS){assert.ok(rival.classicGoals[key]>=10&&rival.classicGoals[key]<=100);assert.equal(rival.classicGoals[key]%5,0);}
  assert.deepEqual(new Game({...base,jonesDifficulty:difficulty}).players.at(-1).classicGoals,rival.classicGoals);
  const loaded=Game.load(g.snapshot());assert.deepEqual(loaded.snapshot(),g.snapshot());
 }
});
test('Extreme custom goal budgets clamp difficulty to valid four-goal range',()=>{
 const tiny=new Game({...base,goals:{wealth:10,happiness:10,education:10,career:10},jonesDifficulty:'hard'});
 const huge=new Game({...base,goals:{wealth:100,happiness:100,education:100,career:100},jonesDifficulty:'easy'});
 assert.equal(tiny.goalPoints(tiny.players.at(-1)),40);assert.equal(huge.goalPoints(huge.players.at(-1)),400);
});
test('Game snapshots reject forged rival goal points',()=>{
 const snap=new Game(base).snapshot();snap.players.at(-1).classicGoals.wealth=999;
 assert.throws(()=>Game.load(snap),/Invalid Classic rival goals/);
});
test('Quick Start includes Jones difficulty and employer-first filtering while allowing future jobs',()=>{
 const app=fs.readFileSync('src/app.js','utf8'),setup=prefs.read(null);
 assert.equal(setup.jonesDifficulty,'fair');assert.equal(Object.values(setup.goals).reduce((a,b)=>a+b,0),200);
 for(const token of ['id="jonesDifficulty"','id="classicEmployerFilter"','Choose an employer','id="careerShowAll"','jonesDifficulty:String(f.get(\'jonesDifficulty\')','game.goalPoints(p)'])assert.ok(app.includes(token),token);
 const classic=new Game({...base,mode:'sandbox'});classic.player.location='agency';
 const all=classic.actions().filter(a=>a.id.startsWith('apply:'));
 assert.equal(all.length,37);assert.ok(all.some(a=>a.id==='apply:classic-monolith-cook'));
 assert.ok(classic.jobReasons(classic.player,D.classicJobs.find(j=>j.id==='classic-factory-general-manager')).length);
});
