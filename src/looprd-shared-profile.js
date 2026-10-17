/* Reusable profile and social-lobby client. Game room credentials remain independent. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.LooprdSharedProfile=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='looprd.social.profile/v1', KEY='looprd.shared-profile.v1';
const PACKS=Object.freeze({'everyday-illustrated':'assets/modular-portraits/packs/everyday-illustrated/pack.json','dominion-pixel':'assets/modular-portraits/packs/dominion-pixel/pack.json'});
const isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
const text=(s,max)=>String(s??'').replace(/[\x00-\x1f\x7f<>]/g,'').trim().slice(0,max);
function validateProfile(input,portraitAPI=typeof globalThis!=='undefined'?globalThis.ModularPortraits:null,pack=null){
 if(!isObj(input))throw Error('Invalid shared profile');
 if(input.schema!==undefined&&input.schema!==SCHEMA)throw Error('Unsupported shared profile schema');
 const name=text(input.displayName,24);if(!name)throw Error('Display name is required');
 const profileId=input.profileId===null||input.profileId===undefined?null:String(input.profileId);
 if(profileId!==null&&!(/^[a-zA-Z0-9_-]{8,72}$/.test(profileId)||/^acct_[1-9][0-9]{0,15}$/.test(profileId)))throw Error('Invalid profile ID');
 const appearance=input.appearance??null;
 if(appearance!==null){
  if(!isObj(appearance)||appearance.schema!=='modular-portraits.identity/v1'||!Object.hasOwn(PACKS,appearance.pack)||!Number.isInteger(appearance.revision)||JSON.stringify(appearance).length>16384)throw Error('Unsupported portrait identity');
  if(pack&&portraitAPI)portraitAPI.normalizeIdentity(pack,appearance,{strict:true});
 }
 return {schema:SCHEMA,profileId,displayName:name,appearance:appearance?JSON.parse(JSON.stringify(appearance)):null};
}
function createStore(storage){
 const get=()=>{try{const raw=storage?.getItem(KEY);return raw?validateProfile(JSON.parse(raw)):null;}catch{return null;}};
 const set=v=>{const clean=validateProfile(v);if(!storage)throw Error('Browser profile storage is unavailable');storage.setItem(KEY,JSON.stringify(clean));return clean;};
 const clear=()=>storage?.removeItem(KEY);
 return {get,set,clear};
}
function endpoint(input){
 const url=new URL(input);if(url.username||url.password||url.search||url.hash)throw Error('Social URL must not contain credentials or parameters');
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&local))throw Error('Social connections require HTTPS except for localhost');
 if(!['/','', '/looprd/looprd-social/v1','/looprd/looprd-social/v1/'].includes(url.pathname))throw Error('Use a Social server origin or its /looprd/looprd-social/v1 prefix');return url.origin;
}
function socialAddress(input,transport='auto'){
 const url=new URL(input);const origin=endpoint(input);
 const mode=transport==='auto'?(url.pathname.startsWith('/looprd/')?'native':(['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.port==='8947'?'bridge':'native')):transport;
 if(!['native','bridge'].includes(mode))throw Error('Invalid Social transport');
 if(mode==='bridge'&&url.pathname!=='/'&&url.pathname!=='')throw Error('Development bridge accepts an origin only');
 return {origin,mode,base:mode==='native'?origin+'/looprd/looprd-social/v1':origin};
}
class SocialClient{
 constructor(origin,token,{fetcher=fetch,transport='auto'}={}){const addr=socialAddress(origin,transport);Object.assign(this,addr);this.token=String(token||'');if(!this.token||this.token.length>8192)throw Error('An access token is required');this.fetcher=fetcher;}
 async request(method,path,payload){
  if(!this.token)throw Error('Social connection is disconnected');
  const native=this.mode==='native';
  const nativeOps={'/v1/me':method==='GET'?'me':'save_profile','/v1/chat/lobby':method==='GET'?'chat_feed':'chat_send'};
  const url=native?this.base+'/social':this.base+path;
  const body=native?{op:nativeOps[path],token:this.token,...(payload?method==='PUT'?{profile:payload}:payload:{})}:payload;
  const res=await this.fetcher(url,{method:native?'POST':method,headers:native?{'Content-Type':'application/json'}:{Authorization:'Bearer '+this.token,...(payload?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!res.ok)throw Error('Looprd Social HTTP '+res.status);
  const output=await res.json();if(native&&output?.ok!==true)throw Error(String(output?.error||'Social operation rejected').slice(0,240));
  if(!native)return output;
  return path==='/v1/me'?output.profile:path==='/v1/chat/lobby'&&method==='GET'?{schema:output.schema,messages:output.messages}:output.message;
 }
 async me(){return validateProfile(await this.request('GET','/v1/me'));}
 async chatFeed(){return this.request('GET','/v1/chat/lobby');}
 async sendChat(message){const text=String(message??'').trim();if(!text||text.length>320)throw Error('Chat message length must be 1–320 characters');return this.request('POST','/v1/chat/lobby',{text});}
 async saveProfile(profile){return validateProfile(await this.request('PUT','/v1/me',validateProfile(profile)));}
 disconnect(){this.token='';}
}
return {SCHEMA,KEY,PACKS,validateProfile,createStore,endpoint,socialAddress,SocialClient};
});
