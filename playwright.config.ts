import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  snapshotPathTemplate: 'test-results/__snapshots__/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      // the matrix sets its own viewports
      testIgnore: /dimensions-matrix/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    // Serves the static export (run `yarn build` first)
    command: `npx --yes serve@14 out -l ${PORT} --no-clipboard`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
