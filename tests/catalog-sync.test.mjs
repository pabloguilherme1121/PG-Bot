import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeCatalogChanges, parseStaticPairs, parseObjectFields} from '../scripts/sync-catalog.mjs';

test('altera só campo que continua igual à fonte anterior',()=>{
 const catalog={games:[{id:'abc',environment:'arcade',name:'Nome antigo',description:'Descrição antiga',help:'Dica editorial'}]};
 const previous={'arcade:abc':{name:'Nome antigo',description:'Descrição antiga',help:'Ajuda da fonte'}};
 const current={'arcade:abc':{name:'Nome atualizado',description:'Descrição nova',help:'Ajuda nova'}};
 const p=proposeCatalogChanges(catalog,previous,current);
 assert.equal(p.catalog.games[0].name,'Nome atualizado');
 assert.equal(p.catalog.games[0].description,'Descrição nova');
 assert.equal(p.catalog.games[0].help,'Dica editorial');
 assert.equal(p.applied.length,2);
 assert.equal(p.review.length,1);
 assert.equal(p.review[0].field,'help');
});

test('não substitui descrição editorial e sinaliza revisão',()=>{
 const catalog={games:[{id:'abc',environment:'arcade',name:'Nome',description:'Descrição validada pelo editor'}]};
 const old={'arcade:abc':{name:'Nome',description:'Fonte anterior'}};
 const fresh={'arcade:abc':{name:'Nome',description:'Fonte alterada'}};
 const p=proposeCatalogChanges(catalog,old,fresh);
 assert.equal(p.catalog.games[0].description,'Descrição validada pelo editor');
 assert.equal(p.review.length,1);
 assert.equal(p.applied.length,0);
});

test('não inventa metadados de ID novo sem aprovação',()=>{
 const c={games:[{id:'abc',environment:'arcade',name:'Snake',description:'Objetivo'}]};
 const result=proposeCatalogChanges(c,{}, {'arcade:abc':{name:'Título alterado'}});
 assert.equal(result.catalog.games[0].name,'Snake');
 assert.equal(result.review[0].reason,'sem histórico da fonte');
});

test('recusa conteúdo com HTML, controles ou campos excessivos',()=>{
 const c={games:[{id:'abc',environment:'arcade',name:'Snake',description:'Jogar'}]};
 const prev={'arcade:abc':{name:'Snake'}};
 const fresh={'arcade:abc':{name:'<img src=x onerror=1>'}};
 const r=proposeCatalogChanges(c,prev,fresh);
 assert.equal(r.catalog.games[0].name,'Snake');
 assert.equal(r.review[0].reason,'texto inseguro');
});

test('extrai literais citados sem executar expressões de código',()=>{
 const source='["jogo-a","Nome A","Descrição A","Categoria"],\n["jogo-b","Nome B","Categoria","board","Toque no controle"],';
 const rows=parseStaticPairs(source);
 assert.deepEqual(rows,[['jogo-a','Nome A','Descrição A','Categoria'],['jogo-b','Nome B','Categoria','board','Toque no controle']]);
 const obj='{id:"abc",name:"Nome",description:"Toque para jogar",category:"Lógica"}';
 assert.deepEqual(parseObjectFields(obj),{id:'abc',name:'Nome',description:'Toque para jogar',category:'Lógica'});
 assert.equal(parseObjectFields('{id: run(),name:"X"}').id,undefined);
});

test('novo jogo na fonte não entra no catálogo sem revisão explícita',()=>{
 const catalog={games:[{id:'abc',environment:'arcade',name:'Atual',description:'Existe'}]};
 const source={'arcade:abc':{name:'Atual',description:'Existe'},'arcade:novo':{name:'Novo',description:'Novo jogo'}};
 const proposed=proposeCatalogChanges(catalog,source,source);
 assert.equal(proposed.catalog.games.length,1);
 assert.ok(proposed.review.some(x=>x.key==='arcade:novo'&&x.reason==='novo ID sem cadastro'));
});
