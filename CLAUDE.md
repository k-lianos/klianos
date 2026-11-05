# klianos

Konstantinos Lianos' personal site — a single page about him. Vite and Tailwind CSS, no JS framework. `index.html` at the repo root
is the entry point and the only page; `styles.css` sits next to it and is the only stylesheet.

## Tailwind

Tailwind v4 runs through `@tailwindcss/vite`, imported at the top of `styles.css`. The site's existing styles are hand-written, and
the setup keeps them rendering unchanged:

- **Unlayered rules beat utilities.** Utilities live in `@layer utilities`, and the hand-written rules are unlayered, so they win
  regardless of specificity. A utility has no effect on a property an existing rule already sets on that element: move or delete
  that declaration when converting an element to utilities.
- **Preflight is off.** The hand-written rules depend on browser defaults it would reset. Turning it on is a whole-page visual
  change, to be checked in the browser.
- **Only `index.html` is scanned for classes** (`@source`). Add an `@source` line for any new file that contains classes.
- **`.container` is both a site class and a Tailwind utility.** Tailwind emits its version because `index.html` uses the name, and
  the site's unlayered rule overrides it.

## Hard constraint: keep JavaScript minimal

JavaScript is allowed but strictly rationed. Solve layout, theming, and state-driven styling in CSS; reach for JS only when CSS
genuinely cannot do the job, and say so when you do.

Today the entire budget is `menu.js` — roughly twenty lines that toggle `aria-expanded` on the burger button and a `.nav-open`
class on `<html>`. Every transition, transform, and layout change hangs off that class in `styles.css`. Keep it that way: JS flips
state, CSS owns appearance.

The other `<script>` is the `application/ld+json` block in `index.html`, which is inert data, not code.

```sh
npm run build && ls dist/assets/*.js   # expect exactly one small bundle
```

## Commands

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Dev server with HMR at http://localhost:5173/ |
| `npm run build`        | Production build to `dist/`                   |
| `npm run preview`      | Serve the built `dist/` locally               |
| `npm run format`       | Prettier over the whole repo                  |
| `npm run format:check` | Verify formatting without writing             |

`npm test` is a placeholder that always passes — there are no tests yet. `TESTING.md` records the agreed plan for adding them
(what to build, and what to skip). It is future work: read it if asked about testing, but **don't implement it unprompted.**

## Deployment

Live at https://klianos.com/, custom-domained onto GitHub Pages (the project still lives at
https://k-lianos.github.io/klianos/, which now redirects). Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds
and uploads `dist/` as a Pages artifact — there is no `gh-pages` branch.

The site is served from the domain root, so `vite.config.js` sets no `base` path; it exists only to load the Tailwind plugin. `public/CNAME`
(containing `klianos.com`) is what makes GitHub Pages honor the custom domain; because deploys go through the Actions artifact
workflow rather than a branch GitHub manages itself, that file has to ship in every build, which is why it lives in `public/`
alongside the other verbatim-copied assets rather than being set only via the repo's Pages dashboard setting.

DNS is on GoDaddy (registrar and nameservers both — nothing moved to Cloudflare): four `A` records and four `AAAA` records on `@`
point at GitHub Pages' IPs, and `www` is a `CNAME` to `k-lianos.github.io`. GoDaddy's own email (`mx` records,
`email.secureserver.net` CNAME) shares this zone — **don't touch those** when editing DNS here.

## Layout

- `index.html`, `styles.css` — the site. `styles.css` is linked as `./styles.css` so Vite processes and hashes it.
- `menu.js` — the mobile drawer toggle, the only script. Linked as `./menu.js` so Vite bundles it.
- `public/profile-400.jpg`, `public/profile-800.jpg` — the portrait, served via `srcset`. Vite copies `public/` verbatim, so
  these keep stable URLs.
- `public/og-image.jpg` — 1200×630 social preview card. Generated, not hand-drawn; see below.
- `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png` — the KL monogram. The SVG is the source; the raster ones are
  derived from it.
- `public/llms.txt`, `robots.txt`, `sitemap.xml` — machine-readable descriptions of the site.
- `public/404.html` — standalone error page. It lives in `public/`, so Vite never rewrites a hashed stylesheet link into it; its
  CSS is inlined and its homepage link is hardcoded to `/` for the same reason.
- `public/CNAME` — one line, `klianos.com`. See Deployment above.

**Absolute URLs are hardcoded in three places** and must be updated together if the site moves: the `og:*`/`twitter:*`/`canonical`
tags in `index.html` (Vite does not rewrite `content` attributes), the JSON-LD block, and `robots.txt`/`sitemap.xml`/`llms.txt`.
They currently all point at `https://klianos.com/`.

To regenerate the portrait after replacing it, from a full-size original at `<source>`:

```sh
convert <source> -auto-orient -strip -resize 400x -quality 82 -interlace Plane public/profile-400.jpg
convert <source> -auto-orient -strip -resize 800x -quality 80 -interlace Plane public/profile-800.jpg
```

`-strip` matters: it drops EXIF so no camera or GPS metadata is published.

The social card and icons are generated too. Measure text before sizing it — guessing overflows the portrait panel:

```sh
convert -font /usr/share/fonts/opentype/fira/FiraSans-Bold.otf -pointsize 66 label:'Konstantinos Lianos' -format '%w' info:
inkscape public/favicon.svg -w 512 -h 512 -o /tmp/fav512.png   # then resize into favicon.ico / apple-touch-icon.png
```

## Site content

The page content was written from the owner's CV (a LinkedIn profile export) and his headshot. **Neither is in the repo any
more** — they lived in `docs/` and were removed once the content was written. Ask him for them if you need to check a career
detail; do not invent or paraphrase work history from elsewhere.

The two files are still reachable in git history at `590b649` (`docs/Profile.pdf`, `docs/profile.jpg`) if you need to consult
them.

### Deliberate departures from the CV

The site does not reproduce the CV verbatim. These choices were made with the owner and should not be silently "corrected" back
if you go digging for the source:

- **Angular 6 → 21.** The CV contradicts itself: the summary says "Angular 6 to 14", the TRASYS entry says "6 to 21". The site
  uses 21. The CV itself still needs fixing.
- **No contractor pitch.** The CV is written as a freelance availability pitch, but the owner has been at Vimachem full-time
  since March 2026. The site uses a neutral "Let's talk" CTA and omits the "Flexibility & Efficiency" offering.
- **Omitted from Education:** 4th General Lyceum of Chalandri (high school, superseded by the MSc) and the Ministry of
  Agricultural Development "CERT Meat Technician" (off-topic for a software site).
- **"BSc" for Liverpool** is an inference — the CV lists no degree type.
- **Contact is the gmail address** from the CV, not the vimachem.com work address.
- **Location reads "Vouliagmeni"**, not the CV's "Voúla" — corrected by the owner.

## Header and drawer gotchas

Two constraints trapped earlier attempts at the mobile menu. Both are verified, not guessed:

- **The header cannot host a `position: fixed` child.** `.site-header` has `backdrop-filter`, which makes it the containing block
  for fixed descendants — a fixed panel gets clamped to the header's box. And `position: sticky` makes it a stacking context, so
  no descendant can paint _behind_ its background either. The drawer therefore grows `max-height` from 0 with `overflow: hidden`,
  unfurling downward from the header's edge and never overlapping it.
- **The drawer's `left`/`right` must be `0`, not `-1.25rem`.** Absolute offsets resolve against the containing block's _padding_
  box, which already contains `.container`'s inline padding. Negative values overhang the viewport and cause sideways scrolling.

## Conventions

- Prettier owns all formatting: 4-space indent, 140 columns, single quotes, semicolons. Config in `.prettierrc`; don't
  hand-format against it.
- A husky pre-commit hook runs `lint-staged`, which formats staged files automatically. Let it — no need to run `format` before
  committing.
- Verify visual changes in a real browser, not by reading the CSS. `npm run preview`, then screenshot with
  `google-chrome --headless --no-sandbox --hide-scrollbars --window-size=1280,7000 --screenshot=out.png http://localhost:4173/`.
  Add `--blink-settings=preferredColorScheme=1` to force light mode — headless Chrome defaults to dark here, so both need
  checking.
