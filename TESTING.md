# Testing plan

> **Status: planned, not implemented.** Written 2026-08-14. There are no tests in this repo and `npm test` is a placeholder that
> always passes. **Do not add tests without being asked** — this document records a decision about _what_ to build, not permission
> to build it.

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

The load-bearing conclusion: **a unit test on `menu.js` would have caught none of them.** Twenty lines with no branching and no
data transformation has nothing worth isolating. Spend the effort where the risk is — rendered geometry and the contents of
`dist/`.

## Assumptions, and when to revisit

This plan is shaped by the site being: **one page, no forms, no user input, no API or data source, one small script, deployed to a
static host.**

If any of those stops being true, the plan needs **rethinking rather than extending**:

- a form → input validation, error states, submission failure paths
- a second page or route → navigation and routing tests
- a data source or API → fixtures, loading and error states, contract tests
- meaningful application logic → unit tests genuinely start to earn their place

## Tiers, in value-per-effort order

Each item is written as an **invariant**, deliberately not as an implementation. `no horizontal scroll at any supported width`
survives a CSS rewrite; `assert .nav-panel left is 0` does not.

### 1. Build-output assertions — start here

A plain Node script over `dist/`. No browser, runs in under a second.

- Every `src` and `href` resolves to a file that exists in `dist/` — catches asset rot and base-path mistakes
- The JSON-LD block parses, and has `@type`, `name`, `url`
- `sitemap.xml` and `favicon.svg` are well-formed XML
- Required meta present: `canonical`, `og:image`, `og:title`, `description`
- Exactly one JS bundle, under ~2 KB — this is the "minimal JavaScript" rule in `CLAUDE.md`, enforced instead of merely written
  down
- Total page weight stays under a stated ceiling

Cheapest possible protection against a broken `base`, which would silently break every asset on the live site while the build
still reports success.

### 2. A small Playwright spec — best coverage of real bugs

One file, roughly eight assertions, mapping directly onto the failures above.

- **No horizontal overflow**: `scrollWidth <= clientWidth` at 320, 390, 768, 1280
- **Header stays put**: scroll down, open the drawer, assert the header's box is still at the top of the viewport and the burger is
  hit-testable — this is `813850d` expressed as a test
- Burger toggles `aria-expanded`; Escape closes it and returns focus; activating a link closes the drawer and navigates
- Wide viewport: links visible, burger hidden
- Both color schemes render (Playwright takes `colorScheme` as a context option)

### 3. Accessibility and Lighthouse floors

`axe-core` through Playwright, plus Lighthouse CI with minimum scores for accessibility, SEO, and performance. For a page whose
entire job is representing someone professionally, a silent contrast or heading-order regression has a real cost. Low maintenance.

### 4. Visual regression — deliberately deferred

Theoretically the right tool for a site that exists to look good, and still the wrong next step. The education section went through
four design iterations in a single day; each would have churned screenshot baselines, and the failure mode is rubber-stamping
diffs, at which point the tests are worse than none.

If it is ever added: scope it to two viewports in one theme, and treat baseline updates as a deliberate reviewed act.

## Separate from the above: a post-deploy smoke test

The riskiest moment is not a code change, it is the deploy. A step after `deploy-pages` that requests the live URL and asserts 200s
on the page, the CSS, the JS, both portraits, `og-image.jpg`, and `sitemap.xml` catches GitHub Pages misconfiguration — which no
local test can. Roughly ten lines of shell.

## Not worth doing

- **Unit tests on `menu.js`** — see above
- **Content assertions** (`the page contains "LSE"`) — content changes are intentional, so these only ever produce false failures
- **Anything reaching linkedin.com or github.com** — flaky, and not this codebase's behavior
- **Coverage percentages** — meaningless for a document

## Where it would run

There is currently no CI. The husky pre-commit hook only formats staged files, and it is bypassable with `--no-verify` or a push
from another machine, so nothing is actually enforced.

Tiers 1 and 2 belong in a `ci.yml` triggered on pull requests and pushes, alongside `prettier --check .` and a build-succeeds gate.
Keep it separate from `deploy.yml`: CI needs no write permissions and should run on every branch, while the deploy holds
`pages: write` and must only ever run on `main`.

## If you only do one thing

Tier 1, plus the two Playwright assertions about horizontal overflow and the sticky header. Around 100 lines, covering every
failure mode this page has actually demonstrated.
