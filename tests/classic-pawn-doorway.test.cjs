'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pawnJourneyFrame,doorwayTail,pathPointAt}=require('../src/route-overlay.js');
const Game=require('../src/engine.js');
const layout=require('../assets/boards/classic/routes.v1.json');
const road=[{x:10,y:40},{x:70,y:40},{x:130,y:40}];
const depart=[{x:10,y:40},{x:10,y:29},{x:30,y:10}];
const arrive=[{x:130,y:40},{x:130,y:25},{x:120,y:11}];
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8;
test('final doorstep segment is bounded even when the doorway is far from the public road',()=>{
 const tail=doorwayTail(arrive,18);
 assert.equal(near(tail.at(-1),arrive.at(-1)),true);
 assert.ok(tail.length>=2);
 let sum=0;for(let i=1;i<tail.length;i++)sum+=Math.hypot(tail[i].x-tail[i-1].x,tail[i].y-tail[i-1].y);
 assert.ok(sum<=18.001,`Visible approach too long: ${sum}`);
 assert.equal(doorwayTail([],18).length,0);
 assert.deepEqual(doorwayTail([{x:2,y:4}],18),[{x:2,y:4}]);
});
test('pawn walks continuously from house to road to destination door',()=>{
 const f=t=>pawnJourneyFrame(road,depart,arrive,t);
 assert.equal(f(0).phase,'depart');assert.equal(f(0).opacity,1);
 assert.ok(near(f(0).position,depart.at(-1)));
 assert.equal(f(.15).phase,'road');assert.ok(near(f(.15).position,road[0]));
 assert.equal(f(.5).phase,'road');assert.ok(f(.5).opacity===1);
 assert.equal(f(.85).phase,'arrive');assert.ok(near(f(.85).position,road.at(-1)));
 assert.ok(near(f(1).position,arrive.at(-1)));
 for(let i=0;i<=100;i++){
  const frame=f(i/100);
  assert.ok(Number.isFinite(frame.position.x)&&Number.isFinite(frame.position.y));
  assert.equal(frame.opacity,1);
  if(frame.phase==='road')assert.ok(Math.abs(frame.position.y-40)<1e-6);
 }
});
test('reduced motion is handled at runtime; frame data never changes original game time costs',()=>{
 const game=new Game({ruleset:'classic',mode:'sandbox',seed:551});
 assert.equal(layout.originalRoute.waypointCount,170);
 const quote=game.travelQuote('home','bank',60);
 assert.equal(quote.hours,5);
 assert.equal(game.player.hours,60);
 for(const tick of [0,.07,.15,.6,.9,1])pawnJourneyFrame(road,depart,arrive,tick);
 assert.equal(game.player.hours,60);
});
