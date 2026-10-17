'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Route=require('../src/route-overlay.js');
const layout=require('../assets/boards/classic/routes.v1.json');
const geometry=require('../assets/boards/classic/geometry.v1.json');
const {readFileSync}=require('node:fs');
const embedded=readFileSync(require('node:path').join(__dirname,'../src/classic-routes.js'),'utf8');

test('classic board route asset includes visual road curves and venue entry metadata',()=>{
  assert.equal(geometry.schema,'the-life-loop.board-geometry.v1');
  assert.ok(geometry.visualCurves && Object.keys(geometry.visualCurves).length>=14);
  for(const [id,venue] of Object.entries(layout.venues)){
    assert.ok(geometry.venues[id],`missing geometry for ${id}`);
    assert.ok(Array.isArray(geometry.venues[id].approach),`missing approach for ${id}`);
    assert.ok(geometry.venues[id].approach.length>=5,`short approach for ${id}`);
    assert.deepEqual(geometry.venues[id].entrance,venue.artEntrance,`entrance mismatch for ${id}`);
    assert.deepEqual(geometry.venues[id].roadStart,[0.5,0.96],`road start mismatch for ${id}`);
  }
});

test('route overlay can read geometry-driven edge curves in both directions',()=>{
  const overlay=Object.create(Route.RouteOverlay.prototype);
  overlay.layout={...layout,visualCurves:geometry.visualCurves};
  overlay.width=1000;
  overlay.height=750;
  const forward=overlay.edgeVisualPoints('r05','r06');
  const backward=overlay.edgeVisualPoints('r06','r05');
  assert.ok(Array.isArray(forward) && forward.length===5);
  assert.deepEqual(forward[0],{x:810,y:172.5});
  assert.deepEqual(forward.at(-1),{x:810,y:285});
  assert.deepEqual(backward[0],forward.at(-1));
  assert.deepEqual(backward.at(-1),forward[0]);
});

test('generation merges standalone geometry into browser bundle',()=>{
 assert.match(embedded,/geometrySchema/);
 assert.match(embedded,/visualCurves/);
 assert.match(embedded,/\"geometry\":/);
});
