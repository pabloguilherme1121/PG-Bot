import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCurrentMainRun} from '../painel/data.mjs';

const head='a'.repeat(40);
const older='b'.repeat(40);
const run=(sha,created,extra={})=>({
 name:'Qualidade PG Bot',head_branch:'main',head_sha:sha,
 status:'completed',conclusion:'success',created_at:created,id:100,...extra
});

test('não aceita CI verde de commit anterior como prova da HEAD de main',()=>{
 const runs=[run(older,'2026-11-06T12:00:00Z')];
 assert.equal(selectCurrentMainRun(runs,head,'Qualidade PG Bot'),null);
});

test('seleciona apenas o workflow concluído mais recente do SHA exato',()=>{
 const expected=run(head,'2026-11-06T11:00:00Z',{id:2});
 const runs=[run(older,'2026-11-06T13:00:00Z'),run(head,'2026-11-06T10:00:00Z',{id:1}),expected,run(head,'2026-11-06T14:00:00Z',{status:'in_progress',id:3}),run(head,'2026-11-06T15:00:00Z',{name:'Outro workflow',id:4})];
 assert.equal(selectCurrentMainRun(runs,head,'Qualidade PG Bot'),expected);
});

test('rejeita SHA ausente ou malformado e execução de outra branch',()=>{
 assert.equal(selectCurrentMainRun([run(head,'2026-11-06T12:00:00Z')],'','Qualidade PG Bot'),null);
 assert.equal(selectCurrentMainRun([run(head,'2026-11-06T12:00:00Z',{head_branch:'feature'})],head,'Qualidade PG Bot'),null);
});
