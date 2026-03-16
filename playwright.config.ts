import { defineConfig } from '@playwright/test';

export default defineConfig({
   testDir: './tests',

  timeout: 80000,

  workers: 1,   // ⭐ VERY IMPORTANT

  reporter: [
    ['html', { open: 'never' }]
  ],

  // reporter: [
  //   ['list']
  // ],

  use: {
    trace: 'off'
  }
});