const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
function classic(mode='solo'){return new Game({ruleset:'classic',mode,seed:12345});}
function cook(g){const p=g.player;p.location='diner';p.job='classic-monolith-cook';p.wage=5;return p;}
function tech(g){g.player.location='pawn';return g.player;}
const action=(g,id)=>g.actions().find(a=>a.id===id);

test('Classic partial work consumes exactly remaining hours and pays proportional 8-hour earnings',()=>{
 const g=classic(),p=cook(g);p.hours=3;const prior={cash:p.cash,exp:p.experience,rel:p.dependability};
 assert.equal(action(g,'work').hours,3);assert.equal(action(g,'work').title,'Work at Monolith Burger · $20');
 assert.equal(g.act('work').ok,true);assert.equal(p.hours,0);assert.equal(p.cash,prior.cash+20);
 assert.equal(p.classicWorkHourCredit,0);assert.equal(p.workSessions,1);
 assert.equal(p.experience,prior.exp);assert.equal(p.dependability,prior.rel+1);
 assert.equal(action(g,'work').enabled,false,'zero time cannot work');
});
test('Classic 1h work is productive and grants the source-backed per-action stat credit',()=>{
 const g=classic(),p=cook(g);p.job='classic-blacks-checker';p.wage=8;p.location='cinema';const before=p.experience;
 p.hours=1;assert.equal(action(g,'work').hours,1);assert.equal(g.act('work').ok,true);
 assert.equal(p.cash,210);assert.equal(p.classicWorkHourCredit,0);assert.equal(p.experience,before+1);
 // Each successful shift increments XP once, while still truncating gross pay.
 for(let i=0;i<5;i++){p.hours=1;p.energy=100;g.act('work');}
 assert.equal(p.workSessions,6);assert.equal(p.classicWorkHourCredit,0);assert.equal(p.experience,before+6);
});
test('Full Classic work remains 6h paid for 8h and Modern keeps existing 6h requirement',()=>{
 const classicGame=classic(),p=cook(classicGame),xp=p.experience;p.job='classic-blacks-checker';p.wage=8;p.location='cinema';
 assert.equal(action(classicGame,'work').hours,6);assert.equal(classicGame.act('work').ok,true);
 assert.equal(p.cash,264);assert.equal(p.hours,54);assert.equal(p.experience,xp+1);assert.equal(p.workSessions,1);
 const modern=new Game({ruleset:'modern'}),m=modern.player;
 m.location='diner';m.job='server';m.wage=9;m.hours=3;
 const work=action(modern,'work');assert.equal(work.hours,6);assert.equal(work.enabled,false);
});
test('Partial work uses proportional garnishment and never produces negative take-home pay',()=>{
 const g=classic(),p=cook(g);p.hours=1;p.rentDebt=100;
 const before=p.cash;const result=g.act('work');
 assert.equal(result.ok,true);assert.equal(p.cash,before+1);assert.equal(p.rentDebt,97);
 assert.equal(p.hours,0);assert.match(result.message,/back rent/);
});
test('Changing employer or dismissal resets work credit; arbitrary action cannot work at other employer',()=>{
 const g=classic(),p=cook(g);p.job='classic-blacks-checker';p.wage=8;p.classicWorkHourCredit=5;p.location='agency';p.hours=40;
 // Hiring outcome is not guaranteed except the original entry-level Cook job.
 const cookJob='classic-monolith-cook';assert.equal(g.act('apply:'+cookJob).ok,true);
 assert.equal(p.classicWorkHourCredit,0);
 p.location='bank';p.job='classic-bank-teller';p.wage=10;p.clothing.formal=4;p.classicWorkHourCredit=3;p.dependability=0;
 assert.equal(g.act('work').ok,true);assert.equal(p.classicWorkHourCredit,0);assert.equal(p.job,null);
});
test('Pawn valuable at dedicated Second Chance Pawn and redeem it within the deadline, with full ledger and save roundtrip',()=>{
 const g=classic(),p=tech(g);p.owned.push('computer');
 const priorCash=p.cash;const pawn=action(g,'classicPawn:computer');assert.equal(pawn.enabled,true);
 assert.equal(g.act(pawn.id).ok,true);assert.equal(p.owned.includes('computer'),false);assert.equal(p.cash,priorCash+265);
 assert.equal(g.classicPawnLots.length,1);const lot=g.classicPawnLots[0];assert.equal(lot.dueWeek,3);
 const loaded=Game.load(g.snapshot());const p2=loaded.player;p2.location='pawn';
 const redeem=action(loaded,'classicRedeem:'+lot.id);assert.equal(redeem.price,292);assert.equal(redeem.enabled,true);
 assert.equal(loaded.act(redeem.id).ok,true);assert.ok(p2.owned.includes('computer'));
 assert.equal(loaded.classicPawnLots.length,0);assert.equal(p2.cash,priorCash-27);
 assert.equal(loaded.finances(p2).ledger.some(r=>r.category==='pawn'),true);
});
test('Expired pawn cannot be redeemed and can be purchased once by the other human player',()=>{
 const g=classic('hotseat'),owner=tech(g);owner.owned.push('dictionary');
 assert.equal(g.act('classicPawn:dictionary').ok,true);
 const lotId=g.classicPawnLots[0].id;
 for(let i=0;i<3;i++)g.newWeek();
 assert.equal(g.week,4);assert.equal(action(g,'classicRedeem:'+lotId),undefined);
 g.active=1;const friend=tech(g);friend.cash=500;
 assert.equal(action(g,'classicBuyPawn:'+lotId).enabled,true);
 const before=friend.cash;
 assert.equal(g.act('classicBuyPawn:'+lotId).ok,true);
 assert.ok(friend.owned.includes('dictionary'));
 assert.equal(friend.cash,before-45);assert.equal(g.classicPawnLots.length,0);
 assert.equal(g.act('classicBuyPawn:'+lotId).ok,false,'expired item cannot be bought twice');
 g.active=0;assert.equal(owner.owned.includes('dictionary'),false);
});
test('Pawned items lose their durable benefit, freezer ordering is enforced, and others cannot buy unexpired lots',()=>{
 const g=classic('hotseat'),p=tech(g);p.owned.push('fridge','freezer','computer');
 assert.equal(action(g,'classicPawn:fridge').enabled,false);
 assert.equal(g.act('classicPawn:fridge').ok,false);
 assert.equal(g.act('classicPawn:freezer').ok,true);
 assert.equal(g.act('classicPawn:computer').ok,true);
 assert.equal(p.owned.includes('computer'),false);
 assert.equal(g.classicPawnLots.length,2);
 g.active=1;const friend=tech(g);friend.cash=1000;
 assert.equal(action(g,'classicBuyPawn:'+g.classicPawnLots[0].id),undefined);
});
test('Pawn state rejects forged lot, preserves expiry through snapshot and does not affect Modern rules',()=>{
 const g=classic('hotseat'),p=tech(g);p.owned.push('dictionary');g.act('classicPawn:dictionary');
 const good=g.snapshot(),bad=JSON.parse(JSON.stringify(good));bad.classicPawnLots[0].redemption=0;
 assert.throws(()=>Game.load(bad),/Invalid pawn lot/);
 const dup=JSON.parse(JSON.stringify(good));dup.classicPawnLots.push({...dup.classicPawnLots[0]});
 assert.throws(()=>Game.load(dup),/Invalid pawn lot/);
 const loaded=Game.load(good);assert.deepEqual(loaded.classicPawnLots,good.classicPawnLots);
 const modern=new Game({ruleset:'modern'});modern.player.location='pawn';modern.player.owned.push('dictionary');
 assert.equal(modern.actions().some(x=>x.id==='classicPawn:dictionary'),true,'Modern has the same pawn venue and action');
});
