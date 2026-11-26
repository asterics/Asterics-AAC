
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    
    reporter: 'html',
    workers: 1,

    use: {
        baseURL: 'http://localhost:9095',
        headless: true
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] }
        }
    ],

    webServer: {
        command: 'yarn start',
        url: 'http://localhost:9095',
        reuseExistingServer: !process.env.CI,
        timeout: 120000
    }
});
