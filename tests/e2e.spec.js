import AxeBuilder from '@axe-core/playwright';
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

// ── New invariants identified during the 2026-11 review ──────────────────────

test('anchor scroll offset: section headings clear the sticky header', async ({ page }) => {
    await page.goto('/');

    // The header is sticky; its bottom edge is constant regardless of scroll position.
    const headerBottom = await page.evaluate(() => document.querySelector('header').getBoundingClientRect().bottom);

    for (const href of NAV_HREFS) {
        await page.click(`header nav a[href="${href}"]`);
        // Wait for smooth-scroll to settle (scroll-smooth is on <html>).
        await page.waitForTimeout(600);
        const id = href.slice(1);
        const sectionTop = await page.evaluate(id => document.getElementById(id).getBoundingClientRect().top, id);
        expect(sectionTop, `#${id} should start at or below the sticky header (bottom: ${headerBottom}px)`).toBeGreaterThanOrEqual(
            headerBottom - 5,
        );
    }
});

test('<details> accordion does not cause overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');

    // The work section uses native <details> for each job entry.
    const details = page.locator('#work details');
    const count = await details.count();

    for (let i = 0; i < count; i++) {
        const item = details.nth(i);
        const isOpen = await item.evaluate(el => el.open);
        if (!isOpen) await item.locator('summary').click();
        // Wait a frame for the browser to render the expanded content.
        await page.waitForTimeout(50);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow, `overflow after opening <details> ${i + 1} of ${count}`).toBe(false);
    }
});

test('reduced motion: content visible, no overflow', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');

    // Elements that animate in (animate-rise) must be visible at their resting state.
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('header nav')).toBeVisible();

    // No overflow at the two extreme widths under reduced motion.
    for (const width of [320, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow, `overflow under reduced motion at ${width}px`).toBe(false);
    }

    await ctx.close();
});

// ── Tier 3: accessibility ─────────────────────────────────────────────────────

// The reviewed exceptions in ACCESSIBILITY.md, each limited to one rule and the elements it names.
const WATERMARKS = '#education span[aria-hidden="true"].select-none';
const DISCLOSURE_SUMMARIES = '#work summary';
const FOCUSABLE =
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])';

async function axeViolations(page, scope) {
    const scan = () => (scope ? new AxeBuilder({ page }).include(scope) : new AxeBuilder({ page }));
    const scans = [
        scan().disableRules(['color-contrast', 'label-content-name-mismatch']),
        scan().withRules(['color-contrast']).exclude(WATERMARKS),
        scan().withRules(['label-content-name-mismatch']).exclude(DISCLOSURE_SUMMARIES),
    ];
    const violations = [];
    for (const builder of scans) violations.push(...(await builder.analyze()).violations);
    return violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
}

test.describe('accessibility', () => {
    // Elements rest at their final colors, so contrast is measured after the fade-in, not during it.
    test.use({ reducedMotion: 'reduce' });

    for (const width of [320, 1280]) {
        test(`no axe violations at ${width}px with each work entry open`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            await page.goto('/');
            expect(await axeViolations(page), 'whole page').toEqual([]);

            const entries = page.locator('#work details');
            for (let i = 0; i < (await entries.count()); i++) {
                const entry = entries.nth(i);
                if (!(await entry.evaluate(el => el.open))) await entry.locator('summary').click();
                await expect(entry).toHaveJSProperty('open', true);
                expect(await axeViolations(page, '#work details[open]'), `work entry ${i + 1}`).toEqual([]);
            }
        });
    }

    // axe only marks this for manual review, which the scans above do not fail on.
    test('nothing inside aria-hidden is focusable', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator(`[aria-hidden="true"] :is(${FOCUSABLE}), [aria-hidden="true"]:is(${FOCUSABLE})`)).toHaveCount(0);
    });
});
