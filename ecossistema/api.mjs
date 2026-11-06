import {cleanRepo, OWNER} from './core.mjs';
const API = 'https://api.github.com';
const PREFIX = 'pg-bot-ecossistema-v1:';
const TTL = 15 * 60 * 1000;
function read(key) { try {return JSON.parse(localStorage.getItem(PREFIX + key) || 'null');} catch {return null;} }
function save(key,value) { try {localStorage.setItem(PREFIX + key,JSON.stringify(value));} catch {} }
function validDate(d) {return typeof d === 'string' && !Number.isNaN(Date.parse(d));}
async function get(path,raw=false) {
  const response = await fetch(API + path,{
    headers:{Accept:raw?'application/vnd.github.raw+json':'application/vnd.github+json'},
    credentials:'omit', cache:'no-store',
    signal:AbortSignal.timeout(12000)
  });
  if(!response.ok) throw new Error('GitHub HTTP ' + response.status);
  return raw ? response.text() : response.json();
}
export function lastCatalog() {
  const old=read('catalog');
  return old && Array.isArray(old.data) && old.data.every(r => r?.fullName?.startsWith(OWNER+'/')) && validDate(old.fetchedAt) ? old : null;
}
export async function fetchCatalog(force=false) {
  const old=lastCatalog();
  if(!force && old && Date.now()-Date.parse(old.fetchedAt)<TTL) return {...old,stale:false,source:'cache válido'};
  try {
    const found=[];
    for(let page=1;page<=5;page++) {
      const rows=await get('/users/'+OWNER+'/repos?type=public&per_page=100&page='+page);
      if(!Array.isArray(rows)) throw Error('Lista pública inválida');
      found.push(...rows.map(cleanRepo).filter(Boolean));
      if(rows.length<100) break;
      if(page===5) throw Error('Inventário excedeu limite seguro de páginas');
    }
    const item={data:[...new Map(found.map(repo=>[repo.fullName,repo])).values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),fetchedAt:new Date().toISOString()};
    save('catalog',item);
    return {...item,stale:false,source:'GitHub API pública'};
  } catch(error) {
    if(old) return {...old,stale:true,source:'último resultado válido',error:String(error.message)};
    return {data:[],fetchedAt:null,stale:true,source:'indisponível',error:String(error.message)};
  }
}
function asReadme(data) {
  if(typeof data !== 'string' || !data.trim()) throw Error('README vazio');
  return data.slice(0,40000);
}
function cleanPulls(data) {
  if(!Array.isArray(data)) throw Error('PRs inválidas');
  return data.slice(0,5).map(p=>({number:p.number,title:String(p.title||'').slice(0,200),state:p.state,
    merged_at:p.merged_at||null, html_url:p.html_url||null}));
}
function cleanRuns(data) {
  if(!Array.isArray(data?.workflow_runs)) throw Error('Runs inválidas');
  return data.workflow_runs.slice(0,5).map(r=>({id:r.id,name:String(r.name||'').slice(0,160),
    status:r.status,conclusion:r.conclusion,head_sha:r.head_sha,html_url:r.html_url||null}));
}
function storedContext(repoName) {
  const old=read('context:'+repoName);
  if(!old || !['readme','pulls','runs'].every(key=>old[key] && (old[key].data===null || old[key].fetchedAt))) return null;
  return old;
}
export async function fetchContext(repo,force=false) {
  const old=storedContext(repo.name);
  const recent=old && ['readme','pulls','runs'].every(k=>old[k]?.fetchedAt && Date.now()-Date.parse(old[k].fetchedAt)<TTL);
  if(!force && recent) return old;
  const name=encodeURIComponent(repo.name);
  const tasks={
    readme:()=>get('/repos/'+OWNER+'/'+name+'/readme',true).then(asReadme),
    pulls:()=>get('/repos/'+OWNER+'/'+name+'/pulls?state=all&sort=updated&direction=desc&per_page=5').then(cleanPulls),
    runs:()=>get('/repos/'+OWNER+'/'+name+'/actions/runs?per_page=5').then(cleanRuns)
  };
  const entries=await Promise.all(Object.entries(tasks).map(async ([key,request])=>{
    try {return [key,{data:await request(),fetchedAt:new Date().toISOString(),stale:false}];}
    catch(error) {
      return [key,{data:old?.[key]?.data??null,fetchedAt:old?.[key]?.fetchedAt||null,stale:true,error:String(error.message)}];
    }
  }));
  const next=Object.fromEntries(entries);
  save('context:'+repo.name,next);
  return next;
}
