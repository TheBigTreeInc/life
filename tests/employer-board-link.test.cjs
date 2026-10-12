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
 for(const j of D.classicJobs){const w=D.jobWorkplace(j);assert.equal(w.place,j.place);assert.ok(D.places.some(p=>p.id===w.place));assert.ok(w.label.startsWith(w.boardName));assert.equal(w.originalName,j.employer);}
});
test('original DOS job identity is preserved, while player-facing workplace is The Good Fork',()=>{
 const g=start(),p=g.player;
 move(g,'agency');const option=g.actions().find(a=>a.id==='apply:classic-monolith-cook');
 assert.ok(option.title.includes('The Good Fork'));
 assert.ok(option.detail.includes('Original employer: Monolith Burgers'));
 assert.equal(option.workplace,'diner');
 const hire=g.act('apply:classic-monolith-cook');assert.ok(hire.ok);assert.match(hire.message,/Hired.*The Good Fork/);
 assert.equal(p.job,'classic-monolith-cook');assert.equal(g.jobWorkplace(g.getJob(p)).label,'The Good Fork');
 assert.equal(g.actions().some(a=>a.id==='work'),false,'agency is not a work location');
 move(g,'market');assert.equal(g.actions().some(a=>a.id==='work'),false);
 move(g,'diner');const work=g.actions().find(a=>a.id==='work');assert.ok(work);assert.match(work.title,/Work at The Good Fork/);
 const r=g.act('work');assert.ok(r.ok);assert.match(r.message,/at The Good Fork/);
});
test('Classic grocery and discount employers share one tile but remain separate job departments',()=>{
 const disc=D.jobWorkplace(job('classic-zmart-clerk'));
 const grocery=D.jobWorkplace(job('classic-blacks-checker'));
 assert.equal(disc.place,'market');assert.equal(grocery.place,'market');
 assert.equal(disc.boardName,'Fresh & Frugal');assert.equal(grocery.boardName,'Fresh & Frugal');
 assert.notEqual(disc.label,grocery.label);
 const g=start(),p=g.player;p.job='classic-zmart-clerk';p.wage=5;p.location='market';
 assert.match(g.actions().find(a=>a.id==='work').title,/Fresh & Frugal · Discount/);
 p.job='classic-blacks-checker';assert.match(g.actions().find(a=>a.id==='work').title,/Fresh & Frugal · Groceries/);
});
test('Modern Story jobs resolve to unchanged matching board businesses',()=>{
 const g=new Game({ruleset:'modern',mode:'sandbox'});
 for(const j of g.jobs){const w=D.jobWorkplace(j);assert.equal(w.place,j.place);assert.equal(w.originalName,j.employer||null);}
});
test('city board, sidebar, Career Center, and switch dialogue all use canonical employer venue',()=>{
 for(const token of ['D.jobWorkplace(j)','workplace.label','workplace.boardName','isWorkplace','work-marker','is-workplace','data-travel','D.jobWorkplace(oldJob).label','D.jobWorkplace(nextJob).label','D.jobWorkplace(roles[0]).label'])assert.ok(app.includes(token),token);
 assert.match(css,/\.work-marker/);assert.match(css,/\.workplace-hint/);
});
