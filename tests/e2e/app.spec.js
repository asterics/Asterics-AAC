const { test, expect } = require('@playwright/test');

test('Asterics AAC application opens successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Asterics AAC');
});