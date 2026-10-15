const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const D=require('../src/data.js');
const Game=require('../src/engine.js');
const app=fs.readFileSync('src/app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
const start=()=>new Game({mode:'sandbox',ruleset:'classic',seed:33});
const move=(g,to)=>{const result=g.travel(to);assert.ok(result.ok,result.message);};
const job=id=>D.classicJobs.find(j=>j.id===id);

test('every Classic employer resolves to a real board company and matching workplace ID',()=>{
 assert.equal(D.classicJobs.length,37);
 assert.equal(Object.keys(D.classicEmployerVenues).length,9);
 for(const j of D.classicJobs){const w=D.jobWorkplace(j);assert.equal(w.place,j.place);assert.ok(D.classicPlaces.some(p=>p.id===w.place));assert.ok(w.label.startsWith(w.boardName));assert.equal(w.originalName,j.employer);}
});
test('original DOS job identity is preserved, while player-facing workplace is Monolith Burger',()=>{
 const g=start(),p=g.player;
 move(g,'agency');const option=g.actions().find(a=>a.id==='apply:classic-monolith-cook');
 assert.ok(option.title.includes('Monolith Burger'));
 assert.ok(option.detail.includes('Original employer: Monolith Burgers'));
 assert.equal(option.workplace,'diner');
 const hire=g.act('apply:classic-monolith-cook');assert.ok(hire.ok);assert.match(hire.message,/Hired.*Monolith Burger/);
 assert.equal(p.job,'classic-monolith-cook');assert.equal(g.jobWorkplace(g.getJob(p)).label,'Monolith Burger');
 assert.equal(g.actions().some(a=>a.id==='work'),false,'agency is not a work location');
 move(g,'market');assert.equal(g.actions().some(a=>a.id==='work'),false);
 move(g,'diner');const work=g.actions().find(a=>a.id==='work');assert.ok(work);assert.match(work.title,/Work at Monolith Burger/);
 const r=g.act('work');assert.ok(r.ok);assert.match(r.message,/at Monolith Burger/);
});
test('Classic grocery and discount employers use their own distinct board locations',()=>{
 const disc=D.jobWorkplace(job('classic-zmart-clerk'));
 const grocery=D.jobWorkplace(job('classic-blacks-checker'));
 const gmap=start();
 assert.equal(gmap.jobWorkplace(job('classic-zmart-clerk')).place,'market');
 assert.equal(gmap.jobWorkplace(job('classic-blacks-checker')).place,'cinema');
 assert.notEqual(disc.originalName,grocery.originalName);
 assert.equal(grocery.place,'cinema');
 const g=start(),p=g.player;p.job='classic-zmart-clerk';p.wage=5;p.location='market';
 assert.match(g.actions().find(a=>a.id==='work').title,/Z-Mart Discount/);
 p.job='classic-blacks-checker';assert.equal(g.actions().find(a=>a.id==='work'),undefined);p.location='cinema';assert.match(g.actions().find(a=>a.id==='work').title,/Black's Market/);
});
test('Modern Story jobs resolve to unchanged matching board businesses',()=>{
 const g=new Game({ruleset:'modern',mode:'sandbox'});
 for(const j of g.jobs){const w=D.jobWorkplace(j);assert.equal(w.place,j.place);assert.equal(w.originalName,j.employer||null);}
});
test('city board, sidebar, Career Center, and switch dialogue all use canonical employer venue',()=>{
 for(const token of ['game.jobWorkplace(j)','workplace.label','workplace.boardName','isWorkplace','work-marker','is-workplace','data-travel','game.jobWorkplace(oldJob).label','game.jobWorkplace(nextJob).label','game.jobWorkplace(roles[0]).label'])assert.ok(app.includes(token),token);
 assert.match(css,/\.work-marker/);assert.match(css,/\.workplace-hint/);
});
