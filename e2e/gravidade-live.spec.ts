import {test,expect} from '@playwright/test';
for(const width of [320,390]){
 test('Gravidade mostra jogadas sem inventar turnos em '+width+'px',async({page,context})=>{
  await page.setViewportSize({width,height:820});
  await page.goto('./?projeto=estrategia&jogo=gravidade-cristais');
  await expect(page.locator('#game-name')).toContainText('Gravidade');
  const other=await context.newPage();await other.goto('./');
  const emit=async (value:Record<string,unknown>)=>other.evaluate(value=>{
   const ch=new BroadcastChannel('pg_telemetry_hub_v1');ch.postMessage(value);ch.close();
  },value);
  await page.locator('#live-enable').check();
  const data={type:'PG_STATE_TICK',version:1,project:'estrategia',gameId:'gravidade-cristais',timestamp:Date.now(),turn:null,score:null,resources:null,moves:5,phase:'playing'};
  await emit(data);
  await expect(page.locator('#live-status')).toContainText('Jogadas: 5');
  await expect(page.locator('#live-status')).not.toContainText('Turno');
  await page.locator('#question').fill('Quantas jogadas?');
  await page.locator('#chat-form button[type="submit"]').click();
  await expect(page.locator('#chat-log .chat-row.bot .bubble').last()).toContainText('Jogadas: 5');
  await emit({...data,timestamp:Date.now(),moves:{token:'private'}});
  await expect(page.locator('#live-status')).not.toContainText('private');
  await page.locator('#live-enable').uncheck();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await other.close();
 });
}
