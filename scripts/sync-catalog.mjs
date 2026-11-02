// Gera propostas revisáveis a partir dos metadados declarativos dos jogos.
// Não executa módulos TypeScript, não remove IDs e não sobrescreve textos editoriais.
import {existsSync,readFileSync,writeFileSync,readdirSync,mkdirSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sourceIds,auditCatalog} from './audit-catalog.mjs';

const LITERAL=String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`;
const FIELDS=['name','description','help'];
const read=path=>readFileSync(path,'utf8');
const stable=value=>JSON.stringify(value,null,2)+'\n';
const cleanHtml=text=>text.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
function decodeString(raw){
 if(raw.startsWith('"'))return JSON.parse(raw);
 return raw.slice(1,-1).replace(/\\'/g,"'").replace(/\\\\/g,'\\');
}
const fieldLimit={name:160,description:1500,help:6000};
function safeField(field,value){
 return typeof value==='string' && !!value.trim() &&
 value.length<=fieldLimit[field] &&
 !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) &&
 !/<\/?[a-z][^>]*>/i.test(value);
}
export function parseStaticPairs(text){
 const out=[];
 for(const line of text.split(/\r?\n/)){
  const opening=line.match(/^\s*\[\s*(.+?)\s*\]\s*,?\s*$/);
  if(!opening)continue;
  const pairs=[...opening[1].matchAll(new RegExp(LITERAL,'g'))];
  if(pairs.length<4||pairs.length>6)continue;
  if(opening[1].replace(new RegExp(LITERAL,'g'),'').replace(/[\s,]/g,'')!=='')continue;
  try{out.push(pairs.map(x=>decodeString(x[0])))}catch{}
 }
 return out;
}
export function parseObjectFields(body){
 const result={};
 const re=new RegExp('\\b(id|name|description|category|help|hint|intro|instructions)\\s*:\\s*('+LITERAL+')','g');
 for(const match of body.matchAll(re))try{result[match[1]]=decodeString(match[2])}catch{}
 return result;
}
function staticObjects(text){
 const items=[];
 const start=/\{\s*id\s*:\s*["'][a-z0-9-]+["']/g;
 for(const match of text.matchAll(start)){
  const i=match.index;
  let depth=0,quote='',escaped=false,end=-1;
  for(let j=i;j<text.length;j++){
   const c=text[j];
   if(quote){
    if(escaped){escaped=false;continue}
    if(c==='\\'){escaped=true;continue}
    if(c===quote)quote='';
   }else if(c==='"'||c==="'"){quote=c}
   else if(c==='{')depth++;
   else if(c==='}'&&--depth===0){end=j+1;break}
  }
  if(end<0)throw Error('Objeto de jogo incompleto na fonte');
  items.push(parseObjectFields(text.slice(i,end)));
 }
 return items;
}
function strictAdd(map,environment,id,fields){
 if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id))throw Error('ID não confiável na fonte: '+id);
 const key=environment+':'+id;
 if(map[key])throw Error('ID duplicado nas fontes: '+key);
 const record={};
 for(const field of FIELDS)if(safeField(field,fields[field]))record[field]=fields[field].trim();
 if(!record.name||!record.description)throw Error('Fonte sem nome ou descrição literal segura: '+key);
 map[key]=record;
}
function arcadeMetadata(root,map){
 const folder=join(root,'src','lib');
 const finalRows=parseStaticPairs(read(join(folder,'finalCatalog.ts')));
 const newRows=parseStaticPairs(read(join(folder,'newCatalog.ts')));
 for(const row of finalRows)strictAdd(map,'arcade',row[0],{name:row[1],description:row[2]});
 for(const row of newRows)strictAdd(map,'arcade',row[0],{name:row[1],description:row[4]});
 for(const item of staticObjects(read(join(folder,'expandedCatalog.ts'))))
  strictAdd(map,'arcade',item.id,item);
 const catalog=read(join(folder,'catalog.ts'));
 const gamesStart=catalog.indexOf('export const games = [');
 if(gamesStart<0)throw Error('Array principal do Arcade ausente');
 for(const item of staticObjects(catalog.slice(gamesStart)))
  strictAdd(map,'arcade',item.id,item);
 // Instruções literais explícitas; valores dinâmicos não são executados ou usados.
 for(const file of [
  join(folder,'gameHelp.ts'),join(folder,'newCatalogHelp.ts'),
  join(root,'src','games','finalCollection','instructions.ts')
 ]){
  const data=read(file);
  const matches=new RegExp('^\\s*(?:([a-z0-9_-]+)|"([a-z0-9-]+)"|\\x27([a-z0-9-]+)\\x27)\\s*:\\s*('+LITERAL+')\\s*,?','gm');
  for(const match of data.matchAll(matches)){
   const id=match[1]||match[2]||match[3];
   if(!map['arcade:'+id])continue;
   let help;
   try{help=decodeString(match[4])}catch{continue}
   if(safeField('help',help))map['arcade:'+id].help=help.trim();
  }
 }
}
async function strategyMetadata(root,map){
 const folder=join(root,'public','estrategia');
 const catalog=await import(pathToFileURL(join(folder,'catalog.mjs')).href);
 const byFamily=new Map(catalog.FAMILIES.map(f=>[f.id,f]));
 for(const mission of catalog.MISSIONS){
  const family=byFamily.get(mission.family);
  if(!family)throw Error('Família de missão ausente: '+mission.id);
  strictAdd(map,'estrategia',mission.id,{name:mission.name,description:family.summary,help:family.guide});
 }
 const independent=join(folder,'independentes');
 const classics=read(join(independent,'app.js'));
 const block=classics.match(/const GAMES\s*=\s*\{([\s\S]*?)\n\};/);
 if(!block)throw Error('Mapa de jogos clássicos não encontrado');
 const regex=new RegExp('^\\s*"([a-z0-9-]+)"\\s*:\\s*\\{\\s*name\\s*:\\s*('+LITERAL+')\\s*,\\s*intro\\s*:\\s*('+LITERAL+')\\s*,\\s*instructions\\s*:\\s*('+LITERAL+')','gm');
 let classicsFound=0;
 for(const item of block[1].matchAll(regex)){
  classicsFound++;
  strictAdd(map,'estrategia',item[1],{name:decodeString(item[2]),description:decodeString(item[3]),help:decodeString(item[4])});
 }
 if(classicsFound!==9)throw Error('Clássicos não correspondem às 9 fontes declaradas: '+classicsFound);
 for(const entry of readdirSync(independent,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const file=join(independent,entry.name,'index.html');
  if(!existsSync(file))continue;
  const html=read(file);
  const title=html.match(/<title>\s*([^<]+?)\s*<\/title>/i)?.[1]?.replace(/\s*\|\s*PG Estrat[eé]gia.*$/i,'');
  const description=html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)?.[1];
  const legend=html.match(/<p\s+class="legend"[^>]*>([^<]+)<\/p>/i)?.[1];
  strictAdd(map,'estrategia',entry.name,{
   name:title?cleanHtml(title):undefined,
   description:description?cleanHtml(description):undefined,
   help:legend?cleanHtml(legend):undefined
  });
 }
}
export async function extractMetadata({arcadeRoot,strategyRoot}){
 if(!arcadeRoot||!strategyRoot)throw Error('As duas fontes oficiais são obrigatórias');
 const sources=await sourceIds({arcadeRoot,strategyRoot});
 const output={};
 arcadeMetadata(resolve(arcadeRoot),output);
 await strategyMetadata(resolve(strategyRoot),output);
 for(const [group,ids] of Object.entries(sources)){
  const prefix=group==='arcade'?'arcade:':'estrategia:';
  for(const id of ids)if(!output[prefix+id])throw Error('Fonte sem metadados: '+group+'/'+id);
 }
 const total=Object.values(sources).reduce((sum,ids)=>sum+ids.length,0);
 if(Object.keys(output).length!==total)throw Error('Metadados divergentes: '+total+' IDs oficiais, '+Object.keys(output).length+' descrições');
 return Object.fromEntries(Object.entries(output).sort(([a],[b])=>a.localeCompare(b,'pt-BR')));
}
export function proposeCatalogChanges(catalog,previous,current){
 const updated=structuredClone(catalog);
 const applied=[],review=[];
 for(const game of updated.games||[]){
  const key=game.environment+':'+game.id;
  const before=previous[key];
  const now=current[key];
  if(!now){review.push({key,reason:'fonte ausente'});continue}
  for(const field of FIELDS){
   if(!Object.hasOwn(now,field)){
    // Não apaga instruções: sinaliza quando um campo antes documentado some da fonte.
    if(before&&Object.hasOwn(before,field))review.push({key,field,reason:'campo removido da fonte'});
    continue;
   }
   if(!safeField(field,now[field])){
    review.push({key,field,reason:'texto inseguro'});continue
   }
   if(!before||!Object.hasOwn(before,field)){
    // Primeira geração do histórico não deve alterar textos existentes.
    if(game[field]!==now[field])review.push({key,field,reason:'sem histórico da fonte'});
    continue;
   }
   if(before[field]===now[field])continue;
   if(game[field]===before[field]){
    game[field]=now[field];applied.push({key,field,from:before[field],to:now[field]});
   }else review.push({key,field,reason:'texto editorial preservado',from:game[field],source:now[field]});
  }
 }
 const known=new Set((updated.games||[]).map(game=>game.environment+':'+game.id));
 for(const key of Object.keys(current))if(!known.has(key))review.push({key,reason:'novo ID sem cadastro'});
 return {catalog:updated,applied,review};
}
function report(applied,review){
 const lines=['# Revisão da sincronização PG Bot','','Gerado automaticamente. **Aprovação humana obrigatória.**','','## Campos atualizados com correspondência à fonte anterior',''];
 if(!applied.length)lines.push('Nenhum campo alterado automaticamente.');
 else for(const item of applied)lines.push('- '+item.key+' · '+item.field+': texto oficial alterado');
 lines.push('','## Campos protegidos para revisão','');
 if(!review.length)lines.push('Nenhuma divergência editorial nesta proposta.');
 else for(const item of review)lines.push('- '+item.key+(item.field?' · '+item.field:'')+': '+item.reason);
 lines.push('','As instruções que não existem como literais nas fontes são preservadas. Nenhuma alteração é publicada automaticamente.','');
 return lines.join('\n');
}
async function main(){
 const opts={write:false};
 for(const arg of process.argv.slice(2)){
  if(arg.startsWith('--arcade-root='))opts.arcadeRoot=arg.slice(14);
  else if(arg.startsWith('--strategy-root='))opts.strategyRoot=arg.slice(16);
  else if(arg==='--write')opts.write=true;
  else throw Error('Opção não reconhecida: '+arg);
 }
 const catalogPath=resolve('data/games.json'),sourcePath=resolve('data/source-metadata.json');
 const source=await extractMetadata(opts);
 const catalog=JSON.parse(read(catalogPath));
 const sourceIdsOfficial=await sourceIds(opts);
 const invalid=auditCatalog(catalog);
 if(invalid.length)throw Error('Catálogo local inválido: '+invalid.join('; '));
 // Divergência entre repositórios exige revisão, mas ainda permite gerar PR.
 const issues=auditCatalog(catalog,sourceIdsOfficial);
 const previous=existsSync(sourcePath)?JSON.parse(read(sourcePath)):{};
 const firstRun=!existsSync(sourcePath);
 const changes=proposeCatalogChanges(catalog,previous,source);
 const metaChanged=stable(previous)!==stable(source);
 console.log('Fontes: '+Object.keys(source).length+' registros. Metadados alterados: '+(metaChanged?'sim':'não')+'. Campos atualizáveis: '+changes.applied.length+'; revisão: '+(firstRun?0:changes.review.length)+'.');
 if(issues.length)console.log('Atenção: IDs alterados na origem; pendentes de revisão: '+issues.join('; '));
 if(opts.write&&metaChanged){
  writeFileSync(sourcePath,stable(source),'utf8');
  if(changes.applied.length)writeFileSync(catalogPath,stable(changes.catalog),'utf8');
  const destination=resolve('docs/catalog-sync-review.md');
  mkdirSync(dirname(destination),{recursive:true});
  writeFileSync(destination,report(changes.applied,firstRun?[]:[...changes.review,...issues.map(issue=>({key:'Catálogo',reason:issue}))]),'utf8');
  console.log(firstRun?'Baseline da fonte gerado; nenhum texto editorial foi substituído.':'Proposta registrada em docs/catalog-sync-review.md');
 }
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)
 main().catch(error=>{console.error(error.message);process.exitCode=1});
