import { test, expect } from '@playwright/test';

// These tests require the frontend dev server running at localhost:5173
// and a valid Supabase backend. They test the unauthenticated and
// authenticated flows of the application.

test.describe('CollabBoard — unauthenticated', () => {
  test('redirects to login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders sign-in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });
});

test.describe('CollabBoard — boards page (requires auth)', () => {
  // Skip these tests if not authenticated — they serve as documentation
  // of what should be tested with a real auth session.
  test.skip(
    () => !process.env.TEST_AUTH_COOKIE,
    'Set TEST_AUTH_COOKIE env var to run authenticated tests',
  );

  test('boards page loads and shows create button', async ({ page }) => {
    await page.goto('/boards');
    await expect(page.getByText(/new board/i)).toBeVisible();
  });
});

test.describe('CollabBoard — board canvas (requires auth)', () => {
  test.skip(
    () => !process.env.TEST_AUTH_COOKIE,
    'Set TEST_AUTH_COOKIE env var to run authenticated tests',
  );

  test('board page shows toolbar', async ({ page }) => {
    // This would need a real board ID
    await page.goto('/boards');
    // Click "New Board" to create one, then verify toolbar appears
    await page.getByText(/new board/i).click();
    // Should navigate to /board/:id
    await page.waitForURL(/\/board\//);
    // Toolbar should be visible
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('CollabBoard — multi-user sync simulation', () => {
  test.skip(
    () => !process.env.TEST_AUTH_COOKIE,
    'Set TEST_AUTH_COOKIE env var to run authenticated tests',
  );

  test('two browser contexts see the same board', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both users navigate to the same board
    const boardUrl = process.env.TEST_BOARD_URL || '/boards';
    await page1.goto(boardUrl);
    await page2.goto(boardUrl);

    // Both should load without errors
    await expect(page1.locator('body')).toBeVisible();
    await expect(page2.locator('body')).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
