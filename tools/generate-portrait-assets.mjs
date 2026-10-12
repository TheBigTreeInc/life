import { readFileSync, writeFileSync, statSync } from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const pack=JSON.parse(readFileSync(resolve(root,'assets/portraits/default/manifest.json'),'utf8'));
if(pack.schema!=='the-life-loop.portrait-pack.v1'||pack.id!=='default')throw Error('Invalid portrait pack');
const images=Object.entries(pack.portraits);
if(images.length!==51)throw Error(`Expected 51 character portraits, got ${images.length}`);
for(const [id,p] of images){
 if(!/^(illustrated-(0[1-9]|1[0-6])|original-(0[1-9]|[12][0-9]|3[0-5]))$/.test(id))throw Error(`Invalid portrait ID ${id}`);
 if(p.image!==`assets/portraits/default/${id}.webp`)throw Error(`Invalid asset path for ${id}`);
 if(statSync(resolve(root,p.image)).size>120*1024)throw Error(`Oversize portrait ${id}`);
}
const content=`(function(root){\n'use strict';\n// Generated from assets/portraits/default/manifest.json. Do not edit directly.\nroot.LifePortraitAssets=${JSON.stringify(pack)};\nif(typeof module!=='undefined'&&module.exports)module.exports=root.LifePortraitAssets;\n})(typeof window!=='undefined'?window:globalThis);\n`;
writeFileSync(resolve(root,'src/portrait-assets.js'),content);
console.log(`Portrait pack mapped: ${images.length} illustrations`);
