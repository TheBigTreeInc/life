import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const manifest=JSON.parse(readFileSync(resolve(root,'assets/characters/pixel-v1/catalog.json'),'utf8'));
const fail=m=>{throw Error('Character catalog: '+m)};
if(manifest.schema!=='the-life-loop.character-parts.v1'||manifest.id!=='pixel-v1'||!/^[\w.\-]+$/.test(manifest.revision))fail('invalid schema or revision');
if(manifest.canvas.width!==32||manifest.canvas.height!==40||manifest.canvas.origin[0]!==16||manifest.canvas.origin[1]!==38)fail('invalid sprite coordinate contract');
for(const [id,item] of Object.entries(manifest.items)){
 if(!/^(hair|torso|headwear)\.[a-z]+$/.test(id)||!manifest.slots.includes(item.slot)||!id.startsWith(item.slot+'.'))fail('invalid asset '+id);
 if(!Array.isArray(item.supportedBodies)||!item.supportedBodies.length||item.supportedBodies.some(v=>!manifest.bodyTemplates[v]))fail('invalid body for '+id);
 for(const variant of Object.keys(item.variants||{}))if(!['default','under_hat'].includes(variant))fail('invalid variant '+variant);
}
for(const [id,item] of Object.entries(manifest.items))for(const [slot,variant] of Object.entries(item.requests||{})){
 if(!['hair'].includes(slot)||!Object.entries(manifest.items).some(([k,x])=>x.slot===slot&&x.variants?.[variant]))fail('unknown interaction '+id+'/'+variant);
}
for(const [action,anim] of Object.entries(manifest.animations))if(!['idle','walk'].includes(action)||!anim.durations.length||anim.durations.some(x=>!Number.isInteger(x)||x<=0))fail('bad animation');
const source=`(function(root){'use strict';root.LifeCharacterCatalog=${JSON.stringify(manifest)};if(typeof module!=='undefined'&&module.exports)module.exports=root.LifeCharacterCatalog;})(typeof window!=='undefined'?window:globalThis);\n`;
writeFileSync(resolve(root,'src/character-catalog.js'),source);
console.log(`Character catalog mapped: ${Object.keys(manifest.items).length} components, ${Object.keys(manifest.bodyTemplates).length} bodies`);
