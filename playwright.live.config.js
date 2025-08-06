import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: './tests/playwright',
    testMatch: ['**/*.ts', '**/*.js'],
    timeout: 60000,
    expect: { timeout: 10000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: 'playwright-report-live' }],
        ['line'],
    ],
    use: {
        baseURL: 'https://d1bnbqox1m8zqp.cloudfront.net',
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: false,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // No webServer needed for live testing
});
