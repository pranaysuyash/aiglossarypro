import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    // Test directory
    testDir: '.',
    // Global test timeout
    timeout: 60000,
    // Expect timeout for assertions
    expect: {
        timeout: 10000,
    },
    // Run tests in parallel
    fullyParallel: true,
    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,
    // Retry on CI only
    retries: process.env.CI ? 2 : 0,
    // Opt out of parallel tests on CI
    workers: process.env.CI ? 1 : undefined,
    // Reporter configuration
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results.json' }],
        ['line'],
    ],
    // Global setup and teardown
    use: {
        // Base URL for tests
        baseURL: 'https://d1bnbqox1m8zqp.cloudfront.net',
        // Browser context options
        viewport: { width: 1280, height: 720 },
        // Ignore HTTPS errors (CloudFront should have valid certs)
        ignoreHTTPSErrors: false,
        // Screenshot and video settings
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // Trace collection for debugging
        trace: 'on-first-retry',
        // User agent
        userAgent: 'Playwright-Test-Runner/1.0 (Live Link Testing)',
    },
    // Configure projects for different browsers
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        // Mobile browsers
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
    ],
    // Web server configuration (not needed for live testing)
    // webServer: undefined,
});
