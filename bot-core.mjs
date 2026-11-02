const ARCADE="https://pabloguilherme1121.github.io/PG-Arcade/";
const STRATEGIA="https://pabloguilherme1121.github.io/PG-Estrategia/";
const FAMILIES=Object.freeze([
 ["Conquista territorial","Expanda para casas vizinhas e conserve caminhos de avanço; observe o rival antes de gastar seu turno."],
 ["Rota crítica","Encontre um percurso contínuo, evite bloqueios e use Desfazer se a rota ficar sem saída."],
 ["Comércio & recursos","Planeje créditos, alimento, minério e influência. Reserve recursos antes de fazer investimentos."],
 ["Defesa de fronteira","Observe as pistas ameaçadas, posicione torres e fortaleça sua defesa antes da próxima onda."],
 ["Expedição tática","Planeje combustível e reabastecimento antes de coletar cargas e alcançar a saída."],
 ["Plano da cidade","Equilibre energia, água e confiança. Cada projeto tem custos e ocupa um turno."],
]);
const GAMES=Object.freeze({
 snake:{name:"Snake",tip:"Use os controles de direção para recolher itens sem atingir o próprio corpo ou os limites da arena."},
 "2048":{name:"2048",tip:"Deslize os blocos para combinar valores iguais. Planeje uma direção estável antes de cada movimento."},
 xadrez:{name:"Xadrez",tip:"Observe o rei, proteja suas peças e planeje trocas antes de mover. Consulte as regras da partida para o modo escolhido."},
 trem:{name:"Trem Sem Freio",tip:"Ajuste os desvios e evite que os trens colidam; considere o próximo movimento antes de alterar um trilho."},
 fortalezas:{name:"Fortalezas de Turnos",tip:"Equilibre defensores, economia e ameaças nas três linhas antes de avançar uma onda."},
 reles:{name:"Rede de Relés",tip:"Ligue os dispositivos à estação-base usando os relés e respeitando o orçamento disponível."},
 cidade:{name:"Cidade em Miniatura",tip:"Distribua moradias, comércio, indústria e parques sem estourar o orçamento."},
});
export function normalizeText(value){return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();}
export function getQuickActions(product="arcade"){
 const common=[
 {label:"Como jogar",question:"Como jogar?"},
 {label:"Controles",question:"Quais são os controles?"},
 {label:"Progresso",question:"Como salvo o progresso?"},
 {label:"Offline",question:"Dá para jogar offline?"},
 {label:"Acessibilidade",question:"Quais recursos de acessibilidade?"},
 ];
 return product==="estrategia"?
 [common[0],{label:"Dica da missão",question:"Quero uma dica da missão"},{label:"Situação atual",question:"Qual o turno atual?"},...common.slice(2)]:
 [common[0],common[1],{label:"Reiniciar",question:"Como reiniciar?"},...common.slice(2)];
}
export function destinationFor(product,id=""){
 if(product==="arcade"){
  if(id && Object.hasOwn(GAMES,id))return ARCADE+"#/jogar/"+encodeURIComponent(id);
  return id ? null : ARCADE;
 }
 if(product==="estrategia"){
  if(!id)return STRATEGIA;
  const match=/^est-(\d{3})$/.exec(id);
  const n=match?Number(match[1]):NaN;
  return Number.isInteger(n)&&n>=1&&n<=150?STRATEGIA+"#"+id:null;
 }
 return null;
}
const fallback="Sou o PG Bot local. Posso ajudar com regras, controles, dicas, progresso, offline e acessibilidade. Escolha um assunto ou tente outra pergunta.";
export function answerQuestion({product="arcade",question="",game="",mission="",turn="",progress=""}={}){
 const raw=typeof question==="string"&&question.length<=240?question.trim():"";
 const q=normalizeText(raw);
 if(!q||q.length>240||!/[a-z0-9]/.test(q))return {topic:"fallback",answer:fallback};
 const strategy=product==="estrategia";
 const gameInfo=Object.hasOwn(GAMES,game)?GAMES[game]:null;
 const family=FAMILIES.find(([label])=>normalizeText(mission).startsWith(normalizeText(label)+":"));
 let topic="fallback",answer=fallback;
 if(strategy&&/150|quantos|sistema|mecanica|motor|jogos diferentes/.test(q)){
  topic="catalogo";answer="O PG Estratégia oferece 150 missões distintas distribuídas em seis sistemas de regras. São desafios com cenários próprios, não 150 motores de jogos diferentes. Há também jogos independentes com regras próprias.";
 }else if(strategy&&/situacao|status|turno|estado atual|minha partida|progresso atual|quanto falta/.test(q)){
  topic="estado-missao";
  if(!mission)answer="Não tenho acesso à partida aberta em outro site. Abra uma missão no PG Estratégia para consultar o turno real. Você também pode informar o nome e os indicadores aqui.";
  else {
   const clean=String(mission).slice(0,120).replace(/[<>]/g,"");
   const t=/^\d+\s*\/\s*\d+$/.test(String(turn))?String(turn):null;
   const p=/^\d+\s*\/\s*\d+$/.test(String(progress))?String(progress):null;
   answer="Contexto informado: "+clean+". "+(t?"Turno: "+t+". ":"Turno não informado. ")+(p?"Progresso: "+p+". ":"Progresso não informado. ")+"Esses valores foram fornecidos no link, não consultados ao vivo.";
  }
 }else if(/offline|sem internet|sem rede|desconectad/.test(q)){
  topic="offline";answer="Os jogos podem funcionar offline depois que os arquivos necessários forem carregados e armazenados em uma visita conectada. A primeira visita e conteúdos ainda não abertos podem precisar de internet. O PG Bot funciona localmente.";
 }else if(/favorit|record|pontua|salv|backup|progresso|sincroni/.test(q)){
  topic="progresso";answer="Recordes, favoritos e vitórias ficam no armazenamento do navegador. Não há conta nem sincronização automática. Limpar os dados do site ou mudar de aparelho pode apagar o histórico.";
 }else if(/acessib|leitor|contraste|teclad|\btab\b|movimento reduzido|tamanho/.test(q)){
  topic="acessibilidade";answer="Navegue com Tab e Enter onde houver controles, use o botão de contraste e a preferência de movimento reduzido. No celular, utilize os botões de toque disponíveis. As regras de cada jogo mostram os comandos próprios.";
 }else if(/paus|reinic|recomec|desfaz|reset|retomar/.test(q)){
  topic="reiniciar";answer=strategy?"Na arena, use Desfazer quando a mecânica permitir ou Reiniciar para recomeçar a missão. Voltar ao catálogo não deve apagar vitórias já registradas.":"Use Pausar/Continuar e Reiniciar quando esses controles existirem no jogo. Reiniciar encerra a sessão atual; favoritos e recordes salvos são independentes.";
 }else if(strategy&&/dica|estrateg|venc|ganh|missao|proximo passo|rota/.test(q)){
  topic="dica-missao";answer=family?"Dica para "+family[0]+": "+family[1]:"Selecione uma missão no PG Estratégia. Posso dar dicas dos seis sistemas: conquista territorial, rota crítica, comércio, defesa, expedição e planejamento da cidade. Sem a missão informada, não vou inventar um movimento.";
 }else if(/controle|comando|tecla|seta|toque|touch|mover/.test(q)){
  topic="controles";answer=gameInfo?"Controles de "+gameInfo.name+": "+gameInfo.tip+" Consulte os comandos mostrados no jogo para os detalhes do modo atual.":strategy?"Use os botões na arena, Tab e Enter para acessar controles e as setas quando o tabuleiro permitir. Cada sistema pode ter comandos próprios.":"Cada jogo do Arcade tem comandos próprios. Abra o jogo e confira o painel PG Bot ou o tutorial da partida. Teclado e controles de toque variam por jogo.";
 }else if(/como|jog|inicio|regras|objetivo|ajuda|comec/.test(q)){
  topic="como-jogar";answer=strategy?"Escolha uma das 150 missões, veja o objetivo e tome decisões por turnos. As missões usam seis sistemas de regras. Os jogos independentes têm regras diferentes entre si.":gameInfo?"No jogo "+gameInfo.name+", seu objetivo e controles são: "+gameInfo.tip:"No PG Arcade, selecione um jogo, veja o objetivo e use seus controles indicados. O PG Bot dentro da partida oferece ajuda específica; não existe uma regra única para os 101 jogos.";
 }
 return {topic,answer};
}
