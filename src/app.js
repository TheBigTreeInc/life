(function(){
'use strict';
const D=window.LifeData;
const Game=window.LifeGame;
const Art=window.LifeArt;
const Characters=window.LifeCharacters;
const characters=Characters.createStore((()=>{try{return window.localStorage;}catch{return null;}})());
const SAVE_KEY='the-life-loop-v1';
let game=new Game();let net;let toastTimer;let didShowWin=false;let classicEmployerFilter="all";
let mobileView='city';
let openDrawer=null;
let lastStoryFingerprint=null,lastDestinationFingerprint=null;
let unreadStory=0,unreadDestination=0;
const wideScreen=window.matchMedia('(min-width:1600px)');
const drawerScreen=window.matchMedia('(min-width:1025px) and (max-width:1599px)');
const panelVisible=which=>wideScreen.matches||(mobileBreakpoint.matches?mobileView===(which==='story'?'life':'actions'):openDrawer===which);
function refreshBadges(){
 const pairs=[['story',unreadStory,['storyBadge','mobileStoryBadge']],['actions',unreadDestination,['destinationBadge','mobileActionsBadge']]];
 for(const [kind,count,ids] of pairs){for(const id of ids){const badge=$(id);badge.hidden=!count;badge.textContent=String(Math.min(count,9))+(count>9?'+':'');badge.setAttribute('aria-label',`${count} new ${kind==='story'?'story updates':'destination updates'}`);}}
}
function markViewed(which){if(which==='story')unreadStory=0;else unreadDestination=0;refreshBadges();}
function closeDrawer(){openDrawer=null;document.body.dataset.openDrawer='';$('drawerScrim').hidden=true;for(const [which,id] of [['story','storyDrawerBtn'],['actions','destinationDrawerBtn']])$(id).setAttribute('aria-expanded','false');}
function setDrawer(which){
 if(!drawerScreen.matches)return;
 if(openDrawer===which){closeDrawer();return;}
 openDrawer=which;document.body.dataset.openDrawer=which;$('drawerScrim').hidden=false;
 for(const [name,id] of [['story','storyDrawerBtn'],['actions','destinationDrawerBtn']])$(id).setAttribute('aria-expanded',String(name===which));
 markViewed(which);
}
function updateLayout(){closeDrawer();updateMobileAccessibility();if(wideScreen.matches){markViewed('story');markViewed('actions');}}
function setUtilityMenu(open){$('utilityMenu').hidden=!open;$('utilityMenuBtn').setAttribute('aria-expanded',String(open));}

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>'$'+Math.floor(n).toLocaleString('en-US');
const percent=n=>Math.max(0,Math.min(100,Math.round(n)))+'%';
const place=id=>D.places.find(x=>x.id===id);
const mobileBreakpoint=window.matchMedia('(max-width:1024px)');
function setMobileView(view,{scroll=true}={}){
 if(!['city','actions','life'].includes(view))return;
 mobileView=view;document.body.dataset.mobileView=view;
 for(const tab of document.querySelectorAll('[data-mobile-tab]')){
  const active=tab.dataset.mobileTab===view;
  tab.setAttribute('aria-pressed',String(active));
 }
 for(const [name,id] of [['city','gameCity'],['actions','gameActions'],['life','gameLife']]){
  $(id).inert=mobileBreakpoint.matches&&view!==name;
 }
 if(view==='life')markViewed('story');if(view==='actions')markViewed('actions');
 if(scroll&&mobileBreakpoint.matches)window.scrollTo({top:0,behavior:'instant'});
}
function updateMobileAccessibility(){setMobileView(mobileView,{scroll:false});}
const job=id=>game.getJob({job:id});
const eraMeta=()=>D.worldEras[game.settings.era];
const placeLabel=id=>eraMeta().names[D.places.findIndex(p=>p.id===id)]||place(id)?.name||id;
const icon={arc:'📖',favor:'🤝',pulse:'✷',chat:'💬',work:'⚒',relax:'☀',freelance:'💸',cook:'🍳',apply:'✉',raise:'↗',groceries:'🥬',bulkFood:'🥕',lottery:'🎲',meal:'🍲',study:'📖',deposit:'↘',withdraw:'↗',invest:'📊',sell:'📉',upgrade:'🏠',rentDebt:'✓',buy:'🛍',movie:'🎬',pass:'🎉',checkup:'🩺',clothes:'👔',course:'📚',enroll:'📝',classicStudy:'🎓',classicFresh:'🥬',classicNewspaper:'📰',classicLottery:'🎟️',classicLoanApply:'🏦',classicLoanPay:'💵',classicBroker:'📊',classicBuyStock:'📈',classicSellStock:'📉',classicSellLegacy:'📤'};
function toast(msg,error=false){const el=$('toast');el.textContent=msg;el.classList.toggle('error',error);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3100);}
function store(){if(net?.role==='guest')return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.snapshot()));}catch(e){/* Local files may deny localStorage; manual export remains available. */}}
function restore(){try{const data=localStorage.getItem(SAVE_KEY);return data?JSON.parse(data):null;}catch(e){return null;}}
function render(){
 const p=game.player,j=game.getJob(p),score=game.scores(p),current=place(p.location);
 document.body.dataset.era=game.settings.era;
 document.body.dataset.ruleset=game.settings.ruleset;
 document.querySelector('.board-heading h1').innerHTML=esc(eraMeta().city)+'<span class="sun-icon">✳</span>';
 $('topWeek').textContent='WEEK '+String(game.week).padStart(2,'0');
 $('mobileWeek').textContent=String(game.week).padStart(2,'0');
 $('mobileHours').textContent=p.hours+'h';
 $('mobileCash').textContent=fmt(p.cash);
 $('mobilePlayer').textContent=p.name;
 $('economy').textContent=game.economy>=1.06?'MARKET BOOMING':game.economy<=.94?'MARKET COOLING':'MARKET STABLE';
 $('turnCounter').textContent=p.name.toUpperCase()+' TURN';
 const online=!!net?.role,ours=!online||net.ownTurn();
 const ourName=net?.role==='guest'?(game.players.find(x=>x.id==='friend')?.name||'Friend'):(game.players.find(x=>x.id==='player')?.name||'Host');
 const rivalName=net?.role==='guest'?(game.players.find(x=>x.id==='player')?.name||'Host'):(game.players.find(x=>x.id==='friend')?.name||'Friend');
 let turnTitle=online?(ours?'YOUR TURN':`${p.name.toUpperCase()}’S TURN`):`${p.name.toUpperCase()}’S TURN`;
 if(online&&!net.joined&&net.role==='host')turnTitle='WAITING FOR YOUR FRIEND TO JOIN';
 const roleLine=online?`You are ${net.role==='host'?'the host':'the guest'} (${ourName}) · ${ours?'You can act now':`Waiting for ${p.name}`} · ${net.joined?'2 connected':'1 connected'}`:`Local game · ${p.hours} hours remaining`;
 $('turnHeadline').textContent=turnTitle;$('turnDetails').textContent=roleLine;
 $('turnBanner').dataset.owner=ours?'self':'other';$('turnBanner').dataset.online=String(online);
 $('turnLamp').title=online?(net.socketOpen?'WebSocket connected':net.lastSyncAt?'HTTP fallback / retrying':'Waiting for Looprd'):'Local play';
 $('turnConnection').textContent=online?`${net.socketOpen?'● WS live':net.lastSyncAt?'○ HTTP fallback':'○ Connecting'} · Room ${net.code} ↗`:'◎ Start online co-op ↗';
 if($('roomTurnText'))$('roomTurnText').textContent=net.ownTurn()?'YOUR TURN':`WAITING FOR ${game.player.name}`;
 if($('roomParticipants'))$('roomParticipants').textContent=`Current player: ${game.player.name} · You: ${net.role} · Remote: ${net.guestName||'Not named yet'} · ${net.joined?'2 joined':'1 joined'}`;
 if($('roomTransport'))$('roomTransport').textContent=`WebSocket: ${net.socketOpen?'Connected':'Not connected (HTTP polling fallback)'} · HTTP: ${net.lastSyncAt?'Last room response '+new Date(net.lastSyncAt).toLocaleTimeString():'Awaiting room response'}`;
 if($('roomVersion'))$('roomVersion').textContent=`Room version: ${net.version} · ${net.endpoint}`;
 if($('roomComponent'))$('roomComponent').textContent=`Component schema: ${net.infoStatus}`;
 
 $('profile').innerHTML=`<div class="profile-top"><div class="avatar" style="background:${esc(p.color)}">${p.appearance?Characters.avatar({...p.appearance,name:p.name},'sidebar'):(p.id==='jones'?'😎':p.id==='friend'?'🧑‍🚀':'🧑‍🎨')}</div><div><div class="profile-name">${esc(p.name)}</div><div class="profile-job">${j?`${esc(j.name)} · ${esc(j.employer||placeLabel(j.place))} · ${fmt(p.wage)}/h`:'Unemployed · Apply at Career Center'}</div></div></div><div class="profile-mini"><span>📍 <b>${esc(placeLabel(current.id))}</b></span><span class="pill">${esc(D.dwellings[p.home].name)}</span></div>`;
 $('balances').innerHTML=`<div class="stat-card"><div class="stat-label">CASH ON HAND</div><div class="stat-number">${fmt(p.cash)}</div><div class="stat-note">Ready to spend</div></div><div class="stat-card"><div class="stat-label">NET WORTH</div><div class="stat-number">${fmt(game.wealth(p))}</div><div class="stat-note">Including savings${p.rentDebt?' · debt':''}</div></div>`;
 const goalLabels={wealth:'💰 Wealth',happiness:'☀️ Happiness',education:'🎓 Education',career:'🚀 Career'};
 $('goals').innerHTML=D.GOAL_KEYS.map(k=>`<div class="goal-item"><div class="goal-title"><strong>${goalLabels[k]}</strong><span class="goal-percent">${score[k]}%</span></div><div class="track" role="progressbar" aria-label="${k}" aria-valuenow="${score[k]}" aria-valuemin="0" aria-valuemax="100"><div style="width:${percent(score[k])}"></div></div></div>`).join('');
 const wellbeing=[{name:'Energy',value:p.energy,sub:p.energy+' / 100'},{name:'Happiness',value:p.happiness,sub:p.happiness+' / 100'},{name:'Reliability',value:p.dependability,sub:p.dependability+' / 100'}];
 $('wellbeing').innerHTML=wellbeing.map(v=>`<div class="wellness-row"><span>${esc(v.name)}</span><strong>${esc(v.sub)}</strong></div><div class="track small-track"><div style="width:${percent(v.value)}"></div></div>`).join('')+
 `<div class="wellness-row"><span>Experience</span><strong>${p.experience} XP</strong></div><div class="wellness-row"><span>Food for this week</span><strong>${p.fed?'FED':p.groceries>0?'PANTRY '+p.groceries:'NONE'}</strong></div><div class="wardrobe-status"><strong>👕 WARDROBE · WEEKS LEFT</strong>${game.clothingSummary(p).map(x=>`<span class="wardrobe-line ${x.weeks<=1?'wardrobe-low':''}">${esc(x.name)} <b>${x.weeks}w</b></span>`).join('')}<small>All outfits age each week. Better outfits also cover lower-level uniforms.</small></div><div class="wellness-row"><span>${game.isClassic?'Classic diplomas':'Certificates'}</span><strong>${game.isClassic?game.degreeCount(p)+' / '+D.classicDegrees.length:p.coursesCompleted.length+' / '+D.courses.length}</strong></div>${game.isClassic?`<div class="wellness-row"><span>University enrollments</span><strong>${p.classicEnrollmentCredits} unused · ${p.classicEnrolled.length}/4 active</strong></div>`:''}`;
 $('leaderboard').innerHTML=[...game.players].sort((a,b)=>game.progress(b)-game.progress(a)).map(x=>{
 const role=game.getJob(x)?.name||'Getting started';return `<div class="leader-entry ${x.id===p.id?'active':''}"><span class="leader-dot" style="background:${esc(x.color)}"></span><div class="leader-data"><div class="leader-name">${esc(x.name)}</div><div class="leader-role">${esc(role)}</div></div><strong class="leader-score">${game.progress(x)}%</strong></div>`;
 }).join('');
 $('board').innerHTML=D.places.map((loc,index)=>{
 const cost=game.travelCost(p.location,loc.id),hasHuman=game.players.some(x=>!x.isAI&&x.location===loc.id);
 const eventHere=!game.isClassic&&game.cityEvent.venue===loc.id;
 const rival=game.players.some(x=>x.isAI&&x.location===loc.id);
 return `<button type="button" class="board-tile ${p.location===loc.id?'selected':''}" ${net?.role&&(!net.ownTurn()||net.busy)?'disabled':''} data-travel="${loc.id}" style="grid-area:${loc.cell[1]}/${loc.cell[0]};background:${loc.color}4a" title="Visit ${esc(placeLabel(loc.id))}${cost?' · '+cost+' hour'+(cost!==1?'s':''):' · current location'}" aria-label="${esc(placeLabel(loc.id))}, ${cost?'travel '+cost+' hours':'current location'}"><div class="tile-topline"><span class="tile-num">${String(index+1).padStart(2,'0')}</span>${p.location===loc.id?'<span class="you-marker">● YOU</span>':eventHere?'<span class="pulse-marker">✷ EVENT</span>':hasHuman?'<span class="you-marker">● PLAYER</span>':rival?'<span class="you-marker">● RIVAL</span>':''}</div><div class="tile-art" aria-hidden="true">${Art.scene(loc.id,true,game.settings.era)}</div><div class="tile-caption"><div class="tile-name">${esc(placeLabel(loc.id))}</div><div class="tile-tag">${esc(loc.tag)}</div></div></button>`;
 }).join('')+`<div class="hub"><div class="hub-decor">✳</div><div><div class="hub-flag"><span class="spark">✦</span> ${esc(eraMeta().city.toUpperCase())} · ${game.isClassic?'CLASSIC RULES':'MODERN STORY'}</div><div class="hub-title">Make a life.<br/>Not just a living.</div><div class="hub-news">CITY RADIO · ${esc(game.bulletin)}</div><div class="hub-sub">${p.hours>0?'Tap a building to travel. Every hour is yours to spend.':'That’s your week! Wrap it up to start a new one.'}</div></div><div class="hub-bottom"><div class="hub-week">WEEK ${String(game.week).padStart(2,'0')}<br/>THE LIFE LOOP</div><div class="hub-hours">${p.hours}<small>OF ${game.rules.hours} HOURS</small></div></div><div class="hub-sketch" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div></div>`;
 $('timeStrip').innerHTML=`<div class="time-label"><strong>⏱ &nbsp; Your weekly time</strong><br/>Every decision takes a little time</div><div class="hour-pips">${Array.from({length:game.rules.hours/2},(_,i)=>`<span class="${i<p.hours/2?'remaining':''}"></span>`).join('')}</div><div class="time-remaining">${p.hours} / ${game.rules.hours} h</div>`;
 $('cityPulse').hidden=game.isClassic;
 const event=game.cityEvent,prices=Object.entries(event.prices).map(([sector,mult])=>`${sector} ${Math.round((mult-1)*100)>0?'+':''}${Math.round((mult-1)*100)}%`),pay=event.wage!==1?`shift pay +${Math.round((event.wage-1)*100)}%`:'';
 const legacies=D.storyArcs.filter(a=>!game.isClassic&&game.cityProjects[a.id]).map(a=>`${a.title} · ${a.sector==='wage'?'+5% shift wages':a.sector==='food'?'−5% food':'−8% leisure'}`);
 $('cityPulse').innerHTML=`<div class="pulse-icon">✷</div><div class="pulse-story"><span class="pulse-kicker">CITY PULSE · WEEKS ${game.cityEventStart}–${game.cityEventStart+3}</span><strong>${esc(event.title)}</strong><p>${esc(event.description)}</p><div class="pulse-mods">${[...prices,pay].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')||'<span>No price changes</span>'}${legacies.map(x=>`<span class="legacy-tag">★ ${esc(x)}</span>`).join('')}</div></div><div class="pulse-call"><span>COMMUNITY OPPORTUNITY</span><b>${esc(event.opportunity.title)}</b><small>At ${esc(placeLabel(event.venue))} · ${event.opportunity.hours}h · ${p.cityParticipation?.[game.cityEventStart]?'Already joined':'Available this month'}</small></div>`;
 const symbols={good:'✦',info:'●',warn:'!',news:'☼',muted:'·',travel:'↗'};
 $('journal').innerHTML=game.messages.filter(m=>m.actor==='system'||m.actor===p.id||m.actor==='jones').slice(0,10).map(m=>`<div class="journal-line ${esc(m.type)}"><span class="journal-icon">${symbols[m.type]||'·'}</span><span class="journal-message">${esc(m.message)}</span><span class="journal-week">W${m.week}</span></div>`).join('');
 const idx=D.places.indexOf(current)+1;
 const citizen=D.citizens[current.id];
 const trust=game.relationship(p,current.id),relName=game.relationshipName(p,current.id),memory=p.memories?.[current.id],storyChoice=D.encounters[current.id].choices.find(c=>c.id===memory);
 const npcGreeting=memory?game.npcLine(current.id,p):citizen.greeting;
 const localArc=D.storyArcs.find(a=>a.host===current.id);
 const arcInfo=localArc?game.storyStatus(p,localArc):null;
 const relatedArcs=D.storyArcs.filter(a=>a.partner===current.id);
 const storyHelp=!game.isClassic&&localArc?`<div class="arc-progress"><b>📖 ${esc(localArc.title)}</b><span>${arcInfo.chapter>=3?'Story complete':`Chapter ${arcInfo.chapter+1}/3`}</span><small>${esc(arcInfo.chapter>=3?'A chapter of city history you helped write.':arcInfo.reason||'Next chapter is available in the activity list.')}</small></div>`:'';
 const links=(game.isClassic?[]:relatedArcs).filter(a=>(p.storyProgress?.[a.id]?.chapter||0)>0).map(a=>`<span class="story-partner">↗ ${esc(citizen.name)} is part of ${esc(a.title)}</span>`).join('');
 $('venue').innerHTML=`<div class="venue-scene"><span class="venue-mini">${esc(current.tag)}</span>${Art.scene(current.id,false,game.settings.era)}</div><div class="venue-level"><h2>${esc(placeLabel(current.id))}</h2><span class="venue-no">${String(idx).padStart(2,'0')} / 12</span></div><p class="venue-blurb">${esc(current.blurb)}</p><div class="npc-card"><div class="npc-avatar">${Art.person(current.id,false,game.settings.era)}</div><div class="npc-copy"><div class="npc-label">MEET THE LOCALS ${p.talkedWeek?.[current.id]===game.week?'· SPOKEN THIS WEEK':''}</div><strong>${esc(citizen.name)}</strong><span>${esc(citizen.title)}</span><p>“${esc(npcGreeting)}”</p></div></div><div class="friendship" ${game.isClassic?'hidden':''}><div class="friend-head"><span>♥ ${esc(relName)}</span><span>${trust} / 100 trust</span></div><div class="friend-track"><div style="width:${trust}%"></div></div><small>${storyChoice?'Remembers: '+esc(storyChoice.label):'Get to know '+esc(citizen.name)+' by talking each week.'}${trust<18?' · Favors unlock at 18 trust.':' · Friendship favors available every four weeks.'}</small></div>${storyHelp}${links}<div class="location-visit">↗ &nbsp; ${j?(current.id===j.place?`Your workplace · ${esc(j.employer?j.employer+' · '+j.name:j.name)} · ${fmt(p.wage)}/hour. Take a shift below.`:`Employed at ${esc(j.employer||placeLabel(j.place))} as ${esc(j.name)}. Only that workplace offers regular paid shifts.`):'Unemployed · Visit Career Center to find your first permanent job.'} ${game.isClassic?'Choose a city activity below.':'Speak to '+esc(citizen.name)+' or choose an activity below.'}</div>`;
 const allActions=game.actions();
 const classicEmployment=game.isClassic&&p.location==='agency';
 const employers=classicEmployment?[...new Set(game.jobs.map(j=>j.employer))]:[];
 const actions=classicEmployment&&classicEmployerFilter!=='all'?allActions.filter(a=>!a.id.startsWith('apply:')||a.req?.employer===classicEmployerFilter):allActions;
 const filterHtml=classicEmployment?`<label class="agency-filter"><span>Employer · ${allActions.filter(a=>a.id.startsWith('apply:')).length} original DOS positions</span><select id="classicEmployerFilter" aria-label="Filter Classic jobs by employer"><option value="all">All employers</option>${employers.map(e=>`<option value="${esc(e)}" ${e===classicEmployerFilter?'selected':''}>${esc(e)}</option>`).join('')}</select></label>`:'';
 $('actionsCount').textContent=actions.filter(a=>a.enabled).length+' available';
 $('actions').innerHTML=filterHtml+(actions.length?actions.map(a=>{
   const base=a.id.split(':')[0];const prominent=a.id==='work'||a.id==='study';return `<button type="button" class="action-card ${prominent?'primary':''} ${a.special?'special-'+a.special:''}" data-act="${esc(a.id)}" ${a.enabled&&(!net?.role||net.ownTurn())&&!net?.busy?'':'disabled'} title="${esc(a.enabled?a.detail:a.reason)}"><span class="action-symbol">${icon[base]||'✦'}</span><span class="action-info"><span class="action-name">${esc(a.title)}</span><span class="action-desc" style="display:block">${esc(a.enabled?a.detail:a.reason)}</span></span><span class="action-meta">${a.hours?'⏱ '+a.hours+'h':''}${a.price?'<br/><span class="price">'+fmt(a.price)+'</span>':''}</span></button>`;
 }).join(''):'<div class="hint-box">Explore another building to discover things to do.</div>');
 $('hint').innerHTML=`<b>✦ TODAY'S TIP</b><br/>${esc(hint(p))}`;
 $('onlineBtn').textContent=net?.indicator()||'◎ Online co-op';
 const visibleMessages=game.messages.filter(m=>m.actor==='system'||m.actor===p.id||m.actor==='jones');
 const storyFingerprint=JSON.stringify([p.id,game.week,...visibleMessages.slice(-6).map(m=>[m.actor,m.message,m.week])]);
 const destinationFingerprint=JSON.stringify([p.id,p.location,game.week,game.actions().filter(a=>a.enabled).map(a=>a.id)]);
 if(lastStoryFingerprint!==null&&storyFingerprint!==lastStoryFingerprint&&!panelVisible('story'))unreadStory=Math.min(9,unreadStory+1);
 if(lastDestinationFingerprint!==null&&destinationFingerprint!==lastDestinationFingerprint&&!panelVisible('actions'))unreadDestination=Math.min(9,unreadDestination+1);
 if(lastDestinationFingerprint===null&&!panelVisible('actions')&&game.actions().some(a=>a.enabled))unreadDestination=1;
 lastStoryFingerprint=storyFingerprint;lastDestinationFingerprint=destinationFingerprint;
 if(panelVisible('story'))unreadStory=0;if(panelVisible('actions'))unreadDestination=0;
 refreshBadges();
 $('endTurnBtn').disabled=!!game.winner||(!!net?.role&&!net.ownTurn())||!!net?.busy;
 $('endTurnBtn').querySelector('span:first-child').textContent=game.winner?'Game complete':net?.role&&!net.ownTurn()?'Waiting for friend':'Wrap up this week';
 if(game.winner&&!didShowWin){didShowWin=true;showWinner();}
 if(game.pendingEncounter&&(!net?.role||net.ownTurn())&&$('overlay').dataset.kind!=='encounter')showEncounter();
}
function onlineDialog(){
 const connected=!!net.role;
 const server=esc(net.endpoint?window.LifeOnline.serverBase(net.endpoint):window.LifeOnline.suggestedServer());
 const selectedProfile=characters.selected();
 showModal(`<section class="modal compact" aria-label="Online co-op"><div class="modal-head"><div><span class="eyebrow dark">PLAY TOGETHER FROM ANYWHERE</span><h2>Online co-op</h2></div><button class="modal-close" data-close aria-label="Close">×</button></div>
 ${connected?`<p class="modal-lead"><strong>${esc(net.role==='host'?'You are hosting':'You are connected as guest')}</strong> · Game code <strong class="code-value">${esc(net.code)}</strong><br/>${esc(net.notice)} · ${net.joined?'Two players joined the room':'Waiting for a friend'}</p><div class="room-diagnostics" id="roomDiagnostics"><strong>Room status — <span id="roomTurnText">${net.ownTurn()?'YOUR TURN':`WAITING FOR ${esc(game.player.name)}`}</span></strong><span id="roomParticipants">Current player: ${esc(game.player.name)} · You: ${esc(net.role)} · Remote: ${esc(net.guestName||'Not named yet')}</span><span id="roomVersion">Looprd API: ${esc(net.endpoint)} · Room version: ${net.version}</span><span id="roomTransport">WebSocket: ${net.socketOpen?'Connected':'Not connected (HTTP polling fallback)'} · HTTP: ${net.lastSyncAt?'Last room response '+new Date(net.lastSyncAt).toLocaleTimeString():'Awaiting room response'}</span><span id="roomComponent">Component schema: ${esc(net.infoStatus)}</span><button type="button" class="modal-secondary" id="checkLooprd">Check Looprd component API</button></div><div class="online-controls"><button class="modal-secondary" id="copyInvite">Copy invitation link</button><button class="modal-secondary" id="disconnectOnline">Disconnect</button></div>`:
 `<p class="modal-lead">To host, choose <b>New Game → Online with a friend</b>. To join, enter the friend's code and Looprd server FQDN below.</p><form id="joinOnlineForm"><label class="field-label">LOOPRD SERVER FQDN<input class="form-input" name="url" type="text" required autocomplete="url" placeholder="api.server.country" value="${server}" /><small>Use your API server address only; /looprd/the-life-loop/v1 is added automatically.</small></label><label class="field-label">FRIEND CODE<input class="form-input" name="code" id="inviteCode" maxlength="15" autocomplete="off" placeholder="ABCD234567" required value="${esc(new URLSearchParams(location.search).get('join')||'')}" /></label><label class="field-label">YOUR LOCAL CHARACTER<select class="form-select" id="joinCharacterPick">${profileOptions(selectedProfile?.id||'')}</select></label><label class="field-label">YOUR DISPLAY NAME<input class="form-input" name="name" maxlength="24" value="${esc(selectedProfile?.name||'Friend')}" required /></label><button class="modal-primary" type="submit">Join friend's game ↗</button></form>`}
 <p class="modal-footnote">Multiplayer requires an external Looprd server over HTTPS/WSS when hosted on GitHub Pages. Invitation links include the server address and game code, never participant tokens. Participant tokens are kept in your browser session. The host must remain connected for guest turns.</p></section>`);
 if(connected){
  $('checkLooprd').addEventListener('click',async()=>{const button=$('checkLooprd');button.disabled=true;try{const outcome=await net.probe();toast(outcome);}catch(e){toast('Looprd check failed: '+e.message,true);}finally{if($('overlay').classList.contains('open')&&$('overlay').querySelector('#roomDiagnostics'))onlineDialog();}});
  $('copyInvite').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(net.inviteLink());toast('Invite link copied');}catch(e){toast('Copy unavailable: '+e.message,true);}});
  $('disconnectOnline').addEventListener('click',()=>{net.disconnect();closeOverlay();toast('Disconnected from multiplayer');});
 }else{
  $('joinCharacterPick').addEventListener('change',e=>{const p=characters.all().find(x=>x.id===e.target.value);if(p)$('joinOnlineForm').elements.name.value=p.name;});
  $('joinOnlineForm').addEventListener('submit',async e=>{
   e.preventDefault();const fd=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('[type=submit]');btn.disabled=true;
   try{await net.join(String(fd.get('url')),String(fd.get('code')),String(fd.get('name')));closeOverlay();toast('Connected to '+net.code+'!');}
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
function showModal(html,kind='modal'){$('overlay').dataset.kind=kind;$('overlay').innerHTML=html;$('overlay').classList.add('open');}
function confirmEmploymentSwitch(actionId){
 const p=game.player,oldJob=game.getJob(p),nextJob=job(actionId.split(':')[1]);
 if(!oldJob||!nextJob||oldJob.id===nextJob.id)return false;
 showModal(`<section class="modal compact" aria-label="Confirm job change"><div class="modal-head"><div><span class="eyebrow dark">ONE ACTIVE JOB AT A TIME</span><h2>Change employers?</h2></div><button class="modal-close" data-close aria-label="Cancel job change">×</button></div><p class="modal-lead">A successful application replaces your current position. If you are refused, you keep your existing job. You cannot work for both employers.</p><div class="employment-comparison"><div><small>CURRENT POSITION</small><strong>${esc(oldJob.name)}</strong><span>${esc(oldJob.employer||placeLabel(oldJob.place))} · ${fmt(p.wage)}/hour</span></div><div class="employment-switch-arrow">→</div><div><small>NEW POSITION</small><strong>${esc(nextJob.name)}</strong><span>${esc(nextJob.employer||placeLabel(nextJob.place))} · ${fmt(game.offeredWage(nextJob))}/hour</span></div></div><p class="modal-footnote">Applying costs ${game.rules.applicationHours} hours. If the application succeeds, the new job replaces your old one. A rejection costs time but never cancels your existing job.</p><button class="modal-primary" id="confirmEmploymentBtn" type="button">Apply for new position</button><button class="modal-secondary" data-close type="button">Keep my current job</button></section>`);
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
 return `<div class="profile-preview">${Characters.avatar(profile,'preview')}<div><strong>${esc(profile.name)}</strong><small>${esc(Characters.PERSONALITY[profile.personality])} · ${esc(Characters.HAIR[profile.hair])} · ${esc(Characters.OUTFIT[profile.outfit])}</small></div></div>`;
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
 const p=found||{name:'',...Characters.normalizeAppearance(null)};
 const field=(name,title,options)=>`<label class="character-field"><span class="field-label">${title}</span><select class="form-select" name="${name}">${Object.entries(options).map(([key,label])=>`<option value="${esc(key)}" ${p[name]===key?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
 showModal(`<section class="modal characters-modal" aria-label="${found?'Edit':'Create'} a character"><div class="modal-head"><div><span class="eyebrow dark">CHARACTER STUDIO</span><h2>${found?'Edit your character':'Create a character'}</h2><p class="modal-lead">Your style and personality are for storytelling; they never change wages, skills, or Classic rules.</p></div><button class="modal-close" id="cancelCharacter" type="button" aria-label="Back">×</button></div>
 <div class="character-workspace"><div class="character-preview-pane"><div id="editorAvatar">${Characters.avatar(p,'editor')}</div><strong id="editorName">${esc(p.name||'Your character')}</strong><small>Preview updates as you customize.</small></div>
 <form id="characterForm" class="character-form"><label class="character-field"><span class="field-label">CHARACTER NAME</span><input class="form-input" type="text" name="name" maxlength="24" value="${esc(p.name)}" placeholder="Your character's name" required /></label><div class="character-form-grid">${field('skin','Skin tone',Object.fromEntries(Object.keys(Characters.SKIN).map(v=>[v,v[0].toUpperCase()+v.slice(1)])))}${field('hair','Hair style',Characters.HAIR)}${field('hairColor','Hair color',Object.fromEntries(Object.keys(Characters.HAIR_COLOR).map(v=>[v,v[0].toUpperCase()+v.slice(1)])))}${field('outfit','Outfit',Characters.OUTFIT)}${field('accent','Favorite color',Object.fromEntries(Object.keys(Characters.ACCENT).map(v=>[v,v[0].toUpperCase()+v.slice(1)])))}${field('mood','Expression',Characters.MOOD)}${field('personality','Personality',Characters.PERSONALITY)}</div>
 <button class="modal-primary" type="submit">${found?'Save character':'Create & select'} ↗</button></form></div></section>`,'characters');
 $('cancelCharacter').addEventListener('click',()=>showCharacterLibrary(returnTo));
 const form=$('characterForm');
 form.addEventListener('input',()=>{const v=Object.fromEntries(new FormData(form));$('editorAvatar').innerHTML=Characters.avatar(v,'editor');$('editorName').textContent=v.name||'Your character';});
 form.addEventListener('submit',e=>{e.preventDefault();try{
   const v=Object.fromEntries(new FormData(form));if(found)v.id=found.id;
   characters.upsert(v);showCharacterLibrary(returnTo);toast('Character saved locally.');
  }catch(err){toast(err.message,true);}});
}
function newGameDialog(isInitial=false){
 const saved=restore(),selectedProfile=characters.selected();
 showModal(`<section class="modal" aria-label="Create a new game"><div class="modal-head"><div><span class="eyebrow dark">WELCOME TO YOUR NEXT CHAPTER</span><h2>Life is what you make it. <span style="color:#6ba86a">✳</span></h2><p class="modal-lead">Set your goals, pick your competition, and choose Classic or Modern rules, and explore a different era.<br/>You can earn, learn, shop, recharge, and live a little.</p></div>${isInitial?'':'<button class="modal-close" data-close aria-label="Close">×</button>'}</div>
 <form id="startForm"><div class="new-settings-block character-pick-block"><div class="section-heading"><span>YOUR CHARACTER</span><span class="muted micro">SAVED LOCALLY</span></div><div class="character-picker-row"><label class="character-field"><span class="field-label">CHOOSE A CHARACTER</span><select class="form-select" id="characterPick" name="characterId">${profileOptions(selectedProfile?.id||'')}</select></label><button type="button" class="modal-secondary character-manage-btn" id="manageCharactersBtn">◉ Create / manage characters</button></div><div id="characterPickPreview">${profilePreview(selectedProfile)}</div></div><div class="new-form"><label><div class="field-label">YOUR NAME</div><input class="form-input" name="name" maxlength="24" value="${esc(selectedProfile?.name||'You')}" required /></label><label><div class="field-label">GAME MODE</div><select class="form-select" id="gameMode" name="mode"><option value="solo">Solo vs. The Rival (AI)</option><option value="hotseat">2 humans · same computer</option><option value="online">Online co-op · friend code + Looprd</option><option value="sandbox">Relaxed · Play alone</option></select></label><label id="friendField" style="display:none;grid-column:1/-1"><div class="field-label">PLAYER 2 NAME</div><input class="form-input" name="friend" maxlength="24" value="Player 2" /><span class="field-label">PLAYER 2 LOCAL CHARACTER (OPTIONAL)</span><select class="form-select" id="friendCharacterPick" name="friendCharacterId">${profileOptions('')}</select></label><label id="onlineServerField" style="display:none;grid-column:1/-1"><div class="field-label">LOOPRD SERVER FQDN</div><input class="form-input" name="onlineServer" id="onlineServer" autocomplete="url" value="${esc(window.LifeOnline.suggestedServer())}" placeholder="api.server.country" /><small>Enter only the API server address; /looprd/the-life-loop/v1 is automatic. The room code appears after creation.</small></label></div>
 <div class="new-settings-block" aria-label="Ruleset selection"><div class="section-heading"><span>GAME RULES</span><span class="muted micro">CHANGES GAMEPLAY</span></div><div class="setup-options setup-rules">
 <label class="setup-choice"><input type="radio" name="ruleset" value="classic" checked/><span class="setup-choice-text"><b>♟ Classic Rules</b><small>60h weeks · 11 diplomas · dismissal risk · career caps</small><em>Original parity is still in progress</em></span></label>
 <label class="setup-choice"><input type="radio" name="ruleset" value="modern"/><span class="setup-choice-text"><b>✦ Modern Story</b><small>40-hour weeks · friendships · civic projects and events</small><em>Existing game balance</em></span></label></div></div>
 <div class="new-settings-block" aria-label="World era selection"><div class="section-heading"><span>WORLD ERA</span><span class="muted micro">VISUALS ONLY · SAME ECONOMY</span></div><div class="setup-options setup-eras">${Object.entries(D.worldEras).map(([key,era])=>`<label class="setup-choice era-option"><input type="radio" name="era" value="${key}" ${key==='current'?'checked':''}/><span class="setup-era-art">${Art.scene('office',true,key)}</span><span class="setup-choice-text"><b>${esc(era.label)}</b><small>${esc(era.city)}</small></span></label>`).join('')}</div><p class="setup-explain">The era changes buildings, citizens' outfits, and city names. It does not change wages, prices or career rules.</p></div>
 <div class="goal-settings"><div class="section-heading"><span>Choose your life goals</span><span class="muted micro">LOWER = SHORTER GAME</span></div>${D.GOAL_KEYS.map((key,i)=>`<label class="modal-goal"><span>${{wealth:'💰 Wealth',happiness:'☀️ Happiness',education:'🎓 Education',career:'🚀 Career'}[key]}</span><input type="range" class="range" name="${key}" min="10" max="100" step="5" value="${[40,55,50,45][i]}" aria-label="${key} goal"/><strong data-range-value="${key}">${[40,55,50,45][i]}%</strong></label>`).join('')}</div>
 <button class="modal-primary" type="submit">Let's get living &nbsp; ↗</button></form>${saved?'<button class="modal-secondary" type="button" id="resumeBtn">↺ &nbsp; Continue your saved game (week '+Number(saved.week||1)+')</button>':''}<div class="modal-footnote">Autosaves after every action · Completely offline · Original artwork and code</div></section>`);
 $('manageCharactersBtn').addEventListener('click',()=>showCharacterLibrary('new'));
 $('characterPick').addEventListener('change',e=>{const p=characters.all().find(x=>x.id===e.target.value);$('characterPickPreview').innerHTML=profilePreview(p);if(p)$('startForm').elements.name.value=p.name;});
 $('friendCharacterPick').addEventListener('change',e=>{const p=characters.all().find(x=>x.id===e.target.value);if(p)$('startForm').elements.friend.value=p.name;});
 $('gameMode').addEventListener('change',e=>{$('friendField').style.display=['hotseat','online'].includes(e.target.value)?'block':'none';$('onlineServerField').style.display=e.target.value==='online'?'block':'none';$('onlineServer').required=e.target.value==='online';});
 $('startForm').addEventListener('input',e=>{if(e.target.type==='range'){const el=document.querySelector(`[data-range-value="${e.target.name}"]`);if(el)el.textContent=e.target.value+'%';}});
 $('startForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),online=f.get('mode')==='online';
 if(net.role)net.disconnect();
 game=new Game({name:String(f.get('name')),character:characters.all().find(p=>p.id===f.get('characterId'))||null,friendCharacter:characters.all().find(p=>p.id===f.get('friendCharacterId'))||null,mode:online?'hotseat':String(f.get('mode')),friend:String(f.get('friend')||''),ruleset:String(f.get('ruleset')||'modern'),era:String(f.get('era')||'current'),goals:Object.fromEntries(D.GOAL_KEYS.map(k=>[k,Number(f.get(k))]))});
 didShowWin=false;store();closeOverlay();render();
 if(online){try{await net.host(String(f.get('onlineServer')));onlineDialog();toast('Room created! Share '+net.code+' with your friend.');}catch(err){toast('Server did not create a room: '+err.message,true);newGameDialog();}}
 else toast('Welcome to '+eraMeta().city+' · '+game.rules.name+'!');
});
 if($('resumeBtn'))$('resumeBtn').addEventListener('click',()=>{try{game=Game.load(saved);didShowWin=!!game.winner;closeOverlay();render();toast('Welcome back!');}catch(e){toast('Saved game could not be loaded: '+e.message,true);}});
}
function guide(){showModal(`<section class="modal compact"><div class="modal-head"><div><span class="eyebrow dark">THE PLAYER'S FIELD GUIDE</span><h2>Make every week count.</h2></div><button class="modal-close" data-close aria-label="Close">×</button></div><p class="modal-lead">Like the classic 1990s life-board games, you race to reach four goals at the same time: wealth, happiness, education and career.</p><div class="guide-grid"><div class="guide-item"><b>🕰️ Rules & era</b>Selected rules: ${esc(game.rules.name)} · ${game.rules.hours} hours/week. World: ${esc(eraMeta().label)} (${esc(eraMeta().city)}). Historical and Sci-Fi change only the presentation.</div><div class="guide-item" ${game.isClassic?'hidden':''}><b>💬 Build friendships</b>Talk each week, make meaningful story choices, and earn trust. At 18 trust, each local offers a special favor every four weeks.</div><div class="guide-item" ${game.isClassic?'hidden':''}><b>📖 Follow seasonal stories</b>After meeting a resident, earn trust to unlock three-stage shared stories. Chapter choices affect two residents, and can permanently improve city prices or wages.</div><div class="guide-item"><b>▥ Track your finances</b>Open Finances to see net worth, recent transactions, monthly expenses and your milestones. Moving money between accounts is not income.</div><div class="guide-item" ${game.isClassic?'hidden':''}><b>✷ Follow the City Pulse</b>A new event every four weeks changes prices and wages. Visit its featured venue for a once-per-event opportunity.</div><div class="guide-item"><b>📍 Travel costs time</b>Click any building on the city board to visit it. Farther destinations cost more hours.</div><div class="guide-item"><b>💼 One active job</b>Get hired at Career Center, work only at your employer, and apply there again to change jobs. Switching replaces your old position; you cannot hold two regular jobs.</div><div class="guide-item"><b>🎓 Career pathways</b>Classic has 11 branching diplomas and original DOS occupations; Modern has four staged degrees and specialist certificates. Careers span retail, hospitality, technology, finance, and management.</div><div class="guide-item"><b>🥑 Food, rent, and energy</b>Eat each week, pay monthly rent, rest when tired, and keep an emergency fund. In Classic, visit the Rent Office (Open Door Realty in the current era) during week 4 and every fourth week thereafter to pay rent in cash. Black’s Market offers fresh food in 1/2/4-week bundles; refrigeration holds 6 portions, a freezer expands it to 12. The bank handles monthly loans and six markets with no savings interest.</div><div class="guide-item"><b>👔 Clothing expires</b>Start with 6 weeks of casual clothes. All clothing wears down once each week, even unused. Dress and business outfits cover lower job requirements. Cheap clothes last less time.</div><div class="guide-item"><b>🏁 Beat the competition</b>The Rival takes a turn each week. Meet all four personal goal targets before they do to win.</div></div><p class="modal-lead" style="margin:16px 0 0">Every turn represents a week of life with up to ${game.rules.hours} hours of discretionary time in ${game.isClassic?'Classic (in-progress)':'Modern Story'} rules. Any unused time expires on Sunday. Your game saves locally after each action.</p><button type="button" class="modal-primary" data-close>Got it, let's play ↗</button></section>`);}
function showWinner(){const p=game.players.find(x=>x.id===game.winner);if(!p)return;showModal(`<section class="modal compact winner-center"><div class="winner-art">🏆</div><span class="eyebrow dark">THE FINISH LINE</span><h2>${esc(p.name)} did it!</h2><p class="modal-lead">Four life goals achieved in ${game.week} weeks.<br/>The race was about money, joy, knowledge, and finding your place. What a ride.</p><button class="modal-primary" id="playAgainBtn" type="button">A new life awaits ↗</button><button class="modal-secondary" data-close>Look back at the city</button></section>`);$('playAgainBtn').addEventListener('click',()=>newGameDialog());}
function loadDialog(){showModal(`<section class="modal compact"><div class="modal-head"><div><span class="eyebrow dark">PICK UP WHERE YOU LEFT OFF</span><h2>Welcome back.</h2></div><button class="modal-close" data-close>×</button></div><p class="modal-lead">Restore your latest local autosave or import a saved game JSON file.</p><button class="modal-primary" id="loadLocal">Restore local autosave</button><button class="modal-secondary" id="loadFile">Import a .json file</button><p class="modal-footnote">Loading replaces the current game. Export a save first if you want to keep it.</p></section>`);
 $('loadLocal').addEventListener('click',()=>{try{const data=restore();if(!data)throw Error('No autosave found');game=Game.load(data);didShowWin=!!game.winner;closeOverlay();render();store();toast('Saved game restored.');}catch(e){toast(e.message,true);}});
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
 showModal(`<section class="modal finance-modal" aria-label="Financial history"><div class="modal-head"><div><span class="eyebrow dark">YOUR FINANCIAL STORY · WEEK ${game.week}</span><h2>Where the money goes.</h2><p class="modal-lead">${esc(p.name)} · Actual account changes, not estimated spending</p></div><button class="modal-close" data-close aria-label="Close">×</button></div><div class="finance-metrics"><div><span>NET WORTH</span><strong>${fmt(f.netWorth)}</strong></div><div><span>LAST 4 WEEKS · GAINS</span><strong>${fmt(f.income)}</strong></div><div><span>LAST 4 WEEKS · COSTS</span><strong>${fmt(f.expenses)}</strong></div></div><div class="finance-chart-heading"><b>Wealth over time</b><div class="finance-legend"><span>● Net worth</span><span>● Cash</span></div></div>${graph}<p class="finance-help">Transfers between cash, savings and investments are tracked but not counted as earnings. Weekend bills, rent, interest and investment performance are included in the net change.</p><div class="finance-bottom"><div><h3>Latest transactions</h3><div class="finance-table-scroll"><table class="finance-table"><thead><tr><th>Week</th><th>Activity</th><th>Type</th><th>Net change</th></tr></thead><tbody>${entries}</tbody></table></div></div><div><h3>Life milestones</h3><ol class="finance-milestones">${milestones}</ol></div></div></section>`);
}
function showCareers(){
 if(game.pendingEncounter){toast('Finish the current conversation first.',true);return;}
 const p=game.player;
 const tracks=Object.groupBy?Object.groupBy(game.jobs,j=>j.track||({repair:'Technology',teller:'Finance',tutor:'Academia',analyst:'Business',engineer:'Technology',director:'Business'}[j.id]||'General')):game.jobs.reduce((o,j)=>{const k=j.track||({repair:'Technology',teller:'Finance',tutor:'Academia',analyst:'Business',engineer:'Technology',director:'Business'}[j.id]||'General');(o[k]??=[]).push(j);return o;},{});
 const jobs=Object.entries(tracks).sort((a,b)=>a[0].localeCompare(b[0])).map(([track,roles])=>`<div class="career-track"><h3>${esc(track)}</h3>${roles.slice().sort((a,b)=>a.tier-b.tier).map(j=>{
   const reasons=game.jobReasons(p,j);
   const classicReq=game.isClassic?game.jobRequirement(j):null;
   const isCurrent=p.job===j.id;
   const dressed=game.isDressedFor(p,j);
   return `<div class="career-role ${isCurrent?'active':''}"><div><strong>${esc(j.name)}</strong><small>${esc(j.employer||placeLabel(j.place))} · Level ${j.tier} · ${fmt(j.wage)}/hour base</small><small>${esc(D.clothing[j.clothes].name)} or better${game.isClassic?` · XP ${classicReq.experience} · Reliability ${classicReq.dependability}${classicReq.degrees.length?' · '+classicReq.degrees.map(id=>D.classicDegrees.find(x=>x.id===id).name).join(' + '):''}`:j.course?' · '+esc(D.courses.find(c=>c.id===j.course).name):''}</small></div><span class="career-status">${isCurrent?'CURRENT JOB':reasons.length?esc(reasons.join(' · ')):dressed?'READY TO APPLY':'UNIFORM NEEDED FOR SHIFTS'}</span></div>`;
 }).join('')}</div>`).join('');
 const certs=game.isClassic?D.classicDegrees.map(d=>{
    const prereqs=d.requires.map(id=>D.classicDegrees.find(x=>x.id===id).name);
    const completed=p.classicDegrees.includes(d.id);
    return `<div class="career-course"><strong>${esc(d.name)}</strong><span>${prereqs.length?'Requires '+esc(prereqs.join(' + ')):'Available initially'} · ${game.classicLessons(p)} lessons at 6h · $50 enrollment · +5 reliability on graduation</span><b>${completed?'✓ Degree':`${p.classicProgress[d.id]||0}/${game.classicLessons(p)} lessons${p.classicEnrolled.includes(d.id)?' · ACTIVE':''}`}</b></div>`;
  }).join(''):D.courses.map(c=>`<div class="career-course"><strong>${esc(c.name)}</strong><span>${esc(c.detail)} · ${c.sessions} lessons at ${fmt(c.cost)} base each · requires Education ${c.education}</span><b>${p.coursesCompleted.includes(c.id)?'✓ Complete':`${p.courseProgress[c.id]||0}/${c.sessions} sessions`}</b></div>`).join('');
 showModal(`<section class="modal careers-modal" aria-label="Career progression roadmap"><div class="modal-head"><div><span class="eyebrow dark">YOUR CAREER ROADMAP</span><h2>Find your next chapter.</h2><p class="modal-lead">One job at a time. Apply at the Career Center; shifts require clothing at your workplace. ${game.isClassic?'Classic applications require the listed degrees, Experience and Dependability. Every job has its own stat caps; reliability below requirement − 5 causes dismissal when you try to work.':'Job offers depend on education, experience, reliability, and sometimes a short course.'}</p></div><button class="modal-close" data-close aria-label="Close">×</button></div><div class="careers-wardrobe"><b>Current wardrobe</b>${game.clothingSummary(p).map(x=>`<span class="${x.weeks<=1?'wardrobe-low':''}">${esc(x.name)}: ${x.weeks}w</span>`).join('')}<small>Every category ages once per week, whether used or not.</small></div><h3 class="career-section-title">${game.isClassic?'Eleven Classic diplomas · university':'Specialist certificates · Brightside U'}</h3><div class="career-courses">${certs}</div><h3 class="career-section-title">Career paths</h3><div class="career-tracks">${jobs}</div><p class="modal-footnote">${game.isClassic?'Reference-based Classic progression. 37 documented DOS/floppy jobs, wages, uniforms and degrees are active. Two CD-only jobs and some location/building mechanics are not yet included.':'Base pay changes with the economy at hiring. Current wages can differ after raises. Buying clothing is separate from being eligible to apply.'}</p><button class="modal-primary" data-close type="button">Return to the city</button></section>`);
}
function saveExport(){const file=new Blob([JSON.stringify({format:'the-life-loop-v1',...game.snapshot()},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=`the-life-loop-week-${String(game.week).padStart(2,'0')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Save file exported!');}
$('board').addEventListener('click',async e=>{const btn=e.target.closest('[data-travel]');if(!btn)return;const result=await net.execute('travel',btn.dataset.travel,()=>game.travel(btn.dataset.travel));if(result.ok&&net.role!=='guest'){store();render();}if(result.ok&&mobileBreakpoint.matches)setMobileView('actions');toast(result.message,!result.ok);});
$('actions').addEventListener('change',e=>{if(e.target.id==='classicEmployerFilter'){classicEmployerFilter=e.target.value;render();}});
$('actions').addEventListener('click',async e=>{const btn=e.target.closest('[data-act]');if(!btn||btn.disabled)return;const actionId=btn.dataset.act,location=game.player.location;if(actionId.startsWith('apply:')&&confirmEmploymentSwitch(actionId))return;const result=await net.execute('act',actionId,()=>game.act(actionId));if(result.ok&&net.role!=='guest'){store();render();if(actionId==='chat'&&!game.pendingEncounter)showSmallTalk(result.message,location);}toast(result.message,!result.ok);});
$('endTurnBtn').addEventListener('click',async()=>{const result=await net.execute('endTurn',null,()=>game.endTurn());if(result.ok&&net.role!=='guest'){store();render();}toast(result.message,!result.ok);});
$('guideBtn').addEventListener('click',()=>{setUtilityMenu(false);guide();});
$('charactersBtn').addEventListener('click',()=>{setUtilityMenu(false);showCharacterLibrary('new');});
$('financeBtn').addEventListener('click',showFinances);
$('careerBtn').addEventListener('click',showCareers);
$('newBtn').addEventListener('click',()=>newGameDialog());
$('utilityMenuBtn').addEventListener('click',()=>setUtilityMenu($('utilityMenu').hidden));
$('saveBtn').addEventListener('click',()=>setUtilityMenu(false));
$('loadBtn').addEventListener('click',()=>setUtilityMenu(false));
$('storyDrawerBtn').addEventListener('click',()=>setDrawer('story'));
$('destinationDrawerBtn').addEventListener('click',()=>setDrawer('actions'));
$('drawerScrim').addEventListener('click',closeDrawer);
document.querySelectorAll('[data-close-drawer]').forEach(b=>b.addEventListener('click',closeDrawer));
document.addEventListener('click',e=>{if(!e.target.closest('.utility-holder'))setUtilityMenu(false);});
$('turnConnection').addEventListener('click',onlineDialog);
$('mobileNav').addEventListener('click',e=>{const tab=e.target.closest('[data-mobile-tab]');if(tab)setMobileView(tab.dataset.mobileTab);});
mobileBreakpoint.addEventListener('change',updateLayout);wideScreen.addEventListener('change',updateLayout);drawerScreen.addEventListener('change',updateLayout);
setMobileView('city',{scroll:false});
$('onlineBtn').addEventListener('click',onlineDialog);
$('saveBtn').addEventListener('click',saveExport);
$('loadBtn').addEventListener('click',()=>{if(net.role)toast('Disconnect from Online co-op before loading another game.',true);else loadDialog();});
$('overlay').addEventListener('click',async e=>{const choice=e.target.closest('[data-choose]');if(choice&&!choice.disabled){const r=await net.execute('choose',choice.dataset.choose,()=>game.chooseEncounter(choice.dataset.choose));if(r.ok){$('overlay').dataset.kind='';closeOverlay();if(net.role!=='guest'){store();render();}}toast(r.message,!r.ok);return;}if(e.target.hasAttribute('data-close'))closeOverlay();});
$('filePicker').addEventListener('change',async e=>{if(net.role){toast('Disconnect before importing a save.',true);e.target.value='';return;}const file=e.target.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw Error('Save file is too large');const obj=JSON.parse(await file.text());game=Game.load(obj);didShowWin=!!game.winner;closeOverlay();render();store();toast('Save imported successfully.');}catch(err){toast('Could not load save: '+err.message,true);}e.target.value='';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setUtilityMenu(false);closeDrawer();if($('overlay').classList.contains('open')&&$('overlay').querySelector('[data-close]'))closeOverlay();}});
net=new window.LifeOnline({getGame:()=>game,setGame:snap=>{game=Game.load(snap);didShowWin=!!game.winner;store();render();if(game.pendingEncounter&&net.ownTurn())showEncounter();else if($('overlay').dataset.kind==='encounter'){$('overlay').dataset.kind='';$('overlay').classList.remove('open');$('overlay').innerHTML='';}},render,toast});
render();newGameDialog(true);
net.resume().then(reconnected=>{if(reconnected){$('overlay').dataset.kind='';closeOverlay();toast('Reconnected to room '+net.code);}else if(new URLSearchParams(location.search).has('join'))onlineDialog();});
})();
