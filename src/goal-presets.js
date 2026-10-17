/* Shared goal-preset adapter: one canonical set of goals for all campaigns.
 * Matches the retained ZipRunner GoalPresets.goals(key) controller contract.
 * Campaign values are independent of legacy Life57 experimental pace helpers.
 * Presets affect victory thresholds, never duration of an engine clock.
 */
(function(root,factory){
 const api=factory(root?.LifePass057||(typeof module==='object'&&module.exports?require('./life-pass-057.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.LifeGoalPresets=api;root.GoalPresets=api;}
})(typeof window==='undefined'?null:window,function(UX){
 'use strict';
 if(!UX)throw Error('Load life-pass-057 before goal-presets');
 const keys=Object.freeze([...UX.GOAL_KEYS]);
 const values=Object.freeze({quick:50,standard:65,extended:80});
 const names=Object.freeze(Object.keys(values));
 function goals(key){
   if(!names.includes(key))throw Error('Unknown goal preset: '+String(key));
   return Object.freeze(Object.fromEntries(keys.map(k=>[k,values[key]])));
 }
 function detect(current){if(!current||typeof current!=='object')return 'custom';return names.find(k=>keys.every(goal=>current[goal]===values[k]))||'custom';}
 function total(key){return keys.reduce((value,name)=>value+goals(key)[name],0);}
 return Object.freeze({schema:'life-goal-presets.v1',KEYS:keys,PRESETS:values,goals,detect,classify:detect,total});
});
