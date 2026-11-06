import {PAGE_SIZE,QUESTIONS,OWNER,pageOf,safeHttps,validateQueue,describeQuestion,suggestedAction} from './core.mjs';
import {fetchCatalog,fetchContext} from './api.mjs';

const $ = id => document.getElementById(id);
const date = iso => iso && !Number.isNaN(Date.parse(iso)) ?
  new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso)) : 'data indisponível';
const state = {repos:[],selected:null,context:null,page:1,query:'',queue:[],token:0};
const QUEUE_KEY='pg-bot-ecossistema-v1:queue';

function text(tag,value,className) {
  const el=document.createElement(tag);
  el.textContent=String(value??'');
  if(className) el.className=className;
  return el;
}
function link(label,url) {
  const href=safeHttps(url);
  if(!href)return null;
  const a=document.createElement('a');a.href=href;a.textContent=label;
  a.target='_blank';a.rel='noopener noreferrer';return a;
}
function store() {
  try {localStorage.setItem(QUEUE_KEY,JSON.stringify(state.queue));$('save-status').textContent='Sugestões armazenadas neste navegador.';}
  catch {$('save-status').textContent='Armazenamento indisponível. As sugestões permanecem somente nesta aba.';}
}
function readQueue() {
  try {return validateQueue(JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]'));}
  catch {return [];}
}
function filtered() {
  const term=state.query.toLocaleLowerCase('pt-BR');
  return state.repos.filter(r=>(r.name+' '+r.description).toLocaleLowerCase('pt-BR').includes(term));
}
function renderRepos() {
  const records=filtered(), {items,current,pages,total}=pageOf(records,state.page,PAGE_SIZE);
  state.page=current;
  $('repo-total').textContent=String(total);
  $('page-info').textContent='Página '+current+' de '+pages;
  $('prev').disabled=current<=1;
  $('next').disabled=current>=pages;
  const frag=document.createDocumentFragment();
  if(!items.length)frag.append(text('p','Nenhum projeto encontrado com este filtro.','empty'));
  for(const repo of items){
    const button=document.createElement('button');
    button.type='button';button.className='repo-button';
    button.setAttribute('aria-pressed',String(state.selected?.name===repo.name));
    button.append(text('strong',repo.name),text('small',repo.description || 'Sem descrição pública cadastrada.'));
    button.addEventListener('click',()=>selectRepo(repo));
    frag.append(button);
  }
  $('repo-list').replaceChildren(frag);
}
function contextStatus() {
  if(!state.context)return 'O contexto ainda não foi consultado.';
  const names={readme:'README',pulls:'PRs',runs:'CI',package:'Arquitetura',workflows:'Workflows'};
  return Object.entries(names).map(([key,name])=>{
    const info=state.context[key];
    return name+': '+(info?.stale?'antigo/indisponível':'consultado')+' · '+date(info?.fetchedAt);
  }).join(' | ');
}
function renderDetail() {
  const repo=state.selected;
  $('detail-heading').textContent=repo?repo.name:'Escolha um projeto';
  $('detail-description').textContent=repo?.description || 'Descrição pública indisponível.';
  $('context-badge').textContent=repo?'Somente dados públicos':'Sem contexto';
  const dest=document.createDocumentFragment();
  if(repo){
    const code=link('Abrir repositório',repo.url);
    const home=link('Endereço informado no GitHub',repo.homepage);
    if(code)dest.append(code);
    if(home)dest.append(home);
  }
  $('detail-links').replaceChildren(dest);
  $('context-status').textContent=contextStatus();
  $('suggest').disabled=!repo;
  const questions=document.createDocumentFragment();
  for(const [topic,label] of QUESTIONS){
    const button=text('button',label);
    button.type='button';button.disabled=!repo;
    button.addEventListener('click',()=>answer(topic));
    questions.append(button);
  }
  $('questions').replaceChildren(questions);
}
function answer(topic) {
  if(!state.selected)return;
  const result=describeQuestion(topic,state.selected,state.context);
  $('answer-text').textContent=result.answer;
  const frag=document.createDocumentFragment();
  const source=link('Abrir origem',result.url);
  if(source)frag.append(source);
  frag.append(text('span','Consulta: '+date(result.fetchedAt)));
  if(result.stale)frag.append(text('strong','Dados antigos ou indisponíveis'));
  $('answer-source').replaceChildren(frag);
}
async function selectRepo(repo,force=false) {
  state.selected=repo;
  state.context=null;
  const token=++state.token;
  const url=new URL(location.href);
  url.searchParams.set('project',repo.name);
  history.replaceState(null,'',url.pathname+url.search);
  renderRepos();renderDetail();
  $('answer-text').textContent='Consultando documentação e informações públicas deste projeto...';
  $('answer-source').replaceChildren();
  $('context-status').textContent='Consultando GitHub sem credenciais...';
  try {
    const context=await fetchContext(repo,force);
    if(token!==state.token)return;
    state.context=context;
    renderDetail();
    answer('funcoes');
  }catch(error){
    if(token!==state.token)return;
    $('context-status').textContent='Contexto indisponível: '+String(error.message);
    $('answer-text').textContent='Não foi possível consultar informações públicas agora.';
  }
}
async function loadCatalog(force=false) {
  $('refresh').disabled=true;
  $('catalog-status').textContent='Consultando o catálogo público...';
  try {
    const catalog=await fetchCatalog(force);
    state.repos=catalog.data.map(r=>({...r,catalogFetchedAt:catalog.fetchedAt,catalogStale:catalog.stale}));
    $('catalog-status').textContent=(catalog.stale?'Dados antigos. ':'')+
      (catalog.error ? 'Consulta falhou: '+catalog.error+'. ' : '')+
      catalog.source+' · '+date(catalog.fetchedAt)+'.';
    const current=state.repos.find(r=>r.name===state.selected?.name);
    const requested=new URL(location.href).searchParams.get('project');
    const preferred=state.repos.find(r=>r.name===requested);
    const first=current||preferred||state.repos.find(r=>r.name==='PG-Bot')||state.repos[0];
    renderRepos();
    if(first)await selectRepo(first,force);
    else{
      state.selected=null;state.context=null;
      renderDetail();
      $('answer-text').textContent='Catálogo indisponível. Atualize quando houver conexão.';
    }
  }finally {$('refresh').disabled=false;}
}
function renderQueue() {
  $('queue-count').textContent=String(state.queue.length);
  const container=document.createDocumentFragment();
  if(!state.queue.length) container.append(text('p','Nenhuma sugestão preparada. Selecione um projeto e use “Preparar sugestão”.','empty'));
  for(const item of state.queue){
    const card=document.createElement('article');card.className='queue-card';
    card.append(text('h3',item.project+' · '+(item.reviewed?'Revisada':'A revisar')));
    const reasonLabel=text('label','Motivo');reasonLabel.htmlFor='reason-'+item.id;
    const reason=document.createElement('textarea');reason.id=reasonLabel.htmlFor;
    reason.maxLength=1500;reason.value=item.reason;
    reason.addEventListener('input',()=>{item.reason=reason.value;store();});
    const nextLabel=text('label','Próximo passo');nextLabel.htmlFor='next-'+item.id;
    const next=document.createElement('textarea');next.id=nextLabel.htmlFor;
    next.maxLength=1500;next.value=item.next;
    next.addEventListener('input',()=>{item.next=next.value;store();});
    card.append(reasonLabel,reason,nextLabel,next);
    if(item.evidence)card.append(link('Evidência pública',item.evidence));
    const actions=document.createElement('div');actions.className='queue-actions';
    const checkLabel=document.createElement('label');
    const checkbox=document.createElement('input');checkbox.type='checkbox';
    checkbox.checked=item.reviewed;checkbox.setAttribute('aria-label','Marcar '+item.project+' como revisada');
    checkbox.addEventListener('change',()=>{item.reviewed=checkbox.checked;store();renderQueue();});
    checkLabel.append(checkbox,text('span','Revisada'));
    const remove=text('button','Excluir');remove.type='button';
    remove.addEventListener('click',()=>{state.queue=state.queue.filter(x=>x.id!==item.id);store();renderQueue();});
    actions.append(checkLabel,remove);card.append(actions);container.append(card);
  }
  $('queue').replaceChildren(container);
}
function addSuggestion() {
  if(!state.selected)return;
  const source=suggestedAction(state.selected,state.context);
  const item={id:crypto.randomUUID(),...source,reviewed:false,createdAt:new Date().toISOString()};
  state.queue=validateQueue([item,...state.queue]);
  store();renderQueue();
  $('tasks-title').scrollIntoView({block:'start',behavior:'auto'});
}
function exportQueue() {
  const data={version:1,exportedAt:new Date().toISOString(),source:'PG Bot · revisão local',suggestions:state.queue};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');anchor.href=url;anchor.download='pg-bot-sugestoes.json';anchor.hidden=true;
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('save-status').textContent='Exportação preparada. Nenhuma alteração executada.';
}
if(new URL(location.href).searchParams.get('embed')==='1') {
  document.body.classList.add('embed');
  const close=text('button','Fechar assistente');close.type='button';close.className='button subtle';
  close.addEventListener('click',()=>window.parent.postMessage({type:'pgbot-ecosystem-close'},location.origin));
  document.querySelector('.intro-actions').append(close);
}
state.queue=readQueue();renderQueue();
$('repo-search').addEventListener('input',event=>{state.query=event.target.value.trim();state.page=1;renderRepos();});
$('prev').addEventListener('click',()=>{state.page--;renderRepos();});
$('next').addEventListener('click',()=>{state.page++;renderRepos();});
$('refresh').addEventListener('click',()=>loadCatalog(true));
$('suggest').addEventListener('click',addSuggestion);
$('export').addEventListener('click',exportQueue);
loadCatalog(true).catch(error=>{$('catalog-status').textContent='Erro ao consultar o catálogo: '+String(error.message);$('refresh').disabled=false;});
