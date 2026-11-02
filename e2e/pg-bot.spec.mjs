import {test,expect} from "@playwright/test";
for(const width of [320,390]){
 test("PG Bot abre, responde e mantém layout em "+width+"px",async({page})=>{
  const errors=[];page.on("pageerror",err=>errors.push(err.message));
  await page.setViewportSize({width,height:844});
  await page.goto("./");
  await expect(page.getByRole("heading",{name:/A próxima jogada/i})).toBeVisible();
  await page.getByRole("button",{name:"Como jogar",exact:true}).click();
  await expect(page.locator("#messages")).toContainText("No PG Arcade");
  await page.getByRole("button",{name:/PG Estratégia/}).first().click();
  await expect(page.locator("#context-banner")).toContainText("PG Estratégia");
  await page.locator("#question").fill("São 150 jogos diferentes?");
  await page.getByRole("button",{name:/Enviar/}).click();
  await expect(page.locator("#messages")).toContainText("150 missões");
  await expect(page.locator("#messages")).toContainText("seis sistemas");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test("PG Bot deixa claro quando não conhece o estado real da missão",async({page})=>{
 await page.goto("./?product=estrategia");
 await page.locator("#question").fill("Qual a situação atual da minha partida?");
 await page.locator("#question").press("Enter");
 await expect(page.locator("#messages")).toContainText("Não tenho acesso");
 await expect(page.locator("#messages")).not.toContainText("Turno: 1");
});
test("PG Bot aceita contexto explícito mas não o apresenta como dado ao vivo",async({page})=>{
 await page.goto("./?product=estrategia&mission=Conquista%20territorial%3A%20Aurora&turn=3%2F12&progress=2%2F5");
 await page.locator("#question").fill("Qual a situação atual?");
 await page.locator("#question").press("Enter");
 await expect(page.locator("#messages")).toContainText("Turno: 3/12");
 await expect(page.locator("#messages")).toContainText("não consultados ao vivo");
});
test("limpar conversa apaga mensagens sem recarregar",async({page})=>{
 await page.goto("./");
 await page.locator("#question").fill("Como jogar?");
 await page.locator("#question").press("Enter");
 await expect(page.locator("#messages li")).toHaveCount(3);
 await page.getByRole("button",{name:"Limpar conversa"}).click();
 await expect(page.locator("#messages li")).toHaveCount(1);
 await expect(page.locator("#question")).toBeFocused();
});
