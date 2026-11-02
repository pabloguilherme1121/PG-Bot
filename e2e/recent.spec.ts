import {test,expect} from '@playwright/test';

for(const width of [320,390]){
 test('contextos recentes ligam Arcade e Estratégia sem registrar perguntas a '+width+'px',async({page})=>{
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:820});
  await page.goto('./');
  await expect(page.locator('#recent-games')).toContainText('Nenhum título');
  await expect(page.locator('#game-name')).toContainText('Snake');
  await page.locator('#plan-game').click();
  await expect(page.locator('#recent-games button')).toHaveCount(1);
  await page.locator('#env-estrategia').click();
  await page.locator('#game-search').fill('est-001');
  await page.locator('#plan-game').click();
  await expect(page.locator('#recent-games button')).toHaveCount(2);
  await expect(page.locator('#recent-games button').first()).toContainText('Conquista territorial');
  await page.locator('#recent-games button').filter({hasText:'Snake'}).click();
  await expect(page.locator('#env-arcade')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#game-select')).toHaveValue('snake');
  await expect(page).toHaveURL(/projeto=arcade&jogo=snake/);
  await page.reload();
  await expect(page.locator('#recent-games button')).toHaveCount(2);
  const stored=await page.evaluate(()=>localStorage.getItem('pg-bot:recent:v1'));
  expect(stored).not.toContain('Plano');
  expect(stored).not.toContain('Quais');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}

test('limpar histórico funciona mesmo sem outros favoritos',async({page})=>{
 await page.goto('./?projeto=arcade&jogo=snake');
 await expect(page.locator('#recent-games button')).toHaveCount(1);
 await page.locator('#clear-recent').click();
 await expect(page.locator('#recent-games')).toContainText('Nenhum título');
 await page.goto('./');
 await expect(page.locator('#recent-games')).toContainText('Nenhum título');
});
