# klianos

Konstantinos Lianos' personal site — a single page about him. Vanilla Vite, no framework. `index.html` at the repo root is the
entry point and the only page; `styles.css` sits next to it and is the only stylesheet.

## Hard constraint: no JavaScript

The site is HTML and CSS only, by explicit request. Nav, sticky header, theming, and responsiveness are all pure CSS, and the
build ships zero `<script>` tags. Do not reach for JS to solve a layout or interaction problem here — find the CSS answer, or ask
first. `npm run build && grep -c '<script' dist/index.html` should stay at 0.

## Commands

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Dev server with HMR at http://localhost:5173/ |
| `npm run build`        | Production build to `dist/`                   |
| `npm run preview`      | Serve the built `dist/` locally               |
| `npm run format`       | Prettier over the whole repo                  |
| `npm run format:check` | Verify formatting without writing             |

`npm test` is a placeholder that always passes — there are no tests yet.

## Layout

- `index.html`, `styles.css` — the site. `styles.css` is linked as `./styles.css` so Vite processes and hashes it.
- `public/profile-400.jpg`, `public/profile-800.jpg` — the portrait, served via `srcset`. Vite copies `public/` verbatim, so
  these keep stable URLs.
- `docs/` — reference material only, never a build input. See below.

To regenerate the portrait from the original after replacing it:

```sh
convert docs/profile.jpg -auto-orient -strip -resize 400x -quality 82 -interlace Plane public/profile-400.jpg
convert docs/profile.jpg -auto-orient -strip -resize 800x -quality 80 -interlace Plane public/profile-800.jpg
```

`-strip` matters: it drops EXIF so no camera or GPS metadata is published.

## Reference

Source material for site content. Read these before drafting any bio, about section, work history, or skills list — do not invent
or paraphrase career details from elsewhere.

- `docs/Profile.pdf` — CV (a LinkedIn profile export). Source of truth for work history, roles, dates, education, and skills.
- `docs/profile.jpg` — original 3072×4096 portrait. Reference and resize source; don't link it into the page directly.

### Deliberate departures from the CV

The site does not reproduce the CV verbatim. These choices were made with the owner and should not be silently "corrected" back
by re-reading the PDF:

- **Angular 6 → 21.** The CV contradicts itself: the summary says "Angular 6 to 14", the TRASYS entry says "6 to 21". The site
  uses 21. The CV itself still needs fixing.
- **No contractor pitch.** The CV is written as a freelance availability pitch, but the owner has been at Vimachem full-time
  since March 2026. The site uses a neutral "Let's talk" CTA and omits the "Flexibility & Efficiency" offering.
- **Omitted from Education:** 4th General Lyceum of Chalandri (high school, superseded by the MSc) and the Ministry of
  Agricultural Development "CERT Meat Technician" (off-topic for a software site).
- **"BSc" for Liverpool** is an inference — the CV lists no degree type.
- **Contact is the gmail address** from the CV, not the vimachem.com work address.

## Conventions

- Prettier owns all formatting: 4-space indent, 140 columns, single quotes, semicolons. Config in `.prettierrc`; don't
  hand-format against it.
- A husky pre-commit hook runs `lint-staged`, which formats staged files automatically. Let it — no need to run `format` before
  committing.
- Verify visual changes in a real browser, not by reading the CSS. `npm run preview`, then screenshot with
  `google-chrome --headless --no-sandbox --hide-scrollbars --window-size=1280,7000 --screenshot=out.png http://localhost:4173/`.
  Add `--blink-settings=preferredColorScheme=1` to force light mode — headless Chrome defaults to dark here, so both need
  checking.
