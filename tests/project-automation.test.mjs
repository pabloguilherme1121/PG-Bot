import test from 'node:test';
import assert from 'node:assert/strict';
import {MONITORED_REPOS,summarizeProject,buildReport,parseReport} from '../project-automation.mjs';

const repo='pabloguilherme1121/PG-Arcade';
const run=(id,conclusion,status='completed',workflow_id=1)=>({
 id,workflow_id,name:'Qualidade',status,conclusion,
 html_url:'https://github.com/pabloguilherme1121/PG-Arcade/actions/runs/'+id,
 created_at:'2026-11-05T10:00:00Z'
});
const pr=(number,draft=false)=>({
 number,draft,title:'Correção mobile '+number,state:'open',
 html_url:'https://github.com/pabloguilherme1121/PG-Arcade/pull/'+number
});

test('monitor recebe somente repositórios configurados e identificados',()=>{
 assert.ok(MONITORED_REPOS.includes('pabloguilherme1121/PG-Bot'));
 assert.ok(MONITORED_REPOS.includes('pabloguilherme1121/PG-Arcade'));
 assert.ok(MONITORED_REPOS.includes('pabloguilherme1121/PG-Estrategia'));
 assert.ok(MONITORED_REPOS.includes('pabloguilherme1121/PG-portfolio'));
 assert.ok(MONITORED_REPOS.includes('Pabloguilherme01/Cuidador'));
 assert.ok(!MONITORED_REPOS.includes('pabloguilherme1121/pg-tech-storefront'), 'Não publicar nome ou status do repositório privado');
 assert.equal(new Set(MONITORED_REPOS).size,MONITORED_REPOS.length);
 for(const name of MONITORED_REPOS)assert.match(name,/^[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/);
});

test('falha mais recente tem prioridade sobre PR aberta',()=>{
 const summary=summarizeProject(repo,[run(21,'failure')],[pr(31)]);
 assert.equal(summary.state,'falha');
 assert.equal(summary.workflows[0].conclusion,'failure');
 assert.equal(summary.openPRs[0].number,31);
});

test('execução atual substitui falha antiga do mesmo workflow',()=>{
 const summary=summarizeProject(repo,[run(22,'success'),run(21,'failure')],[]);
 assert.equal(summary.state,'ok');
 assert.equal(summary.workflows.length,1);
 assert.equal(summary.workflows[0].id,22);
});

test('execução em andamento nunca é classificada como sucesso final',()=>{
 assert.equal(summarizeProject(repo,[run(23,null,'in_progress')],[]).state,'executando');
 assert.equal(summarizeProject(repo,[],[]).state,'sem_dados');
 assert.equal(summarizeProject(repo,[run(24,'success')],[pr(30,true)]).state,'revisao');
});

test('falha de consulta preserva transparência, sem status verde',()=>{
 const state=summarizeProject(repo,[],[],{message:'403 rate limit'});
 assert.equal(state.state,'indisponivel');
 assert.match(state.note,/indispon/i);
});

test('relatório é legível e possui dados estruturados versionados recuperáveis',()=>{
 const generatedAt='2026-11-05T21:00:00.000Z';
 const projects=[summarizeProject(repo,[run(24,'success')],[pr(30)])];
 const body=buildReport(projects,generatedAt);
 assert.match(body,/PG Bot/);
 assert.match(body,/Não comprova publicação/);
 const parsed=parseReport(body);
 assert.equal(parsed.version,1);
 assert.equal(parsed.generatedAt,generatedAt);
 assert.equal(parsed.projects[0].repository,repo);
 assert.equal(parsed.projects[0].state,'revisao');
});

test('títulos de PR são tratados como dados, não como HTML ou Markdown ativo',()=>{
 const injected={...pr(40),title:'<img src=x onerror=alert(1)> --> [clique](https://bad.example)'};
 const body=buildReport([summarizeProject(repo,[run(29,'failure')],[injected])],'2026-11-05T21:00:00.000Z');
 assert.doesNotMatch(body,/<img|onerror=|bad\.example|--> \[clique/);
 assert.equal(parseReport(body).projects[0].openPRs[0].number,40);
});

test('relatório sem bloco verificável é rejeitado',()=>{
 assert.equal(parseReport('Acompanhe seus projetos.'),null);
 assert.equal(parseReport('<!-- pg-bot-automation:v1\n{}\n-->'),null);
});

test('parser recusa dados incompletos ou URLs injetadas no relatório',()=>{
 const summary=summarizeProject(repo,[run(50,'success')],[pr(5)]);
 const sample={version:1,generatedAt:'2026-11-05T21:00:00.000Z',projects:[summary]};
 const withData=data=>'<!-- pg-bot-automation:v1\n'+JSON.stringify(data)+'\n-->';
 assert.ok(parseReport(withData(sample)));
 assert.equal(parseReport(withData({...sample,projects:[{...summary,workflows:null}]})),null);
 const malicious={...summary,workflows:[{...summary.workflows[0],url:'javascript:alert(1)'}]};
 assert.equal(parseReport(withData({...sample,projects:[malicious]})),null);
});

test('parser rejeita projetos repetidos para não inflar indicadores',()=>{
 const sample=summarizeProject(repo,[run(80,'success')],[]);
 const body=buildReport([sample,sample],'2026-11-11T19:00:00.000Z');
 assert.equal(parseReport(body),null);
});

test('parser rejeita observações desproporcionais no snapshot',()=>{
 const sample=summarizeProject(repo,[run(81,'success')],[]);
 const body=buildReport([{...sample,note:'X'.repeat(10000)}],'2026-11-11T19:00:00.000Z');
 assert.equal(parseReport(body),null);
});

test('parser rejeita snapshot com data no futuro além da tolerância',()=>{
 const sample=summarizeProject(repo,[run(82,'success')],[]);
 const tomorrow=new Date(Date.now()+24*60*60*1000).toISOString();
 assert.equal(parseReport(buildReport([sample],tomorrow)),null);
});
