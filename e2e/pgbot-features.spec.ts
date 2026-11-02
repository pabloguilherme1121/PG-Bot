import {test,expect} from '@playwright/test';
for(const width of [320,390]){
 test('recomendar próximo jogo, compartilhar e limpar conversa em '+width+' px',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:790});
  await page.goto('./?projeto=arcade&jogo=snake');
  await expect(page.locator('#game-name')).toHaveText(/Snake/);
  await page.getByRole('button',{name:'Descobrir outro jogo'}).click();
  await expect(page.locator('#game-name')).not.toHaveText(/Snake/);
  const chosen=await page.locator('#game-select').inputValue();
  expect(chosen).toBeTruthy();
  await page.getByRole('button',{name:'Compartilhar contexto'}).click();
  await expect(page.locator('#share-status')).toContainText(/link|copiad|copiar/i);
  await page.locator('#question').fill('Como jogar?');
  await page.locator('#question').press('Enter');
  await expect(page.locator('#chat-log .chat-row.user')).toHaveCount(1);
  await page.getByRole('button',{name:'Limpar conversa'}).click();
  await expect(page.locator('#chat-log .chat-row.user')).toHaveCount(0);
  await expect(page.locator('#chat-log .chat-row.bot')).toHaveCount(1);
  await page.keyboard.press('Alt+Shift+h');
  await expect(page.locator('#question')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('não sugere jogo inexistente quando a busca só encontra um',async({page})=>{
 await page.goto('./');
 await page.locator('#game-search').fill('snake');
 await expect(page.locator('#game-select option')).toHaveCount(1);
 await page.getByRole('button',{name:'Descobrir outro jogo'}).click();
 await expect(page.locator('#game-name')).toHaveText(/Snake/);
 await expect(page.locator('#share-status')).toContainText(/outro jogo|opções/i);
});
test('link contextual preserva seleção ao reabrir',async({page})=>{
 await page.goto('./?projeto=estrategia&jogo=est-001');
 await expect(page.locator('#game-name')).toContainText('Conquista territorial');
 await page.getByRole('button',{name:'Compartilhar contexto'}).click();
 await expect(page.locator('#share-status')).toContainText(/link|copiad|copiar/i);
 await page.reload();
 await expect(page.locator('#game-name')).toContainText('Conquista territorial');
});
