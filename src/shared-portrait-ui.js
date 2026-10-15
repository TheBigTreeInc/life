/* Browser-only portrait editor UI. Remote connection is opt-in, and never stored. */
(function(root){'use strict';
const kit=root.ModularPortraits,mod=root.LooprdSharedProfile;
const local=mod.createStore((()=>{try{return root.localStorage;}catch{return null;}})());
const cache=new Map();let renderer=null;let activePack='everyday-illustrated',portraitURL=null;
const social=()=>root.LifeLoopSocial;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const defaultName=()=>local.get()?.displayName||'You';
const packURL=(id)=>{if(!Object.hasOwn(mod.PACKS,id))throw Error('Unknown portrait pack');
 const base=typeof root.LooprdPortraitAssetsBase==='string'&&root.LooprdPortraitAssetsBase.trim()?root.LooprdPortraitAssetsBase.replace(/\/$/,'')+'/':null;
 return base?new URL('packs/'+id+'/pack.json',base).href:new URL(mod.PACKS[id],root.location.href).href;};
async function getRenderer(id){if(cache.has(id))return cache.get(id);
 const embedded=root.LooprdPortraitAssetsBase?null:root.LifeEmbeddedPortraitPacks?.[id];
 if(embedded){
  const value=new kit.Renderer(embedded.pack,new URL('https://portrait-bundle.invalid/packs/'+id+'/pack.json'));
  await Promise.all(kit.validatePack(value.pack).map(async file=>{
   const image=document.createElement('img');image.src=embedded.images[file];await image.decode();
   if(image.naturalWidth!==value.pack.canvas[0]||image.naturalHeight!==value.pack.canvas[1])throw Error('Incorrect inline portrait dimensions');
   value.images.set(file,image);
  }));value.ready=true;cache.set(id,value);return value;
 }
 const value=await kit.Renderer.load(packURL(id));cache.set(id,value);return value;
}
function getPortrait(){return portraitURL;}
async function refreshProfilePortrait(){const p=local.get();if(!p?.appearance)return null;
 try{const r=await getRenderer(p.appearance.pack);const v=kit.normalizeIdentity(r.pack,p.appearance,{strict:true});portraitURL=r.toDataURL(v,{size:128});return portraitURL;}catch{portraitURL=null;return null;}}
function saved(){return local.get();}
function open({showModal,onSaved=()=>{},onClose=()=>{}}){
 let input=local.get()||{schema:mod.SCHEMA,profileId:null,displayName:'You',appearance:null};
 let current=input.appearance?.pack||activePack,controls=null,currentRenderer=null,identity=null,sequence=0;
 const source=document.createElement('section');source.className='modal shared-profile-modal';source.setAttribute('aria-label','Shared social profile');
 source.innerHTML=`<div class="modal-head"><div><span class="eyebrow dark">LOOPRD SOCIAL · SHARED IDENTITY</span><h2>My profile & portrait</h2><p class="modal-lead">Your appearance can follow you between games. Game rules, inventory and saves stay with each game.</p></div><button type="button" class="modal-close" data-close aria-label="Close profile">×</button></div>
 <div class="shared-profile-grid"><div class="shared-profile-preview"><canvas id="sharedPortraitCanvas" width="256" height="256" aria-label="Live modular character portrait"></canvas><small id="sharedProfileLoad">Loading illustration…</small><label>Display name<input id="sharedProfileName" maxlength="24" value="${esc(input.displayName)}" /></label><label>Visual style<select id="sharedProfilePack"><option value="everyday-illustrated">Everyday illustrated</option><option value="dominion-pixel">DOMINION pixel</option></select></label><button id="sharedProfileSave" class="modal-primary" type="button">Save local profile</button></div><div class="shared-profile-components" id="sharedProfileComponents" aria-label="Appearance customization"></div></div>
 <details class="shared-profile-connection"><summary>Connect to separate Looprd Social service (optional)</summary><p>Local editing works without a server. The social server is separate from existing game room matchmaking and chat.</p><label>Social server origin<input id="sharedSocialOrigin" placeholder="http://127.0.0.1:8947" autocomplete="url" /></label><label>Access token (kept in memory only)<input id="sharedSocialToken" type="password" autocomplete="off" /></label><div class="shared-profile-buttons"><button type="button" id="sharedSocialConnect">Connect & load</button><button type="button" id="sharedSocialPush">Publish profile</button><button type="button" id="sharedSocialDisconnect">Disconnect</button></div><div class="shared-social-chat" id="sharedSocialChat" hidden><h3>Social lobby · development preview</h3><div id="sharedSocialMessages" class="shared-social-feed" role="log" aria-live="polite"></div><label>Message<input id="sharedSocialMessage" maxlength="320" placeholder="Say hello to connected profiles" /></label><div class="shared-profile-buttons"><button type="button" id="sharedSocialSend">Send</button><button type="button" id="sharedSocialRefresh">Refresh</button></div></div></details><div id="sharedProfileStatus" role="status" aria-live="polite">Profile changes are local until you explicitly publish them.</div>`;
 const get=id=>source.querySelector('#'+id);
 const message=(txt,isError=false)=>{const e=get('sharedProfileStatus');e.textContent=txt;e.classList.toggle('is-error',isError);};
 const draw=()=>{if(!currentRenderer||!identity)return;currentRenderer.render(identity,{canvas:get('sharedPortraitCanvas'),size:256});};
 const load=async(id,custom=null)=>{const counter=++sequence;controls?.destroy();get('sharedProfileComponents').textContent='Loading portrait pack…';get('sharedProfileLoad').textContent='Loading '+id+'…';try{
  const r=await getRenderer(id);if(counter!==sequence)return;
  current=id;currentRenderer=r;renderer=r;
  identity=custom?.pack===id?kit.normalizeIdentity(r.pack,custom,{strict:true}):kit.normalizeIdentity(r.pack);
  controls=root.ModularPortraitEditor.mount(get('sharedProfileComponents'),r,identity,{onChange:v=>{identity=v;draw();}});
  get('sharedProfileLoad').textContent='Change any option to update the preview.';draw();
 }catch(e){currentRenderer=null;get('sharedProfileComponents').textContent='Portrait pack could not load. Serve the game through HTTP or configure an HTTPS art host.';get('sharedProfileLoad').textContent='Art unavailable';message(e.message,true);}};
 get('sharedProfilePack').value=current;
 get('sharedProfilePack').addEventListener('change',e=>load(e.target.value));
 get('sharedProfileSave').addEventListener('click',async()=>{try{if(!currentRenderer||!identity)throw Error('Please wait for a portrait pack to load');const clean=mod.validateProfile({schema:mod.SCHEMA,profileId:input.profileId,displayName:get('sharedProfileName').value,appearance:kit.normalizeIdentity(currentRenderer.pack,identity,{strict:true})},kit,currentRenderer.pack);
  input=local.set(clean);activePack=current;portraitURL=currentRenderer.toDataURL(identity,{size:128});onSaved(clean,portraitURL);message('Profile saved locally. Not published to the social server.');}catch(e){message(e.message,true);}});
 const loadChat=async()=>{if(!social()?.connected)return;await social().refresh();const target=get('sharedSocialMessages');target.replaceChildren();for(const m of social().messages.slice(-25)){const line=document.createElement('p');const who=document.createElement('strong');who.textContent=m.name+': ';line.append(who,document.createTextNode(m.text));target.append(line);}target.scrollTop=target.scrollHeight;};
 get('sharedSocialOrigin').value=social()?.suggestedOrigin||'';
 get('sharedSocialRefresh').onclick=async()=>{try{await loadChat();}catch(e){message(e.message,true);}};
 get('sharedSocialSend').onclick=async()=>{try{if(!social()?.connected)throw Error('Connect to Social first');await social().sendChat(get('sharedSocialMessage').value);get('sharedSocialMessage').value='';await loadChat();}catch(e){message(e.message,true);}};
 get('sharedSocialConnect').onclick=async()=>{try{if(!social())throw Error('Social service adapter not available');const incoming=await social().connect(get('sharedSocialOrigin').value,get('sharedSocialToken').value);get('sharedSocialToken').value='';get('sharedSocialChat').hidden=false;input=local.set(incoming);get('sharedProfileName').value=incoming.displayName;get('sharedProfilePack').value=incoming.appearance?.pack||'everyday-illustrated';await load(get('sharedProfilePack').value,incoming.appearance);await refreshProfilePortrait();onSaved(input,portraitURL);await loadChat();message('Social profile connected. Game room credentials remain separate.');}catch(e){message(e.message,true);}};
 get('sharedSocialPush').onclick=async()=>{try{if(!social()?.connected)throw Error('Connect to Social first');const outgoing=local.get();if(!outgoing)throw Error('Save the local profile first');const updated=await social().saveProfile(outgoing);input=local.set(updated);message('Profile published to your Social service.');}catch(e){message(e.message,true);}};
 get('sharedSocialDisconnect').onclick=()=>{social()?.disconnect();get('sharedSocialToken').value='';get('sharedSocialChat').hidden=true;message('Social session disconnected. Local profile preserved.');};
 if(social()?.connected){get('sharedSocialChat').hidden=false;loadChat().catch(()=>{});}
 const overlay=document.getElementById('overlay');overlay.dataset.kind='shared-profile';overlay.replaceChildren(source);overlay.classList.add('open');
 load(current,input.appearance);
 return {node:source,onClose:()=>{sequence++;controls?.destroy();onClose();}};
}
root.LifeSharedPortraitUI={saved,defaultName,getPortrait,refreshProfilePortrait,open,packURL};
})(typeof globalThis!=='undefined'?globalThis:this);
