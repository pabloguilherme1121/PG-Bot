import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320,390]) {
 test('plano PG Bot respeita contexto e tela de '+width+' px',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:820});
  await page.goto('./?projeto=arcade&jogo=snake');
  await expect(page.locator('#game-name')).toContainText('Snake');
  await page.getByRole('button',{name:'Plano de 3 passos'}).click();
  const answer=page.locator('#chat-log .chat-row.bot .bubble').last();
  await expect(answer).toContainText('1. Objetivo de Snake:');
  await expect(answer).toContainText('2. Controles de Snake:');
  await expect(answer).toContainText('3. Dica de Snake:');
  await expect(page.locator('#chat-log img')).toHaveCount(0);
  await page.getByRole('button',{name:'PG Estratégia'}).click();
  await page.locator('#game-search').fill('conquista territorial aurora');
  await page.getByRole('button',{name:'Plano de 3 passos'}).click();
  await expect(page.locator('#chat-log .chat-row.bot .bubble').last()).toContainText('Conquista territorial');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('plano PG Bot mantém formulário e botão acessíveis',async({page})=>{
 await page.setViewportSize({width:390,height:820});
 await page.goto('./');
 await page.getByRole('button',{name:'Plano de 3 passos'}).click();
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});