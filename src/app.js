(function(){
'use strict';
const D=window.LifeData;
const Game=window.LifeGame;
const Art=window.LifeArt;
const Characters=window.LifeCharacters;
// Feature switch remains OFF: editor, assets and compiler preserved but not exposed.
const ENABLE_CHARACTER_CUSTOMIZATION=false;
const SetupPrefs=window.LifeSetupPreferences;
const UX57=window.LifePass057;
const GoalPresets=window.LifeGoalPresets;
const I18n=window.LifeI18n;
const RulePresets=window.LifeRulePresets;
const SharedPortrait=window.LifeSharedPortraitUI;
const preferencesStorage=(()=>{try{return window.localStorage;}catch{return null;}})();
const characters=Characters.createStore((()=>{try{return window.localStorage;}catch{return null;}})());
const SAVE_KEY='the-life-loop-v1';
let game=new Game();let net;let toastTimer;
let chatChannel='social';
const social=new window.LooprdSocialSession.SocialSession({store:preferencesStorage,
 onChange:()=>chatRender(),
 onProfile:profile=>{try{window.LooprdSharedProfile.createStore(preferencesStorage).set(profile);}catch{}SharedPortrait.refreshProfilePortrait().then(()=>render()).catch(()=>{});}
});
window.LifeLoopSocial=social;let didShowWin=false;let classicEmployerFilter="";let showFutureJobApplications=false;
let mobileView='city';
let openDrawer=null;
let lastStoryFingerprint=null;
let unreadStory=0;
let venueInteraction={open:false,locationId:null,playerId:null,pending:false,lastMessage:""};
let venueFocusReturn=null;let pendingGuestVenue=null;let pendingGuestRoute=null;let routeTravelBusy=false;let routeOverlay=null;
const CLASSIC_BOARD_PREF='the-life-loop.classic-board-view.v1';
const ClassicJourney=window.LifeClassicJourney;
const ClassicBoardHud=window.LifeClassicBoardHud;
function setClassicJourney(phase,place='',quote=null){
 const indicator=$('classicJourneyStatus');
 const state=ClassicJourney.create(phase,place,quote);
 indicator.hidden=!game.isClassic||phase==='idle';
 indicator.dataset.phase=phase;indicator.textContent=state.message;
 $('classicTravelControls').hidden=!game.isClassic||phase!=='departing';
}
// Every phone session opens with the complete city visible. Explore is a temporary camera choice.
let classicBoardView='fit';
let classicBoardFocusTarget=null;
let classicBoardStartCentered=false;
let boardManualPan=false;
let boardPanOrigin=null;
const compactClassicBoard=()=>window.matchMedia('(max-width:720px)').matches;
function classicBoardFollowPawn(point){
 if(boardManualPan||!game.isClassic||classicBoardView!=='explore'||!compactClassicBoard()||!point)return;
 const viewport=$('boardViewport');
 const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
 viewport.scrollLeft=Math.max(0,Math.min(max,point.x-viewport.clientWidth/2));
}

function classicTurnCenterRender(online,ownTurn){
 const node=$('classicTurnCenter');
 node.hidden=!game.isClassic;
 $('classicBoardClock').hidden=!game.isClassic;
 if(!game.isClassic)return;
 const state=ClassicBoardHud.model(game,online,ownTurn);
 const key=`${state.id}/${state.week}`;
 if(node.dataset.turnKey!==key){
  node.dataset.turnKey=key;
  node.classList.remove('turn-changed');
  requestAnimationFrame(()=>node.classList.add('turn-changed'));
 }
 const localId=net?.role==='guest'?'friend':'player';
 const sharedAvatar=state.id===localId?SharedPortrait.getPortrait():null;
 $('classicTurnAvatar').innerHTML=sharedAvatar?`<img src="${sharedAvatar}" alt=""/>`:(state.id==='jones'?'😎':state.id==='friend'?'🧑‍🚀':'🧑‍🎨');
 $('classicTurnAvatar').style.setProperty('--turn-color',state.color);
 $('classicTurnKicker').textContent=state.ownerLabel;
 $('classicTurnName').textContent=state.name;
 $('classicTurnWeek').textContent=`WEEK ${state.week}`;
 $('classicTurnDial').setAttribute('aria-valuemax',String(state.max));
 $('classicTurnDial').setAttribute('aria-valuenow',String(state.remaining));
 $('classicTurnDial').setAttribute('aria-valuetext',state.accessibleLabel);
 $('classicDialFill').setAttribute('stroke-dasharray',`${state.percent} ${100-state.percent}`);
 $('classicDialHand').setAttribute('transform',`rotate(${state.degrees} 50 50)`);
 $('classicDialValue').textContent=String(state.remaining);
 $('classicDialWeek').textContent=`WEEK #${state.week}`;
 $('classicDialRemaining').textContent=`${state.remaining} / ${state.max} units`;
 // A venue covers the garden clock, so repeat its status in the venue header.
 // Both displays use this one authoritative view-model; only the game spends time.
 const venueDial=$('venueClock');
 venueDial.hidden=!venueInteraction.open;
 venueDial.setAttribute('aria-valuemax',String(state.max));
 venueDial.setAttribute('aria-valuenow',String(state.remaining));
 venueDial.setAttribute('aria-valuetext',state.accessibleLabel);
 venueDial.style.setProperty('--venue-clock-progress',`${state.percent}%`);
 $('venueClockValue').textContent=String(state.remaining);
 $('venueClockWeek').textContent=`WEEK ${state.week}`;
 $('venueClockRemaining').textContent=`${state.remaining} / ${state.max} units`;
}


// Prevent the next Classic hotseat player from seeing the previous player's
// balances or actions during a physical device handoff. Local-only; Online
// co-op has separate auth and must never use this privacy overlay.
const HotseatHandover=window.LifeClassicHotseatHandover;
function showClassicHandover(){
 const cover=$('classicHotseatHandover');
 $('classicHandoverTitle').textContent=`${game.player.name}'s turn`;
 // Overlay is independent of the game shell, and remains visible above
 // existing menus, notifications, and Social chat.
 cover.hidden=false;
 for(const id of ['chatPanel','overlay'])$(id).inert=true;
 document.querySelector('.shell').inert=true;
 $('classicHandoverContinue').focus();
}
function hideClassicHandover(){
 $('classicHotseatHandover').hidden=true;
 document.querySelector('.shell').inert=false;
 for(const id of ['chatPanel','overlay'])$(id).inert=false;
}
function classicBoardSync(){
 const classic=game.isClassic;
 $('classicBoardToolbar').hidden=!classic;
 if(!classic)$('classicJourneyStatus').hidden=true;
 const view=compactClassicBoard()?classicBoardView:'fit';
 document.body.dataset.classicBoardView=view;
 $('classicBoardFit').setAttribute('aria-pressed',String(view==='fit'));
 $('classicBoardExplore').setAttribute('aria-pressed',String(view==='explore'));
 if(!classic)return;
 for(const tile of $('board').querySelectorAll('[data-travel]'))tile.dataset.cameraFocus=String(view==='explore'&&tile.dataset.travel===classicBoardFocusTarget);
 const hint=$('classicBoardSelection');
 if(hint){hint.hidden=!(compactClassicBoard()&&view==='explore'&&classicBoardFocusTarget);if(!hint.hidden)hint.textContent=`${placeLabel(classicBoardFocusTarget)} · ${I18n.get()==='nl'?'Tik nogmaals om te bezoeken':'Tap again to visit'}`;}
 const jump=$('classicBoardJump');
 if(jump.options.length!==game.places.length+1){jump.innerHTML='<option value="">Find building…</option>'+game.places.map(loc=>`<option value="${esc(loc.id)}">${esc(placeLabel(loc.id))}</option>`).join('');}
}
function classicBoardFind(id,behavior='smooth'){
 const viewport=$('boardViewport'),tile=$('board').querySelector(`[data-travel="${id}"]`);
 if(!game.isClassic||!tile)return;
 const outer=viewport.getBoundingClientRect(),inner=tile.getBoundingClientRect();
 const left=Math.max(0,viewport.scrollLeft+(inner.left-outer.left)-(outer.width-inner.width)/2);
 viewport.scrollTo({left,behavior});
}
function classicBoardSetView(mode,{focusId=null}={}){
 if(!compactClassicBoard()||(mode!=='fit'&&mode!=='explore'))return;
 classicBoardView=mode;
 classicBoardFocusTarget=mode==='explore'?(focusId||null):null;
 boardManualPan=false;
 classicBoardSync();
 $('boardViewport').scrollLeft=0;
 routeOverlay?.invalidate?.();
 requestAnimationFrame(()=>{if(mode==='explore')classicBoardFind(focusId||game.player.location,'instant');routeOverlay?.invalidate?.();if(focusId)routeOverlay?.preview(focusId,game);});
}

const wideScreen=window.matchMedia('(min-width:1600px)');
const drawerScreen=window.matchMedia('(min-width:1025px) and (max-width:1599px)');
const panelVisible=which=>wideScreen.matches||(mobileBreakpoint.matches?mobileView==='life':openDrawer==='story');
function refreshBadges(){for(const id of ['storyBadge','mobileStoryBadge']){const badge=$(id);badge.hidden=!unreadStory;badge.textContent=String(Math.min(unreadStory,9));badge.setAttribute('aria-label',`${unreadStory} new story updates`);}}
function markViewed(which){if(which==='story'){unreadStory=0;refreshBadges();}}
function closeDrawer(){openDrawer=null;document.body.dataset.openDrawer='';$('drawerScrim').hidden=true;$('storyDrawerBtn').setAttribute('aria-expanded','false');}
function setDrawer(which){if(which!=='story'||!drawerScreen.matches)return;if(openDrawer===which){closeDrawer();return;}openDrawer='story';document.body.dataset.openDrawer='story';$('drawerScrim').hidden=false;$('storyDrawerBtn').setAttribute('aria-expanded','true');markViewed('story');}
function updateLayout(){closeDrawer();updateMobileAccessibility();if(wideScreen.matches)markViewed('story');}
function setUtilityMenu(open){if(open)setCoopMenu(false);$('utilityMenu').hidden=!open;$('utilityMenuBtn').setAttribute('aria-expanded',String(open));}
function setCoopMenu(open){if(open)setUtilityMenu(false);$('coopMenu').hidden=!open;$('onlineBtn').setAttribute('aria-expanded',String(open));}


const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>'$'+Math.floor(n).toLocaleString('en-US');
const percent=n=>Math.max(0,Math.min(100,Math.round(n)))+'%';
const place=id=>game.getPlace(id);
const mobileBreakpoint=window.matchMedia('(max-width:1024px)');
function setMobileView(view,{scroll=true}={}){
 if(!['city','life'].includes(view))return;
 mobileView=view;document.body.dataset.mobileView=view;
 for(const tab of document.querySelectorAll('[data-mobile-tab]')){
  const active=tab.dataset.mobileTab===view;
  tab.setAttribute('aria-pressed',String(active));
 }
 for(const [name,id] of [['city','gameCity'],['life','gameLife']]){
  $(id).inert=mobileBreakpoint.matches&&view!==name;
 }
 if(venueInteraction.open)updateVenueAccessibility();
 if(view==='life')markViewed('story');
 if(scroll&&mobileBreakpoint.matches)window.scrollTo({top:0,behavior:'instant'});
}
function updateMobileAccessibility(){setMobileView(mobileView,{scroll:false});}
const job=id=>game.getJob({job:id});
const eraMeta=()=>D.worldEras[game.settings.era];
const placeLabel=id=>game.isClassic?place(id)?.name||id:eraMeta().names[D.places.findIndex(p=>p.id===id)]||place(id)?.name||id;
const icon={arc:'📖',favor:'🤝',pulse:'✷',chat:'💬',work:'⚒',relax:'☀',freelance:'💸',cook:'🍳',apply:'✉',raise:'↗',groceries:'🥬',bulkFood:'🥕',lottery:'🎲',meal:'🍲',study:'📖',deposit:'↘',withdraw:'↗',invest:'📊',sell:'📉',upgrade:'🏠',rentDebt:'✓',buy:'🛍',movie:'🎬',pass:'🎉',checkup:'🩺',clothes:'👔',course:'📚',enroll:'📝',classicStudy:'🎓',classicFresh:'🥬',classicNewspaper:'📰',classicLottery:'🎟️',classicLoanApply:'🏦',classicLoanPay:'💵',classicBroker:'📊',classicBuyStock:'📈',classicSellStock:'📉',classicSellLegacy:'📤'};
function toast(msg,error=false){const el=$('toast');el.textContent=I18n.uiText(msg);el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3100);}
function store(){if(net?.role==='guest')return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.snapshot()));}catch(e){/* Local files may deny localStorage; manual export remains available. */}}
function restore(){try{const data=localStorage.getItem(SAVE_KEY);return data?JSON.parse(data):null;}catch(e){return null;}}
function updateVenueAccessibility(){
 const open=venueInteraction.open;
 for(const id of ['board','mobileNav'])$(id).inert=open;
 document.querySelector('.city-toolbar').inert=open;
 $('gameLife').inert=open||(mobileBreakpoint.matches&&mobileView!=='life');
}
function openVenue(locationId,{focus=true}={}){
 if(game.player.location!==locationId||game.winner||(net?.role&&!net.ownTurn()))return false;
 if(venueInteraction.locationId!==locationId){classicEmployerFilter='';showFutureJobApplications=false;}
 venueInteraction={open:true,locationId,playerId:game.player.id,pending:false,lastMessage:''};
 venueFocusReturn=Array.from($('board').querySelectorAll('[data-travel]')).find(b=>b.dataset.travel===locationId)||null;
 setMobileView('city',{scroll:false});closeDrawer();render();updateVenueAccessibility();
 if(focus)$('venueTitle').focus({preventScroll:true});
 return true;
}
function closeVenue({restoreFocus=true}={}){
 if(!venueInteraction.open)return;
 venueInteraction.open=false;venueInteraction.pending=false;venueInteraction.lastMessage='';
 $('venueLayer').hidden=true;updateVenueAccessibility();
 $('endTurnBtn').disabled=!!game.winner||(!!net?.role&&!net.ownTurn())||!!net?.busy||venueInteraction.pending;
 const target=Array.from($('board').querySelectorAll('[data-travel]')).find(b=>b.dataset.travel===venueInteraction.locationId);
 if(compactClassicBoard()&&game.isClassic)classicBoardSetView('fit');
 if(restoreFocus&&(target||venueFocusReturn)?.isConnected)(target||venueFocusReturn).focus({preventScroll:true});
}
function refreshVenueAfterAction(result){if(!venueInteraction.open)return;venueInteraction.lastMessage=result.message||'';if(result.ok&&net?.role==='guest'){closeVenue({restoreFocus:false});return;}render();}
function venueFocusTrap(e){
 if(!venueInteraction.open||$('overlay').classList.contains('open'))return;
 if(e.key!=='Tab')return;
 const enabled=Array.from($('venueLayer .venue-window').querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex="-1"]')).filter(el=>el.getClientRects().length);
 if(!enabled.length)return;
 const first=enabled[0],last=enabled.at(-1);
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}
function render(){
 const p=game.player,j=game.getJob(p),workplace=j?game.jobWorkplace(j):null,score=game.scores(p),classicStats=game.isClassic?game.classicGoalStats(p):null,current=place(p.location);
 if(venueInteraction.open&&(venueInteraction.locationId!==p.location||venueInteraction.playerId!==p.id||game.winner||(net?.role&&!net.ownTurn())))closeVenue({restoreFocus:false});
 const venueScroll=$('venueActions').scrollTop;
 const venueFocused=document.activeElement?.dataset?.act;
 const venueFocusedField=['classicEmployerFilter','careerShowAll'].includes(document.activeElement?.id)?document.activeElement.id:null;

 document.body.dataset.era=game.settings.era;
 document.body.dataset.ruleset=game.settings.ruleset;
 $('cityName').textContent=game.isClassic?'CLASSIC CITY':eraMeta().city.toUpperCase();
 $('topWeek').textContent='WEEK '+String(game.week).padStart(2,'0')+(game.isClassic?' · '+(p.classicChoicesThisWeek||0)+(game.settings.rules.weeklyActionLimit?'/10':'')+' ACTIONS':'');
 $('mobileWeek').textContent=String(game.week).padStart(2,'0');
 $('mobileHours').textContent=p.hours+'h';
 $('mobileCash').textContent=fmt(p.cash);
 $('mobilePlayer').textContent=p.name;
 $('economy').textContent=game.isClassic?`GOODS INDEX ${game.classicGoodsIndex} · ${game.classicGoodsIndex>105?'PRICES UP':game.classicGoodsIndex<95?'PRICES DOWN':'STABLE'}`:(game.economy>=1.06?'MARKET BOOMING':game.economy<=.94?'MARKET COOLING':'MARKET STABLE');
 
 const online=!!net?.role,ours=!online||net.ownTurn();
 const ourName=net?.role==='guest'?(game.players.find(x=>x.id==='friend')?.name||'Friend'):(game.players.find(x=>x.id==='player')?.name||'Host');
 const rivalName=net?.role==='guest'?(game.players.find(x=>x.id==='player')?.name||'Host'):(game.players.find(x=>x.id==='friend')?.name||'Friend');
 let turnTitle=online?(ours?'YOUR TURN':`${p.name.toUpperCase()}’S TURN`):(p.id==='player'?'YOUR TURN':`${p.name.toUpperCase()}’S TURN`);
 if(online&&!net.joined&&net.role==='host')turnTitle='WAITING FOR YOUR FRIEND TO JOIN';
 const roleLine=online?`${net.role==='host'?'Host':'Guest'} · ${net.joined?'2 players connected':'Waiting for friend'}`:'Local game';
 $('turnHeadline').textContent=turnTitle;$('turnDetails').textContent=roleLine;
 classicTurnCenterRender(online,ours);
 $('turnBanner').dataset.owner=ours?'self':'other';$('turnBanner').dataset.online=String(online);
 $('turnLamp').title=online?(net.socketOpen?'WebSocket connected':net.lastSyncAt?'HTTP fallback / retrying':'Waiting for Looprd'):'Local play';
 $('turnConnection').textContent=online?`${net.socketOpen?'● WS live':net.lastSyncAt?'○ HTTP fallback':'○ Connecting'} · Room ${net.code} ↗`:'◎ Start online co-op ↗';
 $('coopIndicator').hidden=!online;
 $('coopIndicator').dataset.live=String(!!net?.socketOpen);
 $('coopRoomTitle').textContent=online?`Room ${net.code}`:'No room connected';
 $('coopRoomState').textContent=online?`${net.role==='host'?'Hosting':'Joined as guest'} · ${net.joined?'2 players':'Waiting for friend'}`:'Start or join a room to play together.';
 $('coopTurnState').textContent=online?turnTitle:'Local game';
 $('coopTransport').textContent=online?(net.socketOpen?'● WSS live':net.lastSyncAt?'○ HTTP fallback — WSS offline':'○ Connecting to Looprd'):'No Looprd connection';

 if($('roomTurnText'))$('roomTurnText').textContent=net.ownTurn()?'YOUR TURN':`WAITING FOR ${game.player.name}`;
 if($('roomParticipants'))$('roomParticipants').textContent=`Current player: ${game.player.name} · You: ${net.role} · Remote: ${net.guestName||'Not named yet'} · ${net.joined?'2 joined':'1 joined'}`;
 if($('roomTransport'))$('roomTransport').textContent=`WebSocket: ${net.socketOpen?'Connected':'Not connected (HTTP polling fallback)'} · HTTP: ${net.lastSyncAt?'Last room response '+new Date(net.lastSyncAt).toLocaleTimeString():'Awaiting room response'}`;
 if($('roomVersion'))$('roomVersion').textContent=`Room version: ${net.version} · ${net.endpoint}`;
 if($('roomComponent'))$('roomComponent').textContent=`Component schema: ${net.infoStatus}`;
 
 $('profile').innerHTML=`<div class="profile-top"><div class="avatar" style="background:${esc(p.color)}">${p.id===(net?.role==='guest'?'friend':'player')&&SharedPortrait.getPortrait()?`<img class="shared-profile-avatar" src="${SharedPortrait.getPortrait()}" alt="Shared portrait"/>`:ENABLE_CHARACTER_CUSTOMIZATION&&p.appearance?Characters.avatar({...p.appearance,name:p.name},'sidebar'):(p.id==='jones'?'😎':p.id==='friend'?'🧑‍🚀':'🧑‍🎨')}</div><div><div class="profile-name">${esc(p.name)}</div><div class="profile-job">${j?`${esc(j.name)} · ${esc(workplace.label)} · ${fmt(p.wage)}/h`:'Unemployed · Apply at Career Center'}</div></div></div>${workplace?`<div class="workplace-hint">💼 Your workplace: <b>${esc(workplace.boardName)}</b>${workplace.department?` · ${esc(workplace.department)}`:''}</div>`:''}<div class="profile-mini"><span>📍 <b>${esc(placeLabel(current.id))}</b></span><span class="pill">${esc(game.isClassic?(p.home==='studio'?'Low-Cost Housing':'Le Security Apartments'):D.dwellings[p.home].name)}</span></div>`;
 $('balances').innerHTML=`<div class="stat-card"><div class="stat-label">CASH ON HAND</div><div class="stat-number">${fmt(p.cash)}</div><div class="stat-note">Ready to spend</div></div><div class="stat-card"><div class="stat-label">NET WORTH</div><div class="stat-number">${fmt(game.wealth(p))}</div><div class="stat-note">Including savings${p.rentDebt?' · debt':''}</div></div>`;
 const goalLabels={wealth:'💰 Wealth',happiness:'☀️ Happiness',education:'🎓 Education',career:'🚀 Career'};
 $('goals').innerHTML=(game.isClassic?`<div class="goal-budget">YOUR GOALS · ${game.goalPoints(p)} POINTS · ${game.progress(p)}%${p.isAI?' · '+esc(game.settings.jonesDifficulty.toUpperCase()):''}</div>`:'')+D.GOAL_KEYS.map(k=>`<div class="goal-item"><div class="goal-title"><strong>${goalLabels[k]}${game.isClassic?` · ${classicStats[k]}/${game.goalTargets(p)[k]}pt`:``}</strong><span class="goal-percent">${score[k]}%</span></div><div class="track" role="progressbar" aria-label="${k}" aria-valuenow="${score[k]}" aria-valuemin="0" aria-valuemax="100"><div style="width:${percent(score[k])}"></div></div></div>`).join('');
 const wellbeing=[{name:'Energy',value:p.energy,sub:p.energy+' / 100'},{name:'Happiness',value:p.happiness,sub:p.happiness+' / 100'},{name:'Reliability',value:p.dependability,sub:p.dependability+' / 100'}];
 $('wellbeing').innerHTML=wellbeing.map(v=>`<div class="wellness-row"><span>${esc(v.name)}</span><strong>${esc(v.sub)}</strong></div><div class="track small-track"><div style="width:${percent(v.value)}"></div></div>`).join('')+
 `<div class="wellness-row"><span>Experience</span><strong>${p.experience} XP</strong></div><div class="wellness-row"><span>Food for this week</span><strong>${p.fed?'FED':p.groceries>0?'PANTRY '+p.groceries:'NONE'}</strong></div><div class="wardrobe-status"><strong>👕 WARDROBE · WEEKS LEFT</strong>${game.clothingSummary(p).map(x=>`<span class="wardrobe-line ${x.weeks<=1?'wardrobe-low':''}">${esc(x.name)} <b>${x.weeks}w</b></span>`).join('')}</div><div class="wellness-row"><span>${game.isClassic?'Classic diplomas':'Certificates'}</span><strong>${game.isClassic?game.degreeCount(p)+' / '+D.classicDegrees.length:p.coursesCompleted.length+' / '+D.courses.length}</strong></div>${game.isClassic?`<div class="wellness-row"><span>University enrollments</span><strong>${p.classicEnrollmentCredits} unused · ${p.classicEnrolled.length}/4 active</strong></div>`:''}`;
 $('leaderboard').innerHTML=[...game.players].sort((a,b)=>game.progress(b)-game.progress(a)).map(x=>{
 const role=game.getJob(x)?.name||'Getting started';return `<div class="leader-entry ${x.id===p.id?'active':''}"><span class="leader-dot" style="background:${esc(x.color)}"></span><div class="leader-data"><div class="leader-name">${esc(x.name)}</div><div class="leader-role">${esc(role)}${game.isClassic?' · '+game.goalPoints(x)+' goal points':''}</div></div><strong class="leader-score">${game.progress(x)}%</strong></div>`;
 }).join('');
 classicBoardSync();
 $('board').innerHTML=game.places.map((loc,index)=>{
 const quote=game.travelQuote(p.location,loc.id,p.hours),cost=quote.hours,hasHuman=game.players.some(x=>!x.isAI&&x.location===loc.id),isWorkplace=workplace?.place===loc.id;
 const eventHere=!game.isClassic&&game.cityEvent.venue===loc.id;
 const rival=game.players.some(x=>x.isAI&&x.location===loc.id);
 return `<button type="button" class="board-tile ${p.location===loc.id?'selected':''} ${isWorkplace?'is-workplace':''} ${game.isClassic&&!quote.ok?'travel-unavailable':''}" ${net?.role&&(!net.ownTurn()||net.busy)?'disabled':''} data-travel="${loc.id}" style="grid-area:${loc.cell[1]}/${loc.cell[0]};background:${loc.color}4a" title="${isWorkplace?'YOUR WORKPLACE · ':''}Visit ${esc(placeLabel(loc.id))}${cost?' · '+cost+' clock units'+(quote.entryHours?' including '+quote.entryHours+' Employment entry':''):' · current location'}" aria-label="${esc(placeLabel(loc.id))}${isWorkplace?', your workplace':''}, ${cost?'travel '+cost+' clock units':'current location'}"><div class="tile-topline"><span class="tile-num">${String(index+1).padStart(2,'0')}</span>${game.isClassic?`<span class="travel-cost" aria-hidden="true">${cost?cost+'u':'HERE'}</span>`:''}${isWorkplace?`<span class="work-marker">${p.location===loc.id?'● YOU · WORK':'● WORK HERE'}</span>`:p.location===loc.id?'<span class="you-marker">● YOU</span>':eventHere?'<span class="pulse-marker">✷ EVENT</span>':hasHuman?'<span class="you-marker">● PLAYER</span>':rival?'<span class="you-marker">● RIVAL</span>':''}</div><div class="tile-art" aria-hidden="true">${Art.scene(loc.artId||loc.id,true,game.settings.era,game.isClassic?(loc.id==='clinic'?'apartment':'studio'):p.home,game.isClassic?loc.id:null)}</div><div class="tile-caption"><div class="tile-name">${esc(placeLabel(loc.id))}</div><div class="tile-tag">${esc(loc.tag)}</div></div></button>`;
 }).join('')+(game.isClassic
 ?`<div class="board-empty-scene board-empty-scene-left" aria-hidden="true"><span>🌳</span><small>TREE-LINED ROAD</small></div><div class="board-empty-scene board-empty-scene-right" aria-hidden="true"><span>🌳</span><small>TREE-LINED ROAD</small></div><div class="board-clock-garden" aria-hidden="true"><div class="garden-label"><strong>PUBLIC GARDEN</strong><small>Town center landmark</small></div></div><div class="hub"><div class="hub-decor">✳</div><div><div class="hub-flag"><span class="spark">✦</span> ${game.isClassic?'ORIGINAL CLASSIC CITY':esc(eraMeta().city.toUpperCase())} · ${game.isClassic?'CLASSIC RULES':'MODERN STORY'}</div><div class="hub-title">Make a life.<br/>Not just a living.</div><div class="hub-news">CITY RADIO · ${esc(game.bulletin)}</div></div><div class="hub-sketch" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div></div>`
 :`<div class="city-corner" aria-hidden="true"><span>🌳</span><small>PUBLIC GARDEN</small></div><div class="hub"><div class="hub-decor">✳</div><div><div class="hub-flag"><span class="spark">✦</span> ${game.isClassic?'ORIGINAL CLASSIC CITY':esc(eraMeta().city.toUpperCase())} · ${game.isClassic?'CLASSIC RULES':'MODERN STORY'}</div><div class="hub-title">Make a life.<br/>Not just a living.</div><div class="hub-news">CITY RADIO · ${esc(game.bulletin)}</div></div><div class="hub-sketch" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div></div>`);
 classicBoardSync(); // Apply focused-building marker after rebuilding the tiles.
 if(routeOverlay){routeOverlay.setState(game);routeOverlay.describe(game);}
 $('timeStrip').innerHTML=`<div class="hour-pips" aria-label="${p.hours} of ${game.rules.hours} weekly hours remaining">${Array.from({length:game.rules.hours/2},(_,i)=>`<span class="${i<p.hours/2?'remaining':''}"></span>`).join('')}</div><div class="time-remaining">${p.hours} / ${game.rules.hours} ${game.isClassic?'units':'h'}</div>`;
 $('cityPulse').hidden=game.isClassic;
 const event=game.cityEvent,prices=Object.entries(event.prices).map(([sector,mult])=>`${sector} ${Math.round((mult-1)*100)>0?'+':''}${Math.round((mult-1)*100)}%`),pay=event.wage!==1?`shift pay +${Math.round((event.wage-1)*100)}%`:'';
 const legacies=D.storyArcs.filter(a=>!game.isClassic&&game.cityProjects[a.id]).map(a=>`${a.title} · ${a.sector==='wage'?'+5% shift wages':a.sector==='food'?'−5% food':'−8% leisure'}`);
 $('cityPulse').innerHTML=`<div class="pulse-icon">✷</div><div class="pulse-story"><span class="pulse-kicker">CITY PULSE · WEEKS ${game.cityEventStart}–${game.cityEventStart+3}</span><strong>${esc(event.title)}</strong><p>${esc(event.description)}</p><div class="pulse-mods">${[...prices,pay].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')||'<span>No price changes</span>'}${legacies.map(x=>`<span class="legacy-tag">★ ${esc(x)}</span>`).join('')}</div></div><div class="pulse-call"><span>COMMUNITY OPPORTUNITY</span><b>${esc(event.opportunity.title)}</b><small>At ${esc(placeLabel(event.venue))} · ${event.opportunity.hours}h · ${p.cityParticipation?.[game.cityEventStart]?'Already joined':'Available this month'}</small></div>`;
 const symbols={good:'✦',info:'●',warn:'!',news:'☼',muted:'·',travel:'↗'};
 $('journal').innerHTML=game.messages.filter(m=>m.actor==='system'||m.actor===p.id||m.actor==='jones').slice(0,10).map(m=>`<div class="journal-line ${esc(m.type)}"><span class="journal-icon">${symbols[m.type]||'·'}</span><span class="journal-message">${esc(m.message)}</span><span class="journal-week">W${m.week}</span></div>`).join('');
 const idx=game.places.indexOf(current)+1;
 const citizen=D.citizens[current.id];
 const trust=game.relationship(p,current.id),relName=game.relationshipName(p,current.id),memory=p.memories?.[current.id],storyChoice=D.encounters[current.id].choices.find(c=>c.id===memory);
 const npcGreeting=memory?game.npcLine(current.id,p):citizen.greeting;
 const localArc=D.storyArcs.find(a=>a.host===current.id);
 const arcInfo=localArc?game.storyStatus(p,localArc):null;
 const relatedArcs=D.storyArcs.filter(a=>a.partner===current.id);
 const storyHelp=!game.isClassic&&localArc?`<div class="arc-progress"><b>📖 ${esc(localArc.title)}</b><span>${arcInfo.chapter>=3?'Story complete':`Chapter ${arcInfo.chapter+1}/3`}</span><small>${esc(arcInfo.chapter>=3?'A chapter of city history you helped write.':arcInfo.reason||'Next chapter is available in the activity list.')}</small></div>`:'';
 const links=(game.isClassic?[]:relatedArcs).filter(a=>(p.storyProgress?.[a.id]?.chapter||0)>0).map(a=>`<span class="story-partner">↗ ${esc(citizen.name)} is part of ${esc(a.title)}</span>`).join('');
 $('venueSummary').innerHTML=`<div class="venue-scene"><span class="venue-mini">${esc(current.tag)}</span>${Art.scene(current.artId||current.id,false,game.settings.era,game.isClassic?(current.id==='clinic'?'apartment':'studio'):p.home,game.isClassic?current.id:null)}</div><div class="venue-level"><h2>${esc(placeLabel(current.id))}</h2><span class="venue-no">${String(idx).padStart(2,'0')} / ${game.places.length}</span></div><p class="venue-blurb">${esc(current.blurb)}</p><div class="npc-card" ${game.isClassic?'hidden':''}><div class="npc-avatar">${Art.person(current.id,false,game.settings.era)}</div><div class="npc-copy"><div class="npc-label">MEET THE LOCALS ${p.talkedWeek?.[current.id]===game.week?'· SPOKEN THIS WEEK':''}</div><strong>${esc(citizen.name)}</strong><span>${esc(citizen.title)}</span><p>“${esc(npcGreeting)}”</p></div></div><div class="friendship" ${game.isClassic?'hidden':''}><div class="friend-head"><span>♥ ${esc(relName)}</span><span>${trust} / 100 trust</span></div><div class="friend-track"><div style="width:${trust}%"></div></div><small>${storyChoice?'Remembers: '+esc(storyChoice.label):'Get to know '+esc(citizen.name)+' by talking each week.'}${trust<18?' · Favors unlock at 18 trust.':' · Friendship favors available every four weeks.'}</small></div>${storyHelp}${links}`;
 const allActions=game.actions();
 const classicEmployment=game.isClassic&&p.location==='agency';
 if(classicEmployment&&(!classicEmployerFilter||!game.jobs.some(j=>j.employer===classicEmployerFilter))){
  const eligible=game.jobs.find(j=>game.jobReasons(p,j).length===0);
  classicEmployerFilter=eligible?.employer||game.jobs[0]?.employer||'all';
 }
 const employers=classicEmployment?[...new Set(game.jobs.map(j=>j.employer))]:[];
 const jobApplications=allActions.filter(a=>a.id.startsWith('apply:'));
 const qualified=jobApplications.filter(a=>game.jobReasons(p,a.req).length===0);
 const actions=allActions.filter(a=>{
   if(!a.id.startsWith('apply:'))return true;
   if(classicEmployment&&classicEmployerFilter!=='all'&&a.req?.employer!==classicEmployerFilter)return false;
   return showFutureJobApplications||game.jobReasons(p,a.req).length===0;
 });
 const filterHtml=p.location==='agency'?`<div class="agency-hiring-panel"><strong>${qualified.length} positions match your qualifications</strong><small>${jobApplications.length-qualified.length} other positions in the career roadmap. Qualifications don't guarantee an opening.</small><label class="agency-expand"><input id="careerShowAll" type="checkbox" ${showFutureJobApplications?'checked':''}/> Show future jobs and missing requirements</label>${classicEmployment?`<label class="agency-filter"><span>APPLY AT EMPLOYER</span><select id="classicEmployerFilter" aria-label="Choose an employer"><option value="all" ${classicEmployerFilter==='all'?'selected':''}>All employers · Overview</option>${employers.map(e=>`<option value="${esc(e)}" ${e===classicEmployerFilter?'selected':''}>${esc(game.jobWorkplace(game.jobs.find(j=>j.employer===e)).label)} (${esc(e)} in Classic) · ${game.jobs.filter(j=>j.employer===e&&!game.jobReasons(p,j).length).length} eligible</option>`).join('')}</select></label><small>Choose a workplace to see its jobs. Qualified roles are shown first; future positions are optional.</small>`:''}</div>`:'';
 // Fixed mobile shortcut for the real work action; eligibility remains engine-owned.
 const workAction=allActions.find(a=>a.id==='work');
 const workShortcut=$('venueWork');
 workShortcut.hidden=!venueInteraction.open||!workAction;
 workShortcut.disabled=!workAction?.enabled||!ours||!!net?.busy||venueInteraction.pending;
 workShortcut.title=workAction?(workAction.enabled?workAction.detail:workAction.reason):'';
 $('actionsCount').textContent=actions.filter(a=>a.enabled).length+' available';
 $('venueActions').innerHTML=venueInteraction.open?(filterHtml+(actions.length?actions.map((a,i)=>{
   const header=game.isClassic&&['market','cinema'].includes(p.location)&&(i===0||actions[i-1].department!==a.department)?`<div class="venue-dept-heading"><span>${esc(a.department)}</span><small>${a.department==='Z-Mart Discount'?'Rotating discount stock · '+game.week:'Groceries, newspaper & lottery'}</small></div>`:'';
   const base=a.id.split(':')[0];const prominent=a.id==='work'||a.id==='study';return `${header}<button type="button" class="action-card ${prominent?'primary':''} ${a.special?'special-'+a.special:''}" data-act="${esc(a.id)}" ${a.enabled&&(!net?.role||net.ownTurn())&&!net?.busy&&!venueInteraction.pending?'':'disabled'} title="${esc(a.enabled?a.detail:a.reason)}"><span class="action-symbol">${icon[base]||'✦'}</span><span class="action-info"><span class="action-name">${esc(a.title)}</span><span class="action-desc" style="display:block">${esc(a.enabled?a.detail:a.reason)}</span></span><span class="action-meta">${a.hours?'⏱ '+a.hours+'h':''}${a.price?'<br/><span class="price">'+fmt(a.price)+'</span>':''}</span></button>`;
 }).join(''):'<div class="hint-box">Explore another building to discover things to do.</div>')):'';
 $('venueTitle').textContent=placeLabel(current.id);
 $('venueDescription').textContent=current.blurb;
 const feedback=$('venueFeedback'); feedback.textContent=venueInteraction.lastMessage;
 $('venueLayer').hidden=!venueInteraction.open;
 if(venueInteraction.open){$('venueActions').scrollTop=venueScroll;if(venueFocused){const focusItem=Array.from($('venueActions').querySelectorAll('[data-act]')).find(b=>b.dataset.act===venueFocused);if(focusItem&&!focusItem.disabled)focusItem.focus({preventScroll:true});}else if(venueFocusedField&&$(venueFocusedField))$(venueFocusedField).focus({preventScroll:true});}

 $('onlineBtn').title=net?.indicator()||'Co-op';
 const visibleMessages=game.messages.filter(m=>m.actor==='system'||m.actor===p.id||m.actor==='jones');
 const storyFingerprint=JSON.stringify([p.id,game.week,...visibleMessages.slice(-6).map(m=>[m.actor,m.message,m.week])]);
 if(lastStoryFingerprint!==null&&storyFingerprint!==lastStoryFingerprint&&!panelVisible('story'))unreadStory=Math.min(9,unreadStory+1);
 lastStoryFingerprint=storyFingerprint;
 if(panelVisible('story'))unreadStory=0;
 refreshBadges();
 $('endTurnBtn').disabled=routeTravelBusy||venueInteraction.open||!!game.winner||(!!net?.role&&!net.ownTurn())||!!net?.busy||venueInteraction.pending;
 $('endTurnBtn').querySelector('span:first-child').textContent=game.winner?'Game complete':net?.role&&!net.ownTurn()?'Waiting for friend':'End week';
 if(game.winner&&!didShowWin){closeVenue({restoreFocus:false});didShowWin=true;showWinner();}
 if(game.pendingEncounter&&(!net?.role||net.ownTurn())&&$('overlay').dataset.kind!=='encounter')showEncounter();
 chatRender();
 I18n.apply(); // The entire live board/venue is reconstructed each render.
}
function chatRender(){
 const panel=$('chatPanel'),toggle=$('chatToggle');
 const roomLive=net?.canChat()||false;
 toggle.disabled=false;toggle.setAttribute('aria-expanded',String(!panel.hidden));
 const unread=social.unread+(net?.chatUnread||0);
 const badge=$('chatBadge');badge.hidden=!unread;badge.textContent=String(Math.min(99,unread));
 $('chatSocialTab').setAttribute('aria-pressed',String(chatChannel==='social'));
 $('chatRoomTab').setAttribute('aria-pressed',String(chatChannel==='room'));
 $('chatSocialConnectForm').hidden=chatChannel!=='social'||social.connected;
 $('chatSocialConnected').hidden=chatChannel!=='social'||!social.connected;
 $('chatForm').hidden=chatChannel==='social'?!social.connected:!roomLive;
 $('chatInput').placeholder=chatChannel==='social'?'Message the social lobby…':'Message your co-op partner…';
 $('chatHeadingStatus').textContent=chatChannel==='social'?'SOCIAL · SHARED LOBBY':'ROOM · PRIVATE';
 $('chatSocialIdentity').textContent=social.connected?`${social.profile?.displayName||'Profile'} · ${social.status}`:'';
 $('chatStatus').textContent=chatChannel==='social'?(social.connected?
  (social.error?`Looprd Social: ${social.error}`:'Looprd Social lobby · recent messages are stored on the Social server'):
  'Connect a Social profile above to chat across games. Your game continues offline.'):
  (roomLive?'Encrypted co-op room messages are not saved.':'Join a two-player co-op room with WebSocket access for private chat.');
 if(panel.hidden)return;
 const messages=$('chatMessages');
 if(chatChannel==='social'){
  const mine=social.profile?.profileId;
  messages.innerHTML=social.messages.map(m=>`<div class="chat-bubble ${m.authorId===mine?'mine':''}"><small>${esc(m.name)}</small><span>${esc(m.text)}</span></div>`).join('')||'<p class="chat-empty">Social chat will appear here when connected. No game-room invitation is needed.</p>';
 }else{
  messages.innerHTML=(net?.chatLines||[]).map(m=>`<div class="chat-bubble ${m.own?'mine':''}"><small>${esc(m.name)}</small><span>${esc(m.text)}</span></div>`).join('')||'<p class="chat-empty">Private messages appear here after both players connect to a co-op room.</p>';
 }
 messages.scrollTop=messages.scrollHeight;
}
function setChatOpen(open){
 $('chatPanel').hidden=!open;
 net.chatOpen=!!open&&chatChannel==='room';
 if(open&&chatChannel==='room')net.chatUnread=0;
 social.setActive(!!open&&chatChannel==='social');
 chatRender();
 if(open){if(chatChannel==='social'&&!social.connected){$('chatSocialOrigin').focus();}
  else if(!$('chatForm').hidden)$('chatInput').focus();}
}
function setChatChannel(channel){
 if(!['social','room'].includes(channel))return;
 chatChannel=channel;net.chatOpen=channel==='room'&&!$('chatPanel').hidden;
 if(net.chatOpen)net.chatUnread=0;
 social.setActive(channel==='social'&&!$('chatPanel').hidden);
 chatRender();
}
function onlineDialog(){
 const connected=!!net.role;
 const server=esc(net.endpoint?window.LifeOnline.serverBase(net.endpoint):window.LifeOnline.suggestedServer());
 const selectedProfile=ENABLE_CHARACTER_CUSTOMIZATION?characters.selected():null;
 showModal(`<section class="modal compact" aria-label="Online co-op"><div class="modal-head"><div><span class="eyebrow dark">PLAY TOGETHER FROM ANYWHERE</span><h2>Online co-op</h2></div><button class="modal-close" data-close aria-label="Close">×</button></div>
 ${connected?`<p class="modal-lead"><strong>${esc(net.role==='host'?'You are hosting':'You are connected as guest')}</strong> · Game code <strong class="code-value">${esc(net.code)}</strong><br/>${esc(net.notice)} · ${net.joined?'Two players joined the room':'Waiting for a friend'}</p><div class="room-diagnostics" id="roomDiagnostics"><strong>Room status — <span id="roomTurnText">${net.ownTurn()?'YOUR TURN':`WAITING FOR ${esc(game.player.name)}`}</span></strong><span id="roomParticipants">Current player: ${esc(game.player.name)} · You: ${esc(net.role)} · Remote: ${esc(net.guestName||'Not named yet')}</span><span id="roomVersion">Looprd API: ${esc(net.endpoint)} · Room version: ${net.version}</span><span id="roomTransport">WebSocket: ${net.socketOpen?'Connected':'Not connected (HTTP polling fallback)'} · HTTP: ${net.lastSyncAt?'Last room response '+new Date(net.lastSyncAt).toLocaleTimeString():'Awaiting room response'}</span><span id="roomComponent">Component schema: ${esc(net.infoStatus)}</span><button type="button" class="modal-secondary" id="checkLooprd">Check Looprd component API</button></div><div class="online-controls"><button class="modal-secondary" id="copyInvite">Copy invitation link</button><button class="modal-secondary" id="disconnectOnline">Disconnect</button></div>`:
 `<p class="modal-lead">To host, choose <b>New Game → Online with a friend</b>. To join, enter the friend's code and Looprd server FQDN below.</p><form id="joinOnlineForm"><label class="field-label">LOOPRD SERVER FQDN<input class="form-input" name="url" type="text" required autocomplete="url" placeholder="api.server.country" value="${server}" /><small>Use your API server address only; /looprd/the-life-loop/v1 is added automatically.</small></label><label class="field-label">FRIEND CODE<input class="form-input" name="code" id="inviteCode" maxlength="15" autocomplete="off" placeholder="ABCD234567" required value="${esc(new URLSearchParams(location.search).get('join')||'')}" /></label>${ENABLE_CHARACTER_CUSTOMIZATION?`<label class="field-label">YOUR LOCAL CHARACTER<select class="form-select" id="joinCharacterPick">${profileOptions(selectedProfile?.id||'')}</select></label>`:''}<label class="field-label">YOUR DISPLAY NAME<input class="form-input" name="name" maxlength="24" value="${esc(selectedProfile?.name||SharedPortrait.saved()?.displayName||'Friend')}" required /></label><button class="modal-primary" type="submit">Join friend's game ↗</button></form>`}
 <p class="modal-footnote">Multiplayer requires an external Looprd server over HTTPS/WSS when hosted on GitHub Pages. Invitation links include the server address and game code, never participant tokens. Participant tokens are kept in your browser session. The host must remain connected for guest turns.</p></section>`);
 if(connected){
  $('checkLooprd').addEventListener('click',async()=>{const button=$('checkLooprd');button.disabled=true;try{const outcome=await net.probe();toast(outcome);}catch(e){toast('Looprd check failed: '+e.message,true);}finally{if($('overlay').classList.contains('open')&&$('overlay').querySelector('#roomDiagnostics'))onlineDialog();}});
  $('copyInvite').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(net.inviteLink());toast('Invite link copied');}catch(e){toast('Copy unavailable: '+e.message,true);}});
  $('disconnectOnline').addEventListener('click',()=>{net.disconnect();closeVenue({restoreFocus:false});closeOverlay();toast('Disconnected from multiplayer');});
 }else{
  if(ENABLE_CHARACTER_CUSTOMIZATION)$('joinCharacterPick').addEventListener('change',e=>{const p=characters.all().find(x=>x.id===e.target.value);if(p)$('joinOnlineForm').elements.name.value=p.name;});
  $('joinOnlineForm').addEventListener('submit',async e=>{
   e.preventDefault();const fd=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('[type=submit]');btn.disabled=true;
   try{await net.join(String(fd.get('url')),String(fd.get('code')),String(fd.get('name')),ENABLE_CHARACTER_CUSTOMIZATION?characters.all().find(p=>p.id===$('joinCharacterPick').value)||null:null);closeOverlay();toast('Connected to '+net.code+'!');}
   catch(err){toast('Cannot join: '+err.message,true);btn.disabled=false;}
  });
 }
}
function hint(p){
 if(!p.job)return 'Start with the Career Center. Even a small paycheck is a big first step.';
 if(p.hunger>0)return 'You missed some meals. Get groceries or eat at The Good Fork.';
 if(!game.isDressedFor(p,game.getJob(p)))return 'Your uniform is worn out. Buy more clothing at Fresh & Frugal or Thread Theory before working.';
 if(p.cash<65&&p.energy>14)return `Working at ${placeLabel(job(p.job).place)} can refill your wallet.`;
 if(p.energy<22)return 'Rest at home or visit the Wellbeing Clinic to recover energy.';
 if(p.rentDebt>0)return `You owe ${fmt(p.rentDebt)} in rent. Work income is partly garnished until it is paid.`;
 if(p.education<2)return 'Consider studying at Brightside U for better career opportunities.';
 if(p.clothing.casual<=1&&p.clothing.formal<=1&&p.clothing.business<=1)return 'Your clothes are nearly worn out; stock up at Fresh & Frugal or Thread Theory.';
 if(p.cash>500)return game.isClassic?'Bank deposits protect against theft, but earn no interest. Stocks and T-Bills are separate investments.':'Savings at '+placeLabel('bank')+' protect your cash and earn a little interest.';
 if(game.relationship(p,p.location)>=18&&game.actions().some(a=>a.id==='favor'&&a.enabled))return 'A local friend can lend a hand! Look for the friendship favor among your activities.';
 return game.isClassic?'Focus on employment, education, food and rent. Job applications can fail even when qualified.':'Visit the City Pulse opportunity before the month ends; events move every four weeks.';
}
function closeOverlay(){if(game.pendingEncounter&&$('overlay').dataset.kind==='encounter')return;$('overlay').classList.remove('open');$('overlay').dataset.kind='';$('overlay').innerHTML='';}
function showModal(html,kind='modal'){$('overlay').dataset.kind=kind;$('overlay').innerHTML=html;$('overlay').classList.add('open');I18n.apply();}
function confirmEmploymentSwitch(actionId){
 const p=game.player,oldJob=game.getJob(p),nextJob=job(actionId.split(':')[1]);
 if(!oldJob||!nextJob||oldJob.id===nextJob.id)return false;
 showModal(`<section class="modal compact" aria-label="Confirm job change"><div class="modal-head"><div><span class="eyebrow dark">ONE ACTIVE JOB AT A TIME</span><h2>Change employers?</h2></div><button class="modal-close" data-close aria-label="Cancel job change">×</button></div><p class="modal-lead">A successful application replaces your current position. If you are refused, you keep your existing job. You cannot work for both employers.</p><div class="employment-comparison"><div><small>CURRENT POSITION</small><strong>${esc(oldJob.name)}</strong><span>${esc(game.jobWorkplace(oldJob).label)} · ${fmt(p.wage)}/hour</span></div><div class="employment-switch-arrow">→</div><div><small>NEW POSITION</small><strong>${esc(nextJob.name)}</strong><span>${esc(game.jobWorkplace(nextJob).label)} · ${fmt(game.offeredWage(nextJob))}/hour</span></div></div><p class="modal-footnote">Applying costs ${game.isClassic?game.actions().find(a=>a.id===actionId)?.hours??game.rules.applicationHours:game.rules.applicationHours} clock units${game.isClassic&&p.hours<game.rules.applicationHours?' (four nominal, capped by the week-end clock)':''}. If the application succeeds, the new job replaces your old one. A rejection costs time but never cancels your existing job.</p><button class="modal-primary" id="confirmEmploymentBtn" type="button">Apply for new position</button><button class="modal-secondary" data-close type="button">Keep my current job</button></section>`);
 $('confirmEmploymentBtn').addEventListener('click',async()=>{
   const result=await net.execute('act',actionId,()=>game.act(actionId));
   closeOverlay();
   if(result.ok&&net.role!=='guest'){store();render();}
   toast(result.message,!result.ok);
 });
 $('confirmEmploymentBtn').focus();
 return true;
}
function showSmallTalk(message,placeId){
 const citizen=D.citizens[placeId];
 showModal(`<section class="modal compact story-modal"><div class="story-head"><div class="story-character">${Art.person(placeId,false,game.settings.era)}</div><div><span class="eyebrow dark">A MOMENT IN THE CITY</span><h2>A chat with ${esc(citizen.name)}</h2><div class="story-byline">${esc(citizen.title)}</div></div></div><p class="story-prose">${esc(message)}</p><button class="modal-primary" type="button" data-close>Back to the city ↗</button></section>`);
}
function showEncounter(){
 const encounter=game.encounter();if(!encounter)return;
 const placeId=game.pendingEncounter.placeId, citizen=D.citizens[placeId], p=game.player;
 const arc=D.storyArcs.find(a=>a.id===game.pendingEncounter.arcId);
 const arcLabel=arc?`${arc.title.toUpperCase()} · CHAPTER ${encounter.chapterIndex+1}/${encounter.chaptersTotal}`:`A NEW DAY CITY STORY · WEEK ${game.week}`;
 const footnote=arc?`Your decision changes trust with ${D.citizens[arc.host].name} and ${D.citizens[arc.partner].name}. Chapters unfold over multiple weeks. Some choices change the whole city.`:'Your choice is remembered by this resident. Getting involved builds trust; declining may reduce it.';
 showModal(`<section class="modal story-modal" aria-label="Conversation with ${esc(citizen.name)}"><div class="story-head"><div class="story-character">${Art.person(placeId,false,game.settings.era)}</div><div><span class="eyebrow dark">${esc(arcLabel)}</span><h2>${esc(encounter.title)}</h2><div class="story-byline">${esc(citizen.name)} · ${esc(citizen.title)}</div></div></div><p class="story-prose">“${esc(encounter.story)}”</p><p class="story-question">How do you respond?</p><div class="story-options">${encounter.choices.map(choice=>{const needed=Math.max(0,-(choice.effects.cash||0));const enabled=p.cash>=needed;return `<button type="button" class="story-choice" data-choose="${esc(choice.id)}" ${enabled?'':'disabled'}><span class="story-choice-name">${esc(choice.label)}</span><small>${esc(enabled?choice.detail:'Requires '+fmt(needed)+' cash')}</small><span class="story-chevron">↗</span></button>`;}).join('')}</div><div class="modal-footnote">${esc(footnote)}${encounter.cityBoost?' · City Pulse bonus: +3 experience, +2 happiness.':''}</div></section>`,'encounter');
 $('overlay').querySelector('[data-choose]:not(:disabled)')?.focus();
}
function profileOptions(selectedId='',allowQuick=true){
 const profiles=characters.all();
 return `${allowQuick?'<option value="">Quick name · not a saved character</option>':''}${profiles.map(p=>`<option value="${esc(p.id)}" ${p.id===selectedId?'selected':''}>${esc(p.name)} · ${esc(Characters.PERSONALITY[p.personality])}</option>`).join('')}`;
}
function profilePreview(profile){
 if(!profile)return `<div class="profile-preview profile-empty"><span class="preview-symbol">✦</span><div><strong>Your own story</strong><small>Use a quick name, or create a reusable character.</small></div></div>`;
 return `<div class="profile-preview">${Characters.avatar(profile,'preview')}<div class="profile-preview-copy"><strong>${esc(profile.name)}</strong><small>${esc(Characters.PERSONALITY[profile.personality])} · ${profile.portrait?'Illustrated portrait':esc(Characters.HAIR[profile.hair])+' · '+esc(Characters.OUTFIT[profile.outfit])}</small><div class="profile-preview-tags"><span>${esc(Characters.MOOD[profile.mood])}</span><span>${esc(profile.portrait?'Gallery look':Characters.ACCENT[profile.accent]?Characters.ACCENT[profile.accent].replace('#','').toUpperCase()+' accent':'Accent')}</span></div></div></div>`;
}
function showCharacterLibrary(returnTo='new'){
 const all=characters.all(),active=characters.selected();
 showModal(`<section class="modal characters-modal" aria-label="My saved characters"><div class="modal-head"><div><span class="eyebrow dark">YOUR PERSONAL CAST</span><h2>My characters</h2><p class="modal-lead">Make up to ${Characters.LIMIT} characters and reuse them in future games. Stored only in this browser, not in your Looprd account.</p></div><button class="modal-close" id="charactersDone" type="button" aria-label="Back">×</button></div>
 <div class="character-list">${all.length?all.map(p=>`<div class="character-row">${Characters.avatar(p,'list')}<div class="character-list-info"><strong>${esc(p.name)}</strong><small>${esc(Characters.PERSONALITY[p.personality])} · ${esc(Characters.OUTFIT[p.outfit])}${active?.id===p.id?' · SELECTED':''}</small></div><div class="character-row-controls"><button class="character-small" type="button" data-select-character="${esc(p.id)}">Use</button><button class="character-small" type="button" data-edit-character="${esc(p.id)}">Edit</button><button class="character-small danger" type="button" data-delete-character="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">Delete</button></div></div>`).join(''):'<p class="modal-lead">No saved characters yet. Create your first one below.</p>'}</div>
 <button id="addCharacterBtn" class="modal-primary" type="button" ${all.length>=Characters.LIMIT?'disabled':''}>+ Create character (${all.length}/${Characters.LIMIT})</button><button id="returnCharacterBtn" class="modal-secondary" type="button">Back to ${returnTo==='online'?'Online co-op':'New Game'}</button><p class="modal-footnote">Deleting a character does not delete game saves or remove someone already in an active game. Browser storage can be cleared independently by browser privacy settings.</p></section>`,'characters');
 const back=()=>returnTo==='online'?onlineDialog():newGameDialog();
 $('charactersDone').addEventListener('click',back);
 $('returnCharacterBtn').addEventListener('click',back);
 $('addCharacterBtn').addEventListener('click',()=>editCharacter(null,returnTo));
 $('overlay').querySelectorAll('[data-select-character]').forEach(b=>b.addEventListener('click',()=>{try{characters.choose(b.dataset.selectCharacter);back();}catch(e){toast(e.message,true);}}));
 $('overlay').querySelectorAll('[data-edit-character]').forEach(b=>b.addEventListener('click',()=>editCharacter(b.dataset.editCharacter,returnTo)));
 $('overlay').querySelectorAll('[data-delete-character]').forEach(b=>b.addEventListener('click',()=>{
  const p=characters.all().find(c=>c.id===b.dataset.deleteCharacter);
  if(p&&confirm(`Delete ${p.name} from this browser's character library? Saved games will not be deleted.`)){
   try{characters.remove(p.id);showCharacterLibrary(returnTo);}catch(e){toast(e.message,true);}
  }
 }));
}
function editCharacter(id=null,returnTo='new'){
 const found=characters.all().find(p=>p.id===id);
 const p=found||{name:'',...Characters.normalizeAppearance({portrait:'pixel'})};
 const title=v=>String(v).charAt(0).toUpperCase()+String(v).slice(1);
 const portraitPack=window.LifePortraitAssets?.portraits||{};
 const portraitKeys=Object.keys(portraitPack);
 const initialGroup=p.portrait?.startsWith('original-')?'original':p.portrait?.startsWith('illustrated-')?'illustrated':p.portrait==='pixel'?'pixel':'custom';
 const portraitList=(group)=>portraitKeys.filter(id=>portraitPack[id]?.collection===group).map(id=>`<button type="button" class="portrait-pick ${p.portrait===id?'is-selected':''}" data-field="portrait" data-value="${id}" aria-label="Select ${esc(portraitPack[id].label)}" aria-pressed="${p.portrait===id?'true':'false'}"><img src="${portraitPack[id].image}" loading="lazy" alt=""/><span>${group==='original'?'C':'I'}${id.slice(-2)}</span></button>`).join('');
 const choiceGroup=(name,titleLabel,options)=>`<section class="editor-section"><div class="section-heading"><span>${titleLabel.toUpperCase()}</span></div><input type="hidden" name="${name}" value="${esc(p[name])}" /> <div class="option-grid option-grid-choices">${Object.entries(options).map(([key,label])=>`<button type="button" class="option-chip ${p[name]===key?'is-selected':''}" data-field="${name}" data-value="${esc(key)}"><strong>${esc(label)}</strong>${name==='personality'?`<small>${esc({curious:'Always poking around for possibilities.',kind:'Supportive, warm and dependable.',bold:'Ready to jump into something new.',thoughtful:'Steady, reflective and careful.'}[key]||'')}`:''}${name==='outfit'?`<small>${esc({everyday:'Relaxed and practical.',smart:'Polished and put together.',sport:'Active and energetic.',creative:'Expressive and artsy.'}[key]||'')}`:''}</button>`).join('')}</div></section>`;
 const swatchGroup=(name,titleLabel,options,kind='swatch')=>`<section class="editor-section"><div class="section-heading"><span>${titleLabel.toUpperCase()}</span></div><input type="hidden" name="${name}" value="${esc(p[name])}" /><div class="option-grid ${kind==='swatch'?'option-grid-swatches':'option-grid-tiles'}">${Object.entries(options).map(([key,val])=>kind==='swatch'?`<button type="button" class="swatch-option ${p[name]===key?'is-selected':''}" data-field="${name}" data-value="${esc(key)}" aria-label="${esc(title(key))}" title="${esc(title(key))}"><span class="swatch-dot" style="--swatch:${esc(val)}"></span><span>${esc(title(key))}</span></button>`:`<button type="button" class="mini-tile ${p[name]===key?'is-selected':''}" data-field="${name}" data-value="${esc(key)}"><span class="mini-tile-icon" style="background:${esc(val)}"></span><strong>${esc(title(key))}</strong></button>`).join('')}</div></section>`;
 const summaryMarkup=v=>`<div class="editor-trait-pills"><span>${esc(Characters.PERSONALITY[v.personality])}</span><span>${v.portrait?esc(v.portrait==='pixel'?'Pixel Studio':v.portrait.startsWith('original-')?'Classic portrait':'Illustrated portrait'):esc(Characters.HAIR[v.hair])}</span><span>${esc(Characters.MOOD[v.mood])}</span></div>`;
 showModal(`<section class="modal characters-modal modern-character-modal" aria-label="${found?'Edit':'Create'} a character"><div class="modal-head"><div><span class="eyebrow dark">CHARACTER STUDIO</span><h2>${found?'Refine your character':'Create your character'}</h2><p class="modal-lead">A polished local avatar for your next story. Looks and personality only affect flavor and presentation — never balance.</p></div><button class="modal-close" id="cancelCharacter" type="button" aria-label="Back">×</button></div>
 <div class="character-workspace modern-workspace"><div class="character-preview-pane modern-preview-pane"><div class="character-stage-card"><div class="character-stage-top"><span class="eyebrow dark">LIVE PREVIEW</span><span class="character-stage-save">Stored locally</span></div><div id="editorAvatar" class="editor-avatar-stage">${Characters.avatar(p,'editor')}</div><div id="pixelPreviewDock" class="pixel-preview-dock" ${initialGroup==='pixel'?'':'hidden'}><canvas id="pixelCharacterPreview" width="32" height="40" aria-label="Animated pixel character preview"></canvas><div class="sprite-preview-controls"><button type="button" data-sprite-direction="north" aria-label="Face away">↑</button><button type="button" data-sprite-direction="west" aria-label="Face left">←</button><button type="button" data-sprite-direction="south" aria-label="Face front" class="is-active">↓</button><button type="button" data-sprite-direction="east" aria-label="Face right">→</button></div><button type="button" id="spriteActionToggle" class="character-small">▶ Walk</button></div><div class="character-name-block"><strong id="editorName">${esc(p.name||'Your character')}</strong><small id="editorSubtitle">${esc(Characters.PERSONALITY[p.personality])} · ${esc(Characters.OUTFIT[p.outfit])}</small></div><div id="editorSummary">${summaryMarkup(p)}</div></div><div class="character-preview-note">Tip: everything updates instantly while you style the portrait.</div></div>
 <form id="characterForm" class="character-form modern-character-form"><section class="editor-section hero"><label class="character-field"><span class="field-label">CHARACTER NAME</span><input class="form-input" type="text" name="name" maxlength="24" value="${esc(p.name)}" placeholder="Your character's name" required /></label></section>
 <section class="editor-section portrait-editor-section" aria-label="Choose portrait"><div class="section-heading"><span>CHOOSE YOUR LOOK</span><span class="muted micro">REAL ILLUSTRATED PORTRAITS</span></div><input type="hidden" name="portrait" value="${esc(p.portrait||'')}"/><div class="portrait-collection-tabs" role="group" aria-label="Portrait collection"><button type="button" data-portrait-tab="pixel" class="portrait-collection-tab ${initialGroup==='pixel'?'is-active':''}" aria-pressed="${initialGroup==='pixel'}">Pixel Studio</button><button type="button" data-portrait-tab="illustrated" class="portrait-collection-tab ${initialGroup==='illustrated'?'is-active':''}" aria-pressed="${initialGroup==='illustrated'}">Illustrated · 16</button><button type="button" data-portrait-tab="original" class="portrait-collection-tab ${initialGroup==='original'?'is-active':''}" aria-pressed="${initialGroup==='original'}">Classic · 35</button><button type="button" data-portrait-tab="custom" class="portrait-collection-tab ${initialGroup==='custom'?'is-active':''}" aria-pressed="${initialGroup==='custom'}">Custom drawn</button></div><div class="portrait-custom-help pixel-studio-intro" data-portrait-group="pixel" ${initialGroup==='pixel'?'':'hidden'}><strong>Build your character, part by part</strong><p>Body, hair, clothing and hats are compiled into a single animated sprite. Preview all four directions and export a PNG sprite sheet.</p><button type="button" class="option-chip is-selected" data-field="portrait" data-value="pixel" aria-pressed="${initialGroup==='pixel'}">Use dynamic pixel character</button></div><div class="portrait-collection-grid" data-portrait-group="illustrated" ${initialGroup==='illustrated'?'':'hidden'}>${portraitList('illustrated')}</div><div class="portrait-collection-grid" data-portrait-group="original" ${initialGroup==='original'?'':'hidden'}>${portraitList('original')}</div><div class="portrait-custom-help" data-portrait-group="custom" ${initialGroup==='custom'?'':'hidden'}><strong>Design a character from scratch</strong><p>Use the original drawn avatar with live-editable hairstyle, skin tone, clothing and colors.</p><button type="button" class="option-chip is-selected" data-field="portrait" data-value="" aria-pressed="${initialGroup==='custom'}">Use customizable portrait</button></div><p class="portrait-presets-note" id="portraitNote" ${initialGroup==='custom'?'hidden':''}>Gallery portraits are finished illustrations. To recolor hair, skin or clothes, choose <b>Custom drawn</b> instead.</p></section>
 <div id="editorFineTune" ${['custom','pixel'].includes(initialGroup)?'':'hidden'}><div id="pixelGeometryFields" ${initialGroup==='pixel'?'':'hidden'}><div class="editor-section-grid">${choiceGroup('body','Body shape',Object.fromEntries(Object.entries(LifeSprites.catalog.bodyTemplates).map(([k,v])=>[k,v.label])))}${choiceGroup('headwear','Headwear',{none:'None',cap:'Casual cap',beanie:'Beanie'})}</div></div><div class="editor-section-grid">${swatchGroup('skin','Skin tone',Characters.SKIN)}${choiceGroup('hair','Hair style',Characters.HAIR)}${swatchGroup('hairColor','Hair color',Characters.HAIR_COLOR)}${choiceGroup('outfit','Outfit',Characters.OUTFIT)}${swatchGroup('accent','Accent color',Characters.ACCENT,'tile')}${choiceGroup('mood','Expression',Characters.MOOD)}</div></div><div class="editor-section-grid">${choiceGroup('personality','Personality',Characters.PERSONALITY)}</div><div class="character-form-actions"><button id="spriteExportBtn" class="modal-secondary" type="button" ${initialGroup==='pixel'?'':'hidden'}>↓ Export sprite sheet</button><button class="modal-secondary" type="button" id="randomizeCharacter">↺ Mix it up</button><button class="modal-primary" type="submit">${found?'Save character':'Create & select'} ↗</button></div></form></div></section>`,'characters');
 $('cancelCharacter').addEventListener('click',()=>showCharacterLibrary(returnTo));
 const form=$('characterForm');
 const setSelected=(field,value)=>{const input=form.querySelector(`input[name="${field}"]`);if(input)input.value=value;$('overlay').querySelectorAll(`[data-field="${field}"]`).forEach(btn=>{const selected=btn.dataset.value===value;btn.classList.toggle('is-selected',selected);btn.setAttribute('aria-pressed',selected?'true':'false');});};
 const showGroup=(group)=>{$('overlay').querySelectorAll('[data-portrait-group]').forEach(el=>{el.hidden=el.dataset.portraitGroup!==group;});$('overlay').querySelectorAll('[data-portrait-tab]').forEach(b=>{const active=b.dataset.portraitTab===group;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',active?'true':'false');});};
 const spritePose={action:'idle',direction:'south'};
 const pixelConfig=()=>Object.fromEntries(new FormData(form));
 const previewCanvas=$('pixelCharacterPreview');
 LifeSprites.startPreview(previewCanvas,pixelConfig,()=>spritePose);
 const updateEditor=()=>{const v=pixelConfig(),pixel=v.portrait==='pixel',hasPreset=!!v.portrait&&!pixel;
 $('editorAvatar').innerHTML=Characters.avatar(v,'editor');$('editorAvatar').hidden=pixel;
 $('pixelPreviewDock').hidden=!pixel;$('pixelGeometryFields').hidden=!pixel;$('spriteExportBtn').hidden=!pixel;
 $('editorName').textContent=v.name||'Your character';
 $('editorSubtitle').textContent=pixel?'Live layered sprite · '+Characters.PERSONALITY[v.personality]:hasPreset?'Selected illustration · '+Characters.PERSONALITY[v.personality]:`${Characters.PERSONALITY[v.personality]} · ${Characters.OUTFIT[v.outfit]}`;
 $('editorSummary').innerHTML=summaryMarkup(v);$('editorFineTune').hidden=hasPreset;$('portraitNote').hidden=!hasPreset;
 };
 form.addEventListener('click',e=>{const tab=e.target.closest('[data-portrait-tab]');if(tab){e.preventDefault();const group=tab.dataset.portraitTab;showGroup(group);if(group==='custom')setSelected('portrait','');else if(group==='pixel')setSelected('portrait','pixel');else if(!form.elements.portrait.value.startsWith(group+'-'))setSelected('portrait',group==='illustrated'?'illustrated-01':'original-01');updateEditor();return;}const btn=e.target.closest('[data-field]');if(!btn)return;e.preventDefault();setSelected(btn.dataset.field,btn.dataset.value);updateEditor();});
 form.addEventListener('input',updateEditor);
 $('randomizeCharacter').addEventListener('click',()=>{const portrait=form.elements.portrait.value,group=portrait.startsWith('original-')?'original':portrait.startsWith('illustrated-')?'illustrated':p.portrait==='pixel'?'pixel':'custom';if(group==='custom'||group==='pixel'){const picks={body:Object.keys(LifeSprites.catalog.bodyTemplates),headwear:['none','cap','beanie'],skin:Object.keys(Characters.SKIN),hair:Object.keys(Characters.HAIR),hairColor:Object.keys(Characters.HAIR_COLOR),outfit:Object.keys(Characters.OUTFIT),accent:Object.keys(Characters.ACCENT),mood:Object.keys(Characters.MOOD)};for(const [field,list] of Object.entries(picks))setSelected(field,list[Math.floor(Math.random()*list.length)]);}else{const ids=portraitKeys.filter(id=>portraitPack[id]?.collection===group);if(ids.length)setSelected('portrait',ids[Math.floor(Math.random()*ids.length)]);}setSelected('personality',Object.keys(Characters.PERSONALITY)[Math.floor(Math.random()*Object.keys(Characters.PERSONALITY).length)]);updateEditor();});
 $('pixelPreviewDock').addEventListener('click',e=>{const btn=e.target.closest('[data-sprite-direction]');if(!btn)return;spritePose.direction=btn.dataset.spriteDirection;$('pixelPreviewDock').querySelectorAll('[data-sprite-direction]').forEach(x=>x.classList.toggle('is-active',x===btn));});
 $('spriteActionToggle').addEventListener('click',()=>{spritePose.action=spritePose.action==='idle'?'walk':'idle';$('spriteActionToggle').textContent=spritePose.action==='idle'?'▶ Walk':'■ Stand';});
 $('spriteExportBtn').addEventListener('click',()=>{try{const character=LifeSprites.compile(pixelConfig());if(!character.ok)throw Error(character.errors.join('; '));const canvas=LifeSprites.spriteSheet(character,document);const link=document.createElement('a');link.download='the-life-loop-character-sprites.png';link.href=canvas.toDataURL('image/png');link.click();toast('Sprite sheet exported.');}catch(err){toast('Sprite export failed: '+err.message,true);}});
 form.addEventListener('submit',e=>{e.preventDefault();try{
   const v=Object.fromEntries(new FormData(form));if(found)v.id=found.id;
   characters.upsert(v);showCharacterLibrary(returnTo);toast('Character saved locally.');
  }catch(err){toast(err.message,true);}});
 updateEditor();
}
function newGameDialog(isInitial=false){
 const saved=restore(),selectedProfile=ENABLE_CHARACTER_CUSTOMIZATION?characters.selected():null,pref=SetupPrefs.read(preferencesStorage);
 const sharedName=SharedPortrait.defaultName();
 const uiLanguage=UX57.savedLocale(preferencesStorage);
 const selected=(value,expected)=>value===expected?'selected':'';
 const checked=(value,expected)=>value===expected?'checked':'';
 const modeItems=[['solo','Solo vs. The Rival (AI)'],['hotseat','2 humans · same computer'],['online','Online co-op · friend code + Looprd'],['sandbox','Relaxed · Play alone']];
 showModal(`<section class="modal quick-start-modal" aria-label="Create a new game"><div class="modal-head"><div><span class="eyebrow dark">YOUR NEXT CHAPTER</span><h2>${saved?'Welcome back.':'Ready for your next life?'} <span style="color:#6ba86a">✳</span></h2><p class="modal-lead">Pick a name and game mode, then jump into the city. Your rules and goals are remembered.</p></div>${isInitial?'':'<button class="modal-close" data-close aria-label="Close">×</button>'}</div>
 <form id="startForm" class="quick-start-form"><div class="quick-start-body">
 ${ENABLE_CHARACTER_CUSTOMIZATION?`<section class="quick-character"><div class="section-heading"><span>PLAY AS</span><span class="muted micro">YOUR LOCAL CHARACTERS</span></div>
 <div class="quick-character-row"><label class="character-field"><span class="field-label">CHARACTER</span><select class="form-select" id="characterPick" name="characterId">${profileOptions(selectedProfile?.id||'')}</select></label><button type="button" class="character-small quick-manage" id="manageCharactersBtn">✎ Edit characters</button></div>
 <div id="characterPickPreview" class="quick-preview">${profilePreview(selectedProfile)}</div></section>`:''}
 <div class="new-form quick-identity"><label><span class="field-label">YOUR NAME</span><input class="form-input" name="name" maxlength="24" value="${esc(selectedProfile?.name||sharedName)}" required /></label>
 <label><span class="field-label">PLAY MODE</span><select class="form-select" id="gameMode" name="mode">${modeItems.map(([key,label])=>`<option value="${key}" ${selected(pref.mode,key)}>${label}</option>`).join('')}</select></label>
 <label class="campaign-select-field"><span class="field-label">CAMPAIGN · RULES &amp; EVENTS</span><select class="form-select" id="campaignPreset" name="campaignPreset"><option value="classic" ${selected(pref.ruleset==='classic'&&!RulePresets.customized(pref.ruleset,pref.rules)?'classic':'','classic')}>Classic Original · DOS-inspired</option><option value="custom" ${selected(pref.ruleset==='classic'&&RulePresets.customized(pref.ruleset,pref.rules)?'custom':'','custom')}>Custom Classic · house rules</option><option value="modern" ${selected(pref.ruleset,'modern')}>Modern Story · events and shops</option></select><small>Classic is the DOS-parity base; Custom Classic changes its house rules, not its shop catalogue.</small></label>
 <label id="friendField" style="display:${['hotseat','online'].includes(pref.mode)?'block':'none'};grid-column:1/-1"><span class="field-label">PLAYER 2 NAME</span><input class="form-input" name="friend" maxlength="24" value="Player 2" />${ENABLE_CHARACTER_CUSTOMIZATION?`<span class="field-label">PLAYER 2 LOCAL CHARACTER (OPTIONAL)</span><select class="form-select" id="friendCharacterPick" name="friendCharacterId">${profileOptions('')}</select>`:''}</label>
 <label id="onlineServerField" style="display:${pref.mode==='online'?'block':'none'};grid-column:1/-1"><span class="field-label">LOOPRD SERVER FQDN</span><input class="form-input" name="onlineServer" id="onlineServer" autocomplete="url" value="${esc(window.LifeOnline.suggestedServer())}" placeholder="api.server.country" ${pref.mode==='online'?'required':''}/><small>/looprd/the-life-loop/v1 is automatic. You get a room code after starting.</small></label></div>
 <details class="setup-advanced" id="setupAdvanced"><summary><span>⚙ Game settings <small>Rules · era · goals</small></span><strong id="setupPrefsSummary">${esc(SetupPrefs.summary(pref))}</strong></summary><div class="setup-advanced-body">
 <div class="new-settings-block" aria-label="Ruleset selection"><div class="section-heading"><span>GAME RULES</span><span class="muted micro">CHANGES GAMEPLAY</span></div><div class="setup-options setup-rules">
 <label class="setup-choice"><input type="radio" name="ruleset" value="classic" ${checked(pref.ruleset,'classic')}/><span class="setup-choice-text"><b>♟ Classic Rules</b><small>60-hour weeks · original-inspired careers and studies</small><em>Original parity is still in progress</em></span></label>
 <label class="setup-choice"><input type="radio" name="ruleset" value="modern" ${checked(pref.ruleset,'modern')}/><span class="setup-choice-text"><b>✦ Modern Story</b><small>40-hour weeks · friendships, city events</small><em>Existing game balance</em></span></label></div></div>
 <div class="new-settings-block" aria-label="House rules"><div class="section-heading"><span>HOUSE RULES</span><span class="muted micro" id="rulePresetLabel">${RulePresets.customized(pref.ruleset,pref.rules)?'CUSTOM':'DEFAULT'}</span></div>
 <p class="modal-lead" style="margin:0 0 10px">Start from the <strong id="houseRuleMode">${pref.ruleset==='classic'?'Classic':'Modern'}</strong> default. Any change creates a custom game using the same shops, events and careers as its base mode.</p>
 <label class="house-rule-toggle"><input type="checkbox" name="forcedReturnHome" ${pref.rules.forcedReturnHome?'checked':''}/><span><b>Return home when ending a week</b><small>Automatically travel back from any shop, even without enough time.</small></span></label>
 <label class="house-rule-toggle" id="carryReturnRule"><input type="checkbox" name="carryReturnOvertime" ${pref.rules.carryReturnOvertime?'checked':''}/><span><b>Deduct travel overtime next week</b><small>When the journey home costs more than the remaining clock, start the next week with fewer units.</small></span></label>
 <label class="house-rule-toggle"><input type="checkbox" name="foodSpoilage" ${pref.rules.foodSpoilage?'checked':''}/><span><b>Food expires without suitable storage</b><small>Unrefrigerated leftovers spoil at the weekly check; Classic food types remain a parity work item.</small></span></label>
 <label class="house-rule-toggle"><input type="checkbox" name="overdueRentPenalty" ${pref.rules.overdueRentPenalty?'checked':''}/><span><b>Unpaid rent reduces happiness</b><small>Disabling this removes the happiness penalty only. Rent still comes due and debt remains.</small></span></label>
 <label class="house-rule-toggle"><input type="checkbox" name="marketFluctuations" ${pref.rules.marketFluctuations?'checked':''}/><span><b>Markets change over time</b><small>Disabling this freezes weekly Classic price indices or Modern economy shifts; city stories continue.</small></span></label>
 <label class="house-rule-toggle" id="weeklyActionRule"><input type="checkbox" name="weeklyActionLimit" ${pref.rules.weeklyActionLimit?'checked':''}/><span><b>Restrict to ten venue actions per week</b><small>Optional older Life Loop restriction. Classic normally uses the 60-unit clock, with zero-time trades allowed after it runs out.</small></span></label>
 <button type="button" class="rule-default-button" id="restoreRulePreset">Restore this mode's default rules</button>
 </div>
 <div class="new-settings-block" aria-label="World era selection"><div class="section-heading"><span>WORLD ERA</span><span class="muted micro">VISUALS ONLY</span></div><div class="setup-options setup-eras">${Object.entries(D.worldEras).map(([key,era])=>`<label class="setup-choice era-option"><input type="radio" name="era" value="${key}" ${checked(pref.era,key)}/><span class="setup-era-art">${Art.scene('office',true,key)}</span><span class="setup-choice-text"><b>${esc(era.label)}</b><small>${esc(era.city)}</small></span></label>`).join('')}</div></div>
 <div class="classic-rival-settings" id="classicRivalSettings" style="display:${pref.ruleset==='classic'&&pref.mode!=='sandbox'?'block':'none'}"><label class="character-field"><span class="field-label">JONES DIFFICULTY · COMPUTER OPPONENT</span><select class="form-select" id="jonesDifficulty" name="jonesDifficulty"><option value="easy" ${selected(pref.jonesDifficulty,'easy')}>Take It Easy · Jones +40 goal points</option><option value="fair" ${selected(pref.jonesDifficulty,'fair')}>Play Fair · Equal goal points</option><option value="hard" ${selected(pref.jonesDifficulty,'hard')}>Go For Broke · Jones −40 goal points</option></select></label><small>Jones receives a separately distributed set of goals. More goal points means harder goals for Jones. Exact Sierra allocation is not yet verified.</small></div>
 <div class="new-settings-block" id="paceLanguageSettings"><div class="section-heading"><span id="pacingTitle">${UX57.t(uiLanguage,'Estimated match length')}</span><span id="paceHint" class="muted micro">${UX57.t(uiLanguage,'Longer matches use higher victory goals, not slower turns.')}</span></div>
 <div class="new-form"><label><span class="field-label" id="languageCaption">${UX57.t(uiLanguage,'Language').toUpperCase()}</span><select class="form-select" id="gameLanguage" name="gameLanguage"><option value="en" ${selected(uiLanguage,'en')}>English</option><option value="nl" ${selected(uiLanguage,'nl')}>Nederlands</option></select></label>
 <label><span class="field-label" id="paceCaption">${UX57.t(uiLanguage,'Match length').toUpperCase()}</span><select class="form-select" id="goalPreset" name="goalPreset"><option value="quick" ${selected(GoalPresets.detect(pref.goals),'quick')}>${UX57.t(uiLanguage,'Quick')} · 200</option><option value="standard" ${selected(GoalPresets.detect(pref.goals),'standard')}>${UX57.t(uiLanguage,'Standard')} · 260</option><option value="extended" ${selected(GoalPresets.detect(pref.goals),'extended')}>${UX57.t(uiLanguage,'Extended')} · 320</option><option value="custom" ${selected(GoalPresets.detect(pref.goals),'custom')}>${UX57.t(uiLanguage,'Custom')}</option></select></label></div></div>
 <div class="goal-settings"><div class="section-heading"><span id="goalsCaption">${UX57.t(uiLanguage,'Your life goals').toUpperCase()}</span><span class="muted micro">TOTAL <strong id="goalBudget">${D.GOAL_KEYS.reduce((n,k)=>n+pref.goals[k],0)}</strong> POINTS</span></div>${D.GOAL_KEYS.map(key=>`<label class="modal-goal"><span data-goal-caption="${key}">${({wealth:'💰',happiness:'☀️',education:'🎓',career:'🚀'}[key]||'')+' '+UX57.t(uiLanguage,({wealth:'Wealth',happiness:'Happiness',education:'Education',career:'Career'})[key])}</span><input type="range" class="range" name="${key}" min="10" max="100" step="5" value="${pref.goals[key]}" aria-label="${key} goal"/><strong data-range-value="${key}">${pref.goals[key]}%</strong></label>`).join('')}</div>
 <div class="setup-preference-footer"><span>Remembered automatically on this browser for future new games.</span><button type="button" id="resetGameSettings">↺ Reset defaults</button></div>
 </div></details></div><div class="quick-start-actions">${saved?`<button class="modal-primary" type="button" id="resumeBtn">▶ Continue game · Week ${Number(saved.week||1)}</button>`:''}<button class="${saved?'modal-secondary':'modal-primary'}" id="startNewGameBtn" type="submit">${saved?'＋ Start another game':'▶ Start new game'} ↗</button></div></form>
 </section>`);
 const form=$('startForm');
 form.dataset.lastRuleset=pref.ruleset;
 const currentPrefs=()=>SetupPrefs.sanitize({mode:form.elements.mode.value,ruleset:form.querySelector('input[name="ruleset"]:checked')?.value,era:form.querySelector('input[name="era"]:checked')?.value,jonesDifficulty:form.elements.jonesDifficulty.value,rules:Object.fromEntries(RulePresets.KEYS.map(key=>[key,form.elements[key].checked])),goals:Object.fromEntries(D.GOAL_KEYS.map(k=>[k,Number(form.elements[k].value)]))});
 // Campaign is a user-facing selection of the existing ruleset and house-rule
 // presets, NOT an extra ruleset persisted in a game save. Keep both controls
 // synchronized so retained ZipRunner campaigns and the advanced radio inputs
 // always describe the same game.
 const syncCampaignPreset=()=>{
   const selectedRules=form.querySelector('input[name="ruleset"]:checked')?.value||'classic';
   const flags=Object.fromEntries(RulePresets.KEYS.map(key=>[key,form.elements[key].checked]));
   const custom=RulePresets.customized(selectedRules,flags);
   const selector=$('campaignPreset');
   selector.value=selectedRules==='modern'?'modern':custom||selector.dataset.customRequested==='true'?'custom':'classic';
   if(selectedRules==='modern')delete selector.dataset.customRequested;
 };

 const updatePreferences=()=>{const value=SetupPrefs.write(preferencesStorage,currentPrefs());$('setupPrefsSummary').textContent=SetupPrefs.summary(value);$('rulePresetLabel').textContent=RulePresets.customized(value.ruleset,value.rules)?'CUSTOM':'DEFAULT';$('goalBudget').textContent=D.GOAL_KEYS.reduce((n,k)=>n+value.goals[k],0);syncCampaignPreset();};
 // Goal presets only update existing goal sliders, leaving gameplay clock and house rules unchanged.
 $('goalPreset').addEventListener('change',()=>{
   if($('goalPreset').value==='custom')return;
   const key=$('goalPreset').value;
   const values=GoalPresets.goals(key);
   for(const key of D.GOAL_KEYS){form.elements[key].value=values[key];form.querySelector(`[data-range-value="${key}"]`).textContent=values[key]+'%';}
   updatePreferences();
 });
 const updatePresetFromSliders=()=>{$('goalPreset').value=GoalPresets.detect(Object.fromEntries(D.GOAL_KEYS.map(k=>[k,Number(form.elements[k].value)])));};
 const applySetupLanguage=()=>{
   const language=I18n.set($('gameLanguage').value);
   $('languageSelect').value=language;
   document.documentElement.lang=language;
   $('languageCaption').textContent=UX57.t(language,'Language').toUpperCase();
   $('paceCaption').textContent=UX57.t(language,'Match length').toUpperCase();
   $('pacingTitle').textContent=UX57.t(language,'Estimated match length');
   $('paceHint').textContent=UX57.t(language,'Longer matches use higher victory goals, not slower turns.');
   $('goalsCaption').textContent=UX57.t(language,'Your life goals').toUpperCase();
   for(const [id,caption] of Object.entries({wealth:'Wealth',happiness:'Happiness',education:'Education',career:'Career'})){
     const goal=form.querySelector(`[data-goal-caption="${id}"]`);
     if(goal)goal.textContent=({wealth:'💰 ',happiness:'☀️ ',education:'🎓 ',career:'🚀 '})[id]+UX57.t(language,caption);
   }
   for(const [id,caption,points] of [['quick','Quick','200'],['standard','Standard','260'],['extended','Extended','320'],['custom','Custom','']]){
     const option=$('goalPreset').querySelector(`option[value="${id}"]`);
     option.textContent=UX57.t(language,caption)+(points?' · '+points:'');
   }
   render(); // Change presentation only; game/save state is untouched.
   I18n.apply();
 };
 $('gameLanguage').addEventListener('change',applySetupLanguage);
 form.addEventListener('input',e=>{if(e.target.type==='range')updatePresetFromSliders();});
 const updateMode=()=>{const base=form.querySelector('input[name="ruleset"]:checked')?.value||'classic';
  if(base!==form.dataset.lastRuleset){const rules=RulePresets.normalize(base);form.elements.forcedReturnHome.checked=rules.forcedReturnHome;form.elements.carryReturnOvertime.checked=rules.carryReturnOvertime;for(const key of RulePresets.KEYS.filter(k=>!['forcedReturnHome','carryReturnOvertime'].includes(k)))form.elements[key].checked=rules[key];form.dataset.lastRuleset=base;}
  form.elements.carryReturnOvertime.disabled=!form.elements.forcedReturnHome.checked;
  $('houseRuleMode').textContent=base==='classic'?'Classic':'Modern';
  $('weeklyActionRule').hidden=base!=='classic';
  const mode=$('gameMode').value;$('friendField').style.display=['hotseat','online'].includes(mode)?'block':'none';$('onlineServerField').style.display=mode==='online'?'block':'none';$('onlineServer').required=mode==='online';$('classicRivalSettings').style.display=form.querySelector('input[name="ruleset"]:checked')?.value==='classic'&&mode!=='sandbox'?'block':'none';};
 // A campaign switch intentionally resets house rules to that mode's base,
 // while preserving the player's independently selected goals, opponent level,
 // era, and multiplayer mode. Custom Classic opens the rule editor and keeps
 // Classic mechanics unless the operator explicitly changes a toggle.
 $('campaignPreset').addEventListener('change',()=>{
   const selector=$('campaignPreset');
   const choice=selector.value;
   const base=choice==='modern'?'modern':'classic';
   form.querySelector(`input[name="ruleset"][value="${base}"]`).checked=true;
   const defaults=RulePresets.normalize(base);
   for(const key of RulePresets.KEYS)form.elements[key].checked=defaults[key];
   form.dataset.lastRuleset=base;
   if(choice==='classic'){
     // Source-backed Classic Original starts with Sierra's default four 50-point goals.
     const goals=GoalPresets.goals('quick');
     for(const key of D.GOAL_KEYS){
       form.elements[key].value=goals[key];
       form.querySelector(`[data-range-value="${key}"]`).textContent=goals[key]+'%';
     }
     $('goalPreset').value='quick';
   }
   if(choice==='custom'){selector.dataset.customRequested='true';$('setupAdvanced').open=true;}
   else delete selector.dataset.customRequested;
   updateMode();updatePreferences();
 });
 if(ENABLE_CHARACTER_CUSTOMIZATION)$('manageCharactersBtn').addEventListener('click',()=>showCharacterLibrary('new'));
 if(ENABLE_CHARACTER_CUSTOMIZATION)$('characterPick').addEventListener('change',e=>{const p=characters.all().find(x=>x.id===e.target.value);$('characterPickPreview').innerHTML=profilePreview(p);if(p)form.elements.name.value=p.name;});
 if(ENABLE_CHARACTER_CUSTOMIZATION)$('friendCharacterPick').addEventListener('change',e=>{const p=characters.all().find(x=>x.id===e.target.value);if(p)form.elements.friend.value=p.name;});
 $('restoreRulePreset').addEventListener('click',()=>{const rules=RulePresets.normalize(form.querySelector('input[name="ruleset"]:checked')?.value);delete $('campaignPreset').dataset.customRequested;form.elements.forcedReturnHome.checked=rules.forcedReturnHome;form.elements.carryReturnOvertime.checked=rules.carryReturnOvertime;for(const key of RulePresets.KEYS.filter(k=>!['forcedReturnHome','carryReturnOvertime'].includes(k)))form.elements[key].checked=rules[key];updateMode();updatePreferences();});
 $('gameMode').addEventListener('change',updateMode);
 form.addEventListener('input',e=>{if(e.target.name==='ruleset')delete $('campaignPreset').dataset.customRequested;if(e.target.type==='range'){const el=form.querySelector(`[data-range-value="${e.target.name}"]`);if(el)el.textContent=e.target.value+'%';}if(e.target.matches('[name="mode"],[name="ruleset"],[name="era"],[name="jonesDifficulty"],[name="forcedReturnHome"],[name="carryReturnOvertime"],[name="foodSpoilage"],[name="overdueRentPenalty"],[name="marketFluctuations"],[name="weeklyActionLimit"],input[type="range"]')){updateMode();updatePreferences();}});
 form.addEventListener('change',e=>{if(e.target.name==='ruleset')delete $('campaignPreset').dataset.customRequested;if(e.target.matches('[name="mode"],[name="ruleset"],[name="era"],[name="jonesDifficulty"],[name="forcedReturnHome"],[name="carryReturnOvertime"],[name="foodSpoilage"],[name="overdueRentPenalty"],[name="marketFluctuations"],[name="weeklyActionLimit"],input[type="range"]')){updateMode();updatePreferences();}});
 $('resetGameSettings').addEventListener('click',()=>{const defaults=SetupPrefs.reset(preferencesStorage);delete $('campaignPreset').dataset.customRequested;$('goalPreset').value=GoalPresets.detect(defaults.goals);form.elements.mode.value=defaults.mode;form.elements.jonesDifficulty.value=defaults.jonesDifficulty;form.elements.forcedReturnHome.checked=defaults.rules.forcedReturnHome;form.elements.carryReturnOvertime.checked=defaults.rules.carryReturnOvertime;for(const key of RulePresets.KEYS.filter(k=>!['forcedReturnHome','carryReturnOvertime'].includes(k)))form.elements[key].checked=defaults.rules[key];form.dataset.lastRuleset=defaults.ruleset;form.querySelector(`input[name="ruleset"][value="${defaults.ruleset}"]`).checked=true;form.querySelector(`input[name="era"][value="${defaults.era}"]`).checked=true;for(const k of D.GOAL_KEYS){form.elements[k].value=defaults.goals[k];form.querySelector(`[data-range-value="${k}"]`).textContent=defaults.goals[k]+'%';}updateMode();updatePreferences();});
 form.addEventListener('submit',async e=>{e.preventDefault();
  if(saved&&!window.confirm('Start a new game? The current autosave will be replaced. You can export it first using Menu → Save game.'))return;
  if(!form.reportValidity())return;
  const f=new FormData(form),online=f.get('mode')==='online';
  updatePreferences();
  if(net.role)net.disconnect();
  game=new Game({name:String(f.get('name')),character:ENABLE_CHARACTER_CUSTOMIZATION?characters.all().find(p=>p.id===f.get('characterId'))||null:null,friendCharacter:ENABLE_CHARACTER_CUSTOMIZATION?characters.all().find(p=>p.id===f.get('friendCharacterId'))||null:null,mode:online?'hotseat':String(f.get('mode')),friend:String(f.get('friend')||''),ruleset:String(f.get('ruleset')||'classic'),era:String(f.get('era')||'current'),goals:Object.fromEntries(D.GOAL_KEYS.map(k=>[k,Number(f.get(k))])),jonesDifficulty:String(f.get('jonesDifficulty')||'fair'),rules:currentPrefs().rules});
  didShowWin=false;hideClassicHandover();closeVenue({restoreFocus:false});store();closeOverlay();render();
  if(online){try{await net.host(String(f.get('onlineServer')));onlineDialog();toast('Room created! Share '+net.code+' with your friend.');}catch(err){toast('Server did not create a room: '+err.message,true);newGameDialog();}}
  else toast('Welcome to '+(game.isClassic?'Classic City':eraMeta().city)+' · '+game.rules.name+'!');
 });
 if($('resumeBtn'))$('resumeBtn').addEventListener('click',()=>{try{game=Game.load(saved);didShowWin=!!game.winner;closeVenue({restoreFocus:false});closeOverlay();if(HotseatHandover.resumeRequired(game,Boolean(net.role)))showClassicHandover();render();toast('Welcome back!');}catch(e){toast('Saved game could not be loaded: '+e.message,true);}});
}
function guide(){showModal(`<section class="modal compact"><div class="modal-head"><div><span class="eyebrow dark">THE PLAYER'S FIELD GUIDE</span><h2>Make every week count.</h2></div><button class="modal-close" data-close aria-label="Close">×</button></div><p class="modal-lead">Like the classic 1990s life-board games, you race to reach four goals at the same time: wealth, happiness, education and career.</p><div class="guide-grid"><div class="guide-item"><b>🕰️ Rules & era</b>Selected rules: ${esc(game.rules.name)} · ${game.rules.hours} hours/week. World: ${esc(eraMeta().label)} (${esc(eraMeta().city)}). Historical and Sci-Fi change only the presentation.</div><div class="guide-item" ${game.isClassic?'hidden':''}><b>💬 Build friendships</b>Talk each week, make meaningful story choices, and earn trust. At 18 trust, each local offers a special favor every four weeks.</div><div class="guide-item" ${game.isClassic?'hidden':''}><b>📖 Follow seasonal stories</b>After meeting a resident, earn trust to unlock three-stage shared stories. Chapter choices affect two residents, and can permanently improve city prices or wages.</div><div class="guide-item"><b>▥ Track your finances</b>Open Finances to see net worth, recent transactions, monthly expenses and your milestones. Moving money between accounts is not income.</div><div class="guide-item" ${game.isClassic?'hidden':''}><b>✷ Follow the City Pulse</b>A new event every four weeks changes prices and wages. Visit its featured venue for a once-per-event opportunity.</div><div class="guide-item"><b>📍 Travel costs time</b>Click any building on the city board to visit it. Farther destinations cost more hours.</div><div class="guide-item"><b>💼 One active job</b>Get hired at Career Center, work only at your employer, and apply there again to change jobs. Switching replaces your old position; you cannot hold two regular jobs.</div><div class="guide-item"><b>🎓 Career pathways</b>Classic has 11 branching diplomas and original DOS occupations; Modern has four staged degrees and specialist certificates. Careers span retail, hospitality, technology, finance, and management.</div><div class="guide-item"><b>🥑 Food, rent, and energy</b>Eat each week, pay monthly rent, rest when tired, and keep an emergency fund. In Classic, visit the Rent Office (Open Door Realty in the current era) during week 4 and every fourth week thereafter to pay rent in cash. Black’s Market offers fresh food in 1/2/4-week bundles; refrigeration holds 6 portions, a freezer expands it to 12. The bank handles monthly loans and six markets with no savings interest.</div><div class="guide-item"><b>👔 Clothing expires</b>Start with 6 weeks of casual clothes. All clothing wears down once each week, even unused. Dress and business outfits cover lower job requirements. Cheap clothes last less time.</div><div class="guide-item"><b>🏁 Beat the competition</b>The Rival takes a turn each week. Meet all four personal goal targets before they do to win.</div></div><p class="modal-lead" style="margin:16px 0 0">${game.settings.rules.forcedReturnHome?'At the end of each week you return home. '+(game.settings.rules.carryReturnOvertime?'Any extra travel time is charged to the next week.':'Overtime is forgiven.'):'There is no forced return home in this game.'} Food spoilage, overdue-rent happiness penalties and market fluctuations are ${RulePresets.customized(game.settings.ruleset,game.settings.rules)?'customizable house rules':'enabled by default'}. Every turn represents a week of life with up to ${game.rules.hours} hours of discretionary time in ${game.isClassic?'Classic':'Modern Story'} rules. Any unused time expires on Sunday. Your game saves locally after each action.</p><button type="button" class="modal-primary" data-close>Got it, let's play ↗</button></section>`);}
function showWinner(){const p=game.players.find(x=>x.id===game.winner);if(!p)return;showModal(`<section class="modal compact winner-center"><div class="winner-art">🏆</div><span class="eyebrow dark">THE FINISH LINE</span><h2>${esc(p.name)} did it!</h2><p class="modal-lead">Four life goals achieved in ${game.week} weeks.<br/>The race was about money, joy, knowledge, and finding your place. What a ride.</p><button class="modal-primary" id="playAgainBtn" type="button">A new life awaits ↗</button><button class="modal-secondary" data-close>Look back at the city</button></section>`);$('playAgainBtn').addEventListener('click',()=>newGameDialog());}
function loadDialog(){showModal(`<section class="modal compact"><div class="modal-head"><div><span class="eyebrow dark">PICK UP WHERE YOU LEFT OFF</span><h2>Welcome back.</h2></div><button class="modal-close" data-close>×</button></div><p class="modal-lead">Restore your latest local autosave or import a saved game JSON file.</p><button class="modal-primary" id="loadLocal">Restore local autosave</button><button class="modal-secondary" id="loadFile">Import a .json file</button><p class="modal-footnote">Loading replaces the current game. Export a save first if you want to keep it.</p></section>`);
 $('loadLocal').addEventListener('click',()=>{try{const data=restore();if(!data)throw Error('No autosave found');game=Game.load(data);didShowWin=!!game.winner;closeVenue({restoreFocus:false});closeOverlay();if(HotseatHandover.resumeRequired(game,Boolean(net.role)))showClassicHandover();render();store();toast('Saved game restored.');}catch(e){toast(e.message,true);}});
 $('loadFile').addEventListener('click',()=>{$('filePicker').click();});}
function showFinances(){
 const p=game.player,f=game.finances(p),series=f.history;
 const wealth=series.map(x=>x.netWorth),cash=series.map(x=>x.cash),max=Math.max(500,...wealth,...cash),min=Math.min(0,...wealth,...cash),span=Math.max(1,max-min);
 const X=i=>50+(series.length<=1?0:i*600/(series.length-1)),Y=v=>210-(v-min)/span*165;
 const points=values=>values.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
 const axis=[0,.5,1].map(t=>{const y=210-t*165,value=min+(max-min)*t;return `<line x1="50" y1="${y}" x2="650" y2="${y}" stroke="#dce8db" stroke-dasharray="4 4"/><text x="43" y="${y+4}" fill="#6b806f" font-size="11" text-anchor="end">${esc(fmt(value))}</text>`;}).join('');
 const ticks=[0,Math.floor((series.length-1)/2),series.length-1].filter((x,i,a)=>a.indexOf(x)===i).map(i=>`<text x="${X(i)}" y="236" text-anchor="middle" font-size="11" fill="#59745d">W${series[i].week}</text>`).join('');
 const graph=`<svg class="finance-graph" viewBox="0 0 675 255" role="img" aria-label="Net worth and cash over the past ${series.length} recorded weeks"><title>Net worth and wallet cash</title>${axis}<polyline points="${points(wealth)}" fill="none" stroke="#2f7652" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${points(cash)}" fill="none" stroke="#b87f3f" stroke-width="3" stroke-dasharray="7 5" stroke-linecap="round" stroke-linejoin="round"/>${ticks}</svg>`;
 const entries=f.ledger.length?f.ledger.map(e=>`<tr><td>W${e.week}</td><td>${esc(e.detail)}</td><td>${esc(e.category)}</td><td class="money-change ${e.net<0?'negative':e.net>0?'positive':''}">${e.net===0?'Transfer':(e.net>0?'+':'−')+fmt(Math.abs(e.net))}</td></tr>`).join(''):'<tr><td colspan="4">No transactions yet. Take an action to start your history.</td></tr>';
 const milestones=f.milestones.length?f.milestones.map(m=>`<li><b>W${m.week}</b> ${esc(m.text)}</li>`).join(''):'<li>Your first milestone is still ahead.</li>';
 const paychecks=game.isClassic?`<div class="careers-wardrobe"><b>Classic paycheck ledger · last ${p.classicPaycheckHistory.length} shifts</b>${p.classicPaycheckHistory.length?p.classicPaycheckHistory.slice(-5).reverse().map(e=>`<span>W${e.week} · ${e.shiftUnits}/6 clock · ${fmt(e.gross)} gross − ${fmt(e.garnished)} rent − ${fmt(e.fee)} fee = ${fmt(e.net)} received · arrears ${fmt(e.rentDebtAfter)}</span>`).join(''):'<span>No completed Classic shifts recorded yet.</span>'}<small>Your pay after rent deductions and other charges.</small></div>`:'';
 const maintenance=game.isClassic?game.classicMaintenancePlan(p):null;
 const maintenancePanel=game.isClassic&&maintenance.choices.length?
  `<div class="careers-wardrobe"><b>Household repairs · ${maintenance.choices.length} appliance(s)</b><span>${maintenance.choices.map(q=>`${esc(q.id)}: ${fmt(q.cost)} · ${q.affordable?'safe after reserve':'hold for essentials'}`).join(' · ')}</span><small>Plan repairs around what you need for everyday expenses.</small></div>`:'';
 const classicNeeds=game.isClassic?`<div class="careers-wardrobe"><b>Relaxation · ${p.classicRelaxation}/30</b><span>Take breaks to restore relaxation. A comfortable home helps you recover.</span></div>`:'';
 const wellbeing=game.isClassic?`<div class="careers-wardrobe"><b>Happiness · recent weeks</b>${game.classicWeekEvents.filter(e=>e.kind==='weekly-wellbeing'&&e.playerId===p.id).slice(-4).reverse().map(e=>`<span>W${e.closedWeek} · happiness ${e.happinessBefore} → ${e.happinessAfter} · relaxation ${e.relaxationBefore} → ${e.relaxationAfter} · cash ${fmt(e.cashBefore)} → ${fmt(e.cashAfter)}</span>`).join('')||'<span>No completed weeks recorded yet.</span>'}${game.classicWeekEvents.filter(e=>e.kind==='cash-stress'&&e.playerId===p.id).slice(-3).reverse().map(e=>`<span>W${e.closedWeek} · Unexpected expenses: −${fmt(e.expense)} · happiness −4</span>`).join('')}<small>Food, bills and time to relax can affect how happy you feel.</small></div>`:'';
 const turnJournal=game.isClassic?`<div class="careers-wardrobe"><b>Classic turn sequence · latest events</b>${game.classicTurnJournal.filter(e=>e.phase==='turn-close').slice(-3).reverse().map(e=>`<span>W${e.week} · ${esc(e.playerId)} · reliability −${e.amount} at turn close</span>`).join('')+game.classicTurnJournal.filter(e=>e.phase!=='turn-close').slice(-7).reverse().map(e=>`<span>W${e.week} · ${esc(e.playerId)} · ${esc(e.phase)}${e.amount?` · ${e.phase==='rent'?fmt(e.amount):e.amount+' reliability'}`:''}</span>`).join('')||'<span>No completed turn boundaries recorded yet.</span>'}<small>Source-backed: −3 reliability when each turn ends and rent assessed after week 4, 8, etc. Economy, living and rental phases are replayable migration order, not a byte-exact SCI startTrn trace.</small></div>`:'';
 const marketIndices=game.isClassic?`<div class="careers-wardrobe"><b>Classic economy · eight live indices</b><span>Cycle: ${esc(game.classicEconomicPulse.phase)} · last shock W${game.classicEconomicPulse.lastIncidentWeek||"—"}</span>${game.classicEconomyReport().map(x=>`<span>${esc(x.id)} ${x.reading} (${x.change>=0?'+':''}${x.change})</span>`).join('')}<small>Weekly changes, same seeded economic state for consumer prices, offered wages and market prices. Exact DOS volatility, crisis probability and recovery effect remain provisional. Existing wages change only on a raise, job change or an explicit economic crisis.</small></div>`:'';
 showModal(`<section class="modal finance-modal" aria-label="Financial history"><div class="modal-head"><div><span class="eyebrow dark">YOUR FINANCIAL STORY · WEEK ${game.week}</span><h2>Where the money goes.</h2><p class="modal-lead">${esc(p.name)} · Actual account changes, not estimated spending</p></div><button class="modal-close" data-close aria-label="Close">×</button></div><div class="finance-metrics"><div><span>NET WORTH</span><strong>${fmt(f.netWorth)}</strong></div><div><span>LAST 4 WEEKS · GAINS</span><strong>${fmt(f.income)}</strong></div><div><span>LAST 4 WEEKS · COSTS</span><strong>${fmt(f.expenses)}</strong></div></div>${classicNeeds}${wellbeing}${maintenancePanel}${paychecks}<div class="finance-chart-heading"><b>Wealth over time</b><div class="finance-legend"><span>● Net worth</span><span>● Cash</span></div></div>${graph}<p class="finance-help">Transfers between cash, savings and investments are tracked but not counted as earnings. Weekend bills, rent, interest and investment performance are included in the net change.</p><div class="finance-bottom"><div><h3>Latest transactions</h3><div class="finance-table-scroll"><table class="finance-table"><thead><tr><th>Week</th><th>Activity</th><th>Type</th><th>Net change</th></tr></thead><tbody>${entries}</tbody></table></div></div><div><h3>Life milestones</h3><ol class="finance-milestones">${milestones}</ol></div></div></section>`);
}
function showCareers(){
 if(game.pendingEncounter){toast('Finish the current conversation first.',true);return;}
 const p=game.player;
 const survival=game.isClassic?game.classicSurvivalBudget(p):null;
 const careerPlan=game.isClassic?game.classicCareerPlan(p):null;
 const jones=game.isClassic?game.players.find(x=>x.isAI):null;
 const tracks=Object.groupBy?Object.groupBy(game.jobs,j=>j.track||({repair:'Technology',teller:'Finance',tutor:'Academia',analyst:'Business',engineer:'Technology',director:'Business'}[j.id]||'General')):game.jobs.reduce((o,j)=>{const k=j.track||({repair:'Technology',teller:'Finance',tutor:'Academia',analyst:'Business',engineer:'Technology',director:'Business'}[j.id]||'General');(o[k]??=[]).push(j);return o;},{});
 const jobs=Object.entries(tracks).sort((a,b)=>a[0].localeCompare(b[0])).map(([track,roles])=>`<div class="career-track"><h3>${esc(game.isClassic?game.jobWorkplace(roles[0]).label:track)}</h3>${game.isClassic?`<small class="classic-employer-original">Original Jones employer: ${esc(track)} · Work at ${esc(game.jobWorkplace(roles[0]).boardName)}</small>`:''}${roles.slice().sort((a,b)=>a.tier-b.tier).map(j=>{
   const reasons=game.jobReasons(p,j);
   const classicReq=game.isClassic?game.jobRequirement(j):null;
   const isCurrent=p.job===j.id;
   const dressed=game.isDressedFor(p,j);
   return `<div class="career-role ${isCurrent?'active':''}"><div><strong>${esc(j.name)}</strong><small>${esc(game.jobWorkplace(j).label)}${game.isClassic?' · '+esc(j.employer):''} · Level ${j.tier} · ${fmt(game.offeredWage(j))}/hour offered${game.isClassic?' · DOS #'+j.originalJobNum+' base '+fmt(j.originalBasePay)+'/h':''}</small><small>${esc(D.clothing[j.clothes].name)} or better${game.isClassic?` · XP ${classicReq.experience} · Reliability ${classicReq.dependability}${classicReq.degrees.length?' · '+classicReq.degrees.map(id=>D.classicDegrees.find(x=>x.id===id).name).join(' + '):''}`:j.course?' · '+esc(D.courses.find(c=>c.id===j.course).name):''}</small></div><span class="career-status">${isCurrent?'CURRENT JOB':reasons.length?esc(reasons.join(' · ')):!dressed?'UNIFORM NEEDED FOR SHIFTS':game.isClassic?(game.classicHiringChance(p,j)===100?'GUARANTEED':'HIRING '+game.classicHiringChance(p,j)+'%'):'READY TO APPLY'}</span></div>`;
 }).join('')}</div>`).join('');
 const certs=game.isClassic?D.classicDegrees.map(d=>{
    const prereqs=d.requires.map(id=>D.classicDegrees.find(x=>x.id===id).name);
    const completed=p.classicDegrees.includes(d.id);
    return `<div class="career-course"><strong>${esc(d.name)}</strong><span>${prereqs.length?'Requires '+esc(prereqs.join(' + ')):'Available initially'} · ${game.classicLessons(p)} lessons at 6h · $50 enrollment · +5 reliability on graduation</span><b>${completed?'✓ Degree':`${p.classicProgress[d.id]||0}/${game.classicLessons(p)} lessons${p.classicEnrolled.includes(d.id)?' · ACTIVE':''}`}</b></div>`;
  }).join(''):D.courses.map(c=>`<div class="career-course"><strong>${esc(c.name)}</strong><span>${esc(c.detail)} · ${c.sessions} lessons at ${fmt(c.cost)} base each · requires Education ${c.education}</span><b>${p.coursesCompleted.includes(c.id)?'✓ Complete':`${p.courseProgress[c.id]||0}/${c.sessions} sessions`}</b></div>`).join('');
 showModal(`<section class="modal careers-modal" aria-label="Career progression roadmap"><div class="modal-head"><div><span class="eyebrow dark">YOUR CAREER ROADMAP</span><h2>Find your next chapter.</h2><p class="modal-lead">One job at a time. Apply at the Career Center; shifts require clothing at your workplace. ${game.isClassic?'Jobs require the right education and experience. Wear suitable clothing to work, and keep your reliability up to earn promotions.':'Job offers depend on education, experience, reliability, and sometimes a short course.'}</p></div><button class="modal-close" data-close aria-label="Close">×</button></div><div class="careers-wardrobe"><b>Current wardrobe</b>${game.clothingSummary(p).map(x=>`<span class="${x.weeks<=1?'wardrobe-low':''}">${esc(x.name)}: ${x.weeks}w</span>`).join('')}<small>Every category ages once per week, whether used or not.</small></div>${game.isClassic?`<div class="careers-wardrobe"><b>Plan your next two weeks</b><span>Essential costs ${fmt(survival.twoWeekNeeds)}</span><span>Liquid funds ${fmt(survival.liquidity)}</span><span>${survival.projectedGap>0?'Funding gap '+fmt(survival.projectedGap):'Essentials covered'}</span><span>Next shift: ${fmt(survival.projectedShiftGross)} gross / ${fmt(survival.projectedShiftIncome)} take-home; after two shifts: ${fmt(survival.projectedGapAfterWork)} remaining essential funding gap</span><small>Forecast includes food, rent due within two weeks and replacement uniform if nearly worn out; estimated costs, not automatic transactions. Suggested next available study: ${esc(careerPlan.recommendedDegree?.name||'None')} (suggestion).</small></div>`:''}<h3 class="career-section-title">${game.isClassic?'Degrees at the university':'Specialist certificates · Brightside U'}</h3><div class="career-courses">${certs}</div><h3 class="career-section-title">Career paths</h3><div class="career-tracks">${jobs}</div><p class="modal-footnote">${game.isClassic?'Explore new careers, earn diplomas and build the experience you need for your next promotion.':'Base pay changes with the economy at hiring. Current wages can differ after raises. Buying clothing is separate from being eligible to apply.'}</p><button class="modal-primary" data-close type="button">Return to the city</button></section>`);
}
function saveExport(){const file=new Blob([JSON.stringify({format:'the-life-loop-v1',...game.snapshot()},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=`the-life-loop-week-${String(game.week).padStart(2,'0')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Save file exported!');}
// A preview never changes game state, player hours, or network state.
function previewTravel(e){
 const tile=e.target.closest?.('[data-travel]');
 if(!tile||!game.isClassic||venueInteraction.open||routeTravelBusy)return;
 routeOverlay?.preview(tile.dataset.travel,game);
}
$('classicTravelSkip').addEventListener('click',()=>routeOverlay?.finishAnimation());
$('classicBoardFit').addEventListener('click',()=>classicBoardSetView('fit'));
$('classicBoardExplore').addEventListener('click',()=>classicBoardSetView('explore'));
$('classicBoardLocate').addEventListener('click',()=>{boardManualPan=false;if(compactClassicBoard()&&classicBoardView==='fit')classicBoardSetView('explore',{focusId:game.player.location});else classicBoardFind(game.player.location);});
$('classicBoardJump').addEventListener('change',e=>{if(e.target.value){if(compactClassicBoard())classicBoardSetView('explore',{focusId:e.target.value});else classicBoardFind(e.target.value);}e.target.value='';});
$('boardViewport').addEventListener('pointerdown',e=>{
 boardPanOrigin=routeTravelBusy?{x:e.clientX,y:e.clientY,pointerId:e.pointerId}:null;
},{passive:true});
$('boardViewport').addEventListener('pointermove',e=>{
 if(boardPanOrigin&&boardPanOrigin.pointerId===e.pointerId&&Math.abs(e.clientX-boardPanOrigin.x)>9){
  boardManualPan=true;boardPanOrigin=null;
 }
},{passive:true});
for(const name of ['pointerup','pointercancel'])$('boardViewport').addEventListener(name,()=>{boardPanOrigin=null;},{passive:true});
$('board').addEventListener('pointerover',previewTravel);
$('board').addEventListener('focusin',previewTravel);
$('board').addEventListener('pointerout',e=>{if(!e.relatedTarget?.closest?.('[data-travel]')||e.relatedTarget.closest('[data-travel]')!==e.target.closest?.('[data-travel]'))routeOverlay?.clearPreview();});
$('board').addEventListener('focusout',e=>{if(!e.relatedTarget?.closest?.('[data-travel]'))routeOverlay?.clearPreview();});
$('board').addEventListener('click',async e=>{
 const btn=e.target.closest('[data-travel]');if(!btn||venueInteraction.open||routeTravelBusy)return;
 if(net.role&&!net.ownTurn()){toast('Your friend is taking their turn.',true);return;}
 const target=btn.dataset.travel,actorId=game.player.id,from=game.player.location;
 // First phone tap focuses a building without spending time. Tap again to visit.
 if(game.isClassic&&compactClassicBoard()&&(classicBoardView==='fit'||classicBoardFocusTarget!==target)){
  classicBoardSetView('explore',{focusId:target});
  return;
 }
 routeOverlay?.clearPreview();
 if(from===target){openVenue(target);return;}
 if(net.busy)return;
 routeTravelBusy=true;boardManualPan=false;boardPanOrigin=null;btn.disabled=true;
 try{
  const quote=game.isClassic?game.travelQuote(from,target,game.player.hours):null;
  const result=await net.execute('travel',target,()=>game.travel(target));
  if(result.ok&&net.role!=='guest'){
   if(game.isClassic)setClassicJourney('departing',placeLabel(target),quote);
   store();render();
   const arrived=await routeOverlay.animate(actorId,from,target,{onStep:point=>{if(game.player.id===actorId)classicBoardFollowPawn(point);}});
   if(arrived){
    routeOverlay.showArrival(target);classicBoardFind(target);
    if(game.isClassic)setClassicJourney('arrived',placeLabel(target));
   }
   if(arrived&&game.player.id===actorId&&game.player.location===target&&(!net.role||net.ownTurn()))openVenue(target);
  }else if(result.ok&&net.role==='guest'){
   pendingGuestVenue=target;pendingGuestRoute={from,to:target,actorId};
   if(game.isClassic)setClassicJourney('awaiting-host',placeLabel(target));
   toast('Travel requested · waiting for host confirmation.');
  }else if(game.isClassic)setClassicJourney('blocked',placeLabel(target));
  toast(result.message,!result.ok);
 }finally{routeTravelBusy=false;$('classicTravelControls').hidden=true;if(btn.isConnected)btn.disabled=false;}
});
$('venueActions').addEventListener('change',e=>{
 if(!venueInteraction.open)return;
 if(e.target.id==='classicEmployerFilter'){classicEmployerFilter=e.target.value;render();}
 if(e.target.id==='careerShowAll'){showFutureJobApplications=e.target.checked;render();}
});
$('venueActions').addEventListener('click',async e=>{
 const btn=e.target.closest('[data-act]');if(!btn||btn.disabled||!venueInteraction.open||venueInteraction.pending)return;
 if(net.role&&!net.ownTurn()){closeVenue();toast('Not your turn.',true);return;}
 const actionId=btn.dataset.act,location=game.player.location;
 if(actionId.startsWith('apply:')&&confirmEmploymentSwitch(actionId))return;
 venueInteraction.pending=true;render();
 try{const result=await net.execute('act',actionId,()=>game.act(actionId));
  if(result.ok&&net.role!=='guest'){store();render();if(actionId==='chat'&&!game.pendingEncounter)showSmallTalk(result.message,location);}
  refreshVenueAfterAction(result);toast(result.message,!result.ok);
 }finally{venueInteraction.pending=false;render();}
});
$('venueClose').addEventListener('click',()=>closeVenue());
$('venueDone').addEventListener('click',()=>closeVenue());
// Same authoritative action path as the activity card: no duplicate pay/time logic.
$('venueWork').addEventListener('click',()=>{
 const action=Array.from($('venueActions').querySelectorAll('[data-act]')).find(b=>b.dataset.act==='work');
 if(action&&!action.disabled)action.click();
});
$('venueScrim').addEventListener('click',()=>closeVenue());
$('endTurnBtn').addEventListener('click',async()=>{
 if(net.busy||routeTravelBusy)return;
 const before={isClassic:game.isClassic,mode:game.settings.mode,playerId:game.player.id};
 const from=game.player.location,actorId=game.player.id;
 closeVenue({restoreFocus:false});
 routeTravelBusy=true;
 render();
 try{
  if(game.isClassic&&game.settings.rules.forcedReturnHome&&from!=='home'&&!game.winner&&!game.pendingEncounter){
   // Visualize the mandatory journey against the OLD turn. Game/Looprd settle
   // the authoritative travel cost and deferred debt exactly once afterwards.
   const cost=game.travelCost(from,'home'),debt=Math.max(0,cost-game.player.hours);
   routeOverlay?.clearPreview();
   setClassicJourney('departing',`Homeward · ${cost} clock units${game.settings.rules.carryReturnOvertime&&debt?` · ${debt} next week`:''}`);
   await routeOverlay?.animate(actorId,from,'home',{duration:1250,onStep:point=>classicBoardFollowPawn(point)});
   setClassicJourney('idle','');
  }
  const result=await net.execute('endTurn',null,()=>game.endTurn());
  if(result.ok&&net.role!=='guest'){
   if(HotseatHandover.required(before,game,Boolean(net.role)))showClassicHandover();
   store();render();
  }else render();
  toast(result.message,!result.ok);
 }catch(error){toast('Could not end week: '+error.message,true);}
 finally{setClassicJourney('idle','');routeTravelBusy=false;render();}
});
$('classicHandoverContinue').addEventListener('click',()=>{hideClassicHandover();$('endTurnBtn').focus();});
$('guideBtn').addEventListener('click',()=>{setUtilityMenu(false);guide();});
$('charactersBtn').hidden=!ENABLE_CHARACTER_CUSTOMIZATION;
if(ENABLE_CHARACTER_CUSTOMIZATION)$('charactersBtn').addEventListener('click',()=>{setUtilityMenu(false);showCharacterLibrary('new');});
$('sharedProfileBtn').addEventListener('click',()=>{
 SharedPortrait.open({onSaved:()=>{render();toast('Shared portrait saved locally.');}});
 // SharedPortrait.open mounts its controls directly in the game overlay.
});
$('financeBtn').addEventListener('click',showFinances);
$('careerBtn').addEventListener('click',showCareers);
// Retained main-toolbar language selector: older local campaigns expect this ID.
// Keep it in sync with the existing New Game selector and v0.5.57 locale key.
$('languageSelect').value=UX57.savedLocale(preferencesStorage);
I18n.set($('languageSelect').value);
$('languageSelect').addEventListener('change',e=>{
 const language=I18n.set(e.target.value);
 e.target.value=language;
 document.documentElement.lang=language;
 const setupLanguage=$('gameLanguage');
 if(setupLanguage){setupLanguage.value=language;setupLanguage.dispatchEvent(new Event('change',{bubbles:true}));}
 else {render();I18n.apply();}
});
$('newBtn').addEventListener('click',()=>{setUtilityMenu(false);newGameDialog();});
$('utilityMenuBtn').addEventListener('click',()=>setUtilityMenu($('utilityMenu').hidden));
$('saveBtn').addEventListener('click',()=>setUtilityMenu(false));
$('loadBtn').addEventListener('click',()=>setUtilityMenu(false));
$('storyDrawerBtn').addEventListener('click',()=>setDrawer('story'));
$('drawerScrim').addEventListener('click',closeDrawer);
document.querySelectorAll('[data-close-drawer]').forEach(b=>b.addEventListener('click',closeDrawer));
document.addEventListener('click',e=>{if(!e.target.closest('.utility-holder')){setUtilityMenu(false);setCoopMenu(false);}});
$('turnConnection').addEventListener('click',onlineDialog);
$('mobileNav').addEventListener('click',e=>{const tab=e.target.closest('[data-mobile-tab]');if(tab)setMobileView(tab.dataset.mobileTab);});
mobileBreakpoint.addEventListener('change',updateLayout);wideScreen.addEventListener('change',updateLayout);drawerScreen.addEventListener('change',updateLayout);window.matchMedia('(max-width:720px)').addEventListener('change',()=>{boardManualPan=false;classicBoardSync();$('boardViewport').scrollLeft=0;routeOverlay?.invalidate?.();});
setMobileView('city',{scroll:false});
$('onlineBtn').addEventListener('click',()=>setCoopMenu($('coopMenu').hidden));
$('coopOpenDetails').addEventListener('click',()=>{setCoopMenu(false);onlineDialog();});
$('chatToggle').addEventListener('click',()=>setChatOpen($('chatPanel').hidden));
$('closeChat').addEventListener('click',()=>setChatOpen(false));
$('chatSocialTab').addEventListener('click',()=>setChatChannel('social'));
$('chatRoomTab').addEventListener('click',()=>setChatChannel('room'));
$('chatSocialOrigin').value=social.suggestedOrigin;
async function socialAccountSubmit(register=false){
 const controls=[$('chatSocialConnectForm').querySelector('button[type=submit]'),$('chatSocialRegister')];
 controls.forEach(b=>b.disabled=true);
 try{
  await social.signIn($('chatSocialOrigin').value,$('chatSocialUsername').value,$('chatSocialPassword').value,{register});
  $('chatSocialPassword').value='';toast(register?'Social account created.':'Signed into Social.');
 }catch(err){toast('Social sign-in failed: '+err.message,true);}
 finally{controls.forEach(b=>b.disabled=false);chatRender();}
}
$('chatSocialConnectForm').addEventListener('submit',e=>{e.preventDefault();socialAccountSubmit(false);});
$('chatSocialRegister').addEventListener('click',()=>socialAccountSubmit(true));
$('chatSocialRefresh').addEventListener('click',()=>social.refresh().catch(err=>toast(err.message,true)));
$('chatSocialDisconnect').addEventListener('click',async()=>{try{await social.signOut();$('chatSocialPassword').value='';toast('Signed out of Social.');}catch(err){toast('Social sign-out could not be confirmed: '+err.message,true);}});
$('chatForm').addEventListener('submit',async e=>{e.preventDefault();const input=$('chatInput'),text=input.value.trim();if(!text)return;const button=$('chatSend');button.disabled=true;
 try{if(chatChannel==='social')await social.sendChat(text);else await net.sendChat(text);input.value='';}
 catch(err){toast('Chat unavailable: '+err.message,true);}finally{button.disabled=false;chatRender();}
});
$('saveBtn').addEventListener('click',saveExport);
$('loadBtn').addEventListener('click',()=>{if(net.role)toast('Disconnect from Online co-op before loading another game.',true);else loadDialog();});
$('overlay').addEventListener('click',async e=>{const choice=e.target.closest('[data-choose]');if(choice&&!choice.disabled){const r=await net.execute('choose',choice.dataset.choose,()=>game.chooseEncounter(choice.dataset.choose));if(r.ok){$('overlay').dataset.kind='';closeOverlay();if(net.role!=='guest'){store();render();}}toast(r.message,!r.ok);return;}if(e.target.hasAttribute('data-close'))closeOverlay();});
$('filePicker').addEventListener('change',async e=>{if(net.role){toast('Disconnect before importing a save.',true);e.target.value='';return;}const file=e.target.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw Error('Save file is too large');const obj=JSON.parse(await file.text());game=Game.load(obj);routeOverlay?.cancel();$('classicTravelControls').hidden=true;didShowWin=!!game.winner;closeVenue({restoreFocus:false});closeOverlay();if(HotseatHandover.resumeRequired(game,Boolean(net.role)))showClassicHandover();render();store();toast('Save imported successfully.');}catch(err){toast('Could not load save: '+err.message,true);}e.target.value='';});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){
  if($('overlay').classList.contains('open')){if($('overlay').dataset.kind!=='encounter'&&$('overlay').querySelector('[data-close]'))closeOverlay();return;}
  if(venueInteraction.open){closeVenue();return;}
  setUtilityMenu(false);setCoopMenu(false);closeDrawer();return;
 }
 if(e.key==='Tab'&&venueInteraction.open&&!$('overlay').classList.contains('open'))venueFocusTrap(e);
});
net=new window.LifeOnline({getGame:()=>game,setGame:snap=>{game=Game.load(snap);didShowWin=!!game.winner;store();render();
 if(pendingGuestVenue){
  const target=pendingGuestVenue,journey=pendingGuestRoute;
  if(net.ownTurn()&&game.player.location===target){
   pendingGuestVenue=null;pendingGuestRoute=null;
   const actorId=journey?.actorId||game.player.id;
   routeTravelBusy=true;
   routeOverlay.animate(actorId,journey?.from||target,target).then(ok=>{
    routeTravelBusy=false;
    if(ok&&game.player.id===actorId&&game.player.location===target&&net.ownTurn())openVenue(target);
   });
  }else if(!net.ownTurn()){pendingGuestVenue=null;pendingGuestRoute=null;}
 }
 if(game.pendingEncounter&&net.ownTurn())showEncounter();else if($('overlay').dataset.kind==='encounter'){$('overlay').dataset.kind='';$('overlay').classList.remove('open');$('overlay').innerHTML='';}},render,toast,chatRender});
routeOverlay=new window.LifeRouteOverlay.RouteOverlay({frame:$('boardStage'),board:$('board'),svg:$('routeOverlay'),announce:$('routeAnnounce'),layout:window.LifeClassicRoutes,expectedVenues:D.classicPlaces.map(p=>p.id)});
render();requestAnimationFrame(()=>{if(game.isClassic&&classicBoardView==='explore')classicBoardFind(game.player.location,'instant');});newGameDialog(true);
net.resume().then(reconnected=>{if(reconnected){$('overlay').dataset.kind='';closeOverlay();toast('Reconnected to room '+net.code);}else if(new URLSearchParams(location.search).has('join'))onlineDialog();});
})();
