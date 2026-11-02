// Auditoria sem rede: valida links e, opcionalmente, compara IDs com checkouts dos projetos.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const HOST='https://pabloguilherme1121.github.io';
const validId=/^[a-z0-9][a-z0-9-]{0,63}$/;
const groups=['arcade','missions','classic','independent'];

export function auditCatalog(snapshot,sources={}){
 const issues=[];
 const games=snapshot?.games;
 const counts=snapshot?.counts;
 if(!Array.isArray(games)||!counts||typeof counts!=='object')return ['Snapshot sem games e counts válidos'];
 const actual=Object.fromEntries(groups.map(group=>[group,[]]));
 const seen=new Set();
 for(const [index,game] of games.entries()){
  const ref=game?.id||'índice '+index;
  if(typeof game?.id!=='string'||!validId.test(game.id))issues.push('ID inválido: '+ref);
  if(!['arcade','estrategia'].includes(game?.environment)||!['game','mission'].includes(game?.kind))issues.push('Tipo ou projeto inválido: '+ref);
  if(typeof game?.name!=='string'||!game.name.trim()||typeof game?.description!=='string'||!game.description.trim())issues.push('Orientação incompleta: '+ref);
  const unique=game?.environment+':'+game?.id;
  if(seen.has(unique))issues.push('ID duplicado: '+unique);
  seen.add(unique);
  let url;
  try{url=new URL(game?.url)}catch{issues.push('URL inválida: '+ref);continue}
  const safe=url.origin===HOST&&!url.username&&!url.password&&!url.search;
  let group=null,valid=false;
  if(game.environment==='arcade'&&game.kind==='game'){
   group='arcade';
   valid=url.pathname==='/PG-Arcade/'&&url.hash==='#/jogar/'+game.id;
  }else if(game.environment==='estrategia'&&game.kind==='mission'){
   group='missions';
   valid=url.pathname==='/PG-Estrategia/'&&url.hash==='#'+game.id;
  }else if(game.environment==='estrategia'&&game.kind==='game'){
   group=(url.pathname==='/PG-Estrategia/independentes/'?'classic':'independent');
   valid=group==='classic'?url.hash==='#'+game.id:
    url.pathname==='/PG-Estrategia/independentes/'+game.id+'/'&&!url.hash;
  }
  if(group)actual[group].push(game.id);
  if(!safe||!valid)issues.push('Destino do jogo incorreto: '+ref+' '+game.url);
 }
 for(const group of groups){
  const expected=Number(counts[group]);
  if(!Number.isInteger(expected)||expected!==actual[group].length)issues.push('Contagem '+group+': snapshot='+expected+', registros='+actual[group].length);
  if(Object.hasOwn(sources,group)){
   if(!Array.isArray(sources[group])){issues.push('Fonte inválida: '+group);continue}
   const ours=new Set(actual[group]),fromSource=new Set(sources[group]);
   const missing=[...fromSource].filter(id=>!ours.has(id)).sort();
   const obsolete=[...ours].filter(id=>!fromSource.has(id)).sort();
   if(missing.length)issues.push(group+' faltando no PG Bot: '+missing.join(', '));
   if(obsolete.length)issues.push(group+' sobrando no PG Bot: '+obsolete.join(', '));
   if(fromSource.size!==sources[group].length)issues.push('Fonte contém IDs repetidos: '+group);
  }
 }
 if(games.length!==actual.arcade.length+actual.missions.length+actual.classic.length+actual.independent.length)issues.push('Existem entradas sem grupo válido');
 return issues;
}

export async function sourceIds({arcadeRoot,strategyRoot}={}){
 const result={};
 if(arcadeRoot){
  const root=resolve(arcadeRoot);
  const read=file=>readFileSync(join(root,'src/lib',file),'utf8');
  // Catálogos são listas estáticas: extraímos IDs declarados, sem avaliar TypeScript.
  const arrayBody=(text,name)=>{
   const start=text.search(new RegExp('(?:const|let)\\s+'+name+'\\s*=\\s*\\['));
   if(start<0)throw Error('Lista ausente no Arcade: '+name);
   const opening=text.indexOf('[',start);
   const closing=text.indexOf('\n]',opening);
   if(closing<0)throw Error('Lista sem fechamento no Arcade: '+name);
   return text.slice(opening+1,closing);
  };
  const entries=file=>{
   const body=arrayBody(read(file),'entries');
   const ids=[...body.matchAll(/^\s*\[\s*["']([a-z0-9-]+)["']\s*,/gm)].map(match=>match[1]);
   if(!ids.length)throw Error('Nenhum ID encontrado em '+file);
   return ids;
  };
  const expanded=arrayBody(read('expandedCatalog.ts'),'expandedGames');
  const expandedIds=[...expanded.matchAll(/\bid\s*:\s*["']([a-z0-9-]+)["']/g)].map(match=>match[1]);
  const catalog=arrayBody(read('catalog.ts'),'games');
  const groups={finalGames:entries('finalCatalog.ts'),newGames:entries('newCatalog.ts'),expandedGames:expandedIds};
  result.arcade=[];
  for(const [,spread] of catalog.matchAll(/\.\.\.([a-zA-Z][a-zA-Z0-9]*)/g)){
   if(!Object.hasOwn(groups,spread))throw Error('Grupo inesperado no Arcade: '+spread);
   result.arcade.push(...groups[spread]);
  }
  result.arcade.push(...[...catalog.matchAll(/\bid\s*:\s*["']([a-z0-9-]+)["']/g)].map(match=>match[1]));
 }
 if(strategyRoot){
  const root=resolve(strategyRoot);
  const catalog=await import(pathToFileURL(join(root,'public/estrategia/catalog.mjs')).href);
  result.missions=catalog.MISSIONS.map(mission=>mission.id);
  const independent=join(root,'public/estrategia/independentes');
  const source=readFileSync(join(independent,'app.js'),'utf8');
  const block=source.match(/const GAMES\s*=\s*\{([\s\S]*?)\n\};/);
  if(!block)throw Error('Não foi possível ler a lista dos jogos clássicos');
  result.classic=[...block[1].matchAll(/^\s*"([a-z0-9-]+)"\s*:\s*\{\s*name\s*:/gm)].map(match=>match[1]);
  result.independent=readdirSync(independent,{withFileTypes:true})
   .filter(entry=>entry.isDirectory()&&existsSync(join(independent,entry.name,'index.html')))
   .map(entry=>entry.name).sort();
 }
 return result;
}
async function main(){
 const options={};
 for(const arg of process.argv.slice(2)){
  if(arg.startsWith('--arcade-root='))options.arcadeRoot=arg.slice('--arcade-root='.length);
  else if(arg.startsWith('--strategy-root='))options.strategyRoot=arg.slice('--strategy-root='.length);
  else throw Error('Argumento inválido: '+arg);
 }
 const data=JSON.parse(readFileSync(new URL('../data/games.json',import.meta.url),'utf8'));
 const refs=await sourceIds(options);
 const issues=auditCatalog(data,refs);
 if(issues.length){for(const issue of issues)console.error('ERRO: '+issue);process.exitCode=1}
 else console.log('Catálogo validado: '+data.games.length+' registros, destinos seguros'+(Object.keys(refs).length?' e fontes comparadas':'')+'.');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 main().catch(error=>{console.error('Falha na auditoria: '+error.message);process.exitCode=1});
}
