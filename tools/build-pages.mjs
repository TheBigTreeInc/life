import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

// Always compile from modular source; never deploy stale PLAY.html.
const root=resolve(import.meta.dirname,'..');
execFileSync(process.execPath,[resolve(root,'tools/build-offline.mjs')],{stdio:'inherit'});
let game=readFileSync(resolve(root,'PLAY.html'),'utf8');
// Replace embedded image data URIs with cacheable assets for Pages, preserving offline standalone edition.
const artPackForPages=JSON.parse(readFileSync(resolve(root,'assets/art/styles/contemporary-default/manifest.json'),'utf8'));
for(const path of [...new Set([...Object.values(artPackForPages.venues).flatMap(v=>[v.card,v.detail]),...Object.values(artPackForPages.homeTiers).filter(Boolean).flatMap(v=>[v.card,v.detail])])]){
 const embedded='data:image/webp;base64,'+readFileSync(resolve(root,path)).toString('base64');
 game=game.replaceAll(embedded,path);
}

if (!game.startsWith('<!doctype html>') || !game.includes('id="board"')) throw new Error('Invalid generated HTML');
if (/<script\s+src=|<link\s+rel="stylesheet"/.test(game)) throw new Error('Pages must be completely self-contained');
const out=resolve(root,'dist');
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'index.html'),game);
writeFileSync(resolve(out,'.nojekyll'),'');
// External art files are optional to the offline build; Pages uses browser-cacheable WebP files.
const artPack=JSON.parse(readFileSync(resolve(root,'assets/art/styles/contemporary-default/manifest.json'),'utf8'));
const images=[...Object.values(artPack.venues).flatMap(v=>[v.card,v.detail]),...Object.values(artPack.homeTiers).filter(Boolean).flatMap(v=>[v.card,v.detail])];
for(const file of new Set(images)){const dst=resolve(out,file);mkdirSync(resolve(dst,'..'),{recursive:true});copyFileSync(resolve(root,file),dst);}

console.log(`GitHub Pages site ready: dist/index.html (${Buffer.byteLength(game)} bytes)`);
