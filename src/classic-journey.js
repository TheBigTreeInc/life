/* Presentation-only Classic travel lifecycle. Host game owns state and time.
 * A cancelled/failed trip never claims an arrival. Safe for mobile and hotseat.
 */
(function(root){'use strict';
const STATES=Object.freeze(['idle','departing','arrived','awaiting-host','blocked']);
function create(state,place,quote=null){
 if(!STATES.includes(state))throw Error('Unknown journey phase');
 if(state==='idle')return Object.freeze({phase:state,message:'',place:''});
 if(typeof place!=='string'||!place.trim()||place.length>100)throw Error('Invalid journey place');
 if(quote!==null&&(!Number.isSafeInteger(quote.hours)||quote.hours<0||quote.hours>60))throw Error('Invalid journey cost');
 const hourText=quote?` · ${quote.hours} clock units`:'';
 const label={departing:`On the road to ${place}${hourText}`,arrived:`Arrived at ${place} · choose an action`,
   'awaiting-host':`Travel to ${place} requested · awaiting host`,blocked:`Cannot travel to ${place}`}[state];
 return Object.freeze({phase:state,message:label,place});
}
const api=Object.freeze({schema:'classic-journey.v1',STATES,create});
root.LifeClassicJourney=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
