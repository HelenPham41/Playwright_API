import { defineConfig } from '@playwright/test';

export default defineConfig({

  timeout: 80000,

  workers: 1,   // ⭐ VERY IMPORTANT

  reporter: [
    ['list']
  ],

  use: {
    trace: 'off'
  }

});