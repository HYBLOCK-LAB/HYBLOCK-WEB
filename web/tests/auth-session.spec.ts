import { expect, test } from '@playwright/test';

// Use Chromium's current headless mode with the standard Chromium installation.
test.use({ channel: 'chromium' });

const address = '0x1111111111111111111111111111111111111111';

test('restores server login and logs out through the server endpoint', async ({ page }) => {
  let loggedIn = true;
  let logoutCalls = 0;
  await page.route('**/api/auth/wallet/session', (route) => route.fulfill({ json: {
    session: loggedIn ? { address, memberId: 1, expiresAt: Date.now() + 60000 } : null,
  } }));
  await page.route('**/api/auth/wallet/logout', (route) => {
    logoutCalls++;
    loggedIn = false;
    return route.fulfill({ json: { success: true } });
  });
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page.locator('header').getByRole('link', { name: '로그인', exact: true })).toBeVisible();
  expect(logoutCalls).toBe(1);
});

test('failed server logout keeps the session visible and offers an error', async ({ page }) => {
  await page.route('**/api/auth/wallet/session', (route) => route.fulfill({ json: {
    session: { address, memberId: 1, expiresAt: Date.now() + 60000 },
  } }));
  await page.route('**/api/auth/wallet/logout', (route) => route.fulfill({ status: 500, json: { error: 'failed' } }));
  await page.goto('/login');
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: '로그아웃 처리에 실패했습니다' })).toBeVisible();
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeEnabled();
});

test('session expiry updates the header without navigation', async ({ page }) => {
  const expiresAt = Date.now() + 5000;
  await page.route('**/api/auth/wallet/session', (route) => route.fulfill({ json: {
    session: Date.now() < expiresAt ? { address, memberId: 1, expiresAt } : null,
  } }));
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: '로그인', exact: true })).toBeVisible({ timeout: 10000 });
});

test('logout from another tab refreshes authenticated state', async ({ page }) => {
  let loggedIn = true;
  await page.route('**/api/auth/wallet/session', (route) => route.fulfill({ json: {
    session: loggedIn ? { address, memberId: 1, expiresAt: Date.now() + 60000 } : null,
  } }));
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeVisible();
  loggedIn = false;
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', {
    key: 'hyblock_session_changed', newValue: 'logout',
  })));
  await expect(page.locator('header').getByRole('link', { name: '로그인', exact: true })).toBeVisible();
});
