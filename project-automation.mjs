// Evidências públicas do GitHub. Sem execução de código ou escrita em outros repositórios.
export const MONITORED_REPOS=Object.freeze([
 'pabloguilherme1121/PG-Bot','pabloguilherme1121/PG-Arcade',
 'pabloguilherme1121/PG-Estrategia','pabloguilherme1121/PG-portfolio',
 'pabloguilherme1121/pg-tech-storefront','pabloguilherme1121/pg-tech-operacoes',
 'pabloguilherme1121/Cuidador-a-','pabloguilherme1121/eleicoes-goias-2026',
 'pabloguilherme1121/universo-pablo-builds','pabloguilherme1121/Eliane-template-01',
 'pabloguilherme1121/elianefashion-netlify-template'
]);
export const REPORT_TITLE='PG Bot | Monitoramento dos projetos';
export const STATE_LABELS=Object.freeze({
 falha:'Falha em CI',executando:'CI em andamento',revisao:'PR em revisão',
 ok:'Última CI aprovada',sem_dados:'Sem CI observada',indisponivel:'Consulta indisponível'
});
const FAILURES=new Set(['failure','timed_out','action_required','startup_failure']);
const txt=(value,length=90)=>String(value??'').replace(/<[^>]*>/g,'')
 .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/https?:\/\/\S+/gi,'')
 .replace(/-->/g,'').replace(/[\r\n\t]+/g,' ')
 .replace(/[|*#\x60[\]{}]/g,'').replace(/\s+/g,' ').trim().slice(0,length);
const latestPerWorkflow=runs=>{
 const sorted=[...runs].filter(r=>r&&typeof r==='object')
  .sort((a,b)=>(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0));
 const seen=new Set();
 return sorted.filter(r=>{
  const key=String(r.workflow_id||r.path||r.name||r.id||'');
  if(!key||seen.has(key))return false;
  seen.add(key);return true;
 }).slice(0,12);
};
export function summarizeProject(repository,runs=[],prs=[],error=null){
 if(!MONITORED_REPOS.includes(repository))throw Error('Repositório não autorizado: '+repository);
 if(error)return {repository,state:'indisponivel',note:'Dados indisponíveis na consulta; nenhum resultado foi presumido.',workflows:[],openPRs:[]};
 const workflows=latestPerWorkflow(Array.isArray(runs)?runs:[]).map(run=>{
  const id=Number.isSafeInteger(Number(run.id))&&Number(run.id)>0?Number(run.id):0;
  const status=txt(run.status,24),conclusion=txt(run.conclusion,24);
  return {id,name:txt(run.name||'Workflow',80),status,conclusion,createdAt:txt(run.created_at,35),
   url:id?'https://github.com/'+repository+'/actions/runs/'+id:'https://github.com/'+repository+'/actions'};
 });
 const openPRs=(Array.isArray(prs)?prs:[]).filter(pr=>pr&&pr.state==='open'&&Number.isInteger(pr.number)&&pr.number>0)
  .slice(0,15).map(pr=>({number:pr.number,title:txt(pr.title,90),draft:pr.draft===true,
   url:'https://github.com/'+repository+'/pull/'+pr.number}));
 let state='sem_dados';
 if(workflows.some(w=>w.status==='completed'&&FAILURES.has(w.conclusion)))state='falha';
 else if(workflows.some(w=>w.status!=='completed'))state='executando';
 else if(openPRs.length)state='revisao';
 else if(workflows.some(w=>w.status==='completed'&&w.conclusion==='success'))state='ok';
 const notes={
  falha:'Ao menos uma última execução observada de workflow falhou. Verifique a run.',
  executando:'Há verificação sem conclusão. Não atribuir aprovação ou publicação.',
  revisao:'Há PR aberta. PR não equivale a merge ou publicação.',
  ok:'Últimas execuções observadas concluídas com sucesso. Não comprova deploy.',
  sem_dados:'Nenhuma execução concluída com sucesso foi observada nesta amostra.'
 };
 return {repository,state,note:notes[state],workflows,openPRs};
}
export function buildReport(projects,generatedAt=new Date().toISOString()){
 if(!Array.isArray(projects)||!Number.isFinite(Date.parse(generatedAt)))throw Error('Relatório inválido');
 const safeProjects=projects.filter(p=>p&&MONITORED_REPOS.includes(p.repository));
 const rows=safeProjects.map(p=>{
  const failed=p.workflows.filter(w=>FAILURES.has(w.conclusion)&&w.status==='completed').length;
  return '| ['+p.repository+'](https://github.com/'+p.repository+') | '+STATE_LABELS[p.state]+' | '+failed+' | '+p.openPRs.length+' |';
 }).join('\n');
 const details=safeProjects.map(p=>{
  const bad=p.workflows.filter(w=>w.status==='completed'&&FAILURES.has(w.conclusion)).slice(0,3)
   .map(w=>'- Falha: ['+txt(w.name,65)+']('+w.url+') ('+w.conclusion+')').join('\n');
  const waiting=p.openPRs.slice(0,3).map(pr=>'- PR [#'+pr.number+']('+pr.url+'): '+txt(pr.title,90)+(pr.draft?' (rascunho)':'')).join('\n');
  return '### '+p.repository+'\n'+p.note+'\n'+(bad?bad+'\n':'')+(waiting?waiting+'\n':'');
 }).join('\n');
 const payload={version:1,generatedAt,projects:safeProjects};
 return [
  '# PG Bot | Relatório automatizado dos projetos',
  'Verificado via API pública do GitHub em **'+generatedAt+'**. Amostra: até 100 PRs abertas e 30 runs recentes por repositório; somente as runs mais recentes de cada workflow entram na classificação.',
  '',
  '| Projeto | Última evidência | Falhas | PRs abertas (até 15) |',
  '|:--|:--|--:|--:|',rows,'',details,
  '## Limites e segurança',
  'Não comprova publicação, revisão humana, cobertura dos testes, homologação Android ou conclusão de merge.',
  'Este relatório é informativo e não altera código, não aprova PRs, não executa deploy e não acessa dados privados.',
  '',
  '<!-- pg-bot-automation:v1',JSON.stringify(payload),'-->'
 ].join('\n');
}
export function parseReport(body){
 if(typeof body!=='string')return null;
 const match=body.match(/<!-- pg-bot-automation:v1\n([^\n]+)\n-->/);
 if(!match)return null;
 try{
  const data=JSON.parse(match[1]);
  if(data?.version!==1||!Number.isFinite(Date.parse(data.generatedAt))||!Array.isArray(data.projects))return null;
  if(data.projects.length>MONITORED_REPOS.length)return null;
  if(data.projects.some(p=>{
   if(!p||!MONITORED_REPOS.includes(p.repository)||!Object.hasOwn(STATE_LABELS,p.state))return true;
   if(typeof p.note!=='string'||!Array.isArray(p.workflows)||!Array.isArray(p.openPRs)||p.workflows.length>12||p.openPRs.length>15)return true;
   const base='https://github.com/'+p.repository;
   if(p.workflows.some(w=>!w||!Number.isSafeInteger(w.id)||w.id<0||
    w.url!==(w.id?base+'/actions/runs/'+w.id:base+'/actions')))return true;
   if(p.openPRs.some(pr=>!pr||!Number.isSafeInteger(pr.number)||pr.number<1||
    pr.url!==base+'/pull/'+pr.number))return true;
   return false;
  }))return null;
  return data;
 }catch{return null}
}
