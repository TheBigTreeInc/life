const test=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const Art=require('../src/art.js');
const create=(ruleset='modern',era='current')=>new Game({mode:'sandbox',ruleset,era,seed:345});
const go=(g,id)=>{const r=g.travel(id);assert.equal(r.ok,true,r.message);};
const action=(g,id)=>{const r=g.act(id);assert.equal(r.ok,true,r.message);return r;};

test('new games accept the two rule configurations and three eras independently',()=>{
 for(const ruleset of Object.keys(D.RULESETS))for(const era of Object.keys(D.worldEras)){
  const g=create(ruleset,era);
  assert.equal(g.settings.era,era);assert.equal(g.settings.ruleset,ruleset);
  assert.equal(g.player.hours,ruleset==='classic'?60:40);
  assert.equal(g.player.dependability,ruleset==='classic'?20:10);
  const restored=Game.load(g.snapshot());assert.equal(restored.settings.era,era);assert.equal(restored.settings.ruleset,ruleset);
 }
});
test('visual eras never change action economy for the same ruleset',()=>{
 const bases=Object.keys(D.worldEras).map(era=>create('modern',era));
 for(const g of bases){go(g,'agency');action(g,'apply:server');go(g,'diner');action(g,'work');}
 for(const g of bases.slice(1)){
  assert.equal(g.player.cash,bases[0].player.cash);
  assert.equal(g.player.hours,bases[0].player.hours);
  assert.equal(g.player.experience,bases[0].player.experience);
  assert.equal(g.player.job,bases[0].player.job);
 }
});
test('Classic has stricter action costs, no stories/gigs and weekly decay',()=>{
 const g=create('classic');const m=create('modern');
 assert.ok(g.travelCost('home','agency')>m.travelCost('home','agency')); // Different historical geometry; Classic also charges entry hours.
 go(g,'agency');go(m,'agency');
 assert.equal(g.actions().find(a=>a.id==='apply:classic-monolith-cook').hours,4);
 assert.equal(m.actions().find(a=>a.id==='apply:server').hours,3);
 assert.equal(g.actions().some(a=>a.id==='chat'),false);
 go(g,'home');assert.equal(g.actions().some(a=>a.id==='freelance'),false);
 assert.equal(g.actions().some(a=>a.id==='pulse'||a.id==='favor'||a.id.startsWith('arc:')),false);
 action(g,'relax');assert.equal(g.player.hours,60-g.travelCost('home','agency')-g.travelCost('agency','home')-6);
 g.endTurn();assert.equal(g.player.dependability,17);assert.equal(g.player.hours,60);
});
test('Classic work provides capped +1 work experience and dependability',()=>{
 const g=create('classic');const p=g.player;
 go(g,'agency');
 // Deterministic vacancy check can reject applications; verify hours are still charged.
 const prior=p.hours;const first=g.act('apply:classic-monolith-cook');assert.equal(first.ok,true);assert.equal(prior-p.hours,4);
 let attempts=0;while(!p.job && attempts++<10){action(g,'apply:classic-monolith-cook');}assert.equal(p.job,'classic-monolith-cook');
 go(g,'diner');p.dependability=15;const before={xp:p.experience,dep:p.dependability};action(g,'work');
 assert.equal(p.experience,10);assert.equal(p.dependability,before.dep+1); // Cook is at its XP cap immediately
 p.experience=10;p.dependability=30;action(g,'work');assert.equal(p.experience,10);assert.equal(p.dependability,30);
});
test('Classic price changes and social project bonuses are isolated',()=>{
 const g=create('classic');const modern=create('modern');
 g.cityEventId=D.cityEvents[2].id;modern.cityEventId=D.cityEvents[2].id;
 g.cityProjects[D.storyArcs[0].id]=true;modern.cityProjects[D.storyArcs[0].id]=true;
 assert.equal(g.price(100,'food'),100);
 assert.equal(g.shiftPay({wage:20}),160);
 assert.equal(g.actions().some(a=>a.special),false);
});
test('old save settings migrate to Modern Story and Contemporary (not Classic)',()=>{
 const g=create();const saved=g.snapshot();delete saved.settings.era;delete saved.settings.ruleset;
 const restored=Game.load(saved);assert.equal(restored.settings.ruleset,'modern');assert.equal(restored.settings.era,'current');
});
test('save validation uses rule-specific hour ceiling',()=>{
 const classic=create('classic');classic.player.hours=58;assert.equal(Game.load(classic.snapshot()).player.hours,58);
 const modern=create();modern.player.hours=58;assert.throws(()=>Game.load(modern.snapshot()),/Invalid player state/);
});
test('era art stays distinct; Historical and Sci-Fi SVG, Contemporary uses supplied venue art',()=>{
 const svg=D.worldEras?['historical','current','scifi'].map(e=>Art.scene('office',true,e)):[];
 assert.equal(svg.length,3);assert.equal(new Set(svg).size,3);
 assert.ok(svg[0].startsWith('<svg')&&svg[2].startsWith('<svg'));
 assert.match(svg[1],/scene-photo.*office-card\.webp/);
 assert.ok(svg.every(x=>!/href="https?:|<script/.test(x)));
 assert.match(svg[0],/Historical timber/);assert.match(svg[2],/Sci-fi neon arcology/);
 assert.notEqual(Art.person('home',false,'historical'),Art.person('home',false,'scifi'));
});
test('Classic no-opening rejection charges time but preserves current employer',()=>{
 const g=new Game({mode:'sandbox',ruleset:'classic',seed:2100});
 const p=g.player;p.job='classic-monolith-cook';p.wage=5;
 go(g,'agency');g.rand=()=>.999;const before=p.hours;
 const result=g.act('apply:classic-blacks-janitor');
 assert.equal(result.ok,true);assert.match(result.message,/No openings/i);
 assert.equal(p.hours,before-4);assert.equal(p.job,'classic-monolith-cook');assert.equal(p.wage,5);
});
test('Classic AI handles job rejections and most campaigns survive sixty fluctuating-price weeks',()=>{
 let stable=0;
 for(let seed=1;seed<=30;seed++){
  const g=new Game({ruleset:'classic',seed});
  for(let week=0;week<60&&!g.winner;week++)assert.equal(g.endTurn().ok,true);
  const rival=g.players.find(p=>p.isAI);
  assert.ok(rival.job,`seed ${seed}: rival must remain employable`);
  assert.ok(Number.isFinite(rival.cash)&&rival.cash>=0&&rival.rentDebt<1000,`seed ${seed}: runaway balances`);
  if(rival.hunger===0&&rival.rentDebt<=325)stable++;
 }
 // Original DOS 0-happiness, empty-pantry start and $65 takeout are tougher than the legacy 62-joy/one-pantry start.
 // Track the remaining 3/30 hardship seeds as source/AI follow-up, not hidden relief income.
 assert.ok(stable>=27,`Only ${stable}/30 maintained both food and rent reserve targets`);
});
