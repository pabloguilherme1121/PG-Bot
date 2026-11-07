import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('auditoria WCAG do módulo em 320 px',async({page})=>{
  await page.setViewportSize({width:320,height:800});
  await page.route('https://api.github.com/**',async(route)=>{
    const url=route.request().url();
    const headers={'access-control-allow-origin':'*','content-type':'application/json'};
    if(url.includes('/users/'))return route.fulfill({status:200,headers,body:JSON.stringify([{name:'PG-Bot',private:false,owner:{login:'pabloguilherme1121'},html_url:'https://github.com/pabloguilherme1121/PG-Bot',description:'Assistente local',default_branch:'main'}])});
    if(url.endsWith('/readme'))return route.fulfill({status:200,headers:{...headers,'content-type':'text/plain'},body:'# PG Bot\nAssistente de jogos'});
    if(url.includes('/actions/runs'))return route.fulfill({status:200,headers,body:JSON.stringify({workflow_runs:[]})});
    if(url.includes('/pulls'))return route.fulfill({status:200,headers,body:'[]'});
    return route.fulfill({status:404,headers,body:'{}'});
  });
  await page.goto('ecossistema/');
  await expect(page.locator('#detail-heading')).toHaveText('PG-Bot');
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(scan.violations.map(v=>({id:v.id,impact:v.impact}))).toEqual([]);
});
