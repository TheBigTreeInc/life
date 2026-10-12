/* Deterministic data-driven pixel character compiler and Canvas/SVG render adapters.
   No Pixi/WebGL dependency: small idle/walk sprites are intentionally drawn at 32x40. */
(function(root,factory){
 const catalog=root.LifeCharacterCatalog||(typeof module==='object'&&module.exports?require('./character-catalog.js'):null);
 const api=factory(catalog);root.LifeSprites=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(catalog){
'use strict';
if(!catalog)throw Error('Character sprite catalog not loaded');
const D=catalog, OUTLINE='#2a2d35', DIRECTIONS=D.directions, ACTIONS=Object.keys(D.animations);
const SKIN={peach:'#f1bd91',tan:'#cf926d',brown:'#98634b',deep:'#5d3d34',pale:'#f3d5bc',olive:'#c1aa79'};
const HAIR_COLOR={black:'#292733',brown:'#67442f',auburn:'#ab6540',blonde:'#d9ac53',silver:'#bbc6d1',mint:'#398e83'};
const FABRIC={forest:'#367b5d',coral:'#dc7a6a',violet:'#8274c7',sky:'#4683b0',gold:'#c48a35',rose:'#c26b99'};
const safe=(v,map,otherwise)=>Object.hasOwn(map,v)?v:otherwise;
const BODY=Object.keys(D.bodyTemplates), HEADWEAR=['none','cap','beanie'];
const normal=v=>{
 const p=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 return {schemaVersion:1,catalogVersion:D.revision,body:safe(p.body,D.bodyTemplates,'standard'),
  hair:safe(p.hair,Object.fromEntries(['short','long','curly','bun','buzz','swept'].map(v=>[v,1])),'short'),
  headwear:HEADWEAR.includes(p.headwear)?p.headwear:'none',outfit:safe(p.outfit,Object.fromEntries(['everyday','smart','sport','creative'].map(v=>[v,1])),'everyday'),
  skin:safe(p.skin,SKIN,'peach'),hairColor:safe(p.hairColor,HAIR_COLOR,'brown'),accent:safe(p.accent,FABRIC,'forest'),mood:safe(p.mood,{smile:1,calm:1,focused:1},'smile')};
};
function frameAt(time,durations){if(!Array.isArray(durations)||!durations.length||durations.some(x=>!(x>0)))throw Error('Invalid animation timing');const total=durations.reduce((a,b)=>a+b,0);let t=((time%total)+total)%total;for(let i=0;i<durations.length;i++){if(t<durations[i])return i;t-=durations[i];}return durations.length-1;}
const poseKey=(action='idle',direction='south',frame=0)=>`${action}/${direction}/${frame}`;
const cache=new Map(), CACHE_LIMIT=48;
function compile(value){
 const cfg=normal(value),equipment={hair:'hair.'+cfg.hair,headwear:'headwear.'+cfg.headwear,torso:'torso.'+cfg.outfit},errors=[],adjustments=[];
 for(const [slot,id] of Object.entries(equipment))if(!D.items[id]||D.items[id].slot!==slot||!D.items[id].supportedBodies.includes(cfg.body))errors.push('Invalid '+slot+': '+id);
 if(errors.length)return {ok:false,errors,adjustments};
 const hairstyleVariant=cfg.headwear==='none'?'default':'under_hat';
 if(!D.items[equipment.hair].variants?.[hairstyleVariant])return {ok:false,errors:['Hairstyle lacks hat variant'],adjustments};
 if(hairstyleVariant!=='default')adjustments.push(`${equipment.hair}/default → ${equipment.hair}/${hairstyleVariant}`);
 const palettes={skin:SKIN[cfg.skin],hair:HAIR_COLOR[cfg.hairColor],fabric:FABRIC[cfg.accent],trim:'#f6eee0',trousers:'#354857',shoes:'#252e3a',outline:OUTLINE};
 const key=JSON.stringify([D.revision,cfg,equipment,hairstyleVariant]);
 if(cache.has(key)){const stored=cache.get(key);cache.delete(key);cache.set(key,stored);return stored;}
 const poses={};
 for(const [action,timing] of Object.entries(D.animations))for(const direction of DIRECTIONS)for(let frame=0;frame<timing.durations.length;frame++)poses[poseKey(action,direction,frame)]=drawPose(cfg,action,direction,frame,palettes,hairstyleVariant);
 const result={ok:true,config:cfg,cacheKey:key,equipment,palettes,adjustments,poses,canvas:{...D.canvas},animations:D.animations};
 cache.set(key,result);while(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);
 return result;
}
function drawPose(p,action,direction,frame,palettes,variant){
 const commands=[],width=D.bodyTemplates[p.body].shoulderWidth,faceW=D.bodyTemplates[p.body].headWidth,legGap=D.bodyTemplates[p.body].legSpacing;
 let order=0;const r=(band,x,y,w,h,color)=>{if(w>0&&h>0)commands.push({band,order:order++,kind:'rect',x:Math.round(x),y:Math.round(y),w:Math.round(w),h:Math.round(h),color:palettes[color]||color});};
 const isWalk=action==='walk',shift=isWalk?(frame%2?1:-1):0,bob=isWalk?(frame===1||frame===3?-1:0):0;
 const mid=16,headTop=6+bob,bodyTop=22+bob,faceX=mid-Math.floor(faceW/2),faceBottom=20+bob;
 // Grounded feet and trouser legs, facing dependent gait. Small unmodified rectangles keep a true pixel grammar.
 const leftLegX=16-legGap-3,rightLegX=16+legGap-1;
 r(38,leftLegX,32+bob+Math.max(0,shift),5,6,'trousers');r(38,rightLegX,32+bob+Math.max(0,-shift),5,6,'trousers');
 r(39,leftLegX-1,37+Math.max(0,shift),6,2,'shoes');r(39,rightLegX,37+Math.max(0,-shift),6,2,'shoes');
 // Rear hair is deliberately a separate band for long hairstyles and buns.
 if(p.hair==='long'){r(20,faceX-2,headTop+3,4,17,'hair');r(20,faceX+faceW-2,headTop+3,4,17,'hair');}
 if(p.hair==='bun'){r(20,faceX+faceW-1,headTop-3,6,6,'hair');}
 if(p.hair==='curly'){r(20,faceX-2,headTop+1,faceW+4,10,'hair');}
 // Arms behind and in front of the garment share a single pose clock.
 const armYOffset=isWalk?(frame%2?-2:1):0;
 r(30,mid-Math.floor(width/2)-3,bodyTop+2+armYOffset,3,10,'skin');
 r(40,faceX-1,headTop+3,faceW+2,faceBottom-headTop+1,'outline');
 r(41,faceX,headTop+4,faceW,faceBottom-headTop-1,'skin');
 r(48,mid-2,bodyTop-3,4,5,'skin');
 r(50,mid-Math.floor(width/2),bodyTop,width,11,'fabric');
 if(p.outfit==='smart'){r(52,mid-2,bodyTop,4,5,'trim');r(53,mid,bodyTop+5,1,6,'trim');}
 if(p.outfit==='sport'){r(52,mid+2,bodyTop+1,2,10,'trim');}
 if(p.outfit==='creative'){r(52,mid-Math.floor(width/2)+2,bodyTop+4,width-4,2,'trim');}
 r(60,mid+Math.floor(width/2),bodyTop+2-armYOffset,3,10,'skin');
 // Face visibility changes by direction; no floating eyes on the back of the head.
 if(direction==='south'){r(62,mid-4,headTop+10,2,2,'outline');r(62,mid+3,headTop+10,2,2,'outline');if(p.mood==='smile')r(63,mid-2,headTop+15,5,1,'outline');else if(p.mood==='focused')r(63,mid-2,headTop+15,4,1,'outline');}
 else if(direction==='east'){r(62,mid+3,headTop+10,2,2,'outline');if(p.mood==='smile')r(63,mid+3,headTop+15,3,1,'outline');}
 else if(direction==='west'){r(62,mid-4,headTop+10,2,2,'outline');if(p.mood==='smile')r(63,mid-4,headTop+15,3,1,'outline');}
 const fullHair=p.headwear==='none';
 const hairTop=headTop+(variant==='under_hat'?1:0);
 if(direction==='north'){r(70,faceX-1,hairTop,faceW+2,13,'hair');}
 else{
  r(70,faceX-1,hairTop,faceW+2,variant==='under_hat'?4:6,'hair');
  if(p.hair==='curly'){for(let i=0;i<4;i++)r(71,faceX-2+i*4,hairTop-1,4,4,'hair');}
  if(p.hair==='swept'){r(71,faceX-2,hairTop+4,Math.floor(faceW*.6),4,'hair');}
  if(p.hair==='short'||p.hair==='buzz')r(71,faceX+1,hairTop+5,faceW-2,variant==='under_hat'?1:2,'hair');
  if(p.hair==='bun'&&fullHair)r(71,faceX+1,hairTop+4,faceW-2,2,'hair');
 }
 if(p.headwear==='cap'){r(80,faceX-2,headTop-2,faceW+4,5,'fabric');r(81,faceX-3+(direction==='west'?0:3),headTop+3,faceW+3,2,'fabric');r(82,faceX+2,headTop-1,3,1,'trim');}
 if(p.headwear==='beanie'){r(80,faceX-2,headTop-3,faceW+4,8,'fabric');r(81,faceX-2,headTop+3,faceW+4,2,'trim');}
 commands.sort((a,b)=>a.band-b.band||a.order-b.order);
 return commands;
}
function resolvePose(compiled,action='idle',direction='south',frame=0){if(!compiled?.ok)throw Error('Compile character first');return compiled.poses[poseKey(action,direction,frame)]||compiled.poses[D.fallbacks.missingPose];}
function renderToCanvas(canvas,compiled,action='idle',direction='south',frame=0){
 if(!canvas||typeof canvas.getContext!=='function')throw Error('Canvas required');const ctx=canvas.getContext('2d');if(!ctx)throw Error('2D canvas unavailable');
 canvas.width=D.canvas.width;canvas.height=D.canvas.height;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
 for(const c of resolvePose(compiled,action,direction,frame)){ctx.fillStyle=c.color;ctx.fillRect(c.x,c.y,c.w,c.h);}return canvas;
}
const safeText=t=>String(t).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function renderSvg(compiled,action='idle',direction='south',frame=0,alt='Pixel character'){
 const parts=resolvePose(compiled,action,direction,frame).map(c=>`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${c.color}"/>`).join('');
 return `<svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" class="character-avatar pixel-character" role="img" aria-label="${safeText(alt)}" shape-rendering="crispEdges">${parts}</svg>`;
}
function spriteSheet(compiled,ctx){if(!compiled?.ok)throw Error('Compile first');const actions=ACTIONS,directions=DIRECTIONS,frameCount=Math.max(...actions.map(a=>D.animations[a].durations.length));const w=D.canvas.width,h=D.canvas.height;const out=ctx.createElement('canvas');out.width=frameCount*w;out.height=actions.length*directions.length*h;const draw=ctx.createElement('canvas');draw.width=w;draw.height=h;const outCtx=out.getContext('2d');outCtx.imageSmoothingEnabled=false;actions.forEach((act,i)=>directions.forEach((dir,j)=>{for(let frame=0;frame<D.animations[act].durations.length;frame++){renderToCanvas(draw,compiled,act,dir,frame);outCtx.drawImage(draw,frame*w,(i*directions.length+j)*h);}}));return out;}
function startPreview(canvas,getConfig,getPose){let dead=false,raf=0,lastKey='';function step(time){if(dead||!canvas.isConnected)return;const c=getConfig(),compiled=compile(c);const pose=getPose(),action=pose.action||'idle',direction=pose.direction||'south';const frame=frameAt(time,D.animations[action].durations);const key=compiled.cacheKey+'/'+action+'/'+direction+'/'+frame;if(key!==lastKey){renderToCanvas(canvas,compiled,action,direction,frame);lastKey=key;}raf=requestAnimationFrame(step);}raf=requestAnimationFrame(step);return ()=>{dead=true;cancelAnimationFrame(raf)};}
return {catalog:D,normal,compile,poseKey,resolvePose,renderSvg,renderToCanvas,spriteSheet,startPreview,frameAt,clearCache:()=>cache.clear(),cacheSize:()=>cache.size};
});
