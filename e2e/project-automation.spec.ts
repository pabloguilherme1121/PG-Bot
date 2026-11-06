import {test,expect} from '@playwright/test';
const api='https://api.github.com/repos/pabloguilherme1121/PG-Bot/issues?state=open&per_page=100';
for(const width of [320,390]){
 test('central de automações evidencia falhas sem overflow em '+width+' px',async({page})=>{
  await page.setViewportSize({width,height:790});
  const data={version:1,generatedAt:'2026-11-05T21:00:00.000Z',projects:[{
   repository:'pabloguilherme1121/PG-Arcade',state:'falha',note:'Falha verificada',openPRs:[{number:20,title:'teste',draft:true,url:'https://github.com/pabloguilherme1121/PG-Arcade/pull/20'}],
   workflows:[{id:123,name:'WebKit',status:'completed',conclusion:'failure',url:'https://github.com/pabloguilherme1121/PG-Arcade/actions/runs/123'}]
  }]};
  await page.route(api,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{title:'PG Bot | Monitoramento dos projetos',body:'<!-- pg-bot-automation:v1\n'+JSON.stringify(data)+'\n-->'}])}));
  await page.goto('./automacoes/');
  await expect(page.locator('#count-failures')).toHaveText('1');
  await expect(page.locator('#action-queue .action-item')).toHaveCount(1);
  await expect(page.locator('#action-queue')).toContainText('Investigar falha de CI');
  await expect(page.locator('#action-queue a')).toHaveAttribute('href','https://github.com/pabloguilherme1121/PG-Arcade/actions/runs/123');
  await expect(page.getByRole('link',{name:'Ver falha: WebKit'})).toHaveAttribute('href',/actions\/runs\/123/);
  await page.getByRole('button',{name:'Prioridades'}).click();
  await expect(page.locator('#messages .message').last()).toContainText('PG-Arcade');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test('sem issue de relatório, não inventa estados de projeto',async({page})=>{
 await page.route(api,route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.goto('./automacoes/');
 await expect(page.locator('#load-status')).toContainText('não publicado');
 await page.getByRole('button',{name:'Falhas'}).click();
 await expect(page.locator('#messages .message').last()).toContainText('Não há relatório');
 await expect(page.locator('#count-failures')).toHaveText('0');
});

test('relatório com mais de 24 horas exibe aviso e não sugere dado atual',async({page})=>{
 const data={version:1,generatedAt:'2020-01-01T12:00:00.000Z',projects:[{
  repository:'pabloguilherme1121/PG-Bot',state:'ok',note:'CI anterior',
  openPRs:[],workflows:[{id:123,name:'Qualidade',status:'completed',conclusion:'success',url:'https://github.com/pabloguilherme1121/PG-Bot/actions/runs/123'}]
 }]};
 await page.route(api,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{title:'PG Bot | Monitoramento dos projetos',body:'<!-- pg-bot-automation:v1\n'+JSON.stringify(data)+'\n-->'}])}));
 await page.goto('./automacoes/');
 await expect(page.locator('#overall-state')).toContainText('desatualizado');
 await expect(page.locator('#load-status')).toContainText('mais de 24 horas');
});


for(const width of [320,390]){
 test('filtros do painel mostram o subconjunto correto com controle de teclado em '+width+' px',async({page})=>{
  await page.setViewportSize({width,height:790});
  const data={version:1,generatedAt:'2026-11-05T21:00:00.000Z',projects:[
   {repository:'pabloguilherme1121/PG-Arcade',state:'falha',note:'Falha verificada',openPRs:[],workflows:[]},
   {repository:'pabloguilherme1121/PG-Estrategia',state:'revisao',note:'PR aberta',openPRs:[{number:7,title:'Em revisão',draft:true,url:'https://github.com/pabloguilherme1121/PG-Estrategia/pull/7'}],workflows:[]},
   {repository:'pabloguilherme1121/PG-Bot',state:'ok',note:'CI aprovada',openPRs:[],workflows:[]}
  ]};
  await page.route(api,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{title:'PG Bot | Monitoramento dos projetos',body:'<!-- pg-bot-automation:v1\n'+JSON.stringify(data)+'\n-->'}])}));
  await page.goto('./automacoes/');
  await expect(page.locator('#projects .project')).toHaveCount(3);
  const attention=page.getByRole('button',{name:'Atenção'});
  await attention.focus();
  await page.keyboard.press('Enter');
  await expect(attention).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#projects .project')).toHaveCount(1);
  await expect(page.locator('#projects')).toContainText('PG-Arcade');
  await page.getByRole('button',{name:'Em revisão'}).click();
  await expect(page.locator('#projects .project')).toHaveCount(1);
  await expect(page.locator('#projects')).toContainText('PG-Estrategia');
  await page.getByRole('button',{name:'Todos'}).click();
  await expect(page.locator('#projects .project')).toHaveCount(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
