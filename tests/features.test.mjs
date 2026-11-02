import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterGames,contextUrl,suggestGame} from '../app.mjs';
const {games}=JSON.parse(readFileSync('data/games.json','utf8'));
test('filtro por tipo preserva a divisão entre 150 missões, 36 jogos originais e Arcade',()=>{
 assert.equal(filterGames(games,'estrategia','','mission').length,150);
 assert.equal(filterGames(games,'estrategia','','game').length,36);
 assert.equal(filterGames(games,'arcade','','game').length,150);
 assert.equal(filterGames(games,'arcade','','mission').length,0);
 assert.equal(filterGames(games,'estrategia','conquista aurora','mission').length,1);
 assert.equal(filterGames(games,'estrategia','frota oculta','game').length,1);
});
test('link compartilhável valida IDs reais e não aceita dados arbitrários de URL',()=>{
 const snake=games.find(g=>g.environment==='arcade'&&g.id==='snake');
 const mission=games.find(g=>g.environment==='estrategia'&&g.id==='est-001');
 assert.equal(contextUrl(snake),'https://pabloguilherme1121.github.io/PG-Bot/?projeto=arcade&jogo=snake');
 assert.equal(contextUrl(mission),'https://pabloguilherme1121.github.io/PG-Bot/?projeto=estrategia&jogo=est-001');
 assert.equal(contextUrl({...snake,id:'../../?x=1'}),null);
 assert.equal(contextUrl({...snake,environment:'evil'}),null);
 assert.equal(contextUrl(null),null);
});
test('sugestão escolhe somente jogos realmente filtrados e trata lista vazia',()=>{
 const only=filterGames(games,'estrategia','frota oculta','game');
 assert.equal(suggestGame(only,()=>0)?.id,'frota-oculta');
 assert.equal(suggestGame([],()=>0),null);
 const three=filterGames(games,'estrategia','','game').slice(0,3);
 assert.equal(suggestGame(three,()=>0)?.id,three[0].id);
 assert.equal(suggestGame(three,()=>0.999)?.id,three[2].id);
});
