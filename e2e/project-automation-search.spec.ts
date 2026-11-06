import {test,expect} from '@playwright/test';

const api='https://api.github.com/repos/pabloguilherme1121/PG-Bot/issues?state=open&per_page=100';
function mockIssue(){
 const report={version:1,generatedAt:new Date().toISOString(),projects:[
  {repository:'pabloguilherme1121/PG-Arcade',state:'falha',note:'Falha observada',workflows:[],openPRs:[]},
  {repository:'pabloguilherme1121/PG-Estrategia',state:'revisao',note:'PR em revisão',workflows:[],openPRs:[]},
  {repository:'pabloguilherme1121/PG-Bot',state:'ok',note:'CI observada',workflows:[],openPRs:[]}
 ]};
 return JSON.stringify([{title:'PG Bot | Monitoramento dos projetos',body:'<!-- pg-bot-automation:v1\n'+JSON.stringify(report)+'\n-->'}]);
}

for(const width of [320,390]){
 test('busca de projeto filtra cartões e fila sem alterar indicadores em '+width+' px',async({page})=>{
  await page.setViewportSize({width,height:820});
  await page.route(api,route=>route.fulfill({status:200,contentType:'application/json',body:mockIssue()}));
  await page.goto('./automacoes/');
  const search=page.getByRole('searchbox',{name:'Buscar projeto'});
  await expect(search).toBeVisible();
  await expect(page.locator('#projects .project')).toHaveCount(3);
  await expect(page.locator('#action-queue .action-item')).toHaveCount(3);
  await search.fill('ESTRATÉGIA');
  await expect(page.locator('#projects .project')).toHaveCount(1);
  await expect(page.locator('#projects')).toContainText('PG-Estrategia');
  await expect(page.locator('#action-queue .action-item')).toHaveCount(1);
  await expect(page.locator('#project-search-status')).toContainText('1 de 3');
  await expect(page.locator('#count-projects')).toHaveText('3');
  await search.fill('nao-existe');
  await expect(page.locator('#projects')).toContainText('Nenhum projeto');
  await expect(page.locator('#action-queue')).toContainText('Nenhuma ação');
  await search.fill('');
  await expect(page.locator('#projects .project')).toHaveCount(3);
  await expect(page.locator('#action-queue .action-item')).toHaveCount(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test('falha ao atualizar mantém snapshot anterior e sinaliza consulta indisponível',async({page})=>{
 let requests=0;
 await page.route(api,route=>{
  requests++;
  if(requests===1)return route.fulfill({status:200,contentType:'application/json',body:mockIssue()});
  return route.fulfill({status:503,contentType:'application/json',body:'{}'});
 });
 await page.goto('./automacoes/');
 await expect(page.locator('#projects .project')).toHaveCount(3);
 await page.getByRole('button',{name:/Atualizar relatório/}).click();
 await expect(page.locator('#load-status')).toContainText('dados anteriores');
 await expect(page.locator('#overall-state')).toContainText('Consulta indisponível');
 await expect(page.locator('#projects .project')).toHaveCount(3);
});


test('busca não multiplica handlers quando os cartões são renderizados',async({page})=>{
 await page.addInitScript(()=>{
  const original=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type,listener,options){
   if(type==='input'&&this instanceof HTMLInputElement&&this.id==='project-search'){
    (window as any).__pgSearchRegistrations=((window as any).__pgSearchRegistrations||0)+1;
   }
   return original.call(this,type,listener,options);
  };
 });
 await page.route(api,route=>route.fulfill({status:200,contentType:'application/json',body:mockIssue()}));
 await page.goto('./automacoes/');
 const search=page.getByRole('searchbox',{name:'Buscar projeto'});
 await expect(page.locator('#projects .project')).toHaveCount(3);
 await search.fill('P');
 await search.fill('PG');
 await search.fill('Arcade');
 await expect(page.locator('#projects .project')).toHaveCount(1);
 expect(await page.evaluate(()=>(window as any).__pgSearchRegistrations)).toBe(1);
});

test('acha relatório na segunda página sem fingir ausência de dados',async({page})=>{
 let requests=0;
 await page.route('**/repos/pabloguilherme1121/PG-Bot/issues?*',route=>{
  requests++;
  const url=new URL(route.request().url());
  if(url.searchParams.get('page')==='2'){
   return route.fulfill({status:200,contentType:'application/json',body:mockIssue()});
  }
  return route.fulfill({
   status:200,
   contentType:'application/json',
   headers:{
    'link':'<'+api+'&page=2>; rel="next"',
    'access-control-allow-origin':'*',
    'access-control-expose-headers':'Link'
   },
   body:JSON.stringify(Array.from({length:100},(_,i)=>({title:'Outra issue '+i,body:'Sem relatório'})))
  });
 });
 await page.goto('./automacoes/');
 await expect(page.locator('#projects .project')).toHaveCount(3);
 await expect(page.locator('#load-status')).toContainText('Snapshot carregado');
 expect(requests).toBe(2);
});

test('segue URL canônica por ID numérico ao localizar relatório na segunda página',async({page})=>{
 const canonical='https://api.github.com/repositories/1442325600/issues?state=open&per_page=100&page=2';
 await page.route(api,route=>route.fulfill({
  status:200,contentType:'application/json',body:'[]',
  headers:{link:'<'+canonical+'>; rel="next"',
   'access-control-allow-origin':'*','access-control-expose-headers':'Link'}
 }));
 await page.route('https://api.github.com/repositories/1442325600/issues?*',route=>route.fulfill({
  status:200,contentType:'application/json',body:mockIssue(),
  headers:{'access-control-allow-origin':'*'}
 }));
 await page.goto('./automacoes/');
 await expect(page.locator('#projects .project')).toHaveCount(3);
 await expect(page.locator('#load-status')).toContainText('Snapshot carregado');
});
