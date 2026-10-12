import { readFileSync, writeFileSync, statSync } from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const pack=JSON.parse(readFileSync(resolve(root,'assets/art/styles/contemporary-default/manifest.json'),'utf8'));
if(pack.schema!=='the-life-loop.art-pack.v1'||pack.id!=='contemporary-default')throw Error('Invalid art pack manifest');
for(const tier of ['studio','apartment','loft'])if(!Object.hasOwn(pack.homeTiers,tier))throw Error(`Missing housing art slot: ${tier}`);
const files=[...Object.values(pack.venues).flatMap(v=>[v.card,v.detail]),...Object.values(pack.homeTiers).filter(Boolean).flatMap(v=>[v.card,v.detail])];
for(const file of files){
 if(typeof file!=='string'||!/^assets\/art\/styles\/contemporary-default\/[a-z0-9-]+\.webp$/.test(file))throw Error('Invalid source art path '+file);
 if(statSync(resolve(root,file)).size>400*1024)throw Error('Artwork exceeds size limit '+file);
}
const js=`(function(root){\n'use strict';\n// Generated from assets/art/styles/contemporary-default/manifest.json; edit the JSON manifest instead.\nroot.LifeArtAssets=${JSON.stringify(pack)};\nif(typeof module!=='undefined'&&module.exports)module.exports=root.LifeArtAssets;\n})(typeof window!=='undefined'?window:globalThis);\n`;
writeFileSync(resolve(root,'src/art-assets.js'),js);
console.log(`Art pack mapped: ${Object.keys(pack.venues).length} venues, ${files.length} image variants, 3 residence slots`);
