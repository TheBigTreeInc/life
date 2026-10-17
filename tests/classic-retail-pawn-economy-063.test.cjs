const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../src/classic-retail-pawn-063.js');
const Pass2=require('../src/classic-pass2-rules.js');
const Game=require('../src/engine.js');

test('DOS Black’s Market 1/2/4 week food uses original $55/$100/$190 bases and adjusted index',()=>{
 assert.deepEqual(R.MARKET.map(x=>x.basePrice),[55,100,190]);
 assert.deepEqual(R.marketQuotes(100).map(x=>x.price),[55,100,190]);
 for(const reading of [10,40,75,100,125,150,190]){
  const g=new Game({ruleset:'classic'});g.classicGoodsIndex=reading;
  const p=g.player;p.location='cinema';p.owned.push('fridge','freezer');
  const actions=g.actions();
  for(const row of R.marketQuotes(reading)){
   const a=actions.find(x=>x.id==='classicFresh:'+row.units);
   assert.ok(a);assert.equal(a.price,row.price);assert.equal(row.price,Pass2.goodsPrice(row.basePrice,reading));
  }
 }
});
test('DOS pawn offer = 40% adjusted item price and redemption = 50% purchase price; integer truncation',()=>{
 for(const [paid,index,expectedPayout,expectedRedemption] of [[590,100,236,295],[255,100,102,127],[90,100,36,45],[590,150,431,295]]){
   const q=R.pawnQuote(paid,index);assert.equal(q.payout,expectedPayout);assert.equal(q.redemption,expectedRedemption);
 }
 assert.throws(()=>R.pawnQuote(-1,100),/Invalid/);
 assert.throws(()=>R.pawnQuote(590,191),/Invalid/);
});
test('Classic pawn quotes bind at pawn time, apply one happiness and survive a changed economy/save roundtrip',()=>{
 const g=new Game({ruleset:'classic',seed:99}),p=g.player;p.location='pawn';p.owned.push('computer');
 p.happiness=62;g.classicGoodsIndex=150;const q=R.pawnQuote(590,150);const originalHappiness=p.happiness;
 assert.match(g.actions().find(x=>x.id==='classicPawn:computer').title,/\$431/);
 const oldCash=p.cash;assert.equal(g.act('classicPawn:computer').ok,true);const lot=g.classicPawnLots[0];
 assert.equal(p.cash,oldCash+q.payout);assert.equal(p.happiness,originalHappiness-1);
 assert.equal(lot.sourceQuote,'dos-reference-v1');assert.equal(lot.referencePaid,590);assert.equal(lot.goodsIndexAtPawn,150);
 assert.equal(lot.redemption,295);g.classicGoodsIndex=85;
 const loaded=Game.load(g.snapshot());loaded.player.location='pawn';
 assert.equal(loaded.classicPawnLots[0].payout,q.payout);
 assert.equal(loaded.actions().find(x=>x.id==='classicRedeem:'+lot.id).price,295);
 assert.equal(loaded.act('classicRedeem:'+lot.id).ok,true);
 assert.ok(loaded.player.owned.includes('computer'));
});
test('Legacy pawn lot without sourceQuote loads exactly, new quote tampering is rejected, Modern stays legacy',()=>{
 const g=new Game({ruleset:'classic'});g.player.location='pawn';g.player.owned.push('dictionary');
 let s=g.snapshot();s.classicPawnLots=[{id:'pawn-1',ownerId:'player',item:'dictionary',payout:40,redemption:45,dueWeek:3}];s.classicPawnSequence=1;
 s.players[0].owned=s.players[0].owned.filter(x=>x!=='dictionary');
 assert.deepEqual(Game.load(s).classicPawnLots,s.classicPawnLots);
 const fresh=new Game({ruleset:'classic'});fresh.player.location='pawn';fresh.player.owned.push('dictionary');fresh.act('classicPawn:dictionary');
 const tampered=fresh.snapshot();tampered.classicPawnLots[0].payout=1;assert.throws(()=>Game.load(tampered),/Invalid pawn lot/);
 const modern=new Game({ruleset:'modern'});modern.player.location='pawn';modern.player.owned.push('computer');
 assert.equal(modern.act('classicPawn:computer').ok,true);
 assert.equal(modern.classicPawnLots[0].payout,265);
 assert.equal(modern.classicPawnLots[0].sourceQuote,undefined);
});
test('Pawning a refrigerator invokes the original additional one-point happiness and clears fresh food',()=>{
 const g=new Game({ruleset:'classic'}),p=g.player;p.location='pawn';p.owned.push('fridge');p.groceries=4;p.happiness=62;
 const before=p.happiness;
 assert.equal(g.act('classicPawn:fridge').ok,true);assert.equal(p.happiness,before-2);assert.equal(p.groceries,0);
});
test('EconomicIndex source comparator is pure and honors lower/upper trends, bounds and source second comparison',()=>{
 let calls=[];const low=(a,b)=>{calls.push([a,b]);return a;};
 const down=R.economicIndexStep({reading:100,index:0,risk:4},low);
 assert.deepEqual(calls,[[-3,3],[-5,3],[0,4],[0,4]]);
 assert.equal(down.index,-1);assert.equal(down.adjustment,-5);assert.equal(down.reading,95);
 const high=(a,b)=>b;
 const up=R.economicIndexStep({reading:100,index:0,risk:4},high);
 assert.equal(up.index,1);assert.equal(up.reading,105);
 for(const x of [10,190]){
  const res=R.economicIndexStep({reading:x,index:0,risk:4,crisis:x===190?3:0,boom:x===10},high);
  assert.ok(res.reading>=10&&res.reading<=190);
 }
 assert.throws(()=>R.economicIndexStep({reading:100},()=>-99),/Invalid DOS random draw/);
});
test('DOS economic headline eligibility follows original week and reading gates, without mutating the live event system',()=>{
 const ranges=[],alwaysZero=(a,b)=>{ranges.push([a,b]);return a;};
 assert.deepEqual(R.headlineEligibility({reading:100,week:3,global374:2},alwaysZero).crisis,0);
 assert.deepEqual(ranges,[[0,60]]);ranges.length=0;
 const c=R.headlineEligibility({reading:100,week:4,global374:2},alwaysZero);
 assert.equal(c.crisis,1);assert.deepEqual(ranges,[[0,40],[0,2]]);assert.equal(c.integrated,false);
 const b=R.headlineEligibility({reading:70,week:3,global374:2},alwaysZero);
 assert.equal(b.boom,true);
});
