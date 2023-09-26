import { test, expect } from '@playwright/test';

test.describe('guest', () => {
  test('is guest', async ({ page }) => {
    await page.goto('/test');

    await expect(page.getByTestId('username')).toContainText('Guest');
  });
});
