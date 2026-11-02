import {test,expect} from '@playwright/test';
for(const width of [320,390]){
 test('filtros, sugestão e conversa limpa em '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:800});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./?projeto=estrategia');
  await expect(page.locator('#game-count')).toContainText('188');
  await page.locator('#game-kind').selectOption('mission');
  await expect(page.locator('#game-count')).toContainText('150');
  await page.locator('#game-search').fill('conquista aurora');
  await expect(page.locator('#game-select option')).toHaveCount(1);
  await expect(page.locator('#game-link')).toHaveAttribute('href',/PG-Estrategia\/#est-001/);
  await page.locator('#game-kind').selectOption('game');
  await page.locator('#game-search').fill('');
  await expect(page.locator('#game-count')).toContainText('38');
  await page.locator('#random-game').click();
  await expect(page.locator('#action-status')).toContainText('Sugestão selecionada');
  await page.locator('#question').fill('Como jogar?');
  await page.locator('#chat-form button[type=submit]').click();
  await expect(page.locator('#chat-log .user')).toHaveCount(1);
  await page.locator('#clear-chat').click();
  await expect(page.locator('#chat-log .user')).toHaveCount(0);
  await expect(page.locator('#chat-log .bot')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('cópia de link contextual usa o jogo selecionado e o estado continua no endereço',async({page,context})=>{
 await page.addInitScript(()=>{
  const copied:string[]=[];
  Object.defineProperty(window,'__copiedLinks',{value:copied});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{copied.push(text)}}});
 });
 await page.goto('./?projeto=estrategia&jogo=est-001');
 await expect(page.locator('#game-name')).toContainText('Conquista territorial');
 await page.locator('#share-game').click();
 await expect(page.locator('#action-status')).toContainText('copiado');
 const copied=await page.evaluate(()=>(window as typeof window & {__copiedLinks:string[]}).__copiedLinks);
 expect(copied).toEqual(['https://pabloguilherme1121.github.io/PG-Bot/?projeto=estrategia&jogo=est-001']);
 await page.locator('#game-search').fill('conquista aurora');
 await page.locator('#game-kind').selectOption('mission');
 await expect(page).toHaveURL(/projeto=estrategia&jogo=est-001/);
});

test('permissão de copiar negada orienta usuário sem perder o link',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('NotAllowedError')}}});
 });
 await page.goto('./?projeto=arcade&jogo=snake');
 await page.locator('#share-game').click();
 await expect(page.locator('#action-status')).toContainText('copiar manualmente');
 await expect(page).toHaveURL(/projeto=arcade&jogo=snake/);
});

test('guia contextual e busca por regras funcionam em tela estreita',async({page})=>{
 await page.setViewportSize({width:320,height:780});
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('./?projeto=estrategia&jogo=est-001');
 await expect(page.locator('#game-name')).toContainText('Conquista territorial');
 await page.getByRole('button',{name:'Guia rápido'}).click();
 await expect(page.locator('#chat-log .bot .bubble').last()).toContainText('Iniciante');
 await expect(page.locator('#chat-log .bot .bubble').last()).toContainText('Domine a meta');
 await page.locator('#game-search').fill('iniciante');
 await expect(page.locator('#game-select option[value="est-001"]')).toHaveCount(1);
 await page.getByRole('button',{name:'PG Arcade'}).click();
 await page.locator('#game-search').fill('cronometro');
 await expect(page.locator('#game-select option[value="lanternas"]')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
