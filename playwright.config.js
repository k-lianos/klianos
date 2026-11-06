import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // The page is static and deterministic, so a retry would only hide a flaky test.
    retries: 0,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        // CI tests the dist/ it has already built and validated. Locally, build first so a stale dist/ is never tested.
        command: process.env.CI ? 'npm run preview' : 'npm run build && npm run preview',
        url: 'http://localhost:4173',
        // Fail if something else already serves the port, instead of testing whatever it serves.
        reuseExistingServer: false,
    },
});
