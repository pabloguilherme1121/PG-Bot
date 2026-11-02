/* Cache somente do PG Bot. Não armazena mensagens, inputs ou dados de usuários. */
const CACHE="pg-bot-shell-v1";
const FILES=["./","./index.html","./styles.css","./app.mjs","./bot-core.mjs","./icon.svg","./manifest.webmanifest","./assets/mascot.webp"];
const SCOPE=new URL("./",self.registration.scope);
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("pg-bot-shell-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 if(!req.destination||["document","script","style","image","manifest"].includes(req.destination)){
  event.respondWith((async()=>{
   const key=req.mode==="navigate"?new URL("./index.html",SCOPE).href:req;
   try{
    const response=await fetch(req);
    if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(key,response.clone());}catch{}}
    return response;
   }catch{return (await caches.match(key))||Response.error();}
  })());
 }
});