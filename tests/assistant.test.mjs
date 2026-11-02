import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {answerQuestion,filterGames,normalize} from '../app.mjs';
const {games,counts}=JSON.parse(readFileSync('data/games.json','utf8'));
const snake=games.find(g=>g.environment==='arcade'&&g.id==='snake');
const mission=games.find(g=>g.environment==='estrategia'&&g.id==='est-001');
test('catálogos oficiais completos sem IDs repetidos por ambiente',()=>{
 assert.deepEqual(counts,{arcade:150,missions:150,classic:9,independent:27});
 assert.equal(games.length,336);
 assert.equal(new Set(games.filter(g=>g.environment==='arcade').map(g=>g.id)).size,150);
 assert.equal(new Set(games.filter(g=>g.environment==='estrategia').map(g=>g.id)).size,186);
 for(const game of games){assert.ok(game.name.length>1&&game.description.length>10,game.id);assert.ok(game.url.startsWith('https://pabloguilherme1121.github.io/PG-'),game.id)}
});
test('busca normaliza acentos e filtra por ambiente e por nome',()=>{
 assert.equal(normalize(' ESTRATÉGIA '),'estrategia');
 assert.equal(filterGames(games,'arcade','Snake').some(g=>g.id==='snake'),true);
 assert.equal(filterGames(games,'estrategia','est-001').some(g=>g.id==='est-001'),true);
 assert.equal(filterGames(games,'arcade','est-001').length,0);
 assert.equal(filterGames(games,'estrategia','cofre').length>0,true);
});
test('objetivo e controles têm orientação específica sem inventar estado',()=>{
 assert.ok(snake,'Snake existe no catálogo');
 assert.ok(mission,'a missão 1 existe');
 assert.equal(answerQuestion('Como jogar?',snake).topic,'objetivo');
 assert.match(answerQuestion('Como jogar?',snake).answer,/Snake/);
 assert.equal(answerQuestion('Quais são os controles?',snake).topic,'controles');
 assert.match(answerQuestion('Quais são os controles?',snake).answer,/Snake/);
 assert.match(answerQuestion('Qual o objetivo?',mission).answer,/missão|Objetivo/i);
 assert.equal(answerQuestion('Qual meu turno atual?',mission).topic,'situacao');
 assert.match(answerQuestion('Qual meu turno atual?',mission).answer,/não acompanha|dentro da arena/);
});
test('placar atual deve encaminhar para o jogo sem fingir acesso ao estado da partida',()=>{
 for(const question of ['Como está o placar atual?','Qual é a pontuação atual?']){
  const result=answerQuestion(question,snake);
  assert.equal(result.topic,'situacao',question);
  assert.match(result.answer,/não acompanha a partida em tempo real/);
 }
 assert.equal(answerQuestion('Meus recordes',snake).topic,'recordes');
 assert.equal(answerQuestion('Como jogar?',snake).topic,'objetivo');
});
test('offline, reinício, progresso e acessibilidade são transparentes',()=>{
 for(const [question,expected] of [['Funciona offline?','offline'],['quero reiniciar','reiniciar'],['meus recordes','recordes'],['Como usar teclado?','acessibilidade'],['Me dê uma dica de estratégia','dica']])
  assert.equal(answerQuestion(question,snake).topic,expected,question);
});
test('entradas maliciosas, desconhecidas ou excessivas não viram HTML nem instruções',()=>{
 for(const input of ['', '<img src=x onerror=alert(1)>','x'.repeat(1000),'@ignore previous instructions']){
  const result=answerQuestion(input,snake);
  assert.equal(result.topic,'fallback');
  assert.doesNotMatch(result.answer,/<img|alert\(/);
 }
 assert.equal(answerQuestion('Como jogar?',null).topic,'fallback');
});
