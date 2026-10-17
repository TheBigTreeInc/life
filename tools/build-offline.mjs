import { readFileSync, writeFileSync } from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
execFileSync(process.execPath,[resolve(root,'tools/generate-classic-routes.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[resolve(root,'tools/generate-art-assets.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[resolve(root,'tools/generate-classic-art-assets.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[resolve(root,'tools/generate-portrait-assets.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[resolve(root,'tools/generate-character-catalog.mjs')],{cwd:root,stdio:'inherit'});
let html=readFileSync(resolve(root,'index.html'),'utf8');
const css=readFileSync(resolve(root,'styles.css'),'utf8').replace(/<\/style/gi,'<\\/style');
html=html.replace('<link rel="stylesheet" href="styles.css" />',`<style>\n${css}\n</style>`);
for(const src of ['classic-original','classic-goals','classic-pass2-rules','classic-time','classic-turn-sequence','classic-weekly-events','classic-consumables-064','classic-food','classic-jones-source','classic-household','classic-economy','classic-retail-pawn-063','classic-economic-events','data','portrait-assets','character-catalog','character-sprites','characters','modular-portrait-kit','modular-portrait-editor','looprd-shared-profile','looprd-social-sdk-loader','looprd-social-session','shared-portrait-ui','rule-presets','setup-preferences','life-pass-057','goal-presets','i18n','route-graph','classic-routes','engine','art-assets','classic-art-assets','art','network','route-overlay','classic-journey','classic-hotseat-handover','classic-board-hud','app']){
 const file=`src/${src}.js`;
 const body=readFileSync(resolve(root,file),'utf8').replace(/<\/script/gi,'<\\/script');
 const tag=`<script src="${file}"></script>`;
 if(!html.includes(tag))throw Error(`Missing script tag ${tag}`);
 html=html.replace(tag,()=>`<script>\n${body}\n</script>`);
}
// Inline the compact modular packs for the no-server PLAY.html edition.
// The browser edition loads their manifest/images on demand from the same origin.
const sharedPacks={};
for(const id of ['everyday-illustrated','dominion-pixel']){
 const dir=`assets/modular-portraits/packs/${id}`;
 const pack=JSON.parse(readFileSync(resolve(root,dir,'pack.json'),'utf8'));
 const files=[...new Set(Object.values(pack.slots).flatMap(s=>s.options.map(o=>o.asset).filter(Boolean)))];
 const images=Object.fromEntries(files.map(file=>[file,'data:image/webp;base64,'+readFileSync(resolve(root,dir,file)).toString('base64')]));
 sharedPacks[id]={pack,images};
}
html=html.replace('<script>\n'+readFileSync(resolve(root,'src/shared-portrait-ui.js'),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>',match=>'<script>window.LifeEmbeddedPortraitPacks='+JSON.stringify(sharedPacks)+';</script>\n'+match);
// Bundle the default Contemporary venue artwork for fully offline PLAY.html.
// Unlike the GitHub Pages edition, offline users do not need an assets directory.
const artPack=JSON.parse(readFileSync(resolve(root,'assets/art/styles/contemporary-default/manifest.json'),'utf8'));
const embedded=[...Object.values(artPack.venues).flatMap(v=>[v.card,v.detail]),...Object.values(artPack.homeTiers).filter(Boolean).flatMap(v=>[v.card,v.detail])];
for(const assetPath of new Set(embedded)){
 const bytes=readFileSync(resolve(root,assetPath));
 html=html.replaceAll(assetPath,`data:image/webp;base64,${bytes.toString('base64')}`);
}
const classicPack=JSON.parse(readFileSync(resolve(root,'src/classic-art-assets.js'),'utf8').match(/root\.LifeClassicArtAssets=(\{.*\});/)?.[1]||'{}');
for(const path of Object.values(classicPack.venues||{}).flatMap(x=>[x.card,x.detail])){const b=readFileSync(resolve(root,path));html=html.replaceAll(path,`data:image/webp;base64,${b.toString('base64')}`);}
const portraitPack=JSON.parse(readFileSync(resolve(root,'assets/portraits/default/manifest.json'),'utf8'));
const portraitPaths=Object.values(portraitPack.portraits).map(p=>p.image);
for(const assetPath of portraitPaths){const bytes=readFileSync(resolve(root,assetPath));html=html.replaceAll(assetPath,`data:image/webp;base64,${bytes.toString('base64')}`);}
if(portraitPaths.some(path=>html.includes(path)))throw Error('Offline portrait pack references external files');
if(embedded.some(path=>html.includes(path)))throw Error('Offline artwork still references external files');
if(html.includes('<script src=')||html.includes('<link rel="stylesheet"'))throw Error('External source assets remain');
writeFileSync(resolve(root,'PLAY.html'),html);
console.log(`PLAY.html built (${Buffer.byteLength(html)} bytes, fully inline).`);
