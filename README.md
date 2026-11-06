# klianos

[![Deploy to GitHub Pages](https://github.com/k-lianos/klianos/actions/workflows/deploy.yml/badge.svg)](https://github.com/k-lianos/klianos/actions/workflows/deploy.yml)

Source for my personal site — a single page about my work as a software architect and frontend specialist.

**Live at [klianos.com](https://klianos.com/)**

Built with [Vite](https://vite.dev/) and [Tailwind CSS](https://tailwindcss.com/). **No JavaScript ships.** The sticky header, theming, and responsive
layout are all Tailwind utility classes in `index.html`. The Tailwind entry point in `styles.css` builds into a separate,
content-hashed stylesheet that browsers can cache.

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

### Sitemap maintenance

`public/sitemap.xml` lists only `https://klianos.com/`, matching the canonical URL in `index.html`. Sections with `#` anchors
belong to this same page; do not add them, `/index.html`, or the error page as separate sitemap entries. Vite copies the sitemap
to `/sitemap.xml`, and `public/robots.txt` already advertises that URL to crawlers.

Update `<lastmod>` to the actual date (`YYYY-MM-DD`) of a significant change to the page's content, structured data, or links.
Do not refresh it just because the site is rebuilt or the sitemap is edited. Both Google and Bing ignore `priority` and
`changefreq`, so they are omitted. See [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
and [Bing's sitemap guidance](https://blogs.bing.com/webmaster/2025/7/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search/).

After deployment, submit `https://klianos.com/sitemap.xml` in the verified site's Google Search Console **Sitemaps** report.
Use **URL Inspection** for `https://klianos.com/` to check indexing and request indexing when appropriate. A sitemap helps
discovery; it does not guarantee indexing or higher rankings.

Also submit the same `https://klianos.com/sitemap.xml` URL in the verified site's **Sitemaps** section of
[Bing Webmaster Tools](https://www.bing.com/webmasters/). Check its processing status, last processing date, and discovered URLs
after submission. The existing `User-agent: *` rule allows Bingbot, and the sitemap declaration supports Bing's discovery too;
no separate Bing sitemap or crawler-specific rule is needed.

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
styles.css         Tailwind imports, theme, and keyframes — built into a hashed stylesheet
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
