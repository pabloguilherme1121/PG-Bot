// Consulta auditável de issue central do PG Bot. Nunca escreve em repositórios externos.
const API_ORIGIN='https://api.github.com';
const PAGE_LIMIT=5;

function nextPagePath(link,basePath){
 const raw=String(link||'').split(',').map(x=>x.trim()).find(x=>/;\s*rel="next"(?:\s*;|$)/.test(x));
 if(!raw)return null;
 const match=raw.match(/^<([^>]+)>/);
 if(!match)throw Error('Paginação inválida: link incompleto');
 let url;
 try{url=new URL(match[1]);}catch{throw Error('Paginação inválida: URL incorreta');}
 const expected=new URL(basePath,API_ORIGIN);
 const sameRepository=url.pathname===expected.pathname||url.pathname==='/repositories/1442325600/issues';
 const page=Number(url.searchParams.get('page'));
 if(url.origin!==API_ORIGIN||!sameRepository||
    url.searchParams.get('state')!=='open'||url.searchParams.get('per_page')!=='100'||
    !Number.isSafeInteger(page)||page<2){
  throw Error('Paginação inválida: escopo diferente');
 }
 return url.pathname+url.search;
}

export async function findOpenReportIssue(loadPage,basePath,reportTitle){
 if(typeof loadPage!=='function'||typeof basePath!=='string'||!basePath.startsWith('/repos/')||
    typeof reportTitle!=='string'||!reportTitle.trim())throw Error('Parâmetros de consulta inválidos');
 let path=basePath+'?state=open&per_page=100';
 const visited=new Set();
 for(let i=0;i<PAGE_LIMIT;i++){
  if(visited.has(path))throw Error('Paginação inválida: repetição detectada');
  visited.add(path);
  const result=await loadPage(path);
  if(!result||!Array.isArray(result.items))throw Error('Resposta de issues inválida');
  const found=result.items.find(issue=>issue&&!issue.pull_request&&issue.title===reportTitle);
  if(found)return found;
  const next=nextPagePath(result.link,basePath);
  if(!next)return null;
  path=next;
 }
 throw Error('Limite de páginas alcançado. Não criar issue duplicada sem inspeção manual.');
}
