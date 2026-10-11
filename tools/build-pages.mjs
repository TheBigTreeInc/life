import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

// Always compile from modular source; never deploy stale PLAY.html.
const root=resolve(import.meta.dirname,'..');
execFileSync(process.execPath,[resolve(root,'tools/build-offline.mjs')],{stdio:'inherit'});
const game=readFileSync(resolve(root,'PLAY.html'),'utf8');
if (!game.startsWith('<!doctype html>') || !game.includes('id="board"')) throw new Error('Invalid generated HTML');
if (/<script\s+src=|<link\s+rel="stylesheet"/.test(game)) throw new Error('Pages must be completely self-contained');
const out=resolve(root,'dist');
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'index.html'),game);
writeFileSync(resolve(out,'.nojekyll'),'');
console.log(`GitHub Pages site ready: dist/index.html (${Buffer.byteLength(game)} bytes)`);
