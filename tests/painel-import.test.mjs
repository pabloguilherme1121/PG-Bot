import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSeed, normalizeImport, verifiedGate, upsertGithubEvidence} from '../painel/data.mjs';

test('importacao de backup nao aceita comprovacao GitHub sem nova consulta', () => {
 const state=makeSeed();
 state.lastGithubSync='2026-11-06T23:00:00.000Z';
 const gate=state.gates.find(item=>item.id==='str-ci');
 const proof=state.evidences.find(item=>item.id==='ev-str-ci');
 assert.equal(verifiedGate(state,gate),true);
 assert.equal(proof.verified,true);
 const imported=normalizeImport(state,{untrusted:true});
 assert.equal(imported.lastGithubSync,null);
 assert.equal(imported.evidences.find(item=>item.id==='ev-str-ci').verified,false);
 assert.equal(verifiedGate(imported,imported.gates.find(item=>item.id==='str-ci')),false);
 assert.ok(imported.prs.every(pr=>pr.mergedAt===null));
 assert.ok(imported.prs.every(pr=>pr.checklist[4].done===false));
});

test('dados carregados do armazenamento local preservam snapshot sem alterar origem', () => {
 const original=makeSeed();
 const restored=normalizeImport(original);
 assert.equal(verifiedGate(restored,restored.gates.find(g=>g.id==='str-ci')),true);
 assert.equal(restored.prs.find(p=>p.number===5&&p.repo==='PG-Estrategia').githubState,'merged');
});

test('nova consulta GitHub pode revalidar evidencia importada com mesmo ID', () => {
 const imported=normalizeImport(makeSeed(),{untrusted:true});
 const updated={id:'ev-str-ci',source:'github-api',verified:true,url:'https://github.com/pabloguilherme1121/PG-Estrategia/actions/runs/123',title:'Workflow checado',note:'SHA auditado',kind:'CI',project:'estrategia',reviewed:false,date:'2026-11-06T23:15:00.000Z'};
 upsertGithubEvidence(imported,updated);
 assert.equal(imported.evidences.filter(e=>e.id==='ev-str-ci').length,1);
 assert.equal(imported.evidences.find(e=>e.id==='ev-str-ci').url,updated.url);
 assert.equal(verifiedGate(imported,imported.gates.find(g=>g.id==='str-ci')),true);
});

test('provas manuais nao recebem origem GitHub artificial durante importacao', () => {
 const state=makeSeed();
 state.evidences.push({id:'manual-review',source:'manual',verified:false,reviewed:true,note:'Revisei manualmente evidencias reais',url:'https://example.org/evidencia',title:'Fonte local'});
 const imported=normalizeImport(state,{untrusted:true});
 const ev=imported.evidences.find(e=>e.id==='manual-review');
 assert.equal(ev.source,'manual');
 assert.equal(ev.reviewed,true);
 assert.equal(ev.verified,false);
});

test('fonte externa nao se apresenta como verificada pelo GitHub', () => {
 const state=normalizeImport(makeSeed(),{untrusted:true});
 assert.throws(()=>upsertGithubEvidence(state,{id:'forged',source:'github-api',verified:true,url:'https://not-github.example/claim'}),/inválida/);
 assert.equal(state.evidences.some(e=>e.id==='forged'),false);
});
