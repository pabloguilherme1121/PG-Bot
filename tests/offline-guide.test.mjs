import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {offlineGuide} from '../app.mjs';
const games=JSON.parse(readFileSync('data/games.json','utf8')).games;
const game=(environment,id)=>games.find(g=>g.environment===environment&&g.id===id);

test('guia offline documenta objetivo, controles e dicas do Snake sem placar inventado',()=>{
 const result=offlineGuide(game('arcade','snake'));
 assert.equal(result.filename,'pg-bot-arcade-snake.txt');
 assert.match(result.content,/Snake/);
 assert.match(result.content,/1\. Objetivo/);
 assert.match(result.content,/2\. Controles/);
 assert.match(result.content,/3\. Dica/);
 assert.match(result.content,/n[aã]o acompanha|não acompanha/i);
 assert.match(result.content,/https:\/\/pabloguilherme1121\.github\.io\/PG-Arcade\//);
});

test('guia da missão mantém contexto e caminho do Estratégia',()=>{
 const result=offlineGuide(game('estrategia','est-001'));
 assert.equal(result.filename,'pg-bot-estrategia-est-001.txt');
 assert.match(result.content,/est-001|Conquista territorial|Aurora/i);
 assert.match(result.content,/PG-Estrategia/);
});

test('rejeita catálogo adulterado, campos inválidos e conteúdo malicioso',()=>{
 assert.equal(offlineGuide(null),null);
 assert.equal(offlineGuide({environment:'arcade',id:'../evil',name:'Fake',description:'ok'}),null);
 assert.equal(offlineGuide({environment:'invalido',id:'snake',name:'Fake',description:'ok'}),null);
 const safe=offlineGuide({...game('arcade','snake'),name:'<img onerror=alert(1)>',description:'<script>alert(1)</script>'});
 assert.ok(safe);
 assert.doesNotMatch(safe.content,/<script|<img|onerror/i);
});
