/* Browser-only, version-pinned hotloader for TheBigTreeInc/social's canonical
 * ES-module SDK. The Git object SHA1 guards against an unexpected response.
 * No tokens are sent to GitHub; sign-in happens only against the chosen LoopRD.
 * No Social code loads until the user opens an account session.
 */
(function(root,factory){const api=factory(root);root.LifeSocialSdkLoader=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const REVISION='62d46319a44def5d7489dbf533ea0bf9981d4358';
const BLOB_SHA1='28853329696d068f5618f93513ee18d9d10a505a';
const SDK_URL=`https://raw.githubusercontent.com/TheBigTreeInc/social/${REVISION}/client/sdk/looprd-social.js`;
let pending;
async function verify(text,expected=BLOB_SHA1,cryptoProvider=root.crypto){
 if(typeof text!=='string'||text.length<1000||text.length>200000||!cryptoProvider?.subtle)throw Error('Social SDK integrity cannot be verified');
 const bytes=new TextEncoder().encode(text);
 const label=new TextEncoder().encode(`blob ${bytes.length}\0`);
 const framed=new Uint8Array(label.length+bytes.length);framed.set(label);framed.set(bytes,label.length);
 const result=new Uint8Array(await cryptoProvider.subtle.digest('SHA-1',framed));
 const actual=[...result].map(b=>b.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw Error('Social SDK integrity mismatch — no remote code executed');
 return true;
}
async function fetchModule({fetcher=root.fetch?.bind(root),importer=url=>import(url),cryptoProvider=root.crypto}={}){
 if(typeof fetcher!=='function')throw Error('HTTPS Social SDK download unavailable');
 const res=await fetcher(SDK_URL,{cache:'force-cache',mode:'cors',credentials:'omit',redirect:'error'});
 if(!res?.ok)throw Error(`Social SDK download failed (${res?.status||'network'})`);
 const text=await res.text();await verify(text,BLOB_SHA1,cryptoProvider);
 const address=URL.createObjectURL(new Blob([text],{type:'text/javascript'}));
 try{
  const sdk=await importer(address);
  if(typeof sdk?.discoverSocial!=='function'||typeof sdk?.loginSocial!=='function'||typeof sdk?.registerSocial!=='function'||typeof sdk?.LooprdSocial!=='function')
   throw Error('Social SDK contract is incompatible');
  return sdk;
 }finally{URL.revokeObjectURL(address);}
}
function load(){return pending||(pending=fetchModule().catch(e=>{pending=null;throw e;}));}
return Object.freeze({REVISION,BLOB_SHA1,SDK_URL,verify,fetchModule,load});
});
