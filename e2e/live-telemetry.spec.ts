import {test,expect} from '@playwright/test';
for(const width of [320,390]){
 test(`telemetria entre abas é opcional e restrita ao jogo em ${width}px`,async({page,context})=>{
  await page.setViewportSize({width,height:820});
  await page.goto('./?projeto=estrategia&jogo=dominio-territorial');
  await expect(page.locator('#game-name')).toContainText('Domínio Territorial');
  const other=await context.newPage();
  await other.goto('./');
  const emit=(tick:Record<string,unknown>)=>other.evaluate(tick=>{
   const ch=new BroadcastChannel('pg_telemetry_hub_v1');ch.postMessage(tick);ch.close();
  },tick);
  const tick=(extra={})=>({type:'PG_STATE_TICK',version:1,project:'estrategia',gameId:'dominio-territorial',timestamp:Date.now(),turn:4,score:null,phase:'playing',resources:12,...extra});
  await emit(tick());
  await expect(page.locator('#live-status')).toContainText('Desativado');
  await page.locator('#live-enable').check();
  await emit(tick({gameId:'est-001'}));
  await expect(page.locator('#live-status')).toContainText('Aguardando');
  await emit(tick({resources:{token:'private'}}));
  await expect(page.locator('#live-status')).toContainText('Aguardando');
  await emit(tick());
  await expect(page.locator('#live-status')).toContainText('Turno 4');
  await expect(page.locator('#live-status')).toContainText('Suprimentos: 12');
  await page.getByLabel('Sua pergunta').fill('Qual meu turno atual?');
  await page.getByRole('button',{name:/Enviar/}).click();
  await expect(page.locator('#chat-log .chat-row.bot .bubble').last()).toContainText('Turno 4');
  await page.locator('#live-enable').uncheck();
  await expect(page.locator('#live-status')).toContainText('Desativado');
  await emit(tick({turn:9}));
  await expect(page.locator('#live-status')).not.toContainText('Turno 9');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await other.close();
 });
}
