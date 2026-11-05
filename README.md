# klianos

[![Deploy to GitHub Pages](https://github.com/k-lianos/klianos/actions/workflows/deploy.yml/badge.svg)](https://github.com/k-lianos/klianos/actions/workflows/deploy.yml)

Source for my personal site — a single page about my work as a software architect and frontend specialist.

**Live at [klianos.com](https://klianos.com/)**

Built with [Vite](https://vite.dev/) and [Tailwind CSS](https://tailwindcss.com/). **Almost no JavaScript ships** — 0.6 KB gzipped,
and its only job is toggling the mobile menu. The sticky header, theming, responsive layout, and every transition are CSS. The whole
site is about 220 KB, most of that images.

## Discoverability

- **Meta tags** — Open Graph and Twitter Card tags with a generated 1200×630 preview image, canonical URL, `robots` directives,
  and per-scheme `theme-color`.
- **Structured data** — a schema.org [`Person`](https://schema.org/Person) block covering role, employer, education, languages,
  skills, and linked profiles.
- **[`llms.txt`](https://llmstxt.org/)** — a plain-Markdown summary at `/llms.txt` for language models reading the site.
- **`robots.txt` and `sitemap.xml`** — crawler directives and a sitemap.
- **Icons** — an SVG favicon with `.ico` and Apple touch icon fallbacks.
- **A real 404 page** rather than GitHub's default.

`robots.txt` and `llms.txt` are only honored at a **domain root**, which is why the site is custom-domained onto
`klianos.com` rather than left at its GitHub Pages subpath.

## Getting started

Requires **Node.js 26** and **npm 11** — the versions declared in `engines`, and what CI builds with. Volta users get the pinned
version automatically.

```sh
npm install
npm run dev
```

Then open http://localhost:5173/.

| Command                | What it does                     |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Dev server with hot reload       |
| `npm run build`        | Production build into `dist/`    |
| `npm run preview`      | Serve the built `dist/` locally  |
| `npm run format`       | Run Prettier over the repo       |
| `npm run format:check` | Check formatting without writing |

## Structure

```
index.html         the page — Vite's entry point
styles.css         the only stylesheet
menu.js            mobile menu toggle — the only script
public/            images, icons, 404, llms.txt, robots.txt, sitemap.xml, CNAME — copied to dist/ verbatim
.github/workflows/ build and deploy to Pages on push to main
```

Vite ships only `public/` and files reachable from the import graph, so anything else in the repo stays out of the build.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages automatically via `.github/workflows/deploy.yml`. Nothing manual, and no
`gh-pages` branch — the workflow uploads `dist/` as a Pages artifact.

It's custom-domained onto `klianos.com` via GitHub Pages: DNS (on GoDaddy) points at GitHub's IPs, and `public/CNAME` ships the
domain in every build since deploys go through the Actions artifact rather than a branch GitHub manages itself.

The build output is plain static files with no server-side requirements, so it works equally well on Netlify, Cloudflare Pages, or
any static host.

## Conventions

Prettier owns all formatting (4-space indent, 140 columns). A Husky pre-commit hook runs `lint-staged`, so staged files are
formatted automatically — no need to run `npm run format` by hand.

## License

The code is free to borrow. The written content, CV, and photographs are not.
