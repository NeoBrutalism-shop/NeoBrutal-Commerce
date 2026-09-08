import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests',
  timeout:30_000,
  expect:{timeout:5_000},
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  webServer:{command:'python3 -m http.server 4173',port:4173,reuseExistingServer:true},
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile-chromium',use:{...devices['Pixel 7']}},
    {name:'firefox',use:{...devices['Desktop Firefox']}}
  ]
});
