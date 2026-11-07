// Fotografia auditada do GitHub em 03/11/2026. Não é um monitoramento em tempo real.
export const REPOS={bot:'PG-Bot',estrategia:'PG-Estrategia',arcade:'PG-Arcade'};
export const REPO_OWNER='pabloguilherme1121';
export const SNAPSHOT_AT='2026-11-03T01:45:00-03:00';
export const CHECK_ITEMS=['Diff e dependências revisados','Checks na HEAD final','Playwright 320 e 390 px','IDs e contratos preservados','Merge na main confirmado','Produção validada separadamente'];

export function safeHttpUrl(value){
 try{const u=new URL(String(value).trim());if(u.protocol!=='https:'||u.username||u.password||!u.hostname||value.length>2000)return null;return u.href;}
 catch{return null;}
}
export function classifyEvidence(ev){if(ev.source==='github-api'&&ev.verified)return 'verificada no GitHub';if(ev.source==='manual'&&ev.reviewed)return 'revisão humana';return 'informada';}
export function validProof(ev){return !!ev&&(ev.source==='github-api'&&ev.verified||ev.source==='manual'&&ev.reviewed&&ev.note?.trim().length>=12)&&!!safeHttpUrl(ev.url);}
export function verifiedGate(state,gate){return gate.status==='comprovado'&&gate.evidenceIds?.some(id=>validProof(state.evidences.find(x=>x.id===id)));}
export function auditProgress(state,project='all'){
 const list=state.gates.filter(g=>g.critical&&(project==='all'||g.project===project));
 const done=list.filter(g=>verifiedGate(state,g)).length;
 return {done,total:list.length,percent:list.length?Math.round(done/list.length*100):0};
}
export function selectCurrentMainRun(workflowRuns,headSha,workflowName){
 if(!Array.isArray(workflowRuns)||typeof headSha!=='string'||!/^[0-9a-f]{40}$/.test(headSha)||typeof workflowName!=='string')return null;
 return workflowRuns
  .filter(run=>run&&run.name===workflowName&&run.head_branch==='main'&&run.head_sha===headSha&&run.status==='completed')
  .sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0))[0]||null;
}
export function mergeGithubPr(pr,payload,time){
 const mergedAt=typeof payload.merged_at==='string'&&Number.isFinite(Date.parse(payload.merged_at))?payload.merged_at:null;
 return {...pr,mergedAt,githubState:mergedAt?'merged':payload.state==='open'?'open':payload.state==='closed'?'closed':pr.githubState,lastChecked:time,source:'github-api'};
}
export function normalizeImport(raw,{untrusted=false}={}){
 const invalid=()=>{throw Error('Arquivo inválido: registros inconsistentes.');};
 const text=(value,max=5000)=>typeof value==='string'&&value.length<=max;
 const ids=value=>Array.isArray(value)&&value.length<=700&&value.every(id=>text(id,100));
 const date=value=>text(value,80)&&Number.isFinite(Date.parse(value));
 const optionalDate=value=>value==null||value===''||date(value);
 if(!raw||raw.version!==1||!date(raw.snapshotAt)||!optionalDate(raw.updatedAt)||!optionalDate(raw.lastGithubSync)||
    !['gates','integrations','prs','evidences','tasks'].every(key=>Array.isArray(raw[key]))||
    raw.gates.length>200||raw.integrations.length>400||raw.prs.length>200||
    raw.evidences.length>700||raw.tasks.length>400||
    Object.keys(raw).some(key=>!['version','snapshotAt','updatedAt','lastGithubSync','gates','integrations','prs','evidences','tasks'].includes(key)))
   throw Error('Arquivo inválido: esquema não reconhecido.');
 for(const field of ['gates','integrations','prs','evidences','tasks']){
   for(const item of raw[field]){
     if(!item||typeof item!=='object'||Array.isArray(item)||!text(item.id,100)||!item.id)invalid();
   }
 }
 for(const gate of raw.gates){
   if(!text(gate.title)||!text(gate.status,50)||!text(gate.project,50)||
      typeof gate.critical!=='boolean'||!ids(gate.evidenceIds))invalid();
 }
 for(const integration of raw.integrations){
   if(!text(integration.title)||!text(integration.project,50)||!ids(integration.evidenceIds))invalid();
 }
 for(const pr of raw.prs){
   if(!text(pr.title)||!text(pr.repo,100)||!Number.isSafeInteger(pr.number)||
      pr.number<1||!safeHttpUrl(pr.url)||!optionalDate(pr.mergedAt)||
      !optionalDate(pr.lastChecked)||!Array.isArray(pr.checklist)||pr.checklist.length>30||
      !pr.checklist.every(check=>check&&typeof check==='object'&&!Array.isArray(check)&&
        text(check.label)&&typeof check.done==='boolean'&&(check.note==null||text(check.note))))invalid();
 }
 for(const ev of raw.evidences){
   if(!text(ev.title)||!safeHttpUrl(ev.url)||!optionalDate(ev.date)||
      (ev.note!=null&&!text(ev.note))||
      (ev.reviewed!=null&&typeof ev.reviewed!=='boolean')||
      (ev.verified!=null&&typeof ev.verified!=='boolean'))invalid();
 }
 for(const task of raw.tasks){
   if(!text(task.title)||!text(task.project,50)||!text(task.priority,20)||
      (task.notes!=null&&!text(task.notes)))invalid();
 }
 let bytes;
 try{bytes=JSON.stringify(raw).length;}catch{invalid();}
 if(bytes>2000000)throw Error('Arquivo muito grande.');
 const restored=structuredClone(raw);
  if(untrusted){
   for(const evidence of restored.evidences){
    if(evidence.source==='github-api'){evidence.verified=false;evidence.reviewed=false;}
   }
   for(const pr of restored.prs){
    pr.mergedAt=null;pr.githubState='pending';pr.lastChecked=null;pr.source='imported';
    if(Array.isArray(pr.checklist)&&pr.checklist[4])pr.checklist[4].done=false;
   }
   restored.lastGithubSync=null;
  }
  return restored;
}
export function upsertGithubEvidence(state,evidence){
 const url=safeHttpUrl(evidence?.url);
 if(!state||!Array.isArray(state.evidences)||evidence?.source!=='github-api'||evidence.verified!==true||!url||new URL(url).hostname!=='github.com'||typeof evidence.id!=='string')throw Error('Evidência GitHub inválida');
 const next={...evidence,url};
 const index=state.evidences.findIndex(existing=>existing.id===next.id);
 if(index>=0)state.evidences[index]=next;
 else state.evidences.push(next);
}
/**
 * A JSON file cannot authenticate the origin of its own proof flags.
 * Keep its notes and links, but ask for a fresh GitHub lookup or human review.
 */
export function normalizeExternalBackup(raw){
 const state=normalizeImport(raw);
 for(const evidence of state.evidences){
  evidence.verified=false;
  evidence.reviewed=false;
 }
 for(const pr of state.prs){
  pr.mergedAt=null;
  pr.githubState='em-validacao';
  pr.lastChecked=null;
  pr.source='backup';
  for(const check of pr.checklist){
   if(check.label==='Merge na main confirmado'||check.label==='Produção validada separadamente')
    check.done=false;
  }
 }
 for(const gate of state.gates){
  if(gate.status==='comprovado'&&!verifiedGate(state,gate))gate.status='em-validacao';
 }
 state.lastGithubSync=null;
 return state;
}
export function makeSeed(){
 const evidence=(id,project,title,url,kind='GitHub')=>({id,project,title,url,kind,source:'github-api',verified:true,reviewed:false,note:'Verificado por consulta ao GitHub; verificar SHA, escopo e data ao reutilizar.',date:'2026-11-03T01:45:00-03:00'});
 const evidences=[
 evidence('ev-bot-ci','both','PG Bot CI na main: build + Chromium, Firefox, WebKit + paridade dos catálogos','https://github.com/pabloguilherme1121/PG-Bot/actions/runs/41496397998','CI'),
 evidence('ev-str-ci','estrategia','PG Estratégia: testes de motores, PG Bot e build na main','https://github.com/pabloguilherme1121/PG-Estrategia/actions/runs/41496188599','CI'),
 evidence('ev-bot-pages','both','Build e deploy do PG Bot no GitHub Pages concluído (não é teste HTTP da página)','https://github.com/pabloguilherme1121/PG-Bot/actions/runs/41496397868','Deploy'),
 evidence('ev-str-pages','estrategia','GitHub Pages PG Estratégia: workflow concluído (não é homologação)','https://github.com/pabloguilherme1121/PG-Estrategia/actions/runs/41496300778','Deploy'),
 ...[['ev-pr5','estrategia',5,'Gravidade dos Cristais'],['ev-pr6','estrategia',6,'Domínio Territorial'],['ev-pr9','estrategia',9,'Telemetria local opt-in'],['ev-pr10','estrategia',10,'Adaptador de jogadas'],['ev-pr15','both',15,'Guia offline contextual'],['ev-pr16','both',16,'BroadcastChannel com consentimento'],['ev-pr17','both',17,'Jogadas de Gravidade'],['ev-pr295','arcade',295,'Auditoria individual dos 150 jogos']].map(([id,project,n,title])=>evidence(id,project,`Merge confirmado: ${title} (PR #${n})`,`https://github.com/pabloguilherme1121/${n===295?'PG-Arcade':n>=15?'PG-Bot':'PG-Estrategia'}/pull/${n}`,'Merge'))
 ];
 const gi=(id,project,title,status,evidenceIds=[],critical=true,desc='')=>({id,project,title,status,evidenceIds,critical,desc,note:''});
 const gates=[
 gi('str-ci','estrategia','CI de motores e PG Bot na main','comprovado',['ev-str-ci'],true,'Workflow de testes e build concluído com sucesso; não mede Android físico.'),
 gi('str-catalog','estrategia','IDs e destinos do catálogo (338 registros)','comprovado',['ev-bot-ci'],true,'Job de paridade do PG Bot com os dois catálogos aprovado.'),
 gi('str-contract','estrategia','Contratos legados e IDs imutáveis','pendente',[],true,'Comparar tipos, schemas e IDs antes/depois de cada mudança.'),
 gi('str-320','estrategia','Playwright integrado a 320 px','pendente',[],true,'Provar abertura, PG Bot, foco, scroll, toque e ausência de overflow.'),
 gi('str-390','estrategia','Playwright integrado a 390 px','pendente',[],true,'Provar orientação, telemetria, resposta contextual e navegação.'),
 gi('str-telemetry','estrategia','Turnos e jogadas em partidas reais','em-validacao',['ev-pr9','ev-pr10','ev-pr16','ev-pr17'],true,'Validar opt-in, gameId, TTL, sincronização e recusa de eventos falsos.'),
 gi('str-offline','estrategia','Guia offline em navegador desconectado','em-validacao',['ev-pr15'],true,'Recarregar após cache e testar primeira visita sem conexão.'),
 gi('str-android','estrategia','Android físico com evidências','bloqueado',[],true,'Modelo/Android/Chrome, 5 partidas frias + 5 quentes e vídeo ou logs.'),
 gi('str-deploy','estrategia','Produção HTTP e conteúdo corretos','em-validacao',['ev-str-pages'],true,'Workflow de Pages verde não equivale à validação da URL e versão publicada.'),
 gi('arc-bot-ci','arcade','CI do PG Bot + paridade do catálogo','comprovado',['ev-bot-ci'],true,'Validação automatizada do snapshot de IDs e destinos.'),
 gi('arc-ci','arcade','Gates finais na main do Arcade','pendente',[],true,'Auditoria individual + quality + browsers + CodeQL vinculados à mesma SHA.'),
 gi('arc-contract','arcade','IDs e contratos dos 150 jogos','pendente',[],true,'Sem mudança não auditada dos IDs, formatos de mensagens ou motores.'),
 gi('arc-320','arcade','Playwright integrado a 320 px','pendente',[],true,'Abertura da arena, comandos, retorno e PG Bot contextual.'),
 gi('arc-390','arcade','Playwright integrado a 390 px','pendente',[],true,'Toque, fullscreen, pausa, foco e resposta contextual.'),
 gi('arc-telemetry','arcade','Placar/estado ao vivo no PGA Arcade','pendente',[],true,'Adaptador opt-in sem acoplar motores legados.'),
 gi('arc-offline','arcade','Guia offline e funcionamento real','em-validacao',['ev-pr15'],true,'PR do guia mesclada; faltam testes desconectados do Arcade.'),
 gi('arc-android','arcade','Android físico com evidências','bloqueado',[],true,'Testes frios/quentes e landscape com registros reais.'),
 gi('arc-deploy','arcade','Produção publicada e inspecionada','pendente',[],true,'Validar versão, URL e console após gates.'),
 ];
 const it=(id,project,title,area,status,detail,proof=[],blocker='')=>({id,project,title,area,status,detail,evidenceIds:proof,blocker,note:''});
 const integrations=[
 it('int-catalog','both','Catálogo e preservação de 338 registros','Contratos','comprovado','150 jogos Arcade, 150 missões e 38 independentes no snapshot PG Bot, com job de paridade aprovado.',['ev-bot-ci']),
 it('int-str-hex','estrategia','Domínio Territorial / Hex Conquest','Jogos','implementado','Motor e SVG integrados pela PR #6; requer homologação cruzada do PG Bot.',['ev-pr6']),
 it('int-str-gravity','estrategia','Gravidade dos Cristais','Jogos','implementado','37º independente integrado pela PR #5; testes de movimentos ainda necessários.',['ev-pr5']),
 it('int-broadcast','estrategia','BroadcastChannel opt-in, turnos','Telemetria','em-validacao','PRs #9 e #16 mescladas; falta prova ponta a ponta com sessão real.',['ev-pr9','ev-pr16']),
 it('int-moves','estrategia','Adaptador desacoplado de jogadas','Telemetria','em-validacao','PRs #10 e #17 mescladas; validar moves, timestamp, seleção e TTL.',['ev-pr10','ev-pr17']),
 it('int-arc-live','arcade','Estado ao vivo em jogos do Arcade','Telemetria','pendente','Definir interface mínima sem mudar motores e comprovar filtros por jogo.'),
 it('int-offline','both','Exportação de guias offline','Offline','implementado','Funcionalidade entregue na PR #15; teste offline real separado.',['ev-pr15']),
 it('int-ci','both','Testes Chromium, Firefox e WebKit','Qualidade','comprovado','Workflow do PG Bot na main aprovado nos 3 navegadores; largura específica dos jogos não inferida.',['ev-bot-ci']),
 it('int-mobile','both','320 / 390 px: UX integrada','Mobile','pendente','Ainda exige evidências Playwright por projeto e versão.'),
 it('int-android','both','Android real: toque e landscape','Mobile','bloqueado','Executar em aparelho físico, não em emulação.'),
 it('int-id','both','IDs e contratos dos motores legados','Contratos','em-validacao','Paridade do catálogo coberta por CI; versionamento de mensagens e motores precisa de regressão.',['ev-bot-ci']),
 it('int-prod','both','Deploy e smoke HTTP em produção','Entrega','em-validacao','Runs de Pages existem; URL e comportamento publicados devem ser inspecionados.',['ev-bot-pages','ev-str-pages'])
 ];
 const pr=(repo,n,title,mergedAt,githubState,proof)=>({id:`pr-${repo}-${n}`,repo,number:n,title,url:`https://github.com/${REPO_OWNER}/${repo}/pull/${n}`,mergedAt,githubState,source:'github-api',lastChecked:SNAPSHOT_AT,evidenceIds:proof?[proof]:[],checklist:CHECK_ITEMS.map((label,i)=>({label,done:i===4&&!!mergedAt,note:''})),note:''});
 const prs=[
 pr('PG-Estrategia',5,'Gravidade dos Cristais como 37º jogo', '2026-11-02T16:35:24Z','merged','ev-pr5'),
 pr('PG-Estrategia',6,'Domínio Territorial, Hex Conquest e PG Bot','2026-11-02T16:40:58Z','merged','ev-pr6'),
 pr('PG-Estrategia',7,'Motores de conquista e tática em grade',null,'open'),
 pr('PG-Estrategia',8,'15 cenários hexagonais com metadados',null,'open'),
 pr('PG-Estrategia',9,'Telemetria opt-in Domínio Territorial','2026-11-02T17:35:07Z','merged','ev-pr9'),
 pr('PG-Estrategia',10,'Adaptador de telemetria Gravidade','2026-11-02T17:58:44Z','merged','ev-pr10'),
 pr('PG-Bot',15,'Guia offline contextual','2026-11-02T17:09:29Z','merged','ev-pr15'),
 pr('PG-Bot',16,'Acompanhar turno em outra aba com consentimento','2026-11-02T17:38:45Z','merged','ev-pr16'),
 pr('PG-Bot',17,'Telemetria de jogadas de Gravidade','2026-11-02T18:00:08Z','merged','ev-pr17'),
 pr('PG-Bot',18,'Classificar perguntas sobre jogadas e movimentos',null,'open'),
 pr('PG-Arcade',295,'Auditoria individual dos 150 jogos','2026-11-02T17:14:24Z','merged','ev-pr295')
 ];
 const task=(id,project,priority,title,description,dependency='',status='a-fazer')=>({id,project,priority,title,description,dependency,status,notes:''});
 const tasks=[
 task('t-1','both','P0','Homologar matriz 320/390 em 3 navegadores','Anexar runs por SHA da integração PG Bot, catálogo e arena.','CI na main e ambiente estável'),
 task('t-2','estrategia','P0','Validar telemetria de turnos e jogadas em jogos reais','Cobrir consentimento, TTL 15s, jogo selecionado, phase, moves, placar e eventos rejeitados.','PRs #9/#10/#16/#17 mescladas'),
 task('t-3','arcade','P0','Criar adaptador de telemetria sem alterar motor legado','Ler estado apenas por interface pública, opt-in e eventos versionados.','Contrato pg_telemetry_hub_v1'),
 task('t-4','both','P0','Auditar IDs e contratos após integração','Snapshot determinístico de IDs/URLs, schemas v1 e suites de regressão.','catálogo versionado'),
 task('t-5','both','P1','Provar guias e PWA offline em cenários reais','Primeira visita offline, cache aquecido, mudança de versão e ausência de dados privados.','PR #15 mesclada'),
 task('t-6','estrategia','P1','Revisar PRs #7/#8 sem merge automático','Isolar diff, dependências e checks finais na HEAD; manter PRs abertas até critérios.','PRs abertas'),
 task('t-7','both','P1','Homologar Android físico','5 sessões frias + 5 quentes; toque, paisagem, retorno, tela cheia e acessibilidade.','Aparelho físico e registros','bloqueado'),
 task('t-8','both','P1','Confirmar URL publicada após cada entrega','Inspecionar resposta HTTP, conteúdo, console, service worker e SHA disponibilizada.','Deploy concluído e gates verdes'),
 task('t-9','both','P2','Documentar reparo mínimo para regressões','Reproduzir → teste falhando → adaptador pequeno → CI completo → revisão.','Sem refatoração de motores')
 ];
 return {version:1,snapshotAt:SNAPSHOT_AT,updatedAt:SNAPSHOT_AT,lastGithubSync:null,gates,integrations,prs,evidences,tasks};
}