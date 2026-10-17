/* Fixed game families; per-game deviations do not rewrite the base world. */
(function(root,factory){const api=factory();if(root)root.LifeRulePresets=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const DEFAULTS=Object.freeze({classic:Object.freeze({forcedReturnHome:true,carryReturnOvertime:true,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true,weeklyActionLimit:false}),modern:Object.freeze({forcedReturnHome:false,carryReturnOvertime:false,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true,weeklyActionLimit:false})});
 const KEYS=Object.freeze(['forcedReturnHome','carryReturnOvertime','foodSpoilage','overdueRentPenalty','marketFluctuations','weeklyActionLimit']);
 function normalize(ruleset,raw){
  const base=DEFAULTS[ruleset]||DEFAULTS.modern;
  const supplied=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const selected=Object.fromEntries(KEYS.map(key=>[key,typeof supplied[key]==='boolean'?supplied[key]:base[key]]));
  if(!selected.forcedReturnHome)selected.carryReturnOvertime=false;
  return selected;
 }
 function customized(ruleset,raw){const base=DEFAULTS[ruleset]||DEFAULTS.modern,p=normalize(ruleset,raw);return KEYS.some(k=>p[k]!==base[k]);}
 return Object.freeze({DEFAULTS,KEYS,normalize,customized});
});
