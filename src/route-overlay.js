(function(root){
'use strict';
/* The route is presentation only. World state, travel hours and turn authority live in LifeGame. */
const NS='http://www.w3.org/2000/svg';
const RING=[[1,1],[2,1],[3,1],[4,1],[5,1],[5,2],[5,3],[5,5],[4,5],[2,5],[1,5],[1,5],[1,4],[1,3]];
const ROLES={player:{color:'#a8f36e',letter:'1'},friend:{color:'#8bdcf5',letter:'2'},jones:{color:'#c3a1fd',letter:'J'}};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const linear=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const rectPoint=(rect,parent,u,v)=>({x:rect.left-parent.left+rect.width*u,y:rect.top-parent.top+rect.height*v});
function distance(a,b){return Math.hypot(b.x-a.x,b.y-a.y);}
function pathPointAt(points,t){
 if(!points.length)return null;if(points.length===1)return points[0];
 const seg=points.slice(1).map((b,i)=>distance(points[i],b));
 const total=seg.reduce((a,b)=>a+b,0);if(total===0)return points.at(-1);
 let walked=clamp(t,0,1)*total;
 for(let i=0;i<seg.length;i++){if(walked<=seg[i]||i===seg.length-1)return linear(points[i],points[i+1],seg[i]?walked/seg[i]:1);walked-=seg[i];}
 return points.at(-1);
}
// Draw one softly rounded, continuous route instead of resetting the dashes at
// every DOS waypoint. Only rendering is simplified; original point indices and
// estimated travel cost remain untouched.
function compactLine(points){
 const filtered=[];
 for(const point of points){if(point&&(!filtered.length||distance(filtered.at(-1),point)>.25))filtered.push(point);}
 const out=[];
 for(const point of filtered){
  while(out.length>1){
   const a=out.at(-2),b=out.at(-1),dx=point.x-a.x,dy=point.y-a.y;
   const cross=Math.abs((b.x-a.x)*dy-(b.y-a.y)*dx),dot=(b.x-a.x)*(point.x-b.x)+(b.y-a.y)*(point.y-b.y);
   if(cross<=.6*Math.max(1,Math.hypot(dx,dy))&&dot>=-.01)out.pop();else break;
  }
  out.push(point);
 }
 return out;
}
function roundedPath(points,radius=10){
 const line=compactLine(points);if(!line.length)return '';
 const coord=p=>`${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
 let d=`M ${coord(line[0])}`;
 for(let i=1;i<line.length-1;i++){
  const prev=line[i-1],p=line[i],next=line[i+1];
  const before=distance(prev,p),after=distance(p,next);
  const r=Math.min(radius,before*.45,after*.45);
  if(r<.4){d+=` L ${coord(p)}`;continue;}
  const a=linear(p,prev,r/before),b=linear(p,next,r/after);
  d+=` L ${coord(a)} Q ${coord(p)} ${coord(b)}`;
 }
 if(line.length>1)d+=` L ${coord(line.at(-1))}`;
 return d;
}
// Render just the final doorstep distance. Road movement remains on the
// historic public path; this intentionally does not draw a long line across
// the building's painted facade.
function doorwayTail(points,length=18){
 const path=points.filter(Boolean);
 if(path.length<2)return path;
 let remaining=Math.max(0,length),start=path.length-1;
 while(start>0&&remaining>0){
  const seg=distance(path[start-1],path[start]);
  if(seg>=remaining&&seg>.001){
   const join=linear(path[start],path[start-1],remaining/seg);
   return [join,...path.slice(start)];
  }
  remaining-=seg;start--;
 }
 return path;
}
// The pawn follows the same visible paved frontage and public road used by
// hover previews. Historical waypoint indices still determine the billable
// trip: pixel lengths affect animation only.
function pawnJourneyFrame(road,departure,arrival,t){
 const progress=clamp(t,0,1);
 const first=departure.slice().reverse(),last=arrival.slice();
 if(progress<.15)return {position:pathPointAt(first,progress/.15)||road[0],opacity:1,phase:'depart'};
 if(progress<.85)return {position:pathPointAt(road,(progress-.15)/.70)||road.at(-1),opacity:1,phase:'road'};
 return {position:pathPointAt(last,(progress-.85)/.15)||last.at(-1),opacity:1,phase:'arrive'};
}
function el(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [key,val] of Object.entries(attrs))e.setAttribute(key,String(val));if(text!==undefined)e.textContent=String(text);return e;}
class RouteOverlay{
 constructor({frame,board,svg,announce,layout,expectedVenues}){
  this.frame=frame;this.board=board;this.svg=svg;this.announce=announce;
  this.router=root.LifeRoutes.compile(layout,expectedVenues);
  this.layout=layout;this.nodes=new Map();this.doors=new Map();this.approaches=new Map();this.projected=false;this.anim=null;this.animationSerial=0;this.previewTarget=null;this.arrivalId=null;this.projectionVersion=0;
  this.hint=document.getElementById('routeHint');
  this.debug=new URLSearchParams(location.search).has('debugRoutes');
  this.geometryDebug=new URLSearchParams(location.search).has('debugGeometry');
  this.sortedPathNodes=this.layout.nodes.slice().sort((a,b)=>(a.pathIndex||0)-(b.pathIndex||0));
  this.resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>{this.projected=false;this.render();}):null;
  this.resizeObserver?.observe(board);this.resizeObserver?.observe(frame);
  window.addEventListener('resize',()=>{this.projected=false;this.render();},{passive:true});
 }
 invalidate(){this.projected=false;this.render();}
 setState(game){
  if(this.game&&this.game!==game){
   this.animationSerial++;
   if(this.anim){cancelAnimationFrame(this.anim.raf||0);this.anim.done(false);this.anim=null;}
   this.previewTarget=null;this.arrivalId=null;this.projected=false;
  }
  this.game=game;this.render();
 }
 preview(target,game=this.game){
  if(!game?.isClassic||!this.layout.venues[target]||!this.layout.venues[game.player.location])return;
  if(this.previewTarget===target)return;
  this.previewTarget=target;this.render();
 }
 clearPreview(){if(!this.previewTarget)return;this.previewTarget=null;if(this.hint)this.hint.hidden=true;this.render();}
 showArrival(place){if(!this.layout.venues[place])return;this.arrivalId=place;this.render();}
 clearArrival(){if(this.arrivalId===null)return;this.arrivalId=null;this.render();}
 cancel(){this.animationSerial++;if(this.anim){cancelAnimationFrame(this.anim.raf||0);const done=this.anim.done;this.anim=null;done(false);}this.render();}
 finishAnimation(){
  // Only completes an animation. Travel, clock changes, and hosting are handled
  // once by the authoritative game action before animate() is called.
  const anim=this.anim;if(!anim)return false;
  this.animationSerial++;cancelAnimationFrame(anim.raf||0);
  // Finish at the actual doorway even when the operator skips the animation.
  const finalPoint=typeof this.doorAnchor==='function'?this.doorAnchor(anim.to):anim.points.at(-1);
  this.anim=null;
  if(typeof anim.onStep==='function'&&finalPoint)anim.onStep(finalPoint);
  this.render();anim.done(true);return true;
 }
 project(){
  const parent=this.frame.getBoundingClientRect();if(!parent.width||!parent.height)return false;
  // Project one continuous road onto the *gutters* between the board's 5x5
  // storefront cells. Earlier releases projected each stop independently and
  // routed between them with L-shaped detours through the two garden gaps.
  const firstTile=this.board.querySelector('[data-travel]');
  if(this.projected&&this.firstTile===firstTile&&this.width===parent.width&&this.height===parent.height)return true;
  const tiles=new Map(Array.from(this.board.querySelectorAll('[data-travel]')).map(t=>[t.dataset.travel,t]));
  const rect=id=>tiles.get(id)?.getBoundingClientRect();
  const clinic=rect('clinic'),housing=rect('housing'),home=rect('home'),diner=rect('diner');
  const university=rect('university'),tech=rect('tech'),bank=rect('bank'),office=rect('office');
  if(![clinic,housing,home,diner,university,tech,bank,office].every(Boolean))return false;
  // Place the street on the visible storefront apron, not on the edge of
  // the central park. On this board every supplied storefront is front-facing:
  // its entrance is near the base of the illustration, just above its label.
  // The two side streets remain in the gutters, with a real sidewalk crossing
  // the frontage of each left/right shop to its painted doorway.
  const frontageY=id=>{
   const tile=tiles.get(id),r=tile?.getBoundingClientRect();
   if(!r)return 0;
   const caption=tile.querySelector('.tile-caption')?.getBoundingClientRect();
   const baseline=caption?caption.top-5:r.bottom-12;
   return baseline-parent.top;
  };
  const gutter={
   west:(clinic.right+housing.left)/2-parent.left,
   east:(university.right+tech.left)/2-parent.left,
   north:frontageY('home'),
   south:frontageY('agency')
  };
  const byCell=new Map((this.game?.places||[]).map(p=>[p.cell.join(','),p.id]));
  const centers=new Map(),doors=new Map(),approaches=new Map();
  for(const [i,node] of this.layout.nodes.entries()){
   const [cx,cy]=node.cell||RING[i];
   const place=byCell.get(`${cx},${cy}`),tile=tiles.get(place);
   // r12 is a historic crossing with no venue. It belongs on the exact
   // southwest junction instead of being interpolated through the Factory.
   if(node.id==='r12'){
    centers.set(node.id,{x:gutter.west,y:gutter.south});continue;
   }
   if(!tile)continue;
   const r=tile.getBoundingClientRect();
   const midX=r.left-parent.left+r.width*.5,midY=r.top-parent.top+r.height*.5;
   // Road centers are independent of artwork entrances (see artEntrance).
   // Storefront art never influences the public roadway or historical costs.
   const point=node.id==='r01'?{x:gutter.west,y:gutter.north}
     :node.id==='r05'?{x:gutter.east,y:gutter.north}
     :cy===1?{x:midX,y:gutter.north}
     :node.id==='r08'?{x:gutter.east,y:gutter.south}
     :node.id==='r11'?{x:gutter.west+12,y:gutter.south}
     :cy===5?{x:midX,y:gutter.south}
     :cx===5?{x:gutter.east,y:frontageY(place)}
     :{x:gutter.west,y:frontageY(place)};
   centers.set(node.id,point);
   // The town road and the front door are two different coordinates. Artwork
   // determines the latter; the historic stop/path index still determines cost.
   const venue=this.layout.venues[place]||{};
   const entrance=venue.geometry?.entrance||venue.artEntrance;
   if(place&&entrance){
    const img=tile.querySelector('.classic-scene');
    let x=r.left-parent.left+r.width*entrance[0],y=r.top-parent.top+r.height*entrance[1];
    if(img){
     const i=img.getBoundingClientRect();
     const naturalRatio=(img.naturalWidth||448)/(img.naturalHeight||256);
     const drawWidth=Math.min(i.width,i.height*naturalRatio),drawHeight=drawWidth/naturalRatio;
     x=i.left-parent.left+(i.width-drawWidth)/2+drawWidth*entrance[0];
     y=i.top-parent.top+(i.height-drawHeight)/2+drawHeight*entrance[1];
    }
    const caption=tile.querySelector('.tile-caption')?.getBoundingClientRect();
    // Keep entry rings above the floating label, even on a narrow fitted phone.
    if(caption)y=Math.min(y,caption.top-parent.top-5);
    const doorway={x,y};
    doors.set(place,doorway);
    if(Array.isArray(venue.geometry?.approach)&&venue.geometry.approach.length){
     const visual=[point,...venue.geometry.approach.map(([u,v])=>rectPoint(r,parent,u,v))];
     if(distance(visual.at(-1),doorway)>1)visual.push(doorway);
     approaches.set(place,compactLine(visual));
    }
   }
  }
  // Defensive interpolation if an optional visual crossing is not attached to
  // a venue. A missing painted tile must never corrupt the source route.
  for(let i=0;i<RING.length;i++){
   const id=this.layout.nodes[i].id;if(centers.has(id))continue;
   const before=centers.get(this.layout.nodes[(i+RING.length-1)%RING.length].id);
   const after=centers.get(this.layout.nodes[(i+1)%RING.length].id);
   if(before&&after)centers.set(id,linear(before,after,.5));
  }
  // If screen reflows before tiles have dimensions, keep the last good projection.
  if(centers.size!==this.layout.nodes.length)return false;
  this.nodes=centers;this.doors=doors;this.approaches=approaches;this.width=parent.width;this.height=parent.height;this.firstTile=firstTile;this.gutter=gutter;this.projected=true;this.projectionVersion++;return true;
 }

 edgeVisualPoints(from,to){
  const visual=this.layout.visualCurves||{};
  const forward=visual[`${from}>${to}`],backward=visual[`${to}>${from}`];
  const points=Array.isArray(forward)?forward:Array.isArray(backward)?backward.slice().reverse():null;
  return Array.isArray(points)&&points.length>1?points.map(([u,v])=>({x:u*this.width,y:v*this.height})):null;
 }
 edgePolyline(from,to){
  const a=this.nodes.get(from),b=this.nodes.get(to);
  if(!a||!b)return [];
  const geometry=this.edgeVisualPoints(from,to);if(geometry)return geometry;
  // The northern and southern turns are proper *junctions* on the common
  // gutter centerlines. There is no diagonal road through tree scenery.
  const pair=[from,to].sort().join('/');
  if(pair==='r01/r14')return [a,{x:this.gutter.west,y:this.gutter.north},b];
  if(pair==='r05/r06')return [a,{x:this.gutter.east,y:this.gutter.north},b];
  if(Math.abs(a.x-b.x)<.5||Math.abs(a.y-b.y)<.5)return [a,b];
  return [a,{x:b.x,y:a.y},b];
 }
 projectedWaypoint(index){
  // Find the two visual anchors surrounding an original marblePath index.
  // Interpolate along the EXISTING road polyline; never interpolate through shops.
  const nodes=this.sortedPathNodes,count=this.layout.originalRoute?.waypointCount||170;
  let from=nodes.at(-1),to=nodes[0];
  for(let i=0;i<nodes.length;i++){
   const a=nodes[i],b=nodes[(i+1)%nodes.length];
   if((index-a.pathIndex+count)%count <= (b.pathIndex-a.pathIndex+count)%count){from=a;to=b;break;}
  }
  const leg=this.edgePolyline(from.id,to.id);
  if(!leg.length)return null;
  const progress=(index-from.pathIndex+count)%count/((to.pathIndex-from.pathIndex+count)%count);
  return pathPointAt(leg,progress);
 }
 projectedRoad(from,to){
  // The historic waypoint path is projected onto the painted street;
  // a separate frontage connection links the public street and shop door.
  const plan=this.router.plan(from,to);
  if(this.layout.originalRoute)return plan.waypointIndices.map(i=>this.projectedWaypoint(i)).filter(Boolean);
  const points=[];
  for(let i=1;i<plan.ids.length;i++){
   const leg=this.edgePolyline(plan.ids[i-1],plan.ids[i]);
   points.push(...(i>1?leg.slice(1):leg));
  }
  return points.length?points:[this.nodes.get(plan.ids[0])].filter(Boolean);
 }
 projectedRoute(from,to){
  if(from===to)return [this.doorAnchor(from)].filter(Boolean);
  const road=this.projectedRoad(from,to);
  return [...this.doorWalk(from).slice().reverse(),...road.slice(1,-1),...this.doorWalk(to)].filter(Boolean);
 }
 roadLoop(){
  // A single loop path keeps the painted dotted centerline continuous at all
  // fourteen historical stops, including the tree-lined stretches.
  const nodes=this.layout.nodes,points=[];
  for(let i=0;i<nodes.length;i++){
   const edge=this.edgePolyline(nodes[i].id,nodes[(i+1)%nodes.length].id);
   points.push(...(i?edge.slice(1):edge));
  }
  return points;
 }
 roadAnchor(id){const entry=this.layout.venues[id];return entry?this.nodes.get(entry.stop):null;}
 doorAnchor(id){return this.doors.get(id)||this.roadAnchor(id);}
 anchor(id){return this.doorAnchor(id);}
 doorWalk(id){
  const approach=this.approaches.get(id);if(Array.isArray(approach)&&approach.length>1)return approach;
  const road=this.roadAnchor(id),door=this.doorAnchor(id);
  if(!road||!door||distance(road,door)<2)return [road].filter(Boolean);
  const place=this.game?.getPlace(id),[cx,cy]=place?.cell||[];
  // A paved apron runs horizontally along the front of each illustration.
  // The last short segment turns toward the actual door. No diagonals cross
  // buildings, and the two scenic gaps stay part of the continuous street.
  const corner={x:door.x,y:road.y};
  return [road,corner,door];
 }
 visibleDoorStep(id){
  // The last ~14px of each doorway approach acts as a visual threshold. A
  // longer line would cut horizontally across shop windows and painted walls.
  const walk=this.doorWalk(id),door=walk.at(-1),previous=walk.at(-2);
  if(!door||!previous)return [];
  const length=distance(previous,door);
  return length>.1?[linear(door,previous,Math.min(1,14/length)),door]:[];
 }
 render(){
  if(!this.game?.isClassic){this.svg.replaceChildren();this.svg.hidden=true;if(this.hint)this.hint.hidden=true;return;}
  this.svg.hidden=false;if(!this.project())return;
  this.svg.setAttribute('viewBox',`0 0 ${this.width} ${this.height}`);
  if(this.anim&&this.anim.projectionVersion!==this.projectionVersion){
   this.anim.points=this.projectedRoad(this.anim.from,this.anim.to);
   this.anim.departure=this.doorWalk(this.anim.from);
   this.anim.arrival=this.doorWalk(this.anim.to);
   const next=pawnJourneyFrame(this.anim.points,this.anim.departure,this.anim.arrival,this.anim.progress||0);
   this.anim.position=next.position;this.anim.opacity=next.opacity;
   this.anim.projectionVersion=this.projectionVersion;
  }
  const group=el('g');
  // Draw the actual graph edges, not an assumed array order. This supports
  // crossroads and new supplied art without accidentally inventing roads.
  const d=roundedPath(this.roadLoop(),10);
  group.append(el('path',{d,class:'route-road-back'}),el('path',{d,class:'route-road'}));
  // All thirteen footpaths are visible, so the town's street actually
  // passes the front of every house/shop rather than encircling an empty park.
  // These are purely visual; they do not create extra graph edges or time cost.
  const activeDoors=new Set([
   ...this.game.players.map(actor=>actor.location),
   this.previewTarget,this.arrivalId,this.anim?.from,this.anim?.to
  ].filter(Boolean));
  for(const [id] of Object.entries(this.layout.venues)){
   const road=this.roadAnchor(id),door=this.doorAnchor(id);
   if(!road||!door||distance(road,door)<3)continue;
   const path=roundedPath(this.doorWalk(id),3);
   if(path)group.append(el('path',{d:path,class:'route-door-walk','data-sidewalk-place':id}));
   group.append(el('circle',{cx:door.x,cy:door.y,r:activeDoors.has(id)?3.4:2.2,class:'route-door-step','data-door-place':id}));
  }
  const candidate=this.anim?this.projectedRoute(this.anim.from,this.anim.to):null;
  if(candidate){group.append(el('path',{d:roundedPath(candidate,7),class:'route-current'}));}
  if(this.previewTarget){
   const from=this.game.player.location,to=this.previewTarget,quote=this.game.travelQuote(from,to,this.game.player.hours);
   const preview=this.projectedRoute(from,to);
   if(from!==to&&preview.length>1){
    group.append(el('path',{d:roundedPath(preview,7),class:'route-preview'}));
    const end=this.doorAnchor(to);if(end)group.append(el('circle',{cx:end.x,cy:end.y,r:7,class:'route-preview-end'}));
   }
   if(this.hint){const name=this.game.getPlace(to)?.name||to;
    const title=document.createElement('strong');title.textContent=name;
    this.hint.replaceChildren(title,document.createTextNode(from===to?' · Current location':` · ${quote.hours} clock units (${quote.walkingHours} travel${quote.entryHours?` + ${quote.entryHours} Employment entry`:''}) · ${quote.steps} waypoints · DOS route estimate ${quote.estimatedTicks} ticks${quote.ok?'':` · Not enough time (${this.game.player.hours} left)`}`));
    this.hint.classList.toggle('route-hint-blocked',!quote.ok);this.hint.hidden=false;
   }
  }else if(this.hint)this.hint.hidden=true;
  if(this.geometryDebug){
   // Read-only authoring overlay. Access with ?debugGeometry; gameplay UI stays clean.
   const debugGroup=el('g',{'data-board-geometry-debug':'true'});
   for(const [edge,points] of Object.entries(this.layout.visualCurves||{})){
    points.forEach(([u,v],i)=>{
     const x=u*this.width,y=v*this.height;
     debugGroup.append(el('circle',{cx:x,cy:y,r:4.2,fill:'#13d6cd',stroke:'#152d36','stroke-width':1.5,'data-edge':edge,'data-point-index':i}));
     debugGroup.append(el('text',{x:x+6,y:y-6,fill:'#16303b','font-size':10,'font-weight':700},`${edge}:${i}`));
    });
   }
   for(const [venue,geometry] of Object.entries(this.layout.venues)){
    const point=this.doorAnchor(venue);
    if(point&&geometry.geometry?.approach){
     debugGroup.append(el('circle',{cx:point.x,cy:point.y,r:6,fill:'#ffa142',stroke:'#fff','stroke-width':2,'data-geometry-entrance':venue}));
    }
   }
   group.append(debugGroup);
  }
  if(this.debug){
   for(const n of this.layout.nodes){const p=this.nodes.get(n.id);group.append(el('circle',{cx:p.x,cy:p.y,r:6,class:'route-debug-node'}),el('text',{x:p.x+7,y:p.y-7,class:'route-debug-label'},n.id));}
   for(const [venue,entry] of Object.entries(this.layout.venues)){const p=this.anchor(venue);if(p)group.append(el('text',{x:p.x+7,y:p.y+14,class:'route-debug-label'},`${venue} [place ${entry.placeNum} · path ${entry.routeIndex}]`));}
  }
  if(this.arrivalId){
   const point=this.anchor(this.arrivalId);
   if(point){
    // The arrival is the existing road-stop anchor, not a second walkable tile.
    // Keep this SVG entrance sign outside of the building artwork so art
    // replacement cannot displace the pawn or change time calculations.
    const doorway=el('g',{class:'route-entry-marker','data-entry-place':this.arrivalId});
    doorway.append(
     el('circle',{cx:point.x,cy:point.y,r:23,class:'route-arrival-halo'}),
     el('circle',{cx:point.x,cy:point.y,r:16,class:'route-arrival-ring'}),
     el('rect',{x:point.x-7,y:point.y-9,width:14,height:19,rx:2,class:'route-entry-door'}),
     el('circle',{cx:point.x+4,cy:point.y+1,r:1.5,class:'route-entry-knob'})
    );
    doorway.append(el('title',{},`Entrance: ${this.game.getPlace(this.arrivalId)?.name||this.arrivalId}`));
    group.append(doorway);
   }
  }
  const positions=[];
  for(const actor of this.game.players){
   const a=this.anim?.actorId===actor.id?this.anim.position:this.anchor(actor.location);if(!a)continue;
   const color=ROLES[actor.id]||{color:actor.color||'#cbe2ee',letter:'•'};
   const overlapping=positions.filter(p=>distance(p,a)<12).length;
   const pos={x:a.x+overlapping*11,y:a.y-overlapping*13};positions.push(a);
   const opacity=this.anim?.actorId===actor.id?clamp(this.anim.opacity??1,0,1):1;
   const pawn=el('g',{class:'route-pawn-figure',opacity:opacity.toFixed(3),'data-pawn-actor':actor.id});
   pawn.append(el('circle',{cx:pos.x,cy:pos.y,r:14,class:'route-pawn-halo'}));
   pawn.append(el('circle',{cx:pos.x,cy:pos.y,r:10.5,class:'route-pawn',fill:color.color}));
   pawn.append(el('text',{x:pos.x,y:pos.y+3.5,'text-anchor':'middle',class:'route-pawn-text'},color.letter));
   group.append(pawn);
  }
  this.svg.replaceChildren(group);
 }
 animate(actorId,from,to,{duration=1050,onStep=null}={}){
  if(!this.game?.isClassic||from===to||!this.anchor(from)||!this.anchor(to))return Promise.resolve(true);
  this.cancel();this.clearArrival();
  const points=this.projectedRoad(from,to),serial=++this.animationSerial;
  if(reduced()||points.length<2){
   if(typeof onStep==='function')onStep(this.doorAnchor(to));
   this.render();return Promise.resolve(true);
  }
  return new Promise(resolve=>{
   const departure=this.doorWalk(from),arrival=this.doorWalk(to);
   const first=pawnJourneyFrame(points,departure,arrival,0);
   const anim={actorId,from,to,points,departure,arrival,position:first.position,opacity:first.opacity,
    progress:0,projectionVersion:this.projectionVersion,raf:0,onStep,done:resolve};this.anim=anim;
   const time=Math.max(800,Math.min(1550,duration));let begun=null;
   const step=now=>{
    if(serial!==this.animationSerial||this.anim!==anim)return;
    if(begun===null)begun=now;
    const t=clamp((now-begun)/time,0,1);
    // The pawn moves continuously through the visible pedestrian apron.
    anim.progress=t;
    const frame=pawnJourneyFrame(anim.points,anim.departure,anim.arrival,t);
    anim.position=frame.position;anim.opacity=frame.opacity;
    if(typeof onStep==='function'&&frame.position)onStep(frame.position);
    this.render();
    if(t<1)anim.raf=requestAnimationFrame(step);
    else{this.anim=null;this.render();resolve(true);}
   };
   anim.raf=requestAnimationFrame(step);
  });
 }
 describe(game){
  if(!game?.isClassic)return;
  const labels=game.players.map(p=>`${p.name} at ${game.getPlace(p.location)?.name||p.location}`);
  this.announce.textContent=labels.join(' · ');
 }
}
const api={RouteOverlay,RING,pathPointAt,distance,compactLine,roundedPath,doorwayTail,pawnJourneyFrame};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.LifeRouteOverlay=api;
})(typeof window!=='undefined'?window:globalThis);
