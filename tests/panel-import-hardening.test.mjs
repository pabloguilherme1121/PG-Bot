import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSeed, normalizeImport, normalizeExternalBackup, verifiedGate} from '../painel/data.mjs';

test('backup legítimo da homologação continua aceito',()=>{
 const seed=makeSeed();
 const backup=normalizeImport(seed);
 assert.equal(backup.version,1);
 assert.equal(backup.gates.length,seed.gates.length);
 assert.equal(backup.evidences.length,seed.evidences.length);
});

test('importação rejeita links com esquemas executáveis',()=>{
 const badEvidence=makeSeed();
 badEvidence.evidences[0].url='javascript:alert(document.domain)';
 assert.throws(()=>normalizeImport(badEvidence),/inválid/i);
 const badPr=makeSeed();
 badPr.prs[0].url='data:text/html,<script>alert(1)</script>';
 assert.throws(()=>normalizeImport(badPr),/inválid/i);
});

test('importação rejeita estruturas que quebram a fila de evidências ou a matriz',()=>{
 const badGate=makeSeed();
 badGate.gates[0].evidenceIds='ev-bot-ci';
 assert.throws(()=>normalizeImport(badGate),/inválid/i);
 const badPr=makeSeed();
 badPr.prs[0].checklist=null;
 assert.throws(()=>normalizeImport(badPr),/inválid/i);
 const badNote=makeSeed();
 badNote.evidences[0].note={foo:'bar'};
 assert.throws(()=>normalizeImport(badNote),/inválid/i);
});

test('importação rejeita datas malformadas que poderiam injetar HTML',()=>{
 const unsafePr=makeSeed();
 unsafePr.prs[0].mergedAt='<img src=x onerror=alert(1)>';
 assert.throws(()=>normalizeImport(unsafePr),/inválid/i);
 const unsafeEvidence=makeSeed();
 unsafeEvidence.evidences[0].date='<svg/onload=alert(1)>';
 assert.throws(()=>normalizeImport(unsafeEvidence),/inválid/i);
});

test('backup recebido de fora não pode forjar revisão GitHub nem merge comprovado',()=>{
 const original=makeSeed();
 const gate=original.gates.find(g=>g.id==='str-ci');
 assert.equal(verifiedGate(original,gate),true,'o snapshot embutido conserva seu contexto');
 const attacker=structuredClone(original);
 const proof=attacker.evidences.find(e=>e.id===gate.evidenceIds[0]);
 proof.verified=true;
 proof.source='github-api';
 proof.note='Prova inserida no arquivo, sem nova consulta ao GitHub.';
 const merged=attacker.prs.find(p=>p.mergedAt);
 assert.ok(merged,'o snapshot precisa ter PR mesclada para verificar falsificação');
 const imported=normalizeExternalBackup(attacker);
 assert.equal(verifiedGate(imported,imported.gates.find(g=>g.id==='str-ci')),false,
  'JSON importado não deve gerar gate com prova verificada sem consultar o GitHub');
 assert.equal(imported.evidences.find(e=>e.id===proof.id).verified,false);
 assert.equal(imported.prs.find(p=>p.id===merged.id).mergedAt,null,
  'backup não comprova merge sem consultar a API');
 assert.equal(imported.gates.find(g=>g.id==='str-ci').status,'em-validacao');
});
