const test=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const g=()=>new Game({mode:'sandbox',ruleset:'classic',seed:77});
function go(game,place){const result=game.travel(place);assert.equal(result.ok,true,result.message);}
function doIt(game,id){const result=game.act(id);assert.equal(result.ok,true,id+': '+result.message);return result;}

test('Classic begins at 10 Experience, 20 Dependability, 60 hours, while Modern is unchanged',()=>{
 const classic=g(),modern=new Game({mode:'sandbox'});
 assert.equal(classic.player.experience,10);assert.equal(classic.player.dependability,20);assert.equal(classic.player.hours,60);
 assert.equal(modern.player.experience,0);assert.equal(modern.player.dependability,10);assert.equal(modern.player.hours,40);
});
test('The classic education graph has exactly eleven degrees, two roots and no unreachable cycles',()=>{
 assert.equal(D.classicDegrees.length,11);const ids=new Set(D.classicDegrees.map(d=>d.id));assert.equal(ids.size,11);
 assert.deepEqual(D.classicDegrees.filter(d=>d.requires.length===0).map(d=>d.id),['junior-college','trade-school']);
 let complete=new Set();while(complete.size<11){const available=D.classicDegrees.filter(d=>!complete.has(d.id)&&d.requires.every(r=>complete.has(r)));
  assert.ok(available.length,'Graph has a cycle');for(const d of available)complete.add(d.id);}
 for(const r of D.classicJobs)for(const id of r.degrees)assert.ok(ids.has(id));
 assert.equal(D.classicJobs.length,37);assert.equal(D.jobs.length,19);
});
test('Classic university requires paid enrollment and supports four concurrent courses',()=>{
 const game=g(),p=game.player;go(game,'university');p.cash=2000;
 assert.equal(game.act('classicStudy:trade-school').ok,false);
 doIt(game,'enroll');assert.equal(p.cash,2000-50);assert.equal(p.hours,game.rules.hours-game.travelCost('home','university'));
 assert.equal(game.actions().find(a=>a.id==='classicStudy:academic').enabled,false);
 assert.equal(game.actions().find(a=>a.id==='classicStudy:trade-school').enabled,true);
 doIt(game,'classicStudy:trade-school');assert.equal(p.classicProgress['trade-school'],1);
 assert.deepEqual(p.classicEnrolled,['trade-school']);assert.equal(p.classicEnrollmentCredits,0);
 assert.equal(game.actions().find(a=>a.id==='classicStudy:electronics')?.enabled,false);
 // Four concurrent enrollment slots can also be tested after prerequisites are already earned.
 p.classicDegrees=['junior-college','trade-school','academic'];
 p.classicEnrollmentCredits=7;p.classicEnrolled=[];
 for(const id of ['business-admin','electronics','pre-engineering','graduate-school'])doIt(game,'classicStudy:'+id);
 assert.equal(p.classicEnrolled.length,4);assert.equal(game.actions().find(a=>a.id==='classicStudy:post-doctoral').enabled,false);
 assert.equal(game.actions().find(a=>a.id==='classicStudy:engineering').enabled,false);
});
test('Ten lessons complete a Classic diploma and provide uncapped graduation boost',()=>{
 const game=g(),p=game.player;go(game,'university');p.cash=2000;doIt(game,'enroll');
 p.classicProgress['junior-college']=9;p.classicEnrolled=['junior-college'];p.classicEnrollmentCredits=0;
 p.dependability=97;p.happiness=62;const result=doIt(game,'classicStudy:junior-college');
 assert.match(result.message,/Graduated/);assert.ok(p.classicDegrees.includes('junior-college'));
 assert.equal(p.dependability,100);assert.equal(p.happiness,67);assert.equal(p.classicProgress['junior-college'],undefined);
 assert.equal(game.actions().find(a=>a.id==='classicStudy:business-admin').enabled,false); // must enroll
 assert.equal(game.scores(p).education,20);
});
test('A computer reduces Classic study to nine lessons; complete book set reduces another lesson',()=>{
 const game=g(),p=game.player;assert.equal(game.classicLessons(p),10);
 p.owned.push('computer');assert.equal(game.classicLessons(p),9);
 p.owned.push('dictionary','atlas');assert.equal(game.classicLessons(p),9);
 p.owned.push('encyclopedia');assert.equal(game.classicLessons(p),8);
});
test('Classic study consumes remaining partial time while zero-hour lessons are blocked',()=>{
 const game=g(),p=game.player;go(game,'university');p.cash=1000;p.classicEnrollmentCredits=1;p.hours=3;
 doIt(game,'classicStudy:junior-college');assert.equal(p.hours,0);assert.equal(p.classicProgress['junior-college'],1);
 assert.equal(game.act('classicStudy:junior-college').ok,false);
 assert.equal(game.actions().find(a=>a.id==='enroll').enabled,false,'Even a free enrollment needs clock time remaining');
 assert.equal(game.act('enroll').ok,false);assert.equal(p.classicEnrollmentCredits,0);
});
test('Classic requirements include named diplomas and can demand two simultaneously',()=>{
 const game=g(),p=game.player;
 assert.ok(game.jobReasons(p,D.classicJobs.find(j=>j.id==='classic-factory-general-manager')).some(r=>r.includes('Business Administration')));
 p.classicDegrees=['business-admin'];assert.ok(game.jobReasons(p,D.classicJobs.find(j=>j.id==='classic-factory-general-manager')).some(r=>r.includes('Engineering')));
 p.classicDegrees=['business-admin','engineering'];p.experience=70;p.dependability=70;
 assert.equal(game.jobReasons(p,D.classicJobs.find(j=>j.id==='classic-factory-general-manager')).length,0);
});
test('Classic hiring gives +2 Experience and resets low Dependability to ten',()=>{
 const game=g(),p=game.player;go(game,'agency');p.dependability=1;
 game.rand=()=>.8;
 doIt(game,'apply:classic-monolith-cook');assert.equal(p.job,'classic-monolith-cook');assert.equal(p.experience,12);assert.equal(p.dependability,10);
});
test('Classic work caps use original job-dependent formulas and degree count',()=>{
 const game=g(),p=game.player;const job=D.classicJobs.find(x=>x.id==='classic-monolith-cook');p.job='classic-monolith-cook';p.wage=15;p.location='diner';p.energy=100;
 const caps=game.classicWorkCaps(p,job);assert.deepEqual(caps,{experience:10,dependability:30});
 p.experience=10;p.dependability=30;doIt(game,'work');assert.equal(p.experience,10);assert.equal(p.dependability,30);
 p.classicDegrees=['trade-school','junior-college'];assert.deepEqual(game.classicWorkCaps(p,job),{experience:20,dependability:40});
 doIt(game,'work');assert.equal(p.experience,11);assert.equal(p.dependability,31);
});
test('Classic warnings precede dismissal and firing occurs before any wage/time is taken',()=>{
 const game=g(),p=game.player;p.job='classic-bank-teller';p.wage=28;p.location='bank';p.clothing.formal=8;
 p.dependability=37;p.energy=100;
 const warning=doIt(game,'work');assert.match(warning.message,/Warning/i);assert.equal(p.job,'classic-bank-teller');
 p.dependability=34;const beforeCash=p.cash,beforeHours=p.hours;
 const fired=doIt(game,'work');assert.match(fired.message,/Dismissed/i);
 assert.equal(p.job,null);assert.equal(p.cash,beforeCash);assert.equal(p.hours,beforeHours);assert.equal(p.classicDismissals,1);
 assert.equal(game.scores(p).career,0);
});
test('Classic raise requirement increases by five reliability per raise',()=>{
 const game=g(),p=game.player;p.job='classic-monolith-clerk';p.wage=3;p.location='agency';p.dependability=50;game.economy=1;
 assert.equal(game.actions().find(a=>a.id==='raise').enabled,true);
 doIt(game,'raise');assert.equal(p.classicRaises,1);assert.equal(game.actions().find(a=>a.id==='raise').enabled,false);game.classicEconomicIndices.readings.general=140;assert.equal(game.actions().find(a=>a.id==='raise').enabled,true);
 p.dependability=10;assert.equal(game.actions().find(a=>a.id==='raise').enabled,false);
});
test('Classic score derives career from Dependability, education from diploma count; modern remains tier-based',()=>{
 const game=g(),p=game.player;p.dependability=60;
 assert.equal(game.scores(p).career,0);p.job='classic-monolith-cook';assert.equal(game.scores(p).career,100);
 p.classicDegrees=['junior-college','trade-school','electronics'];assert.equal(game.scores(p).education,Math.floor((1+9*3)/50*100));
 const modern=new Game({mode:'sandbox',ruleset:'modern'});modern.player.job='director';assert.ok(modern.scores(modern.player).career>0);
});
test('Older Classic saves migrate linear education without corrupting Modern saves',()=>{
 const game=g(),legacy=game.snapshot(),p=legacy.players[0];p.education=3;p.credits=1;
 delete p.classicDegrees;delete p.classicEnrolled;delete p.classicEnrollmentCredits;delete p.classicProgress;delete p.classicDismissals;delete p.classicRaises;
 const restored=Game.load(legacy);assert.deepEqual(restored.player.classicDegrees,['junior-college','trade-school','business-admin']);
 assert.equal(restored.player.experience>=10,true);assert.ok(Object.keys(restored.player.classicProgress).length>=1);
 const modern=new Game({mode:'sandbox',ruleset:'modern'});modern.player.education=2;
 const imported=Game.load(modern.snapshot());assert.equal(imported.player.education,2);assert.equal(imported.player.classicDegrees.length,0);
});
test('Classic degree progress and enrollment survive repeated saves without duplication',()=>{
 const game=g(),p=game.player;go(game,'university');p.cash=1000;
 doIt(game,'enroll');doIt(game,'classicStudy:junior-college');
 const a=Game.load(game.snapshot());assert.deepEqual(a.snapshot(),game.snapshot());
 assert.equal(a.player.classicProgress['junior-college'],1);assert.equal(a.player.classicEnrolled.length,1);
});
