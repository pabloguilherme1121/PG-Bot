import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',fullyParallel:true,forbidOnly:!!process.env.CI,retries:0,
 reporter:'list',use:{baseURL:'http://127.0.0.1:56672/PG-Bot/',trace:'retain-on-failure'},
 projects:[
  {name:'chromium',use:{...devices['Desktop Chrome']}},
  {name:'firefox',use:{...devices['Desktop Firefox']}},
  {name:'webkit',use:{...devices['Desktop Safari']}}
 ],
 webServer:{command:'npm run dev',url:'http://127.0.0.1:56672/PG-Bot/',reuseExistingServer:false,timeout:30000,env:{PORT:'56672'}}
});
