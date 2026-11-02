import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion, getQuickActions, destinationFor, normalizeText } from "../bot-core.mjs";

test("normaliza acentos",()=>assert.equal(normalizeText("  Próxima MISSÃO "), "proxima missao"));
test("Arcade contextualiza ajuda",()=>{
  const x=answerQuestion({product:"arcade",game:"snake",question:"Como jogar?"});
  assert.equal(x.topic,"como-jogar");assert.match(x.answer,/Snake/);
});
test("Estratégia explica corretamente os seis sistemas",()=>{
  const x=answerQuestion({product:"estrategia",question:"São 150 jogos diferentes?"});
  assert.match(x.answer,/150/);assert.match(x.answer,/seis/i);
});
test("não inventa estado de missão indisponível",()=>{
  const x=answerQuestion({product:"estrategia",question:"Qual o turno atual?"});
  assert.match(x.answer,/não tenho acesso|abra uma missão|não consigo ver/i);
  assert.doesNotMatch(x.answer,/Turno: \d+/);
});
test("permite contexto fornecido e validado",()=>{
  const x=answerQuestion({product:"estrategia",question:"Qual a situação?",mission:"Conquista territorial: Aurora",turn:"3/12",progress:"2/5"});
  assert.match(x.answer,/3\/12/);assert.match(x.answer,/2\/5/);
});
test("recusa entradas extensas e não gera HTML",()=>{
  const x=answerQuestion({product:"arcade",question:"<img src=x onerror=alert(1)>"});
  assert.doesNotMatch(x.answer,/<img|<script/);
  assert.equal(answerQuestion({product:"arcade",question:"a".repeat(241)}).topic,"fallback");
});
test("atalhos disponíveis nos dois produtos",()=>{assert.ok(getQuickActions("arcade").length>=4);assert.ok(getQuickActions("estrategia").length>=4);});
test("links só para destinos válidos",()=>{
  assert.equal(destinationFor("arcade","snake"),"https://pabloguilherme1121.github.io/PG-Arcade/#/jogar/snake");
  assert.equal(destinationFor("estrategia","est-001"),"https://pabloguilherme1121.github.io/PG-Estrategia/#est-001");
  assert.equal(destinationFor("arcade","javascript:alert(1)"),null);
});