'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),path=require('node:path');
const Weekly=require('../src/classic-weekly-events.js');
const Game=require('../src/engine.js');
const {RouteOverlay}=require('../src/route-overlay.js');
const root=path.resolve(__dirname,'..');
const load=p=>readFileSync(path.join(root,p),'utf8');
const classic=()=>new Game({mode:'sandbox',ruleset:'classic',seed:540});
test('DOS state 6 models separate relaxation, floor ten, and hot-tub exemption without randomness',()=>{
 assert.deepEqual(Weekly.relaxationStep(12),{sourceState:6,before:12,after:11,hasHotTub:false,delta:-1});
 assert.equal(Weekly.relaxationStep(10).after,10);
 assert.equal(Weekly.relaxationStep(12,true).after,12);
 assert.throws(()=>Weekly.relaxationStep(9),/Invalid DOS relaxation/);
 const g=classic(),p=g.player;
 assert.equal(p.classicRelaxation,16);
 g.newWeek();assert.equal(p.classicRelaxation,15);
 const trace=g.classicWeekEvents.find(e=>e.kind==='relaxation'&&e.playerId===p.id);
 assert.equal(trace?.sourceState,6);assert.equal(trace?.after,15);
 p.classicRelaxation=10;g.newWeek();assert.equal(p.classicRelaxation,10);
});
test('Classic rest restores its own relaxation reserve and saves roundtrip, not Modern rules',()=>{
 const g=classic(),p=g.player;
 p.classicRelaxation=10;p.energy=25;
 const action=g.act('relax');assert.equal(action.ok,true);
 assert.equal(p.classicRelaxation,16);
 const saved=g.snapshot();assert.equal(Game.load(saved).player.classicRelaxation,16);
 const old=structuredClone(saved);delete old.players[0].classicRelaxation;
 assert.equal(Game.load(old).player.classicRelaxation,16,'older saves upgrade');
 for(const value of [-1,9,31,NaN,'16']){
  const malformed=structuredClone(saved);malformed.players[0].classicRelaxation=value;
  assert.throws(()=>Game.load(malformed),/Invalid Classic relaxation/);
 }
 const modern=new Game({mode:'sandbox',ruleset:'modern',seed:540});
 modern.newWeek();assert.equal(modern.classicWeekEvents.length,0);
});
test('DOS state 20 loan schedule reuses existing consequences without extra charges',()=>{
 assert.equal(Weekly.loanDueTrace(5,0,100).missed,true);
 assert.equal(Weekly.loanDueTrace(5,1,100).missed,false);
 assert.equal(Weekly.loanDueTrace(4,0,100).due,false);
 assert.equal(Weekly.loanDueTrace(5,0,0).due,false);
 assert.throws(()=>Weekly.loanDueTrace(5,-1,100),/Invalid DOS loan/);
 const g=classic(),p=g.player;
 g.week=4;p.debt=150;p.classicLoanPaidThrough=0;
 g.newWeek();
 const trace=g.classicWeekEvents.find(e=>e.kind==='loan-due'&&e.playerId===p.id);
 assert.equal(trace?.sourceState,20);assert.equal(trace?.missed,true);assert.equal(trace?.dueMonth,1);
 assert.equal(trace?.penaltyVerified,false);assert.equal(p.classicLoanDefaults,1);
 assert.equal(Game.load(g.snapshot()).classicWeekEvents.some(e=>e.sourceState===20),true);
});
test('Skip animation finishes once, including final camera update, but never acts on the game',()=>{
 const g=classic(),before=JSON.stringify(g.snapshot());
 let resolutions=0,finalPoint=null,renders=0,cancelled=0;
 const anim={raf:23,points:[{x:0,y:0},{x:10,y:5}],onStep:point=>{finalPoint=point;},done:success=>{assert.equal(success,true);resolutions++;}};
 const fake={anim,animationSerial:10,render:()=>{renders++;}};
 const previous=global.cancelAnimationFrame;
 global.cancelAnimationFrame=()=>{cancelled++;};
 try{
  assert.equal(RouteOverlay.prototype.finishAnimation.call(fake),true);
  assert.equal(RouteOverlay.prototype.finishAnimation.call(fake),false);
 }finally{if(previous===undefined)delete global.cancelAnimationFrame;else global.cancelAnimationFrame=previous;}
 assert.equal(cancelled,1);assert.equal(resolutions,1);assert.equal(renders,1);
 assert.deepEqual(finalPoint,{x:10,y:5});
 assert.equal(JSON.stringify(g.snapshot()),before);
});
test('Skip animation controls are Classic-only and operate on the overlay, not a second game travel',()=>{
 const html=load('index.html'),app=load('src/app.js'),css=load('styles.css');
 assert.ok(html.includes('id="classicTravelSkip"'));
 assert.ok(html.includes('id="classicTravelControls"'));
 assert.match(app,/\$\('classicTravelSkip'\)\.addEventListener\('click',\(\)=>routeOverlay\?\.finishAnimation\(\)\)/);
 assert.match(app,/phase!=='departing'/);
 assert.match(css,/classic-travel-controls\[hidden\]/);
 assert.match(load('src/route-overlay.js'),/finishAnimation\(\)/);
});
