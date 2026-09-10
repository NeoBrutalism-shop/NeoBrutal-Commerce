import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests',
  // The accumulated v1.1 component-depth audit expands 43 evidence panels before a full Axe A/AA scan.
  // WebKit crossed the previous 35s ceiling during Axe cleanup with zero accessibility violations.
  timeout:45_000,
  expect:{timeout:5_000},
  fullyParallel:true,
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
  webServer:{command:'python3 -m http.server 4173',port:4173,reuseExistingServer:true},
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile-chromium',use:{...devices['Pixel 7']}},
    {name:'firefox',use:{...devices['Desktop Firefox']}},
    {name:'webkit',use:{...devices['Desktop Safari']}}
  ]
});
