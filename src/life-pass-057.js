/* The Life Loop v0.5.57: pure close-of-week food accounting, game-length
 * presets, and the first English/Dutch presentation vocabulary.
 * Gameplay rules are unchanged by locale and goal presets. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LifePass057=api;
})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const GOAL_KEYS=Object.freeze(['wealth','happiness','education','career']);
 const PRESETS=Object.freeze({quick:30,standard:50,extended:75});
 const DICT=Object.freeze({
   en:Object.freeze({
     'Game settings':'Game settings','Rules · era · goals':'Rules · era · goals',
     'Your life goals':'Your life goals','Language':'Language','Match length':'Match length',
     'Quick':'Quick','Standard':'Standard','Extended':'Extended','Custom':'Custom',
     'Start new game':'Start new game','Resume game':'Resume game',
     'Classic Rules':'Classic Rules','Modern Story':'Modern Story',
     'Wealth':'Wealth','Happiness':'Happiness','Education':'Education','Career':'Career',
     'Goal points':'Goal points','Estimated match length':'Estimated match length',
     'Longer matches use higher victory goals, not slower turns.':'Longer matches use higher victory goals, not slower turns.'
   }),
   nl:Object.freeze({
     'Game settings':'Spelinstellingen','Rules · era · goals':'Regels · tijdperk · doelen',
     'Your life goals':'Jouw levensdoelen','Language':'Taal','Match length':'Speelduur',
     'Quick':'Snel','Standard':'Standaard','Extended':'Uitgebreid','Custom':'Aangepast',
     'Start new game':'Nieuw spel starten','Resume game':'Spel hervatten',
     'Classic Rules':'Klassieke regels','Modern Story':'Modern verhaal',
     'Wealth':'Vermogen','Happiness':'Geluk','Education':'Opleiding','Career':'Carrière',
     'Goal points':'Doelpunten','Estimated match length':'Geschatte speelduur',
     'Longer matches use higher victory goals, not slower turns.':'Langere spellen gebruiken hogere overwinningsdoelen, geen langzamere beurten.'
   })
 });
 const localeKey='the-life-loop-language-v1';
 function locale(value){return value==='nl'?'nl':'en';}
 function t(language,key){return DICT[locale(language)][key]??DICT.en[key]??key;}
 function presetGoals(preset){if(!Object.hasOwn(PRESETS,preset))throw Error('Unknown goal preset');return Object.fromEntries(GOAL_KEYS.map(key=>[key,PRESETS[preset]]));}
 function detectPreset(goals){if(!goals||typeof goals!=='object')return 'custom';return Object.keys(PRESETS).find(id=>GOAL_KEYS.every(k=>goals[k]===PRESETS[id]))||'custom';}
 function goalDistance(scores,goals){
   if(!scores||!goals)throw Error('Missing scores/goals');
   return Object.fromEntries(GOAL_KEYS.map(k=>{
     const score=Number(scores[k]),target=Number(goals[k]);
     if(!Number.isFinite(score)||!Number.isFinite(target)||target<10||target>100)throw Error('Invalid score/goal');
     return [k,{score,target,remaining:Math.max(0,target-score),achieved:score>=target}];
   }));
 }
 function savedLocale(storage){try{return locale(storage?.getItem(localeKey));}catch{return 'en';}}
 function saveLocale(storage,value){const lang=locale(value);try{storage?.setItem(localeKey,lang);}catch{}return lang;}
 function closeWeekFood({closedWeek,purchasedWeek=0,groceries,fed,hunger,happiness,missedHappinessLoss=8}){
   if(!Number.isSafeInteger(closedWeek)||closedWeek<1||!Number.isSafeInteger(purchasedWeek)||purchasedWeek<0||purchasedWeek>closedWeek||
     !Number.isSafeInteger(groceries)||groceries<0||groceries>10000||typeof fed!=='boolean'||
     !Number.isSafeInteger(hunger)||hunger<0||hunger>4||!Number.isSafeInteger(happiness)||happiness<0||happiness>100||
     !Number.isSafeInteger(missedHappinessLoss)||missedHappinessLoss<0||missedHappinessLoss>100)
     throw Error('Invalid prior-week food state');
   let consumed=0,missed=false;
   if(fed)hunger=Math.max(0,hunger-1);
   else if(groceries>0){groceries--;consumed=1;hunger=Math.max(0,hunger-1);}
   else{missed=true;hunger=Math.min(4,hunger+1);happiness=Math.max(0,happiness-missedHappinessLoss);}
   return Object.freeze({closedWeek,purchasedInClosedWeek:purchasedWeek===closedWeek,
     groceries,hunger,happiness,consumed,missed,hadMeal:fed});
 }
 return Object.freeze({schema:'life-pass-057.v1',GOAL_KEYS,PRESETS,DICT,localeKey,locale,t,presetGoals,detectPreset,goalDistance,savedLocale,saveLocale,closeWeekFood});
});
