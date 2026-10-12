(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LifeSetupPreferences=api;
})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const KEY='the-life-loop-setup-preferences-v1';
 const DEFAULTS=Object.freeze({mode:'solo',ruleset:'classic',era:'current',jonesDifficulty:'fair',goals:Object.freeze({wealth:50,happiness:50,education:50,career:50})});
 const allowedModes=['solo','hotseat','online','sandbox'];
 const allowedRules=['classic','modern'];
 const allowedEras=['historical','current','scifi'];
 const GOAL_KEYS=['wealth','happiness','education','career'];
 function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const goals=r.goals&&typeof r.goals==='object'?r.goals:{};
  return {mode:allowedModes.includes(r.mode)?r.mode:DEFAULTS.mode,
   ruleset:allowedRules.includes(r.ruleset)?r.ruleset:DEFAULTS.ruleset,
   era:allowedEras.includes(r.era)?r.era:DEFAULTS.era,
   jonesDifficulty:['easy','fair','hard'].includes(r.jonesDifficulty)?r.jonesDifficulty:DEFAULTS.jonesDifficulty,
   goals:Object.fromEntries(GOAL_KEYS.map(k=>[k,Number.isFinite(Number(goals[k]))&&Number(goals[k])>=10&&Number(goals[k])<=100&&Number(goals[k])%5===0?Number(goals[k]):DEFAULTS.goals[k]]))};
 }
 function read(storage){try{return sanitize(JSON.parse(storage?.getItem(KEY)||'null'));}catch{return sanitize(null);}}
 function write(storage,value){const pref=sanitize(value);try{storage?.setItem(KEY,JSON.stringify(pref));}catch{/* File-system browser origins may disallow storage; game remains playable. */}return pref;}
 function reset(storage){try{storage?.removeItem(KEY);}catch{}return sanitize(null);}
 function summary(preferences){const p=sanitize(preferences);return (p.ruleset==='classic'?'Classic':'Modern')+' · '+({current:'Contemporary',historical:'Historical',scifi:'Sci-Fi'}[p.era])+' · Goals '+GOAL_KEYS.map(k=>p.goals[k]).join('/')+'%'+(p.ruleset==='classic'?' · Jones '+({easy:'Take It Easy',fair:'Play Fair',hard:'Go For Broke'}[p.jonesDifficulty]):'');}
 return {KEY,DEFAULTS,GOAL_KEYS,sanitize,read,write,reset,summary};
});
