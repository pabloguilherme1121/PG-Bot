// Consultas recentes guardam somente IDs válidos de jogos, nunca perguntas ou progresso.
import {favoriteKey} from './favorites.mjs';
export const RECENT_KEY='pg-bot:recent:v1';
export const RECENT_LIMIT=6;
const VALID_KEY=/^(arcade|estrategia):[a-z0-9][a-z0-9-]{0,63}$/;

export function addRecent(previous,game){
 const key=favoriteKey(game);
 const safe=Array.isArray(previous)?previous.filter(item=>typeof item==='string'&&VALID_KEY.test(item)):[];
 if(!key)return [...new Set(safe)].slice(0,RECENT_LIMIT);
 return [key,...new Set(safe.filter(item=>item!==key))].slice(0,RECENT_LIMIT);
}

export function loadRecent(storage,games){
 try{
  if(!Array.isArray(games))return [];
  const raw=JSON.parse(storage?.getItem(RECENT_KEY)??'null');
  if(!Array.isArray(raw))return [];
  const allowed=new Set(games.map(favoriteKey).filter(Boolean));
  return [...new Set(raw.filter(key=>typeof key==='string'&&allowed.has(key)))].slice(0,RECENT_LIMIT);
 }catch{return [];}
}

export function saveRecent(storage,entries){
 try{
  if(!storage?.setItem||!Array.isArray(entries))return false;
  const clean=[...new Set(entries.filter(key=>typeof key==='string'&&VALID_KEY.test(key)))].slice(0,RECENT_LIMIT);
  storage.setItem(RECENT_KEY,JSON.stringify(clean));
  return true;
 }catch{return false;}
}

export function recentGames(games,entries){
 if(!Array.isArray(games)||!Array.isArray(entries))return [];
 const byKey=new Map(games.map(game=>[favoriteKey(game),game]).filter(([key])=>key));
 return entries.map(key=>byKey.get(key)).filter(Boolean);
}
