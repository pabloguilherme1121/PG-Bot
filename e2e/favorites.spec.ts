import {test,expect} from '@playwright/test';

for(const width of [320,390]){
 test('favoritos persistem e não misturam os ambientes em '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:780});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./?projeto=arcade&jogo=snake');
  await expect(page.locator('#favorite-game')).toBeEnabled();
  await page.locator('#favorite-game').click();
  await expect(page.locator('#favorite-game')).toHaveAttribute('aria-pressed','true');
  await page.reload();
  await expect(page.locator('#favorite-game')).toHaveAttribute('aria-pressed','true');
  await page.locator('#favorites-only').check();
  await expect(page.locator('#game-select option')).toHaveCount(1);
  await expect(page.locator('#game-select')).toHaveValue('snake');
  await page.locator('#env-estrategia').click();
  await expect(page.locator('#favorites-only')).not.toBeChecked();
  await page.locator('#favorites-only').check();
  await expect(page.locator('#game-select option')).toHaveCount(0);
  await expect(page.locator('#favorite-game')).toBeDisabled();
  await page.locator('#favorites-only').uncheck();
  await page.locator('#game-search').fill('est-001');
  await expect(page.locator('#game-select option')).toHaveCount(1);
  await page.locator('#favorite-game').click();
  await expect(page.locator('#favorite-game')).toHaveAttribute('aria-pressed','true');
  await page.locator('#env-arcade').click();
  await page.locator('#favorites-only').check();
  await expect(page.locator('#game-select')).toHaveValue('snake');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
