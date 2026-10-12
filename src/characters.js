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
const DEFAULT={skin:'peach',hair:'short',hairColor:'brown',outfit:'everyday',accent:'forest',mood:'smile',personality:'curious'};
const text=(value,max)=>String(value??'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,max);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalizeAppearance(value){
 const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const result={};
 for(const [field,map] of Object.entries({skin:SKIN,hair:HAIR,hairColor:HAIR_COLOR,outfit:OUTFIT,accent:ACCENT,mood:MOOD,personality:PERSONALITY})) result[field]=Object.hasOwn(map,v[field])?v[field]:DEFAULT[field];
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
 const skin=SKIN[p.skin],hair=HAIR_COLOR[p.hairColor],outfit=ACCENT[p.accent];
 const hairPaths={
  short:`<path d="M26 41 Q22 10 58 12 Q92 9 94 43 L84 35 Q70 30 62 22 Q50 36 31 34 Z" fill="${hair}"/>`,
  long:`<path d="M23 38 Q17 8 60 10 Q105 10 98 43 L100 91 Q91 101 79 85 L80 36 Q59 27 43 34 L40 87 Q29 98 22 87 Z" fill="${hair}"/>`,
  curly:`<g fill="${hair}"><circle cx="31" cy="29" r="15"/><circle cx="48" cy="21" r="17"/><circle cx="67" cy="19" r="17"/><circle cx="84" cy="26" r="16"/><circle cx="92" cy="43" r="12"/><circle cx="24" cy="43" r="12"/></g>`,
  bun:`<circle cx="82" cy="14" r="16" fill="${hair}"/><path d="M25 41 Q20 10 60 12 Q97 13 94 41 L84 33 Q60 34 48 25 L33 39 Z" fill="${hair}"/>`,
  buzz:`<path d="M27 37 Q26 13 59 14 Q91 14 92 37 Q61 30 27 37Z" fill="${hair}"/>`,
  swept:`<path d="M25 43 Q16 12 59 12 Q97 12 94 39 Q69 41 63 27 Q42 44 25 43Z" fill="${hair}"/>`
 };
 const mouth=p.mood==='smile'?'<path d="M48 65 Q59 76 71 65"/>':p.mood==='focused'?'<path d="M49 68 L69 68"/>':'<path d="M51 67 Q60 70 68 67"/>';
 const collar=p.outfit==='smart'?`<path d="M44 92 L58 116 L72 92 L65 88 L58 104 L51 88Z" fill="#fcf8f1"/>`:p.outfit==='creative'?`<path d="M39 103 L82 121" stroke="#fff4" stroke-width="7"/>`:p.outfit==='sport'?`<path d="M59 90 L59 140" stroke="#fff8" stroke-width="4"/>`:'';
 return `<svg class="character-avatar character-avatar-${size}" viewBox="0 0 120 140" role="img" aria-label="${name}'s character portrait" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="140" rx="24" fill="${ACCENT[p.accent]}28"/><circle cx="60" cy="55" r="44" fill="#fff7"/><path d="M4 140 Q2 96 38 94 L49 90 L70 90 L82 94 Q116 97 117 140" fill="${outfit}"/><path d="M52 84 L53 96 L67 96 L68 84" fill="${skin}"/><ellipse cx="60" cy="49" rx="31" ry="36" fill="${skin}"/><ellipse cx="29" cy="51" rx="5" ry="9" fill="${skin}"/><ellipse cx="91" cy="51" rx="5" ry="9" fill="${skin}"/>${hairPaths[p.hair]}<g stroke="#3f3435" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M43 51 L49 51"/><path d="M70 51 L76 51"/>${mouth}</g>${collar}</svg>`;
}
return {KEY,LIMIT,SKIN,HAIR,HAIR_COLOR,OUTFIT,ACCENT,MOOD,PERSONALITY,normalizeAppearance,normalizeProfile,createStore,avatar};
});
