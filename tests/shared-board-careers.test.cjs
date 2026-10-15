const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../src/data.js');
const Game=require('../src/engine.js');
const Art=require('../src/art.js');
const {readFileSync,statSync}=require('node:fs');
const coords=x=>x.cell.join(',');
test('Classic and Modern each expose 13 connected locations but use distinct original geography',()=>{
 const keys=D.places.map(x=>x.id);
 assert.deepEqual(new Set(D.classicPlaces.map(p=>p.id)),new Set(keys));
 assert.notDeepEqual(D.classicPlaces.map(p=>p.cell),D.places.map(p=>p.cell));
 assert.equal(keys.length,13);
 assert.equal(new Set(keys).size,13);
 assert.equal(new Set(D.places.map(coords)).size,13);
 assert.equal(keys.includes('pawn'),true);
 const classic=new Game({ruleset:'classic'}),modern=new Game({ruleset:'modern'});
 for(const game of [classic,modern]){
  for(const id of keys){assert.ok(game.getPlace(id));assert.ok(Number.isFinite(game.travelCost('home',id)));}
  assert.equal(game.travelCost('home','home'),0);
  assert.ok(game.travelCost('home','agency')>=game.rules.entryHours+1);
  assert.ok(game.travelCost('home','pawn')>=game.rules.entryHours+1);
  assert.equal(game.travelCost('home','market'),game.travelCost('market','home'));
 }
});
test('the pawn store is distinct from Circuit City in both rule sets',()=>{
 for(const ruleset of ['classic','modern']){
  const game=new Game({ruleset}),p=game.player;
  p.owned.push('computer');p.location='tech';
  assert.equal(game.actions().some(x=>x.id==='classicPawn:computer'),false);
  p.location='pawn';
  const pawn=game.actions().find(x=>x.id==='classicPawn:computer');assert.ok(pawn?.enabled);
  assert.ok(game.act(pawn.id).ok);assert.equal(p.owned.includes('computer'),false);
  assert.equal(game.classicPawnLots.length,1);
  assert.ok(game.actions().some(x=>x.id.startsWith('classicRedeem:')));
  assert.equal(Game.load(game.snapshot()).classicPawnLots.length,1);
 }
});
test('Career Center qualified jobs come from the same qualification gate as actual job applications',()=>{
 for(const ruleset of ['classic','modern']){
  const game=new Game({ruleset});game.player.location='agency';
  const apps=game.actions().filter(x=>x.id.startsWith('apply:'));
  const qualified=apps.filter(a=>game.jobReasons(game.player,a.req).length===0);
  assert.ok(qualified.length>0,'at least one entry-level job');
  assert.ok(apps.length>qualified.length,'advanced roles exist');
  assert.ok(qualified.every(a=>!game.jobReasons(game.player,a.req).length));
  assert.ok(apps.some(a=>game.jobReasons(game.player,a.req).length>0));
 }
});
test('unqualified Classic application remains available in the engine for historical fidelity',()=>{
 const game=new Game({ruleset:'classic'});game.player.location='agency';
 const app=game.actions().find(a=>a.id==='apply:classic-factory-general-manager');
 assert.ok(app);assert.ok(game.jobReasons(game.player,app.req).length>0);
 const before=game.player.hours;const result=game.act(app.id);
 assert.equal(result.ok,true);assert.ok(before>game.player.hours);assert.equal(game.player.job,null);
});
test('city graphics exist in every era and career filter is opt-in',()=>{
 for(const era of ['current','historical','scifi'])assert.match(Art.scene('pawn',false,era),/(scene-photo|<svg)/);
 const assets=JSON.parse(readFileSync('assets/art/styles/contemporary-default/manifest.json','utf8'));
 assert.ok(statSync(assets.venues.pawn.card).size>2000);
 const app=readFileSync('src/app.js','utf8');const css=readFileSync('styles.css','utf8');
 assert.match(app,/showFutureJobApplications=false/);assert.match(app,/careerShowAll/);
 assert.match(app,/jobReasons\(p,a.req\)/);
 assert.match(app,/city-corner/);assert.match(css,/grid-template-rows:repeat\(5/);
});
