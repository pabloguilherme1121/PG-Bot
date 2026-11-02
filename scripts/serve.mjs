import {createServer} from 'node:http';
import {existsSync,statSync,readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const root=resolve('.'),base='/PG-Bot/';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'};
const port=Number(process.env.PORT||5482);
createServer((req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith(base))throw Error('fora do escopo');
  const target=resolve(root,decodeURIComponent(path.slice(base.length)));
  if(target!==root&&!target.startsWith(root+sep))throw Error('caminho invalido');
  const file=statSync(target).isDirectory()?resolve(target,'index.html'):target;
  if(!existsSync(file)||!statSync(file).isFile())throw Error('nao encontrado');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(readFileSync(file));
 }catch{res.writeHead(404);res.end('Nao encontrado')}
}).listen(port,'127.0.0.1',()=>console.log('PG Bot: http://127.0.0.1:'+port+base));
