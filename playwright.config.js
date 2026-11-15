import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 120000,
  workers: 1,
  use: { channel: 'msedge', baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 }, headless: true },
  webServer: { command: 'npm.cmd run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
