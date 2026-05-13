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
    },
    {
      name: 'TH',
    },
    // {
    //   name: 'KH',
    // },
  ],
});
