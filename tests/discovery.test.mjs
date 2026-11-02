import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeShareUrl, nextGameChoice} from '../app.mjs';
const {games}=JSON.parse(readFileSync('data/games.json','utf8'));
const snake=games.find(g=>g.environment==='arcade'&&g.id==='snake');
test('link contextual abre só o domínio oficial e mantém produto e jogo',()=>{
 assert.equal(makeShareUrl('arcade','snake'),'https://pabloguilherme1121.github.io/PG-Bot/?projeto=arcade&jogo=snake');
 assert.equal(makeShareUrl('estrategia','est-001'),'https://pabloguilherme1121.github.io/PG-Bot/?projeto=estrategia&jogo=est-001');
});
test('não compartilha URLs manipuladas nem contextos inválidos',()=>{
 for(const id of ['javascript:alert(1)','../evil','../../','x'.repeat(90),'','a%2Fb'])
  assert.equal(makeShareUrl('arcade',id),null,id);
 assert.equal(makeShareUrl('exterior','snake'),null);
});
test('sugere o próximo jogo real sem repetir o atual',()=>{
 const suggestion=nextGameChoice(games,'arcade','snake');
 assert.ok(suggestion);
 assert.equal(suggestion.environment,'arcade');
 assert.notEqual(suggestion.id,'snake');
 assert.ok(games.includes(suggestion));
});
test('respeita a busca e não inventa opções',()=>{
 const subset=games.filter(g=>g.environment==='arcade');
 const next=nextGameChoice(subset,'arcade',subset[0].id);
 assert.equal(next?.id,subset[1].id);
 assert.equal(nextGameChoice([snake],'arcade',snake.id),null);
 assert.equal(nextGameChoice(games,'estrategia','est-001','zzzznaoexiste'),null);
 assert.equal(nextGameChoice(games,'arcade','snake','snake'),null);
});
