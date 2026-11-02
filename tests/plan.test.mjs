import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planForGame} from '../app.mjs';
const {games}=JSON.parse(readFileSync('data/games.json','utf8'));
const by=(env,id)=>games.find(g=>g.environment===env&&g.id===id);

test('plano usa objetivo, controles e dica reais do jogo Snake',()=>{
 const snake=by('arcade','snake');
 const plan=planForGame(snake);
 assert.ok(plan);
 assert.equal(plan.gameId,'snake');
 assert.equal(plan.steps.length,3);
 assert.match(plan.steps[0],/Snake|objetivo/i);
 assert.match(plan.steps[1],/Snake|controle|tecla|toque/i);
 assert.match(plan.steps[2],/Snake|dica|estrat/i);
 for(const step of plan.steps)assert.ok(step.length<=600);
});

test('missão usa o contexto de campanha sem afirmar resultado real',()=>{
 const mission=by('estrategia','est-001');
 const plan=planForGame(mission);
 assert.equal(plan.steps.length,3);
 assert.ok(plan.steps.some(s=>/conquista territorial|Aurora/i.test(s)));
 assert.doesNotMatch(plan.steps.join(' '),/seu turno atual|você venceu|placar atual/i);
});

test('jogo sem dados não gera dicas nem inventa comandos',()=>{
 assert.equal(planForGame(null),null);
 assert.equal(planForGame({id:'fake',name:'X',description:'',help:'',hint:''}),null);
});

test('plano não injeta HTML fornecido em campos externos',()=>{
 const plan=planForGame({environment:'arcade',id:'fake',name:'<img src=x onerror=alert(1)>',description:'<script>alert(1)</script>',help:'Use o teclado',hint:'Observe o objetivo'});
 assert.ok(plan);
 assert.doesNotMatch(plan.steps.join(' '),/<script|<img|onerror/i);
});
