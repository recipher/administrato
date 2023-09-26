import { test, expect } from '@playwright/test';

test.describe('johnny', () => {
  test('is johnny', async ({ page }) => {
    await page.goto('/test');

    await expect(page.getByTestId('username')).toContainText('Johnny');
  });
});
