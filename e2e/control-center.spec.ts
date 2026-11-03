import {test,expect} from '@playwright/test';

test.describe('PG Bot Control Center',()=>{
 for(const width of [320,390]){
  test('sem overflow em '+width+' px e com filtros acessíveis',async ({page})=>{
   await page.setViewportSize({width,height:820});
   await page.goto('painel/');
   await expect(page.locator('.ring-value')).toHaveText('17%');
   await expect(page.getByRole('heading',{name:/Qualidade que pode ser comprovada/})).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.locator('#project-switch [data-project="estrategia"]').click();
   await expect(page.locator('.stat-grid')).toBeVisible();
   await page.locator('#side-nav [data-view="qualidade"]').click();
   await expect(page.locator('.quality-line').first()).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
 }
 test('edição sem evidência não eleva índice comprovado',async ({page})=>{
  await page.goto('painel/');
  const initial=await page.locator('.ring-value').innerText();
  await page.locator('#side-nav [data-view="qualidade"]').click();
  await page.locator('[data-edit="gate"][data-id="str-320"]').click();
  await page.locator('select[name="status"]').selectOption('comprovado');
  await page.locator('#modal-form button[type="submit"]').click();
  await page.locator('#side-nav [data-view="visao"]').click();
  await expect(page.locator('.ring-value')).toHaveText(initial);
 });
 test('checklist não transforma PR aberta em merge',async ({page})=>{
  await page.goto('painel/');
  await page.locator('#side-nav [data-view="prs"]').click();
  const pr=page.locator('.pr-card').filter({has:page.getByText('PG-Bot / #18')});
  await expect(pr).toContainText('Aberta');
  const check=pr.locator('input[data-index="0"]');
  await check.check();
  await expect(pr).toContainText('Merge não confirmado');
 });
});
