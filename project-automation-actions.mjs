// Sugestões somente leitura. Esta camada nunca executa comandos, merges ou deploys.
const OWNER='pabloguilherme1121';
const STATES=new Set(['falha','indisponivel','executando','revisao','sem_dados','ok']);
const ORDER={falha:0,indisponivel:1,executando:2,revisao:3,sem_dados:4,ok:5};
const FAILURE=new Set(['failure','timed_out','action_required','startup_failure']);
const shortName=repository=>repository.slice(OWNER.length+1);
const safeRepository=repository=>typeof repository==='string'&&new RegExp('^'+OWNER+'/[a-zA-Z0-9._-]{1,100}$').test(repository);
const idIsValid=id=>Number.isSafeInteger(id)&&id>0;

export function planActions(report){
 if(!report||!Array.isArray(report.projects))return [];
 return report.projects.filter(p=>p&&safeRepository(p.repository)&&STATES.has(p.state)).slice(0,25).map(p=>{
  const base='https://github.com/'+p.repository;
  const workflows=Array.isArray(p.workflows)?p.workflows:[];
  const prs=Array.isArray(p.openPRs)?p.openPRs:[];
  let title='',description='',priority='P2',url=base+'/actions';
  if(p.state==='falha'){
   priority='P0';title='Investigar falha de CI';
   description='Abrir logs da execução, reproduzir a primeira falha e preparar correção mínima com teste de regressão.';
   const run=workflows.find(w=>w?.status==='completed'&&FAILURE.has(w.conclusion)&&idIsValid(w.id));
   if(run)url=base+'/actions/runs/'+run.id;
  }else if(p.state==='indisponivel'){
   priority='P0';title='Restabelecer evidências';
   description='Repetir a consulta pública, verificar acesso e limite da API. Não presumir CI aprovada.';
  }else if(p.state==='executando'){
   priority='P1';title='Conferir execução pendente';
   description='Conferir conclusão e SHA antes de decidir qualquer integração.';
   const run=workflows.find(w=>w?.status!=='completed'&&idIsValid(w.id));
   if(run)url=base+'/actions/runs/'+run.id;
  }else if(p.state==='revisao'){
   priority='P1';title='Revisar PR e checks';
   description='Conferir diff, HEAD final, aprovação e critérios antes de qualquer merge.';
   const pr=prs.find(pr=>idIsValid(pr?.number)&&pr.draft!==true)??prs.find(pr=>idIsValid(pr?.number));
   if(pr)url=base+'/pull/'+pr.number;
   else url=base+'/pulls';
  }else if(p.state==='sem_dados'){
   title='Conferir execução de CI';
   description='Localizar os workflows configurados; não interpretar ausência de dados como sucesso.';
  }else{
   title='Validar publicação separadamente';
   description='A última CI observada passou. Verificar deploy, versão publicada e navegação real sem inferir homologação.';
  }
  return {repository:p.repository,project:shortName(p.repository),priority,category:p.state,title,description,url};
 }).sort((a,b)=>ORDER[a.category]-ORDER[b.category]||a.project.localeCompare(b.project,'pt-BR'));
}

export function reportFreshness(generatedAt,now=Date.now()){
 const created=typeof generatedAt==='string'?Date.parse(generatedAt):NaN;
 if(!Number.isFinite(created)||!Number.isFinite(now)||created>now+5*60*1000)return {status:'invalido',ageHours:null};
 const ageHours=Math.max(0,(now-created)/3600000);
 return {status:ageHours>24?'desatualizado':'atual',ageHours};
}
