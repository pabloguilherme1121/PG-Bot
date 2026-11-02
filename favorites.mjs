// Preferências locais. Nenhuma pergunta ou dado de sessão é persistido.
export const FAVORITES_KEY='pg-bot:favorites:v1';
const VALID_ID=/^[a-z0-9][a-z0-9-]{0,63}$/;

export function favoriteKey(game){
 if(!game||!['arcade','estrategia'].includes(game.environment)||typeof game.id!=='string'||!VALID_ID.test(game.id))return null;
 return game.environment+':'+game.id;
}

export function loadFavoriteKeys(storage,games){
 try{
  const parsed=JSON.parse(storage?.getItem(FAVORITES_KEY)??'null');
  if(!Array.isArray(parsed)||!Array.isArray(games))return new Set();
  const allowed=new Set(games.map(favoriteKey).filter(Boolean));
  const clean=new Set();
  for(const key of parsed){
   if(typeof key==='string'&&allowed.has(key))clean.add(key);
   if(clean.size===allowed.size)break;
  }
  return clean;
 }catch{return new Set();}
}

export function saveFavoriteKeys(storage,keys){
 try{
  if(!storage?.setItem||!(keys instanceof Set))return false;
  storage.setItem(FAVORITES_KEY,JSON.stringify([...keys].filter(key=>typeof key==='string')));
  return true;
 }catch{return false;}
}

export function toggleFavoriteKey(current,game){
 const key=favoriteKey(game);
 const result=new Set(current);
 if(!key)return result;
 if(result.has(key))result.delete(key);
 else result.add(key);
 return result;
}

export function favoriteGames(games,keys){
 return games.filter(game=>keys.has(favoriteKey(game)));
}
