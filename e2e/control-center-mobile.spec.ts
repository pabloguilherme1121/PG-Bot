import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.use({hasTouch:true});

test.describe('painel mobile', () => {
 for (const width of [320, 390]) {
  test(`navegação, filtros e diálogo em ${width}px`, async ({page}) => {
   await page.setViewportSize({width, height: 820});
   await page.goto('painel/');
   for (const view of ['visao','integracoes','qualidade','prs','evidencias','fila']) {
    await page.locator(`#side-nav [data-view="${view}"]`).click();
    await expect(page.locator('#view-content')).not.toBeEmpty();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), view).toBe(true);
   }
   await page.locator('#search').fill('zzzz-sem-resultado-987654');
   await expect(page.locator('.empty')).toBeVisible();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   await page.locator('#search').fill('');
   await page.locator('#side-nav [data-view="qualidade"]').click();
   const opener = page.locator('[data-edit="gate"]').first();
   await opener.focus();
   await page.keyboard.press('Enter');
   await expect(page.locator('#record-modal')).toBeVisible();
   await expect(page.locator('#record-modal select').first()).toBeFocused();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   await page.keyboard.press('Escape');
   await expect(opener).toBeFocused();
  });
 }
 test('backup JSON restaura checklist e persiste após recarregar', async ({page}) => {
  await page.setViewportSize({width: 320, height: 820});
  await page.goto('painel/');
  await page.locator('#side-nav [data-view="prs"]').click();
  const check = page.locator('.pr-card').filter({has: page.getByText('PG-Bot / #18')}).locator('input[data-index="0"]');
  await check.check();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-btn').click();
  const download = await downloadPromise;
  const data = await readFile(await download.path());
  await check.uncheck();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#file-input').setInputFiles({name:'backup.json', mimeType:'application/json', buffer:data});
  await expect(check).toBeChecked();
  await page.reload();
  await page.locator('#side-nav [data-view="prs"]').click();
  await expect(check).toBeChecked();
 });
});


test('texto longo e filtros permanecem utilizáveis no celular', async ({page}) => {
 await page.setViewportSize({width:320,height:820});
 await page.goto('painel/');
 await page.locator('#side-nav [data-view="integracoes"]').tap();
 await page.locator('.filterchip').last().tap();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.locator('#side-nav [data-view="fila"]').tap();
 await page.locator('[data-create="task"]').tap();
 await page.locator('[name="title"]').fill('Registro'.repeat(20));
 await page.locator('[name="dependency"]').fill('Dependência'.repeat(15));
 await page.locator('#modal-form button[type="submit"]').tap();
 await expect(page.locator('.task-row').filter({hasText:'RegistroRegistro'})).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

