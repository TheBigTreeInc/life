const test=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const start=()=>new Game({mode:'sandbox',ruleset:'classic',seed:18});
const move=(g,to)=>{const r=g.travel(to);assert.equal(r.ok,true,r.message);};
const action=(g,id)=>{const r=g.act(id);assert.equal(r.ok,true,r.message);return r;};
const get=id=>D.classicJobs.find(j=>j.id===id);

test('DOS employment table has all 37 floppy roles, excludes two CD-only roles and keeps Modern jobs separate',()=>{
 assert.equal(D.classicJobs.length,37);assert.equal(D.jobs.length,19);
 const workplaces=Object.fromEntries([...new Set(D.classicJobs.map(j=>j.employer))].map(w=>[w,D.classicJobs.filter(j=>j.employer===w).length]));
 assert.deepEqual(workplaces,{'Z-Mart':3,'Monolith Burgers':4,'QT Clothing':3,'Socket City':3,'Hi-Tech U':3,'Factory':9,'Bank':5,"Black's Market":5,'Rent Office':2});
 assert.equal(get('classic-factory-general-manager').wage,25);
 assert.deepEqual(get('classic-factory-general-manager').degrees,['business-admin','engineering']);
 assert.equal(get('classic-bank-broker').wage,22);
 assert.deepEqual(get('classic-bank-broker').degrees,['business-admin','academic']);
 assert.equal(get('classic-monolith-cook').entryGuaranteed,true);
 assert.equal(get('classic-socket-electronics-repairman').clothes,'casual');
 assert.equal(D.classicJobs.some(j=>j.id==='classic-qt-janitor'),false);
 assert.equal(D.classicJobs.some(j=>j.id==='classic-socket-clerk'),false);
});
test('Classic Career Center lists employer-specific roles and real stat/uniform/degree requirements',()=>{
 const g=start();move(g,'agency');const actions=g.actions().filter(a=>a.id.startsWith('apply:'));
 assert.equal(actions.length,37);
 const general=actions.find(a=>a.id==='apply:classic-factory-general-manager');
 assert.match(general.detail,/Factory/);assert.match(general.detail,/25/);assert.match(general.detail,/Business suit/);
 assert.match(general.detail,/Unqualified/);assert.equal(general.enabled,true,'Unqualified applications intentionally remain clickable');
});
test('An unqualified Classic application consumes four hours, lowers happiness, and retains the current job',()=>{
 const g=start(),p=g.player;move(g,'agency');action(g,'apply:classic-monolith-cook');
 const before={hours:p.hours,happiness:p.happiness,wage:p.wage};
 const out=action(g,'apply:classic-factory-general-manager');assert.match(out.message,/rejected/i);
 assert.equal(p.hours,before.hours-4);assert.equal(p.happiness,before.happiness-1);
 assert.equal(p.job,'classic-monolith-cook');assert.equal(p.wage,before.wage);
});
test('Cook is always accepted even at zero reliability or after failing other applications',()=>{
 const g=start(),p=g.player;move(g,'agency');p.dependability=0;p.experience=0;g.rand=()=>.9999;
 action(g,'apply:classic-monolith-cook');assert.equal(p.job,'classic-monolith-cook');assert.equal(p.experience,2);assert.equal(p.dependability,10);
});
test('Chance-based No Openings is locked for same role for one week, not other roles',()=>{
 const g=start(),p=g.player;move(g,'agency');g.rand=()=>.99999;
 const first=action(g,'apply:classic-zmart-clerk');assert.match(first.message,/No openings/);
 assert.equal(p.classicRejectedOpenings['classic-zmart-clerk'],1);
 g.rand=()=>0;
 assert.match(action(g,'apply:classic-zmart-clerk').message,/No openings/);
 assert.match(action(g,'apply:classic-monolith-cook').message,/Hired!/);
 assert.equal(p.job,'classic-monolith-cook');
 for(let i=0;i<1;i++)g.endTurn();
 move(g,'agency');action(g,'apply:classic-zmart-clerk');assert.equal(p.job,'classic-zmart-clerk');
});
test('Classic job chance uses actual Experience, Dependability, degrees, rather than flat rejection rate',()=>{
 const g=start(),p=g.player;assert.ok(Math.abs(g.classicLuck(p)-43.333333333333336)<1e-6);
 p.classicDegrees=['junior-college','trade-school'];p.experience=30;p.dependability=50;
 assert.ok(Math.abs(g.classicLuck(p)-(30+(10+30+50+16)/3))<1e-6);
});
test('One successful hire changes the single contract and grants three happiness',()=>{
 const g=start(),p=g.player;move(g,'agency');p.dependability=60;p.experience=60;p.classicDegrees=['junior-college'];g.rand=()=>0;
 action(g,'apply:classic-monolith-cook');const after=p.happiness;
 action(g,'apply:classic-bank-teller');assert.equal(p.job,'classic-bank-teller');assert.equal(p.wage,10);assert.equal(p.happiness,after+3);
 move(g,'diner');assert.equal(g.actions().find(a=>a.id==='work'),undefined);
 move(g,'bank');assert.equal(g.actions().find(a=>a.id==='work').enabled,false,'Requires dress clothing');
});
test('Classic raises match published job rate, cost four hours, require reliability; Modern remains independent',()=>{
 const g=start(),p=g.player;move(g,'agency');p.job='classic-zmart-clerk';p.wage=4;p.dependability=30;
 const oldTime=p.hours;action(g,'raise');assert.equal(oldTime-p.hours,4);assert.equal(p.wage,5);assert.equal(p.classicRaises,1);
 assert.equal(g.actions().find(a=>a.id==='raise').enabled,false);
 g.economy=1.4;assert.equal(g.actions().find(a=>a.id==='raise').enabled,true);
 action(g,'raise');assert.equal(p.wage,7);assert.equal(p.classicRaises,2);
 const modern=new Game({mode:'sandbox',ruleset:'modern'});move(modern,'agency');assert.equal(modern.actions().some(a=>a.id==='apply:classic-zmart-clerk'),false);
});
test('Classic rent: $325 starts due week four; no forced deduction before or after paying',()=>{
 const g=start(),p=g.player;p.cash=400;move(g,'housing');assert.equal(g.actions().find(a=>a.id==='classicPayRent').enabled,false);
 for(let i=0;i<3;i++)g.endTurn();assert.equal(g.week,4);assert.equal(p.classicRentDueWeek,4);
 assert.equal(g.actions().find(a=>a.id==='classicPayRent').enabled,true);
 p.cash=400;action(g,'classicPayRent');assert.equal(p.cash,75);assert.equal(p.classicRentDueWeek,8);
 g.endTurn();assert.equal(p.rentDebt,0);assert.equal(p.classicRentDueWeek,8);
});
test('Missing rent creates debt on week five, does not silently drain savings, and disables extensions forever',()=>{
 const g=start(),p=g.player;p.cash=0;p.bank=500;
 for(let i=0;i<4;i++)g.endTurn();
 assert.equal(g.week,5);assert.ok(p.bank>=500);assert.equal(p.rentDebt,325);
 assert.equal(p.classicEverDebt,true);assert.equal(p.classicRentDueWeek,8);
 p.cash=500;move(g,'housing');assert.equal(g.actions().find(a=>a.id==='classicRentExtension').enabled,false);
});
test('Rent extension first request always succeeds; only one request per week; next due follows grace week',()=>{
 const g=start(),p=g.player;move(g,'housing');for(let i=0;i<3;i++)g.endTurn();
 action(g,'classicRentExtension');assert.equal(p.classicRentDueWeek,5);assert.equal(p.classicExtensions,1);
 assert.equal(g.actions().find(a=>a.id==='classicRentExtension').enabled,false);
 g.endTurn();assert.equal(g.week,5);assert.equal(p.rentDebt,0);
 p.cash=400;assert.equal(g.actions().find(a=>a.id==='classicPayRent').enabled,true);
});
test('Classic rent debt garnishes half the gross shift and $2 fee, capped when debt is small',()=>{
 const g=start(),p=g.player;p.job='classic-zmart-clerk';p.wage=5;p.location='market';p.rentDebt=325;p.classicEverDebt=true;
 const cash=p.cash;action(g,'work');assert.equal(p.cash-cash,18);assert.equal(p.rentDebt,305);
 p.rentDebt=10;const cash2=p.cash;action(g,'work');assert.equal(p.cash-cash2,30);assert.equal(p.rentDebt,0);
});
test('Classic v0.4.6 saved roles migrate to new DOS-specific IDs without losing money or pay',()=>{
 const g=start();const save=g.snapshot();save.players[0].job='director';save.players[0].wage=95;delete save.players[0].classicRentDueWeek;
 const restored=Game.load(save),p=restored.player;
 assert.equal(p.job,'classic-factory-general-manager');assert.equal(p.wage,95);assert.equal(p.classicRentDueWeek,4);
 assert.deepEqual(Game.load(restored.snapshot()).snapshot(),restored.snapshot());
});
test('Classic employment and rent state persist through save and load without duplicated charges',()=>{
 const g=start(),p=g.player;move(g,'agency');g.rand=()=>.999;
 action(g,'apply:classic-zmart-clerk');
 for(let i=0;i<4;i++)g.endTurn();
 const save=g.snapshot(),out=Game.load(save);
 assert.deepEqual(out.snapshot(),save);assert.equal(out.player.classicRejectedOpenings['classic-zmart-clerk'],1);
 assert.equal(out.player.classicRentDueWeek,8);
});
test('100 seeded Classic 60-week AI campaigns retain a job, avoid hunger/debt softlock',()=>{
 for(let seed=1;seed<=100;seed++){
  const g=new Game({ruleset:'classic',seed});for(let w=0;w<60&&!g.winner;w++)g.endTurn();
  const rival=g.players.find(p=>p.isAI);assert.ok(rival.job,`${seed} lost job`);
  assert.equal(rival.hunger,0,`${seed} went hungry`);
  assert.equal(rival.rentDebt,0,`${seed} entered rent debt`);
 }
});
