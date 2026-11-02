import { defineConfig,devices } from "@playwright/test";
export default defineConfig({
 testDir:"./e2e",timeout:30_000,expect:{timeout:8_000},
 fullyParallel:true,forbidOnly:!!process.env.CI,retries:0,workers:process.env.CI?2:undefined,
 reporter:process.env.CI?"github":"list",
 use:{baseURL:"http://127.0.0.1:4176/",trace:"retain-on-failure"},
 projects:[
  {name:"mobile-chromium",use:{...devices["Pixel 5"],viewport:{width:320,height:800}}},
  {name:"mobile-webkit",use:{...devices["iPhone 13"],viewport:{width:390,height:844}}}
 ],
 webServer:{command:"node scripts/serve.mjs",url:"http://127.0.0.1:4176/",reuseExistingServer:!process.env.CI,timeout:45_000,env:{PORT:"4176"}}
});