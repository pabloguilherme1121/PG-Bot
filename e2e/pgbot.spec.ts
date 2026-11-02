import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const width of [320,390]){
 test('PG Bot abre catálogo, responde e não estoura tela a '+width+' px',async({page})=>{
  await page.setViewportSize({width,height:780});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading',{name:/Sua próxima jogada/})).toBeVisible();
  await expect(page.locator('#game-select option')).toHaveCount(80);
  await expect(page.locator('#arcade-count')).toHaveText('150');
  await page.locator('#game-search').fill('snake');
  await expect(page.locator('#game-select option')).toHaveCount(1);
  await page.locator('#game-select').selectOption('snake');
  await page.locator('#question').fill('Como jogar?');
  await page.getByRole('button',{name:'Enviar'}).click();
  await expect(page.locator('#chat-log .bot .bubble').last()).toContainText('Snake');
  await page.getByRole('button',{name:'PG Estratégia'}).click();
  await page.locator('#game-search').fill('frota oculta');
  await expect(page.locator('#game-select option')).toHaveCount(1);
  await expect(page.locator('#game-link')).toHaveAttribute('href',/PG-Estrategia\/independentes\/\#frota-oculta/);
  await page.getByRole('button',{name:'Uma dica'}).click();
  await expect(page.locator('#chat-log .bot .bubble').last()).toContainText(/Frota|sonar|linha|navio/i);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('busca e deep link de missão geram URL correta',async({page})=>{
 await page.goto('./?projeto=estrategia&jogo=est-001');
 await expect(page.locator('#env-estrategia')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#game-name')).toContainText('Conquista territorial');
 await expect(page.locator('#game-link')).toHaveAttribute('href',/PG-Estrategia\/#est-001/);
 await page.locator('#question').fill('Qual meu turno atual?');
 await page.getByRole('button',{name:'Enviar'}).click();
 await expect(page.locator('#chat-log .bot .bubble').last()).toContainText('não acompanha');
});
test('resposta de pergunta maliciosa não insere HTML e teclado funciona',async({page})=>{
 await page.goto('./');
 const input=page.locator('#question');
 await input.fill('<img src=x onerror=alert(1)>');
 await input.press('Enter');
 await expect(page.locator('#chat-log .bot .bubble').last()).toContainText('Posso explicar');
 await expect(page.locator('#chat-log img')).toHaveCount(0);
 await expect(input).toHaveAttribute('maxlength','240');
});
test('PWA responde offline depois de primeira visita conectada',async({page,context})=>{
 await page.goto('./');
 await page.waitForFunction(()=>navigator.serviceWorker?.controller?.scriptURL.includes('/PG-Bot/sw.js'),null,{timeout:12000});
 await page.reload();
 await context.setOffline(true);
 await page.reload();
 await expect(page.locator('#game-name')).not.toHaveText('Escolha uma partida');
 await page.locator('#question').fill('Funciona offline?');
 await page.getByRole('button',{name:'Enviar'}).click();
 await expect(page.locator('#chat-log .bot .bubble').last()).toContainText('offline');
 await context.setOffline(false);
});
test('formulário e conversa passam auditoria WCAG automatizada',async({page})=>{
 await page.setViewportSize({width:390,height:780});
 await page.goto('./');
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(results.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});
