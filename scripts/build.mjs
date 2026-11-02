import {cpSync,mkdirSync,rmSync,existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
const name=JSON.parse(readFileSync("package.json","utf8")).name;
const files=name==="pg-estrategia"?
 ["index.html","app.js","style.css","catalog.mjs","core.mjs","strategy-hub.mjs","pg-bot.css","pg-bot-help.mjs","sw.js","manifest.webmanifest","icon.svg","independentes","brand","robots.txt","sitemap.xml",".nojekyll"]:
 ["index.html","app.mjs","bot-core.mjs","styles.css","sw.js","manifest.webmanifest","icon.svg","assets","robots.txt","sitemap.xml",".nojekyll"];
rmSync("dist",{recursive:true,force:true});mkdirSync("dist",{recursive:true});
for(const item of files){if(!existsSync(item))throw Error("Recurso obrigatório ausente: "+item);cpSync(item,join("dist",item),{recursive:true});}
console.log("Build estático concluído: "+files.length+" arquivos ou diretórios");
