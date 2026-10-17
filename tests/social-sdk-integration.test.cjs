'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
const loader=require('../src/looprd-social-sdk-loader.js');
require('../src/looprd-shared-profile.js');
const {SocialSession}=require('../src/looprd-social-session.js');
const PROFILE={schema:'looprd.social.profile/v1',profileId:'acct_1',displayName:'Player',appearance:null};
test('SDK URL is pinned to one immutable Git commit and original Git blob',()=>{
 assert.match(loader.SDK_URL,/^https:\/\/raw\.githubusercontent\.com\/TheBigTreeInc\/social\/[0-9a-f]{40}\/client\/sdk\/looprd-social\.js$/);
 assert.match(loader.BLOB_SHA1,/^[0-9a-f]{40}$/);
 assert.equal(loader.SDK_URL.includes('/main/'),false);
});
test('remote module verification refuses altered bytes BEFORE importing',async()=>{
 const text='a'.repeat(1500);const expected=createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');
 assert.equal(await loader.verify(text,expected,webcrypto),true);
 await assert.rejects(loader.verify(text+'!',expected,webcrypto),/integrity mismatch/);
 let attempted=false;
 await assert.rejects(loader.fetchModule({fetcher:async()=>({ok:true,text:async()=>text}),cryptoProvider:webcrypto,importer:async()=>{attempted=true;return {};}}),/integrity mismatch/);
 assert.equal(attempted,false);
});
test('Social account signs in through the canonical SDK; no tokens or passwords persisted',async()=>{
 const storage=new Map(),calls=[];const store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const token='account-secret-token-that-must-stay-in-memory';
 const account={token,me:async()=>({ok:true,profile:PROFILE,revision:4}),feed:async()=>({ok:true,messages:[{id:1,authorId:'acct_1',displayName:'Player',text:'hello',at:1}]}),send:async t=>{calls.push(['chat',t]);},saveProfile:async (p,rev)=>{calls.push(['revision',rev]);return {ok:true,profile:p,revision:rev+1};},logout:async()=>{calls.push(['logout']);}};
 const sdk={normalizeServer:x=>new URL(x).origin,loginSocial:async(origin,user,password)=>{calls.push(['login',origin,user,password]);return account;},registerSocial:async()=>account};
 const s=new SocialSession({store,Client:null});await s.signIn('https://api.example.org','alice','longpasswordhere',{SDK:sdk});
 assert.equal(s.connected,true);assert.equal(s.profile.displayName,'Player');assert.equal(s.messages[0].text,'hello');
 await s.sendChat('ping');await s.saveProfile(PROFILE);assert.ok(calls.some(x=>x[0]==='revision'&&x[1]===4));
 assert.equal(JSON.stringify([...storage]).includes(token),false);assert.equal(JSON.stringify([...storage]).includes('longpasswordhere'),false);
 await s.signOut();assert.equal(s.connected,false);assert.equal(account.token,'');assert.ok(calls.some(x=>x[0]==='logout'));
});
test('Social registration uses account-specific SDK operation, not local player creation',async()=>{
 const s=new SocialSession({Client:null}),calls=[];
 const client={token:'t'.repeat(40),me:async()=>({ok:true,profile:PROFILE,revision:1}),feed:async()=>({ok:true,messages:[]}),logout:async()=>{}};
 const sdk={normalizeServer:x=>x,loginSocial:()=>{throw Error('Wrong operation');},registerSocial:async(origin,user,password)=>{calls.push({origin,user,password});return client;}};
 await s.signIn('https://social.example','newplayer','password12chars',{register:true,SDK:sdk});
 assert.equal(calls.length,1);assert.equal(s.connected,true);s.disconnect();
});
test('browser release includes Social account form, pinned loader and no dev-token requirement',()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/id="chatSocialUsername"/);assert.match(html,/id="chatSocialRegister"/);
 assert.match(html,/src\/looprd-social-sdk-loader\.js/);assert.doesNotMatch(html,/id="chatSocialToken"/);
 assert.match(fs.readFileSync(path.join(root,'src/app.js'),'utf8'),/social\.signIn\(/);
});
