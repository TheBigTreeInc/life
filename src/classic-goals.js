/* Classic DOS 1.000.060 goal mathematics, independent of Modern Story.
 * Sources: viewGoals.sc localproc_0, n108.sc / room1.sc, university.sc.
 * Inputs are source-stat points; external investments / item appraisal are
 * still subject to their own documented parity gaps.
 */
(function(root,factory){
 const api=factory();if(root)root.LifeClassicGoals=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window,function(){'use strict';
 const GOALS=Object.freeze(['wealth','happiness','education','career']);
 function validInt(n,label){if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid Classic '+label);return n;}
 function careerStat(dependability,employed){
  validInt(dependability,'dependability');if(typeof employed!=='boolean')throw Error('Invalid employment flag');
  return employed?Math.min(100,Math.floor(dependability/8)*10):0;
 }
 function educationStat(degrees){
  validInt(degrees,'completed diplomas');return degrees===0?0:1+9*degrees;
 }
 function validateGoals(goals){
  if(!goals||typeof goals!=='object'||Array.isArray(goals))throw Error('Invalid Classic goals');
  for(const k of GOALS)if(!Number.isSafeInteger(goals[k])||goals[k]<1||goals[k]>100)throw Error('Invalid Classic goal '+k);
 }
 function progress(stats,goals){
  validateGoals(goals);
  if(!stats||typeof stats!=='object'||Array.isArray(stats))throw Error('Invalid Classic stats');
  const earned=GOALS.reduce((sum,k)=>{
   const value=stats[k];if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('Invalid Classic stat '+k);
   // DOS goal state contains integer points (not floating fractional deposits).
   return sum+Math.min(Math.floor(value),goals[k]);
  },0);
  const total=GOALS.reduce((sum,k)=>sum+goals[k],0);
  return Math.min(100,Math.floor(earned*100/total));
 }
 function won(stats,goals){
  validateGoals(goals);
  if(!stats||typeof stats!=='object')throw Error('Invalid Classic stats');
  return GOALS.every(k=>typeof stats[k]==='number'&&Number.isFinite(stats[k])&&stats[k]>=goals[k]);
 }
 return Object.freeze({schema:'classic-goals.v1',GOALS,careerStat,educationStat,progress,won});
});
