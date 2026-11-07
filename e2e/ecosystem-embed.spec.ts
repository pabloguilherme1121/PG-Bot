import {test,expect} from '@playwright/test';

test('widget incorporável: abre, mantém foco e fecha pelo iframe',async({page})=>{
  await page.route('https://api.github.com/**',async route=>{
    const url=route.request().url();
    const headers={'access-control-allow-origin':'*','content-type':'application/json'};
    if(url.includes('/users/'))return route.fulfill({status:200,headers,body:JSON.stringify([{name:'PG-Bot',private:false,owner:{login:'pabloguilherme1121'},html_url:'https://github.com/pabloguilherme1121/PG-Bot',description:'Assistente de jogos',default_branch:'main'}])});
    if(url.endsWith('/readme'))return route.fulfill({status:200,headers:{...headers,'content-type':'text/plain'},body:'# PG Bot\nAjuda baseada em documentação pública.'});
    if(url.includes('/actions/runs'))return route.fulfill({status:200,headers,body:'{"workflow_runs":[]}'});
    if(url.includes('/pulls'))return route.fulfill({status:200,headers,body:'[]'});
    return route.fulfill({status:404,headers,body:'{}'});
  });
  await page.setViewportSize({width:320,height:800});
  await page.goto('ecossistema/');
  await page.evaluate(()=>{
    const script=document.createElement('script');
    script.src='./embed.js';
    script.dataset.project='PG-Bot';
    document.body.append(script);
  });
  const host=page.locator('#pgbot-ecosystem-host');
  await expect(host.locator('.launcher')).toBeVisible();
  await host.locator('.launcher').click();
  await expect(host.locator('.launcher')).toHaveAttribute('aria-expanded','true');
  await expect(host.locator('.close')).toBeFocused();
  const frame=host.frameLocator('iframe');
  await expect(frame.locator('h1')).toContainText('Informações verificáveis');
  await page.evaluate(()=>window.postMessage({type:'pgbot-ecosystem-close',token:'invalido'},location.origin));
  await expect(host.locator('.panel')).toBeVisible();
  await frame.getByRole('button',{name:'Fechar assistente'}).click();
  await expect(host.locator('.panel')).toBeHidden();
  await expect(host.locator('.launcher')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
