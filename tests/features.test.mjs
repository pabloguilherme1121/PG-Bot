import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterGames,contextUrl,suggestGame,buildGameGuide,answerQuestion} from '../app.mjs';
const {games}=JSON.parse(readFileSync('data/games.json','utf8'));
test('filtro por tipo preserva a divisão entre 150 missões, 38 jogos originais e Arcade',()=>{
 assert.equal(filterGames(games,'estrategia','','mission').length,150);
 assert.equal(filterGames(games,'estrategia','','game').length,38);
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
test('busca encontra regras e dificuldade sem misturar os catálogos',()=>{
 const noTimer=filterGames(games,'arcade','cronometro');
 assert.ok(noTimer.some(game=>game.id==='lanternas'));
 const beginners=filterGames(games,'estrategia','iniciante');
 assert.ok(beginners.some(game=>game.id==='est-001'));
 assert.equal(filterGames(games,'arcade','conquista territorial aurora').length,0);
});
test('guia rápido usa somente instruções do jogo e não afirma acessar o placar',()=>{
 const mission=games.find(game=>game.environment==='estrategia'&&game.id==='est-001');
 const guide=buildGameGuide(mission);
 assert.match(guide,/Conquista territorial: Aurora/);
 assert.match(guide,/Domine a meta antes do limite de turnos/);
 assert.match(guide,/Iniciante/);
 assert.doesNotMatch(guide,/seu placar atual|você está vencendo/i);
 assert.equal(answerQuestion('Quero um guia rápido da partida',mission).topic,'guia');
 assert.match(answerQuestion('Quero um guia rápido da partida',mission).answer,/Iniciante/);
 assert.equal(buildGameGuide(null),null);
});
