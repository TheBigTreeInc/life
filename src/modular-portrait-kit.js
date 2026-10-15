/* Modular Portrait Kit — dependency-free browser canvas renderer and save contract. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ModularPortraits = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function() {
  'use strict';
  const SCHEMA = 'modular-portraits.identity/v1';
  const PACK_SCHEMA = 'modular-portraits.pack/v1';
  const HEX = /^#[0-9a-f]{6}$/i;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = x => x && typeof x === 'object' && !Array.isArray(x);
  const clone = x => JSON.parse(JSON.stringify(x));
  function validatePack(pack) {
    if (!object(pack) || pack.schema !== PACK_SCHEMA || !/^[a-z0-9-]+$/.test(pack.id)) throw Error('Unsupported art pack.');
    if (!Number.isInteger(pack.revision) || pack.revision < 1) throw Error('Invalid pack revision.');
    if (!Number.isInteger(pack.logicalSize) || pack.logicalSize < 32 || pack.logicalSize > 1024) throw Error('Invalid logical canvas size.');
    if (!Array.isArray(pack.canvas) || pack.canvas.length !== 2 || pack.canvas.some(v=>!Number.isInteger(v)||v<32||v>4096)) throw Error('Invalid source canvas.');
    if (!object(pack.slots) || !object(pack.colors) || !Array.isArray(pack.layers)) throw Error('Incomplete art pack.');
    const files = new Set();
    for (const [key, slot] of Object.entries(pack.slots)) {
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key) || !object(slot) || !Array.isArray(slot.options) || !slot.options.length) throw Error('Invalid component slot.');
      const ids = new Set();
      for (const option of slot.options) {
        if (!object(option) || !/^[a-z0-9-]+$/.test(option.id) || ids.has(option.id)) throw Error('Invalid or duplicate component ID.');
        ids.add(option.id);
        if (option.asset) {
          if (!/^[a-zA-Z0-9_./-]+\.(png|webp)$/.test(option.asset) || option.asset.startsWith('/') || option.asset.split('/').includes('..')) throw Error('Asset must be a relative image path within the pack.');
          files.add(option.asset);
        }
        for (const prop of ['scale','offset']) {
          if (option[prop] && (!Array.isArray(option[prop]) || option[prop].length !== 2 || option[prop].some(v => !Number.isFinite(v)))) throw Error('Invalid component registration.');
        }
        if (option.scale?.some(v => v <= 0 || v > 2)) throw Error('Invalid component scale.');
        if (option.frontFromY !== undefined && (!Number.isFinite(option.frontFromY) || option.frontFromY < 0 || option.frontFromY > 1)) throw Error('Invalid collar overlap.');
      }
      if (!ids.has(slot.default)) throw Error('Missing slot default.');
    }
    for (const [key,color] of Object.entries(pack.colors)) {
      if(!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key))throw Error('Invalid color key.');
      if (!object(color) || !HEX.test(color.default)) throw Error('Invalid color default.');
      if(color.swatches && (!Array.isArray(color.swatches)||!color.swatches.length||color.swatches.some(v=>typeof v!=='string'||!HEX.test(v))))throw Error('Invalid color swatches.');
    }
    for (const layer of pack.layers) {
      if (!object(layer) || !own(pack.slots, layer.slot)) throw Error('Layer refers to an unknown slot.');
      if (layer.color && !own(pack.colors, layer.color)) throw Error('Layer refers to an unknown color.');
      if (layer.accent && !own(pack.colors, layer.accent)) throw Error('Layer refers to an unknown accent.');
    }
    return [...files];
  }
  function normalizeIdentity(pack, input = {}, {strict = false} = {}) {
    validatePack(pack);
    if (!object(input)) throw Error('Appearance must be an object.');
    if (own(input,'schema') && input.schema !== SCHEMA) throw Error('Unsupported appearance version.');
    if (own(input,'pack') && input.pack !== pack.id) throw Error('Appearance belongs to another art pack.');
    if (own(input,'revision') && input.revision !== pack.revision) throw Error('Unsupported art pack revision.');
    if (own(input,'choices') && !object(input.choices)) throw Error('Component choices must be an object.');
    if (own(input,'colors') && !object(input.colors)) throw Error('Colors must be an object.');
    const result = {schema: SCHEMA, pack: pack.id, revision: pack.revision, choices: {}, colors: {}};
    for (const [key, slot] of Object.entries(pack.slots)) {
      const candidate = input.choices?.[key];
      const valid = slot.options.some(o => o.id === candidate);
      if (strict && candidate !== undefined && !valid) throw Error('Unknown '+key+' option.');
      result.choices[key] = valid ? candidate : slot.default;
    }
    for (const [key, color] of Object.entries(pack.colors)) {
      const candidate = input.colors?.[key];
      if (strict && candidate !== undefined && (typeof candidate !== 'string' || !HEX.test(candidate))) throw Error('Invalid '+key+' color.');
      result.colors[key] = typeof candidate === 'string' && HEX.test(candidate) ? candidate.toLowerCase() : color.default;
    }
    return result;
  }
  function serialize(pack, appearance) { return JSON.stringify(normalizeIdentity(pack, appearance, {strict:true})); }
  function deserialize(pack, text) {
    if (typeof text !== 'string' || text.length > 16384) throw Error('Appearance file is invalid or too large.');
    return normalizeIdentity(pack, JSON.parse(text), {strict:true});
  }
  function randomIdentity(pack, rng = Math.random) {
    const value = normalizeIdentity(pack);
    const pick = array => array[Math.min(array.length-1, Math.max(0, Math.floor(rng()*array.length)))];
    for (const [key,slot] of Object.entries(pack.slots)) value.choices[key] = pick(slot.options).id;
    for (const [key,color] of Object.entries(pack.colors)) if (color.swatches?.length) value.colors[key] = pick(color.swatches);
    return value;
  }
  const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
  const mix = (a,b,t) => a*(1-t)+b*t;
  const smooth = (lo,hi,v) => { const t=Math.max(0,Math.min(1,(v-lo)/(hi-lo))); return t*t*(3-2*t); };
  function recolor(data, primary, accent, {steps=8,preserveChroma=false,whiteThreshold=.94} = {}) {
    const p=rgb(primary), a=rgb(accent);
    for (let i=0;i<data.length;i+=4) {
      if (!data[i+3]) continue;
      const source=[data[i]/255,data[i+1]/255,data[i+2]/255];
      const lum=source[0]*.2126+source[1]*.7152+source[2]*.0722;
      const chroma=Math.max(...source)-Math.min(...source);
      if (preserveChroma && (chroma>.14 || lum>whiteThreshold)) continue;
      const shade=steps > 1 ? Math.floor(Math.min(lum,.999)*steps)/(steps-1) : lum;
      for (let c=0;c<3;c++) {
        const tone=mix(p[c],a[c],smooth(.55,.9,lum));
        const shadow=tone*[.16,.19,.24][c], highlight=mix(tone,1,.22);
        data[i+c]=Math.round(255*mix([.012,.016,.025][c],mix(shadow,highlight,shade),smooth(.04,.16,lum)));
      }
    }
    return data;
  }
  class Renderer {
    constructor(pack, baseURL, {document: doc=globalThis.document, cacheLimit=64} = {}) {
      validatePack(pack);
      if (!doc?.createElement) throw Error('A browser document is required for canvas rendering.');
      this.pack=clone(pack);this.baseURL=baseURL;this.document=doc;this.cacheLimit=Math.max(1,Math.min(128,cacheLimit));
      this.images=new Map();this.tints=new Map();this.ready=false;
    }
    static async load(manifestURL, options={}) {
      const url=new URL(manifestURL, globalThis.location?.href);
      const response=await fetch(url);
      if (!response.ok) throw Error('Could not load art pack: HTTP '+response.status);
      const renderer=new Renderer(await response.json(),url,options);
      await renderer.preload();return renderer;
    }
    async preload() {
      await Promise.all(validatePack(this.pack).map(async file => {
        if(this.images.has(file)) return;
        const url=new URL(file,this.baseURL),base=new URL(this.baseURL);
        if(url.origin !== base.origin) throw Error('Portrait assets must share the pack origin.');
        const image=this.document.createElement('img');image.crossOrigin='anonymous';
        image.src=url.href;
        await image.decode();
        if(image.naturalWidth !== this.pack.canvas[0] || image.naturalHeight !== this.pack.canvas[1]) throw Error('Unexpected component canvas: '+file);
        this.images.set(file,image);
      }));
      this.ready=true;return this;
    }
    canvas(size) {const canvas=this.document.createElement('canvas');canvas.width=size;canvas.height=size;return canvas;}
    tint(file,primary,accent,layer) {
      const key=JSON.stringify([file,primary,accent,layer.preserveChroma,layer.whiteThreshold]);
      if(this.tints.has(key)) {const value=this.tints.get(key);this.tints.delete(key);this.tints.set(key,value);return value;}
      const canvas=this.canvas(this.pack.logicalSize), ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.imageSmoothingEnabled=!this.pack.pixelated;
      ctx.drawImage(this.images.get(file),0,0,canvas.width,canvas.height);
      if(primary) {
        const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
        recolor(pixels.data,primary,accent||primary,{steps:this.pack.shadeSteps??8,preserveChroma:!!layer.preserveChroma,whiteThreshold:layer.whiteThreshold??.94});
        ctx.putImageData(pixels,0,0);
      }
      this.tints.set(key,canvas);
      if(this.tints.size>this.cacheLimit)this.tints.delete(this.tints.keys().next().value);
      return canvas;
    }
    render(input, {size=256,canvas=null,background=this.pack.background??null,base=false} = {}) {
      if(!this.ready)throw Error('Preload the art pack before rendering.');
      if(!Number.isInteger(size)||size<16||size>2048)throw Error('Portrait size must be 16–2048 pixels.');
      const identity=normalizeIdentity(this.pack,input,{strict:true}), work=this.canvas(this.pack.logicalSize),ctx=work.getContext('2d');
      const n=work.width;ctx.imageSmoothingEnabled=!this.pack.pixelated;
      if(background) {if(!HEX.test(background))throw Error('Background must be a six-digit hex color or null.');ctx.fillStyle=background;ctx.fillRect(0,0,n,n);}
      for(const layer of this.pack.layers) {
        if(base&&layer.accessory)continue;
        const option=this.pack.slots[layer.slot].options.find(o=>o.id===identity.choices[layer.slot]);
        if(!option.asset)continue;
        const texture=this.tint(option.asset,layer.color?identity.colors[layer.color]:null,layer.accent?identity.colors[layer.accent]:null,layer);
        const scale=option.scale||[1,1],offset=option.offset||[0,0];
        ctx.save();
        if(layer.frontOnly){const y=option.frontFromY??.83;ctx.beginPath();ctx.rect(0,y*n,n,n*(1-y));ctx.clip();}
        ctx.drawImage(texture,offset[0]*n,offset[1]*n,scale[0]*n,scale[1]*n);
        ctx.restore();
      }
      const target=canvas||this.canvas(size);target.width=size;target.height=size;
      const targetCtx=target.getContext('2d');targetCtx.clearRect(0,0,size,size);targetCtx.imageSmoothingEnabled=!this.pack.pixelated;
      targetCtx.drawImage(work,0,0,size,size);return target;
    }
    toDataURL(identity,options={}) {return this.render(identity,options).toDataURL('image/png');}
    async toBlob(identity,options={}) {return new Promise((resolve,reject)=>this.render(identity,options).toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed.')),'image/png'));}
    dispose() {this.images.clear();this.tints.clear();this.ready=false;}
  }
  return {SCHEMA,PACK_SCHEMA,validatePack,normalizeIdentity,serialize,deserialize,randomIdentity,recolor,Renderer};
});
