import { readFileSync, writeFileSync } from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
let html=readFileSync(resolve(root,'index.html'),'utf8');
const css=readFileSync(resolve(root,'styles.css'),'utf8').replace(/<\/style/gi,'<\\/style');
html=html.replace('<link rel="stylesheet" href="styles.css" />',`<style>\n${css}\n</style>`);
for(const src of ['data','engine','art','network','app']){
 const file=`src/${src}.js`;
 const body=readFileSync(resolve(root,file),'utf8').replace(/<\/script/gi,'<\\/script');
 const tag=`<script src="${file}"></script>`;
 if(!html.includes(tag))throw Error(`Missing script tag ${tag}`);
 html=html.replace(tag,()=>`<script>\n${body}\n</script>`);
}
if(html.includes('<script src=')||html.includes('<link rel="stylesheet"'))throw Error('External source assets remain');
writeFileSync(resolve(root,'PLAY.html'),html);
console.log(`PLAY.html built (${Buffer.byteLength(html)} bytes, fully inline).`);
