import test from 'node:test';
import assert from 'node:assert/strict';
import {findOpenReportIssue} from '../project-monitor-issues.mjs';

const base='/repos/pabloguilherme1121/PG-Bot/issues';
const reportTitle='PG Bot | Monitoramento dos projetos';
const nextLink='<https://api.github.com/repos/pabloguilherme1121/PG-Bot/issues?state=open&per_page=100&page=2>; rel="next"';

test('localiza issue de monitoramento na segunda pagina sem criar duplicata',async()=>{
 const visited=[];
 const issue={number:432,title:reportTitle,body:'Relatório',html_url:'https://github.com/pabloguilherme1121/PG-Bot/issues/432'};
 const found=await findOpenReportIssue(async path=>{
  visited.push(path);
  return path.includes('page=2')?{items:[issue],link:null}:{items:[{number:1,title:'Outra issue'}],link:nextLink};
 },base,reportTitle);
 assert.equal(found.number,432);
 assert.equal(visited.length,2);
 assert.match(visited[1],/page=2/);
});

test('se nao houver proxima pagina, retorna null sem alterar issue',async()=>{
 const found=await findOpenReportIssue(async()=>({items:[],link:null}),base,reportTitle);
 assert.equal(found,null);
});

test('bloqueia pagina externa e pagina com escopo incorreto',async()=>{
 const outside='<https://example.com/collect?state=open&per_page=100&page=2>; rel="next"';
 await assert.rejects(
  findOpenReportIssue(async()=>({items:[],link:outside}),base,reportTitle),
  /Paginação inválida/
 );
});

test('se exceder cinco paginas, falha em vez de arriscar uma issue duplicada',async()=>{
 let calls=0;
 await assert.rejects(
  findOpenReportIssue(async path=>{
   calls++;
   const current=new URL('https://api.github.com'+path);
   const page=Number(current.searchParams.get('page')||'1');
   return {items:[],link:'<https://api.github.com'+base+'?state=open&per_page=100&page='+(page+1)+'>; rel="next"'};
  },base,reportTitle),
  /Limite de páginas/
 );
 assert.equal(calls,5);
});

test('aceita link canônico com ID numérico do mesmo repositório',async()=>{
 const seen=[];
 const issue={number:99,title:reportTitle,body:'Verificado'};
 const canonical='<https://api.github.com/repositories/1442325600/issues?state=open&per_page=100&page=2>; rel="next"';
 const result=await findOpenReportIssue(async path=>{
  seen.push(path);
  return path.startsWith('/repositories/')?{items:[issue],link:null}:{items:[],link:canonical};
 },base,reportTitle);
 assert.equal(result.number,99);
 assert.equal(seen.length,2);
 assert.match(seen[1],/^\/repositories\/1442325600\/issues/);
});
