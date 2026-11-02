import {createServer} from "node:http";
import {existsSync,readFileSync,statSync} from "node:fs";
import {resolve,join,sep,extname} from "node:path";
const root=resolve(process.cwd()),port=Number(process.env.PORT||4176);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp",".xml":"application/xml",".txt":"text/plain; charset=utf-8"};
createServer((req,res)=>{
 try{
  if(!["GET","HEAD"].includes(req.method)){res.writeHead(405).end();return;}
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  let file=resolve(root,"."+pathname);
  if((file!==root&&!file.startsWith(root+sep))||pathname.includes("/.git/")){res.writeHead(403).end();return;}
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,"index.html");
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end("Not found");return;}
  const data=readFileSync(file);
  res.writeHead(200,{"content-type":mime[extname(file)]||"application/octet-stream","cache-control":"no-store"});
  res.end(req.method==="HEAD"?undefined:data);
 }catch{res.writeHead(400).end();}
}).listen(port,"127.0.0.1",()=>console.log("Static preview http://127.0.0.1:"+port));
