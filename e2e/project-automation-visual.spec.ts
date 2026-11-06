import {test,expect} from '@playwright/test';

test.describe('PG Bot: identidade visual da central de automações',()=>{
 for(const width of [320,390]){
  test('tipografia, contraste, toque e ausência de overflow em '+width+' px',async({page})=>{
   await page.setViewportSize({width,height:820});
   await page.route('https://api.github.com/repos/pabloguilherme1121/PG-Bot/issues?state=open&per_page=100',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
   await page.goto('./automacoes/');
   await expect(page.getByRole('heading',{name:/seus projetos/i})).toBeVisible();
   const visual=await page.evaluate(()=>{
    const css=getComputedStyle(document.documentElement);
    const button=id=>document.querySelector(id)?.getBoundingClientRect().height??0;
    return {accent:css.getPropertyValue('--accent').trim().toLowerCase(),
      bodyFont:getComputedStyle(document.body).fontFamily,
      buttonHeight:button('#refresh'),filterHeight:button('[data-project-filter="attention"]'),
      askHeight:button('#ask button'),
      overflow:document.documentElement.scrollWidth>innerWidth};
   });
   expect(visual.accent).toBe('#8daaff');
   expect(visual.bodyFont).toContain('DM Sans');
   expect(await page.locator('#hero-title').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Space Grotesk');
   expect(await page.locator('.stat-index').first().evaluate(el=>getComputedStyle(el).fontFamily)).toContain('IBM Plex Mono');
   expect(visual.buttonHeight).toBeGreaterThanOrEqual(44);
   expect(visual.filterHeight).toBeGreaterThanOrEqual(44);
   expect(visual.askHeight).toBeGreaterThanOrEqual(44);
   expect(visual.overflow).toBe(false);
  });
 }
 test('primeiro Tab alcança skip-link e movimento reduzido é respeitado',async({page})=>{
  await page.setViewportSize({width:320,height:820});
  await page.route('https://api.github.com/repos/pabloguilherme1121/PG-Bot/issues?state=open&per_page=100',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./automacoes/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Pular para conteúdo'})).toBeFocused();
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
 });
});
