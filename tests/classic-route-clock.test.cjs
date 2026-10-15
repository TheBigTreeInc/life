const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const layout=require('../assets/boards/classic/routes.v1.json');
const {compile,validate}=require('../src/route-graph.js');
const graph=compile(layout,D.classicPlaces.map(p=>p.id));
const game=()=>new Game({ruleset:'classic',mode:'sandbox',seed:175});

test('Classic time charges follow the same shortest-road distance shown by the board',()=>{
 const g=game();
 for(const from of g.places)for(const to of g.places){
  const plan=graph.plan(from.id,to.id),quote=g.travelQuote(from.id,to.id,60);
  assert.deepEqual(quote.stops,plan.ids);
  assert.equal(quote.steps,plan.steps);
  const expected=from.id===to.id?0:g.rules.entryHours+1+Math.floor(plan.steps/25)+(to.id==='agency'?2:0);
  assert.equal(quote.hours,expected,`${from.name} → ${to.name}`);
  assert.equal(g.travelCost(from.id,to.id),expected);
  assert.deepEqual(g.travelQuote(from.id,to.id,60),quote,'quote must be deterministic');
 }
});

test('The thirteen venue stops match the thirteen actual storefront map cells',()=>{
 const g=game();
 for(const place of g.places){
  const entry=layout.venues[place.id],node=layout.nodes.find(n=>n.id===entry.stop);
  assert.deepEqual(node.cell,place.cell,place.name);
 }
 assert.deepEqual(validate(layout,g.places.map(p=>p.id)),[]);
});

test('Accepted travel spends exactly the previewed hours and only one event',()=>{
 const g=game(),p=g.player;
 const q=g.travelQuote('home','market');
 const first=g.travel('market');
 assert.equal(first.ok,true);
 assert.equal(p.location,'market');
 assert.equal(p.hours,60-q.hours);
 assert.equal(p.weekActions,1);
 const stay=g.travel('market');
 assert.equal(stay.ok,true);
 assert.equal(p.hours,60-q.hours);
 assert.equal(p.weekActions,1);
});

test('Not enough hours refuses movement without changing game state',()=>{
 const g=game(),p=g.player;p.hours=2;
 const before=g.snapshot(),quote=g.travelQuote('home','market',p.hours);
 assert.equal(quote.ok,false);
 assert.equal(quote.hours,g.travelCost('home','market'));
 assert.match(quote.reason,/Need 3 hours/);
 assert.equal(g.travel('market').ok,false);
 assert.deepEqual(g.snapshot(),before);
});

test('Modern Story hours and locations stay independent of Classic route graph',()=>{
 const g=new Game({ruleset:'modern',mode:'sandbox',seed:175});
 const from=g.player.location,quote=g.travelQuote(from,'agency',40);
 assert.equal(quote.hours,g.travelCost(from,'agency'));
 assert.deepEqual(quote.stops,[]);
 assert.equal(quote.steps,0);
 assert.equal(g.travel('agency').ok,true);
});

test('Broken route annotations fail validation instead of silently moving the pawn',()=>{
 const invalid=structuredClone(layout);invalid.nodes[2].cell=[-1,1];
 assert.match(validate(invalid).join(' '),/Invalid board cell/);
 const edges=structuredClone(layout);edges.edges[0].weight=0;
 assert.match(validate(edges).join(' '),/Invalid edge weight/);
});
