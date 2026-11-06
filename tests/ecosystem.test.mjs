import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER,cleanRepo,pageOf,excerptMarkdown,validateQueue,suggestedAction,describeQuestion,safeHttps} from '../ecossistema/core.mjs';
const repo={owner:{login:OWNER},name:'PG-Bot',private:false,html_url:'https://github.com/'+OWNER+'/PG-Bot',homepage:'https://example.com',description:'Assistente'};
test('inventário descarta dados privados e URLs inválidas',()=>{
  assert.equal(cleanRepo(repo).name,'PG-Bot');
  assert.equal(cleanRepo({...repo,private:true}),null);
  assert.equal(cleanRepo({...repo,owner:{login:'outro'}}),null);
  assert.equal(cleanRepo({...repo,html_url:'javascript:alert(1)'}),null);
  assert.equal(safeHttps('http://localhost/a'),null);
});
test('paginação tem limites e preserva registros',()=>{
  const items=Array.from({length:14},(_,i)=>i);
  assert.deepEqual(pageOf(items,1).items,[0,1,2,3,4,5]);
  assert.deepEqual(pageOf(items,3).items,[12,13]);
  assert.equal(pageOf(items,999).current,3);
});
test('trechos da documentação não acrescentam funções inventadas',()=>{
  assert.equal(excerptMarkdown('# Regras\nUse teclado.'),'Regras Use teclado.');
  const found=describeQuestion('funcoes',cleanRepo(repo),{readme:{data:'# O bot\nResponde por regras locais.',stale:false,fetchedAt:'2026-11-06T00:00:00Z'}});
  assert.match(found.answer,/Responde por regras locais/);
  assert.equal(found.stale,false);
  assert.match(found.url,/README.md$/);
});
test('CI falho recomenda inspeção, nunca executa mudanças',()=>{
  const item=suggestedAction(cleanRepo(repo),{runs:{data:[{conclusion:'failure',html_url:'https://github.com/a/b/actions/runs/100'}]}});
  assert.match(item.next,/Inspecionar logs/);
  assert.match(item.evidence,/100$/);
});
test('fila exportável tem esquema restrito',()=>{
  const clean=validateQueue([{id:'abc',project:'PG-Bot',reason:'teste',next:'revisar',evidence:'https://github.com/x/y',reviewed:true,unknown:'secreto'}]);
  assert.equal(clean.length,1);
  assert.equal(clean[0].reviewed,true);
  assert.equal('unknown' in clean[0],false);
  assert.equal(validateQueue([{id:'z',project:'../invalido'}]).length,0);
});
