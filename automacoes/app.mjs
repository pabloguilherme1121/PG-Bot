import {parseReport,STATE_LABELS,REPORT_TITLE} from '../project-automation.mjs';
import {planActions,reportFreshness} from '../project-automation-actions.mjs';
const API='https://api.github.com/repos/pabloguilherme1121/PG-Bot/issues?state=open&per_page=100';
const $=id=>document.getElementById(id);
const priority={falha:0,indisponivel:1,executando:2,revisao:3,sem_dados:4,ok:5};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
let report=null;
let projectFilter='all';
const filterProject=p=>projectFilter==='all'||(projectFilter==='attention'&&['falha','indisponivel','executando','sem_dados'].includes(p.state))||(projectFilter==='review'&&p.state==='revisao')||(projectFilter==='ok'&&p.state==='ok');
function updateFilterButtons(){
 for(const button of document.querySelectorAll('[data-project-filter]')){
  const selected=button.dataset.projectFilter===projectFilter;
  button.classList.toggle('is-active',selected);
  button.setAttribute('aria-pressed',String(selected));
 }
}
function render(){
 const projects=report.projects.slice().sort((a,b)=>(priority[a.state]??9)-(priority[b.state]??9));
 const visibleProjects=projects.filter(filterProject);
 updateFilterButtons();
 $('count-projects').textContent=String(projects.length);
 $('count-failures').textContent=String(projects.filter(p=>p.state==='falha').length);
 $('count-prs').textContent=String(projects.reduce((n,p)=>n+p.openPRs.length,0));
 $('count-unavailable').textContent=String(projects.filter(p=>p.state==='indisponivel').length);
 $('overall-state').textContent=projects.some(p=>p.state==='falha')?'Falhas exigem atenção':projects.some(p=>p.state==='indisponivel')?'Dados parciais':'Relatório disponível';
 document.querySelector('.live').dataset.health=projects.some(p=>p.state==='falha')?'falha':projects.some(p=>p.state==='indisponivel')?'indisponivel':'ok';
 $('last-check').textContent='Verificado em '+new Date(report.generatedAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'});
 $('projects').replaceChildren(...visibleProjects.map(p=>{
  const card=el('article','project'),head=el('div','project-head'),name=el('a','project-name',p.repository.split('/')[1]);
  card.dataset.state=p.state;
  name.href='https://github.com/'+p.repository;name.rel='noopener noreferrer';name.target='_blank';
  head.append(name,el('span','state state-'+p.state,STATE_LABELS[p.state]));card.append(head);
  card.append(el('p','project-note',p.note));
  card.append(el('p','meta',p.openPRs.length+' PRs exibidas · '+p.workflows.length+' workflows observados'));
  for(const w of p.workflows.filter(x=>x.status==='completed'&&['failure','timed_out','action_required','startup_failure'].includes(x.conclusion)).slice(0,2)){
   const a=el('a','run-link','Ver falha: '+w.name);a.href=w.url;a.rel='noopener noreferrer';a.target='_blank';card.append(a);
  }
  if(p.openPRs.length){const a=el('a','run-link','Ver PRs abertas');a.href='https://github.com/'+p.repository+'/pulls';a.rel='noopener noreferrer';a.target='_blank';card.append(a)}
  return card;
 }));
 if(!visibleProjects.length)$('projects').replaceChildren(el('p','empty-state','Nenhum projeto nesta categoria. Selecione outro filtro.'));
 const actions=planActions(report).slice(0,6);
 $('action-queue').replaceChildren(...actions.map(a=>{
  const card=el('article','action-item'),head=el('div','action-head');
  head.append(el('span','action-priority '+a.priority.toLowerCase(),a.priority),el('span','',a.project));
  card.append(head,el('h3','',a.title),el('p','',a.description));
  const link=el('a','', 'Abrir evidência no GitHub');
  link.href=a.url;link.rel='noopener noreferrer';link.target='_blank';card.append(link);
  return card;
 }));
 const freshness=reportFreshness(report.generatedAt);
 if(freshness.status!=='atual')$('overall-state').textContent=freshness.status==='desatualizado'?'Relatório desatualizado':'Data do relatório inválida';
}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function answer(text){
 if(!report)return 'Não há relatório verificável carregado. Execute o monitor no GitHub Actions e tente atualizar.';
 const q=norm(text),projects=report.projects;
 const aliases=[['PG-Arcade',['arcade','pga']],['PG-Estrategia',['estrategia']],['PG-portfolio',['portfolio','portifolio']],['PG-Bot',['pg bot','pg-bot']],['Cuidador',['cuidador']],['Cuidador-a-',['cuidador legado']],['pg-tech-storefront',['storefront','loja']],['pg-tech-operacoes',['operacoes']],['eleicoes-goias-2026',['eleicoes']]];
 const found=aliases.find(([name,terms])=>terms.some(t=>q.includes(t))&&projects.some(p=>p.repository.endsWith('/'+name)));
 if(found){const p=projects.find(item=>item.repository.endsWith('/'+found[0]));return found[0]+': '+STATE_LABELS[p.state]+'. '+p.note+' '+p.openPRs.length+' PRs abertas exibidas.'}
 if(/falh|erro|problema|bloque/.test(q)){const bad=projects.filter(p=>['falha','indisponivel'].includes(p.state));return bad.length?'Atenção: '+bad.map(p=>p.repository.split('/')[1]+' ('+STATE_LABELS[p.state]+')').join('; ')+'.':'Nenhuma falha classificada nesta amostra. Isso não garante que todos os testes passaram.'}
 if(/\bpr\b|pull|revis|abert/.test(q)){const active=projects.filter(p=>p.openPRs.length);return active.length?'PRs abertas: '+active.map(p=>p.repository.split('/')[1]+': '+p.openPRs.length).join('; ')+'.':'Nenhuma PR aberta foi observada.'}
 if(/prior|primeiro|proxim|fazer|hoje/.test(q)){
  const pending=planActions(report).filter(a=>a.category!=='ok').slice(0,3);
  return pending.length?'Próximas ações sugeridas: '+pending.map((a,i)=>(i+1)+'. '+a.project+' ('+a.priority+'): '+a.title).join('; ')+'. Todas exigem revisão antes da execução.':'Sem falhas ou pendências classificadas nesta amostra. Confira a publicação separadamente.';
 }
 return 'Resumo de '+new Date(report.generatedAt).toLocaleDateString('pt-BR')+': '+projects.length+' projetos, '+projects.filter(p=>p.state==='falha').length+' falhas de CI e '+projects.filter(p=>p.state==='indisponivel').length+' consultas indisponíveis. Pergunte por falhas, PRs, prioridades ou um projeto.';
}
function reply(q){const log=$('messages');log.append(el('p','message user',q),el('p','message',answer(q)));log.scrollTop=log.scrollHeight}
async function refresh(){
 $('refresh').disabled=true;$('load-status').textContent='Consultando GitHub...';
 try{
  const res=await fetch(API,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
  if(!res.ok)throw Error('GitHub HTTP '+res.status);
  const issues=await res.json();
  const issue=issues.find(x=>!x.pull_request&&x.title===REPORT_TITLE);
  const data=issue&&parseReport(issue.body);
  if(!data)throw Error('Relatório ainda não publicado ou inválido');
  if(reportFreshness(data.generatedAt).status==='invalido')throw Error('Data do relatório inválida');
  report=data;render();
  $('load-status').textContent=reportFreshness(report.generatedAt).status==='desatualizado'?'Relatório desatualizado (mais de 24 horas). Reexecute o monitor; não presuma estado atual.':'Snapshot carregado. Os dados não são uma verificação em tempo real.';
 }catch(error){$('load-status').textContent=error.message+'. Nenhum resultado foi presumido.'}
 finally{$('refresh').disabled=false}
}
for(const button of document.querySelectorAll('[data-project-filter]')){
 button.addEventListener('click',()=>{projectFilter=button.dataset.projectFilter;updateFilterButtons();if(report)render();});
}
$('refresh').addEventListener('click',refresh);
$('ask').addEventListener('submit',e=>{e.preventDefault();const q=$('question').value.trim();if(q){reply(q);$('question').value='';$('question').focus()}});
for(const b of document.querySelectorAll('[data-prompt]'))b.addEventListener('click',()=>reply(b.dataset.prompt));
refresh();
