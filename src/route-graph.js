(function(root){
'use strict';
/** Pure graph planner. This file is independent of game state and drawing. */
function validate(layout,expectedVenues){
 const errors=[];
 if(!layout||layout.schema!=='the-life-loop.board-route.v1')errors.push('Unsupported route schema');
 const nodes=Array.isArray(layout?.nodes)?layout.nodes:[];
 if(!nodes.length)errors.push('Route graph must contain nodes');
 const edges=Array.isArray(layout?.edges)?layout.edges:[];
 const venues=layout?.venues&&typeof layout.venues==='object'?layout.venues:{};
 const ids=new Set();
 for(const n of nodes){
  if(typeof n?.id!=='string'||ids.has(n.id))errors.push('Invalid or duplicate node: '+n?.id);
  ids.add(n?.id);
  if(!Number.isFinite(n?.x)||!Number.isFinite(n?.y)||n.x<0||n.x>1||n.y<0||n.y>1)errors.push('Invalid coordinates: '+n?.id);
  if(n?.cell!==undefined&&(!Array.isArray(n.cell)||n.cell.length!==2||n.cell.some(v=>!Number.isInteger(v)||v<1)))errors.push('Invalid board cell: '+n?.id);
 }
 const keys=new Set();
 for(const e of edges){
  if(!ids.has(e?.from)||!ids.has(e?.to)||e.from===e.to)errors.push('Invalid edge: '+e?.from+' -> '+e?.to);
  if(!Number.isFinite(e?.weight)||e.weight<=0)errors.push('Invalid edge weight: '+e?.from+' -> '+e?.to);
  const key=[e?.from,e?.to].sort().join('~');if(keys.has(key))errors.push('Duplicate edge: '+key);keys.add(key);
 }
 // Strict historic identity validation; modern or user-authored routes may omit it.
 if(layout?.originalRoute){
  const original=layout.originalRoute, count=original.waypointCount;
  if(!Number.isInteger(count)||count!==170||original.waypoints?.length!==count||original.waypoints?.some((w,i)=>w.index!==i+1||!Number.isFinite(w.u)||!Number.isFinite(w.v)))errors.push('Invalid original 170-waypoint data');
  const indexSet=new Set();
  for(const node of nodes){if(!Number.isInteger(node.pathIndex)||node.pathIndex<1||node.pathIndex>count||indexSet.has(node.pathIndex))errors.push('Invalid/duplicate original node index: '+node.id);indexSet.add(node.pathIndex);}
  const placeNums=new Set();
  for(const [venue,info] of Object.entries(venues)){
   const node=nodes.find(n=>n.id===info.stop);
   if(!Number.isInteger(info.placeNum)||info.placeNum<0||info.placeNum>12||placeNums.has(info.placeNum))errors.push('Invalid/duplicate original placeNum: '+venue);
   placeNums.add(info.placeNum);
   if(node&&node.pathIndex!==info.routeIndex)errors.push('Venue historic index mismatch: '+venue);
   if(info.businessId!==venue)errors.push('Venue businessId mismatch: '+venue);
  }
  if(placeNums.size!==13)errors.push('Original board requires 13 place identities');
  for(const edge of edges){
   const a=nodes.find(n=>n.id===edge.from),b=nodes.find(n=>n.id===edge.to);
   if(a&&b&&edge.weight!==Math.min((a.pathIndex-b.pathIndex+count)%count,(b.pathIndex-a.pathIndex+count)%count))errors.push('Historical edge distance mismatch: '+edge.from+' / '+edge.to);
  }
 }
 for(const [id,info] of Object.entries(venues)){
  if(!info||typeof info!=='object'||!ids.has(info?.stop))errors.push('Unknown venue stop: '+id);
  if(!Array.isArray(info?.entrance)||info.entrance.length!==2||info.entrance.some(v=>!Number.isFinite(v)||v<0||v>1))errors.push('Invalid venue entrance: '+id);
  if(info?.artEntrance!==undefined&&(!Array.isArray(info.artEntrance)||info.artEntrance.length!==2||info.artEntrance.some(v=>!Number.isFinite(v)||v<0||v>1)))errors.push('Invalid art entrance: '+id);
 }
 if(expectedVenues){
  for(const id of expectedVenues)if(!Object.hasOwn(venues,id))errors.push('Missing venue: '+id);
  for(const id of Object.keys(venues))if(!expectedVenues.includes(id))errors.push('Unexpected venue: '+id);
 }
 if(nodes.length){
  const seen=new Set([nodes[0].id]);let changed=true;
  while(changed){changed=false;for(const e of edges){if(seen.has(e.from)&&!seen.has(e.to)){seen.add(e.to);changed=true;}if(seen.has(e.to)&&!seen.has(e.from)){seen.add(e.from);changed=true;}}}
  if(seen.size!==nodes.length)errors.push('Route graph is disconnected');
 }
 return errors;
}
function compile(layout,expectedVenues){
 const errors=validate(layout,expectedVenues);
 if(errors.length)throw Error('Invalid route graph:\n'+errors.join('\n'));
 const byId=new Map(layout.nodes.map(n=>[n.id,n]));
 const adjacency=new Map(layout.nodes.map(n=>[n.id,[]]));
 for(const e of layout.edges){adjacency.get(e.from).push({to:e.to,weight:e.weight});adjacency.get(e.to).push({to:e.from,weight:e.weight});}
 const rank=new Map(layout.nodes.map((n,i)=>[n.id,i]));
 // The published SCI marble path is a circular 1-based, 170-step route.
 // Use original place routeIndices for gameplay; 14 board nodes remain visual anchors.
 // This keeps changing modern artwork or tiles from ever changing historic distances.
 const originalCache=new Map();
 const originalPlan=(startVenue,endVenue)=>{
  const key=startVenue+"|"+endVenue;
  if(originalCache.has(key))return originalCache.get(key);
  if(!layout.venues[startVenue]||!layout.venues[endVenue])throw Error('Unknown venue');
  const length=layout.originalRoute.waypointCount;
  const start=layout.venues[startVenue].routeIndex,goal=layout.venues[endVenue].routeIndex;
  const forward=(goal-start+length)%length,backward=(start-goal+length)%length;
  const direction=forward<=backward?1:-1,steps=Math.min(forward,backward);
  const waypointIndices=Array.from({length:steps+1},(_,i)=>((start-1+direction*i+length*2)%length)+1);
  const byPath=layout.nodes.slice().sort((a,b)=>a.pathIndex-b.pathIndex);
  const pathPositions=new Map(waypointIndices.map((idx,i)=>[idx,i]));
  const startNode=layout.venues[startVenue].stop,endNode=layout.venues[endVenue].stop;
  const intermediate=byPath.filter(n=>n.id!==startNode&&n.id!==endNode&&pathPositions.has(n.pathIndex))
   .sort((a,b)=>pathPositions.get(a.pathIndex)-pathPositions.get(b.pathIndex));
  const ids=[startNode,...intermediate.map(n=>n.id),...(startNode===endNode?[]:[endNode])];
  const result={from:startVenue,to:endVenue,ids,points:ids.map(id=>byId.get(id)),weight:steps,steps,
   waypointIndices,direction:direction===1?'ascending':'descending',
   fromPlaceNum:layout.venues[startVenue].placeNum,toPlaceNum:layout.venues[endVenue].placeNum};
  originalCache.set(key,result);return result;
 };
 const plan=(startVenue,endVenue)=>{
  if(layout.originalRoute)return originalPlan(startVenue,endVenue);
  if(!layout.venues[startVenue]||!layout.venues[endVenue])throw Error('Unknown venue');
  const start=layout.venues[startVenue].stop,goal=layout.venues[endVenue].stop;
  if(start===goal)return {from:startVenue,to:endVenue,ids:[start],points:[byId.get(start)],weight:0,steps:0};
  const dist=new Map(layout.nodes.map(n=>[n.id,Infinity]));dist.set(start,0);
  const previous=new Map(),visited=new Set();
  while(visited.size<layout.nodes.length){
   let at=null;
   for(const n of layout.nodes){if(visited.has(n.id))continue;if(at===null||dist.get(n.id)<dist.get(at))at=n.id;}
   if(at===null||dist.get(at)===Infinity)break;
   if(at===goal)break;
   visited.add(at);
   const neighbors=adjacency.get(at).slice().sort((a,b)=>rank.get(a.to)-rank.get(b.to));
   for(const e of neighbors){const value=dist.get(at)+e.weight;if(value<dist.get(e.to)){dist.set(e.to,value);previous.set(e.to,at);}}
  }
  if(!Number.isFinite(dist.get(goal)))throw Error('No route between venues');
  const ids=[goal];while(ids[0]!==start){const earlier=previous.get(ids[0]);if(!earlier)throw Error('Route predecessor missing');ids.unshift(earlier);}
  return {from:startVenue,to:endVenue,ids,points:ids.map(id=>byId.get(id)),weight:dist.get(goal),steps:ids.length-1};
 };
 return Object.freeze({plan,layout});
}
const api={validate,compile};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.LifeRoutes=api;
})(typeof window!=='undefined'?window:globalThis);
