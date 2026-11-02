import {test,expect} from '@playwright/test';

test('sugestão respeita o filtro de favoritos e não indica títulos fora dele',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>0.99999;});
 await page.goto('./?projeto=arcade&jogo=snake');
 await expect(page.locator('#game-name')).toContainText('Snake');
 await page.locator('#favorites-only').check();
 await expect(page.locator('#game-select option')).toHaveCount(0);
 await page.locator('#random-game').click();
 await expect(page.locator('#action-status')).toContainText('Nenhum título disponível');

 await page.locator('#favorites-only').uncheck();
 await page.locator('#game-search').fill('snake');
 await page.locator('#favorite-game').click();
 await expect(page.locator('#favorite-game')).toHaveAttribute('aria-pressed','true');
 await page.locator('#game-search').fill('');
 await page.locator('#favorites-only').check();
 await page.locator('#random-game').click();
 await expect(page.locator('#action-status')).toContainText('Sugestão selecionada: Snake');
 await expect(page.locator('#game-select')).toHaveValue('snake');
});

test('compartilhar fica desativado até o catálogo confirmar o jogo',async({page})=>{
 let release;
 const blocked=new Promise(resolve=>{release=resolve;});
 await page.route('**/data/games.json',async route=>{await blocked;await route.continue();});
 await page.goto('./?projeto=arcade&jogo=snake');
 try{
  await expect(page.locator('#share-game')).toBeDisabled();
 }finally{
  release();
 }
 await expect(page.locator('#game-name')).toContainText('Snake');
 await expect(page.locator('#share-game')).toBeEnabled();
});
