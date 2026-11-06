# klianos

Konstantinos Lianos' personal site — a single page about him. Vite and Tailwind CSS, no JS framework. `index.html` at the repo root
is the entry point and the only page. Styles use utility classes in `index.html`; `styles.css` contains the Tailwind imports,
source configuration, theme tokens, and keyframes. No executable JavaScript ships.

## Tailwind

Tailwind v4 runs through `@tailwindcss/vite`. Its entry point is `styles.css`, linked from the `<head>` of `index.html`.
Vite compiles it into a separate, content-hashed stylesheet in `dist/assets/`:

- **Style with utility classes on the element.** `styles.css` holds only the imports, `@source`, and `@theme`. The site is dark only, so there are no `dark:` variants. `@theme` sets
  the font, the animations, and the charcoal and teal palette as tokens (`canvas`, `surface`, `elevated`, `accent`, `accent-hover`,
  `ink`, `muted`, `line`, `keyword`, `string`). Use those tokens for color, not Tailwind's default palette.
- **Animation is CSS only and must stop cleanly.** `<body>` turns off every animation under `motion-reduce:` and `print:`, so each
  element's resting state has to look right with no animation running; hide anything that doesn't (`motion-reduce:hidden`). Gate
  scroll-linked animation behind `supports-[animation-timeline:...]:`, since not every browser has scroll timelines.
- **Only `index.html` is scanned for classes** (`source(none)` plus `@source`), so words in the Markdown docs don't generate CSS.
  Add an `@source` line for any new file that contains classes.
- **Check print output after changing colors.** `<body>` forces black text and clears surface backgrounds with `print:**:text-black!` and `print:**:bg-transparent!`.

## Hard constraint: no JavaScript

The page ships no JavaScript and the budget is zero. Solve layout, theming, and state-driven styling with Tailwind. If CSS genuinely
cannot do the job, say so and ask before adding a script. The navigation stays a plain row of links for this reason.

The `<script>` in `index.html` is the `application/ld+json` block, which is inert data, not code.

```sh
npm run build && npm run check-dist   # fails on a JS bundle, any other <script>, an inline handler, or a javascript: URL
```

## Commands

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Dev server with HMR at http://localhost:5173/ |
| `npm run build`        | Production build to `dist/`                   |
| `npm run preview`      | Serve the built `dist/` locally               |
| `npm run format`       | Prettier over the whole repo                  |
| `npm run format:check` | Verify formatting without writing             |
| `npm run check-dist`   | Tier 1 assertions over the built `dist/`      |
| `npm test`             | Playwright suite: layout invariants and axe   |

`npm test` builds the site and serves it with `npm run preview` (in CI it tests the build already validated), and it fails if
something else holds port 4173. `TESTING.md` explains what each tier covers and
what is deliberately left out; read it before adding or changing tests. `ACCESSIBILITY.md` records the accessibility review and its
reviewed exceptions — read it before changing markup to satisfy an accessibility checker, since some findings were kept on purpose.

## Deployment

Live at https://klianos.com/, custom-domained onto GitHub Pages (the project still lives at
https://k-lianos.github.io/klianos/, which now redirects). Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds
the site, checks it (the W3C Nu checker, `check-dist`, the Playwright suite, and Lighthouse CI, each a separate step, so any failure
blocks the deploy), and uploads `dist/` as a Pages artifact — there is no `gh-pages` branch. After deploying, a smoke test requests
the live site and its assets. `vnu.jar` needs Java 17+; the workflow installs it with `setup-java`, and `.sdkmanrc` pins it locally (`sdk env`). To run the check locally, `npm run build`, then copy the `java -jar ... vnu.jar` command from the
"Validate HTML" step in the workflow.

Pull requests into `main` run the same workflow's `build` job (the build plus every check) but skip the Pages steps and the `deploy`
job. The `build` job is the required status check on `main`, so a failing build or check blocks the merge. Keep it in this one
workflow rather than a separate CI file, so the PR check and the deploy gate can't drift apart.

The site is served from the domain root, so `vite.config.mjs` sets no `base` path; it exists only to load the Tailwind plugin. `public/CNAME`
(containing `klianos.com`) is what makes GitHub Pages honor the custom domain; because deploys go through the Actions artifact
workflow rather than a branch GitHub manages itself, that file has to ship in every build, which is why it lives in `public/`
alongside the other verbatim-copied assets rather than being set only via the repo's Pages dashboard setting.

DNS is on GoDaddy (registrar and nameservers both — nothing moved to Cloudflare): four `A` records and four `AAAA` records on `@`
point at GitHub Pages' IPs, and `www` is a `CNAME` to `k-lianos.github.io`. GoDaddy's own email (`mx` records,
`email.secureserver.net` CNAME) shares this zone — **don't touch those** when editing DNS here.

## Layout

- `index.html` — the whole site, markup and utility classes.
- `styles.css` — Tailwind imports, source configuration, theme tokens, and keyframes; compiled into an external stylesheet.
- `@fontsource-variable/commissioner` — the self-hosted typeface, imported in `styles.css`. Vite hashes the font files into
  `dist/assets/`, so the page makes no third-party font requests.
- `images/` — images the page references. Vite puts a content hash in each filename at build, so a changed image gets a new URL
  and browsers can't show a stale copy. Files under 4 KB (`edu-lse.png`) are inlined into the HTML instead. New page images go here,
  referenced as `/images/<name>`.
- `public/` — files that need a stable URL, copied verbatim with no hash. Only put a file here if something outside the page's
  markup asks for it by name.
- `public/profile-800.jpg` — stable copy of `images/profile-800.jpg` for the JSON-LD `image`, which Vite doesn't rewrite. Update both.
- `public/og-image.jpg` — 1200×630 social preview card. Generated, not hand-drawn; see below.
- `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — the
  "Code K" mark: a vertical stem plus an angle bracket, read as `|<`. `favicon.svg` is the source; the raster ones are derived from it.
  The glyph has three other copies: the header logo in `index.html` (inline, inked with `currentColor`), the square source in the
  regeneration commands below, and the logo on `og-image.jpg`. Change all four together.
- `public/site.webmanifest` — web app manifest, linked from `index.html`. Lists `icon-192.png` and `icon-512.png` (purpose `any`)
  and `icon-maskable-512.png` (purpose `maskable`).
- `public/llms.txt`, `robots.txt`, `sitemap.xml` — machine-readable descriptions of the site.
- `public/404.html` — standalone error page. It lives in `public/`, so Vite never rewrites a hashed stylesheet link into it; its
  CSS is inlined and its homepage link is hardcoded to `/` for the same reason.
- `public/CNAME` — one line, `klianos.com`. See Deployment above.

**Absolute URLs are hardcoded in three places** and must be updated together if the site moves: the `og:*`/`twitter:*`/`canonical`
tags in `index.html` (Vite does not rewrite `content` attributes), the JSON-LD block, and `robots.txt`/`sitemap.xml`/`llms.txt`.
They currently all point at `https://klianos.com/`.

To regenerate the portrait after replacing it, from a full-size original at `<source>`:

```sh
convert <source> -auto-orient -strip -resize 400x -quality 82 -interlace Plane images/profile-400.jpg
convert <source> -auto-orient -strip -resize 800x -quality 80 -interlace Plane images/profile-800.jpg
cp images/profile-800.jpg public/profile-800.jpg
```

`-strip` matters: it drops EXIF so no camera or GPS metadata is published.

The social card and icons are generated too. Render the card from a throwaway HTML page in headless Chrome at 1200×630, using
Commissioner from `node_modules` and the `@theme` palette, then save it with `convert out.png -strip -quality 85`.
Regenerate the icons with `rsvg-convert` (`librsvg2-bin` on Debian and Ubuntu) and ImageMagick. The circular icons render from
`favicon.svg`. The maskable and Apple icons render from a full-bleed square source, with the glyph scaled to 0.72 so it stays inside
Android's safe zone:

```sh
rsvg-convert -w 512 -h 512 public/favicon.svg -o /tmp/fav512.png
rsvg-convert -w 192 -h 192 public/favicon.svg -o /tmp/fav192.png
convert /tmp/fav512.png -define icon:auto-resize=48,32,16 public/favicon.ico
convert /tmp/fav512.png -strip public/icon-512.png
convert /tmp/fav192.png -strip public/icon-192.png

cat > /tmp/icon-square.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#2dd4bf" />
    <g transform="translate(32 32) scale(0.72) translate(-32 -32)">
        <rect x="15" y="16" width="7" height="32" fill="#101416" />
        <polyline points="47,17 32,32 47,47" fill="none" stroke="#101416" stroke-width="7" stroke-linejoin="miter" />
    </g>
</svg>
SVG
rsvg-convert -w 512 -h 512 /tmp/icon-square.svg -o /tmp/square512.png
rsvg-convert -w 180 -h 180 /tmp/icon-square.svg -o /tmp/square180.png
convert /tmp/square512.png -strip public/icon-maskable-512.png
convert /tmp/square180.png -background '#2dd4bf' -flatten -strip public/apple-touch-icon.png   # opaque: iOS masks it
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
- **Contract work goes through Quokka L.P.** The hero, contact section, JSON-LD, and `llms.txt` say he takes contract work
  through his company, linking to https://quokka-dev.com/. The company has no dates and no Experience entry on purpose: ask him
  before adding either. The CV's "Flexibility & Efficiency" offering stays omitted.
- **Omitted from Education:** 4th General Lyceum of Chalandri (high school, superseded by the MSc) and the Ministry of
  Agricultural Development "CERT Meat Technician" (off-topic for a software site).
- **Named work.** IUCLID, the European Chemicals Agency, and OTE–Cosmote may be named. The Vimachem and Hellenic Army work stays general:
  the monorepo migration is not attributed to Vimachem. Ask him before tying other work to a named client.
- **OTE–Cosmote is now Telekom** (https://www.telekom.gr/), shown as "OTE–Cosmote (now Telekom)". The older system names keep the brand of their time.
- **TRASYS Greece is now KEYES** (https://www.keyes.eu), shown as "KEYES (formerly TRASYS Greece)". He worked there under the old name.
- **IRI is now Circana** (https://www.circana.com/), shown as "Circana (formerly known as IRI)". He worked there under the old name.
- **Contact is the gmail address** from the CV, not the vimachem.com work address.
- **Location reads "Vouliagmeni"**, not the CV's "Voúla" — corrected by the owner.

## Conventions

- Prettier owns all formatting: 4-space indent, 140 columns, single quotes, semicolons. Config in `.prettierrc`; don't
  hand-format against it.
- A husky pre-commit hook runs `lint-staged`, which formats staged files automatically. Let it — no need to run `format` before
  committing.
- Verify visual changes in a real browser, not by reading the CSS. `npm run preview`, then screenshot with
  `google-chrome --headless --no-sandbox --hide-scrollbars --window-size=1280,7000 --screenshot=out.png http://localhost:4173/`.
  Add `--force-prefers-reduced-motion` to check the still version too.
