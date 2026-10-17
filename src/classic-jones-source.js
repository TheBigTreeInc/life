/* Source-linked, pure Jones branch predicates from DOS 1.000.060
 * WhereShouldIGo.sc, script#300 (decompiled by sluicebox).
 * These predicates do NOT reproduce the original RNG, complete priority tree,
 * DOS travel quantization or the original inventory model.
 */
(function(root){'use strict';
 const whole=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid Jones '+name);return n;};
 function raiseEligible(raises,dependability,minDepend,offeredWage,contractWage){
  [raises,dependability,minDepend,offeredWage,contractWage].forEach((v,i)=>whole(v,['raises','dependability','minDepend','offer','contract'][i]));
  // Branch 28: raisesGiven < 2; dependibility >= minDepend + 10 + 5*raisesGiven;
  // revised economy quote > contracted wage. global402 remains an unknown gate.
  return raises<2&&dependability>=minDepend+10+5*raises&&offeredWage>contractWage;
 }
 function promotionEligible(experience,maxExperience,dependability,minDepend,offeredWage,contractWage){
  [experience,maxExperience,dependability,minDepend,offeredWage,contractWage].forEach((v,i)=>whole(v,['experience','maxExperience','dependability','minDepend','offer','contract'][i]));
  // Branch 29 also checks `notEnoughEd` and global402; caller handles degree
  // gates and uses offered salary for the existing playable job catalog.
  return maxExperience<80&&experience>=maxExperience&&dependability>=minDepend+10&&offeredWage>contractWage;
 }
 function reliabilityGap(experience,maxExperience,dependability,minDepend){
  [experience,maxExperience,dependability,minDepend].forEach((v,i)=>whole(v,['experience','maxExperience','dependability','minDepend'][i]));
  // Branch 30: global493 is the smaller of the deficits to experience cap and
  // minDepend+10, floored at one. Caller decides whether enough action time remains.
  return Math.max(1,Math.min(Math.max(1,maxExperience-experience),Math.max(1,minDepend+10-dependability)));
 }
 function restBranch(relaxation){
  whole(relaxation,'relaxation');if(relaxation<10||relaxation>30)throw Error('Invalid Jones relaxation');
  // Branch 32 at exactly 10; branch 37 at less than 17 if earlier branches
  // did not apply. A separate original work/rest split (33) is not simulated.
  return relaxation===10?32:relaxation<17?37:null;
 }
 function educationCandidate(completedDegrees,activeEnrollments,cash){
  [completedDegrees,activeEnrollments,cash].forEach((v,i)=>whole(v,['completedDegrees','enrollments','cash'][i]));
  // Branch 44: 11-degree ceiling and either unfinished enrollment or >$400 cash.
  // The original random and no-more-work gate remains pending; do not roll RNG
  // inside this preview predicate.
  return completedDegrees<11&&(activeEnrollments>0||cash>400);
 }
 const source=Object.freeze({script:'WhereShouldIGo.sc',scriptId:300,edition:'DOS 1.000.060',motionOverheadTicks:28,activeClockTicksPerUnit:14,
  mapped: Object.freeze({1:'unemployed office',7:'rent payment',9:'rent liquidity',20:'clothing renewal',21:'work for food',22:'food liquidity',23:'food pawn',27:'food purchase',28:'raise',29:'promotion',30:'experience work',32:'rest critical',37:'rest low',44:'education',46:'work'}),
  remaining:'Original 1-49 branch tree, per-branch RNG and travel tick conversion not fully mapped'});
 const api=Object.freeze({schema:'classic-jones-source.v1',raiseEligible,promotionEligible,reliabilityGap,restBranch,educationCandidate,source});
 root.LifeClassicJonesSource=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
