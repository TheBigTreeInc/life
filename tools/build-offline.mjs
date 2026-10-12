import { readFileSync, writeFileSync } from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
execFileSync(process.execPath,[resolve(root,'tools/generate-art-assets.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[resolve(root,'tools/generate-portrait-assets.mjs')],{cwd:root,stdio:'inherit'});
let html=readFileSync(resolve(root,'index.html'),'utf8');
const css=readFileSync(resolve(root,'styles.css'),'utf8').replace(/<\/style/gi,'<\\/style');
html=html.replace('<link rel="stylesheet" href="styles.css" />',`<style>\n${css}\n</style>`);
for(const src of ['data','portrait-assets','characters','setup-preferences','engine','art-assets','art','network','app']){
 const file=`src/${src}.js`;
 const body=readFileSync(resolve(root,file),'utf8').replace(/<\/script/gi,'<\\/script');
 const tag=`<script src="${file}"></script>`;
 if(!html.includes(tag))throw Error(`Missing script tag ${tag}`);
 html=html.replace(tag,()=>`<script>\n${body}\n</script>`);
}
// Bundle the default Contemporary venue artwork for fully offline PLAY.html.
// Unlike the GitHub Pages edition, offline users do not need an assets directory.
const artPack=JSON.parse(readFileSync(resolve(root,'assets/art/styles/contemporary-default/manifest.json'),'utf8'));
const embedded=[...Object.values(artPack.venues).flatMap(v=>[v.card,v.detail]),...Object.values(artPack.homeTiers).filter(Boolean).flatMap(v=>[v.card,v.detail])];
for(const assetPath of new Set(embedded)){
 const bytes=readFileSync(resolve(root,assetPath));
 html=html.replaceAll(assetPath,`data:image/webp;base64,${bytes.toString('base64')}`);
}
const portraitPack=JSON.parse(readFileSync(resolve(root,'assets/portraits/default/manifest.json'),'utf8'));
const portraitPaths=Object.values(portraitPack.portraits).map(p=>p.image);
for(const assetPath of portraitPaths){const bytes=readFileSync(resolve(root,assetPath));html=html.replaceAll(assetPath,`data:image/webp;base64,${bytes.toString('base64')}`);}
if(portraitPaths.some(path=>html.includes(path)))throw Error('Offline portrait pack references external files');
if(embedded.some(path=>html.includes(path)))throw Error('Offline artwork still references external files');
if(html.includes('<script src=')||html.includes('<link rel="stylesheet"'))throw Error('External source assets remain');
writeFileSync(resolve(root,'PLAY.html'),html);
console.log(`PLAY.html built (${Buffer.byteLength(html)} bytes, fully inline).`);
