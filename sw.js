// Serviço exclusivo do PG Bot. Nunca intercepta o Arcade nem o Estratégia.
const CACHE='pg-bot-shell-v2';
const SCOPE=new URL('./',self.registration.scope);
const FILES=['./','./index.html','./styles.css','./app.mjs','./icon.svg','./manifest.webmanifest','./data/games.json','./brand/pg-bot/mascot.webp'];
const ALLOWED=new Set(FILES.map(file=>new URL(file,SCOPE).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pg-bot-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 const isHome=url.pathname===SCOPE.pathname||url.pathname===new URL('index.html',SCOPE).pathname;
 if(request.mode==='navigate'&&!isHome)return;
 if(request.mode!=='navigate'&&!ALLOWED.has(url.pathname))return;
 event.respondWith((async()=>{
  const key=request.mode==='navigate'?new URL('index.html',SCOPE).href:request;
  try{
   const response=await fetch(request);
   if(response.ok){try{await(await caches.open(CACHE)).put(key,response.clone())}catch{}}
   return response;
  }catch{
   try{return await caches.match(key)||Response.error()}catch{return Response.error()}
  }
 })());
});
