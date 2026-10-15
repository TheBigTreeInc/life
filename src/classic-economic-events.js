/* DOS startTrn.sc economic-headline and scandal migration, pass 4.
 * Verified scandal EFFECTS from Jones 1.000.060 pass-2 reference; weekly trigger,
 * thresholds/cooldown, headlines and recovery happiness are PROVISIONAL gameplay.
 * No RNG calls in reducers. Only the Classic engine invokes these functions.
 */
(function(root){'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const PHASES=Object.freeze(['stable','downturn','recovery','boom']);
function initial(week=1){return {schema:'classic-economic-events.v1',phase:'stable',lastWeek:week,lastIncidentWeek:0,lastChange:0};}
function validate(value,week){
 if(!value||value.schema!=='classic-economic-events.v1'||!PHASES.includes(value.phase)||
   !Number.isInteger(value.lastWeek)||value.lastWeek<1||value.lastWeek>week||
   !Number.isInteger(value.lastIncidentWeek)||value.lastIncidentWeek<0||value.lastIncidentWeek>value.lastWeek||
   !Number.isInteger(value.lastChange)||Math.abs(value.lastChange)>12)throw Error('Invalid Classic economic event state');
 return {schema:'classic-economic-events.v1',phase:value.phase,lastWeek:value.lastWeek,
   lastIncidentWeek:value.lastIncidentWeek,lastChange:value.lastChange};
}
function advance(value,reading,change,week,random){
 const old=validate(value,week);if(week<=old.lastWeek)throw Error('Classic economic events already processed this week');
 if(!Number.isInteger(reading)||reading<10||reading>190||!Number.isInteger(change)||Math.abs(change)>12)throw Error('Invalid weekly macro reading');
 let phase='stable';
 if(old.phase==='downturn'&&reading>=92&&change>=2)phase='recovery';
 else if(reading<=90&&change<=-1)phase='downturn';
 else if(reading>=110&&change>=2)phase='boom';
 else if(old.phase==='recovery'&&change>=0)phase='recovery';
 const cooldown=old.lastIncidentWeek===0||week-old.lastIncidentWeek>=8;
 let strength=0;
 // Event occurrence is an explicit approximation; roll only in a crisis-eligible
 // week, so fixed seeds/snapshots produce the same simulation on both clients.
 if(phase==='downturn'&&change<=-3&&cooldown&&random()<.10){
   strength=reading<=75&&random()<.15?1:2;
 }
 return {state:{schema:'classic-economic-events.v1',phase,lastWeek:week,
   lastIncidentWeek:strength?week:old.lastIncidentWeek,lastChange:change},
   phaseChanged:phase!==old.phase,strength};
}
function scandal(before,strength,roll=0){
 if(![1,2].includes(strength)||![0,1].includes(roll))throw Error('Invalid DOS scandal input');
 if(!before||!Number.isFinite(before.bank)||before.bank<0||!Number.isSafeInteger(before.wage)||before.wage<0||
   !Number.isFinite(before.happiness)||before.happiness<0||before.happiness>100||
   !(before.job===null||typeof before.job==='string'))throw Error('Invalid DOS scandal player');
 const next={...before};let effect='none';
 if(strength===1){next.bank=0;if(next.job){next.job=null;next.wage=0;next.happiness=clamp(next.happiness-7,0,100);effect='dismissed';}
   else effect=before.bank?'savings-lost':'none';}
 else if(next.job){
   if(roll===0){next.job=null;next.wage=0;next.happiness=clamp(next.happiness-7,0,100);effect='dismissed';}
   else {next.wage=Math.max(1,Math.trunc(next.wage*8/10));next.happiness=clamp(next.happiness-3,0,100);effect='wage-cut';}
 }
 return {next,effect,savingsLost:before.bank-next.bank,wageLost:before.wage-next.wage};
}
const api=Object.freeze({schema:'classic-economic-events.v1',initial,validate,advance,scandal});
root.LifeClassicEconomicEvents=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
