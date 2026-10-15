'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {execFileSync}=require('node:child_process');
const Game=require('../src/engine.js'),Home=require('../src/classic-household.js');
const root=join(__dirname,'..'),read=name=>JSON.parse(readFileSync(join(root,name),'utf8'));
const classic=()=>new Game({mode:'sandbox',ruleset:'classic',seed:542});
test('maintenance quotes preserve essentials and never mutate or draw RNG',()=>{
 const p=classic().player;
 p.owned=['fridge','computer'];p.classicEquipment={fridge:{source:'discount',broken:true},computer:{source:'pawn',broken:true}};
 p.cash=200;
 const before=JSON.stringify(p);
 let plan=Home.repairCandidates(p,{fridge:255,computer:590},160);
 assert.equal(plan.choices.length,2);assert.equal(plan.best,null);
 p.cash=250;plan=Home.repairCandidates(p,{fridge:255,computer:590},150);
 assert.equal(plan.best.id,'fridge');assert.equal(plan.best.cost,51);
 assert.equal(plan.choices[1].affordable,false);
 assert.ok(Object.isFrozen(plan.choices));assert.notEqual(JSON.stringify(p),before); // only caller changed cash
 assert.throws(()=>Home.repairCandidates({...p,cash:-5},{fridge:255},0));
});
test('a Classic maintenance plan is deterministic, respects reserve, and Modern rejects it',()=>{
 const g=classic(),p=g.player;p.owned=['fridge'];p.classicEquipment={fridge:{source:'discount',broken:true}};
 p.cash=5000;const oldHours=p.hours;
 const plan=g.classicMaintenancePlan(p);
 assert.equal(plan.best.id,'fridge');assert.equal(plan.best.cost,51);
 assert.equal(g.classicMaintenancePlan(p).best.id,'fridge');assert.equal(p.hours,oldHours);
 p.cash=0;assert.equal(g.classicMaintenancePlan(p).best,null);
 const modern=new Game({mode:'sandbox',ruleset:'modern',seed:542});
 assert.throws(()=>modern.classicMaintenancePlan(),/Classic-only/);
});
test('maintenance work is listed in Classic UI and does not change Modern mechanics',()=>{
 const src=readFileSync(join(root,'src/app.js'),'utf8');
 assert.match(src,/maintenancePanel/);assert.match(src,/Household repairs/);
 const engine=readFileSync(join(root,'src/engine.js'),'utf8');
 assert.match(engine,/perform\('classicRepair:'\+item\.id\)/);
 assert.match(engine,/two-week survival/);
});
test('workboard lifecycle is complete and a corrupt status mapping makes release check fail',()=>{
 const life=read('docs/workboard-lifecycle.json'),manifest=read('.ziprunner-workboard-update.json'),historical=read('docs/workboard-history.json');
 assert.equal(life.release,read('package.json').version);
 assert.equal(life.items.length,historical.implemented.length+manifest.implemented.length+manifest.remaining.length);
 assert.equal(life.counts.blocked,15);
 assert.ok(life.items.some(t=>t.id==='LL-175'&&t.status==='blocked'&&t.unblock_when));
 assert.ok(life.items.some(t=>t.id==='LL-251'&&t.status==='done'&&t.evidence.operator_checks.length));
 assert.ok(life.items.every(t=>!['done','blocked'].includes(t.status)|| (t.status==='done'?!!t.evidence:!!t.unblock_when)));
 execFileSync(process.execPath,['tools/reconcile-workboard.mjs','--check'],{cwd:root});
});
