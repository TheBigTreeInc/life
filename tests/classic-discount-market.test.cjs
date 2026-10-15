const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const classic=()=>new Game({ruleset:'classic',mode:'sandbox',seed:723});
const move=(game,at)=>{const result=game.travel(at);assert.ok(result.ok,result.message);};
const action=(game,id)=>game.actions().find(a=>a.id===id);

test('Classic and Modern retain 13 locations; original Z-Mart and Black’s Market are separate destinations',()=>{
 assert.equal(D.places.length,13);
 assert.equal(D.classicJobs.filter(x=>x.employer==='Z-Mart').length,3);
 assert.equal(D.classicJobs.filter(x=>x.employer==="Black's Market").length,5);
 const g=classic();move(g,'market');
 assert.equal(action(g,'classicFresh:1'),undefined);assert.ok(action(g,'classicDiscount:dictionary'));
 assert.equal(action(g,'classicDiscount:dictionary').department,'Z-Mart Discount');
 move(g,'cinema');assert.ok(action(g,'classicFresh:1'));assert.equal(action(g,'classicDiscount:dictionary'),undefined);
 assert.equal(action(g,'classicFresh:1').department,'Black’s Market');
});
test('Z-Mart four-week cycle is deterministic, discounts vary, groceries never disappear',()=>{
 const g=classic();move(g,'market');
 assert.ok(action(g,'clothes:casual:market'));
 assert.equal(action(g,'clothes:formal:market'),undefined);
 assert.equal(action(g,'classicDiscount:atlas'),undefined);
 assert.ok(action(g,'classicDiscount:baseball'));
 g.week=2;
 assert.equal(action(g,'clothes:casual:market'),undefined);
 assert.ok(action(g,'clothes:formal:market'));
 assert.ok(action(g,'classicDiscount:atlas'));
 move(g,'cinema');assert.ok(action(g,'classicFresh:1'));move(g,'market');
 g.week=5;
 assert.ok(action(g,'classicDiscount:dictionary'));
 assert.deepEqual(D.classicDiscountStock(5),D.classicDiscountStock(1));
});
test('Books are sold at Z-Mart, not Socket City; owned property survives save/load',()=>{
 const g=classic(),p=g.player;p.cash=1000;move(g,'tech');
 assert.equal(action(g,'buy:dictionary'),undefined);
 move(g,'market');assert.ok(g.act('classicDiscount:dictionary').ok);
 assert.ok(p.owned.includes('dictionary'));
 assert.equal(action(g,'classicDiscount:dictionary').enabled,false);
 const reloaded=Game.load(g.snapshot());
 assert.ok(reloaded.player.owned.includes('dictionary'));
 assert.ok(reloaded.classicOwnedValue(reloaded.player)>0);
});
test('Discount items are available only when in current shelf stock and purchases charge once',()=>{
 const g=classic(),p=g.player;p.cash=800;move(g,'market');
 const cost=action(g,'classicDiscount:vcr').price,initialCash=p.cash;
 assert.equal(g.act('classicDiscount:vcr').ok,true);
 assert.equal(p.cash,initialCash-cost);
 assert.equal(g.act('classicDiscount:vcr').ok,false);
 assert.equal(p.owned.filter(v=>v==='vcr').length,1);
 assert.equal(g.act('classicDiscount:atlas').ok,false);
 g.classicGoodsIndex=120;assert.equal(g.classicDiscountPrice('atlas'),g.classicGoodsPrice(D.classicDiscountGoods.atlas.cost));
});
test('Weekend outing tickets are single-slot, saved, spent during the weekend and not replayed',()=>{
 const g=classic(),p=g.player;p.cash=500;move(g,'market');
 assert.ok(g.act('classicDiscount:baseball').ok);
 assert.equal(p.classicWeekendTicket,'baseball');
 assert.equal(action(g,'classicDiscount:baseball').enabled,false);
 const loaded=Game.load(g.snapshot());
 assert.equal(loaded.player.classicWeekendTicket,'baseball');
 const previous=loaded.player.happiness;
 loaded.newWeek();
 assert.equal(loaded.player.classicWeekendTicket,null);
 assert.ok(loaded.messages.some(m=>m.message.includes('baseball game')));
 assert.ok(loaded.player.happiness>=previous-15);
});
test('Untrusted saves cannot introduce an unknown weekend ticket',()=>{
 const g=classic(),state=g.snapshot();state.players[0].classicWeekendTicket='__proto__';
 assert.throws(()=>Game.load(state),/Invalid pending Z-Mart ticket/);
});
test('Discount stereo increases Classic home rest, but does not alter Modern',()=>{
 const g=classic(),p=g.player;p.owned.push('stereo');p.happiness=40;move(g,'home');
 assert.ok(g.act('relax').ok);
 assert.equal(p.happiness,59);
 const modern=new Game({mode:'sandbox',ruleset:'modern'}),pm=modern.player;pm.happiness=40;pm.owned.push('stereo');
 assert.ok(modern.act('relax').ok);assert.equal(pm.happiness,56);
});
test('Modern shopping behavior remains available without Classic-only merchandise',()=>{
 const m=new Game({mode:'sandbox',ruleset:'modern'});move(m,'market');
 assert.ok(action(m,'clothes:casual:market'));
 assert.ok(action(m,'clothes:formal:market'));
 assert.equal(action(m,'classicDiscount:dictionary'),undefined);
 assert.equal(action(m,'classicFresh:1'),undefined);
});
test('Classic separates discount and grocery counters at their original board locations',()=>{
 const app=fs.readFileSync('src/app.js','utf8'),engine=fs.readFileSync('src/engine.js','utf8');
 assert.ok(app.includes('venue-dept-heading'));
 assert.ok(engine.includes("at==='market'||this.isClassic&&at==='cinema'"));
 assert.ok(engine.includes("a.department=at==='market'?'Z-Mart Discount':'Black’s Market'"));
});
