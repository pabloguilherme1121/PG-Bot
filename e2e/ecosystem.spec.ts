import {test,expect,Page,Route} from '@playwright/test';

const names=['PG-Bot','PG-Arcade','PG-Estrategia','PG-portfolio','pg-tech-storefront','Cuidador-a-','universo-pablo-builds','eleicoes-goias-2026'];
const repos=names.map(name=>({name,owner:{login:'pabloguilherme1121'},private:false,
  html_url:'https://github.com/pabloguilherme1121/'+name,
  homepage:name==='PG-Bot'?'https://pabloguilherme1121.github.io/PG-Bot/':null,
  description:'Projeto público '+name,updated_at:'2026-11-05T12:00:00Z',language:'JavaScript',default_branch:'main'}));
async function mockGithub(page:Page,broken:()=>boolean=()=>false){
  await page.route('https://api.github.com/**',async(route:Route)=>{
    if(broken())return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},body:'Indisponível'});
    const url=new URL(route.request().url());
    const headers={'access-control-allow-origin':'*','content-type':'application/json; charset=utf-8'};
    if(url.pathname==='/users/pabloguilherme1121/repos')return route.fulfill({status:200,headers,body:JSON.stringify(url.searchParams.get('page')==='1'?repos:[])});
    if(url.pathname.endsWith('/readme'))return route.fulfill({status:200,headers:{...headers,'content-type':'text/plain; charset=utf-8'},body:'# PG Bot\nResponde perguntas documentadas e mantém dados locais.'});
    if(url.pathname.endsWith('/pulls'))return route.fulfill({status:200,headers,body:JSON.stringify([{number:19,title:'Painel de homologação',state:'closed',merged_at:'2026-11-06T04:15:48Z'}])});
    if(url.pathname.endsWith('/actions/runs'))return route.fulfill({status:200,headers,body:JSON.stringify({workflow_runs:[{id:123,conclusion:'success',status:'completed',head_sha:'abcdef01234',html_url:'https://github.com/a/b/actions/runs/123'}]})});
    return route.fulfill({status:404,headers,body:'{}'});
  });
}

test.describe('PG Bot | ecossistema público',()=>{
  for(const width of [320,390]){
    test('consulta acessível sem overflow em '+width+'px',async({page})=>{
      await mockGithub(page);
      await page.setViewportSize({width,height:820});
      await page.goto('ecossistema/');
      await expect(page.getByRole('heading',{name:'Projetos públicos'})).toBeVisible();
      await expect(page.locator('#repo-total')).toHaveText('8');
      await expect(page.locator('#page-info')).toHaveText('Página 1 de 2');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.locator('#next').click();
      await expect(page.locator('#page-info')).toHaveText('Página 2 de 2');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.locator('#repo-search').fill('PG-Bot');
      await expect(page.locator('#repo-total')).toHaveText('1');
      await page.locator('#repo-list button').click();
      await page.getByRole('button',{name:'Quais são as PRs recentes?'}).click();
      await expect(page.locator('#answer-text')).toContainText('#19');
      await expect(page.locator('#answer-source a')).toHaveAttribute('href',/github.com/);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    });
  }
  test('fila permite revisão, edição, persistência e exportação',async({page})=>{
    await mockGithub(page);
    await page.goto('ecossistema/');
    await expect(page.locator('#suggest')).toBeEnabled();
    await page.locator('#suggest').click();
    await expect(page.locator('.queue-card')).toHaveCount(1);
    await page.locator('.queue-card textarea').first().fill('Revisão documentada com referência');
    await page.locator('.queue-card input[type="url"]').fill('https://github.com/pabloguilherme1121/PG-Bot/pull/22');
    await page.locator('.queue-card input[type="url"]').press('Tab');
    await page.locator('.queue-card input[type="checkbox"]').check();
    const promise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Exportar JSON'}).click();
    const file=await promise;
    expect(file.suggestedFilename()).toBe('pg-bot-sugestoes.json');
    await page.reload();
    await expect(page.locator('.queue-card textarea').first()).toHaveValue('Revisão documentada com referência');
    await expect(page.locator('.queue-card input[type="url"]')).toHaveValue('https://github.com/pabloguilherme1121/PG-Bot/pull/22');
    await expect(page.locator('.queue-card input[type="checkbox"]')).toBeChecked();
    await page.getByRole('button',{name:'Excluir'}).click();
    await expect(page.locator('.queue-card')).toHaveCount(0);
  });
  test('falha de rede preserva último catálogo válido, identificado como antigo',async({page})=>{
    let broken=false;
    await mockGithub(page,()=>broken);
    await page.goto('ecossistema/');
    await expect(page.locator('#repo-total')).toHaveText('8');
    broken=true;
    await page.getByRole('button',{name:'Atualizar do GitHub'}).click();
    await expect(page.locator('#catalog-status')).toContainText('Dados antigos.');
    await expect(page.locator('#repo-total')).toHaveText('8');
    await page.getByRole('button',{name:'Como estão os checks de CI?'}).click();
    await expect(page.locator('#answer-source')).toContainText('Dados antigos ou indisponíveis');
  });
});
