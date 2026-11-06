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
 test('CI de SHA antigo não comprova a HEAD atual da main',async ({page})=>{
  const currentSha='a'.repeat(40);
  await page.route('https://api.github.com/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith('/branches/main'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({commit:{sha:currentSha}})});
   if(url.pathname.endsWith('/actions/runs'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({workflow_runs:[{id:123,name:'Qualidade PG Bot',head_branch:'main',head_sha:'b'.repeat(40),status:'completed',conclusion:'success',created_at:'2026-11-06T12:00:00Z'}]})});
   return route.fulfill({status:404,contentType:'application/json',body:'{}'});
  });
  await page.goto('painel/');
  await page.locator('#sync-btn').click();
  await expect(page.locator('#sync-btn')).toBeEnabled();
  const gate=await page.evaluate(()=>JSON.parse(localStorage.getItem('pgbot-control-center-v1')!).gates.find((g:{id:string})=>g.id==='arc-bot-ci'));
  expect(gate.status).toBe('em-validacao');
  expect(gate.evidenceIds).toEqual([]);
 });
});
