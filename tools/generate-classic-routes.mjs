import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const layout=JSON.parse(readFileSync(resolve(root,'assets/boards/classic/routes.v1.json'),'utf8'));
if(layout.schema!=='the-life-loop.board-route.v1'||layout.nodes?.length!==14||layout.edges?.length!==14||Object.keys(layout.venues||{}).length!==13){
 throw new Error('Classic routing data must have 14 nodes, 14 edges and 13 venues.');
}
const generated="(function(root){'use strict';root.LifeClassicRoutes="+JSON.stringify(layout)+";})(typeof window!=='undefined'?window:globalThis);\n";
writeFileSync(resolve(root,'src/classic-routes.js'),generated);
const reference=JSON.parse(readFileSync(resolve(root,'assets/boards/classic/original-mechanics.v1.json'),'utf8'));
if(reference.waypoints.length!==170||reference.places.length!==13||reference.jobs.length!==37)throw Error('Original reference cardinality mismatch');
writeFileSync(resolve(root,'src/classic-original.js'),"(function(root){'use strict';root.LifeClassicOriginal="+JSON.stringify(reference)+";})(typeof window!=='undefined'?window:globalThis);\n");
console.log('Classic routes generated: 14 visual nodes, 170 historical waypoints / 13 original places');
