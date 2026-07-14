import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 80000,

  workers: 1,

  repeatEach: parseInt(process.env.RUN_TIMES ?? '1'),

  reporter: [
    ['list'],
    ['html',                                { open: 'never' }],
    ['./reporters/html-summary.reporter.ts'],
  ],

  use: {
    trace: 'retain-on-failure',
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
