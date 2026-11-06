# Testing plan

> **Status: Tiers 1–3 and the smoke test are implemented; Tier 4 is deliberately deferred.** Written 2026-08-14, implemented
> 2026-11. `npm run check-dist` runs Tier 1, `npm test` runs the Playwright suite (Tiers 2 and 3), and Lighthouse CI runs as its own
> step in the same `build` job. The post-deploy smoke test runs in the `deploy` job after `actions/deploy-pages@v5`.

## Why this shape

Every bug this site has actually had was geometry, build output, or browser behavior. None was a logic bug.

| What broke                                                     | Where                                  |
| -------------------------------------------------------------- | -------------------------------------- |
| Sticky header flung off-screen when the drawer opened          | `813850d`                              |
| Mobile panel overhung the viewport, causing sideways scrolling | `afb8021`                              |
| Desktop navigation vanished entirely                           | caught in development, never committed |
| A wrong Vite `base` would 404 every asset                      | never shipped, but one line away       |

Read those commits before rewriting this plan; the diffs explain the failures better than prose can, and they stay readable no
matter how much the current code changes.

The load-bearing conclusion: **a unit test would have caught none of them.** The drawer and its script have since been removed, and
the page has no logic left to isolate. Spend the effort where the risk is — rendered geometry and the contents of `dist/`.

## Assumptions, and when to revisit

This plan is shaped by the site being: **one page, no forms, no user input, no API or data source, no scripts, deployed to a
static host.**

If any of those stops being true, the plan needs **rethinking rather than extending**:

- a form → input validation, error states, submission failure paths
- a second page or route → navigation and routing tests
- a data source or API → fixtures, loading and error states, contract tests
- meaningful application logic → unit tests genuinely start to earn their place

## Tiers, in value-per-effort order

Each item is written as an **invariant**, deliberately not as an implementation. `no horizontal scroll at any supported width`
survives a CSS rewrite; `assert nav left is 0` does not.

### 1. Build-output assertions — start here

A plain Node script over `dist/`. No browser, runs in under a second.

- Every `src`, `href`, and `srcset` candidate resolves to a file that exists in `dist/` — catches asset rot and base-path mistakes
- The JSON-LD block parses, and has `@type`, `name`, `url`
- `sitemap.xml` and `favicon.svg` are well-formed XML
- Required meta present: `canonical`, `og:image`, `og:title`, `description`
- No executable JavaScript: no bundle, and in `index.html` and `404.html` no script but the JSON-LD block, no inline event
  handlers, no `javascript:` URLs — this is the "no JavaScript" rule in `CLAUDE.md`, enforced instead of merely written down
- `index.html` stays under a stated ceiling (Lighthouse budgets the total transfer size; see Tier 3)

Cheapest possible protection against a broken `base`, which would silently break every asset on the live site while the build
still reports success. The W3C Nu checker in CI already enforces well-formed HTML on every PR; Tier 1 adds the
asset-resolution, JSON-LD content, and no-JavaScript checks that the validator does not cover.

### 2. A small Playwright spec — best coverage of real bugs

One small file, mapping directly onto the failures above.

- **No horizontal overflow**: `scrollWidth <= clientWidth` at 320, 390, 768, 1280
- **Header stays put**: scroll down, assert the header's box is still at the top of the viewport and its links are hit-testable
- Every nav link is fully visible at 360 and wider
- **Anchor scroll offset**: click each nav link; the target section heading is fully below the sticky header, not occluded by it
- **Work entries keep their content**: open each work-history entry at 320 px; nothing in its expanded content extends past the
  entry's edges. Entries clip their content for the open/close animation, so page-level overflow can't see this
- **Reduced motion**: with `reducedMotion: 'reduce'`, at 320 and 1280 px no text is left invisible (opacity 0 or
  `visibility: hidden` on it or an ancestor) and nothing overflows — resting states look complete without any animation
  running. Playwright's `toBeVisible()` counts opacity 0 as visible, so the check reads computed visibility instead
- **Print**: every work entry prints expanded, and no text is left invisible

### 3. Accessibility and Lighthouse floors

`axe-core` through Playwright, plus Lighthouse CI. For a page whose entire job is representing someone professionally, a silent
contrast or heading-order regression has a real cost. Low maintenance.

- **axe** runs at 320 and 1280 px with each work entry open, the coverage of the manual review in `ACCESSIBILITY.md`. It allows only
  the reviewed exceptions recorded there, each limited to one rule and the elements it names. axe only flags focusable content
  inside `aria-hidden` for manual review, so a separate test asserts there is none.
- **Lighthouse** gates SEO and best practices at a score of 1 and total transfer size at 200 KB. It does not gate accessibility,
  which the axe tests cover more strictly, or the performance score, which is too noisy across single CI runs to threshold.

### 4. Visual regression — deliberately deferred

Theoretically the right tool for a site that exists to look good, and still the wrong next step. The education section went through
four design iterations in a single day; each would have churned screenshot baselines, and the failure mode is rubber-stamping
diffs, at which point the tests are worse than none.

If it is ever added: scope it to two viewports in one theme, and treat baseline updates as a deliberate reviewed act.

## Separate from the above: a post-deploy smoke test

The riskiest moment is not a code change, it is the deploy. A step after `deploy-pages` that requests the live URL and asserts 200s
on the page, the font, both portraits, `og-image.jpg`, and `sitemap.xml` catches GitHub Pages misconfiguration — which no
local test can. Roughly ten lines of shell.

## Not worth doing

- **Unit tests** — see above
- **Content assertions** (`the page contains "LSE"`) — content changes are intentional, so these only ever produce false failures
- **Anything reaching linkedin.com or github.com** — flaky, and not this codebase's behavior
- **Coverage percentages** — meaningless for a document

## Where it runs

CI lives in `.github/workflows/deploy.yml`. It runs on every PR and push to `main`, and its `build` job is the required check that
gates deploys: after the build it runs the W3C Nu HTML checker, Tier 1, the Playwright suite, and Lighthouse CI, and any failure
blocks both the merge and the deploy. The husky pre-commit hook formats staged files; it is bypassable, so nothing beyond
formatting is enforced locally.

Everything stays in this one workflow, so the PR check and the deploy gate can't drift apart.

## If you only do one thing

Tier 1, plus the two Playwright assertions about horizontal overflow and the sticky header. Around 100 lines, covering every
failure mode this page has actually demonstrated.
