/* Page-scoped Social connection for both the profile editor and the game Chat panel.
 * Development credential is held in memory only, never in game snapshots/storage/URLs.
 */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.LooprdSocialSession=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const STORE_KEY='the-life-loop.social-origin.v1';
const safeMessages=feed=>{if(!feed||!Array.isArray(feed.messages))throw Error('Invalid Social chat response');return feed.messages.slice(-50).filter(m=>m&&Number.isSafeInteger(m.id)&&m.id>=0&&typeof m.text==='string').map(m=>({id:m.id,authorId:String(m.authorId||'').slice(0,72),name:String(m.displayName||'Player').slice(0,24),text:m.text.slice(0,320),at:m.at}));};
class SocialSession{
 constructor({Client=root.LooprdSharedProfile?.SocialClient,store=null,onChange=()=>{},onProfile=()=>{},fetcher}={}){
  this.Client=Client;this.store=store;this.onChange=onChange;this.onProfile=onProfile;this.fetcher=fetcher;this.client=null;this.account=false;this.profileRevision=0;this.profile=null;this.messages=[];this.status='Not connected';this.error='';this.unread=0;this.active=false;this.polling=false;this.timer=null;this.generation=0;this.initialFeed=false;
 }
 get connected(){return !!this.client?.token;}
 get suggestedOrigin(){try{return this.store?.getItem(STORE_KEY)||'https://api.thebigtree.life';}catch{return 'https://api.thebigtree.life';}}
 emit(){this.onChange(this);}
 async connect(origin,token,{transport='auto'}={}){
  const client=new this.Client(origin,token,{transport,...(this.fetcher?{fetcher:this.fetcher}:{})});
  const profile=await client.me(); // Old live session remains intact if verification fails.
  this.activate(origin,client,profile,false,0);
  await this.refresh({quiet:true});
  return profile;
 }
 activate(origin,client,profile,account=false,revision=0){
  this.disconnect();this.client=client;this.profile=profile;this.account=account;this.profileRevision=revision;this.status='Connected';this.error='';
  try{this.store?.setItem(STORE_KEY,origin);}catch{}
  this.onProfile(profile);this.emit();
  this.timer=setInterval(()=>{if(root.document?.visibilityState==='hidden')return;this.refresh({quiet:true}).catch(()=>{});},8000);
 }
 async signIn(origin,username,password,{register=false,SDK=null}={}){
  const sdk=SDK||await root.LifeSocialSdkLoader.load();
  // The SDK authenticates directly with Social. Never send these credentials to the game backend.
  const canonical=sdk.normalizeServer(origin);
  const client=register?await sdk.registerSocial(canonical,username,password,this.fetcher):await sdk.loginSocial(canonical,username,password,this.fetcher);
  const me=await client.me();
  if(me?.ok!==true||!me.profile||!Number.isSafeInteger(me.revision))throw Error('Social profile response incompatible');
  const profile=root.LooprdSharedProfile.validateProfile(me.profile);
  this.activate(canonical,client,profile,true,me.revision);
  await this.refresh({quiet:true});
  return profile;
 }
 async signOut(){
  const client=this.client,account=this.account;
  try{if(account&&client?.token)await client.logout();}finally{this.disconnect();}
 }
 disconnect(){this.generation++;if(this.timer!==null)clearInterval(this.timer);this.timer=null;if(this.client){if(this.account)this.client.token='';else this.client.disconnect();}this.client=null;this.account=false;this.profileRevision=0;this.profile=null;this.messages=[];this.unread=0;this.initialFeed=false;this.polling=false;this.status='Not connected';this.error='';this.emit();}
 setActive(visible){this.active=!!visible;if(visible){this.unread=0;this.emit();}}
 async refresh({quiet=false}={}){
  if(!this.connected||this.polling)return;
  const revision=this.generation,client=this.client;this.polling=true;
  try{
   const messages=safeMessages(await (this.account?client.feed():client.chatFeed()));
   if(this.generation!==revision||client!==this.client)return;
   const oldMax=this.messages.reduce((n,m)=>Math.max(n,m.id),0);
   if(this.initialFeed&&!this.active){this.unread=Math.min(99,this.unread+messages.filter(m=>m.id>oldMax&&m.authorId!==this.profile?.profileId).length);}
   this.initialFeed=true;this.messages=messages;this.status='Connected';this.error='';this.emit();
  }catch(e){if(this.generation===revision&&client===this.client){this.status='Connection interrupted';this.error=e.message;this.emit();if(!quiet)throw e;}}
  finally{if(this.generation===revision)this.polling=false;}
 }
 async sendChat(message){if(!this.connected)throw Error('Connect to Looprd Social first');await (this.account?this.client.send(message):this.client.sendChat(message));await this.refresh();}
 async saveProfile(p){if(!this.connected)throw Error('Connect to Looprd Social first');const result=this.account?await this.client.saveProfile(p,this.profileRevision):await this.client.saveProfile(p);
  const profile=root.LooprdSharedProfile.validateProfile(this.account?result.profile:result);
  if(this.account){if(!Number.isSafeInteger(result.revision))throw Error('Invalid profile revision');this.profileRevision=result.revision;}
  this.profile=profile;this.emit();return profile;}
}
return {SocialSession,safeMessages,STORE_KEY};
});
