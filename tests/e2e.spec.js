import { expect, test } from '@playwright/test';

const OVERFLOW_WIDTHS = [320, 390, 768, 1280];
const NAV_HREFS = ['#about', '#expertise', '#work', '#education', '#contact'];

// ── Tier 2: geometry invariants ──────────────────────────────────────────────

for (const width of OVERFLOW_WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow, `scrollWidth > clientWidth at ${width}px`).toBe(false);
    });
}

test('sticky header stays at top after scrolling', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(100);
    const header = page.locator('header').first();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    // Sticky: must stay near the top of the viewport even mid-page.
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeLessThanOrEqual(20);
    // All nav links must still be hit-testable.
    for (const link of await header.locator('nav a').all()) {
        await expect(link).toBeVisible();
    }
});

test('all nav links fully visible at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    for (const href of NAV_HREFS) {
        const link = page.locator(`header nav a[href="${href}"]`);
        await expect(link).toBeVisible();
        const box = await link.boundingBox();
        // Link must be fully inside the viewport width.
        expect(box.x, `${href} link starts off-screen`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${href} link overflows viewport`).toBeLessThanOrEqual(360 + 1);
    }
});
