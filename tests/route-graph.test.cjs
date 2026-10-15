const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const layout=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/boards/classic/routes.v1.json'),'utf8'));
const {compile,validate}=require('../src/route-graph.js');
const names=['clinic','housing','home','pawn','market','diner','boutique','tech','university','agency','office','bank','cinema'];
test('Classic original board contains exactly fourteen connected nodes and thirteen businesses',()=>{
 assert.equal(layout.nodes.length,14);assert.equal(layout.edges.length,14);
 assert.equal(Object.keys(layout.venues).length,13);
 assert.deepEqual(validate(layout,names),[]);
});
test('Every venue pair is reachable and uses valid ring nodes',()=>{
 const graph=compile(layout,names);
 for(const a of names)for(const b of names){const p=graph.plan(a,b);assert.ok(p.ids.length>0);assert.equal(p.points.length,p.ids.length);assert.ok(p.weight>=0);}
});
test('Same venue is immediate; adjacent venues use one road segment',()=>{
 const graph=compile(layout,names);
 assert.equal(graph.plan('home','home').weight,0);
 assert.equal(graph.plan('home','pawn').weight,13);
 assert.equal(graph.plan('pawn','home').weight,13);
});
test('Long-distance trip chooses shorter side of ring',()=>{
 const graph=compile(layout,names);
 const route=graph.plan('clinic','cinema');assert.deepEqual(route.ids,['r01','r14']);
 assert.equal(route.weight,17);
});
test('Deterministic tie breaking',()=>{
 const graph=compile(layout,names);
 const a=graph.plan('clinic','tech');for(let i=0;i<10;i++)assert.deepEqual(graph.plan('clinic','tech'),a);
});
test('Invalid graph is rejected with actionable diagnostics',()=>{
 const edited=structuredClone(layout);edited.venues.bank.stop='unknown';
 assert.match(validate(edited,names).join(' '),/Unknown venue stop/);
 assert.throws(()=>compile(edited,names),/Invalid route graph/);
});
