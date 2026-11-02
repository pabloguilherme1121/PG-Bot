import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('shell contém formulário acessível e links corretos de navegação',()=>{
 const html=readFileSync('index.html','utf8');
 for(const word of ['id="chat-form"','id="game-search"','id="game-select"','role="log"','aria-live="polite"','maxlength="240"','PG-Estrategia/','PG-Arcade/','data-question="Quero um guia rápido da partida"'])assert.ok(html.includes(word),word);
 for(const file of ['styles.css','app.mjs','data/games.json','brand/pg-bot/mascot.webp'])assert.ok(existsSync(file),file);
});
test('service worker não intercepta nem o Arcade nem o Estratégia',()=>{
 const handlers=new Map();
 const self={location:{origin:'https://example.test'},registration:{scope:'https://example.test/PG-Bot/'},addEventListener(name,fn){handlers.set(name,fn)}};
 runInNewContext(readFileSync('sw.js','utf8'),{self,URL,Promise,Set,Response,caches:{match:async()=>undefined,open:async()=>({put:async()=>{}})},fetch:async()=>new Response('ok')});
 const handler=handlers.get('fetch');
 assert.equal(typeof handler,'function');
 for(const path of ['/PG-Arcade/','/PG-Estrategia/','/PG-Estrategia/independentes/']){
  let handled=false;
  handler({request:{method:'GET',mode:'navigate',url:'https://example.test'+path},respondWith(){handled=true}});
  assert.equal(handled,false,path);
 }
 let handled=false;
 handler({request:{method:'GET',mode:'navigate',url:'https://example.test/PG-Bot/'},respondWith(){handled=true}});
 assert.equal(handled,true);
});

test('nova versão do PWA renova o cache sem excluir caches de outros projetos',()=>{
 const sw=readFileSync('sw.js','utf8');
 assert.ok(sw.includes("const CACHE='pg-bot-shell-v2'"));
 assert.ok(sw.includes("key.startsWith('pg-bot-shell-')"));
 assert.ok(sw.includes("'./data/games.json'"));
});
