import {readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const manifest=JSON.parse(readFileSync(resolve(root,'assets/art/styles/classic-modern/manifest.json'),'utf8'));
if(manifest.schema!=='the-life-loop.classic-board-art.v1'||Object.keys(manifest.venues).length!==13)throw Error('Invalid Classic board art catalog');
const compiled={style:manifest.style,venues:{},names:{}};
for(const [id,entry] of Object.entries(manifest.venues)){
 if(!/^\w[\w-]*$/.test(id))throw Error('Unsafe Classic place ID');
 compiled.names[id]=entry.name;
 const files=[entry.card,entry.detail],present=files.map(f=>existsSync(resolve(root,f)));
 for(const file of files){
  if(!/^assets\/art\/styles\/classic-modern\/[a-z-]+\.webp$/.test(file))throw Error('Invalid Classic art path');
  if(existsSync(resolve(root,file))&&statSync(resolve(root,file)).size>500*1024)throw Error('Classic art exceeds 500 KiB: '+file);
 }
 if(present.every(Boolean))compiled.venues[id]={card:entry.card,detail:entry.detail};
 else if(present.some(Boolean))throw Error('Supply BOTH card and detail variants for '+entry.name);
}
const js=`(function(root){\n'use strict';\n// Generated from the optional Classic board art slots.\nroot.LifeClassicArtAssets=${JSON.stringify(compiled)};\nif(typeof module!=='undefined'&&module.exports)module.exports=root.LifeClassicArtAssets;\n})(typeof window!=='undefined'?window:globalThis);\n`;
writeFileSync(resolve(root,'src/classic-art-assets.js'),js);
console.log(`Classic artwork: ${Object.keys(compiled.venues).length}/13 pairs installed; other locations use supplied Contemporary art placeholders`);
