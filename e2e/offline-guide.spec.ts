import {test,expect} from '@playwright/test';

for(const width of [320,390]){
 test(`PG Bot exporta guia offline do Arcade e Estratégia em ${width}px`,async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:820});
  await page.goto('./?projeto=arcade&jogo=snake');
  await expect(page.locator('#game-name')).toContainText('Snake');
  const [arcade]=await Promise.all([
   page.waitForEvent('download'),page.getByRole('button',{name:'Salvar guia offline'}).click()
  ]);
  expect(arcade.suggestedFilename()).toBe('pg-bot-arcade-snake.txt');
  await page.getByRole('button',{name:'PG Estratégia'}).click();
  await page.locator('#game-search').fill('est-001');
  const [strategy]=await Promise.all([
   page.waitForEvent('download'),page.getByRole('button',{name:'Salvar guia offline'}).click()
  ]);
  expect(strategy.suggestedFilename()).toBe('pg-bot-estrategia-est-001.txt');
  await expect(page.locator('#action-status')).toContainText('salvo');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
