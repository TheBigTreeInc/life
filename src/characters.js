/* Offline-only, per-browser character profile library. No server API or account requirement. */
(function(root,factory){
  const api=factory();
  root.LifeCharacters=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='the-life-loop-characters-v1', LIMIT=16;
const SKIN={peach:'#f1bd91',tan:'#cf926d',brown:'#98634b',deep:'#5d3d34',pale:'#f3d5bc',olive:'#c1aa79'};
const HAIR={short:'Short',long:'Long',curly:'Curly',bun:'Bun',buzz:'Buzz',swept:'Side swept'};
const HAIR_COLOR={black:'#292733',brown:'#67442f',auburn:'#ab6540',blonde:'#d9ac53',silver:'#bbc6d1',mint:'#398e83'};
const OUTFIT={everyday:'Everyday',smart:'Smart',sport:'Sport',creative:'Creative'};
const ACCENT={forest:'#367b5d',coral:'#dc7a6a',violet:'#8274c7',sky:'#4683b0',gold:'#c48a35',rose:'#c26b99'};
const MOOD={smile:'Cheerful',calm:'Calm',focused:'Focused'};
const PERSONALITY={curious:'Curious',kind:'Kind',bold:'Bold',thoughtful:'Thoughtful'};
const DEFAULT={body:'standard',headwear:'none',skin:'peach',hair:'short',hairColor:'brown',outfit:'everyday',accent:'forest',mood:'smile',personality:'curious',portrait:''};
const PORTRAIT_ID=/^(pixel|illustrated-(0[1-9]|1[0-6])|original-(0[1-9]|[12][0-9]|3[0-5]))$/;
const text=(value,max)=>String(value??'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,max);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalizeAppearance(value){
 const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const result={};
 for(const [field,map] of Object.entries({body:{compact:1,standard:1,broad:1},headwear:{none:1,cap:1,beanie:1},skin:SKIN,hair:HAIR,hairColor:HAIR_COLOR,outfit:OUTFIT,accent:ACCENT,mood:MOOD,personality:PERSONALITY})) result[field]=Object.hasOwn(map,v[field])?v[field]:DEFAULT[field];
 result.portrait=typeof v.portrait==='string'&&PORTRAIT_ID.test(v.portrait)?v.portrait:'';
 if(result.portrait==='pixel'){result.schemaVersion=1;result.catalogVersion='2026-10-12.1';}
 return result;
}
function normalizeProfile(input){
 const val=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 return {id:/^[a-zA-Z0-9_-]{8,64}$/.test(String(val.id))?val.id:null,name:text(val.name,24)||'New character',...normalizeAppearance(val)};
}
function makeId(){
 if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID().replace(/-/g,'');
 return 'char_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
}
function createStore(storage){
 const storageRef=storage||null;
 function read(){
  try{
   const obj=JSON.parse(storageRef?.getItem(KEY)||'null');
   if(!obj||obj.version!==1||!Array.isArray(obj.profiles))return {profiles:[],selected:null};
   const used=new Set(),profiles=[];
   for(const raw of obj.profiles.slice(0,LIMIT)){
    const p=normalizeProfile(raw);
    if(!p.id||used.has(p.id))continue;
    used.add(p.id);profiles.push(p);
   }
   return {profiles,selected:profiles.some(p=>p.id===obj.selected)?obj.selected:null};
  }catch{return {profiles:[],selected:null};}
 }
 function write(state){
  try{
   if(!storageRef)throw Error('Local storage unavailable');
   storageRef.setItem(KEY,JSON.stringify({version:1,profiles:state.profiles,selected:state.selected}));
  }catch{throw Error('Browser storage is unavailable or full. Character changes were not saved.');}
 }
 function all(){return read().profiles;}
 function selected(){const state=read();return state.profiles.find(p=>p.id===state.selected)||null;}
 function choose(id){const state=read();if(!state.profiles.some(p=>p.id===id))throw Error('Character not found');state.selected=id;write(state);return selected();}
 function upsert(input){
  const state=read(),p=normalizeProfile(input);
  if(!text(input?.name,24))throw Error('Please enter a character name.');
  const index=state.profiles.findIndex(x=>x.id===p.id);
  if(index<0){if(state.profiles.length>=LIMIT)throw Error('Maximum 16 characters. Delete one to create another.');p.id=makeId();state.profiles.push(p);}
  else state.profiles[index]=p;
  state.selected=p.id;write(state);return p;
 }
 function remove(id){const state=read();state.profiles=state.profiles.filter(x=>x.id!==id);if(state.selected===id)state.selected=state.profiles[0]?.id||null;write(state);}
 return {read,all,selected,choose,upsert,remove};
}
function avatar(profile,size='normal'){
 const p=normalizeAppearance(profile),name=esc(profile?.name||'Character');
 const portrait=(typeof globalThis!=='undefined'?globalThis.LifePortraitAssets:null)?.portraits?.[p.portrait];
 if(portrait?.image)return `<img class="character-avatar character-avatar-${size} portrait-image" src="${portrait.image}" alt="${name}'s illustrated character portrait" draggable="false" />`;
 if(p.portrait==='pixel' && typeof globalThis.LifeSprites==='object'){const sprite=globalThis.LifeSprites.compile(p);if(sprite.ok)return globalThis.LifeSprites.renderSvg(sprite,'idle','south',0,`${name}'s pixel character`);}
 const skin=SKIN[p.skin],hair=HAIR_COLOR[p.hairColor],outfit=ACCENT[p.accent],soft=outfit+'22';
 const hairShapes={
  short:`<path d="M24 46 Q25 14 59 13 Q94 12 96 45 Q85 31 68 29 Q52 24 39 35 Q32 39 24 46Z" fill="${hair}"/>`,
  long:`<path d="M22 43 Q24 11 61 12 Q97 13 98 42 L97 93 Q91 106 77 101 L77 38 Q63 31 46 35 L44 101 Q30 106 23 92 Z" fill="${hair}"/>`,
  curly:`<g fill="${hair}"><circle cx="28" cy="39" r="12"/><circle cx="37" cy="24" r="15"/><circle cx="54" cy="18" r="18"/><circle cx="75" cy="18" r="18"/><circle cx="91" cy="27" r="15"/><circle cx="96" cy="43" r="11"/><circle cx="74" cy="35" r="16"/><circle cx="49" cy="35" r="16"/></g>`,
  bun:`<circle cx="84" cy="16" r="15" fill="${hair}"/><path d="M25 45 Q24 13 60 13 Q95 13 95 42 Q75 28 59 28 Q41 29 25 45Z" fill="${hair}"/>`,
  buzz:`<path d="M27 39 Q30 16 60 16 Q89 16 92 39 Q61 29 27 39Z" fill="${hair}"/>`,
  swept:`<path d="M23 43 Q24 12 61 12 Q95 12 95 38 Q77 37 66 24 Q55 24 44 33 Q35 41 23 43Z" fill="${hair}"/>`
 };
 const eyebrow=p.mood==='focused'?'M43 54 L49 52 M71 52 L77 54':p.mood==='calm'?'M43 53 L49 53 M71 53 L77 53':'M43 52 L49 54 M71 54 L77 52';
 const mouth=p.mood==='smile'?'<path d="M48 72 Q60 80 72 72"/>':p.mood==='focused'?'<path d="M49 74 L71 74"/>':'<path d="M49 73 Q60 77 71 73"/>';
 const outfitDetails=p.outfit==='smart'
  ? `<path d="M44 97 L59 116 L74 97 L66 92 L59 104 L52 92Z" fill="#f8faf6"/><path d="M37 140 L48 95 L59 111 L72 95 L83 140" fill="${outfit}"/>`
  : p.outfit==='sport'
  ? `<path d="M37 140 Q40 108 47 95 L59 105 L72 95 Q79 107 82 140" fill="${outfit}"/><path d="M59 95 L59 136" stroke="#ffffff99" stroke-width="4"/>`
  : p.outfit==='creative'
  ? `<path d="M37 140 Q40 110 49 96 L59 104 L70 96 Q79 108 82 140" fill="${outfit}"/><path d="M42 114 L76 127" stroke="#ffffffb0" stroke-width="5" stroke-linecap="round"/><circle cx="46" cy="106" r="4" fill="#ffffffaa"/><circle cx="72" cy="113" r="3.2" fill="#ffffff88"/>`
  : `<path d="M37 140 Q40 110 49 96 L59 104 L70 96 Q79 108 82 140" fill="${outfit}"/>`;
 return `<svg class="character-avatar character-avatar-${size}" viewBox="0 0 120 140" role="img" aria-label="${name}'s character portrait" xmlns="http://www.w3.org/2000/svg">
  <defs>
   <linearGradient id="bg-${p.accent}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${soft}"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
   <linearGradient id="shine-${p.accent}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".8"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="120" height="140" rx="28" fill="url(#bg-${p.accent})"/>
  <rect x="8" y="8" width="104" height="124" rx="24" fill="#ffffff9c"/>
  <circle cx="60" cy="49" r="34" fill="url(#shine-${p.accent})"/>
  <path d="M31 140 Q31 108 47 95 L59 104 L71 95 Q88 107 88 140" fill="${outfit}"/>
  <path d="M52 83 L53 96 L67 96 L68 83" fill="${skin}"/>
  <ellipse cx="60" cy="53" rx="30" ry="34" fill="${skin}"/>
  <ellipse cx="30" cy="56" rx="4.5" ry="8.5" fill="${skin}"/>
  <ellipse cx="90" cy="56" rx="4.5" ry="8.5" fill="${skin}"/>
  ${hairShapes[p.hair]}
  <path d="M40 60 Q46 63 50 60" fill="#fff" opacity=".22"/>
  <g stroke="#443638" stroke-width="2.6" stroke-linecap="round" fill="none">
   <path d="${eyebrow}"/>
   <path d="M45 61 L49 61"/>
   <path d="M71 61 L75 61"/>
   <path d="M60 61 L58 68 L63 68" opacity=".55"/>
   ${mouth}
  </g>
  <circle cx="47" cy="61" r="1.5" fill="#443638"/>
  <circle cx="73" cy="61" r="1.5" fill="#443638"/>
  <path d="M37 140 Q40 110 49 96 L59 104 L70 96 Q79 108 82 140" fill="${outfit}"/>
  ${outfitDetails}
  <rect x="17" y="108" width="17" height="17" rx="8.5" fill="${outfit}" opacity=".12"/>
  <rect x="86" y="18" width="16" height="16" rx="8" fill="${outfit}" opacity=".18"/>
 </svg>`;
}
return {KEY,LIMIT,SKIN,HAIR,HAIR_COLOR,OUTFIT,ACCENT,MOOD,PERSONALITY,normalizeAppearance,normalizeProfile,createStore,avatar,PORTRAIT_ID};
});
