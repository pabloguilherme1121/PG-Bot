import test from 'node:test';
import assert from 'node:assert/strict';
import {planActions, reportFreshness} from '../project-automation-actions.mjs';

const base='pabloguilherme1121/';
const project=(name,state,workflows=[],openPRs=[])=>({repository:base+name,state,workflows,openPRs});
const failure=(id)=>({id,name:'Qualidade mobile',status:'completed',conclusion:'failure',url:`https://github.com/${base}PG-Arcade/actions/runs/${id}`});

test('falha vira ação P0 com link exato para a run, sem declarar correção executada',()=>{
 const actions=planActions({projects:[project('PG-Arcade','falha',[failure(45)])]});
 assert.equal(actions.length,1);
 assert.equal(actions[0].priority,'P0');
 assert.equal(actions[0].category,'falha');
 assert.match(actions[0].description,/logs|reproduzir/i);
 assert.equal(actions[0].url,'https://github.com/pabloguilherme1121/PG-Arcade/actions/runs/45');
 assert.doesNotMatch(actions[0].description,/corrigido|publicado/i);
});

test('ações priorizam falha e indisponibilidade, depois PR em revisão',()=>{
 const actions=planActions({projects:[
  project('PG-Bot','revisao',[],[{number:20,draft:true,url:'https://github.com/pabloguilherme1121/PG-Bot/pull/20'}]),
  project('PG-portfolio','indisponivel'),
  project('PG-Arcade','falha',[failure(45)]),
  project('PG-Estrategia','ok')
 ]});
 assert.deepEqual(actions.map(a=>a.category),['falha','indisponivel','revisao','ok']);
 assert.equal(actions[2].url,'https://github.com/pabloguilherme1121/PG-Bot/pull/20');
 assert.equal(actions[2].priority,'P1');
});

test('sem comprovação de run não constrói link arbitrário',()=>{
 const actions=planActions({projects:[project('PG-Arcade','falha',[{id:1,url:'https://evil.invalid',status:'completed',conclusion:'failure'}])]});
 assert.equal(actions[0].url,'https://github.com/pabloguilherme1121/PG-Arcade/actions/runs/1');
});

test('recusa repositório fora do escopo conhecido',()=>{
 const actions=planActions({projects:[project('PG-Bot','ok'),{repository:'thirdparty/secrets',state:'falha',workflows:[],openPRs:[]}]});
 assert.equal(actions.length,1);
 assert.equal(actions[0].repository,'pabloguilherme1121/PG-Bot');
});

test('relatório antigo ou futuro não é apresentado como atual',()=>{
 const now=Date.parse('2026-11-05T21:00:00Z');
 assert.equal(reportFreshness('2026-11-05T12:00:00Z',now).status,'atual');
 assert.equal(reportFreshness('2026-11-04T19:00:00Z',now).status,'desatualizado');
 assert.equal(reportFreshness('2026-11-06T00:00:00Z',now).status,'invalido');
 assert.equal(reportFreshness('texto inválido',now).status,'invalido');
});
