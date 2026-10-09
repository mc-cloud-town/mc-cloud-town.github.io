import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * The other engines are run on request only: `--project=webkit`, `--project=firefox`. A run that names no
 * project is Chromium's two (desktop and mobile), as it always was. The request is read from the command line
 * and kept in the environment, which is what the workers of this run see.
 */
const ENGINES = ['webkit', 'firefox'] as const;
const requested = (name: string) => {
  const key = `PW_ENGINE_${name.toUpperCase()}`;
  if (
    process.argv.some(
      (arg, i, all) =>
        arg === `--project=${name}` ||
        (arg === '--project' && all[i + 1] === name),
    )
  )
    process.env[key] = '1';
  return process.env[key] === '1';
};
/** What an engine's project runs: the specs of the new shell without the matrix, or nothing if it was not asked for. */
const ENGINE_SPECS =
  /dimensions-(shell|overlay|pages|members|progress|home)\.spec\.ts$/;

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
    ...ENGINES.map((name) => ({
      name,
      testMatch: requested(name) ? ENGINE_SPECS : /^$/,
      use: {
        ...devices[name === 'webkit' ? 'Desktop Safari' : 'Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    })),
  ],
  webServer: {
    // Serves the static export (run `yarn build` first)
    command: `npx --yes serve@14 out -l ${PORT} --no-clipboard`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
