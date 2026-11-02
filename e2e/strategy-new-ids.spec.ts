import {test,expect} from '@playwright/test';
const titles=[
 {id:'dominio-territorial',name:'Domínio Territorial',hint:/bastião|flancos|suprimentos/i},
 {id:'gravidade-cristais',name:'Gravidade dos Cristais',hint:/cristais|rochas|deslizar/i}
];
for(const width of [320,390])for(const {id,name,hint} of titles){
 test('contexto '+id+' em '+width+'px abre jogo certo e plano factual',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize({width,height:800});
  await page.goto('./?projeto=estrategia&jogo='+id);
  await expect(page.locator('#game-name')).toContainText(name);
  await expect(page.locator('#game-link')).toHaveAttribute('href',
   'https://pabloguilherme1121.github.io/PG-Estrategia/independentes/'+id+'/');
  await expect(page.locator('#original-count')).toHaveText('38');
  await page.getByRole('button',{name:'Plano de 3 passos'}).click();
  const response=page.locator('#chat-log .chat-row.bot .bubble').last();
  await expect(response).toContainText('1. Objetivo');
  await expect(response).toContainText('3. Dica');
  await expect(response).toContainText(hint);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  expect(errors).toEqual([]);
 });
}
