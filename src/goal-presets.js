/* Player-selectable campaign lengths, implemented through existing goal targets.
 * No fake wall-clock timer or changes to the original weekly time budget. */
(function(root,factory){const api=factory();if(root)root.LifeGoalPresets=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window==='undefined'?null:window,function(){'use strict';
const values=Object.freeze({quick:50,standard:65,extended:80});const KEYS=Object.freeze(['wealth','happiness','education','career']);
function goals(key){if(!Object.hasOwn(values,key))throw Error('Unknown goal preset');return Object.fromEntries(KEYS.map(k=>[k,values[key]]));}
function classify(input){for(const [k,value] of Object.entries(values))if(KEYS.every(goal=>Number(input?.[goal])===value))return k;return 'custom';}
return Object.freeze({values,KEYS,goals,classify});});
