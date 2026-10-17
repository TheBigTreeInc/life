import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const layout=JSON.parse(readFileSync(resolve(root,'assets/boards/classic/routes.v1.json'),'utf8'));
if(layout.schema!=='the-life-loop.board-route.v1'||layout.nodes?.length!==14||layout.edges?.length!==14||Object.keys(layout.venues||{}).length!==13){
 throw new Error('Classic routing data must have 14 nodes, 14 edges and 13 venues.');
}
const geometry=JSON.parse(readFileSync(resolve(root,'assets/boards/classic/geometry.v1.json'),'utf8'));
if(geometry.schema!=='the-life-loop.board-geometry.v1'||geometry.boardId!==layout.boardId||Object.keys(geometry.venues||{}).length!==13){
 throw Error('Board geometry manifest must match the Classic board and its thirteen venues.');
}
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1);
for(const [name,points] of Object.entries(geometry.visualCurves||{})){
 const [from,to]=name.split('>');
 if(!layout.edges.some(e=>(e.from===from&&e.to===to)||(e.from===to&&e.to===from))||!Array.isArray(points)||points.length<2||points.length>40||!points.every(validPoint))throw Error('Invalid road control points: '+name);
}
for(const [id,v] of Object.entries(geometry.venues)){
 if(!layout.venues[id]||!validPoint(v.entrance)||!Array.isArray(v.approach)||v.approach.length<2||!v.approach.every(validPoint)||!validPoint(v.roadStart)||!validPoint(v.roadEnd))throw Error('Invalid venue geometry: '+id);
}
const embedded={...layout,geometrySchema:geometry.schema,visualCurves:geometry.visualCurves,venues:Object.fromEntries(Object.entries(layout.venues).map(([id,v])=>[id,{...v,geometry:geometry.venues[id]}]))};
const generated="(function(root){'use strict';root.LifeClassicRoutes="+JSON.stringify(embedded)+";})(typeof window!=='undefined'?window:globalThis);\n";
writeFileSync(resolve(root,'src/classic-routes.js'),generated);
const reference=JSON.parse(readFileSync(resolve(root,'assets/boards/classic/original-mechanics.v1.json'),'utf8'));
if(reference.waypoints.length!==170||reference.places.length!==13||reference.jobs.length!==37)throw Error('Original reference cardinality mismatch');
writeFileSync(resolve(root,'src/classic-original.js'),"(function(root){'use strict';root.LifeClassicOriginal="+JSON.stringify(reference)+";})(typeof window!=='undefined'?window:globalThis);\n");
console.log('Classic routes generated: 14 visual nodes, 170 historical waypoints / 13 original places');
