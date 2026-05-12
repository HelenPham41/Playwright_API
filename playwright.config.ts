import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 80000,

  workers: 1,

  reporter: [
    ['html', { open: 'never' }]
  ],

  use: {
    trace: 'off'
  },

  projects: [
    {
      name: 'VN',
      testMatch: /^(?!.*\.(th|kh)\.spec\.ts).*\.spec\.ts$/,
    },
    {
      name: 'TH',
      testMatch: /.*\.th\.spec\.ts$/,
    },
    // {
    //   name: 'KH',
    //   testMatch: /.*\.kh\.spec\.ts$/,
    // },
  ],
});
