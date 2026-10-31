import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  fullyParallel: false,
  timeout: 40_000,
  reporter: 'list',
  use: {
    baseURL: process.env.WORKSHOP_URL || 'http://localhost:3181',
    channel: 'chrome',
    viewport: { width: 1512, height: 1050 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
