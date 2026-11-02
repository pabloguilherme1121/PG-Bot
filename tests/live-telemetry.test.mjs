import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLiveTick,liveSummary,isLiveForSelection} from '../live-telemetry.mjs';
const now=1_800_000_000_000;
const tick={type:'PG_STATE_TICK',version:1,project:'estrategia',gameId:'dominio-territorial',timestamp:now,turn:4,score:null,phase:'playing',resources:12};
test('aceita apenas snapshot mínimo de partida recente e bem formado',()=>{
 assert.deepEqual(parseLiveTick(tick,now),tick);
 for(const data of [null,{}, {...tick,version:2},{...tick,project:'outro'},{...tick,gameId:'../../foo'},{...tick,turn:'4'},{...tick,resources:{token:'secret'}},{...tick,score:Infinity},{...tick,timestamp:now-30000},{...tick,timestamp:now+9000},{...tick,phase:'cheat'}]) assert.equal(parseLiveTick(data,now),null);
});
test('movimentos opcionais do Gravidade são preservados sem confundir com turno',()=>{
 const gravity={...tick,gameId:'gravidade-cristais',turn:null,resources:null,moves:5};
 assert.deepEqual(parseLiveTick(gravity,now),gravity);
 assert.match(liveSummary(gravity),/Jogadas: 5/);
 assert.doesNotMatch(liveSummary(gravity),/Turno/);
 assert.equal(parseLiveTick({...gravity,moves:-1},now),null);
 assert.equal(parseLiveTick({...gravity,moves:{cookie:'secret'}},now),null);
 assert.equal(isLiveForSelection(gravity,{environment:'estrategia',id:'gravidade-cristais'},now),true);
});

test('mensagem de outra partida ou projeto não afeta o contexto selecionado',()=>{
 assert.equal(isLiveForSelection(tick,{environment:'estrategia',id:'dominio-territorial'},now),true);
 assert.equal(isLiveForSelection(tick,{environment:'arcade',id:'dominio-territorial'},now),false);
 assert.equal(isLiveForSelection(tick,{environment:'estrategia',id:'est-001'},now),false);
 assert.equal(isLiveForSelection(tick,{environment:'estrategia',id:'dominio-territorial'},now+20000),false);
});
test('resumo não inventa pontuação quando o motor só possui turno e recursos',()=>{
 const summary=liveSummary(tick);
 assert.match(summary,/Turno 4/);
 assert.match(summary,/Suprimentos: 12/);
 assert.doesNotMatch(summary,/Placar|pontuação/);
});
