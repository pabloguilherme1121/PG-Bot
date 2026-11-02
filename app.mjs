// PG Bot independente: somente regras locais, sem token, cookies ou API de conversação.
export const normalize = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const bounded=text=>typeof text==='string'&&text.length<=240?normalize(text):'';
export function filterGames(games,environment,search='',kind='all'){
 const terms=normalize(search).slice(0,80).split(/\s+/).filter(Boolean);
 if(!['all','mission','game'].includes(kind))return [];
 return games.filter(g=>g.environment===environment&&(kind==='all'||g.kind===kind)&&terms.every(term=>normalize(g.name+' '+g.category+' '+g.id).includes(term)));
}
export function contextUrl(game){
 if(!game||!['arcade','estrategia'].includes(game.environment)||typeof game.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(game.id))return null;
 const url=new URL('https://pabloguilherme1121.github.io/PG-Bot/');
 url.searchParams.set('projeto',game.environment);
 url.searchParams.set('jogo',game.id);
 return url.href;
}
export function suggestGame(games,random=Math.random){
 if(!Array.isArray(games)||games.length===0)return null;
 const n=Number(random());
 const idx=Number.isFinite(n)?Math.min(games.length-1,Math.max(0,Math.floor(n*games.length))):0;
 return games[idx];
}
export function answerQuestion(question,game){
 const q=bounded(question);
 const fallback='Posso explicar o objetivo, os controles, dar uma dica, falar de reinício, modo offline, acessibilidade e recordes. Escolha um assunto ou tente outra pergunta.';
 if(!game||!q||!/[a-z]/.test(q))return {topic:'fallback',answer:fallback};
 if(/turno atual|meu turno|minha situac|meu placar|estado atual|quanto falta|minha partida/.test(q))
  return {topic:'situacao',answer:'Este site não acompanha a partida em tempo real. Abra o jogo pelo link ao lado e consulte o PG Bot dentro da arena para ver turno, progresso e opções disponíveis.'};
 if(/offline|sem internet|sem conexao|sem rede|desconectad/.test(q))
  return {topic:'offline',answer:'O PG Bot pode funcionar offline depois que os arquivos do site forem carregados e guardados pelo navegador. Cada jogo precisa ser visitado conectado para guardar seus próprios arquivos; a primeira visita sem internet pode não funcionar.'};
 if(/record|pontua|favorit|salv|backup|progresso/.test(q))
  return {topic:'recordes',answer:'Recordes e progresso são gerenciados pelo próprio jogo no navegador. Este site não lê o histórico da sua partida nem sincroniza dados entre aparelhos. Abra o jogo para consultar seus resultados.'};
 if(/teclad|acessib|contraste|leitor de tela|tamanho da letra|movimento reduzido/.test(q))
  return {topic:'acessibilidade',answer:'Use Tab para avançar pelos controles e Enter ou Espaço para ativar botões. O PG Arcade também oferece atalhos Alt + Shift + B para tabuleiro, H para ajuda e R para reiniciar. O suporte varia por jogo; consulte as orientações na partida.'};
 if(/reinic|recomec|paus|retom|continuar|reset|desfaz/.test(q))
  return {topic:'reiniciar',answer:'Abra o jogo e use Pausar, Continuar, Reiniciar ou Desfazer quando esses comandos estiverem disponíveis. Reiniciar pode encerrar a partida atual; confirme na interface antes de continuar.'};
 if(/controle|tecla|botao|seta|mover|tocar|touch|comando|arrast/.test(q))
  return {topic:'controles',answer:'Controles de '+game.name+': '+(game.help||game.description||'Consulte os comandos exibidos na própria partida.')};
 if(/estrateg|dica|como venc|como ganh|ganhar|melhor jogad|proxima jogad|proximo passo|ajuda/.test(q))
  return {topic:'dica',answer:'Dica para '+game.name+': '+(game.hint||game.help||game.description||'Leia as regras antes de confirmar uma jogada. O resultado depende das suas escolhas.')};
 if(/como|objetivo|regras|jog|venc|fase|missao|meta|fazer|comec/.test(q))
  return {topic:'objetivo',answer:'Objetivo de '+game.name+': '+(game.description||game.help||'Veja as regras dentro do jogo.')+(game.difficulty?' Dificuldade da missão: '+game.difficulty+'.':'')};
 return {topic:'fallback',answer:fallback};
}
const selectors={
 log:'chat-log',form:'chat-form',question:'question',select:'game-select',search:'game-search',count:'game-count',
 name:'game-name',description:'game-description',link:'game-link'
};
function initDocument(){
 const $=key=>document.getElementById(selectors[key]||key);
 let games=[],environment='arcade',selected=null,kind='all';
 const url=new URL(location.href);
 const requestedEnvironment=url.searchParams.get('projeto');
 const requestedId=url.searchParams.get('jogo');
 if(requestedEnvironment==='estrategia')environment='estrategia';
 function addMessage(text,who='bot'){
  const row=document.createElement('div');row.className='chat-row '+who;
  if(who==='bot'){const avatar=document.createElement('div');avatar.className='avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent='PG';row.append(avatar)}
  const bubble=document.createElement('p');bubble.className='bubble';bubble.textContent=text;row.append(bubble);
  $('log').append(row);
  while($('log').children.length>19)$('log').firstElementChild.remove();
  $('log').scrollTop=$('log').scrollHeight;
 }
 function setSelected(game){
  selected=game??null;
  $('name').textContent=selected?.name||'Nenhum jogo encontrado';
  $('description').textContent=selected?.description||'Digite outro termo para buscar um jogo.';
  const destination=selected?.url||'https://pabloguilherme1121.github.io/PG-Arcade/';
  const u=new URL(destination);
  if(u.hostname==='pabloguilherme1121.github.io'&&(u.pathname.startsWith('/PG-Arcade/')||u.pathname.startsWith('/PG-Estrategia/'))) $('link').href=u.href;
  $('link').hidden=!selected;
  const current=new URL(location.href);
  current.searchParams.set('projeto',environment);
  if(selected)current.searchParams.set('jogo',selected.id);
  else current.searchParams.delete('jogo');
  history.replaceState(null,'',current.pathname+current.search+current.hash);
 }
 function renderChoices(preferredId=''){
  const shown=filterGames(games,environment,$('search').value,kind);
  const limited=shown.slice(0,80);
  // IDs recebidos por link devem continuar selecionáveis, mesmo fora das primeiras 80 opções.
  const preferred=shown.find(g=>g.id===preferredId)||shown.find(g=>g.id===selected?.id);
  if(preferred&&!limited.some(g=>g.id===preferred.id))limited[Math.min(79,limited.length-1)]=preferred;
  const options=document.createDocumentFragment();
  for(const game of limited){
   const option=document.createElement('option');
   option.value=game.id;option.textContent=game.name+(game.kind==='mission'?' · missão':'');
   options.append(option);
  }
  $('select').replaceChildren(options);
  const next=limited.find(g=>g.id===preferredId)||limited.find(g=>g.id===selected?.id)||limited[0]||null;
  if(next)$('select').value=next.id;
  $('count').textContent='Exibindo '+limited.length+' de '+shown.length+' títulos encontrados'+(shown.length>80?'. Digite para filtrar os demais.':'.');
  setSelected(next);
 }
 function setEnvironment(next){
  if(next!=='arcade'&&next!=='estrategia')return;
  const changed=environment!==next;environment=next;
  document.querySelectorAll('[data-environment]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.environment===environment)));
  $('search').value='';kind='all';$('game-kind').value='all';selected=null;renderChoices(changed?'':requestedId);
  if(changed)addMessage('Catálogo alterado para PG '+(environment==='arcade'?'Arcade':'Estratégia')+'. Selecione o título desejado para receber orientações próprias.');
 }
 function submitQuestion(text){
  const q=typeof text==='string'?text.trim():'';
  if(!q||q.length>240)return;
  addMessage(q,'user');
  const reply=answerQuestion(q,selected);
  addMessage(reply.answer,'bot');
  $('question').value='';
  $('question').focus({preventScroll:true});
 }
 document.querySelectorAll('[data-environment]').forEach(button=>button.addEventListener('click',()=>setEnvironment(button.dataset.environment)));
 $('search').addEventListener('input',()=>renderChoices());
 $('game-kind').addEventListener('change',()=>{kind=$('game-kind').value;renderChoices();});
 $('random-game').addEventListener('click',()=>{
  const pool=filterGames(games,environment,$('search').value,kind);
  const next=suggestGame(pool);
  if(!next){$('action-status').textContent='Nenhum título disponível com esses filtros.';return;}
  $('search').value=next.name;
  renderChoices(next.id);
  $('action-status').textContent='Sugestão selecionada: '+next.name+'. Abra a partida ou peça uma dica.';
 });
 $('share-game').addEventListener('click',async()=>{
  const link=contextUrl(selected);
  if(!link){$('action-status').textContent='Escolha um título para compartilhar a ajuda.';return;}
  try{
   if(!navigator.clipboard?.writeText)throw Error('Clipboard indisponível');
   await navigator.clipboard.writeText(link);
   $('action-status').textContent='Link de ajuda copiado para a área de transferência.';
  }catch{
   $('action-status').textContent='Não foi possível copiar automaticamente. Use o endereço desta página para copiar manualmente.';
  }
 });
 $('clear-chat').addEventListener('click',()=>{
  $('log').replaceChildren();
  addMessage('Conversa limpa. Selecione um jogo e faça uma nova pergunta.');
  $('action-status').textContent='Conversa limpa. Nenhuma pergunta foi salva.';
 });
 $('select').addEventListener('change',()=>setSelected(games.find(g=>g.environment===environment&&g.id===$('select').value)));
 $('form').addEventListener('submit',e=>{e.preventDefault();submitQuestion($('question').value)});
 document.querySelectorAll('[data-question]').forEach(button=>button.addEventListener('click',()=>submitQuestion(button.dataset.question)));
 document.querySelectorAll('[data-environment]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.environment===environment)));
 fetch('./data/games.json').then(response=>{
  if(!response.ok)throw Error('Catálogo indisponível');
  return response.json();
 }).then(data=>{
  if(!data||!Array.isArray(data.games)||data.games.length<300)throw Error('Dados do catálogo incompletos');
  games=data.games;
  $('arcade-count').textContent=String(data.counts.arcade);
  $('mission-count').textContent=String(data.counts.missions);
  $('original-count').textContent=String(data.counts.classic+data.counts.independent);
  renderChoices(requestedId||'snake');
 }).catch(()=>{
  $('select').replaceChildren();
  $('count').textContent='Não foi possível abrir o catálogo. Reconecte e recarregue esta página.';
  addMessage('O catálogo não está acessível nesta visita. Você pode usar os links de navegação para abrir o PG Arcade ou o PG Estratégia.');
 });
 if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}),{once:true});
 }
}
if(typeof document!=='undefined')initDocument();
