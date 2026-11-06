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

test('open work entries keep their content inside the entry at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');

    // Each entry clips its expanded content for the open/close animation, so content that is too wide is cut off instead of
    // scrolling the page. Page overflow can't see that; compare each element's edges with the entry's.
    const entries = page.locator('#work details');
    for (let i = 0; i < (await entries.count()); i++) {
        const entry = entries.nth(i);
        if (!(await entry.evaluate(el => el.open))) await entry.locator('summary').click();
        await expect(entry).toHaveJSProperty('open', true);
        const cutOff = await entry.evaluate(el => {
            const box = el.getBoundingClientRect();
            return [...el.querySelectorAll(':scope > :not(summary), :scope > :not(summary) *')]
                .filter(child => {
                    const r = child.getBoundingClientRect();
                    return child.checkVisibility() && (r.left < box.left - 1 || r.right > box.right + 1);
                })
                .map(child => `<${child.tagName.toLowerCase()}> ${child.textContent.trim().slice(0, 40)}`);
        });
        expect(cutOff, `content cut off in work entry ${i + 1}`).toEqual([]);
    }
});

// Text that is laid out but can't be seen, because it or an ancestor has opacity 0 or visibility: hidden. Playwright's
// toBeVisible() counts opacity 0 as visible, so it can't catch a resting state that only an animation would have revealed.
function invisibleText(page) {
    return page.evaluate(() =>
        [...document.body.querySelectorAll('*')]
            .filter(el => [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
            .filter(el => el.checkVisibility() && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
            .filter(el => !el.closest('[aria-hidden="true"]'))
            .map(el => `<${el.tagName.toLowerCase()}> ${el.textContent.trim().slice(0, 40)}`),
    );
}

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    for (const width of [320, 1280]) {
        test(`no text left invisible and no overflow at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            await page.goto('/');
            expect(await invisibleText(page)).toEqual([]);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
            expect(overflow, `scrollWidth > clientWidth at ${width}px`).toBe(false);
        });
    }
});

test('print: every work entry expanded and no text left invisible', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await page.goto('/');
    expect(await invisibleText(page)).toEqual([]);

    // A collapsed entry either skips rendering its content or clips it to zero height, so the content sticks out of the entry.
    const collapsed = await page.locator('#work details').evaluateAll(entries =>
        entries
            .map((entry, i) => ({
                i,
                box: entry.getBoundingClientRect(),
                content: [...entry.children].filter(c => c.tagName !== 'SUMMARY'),
            }))
            .filter(({ box, content }) => content.some(c => !c.checkVisibility() || c.getBoundingClientRect().bottom > box.bottom + 1))
            .map(({ i }) => `work entry ${i + 1}`),
    );
    expect(collapsed).toEqual([]);
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
