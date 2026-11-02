import {test,expect} from '@playwright/test';
for(const width of [320,390]){
 test('cópia manual e atalho de foco acessíveis a '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:800});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('NotAllowedError')}}});
  });
  await page.goto('./?projeto=estrategia&jogo=est-001');
  await expect(page.locator('#game-name')).toContainText('Conquista territorial');
  await page.locator('#share-game').click();
  await expect(page.locator('#share-url')).toBeVisible();
  await expect(page.locator('#share-url')).toHaveValue('https://pabloguilherme1121.github.io/PG-Bot/?projeto=estrategia&jogo=est-001');
  await expect(page.locator('#action-status')).toContainText(/copie|copiar/i);
  await page.keyboard.press('Alt+Shift+h');
  await expect(page.locator('#question')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('duas sugestões consecutivas preservam o filtro e não repetem o jogo',async({page})=>{
 await page.goto('./?projeto=arcade');
 await expect(page.locator('#game-count')).toContainText('150');
 await page.locator('#random-game').click();
 const first=await page.locator('#game-select').inputValue();
 await page.locator('#random-game').click();
 const second=await page.locator('#game-select').inputValue();
 expect(first).not.toBe(second);
 await expect(page.locator('#game-search')).toHaveValue('');
});
