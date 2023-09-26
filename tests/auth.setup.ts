import { test as setup, expect } from '@playwright/test';

const users = new Map<string, string>([
  [ "johnny", "durang0" ],
  [ "guest", "password" ],
]);

for (const user of users.keys()) {
  setup(`authenticate ${user}`, async ({ page }) => {
    await page.goto('/');

    const password = users.get(user) as string;

    await page.locator('#username').fill(`${user}@recipher.co.uk`);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();
    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('/start');
    await expect(page.getByTestId('username')).toContainText(user, { ignoreCase: true });

    // End of authentication steps.
    await page.context().storageState({ path: `playwright/.auth/${user}.json` });
  });
};