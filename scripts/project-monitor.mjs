// GitHub API somente leitura; publica no máximo uma issue de status no próprio PG Bot.
import {MONITORED_REPOS,REPORT_TITLE,summarizeProject,buildReport} from '../project-automation.mjs';
const OWNER='pabloguilherme1121/PG-Bot';
const publish=process.argv.includes('--publish');
const token=process.env.GITHUB_TOKEN||'';
const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'PG-Bot-Monitor'};
if(token)headers.Authorization='Bearer '+token;
async function github(path,method='GET',body=undefined){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const res=await fetch('https://api.github.com'+path,{
   method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},
   body:body?JSON.stringify(body):undefined,signal:controller.signal
  });
  if(!res.ok)throw Error('GitHub HTTP '+res.status+' para '+path.split('?')[0]);
  return await res.json();
 }finally{clearTimeout(timeout)}
}
async function inspect(repository){
 const base='/repos/'+repository;
 try{
  const [runs,prs]=await Promise.all([
   github(base+'/actions/runs?branch=main&per_page=30'),
   github(base+'/pulls?state=open&per_page=100')
  ]);
  return summarizeProject(repository,runs.workflow_runs||[],prs);
 }catch(error){
  console.error('Consulta indisponível: '+repository+' ('+String(error.message).slice(0,140)+')');
  return summarizeProject(repository,[],[],error);
 }
}
async function upsertIssue(body){
 const path='/repos/'+OWNER+'/issues';
 const issues=await github(path+'?state=open&per_page=100');
 const existing=issues.find(issue=>!issue.pull_request&&issue.title===REPORT_TITLE);
 if(existing){
  await github(path+'/'+existing.number,'PATCH',{body});
  console.log('Relatório atualizado: '+existing.html_url);
 }else{
  const created=await github(path,'POST',{title:REPORT_TITLE,body});
  console.log('Relatório criado: '+created.html_url);
 }
}
async function main(){
 if(publish&&(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_REPOSITORY!==OWNER||!token)){
  throw Error('Publicação permitida apenas no GitHub Actions do PG Bot com GITHUB_TOKEN.');
 }
 const results=[];
 for(const repo of MONITORED_REPOS)results.push(await inspect(repo));
 if(results.every(result=>result.state==='indisponivel')){
  throw Error('Nenhuma fonte consultável. Relatório anterior preservado.');
 }
 const body=buildReport(results,new Date().toISOString());
 if(publish)await upsertIssue(body);
 else console.log(body);
}
main().catch(error=>{console.error('Monitoramento não concluído: '+error.message);process.exitCode=1});
