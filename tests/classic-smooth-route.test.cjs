'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Route=require('../src/route-overlay.js');
const Game=require('../src/engine.js');
const Graph=require('../src/route-graph.js'),layout=require('../assets/boards/classic/routes.v1.json');
const graph=Graph.compile(layout);
test('one street path simplifies consecutive DOS waypoints and rounds visible corners',()=>{
 const points=[{x:5,y:10},{x:15,y:10},{x:30,y:10},{x:30,y:20},{x:30,y:40}];
 const clean=Route.compactLine(points);
 assert.deepEqual(clean,[points[0],points[2],points[4]]);
 const path=Route.roundedPath(points,8);
 assert.match(path,/ Q /);
 assert.equal(path.startsWith('M 5.0 10.0'),true);
 assert.equal(path.endsWith('L 30.0 40.0'),true);
 assert.equal(Route.roundedPath([]),'');
});
test('classic visual street improvements do not alter the original source travel quotes',()=>{
 const game=new Game({ruleset:'classic',mode:'sandbox',seed:550});
 for(const from of game.places)for(const to of game.places){
  const quote=game.travelQuote(from.id,to.id,60);
  assert.ok(Number.isInteger(quote.steps));
  assert.ok(Number.isFinite(quote.hours));
  assert.equal(quote.steps,graph.plan(from.id,to.id).steps);
 }
 assert.equal(layout.originalRoute.waypointCount,170);
});
