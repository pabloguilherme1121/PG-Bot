import {answerQuestion,getQuickActions,destinationFor} from "./bot-core.mjs";
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const state={
 product:params.get("product")==="estrategia"?"estrategia":"arcade",
 game:(params.get("game")||"").slice(0,60),
 mission:(params.get("mission")||"").slice(0,120),
 turn:(params.get("turn")||"").slice(0,24),
 progress:(params.get("progress")||"").slice(0,24),
};
const messages=$("messages"),input=$("question"),form=$("question-form");
function addMessage(kind,text){
 const item=document.createElement("li");
 item.className="message message-"+kind;
 const label=document.createElement("strong");
 label.className="message-speaker";label.textContent=kind==="bot"?"PG Bot":"Você";
 const paragraph=document.createElement("p");paragraph.textContent=text;
 item.append(label,paragraph);messages.append(item);
 messages.scrollTop=messages.scrollHeight;
 return item;
}
function resetChat(){
 messages.replaceChildren();
 addMessage("bot",state.product==="estrategia"?
  "Vamos planejar a próxima jogada? Posso explicar missões, dicas por mecânica, turnos, progresso e como jogar.":
  "Vamos jogar? Pergunte sobre controles, objetivos, reinício, recordes, offline ou acessibilidade no PG Arcade.");
 input.value="";updateCount();
}
function updateCount(){$("char-count").textContent=input.value.length+" / 240";}
function send(question){
 const text=String(question||"").trim().slice(0,240);
 if(!text)return;
 addMessage("user",text);
 const result=answerQuestion({...state,question:text});
 addMessage("bot",result.answer);
 input.value="";updateCount();
}
function setProduct(next){
 if(next!=="arcade"&&next!=="estrategia")return;
 if(state.product!==next){state.product=next;state.game="";state.mission="";state.turn="";state.progress="";}
 for(const button of document.querySelectorAll("[data-mode]"))
  button.setAttribute("aria-pressed",String(button.dataset.mode===state.product));
 const strategy=state.product==="estrategia";
 const link=destinationFor(state.product,strategy?"":state.game)||destinationFor(state.product);
 $("context-link").href=link;
 $("context-link").firstChild.textContent=strategy?"Abrir PG Estratégia ":"Abrir PG Arcade ";
 $("context-name").textContent=strategy?"PG Estratégia":"PG Arcade";
 $("context-note").textContent=strategy?
 "150 missões em seis sistemas e jogos independentes. Continue sua campanha.":
 "Jogos, controles e recordes no catálogo original.";
 const context=strategy&&state.mission?" · missão informada: "+state.mission:
  !strategy&&state.game?" · jogo informado: "+state.game:"";
 $("context-banner").textContent="Modo: "+(strategy?"PG Estratégia":"PG Arcade")+context;
 const quick=$("quick-actions");quick.replaceChildren();
 for(const action of getQuickActions(state.product)){
  const b=document.createElement("button");b.type="button";b.className="quick-action";b.textContent=action.label;
  b.addEventListener("click",()=>send(action.question));quick.append(b);
 }
 resetChat();
 const url=new URL(location.href);
 url.searchParams.set("product",state.product);
 if(!state.game)url.searchParams.delete("game");
 if(!state.mission){url.searchParams.delete("mission");url.searchParams.delete("turn");url.searchParams.delete("progress");}
 history.replaceState(null,"",url.pathname+url.search+url.hash);
}
document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>setProduct(button.dataset.mode)));
form.addEventListener("submit",event=>{event.preventDefault();send(input.value);input.focus();});
input.addEventListener("input",updateCount);
input.addEventListener("keydown",event=>{
 if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}
});
$("clear-chat").addEventListener("click",()=>{resetChat();input.focus();});
setProduct(state.product);
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost"))
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
