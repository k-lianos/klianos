# klianos

Source for my personal site — a single page about my work as a software architect and frontend specialist.

**Live at [k-lianos.github.io/klianos](https://k-lianos.github.io/klianos/)**

Built with [Vite](https://vite.dev/) and nothing else. **No JavaScript ships**: the navigation, sticky header, theming, and
responsive layout are all plain CSS, and the production build contains zero `<script>` tags. The whole site is about 100 KB.

## Getting started

Requires Node.js `^20.19.0 || >=22.12.0`, per Vite 8.

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
vite.config.js     sets the Pages base path
public/            portrait images, copied to dist/ verbatim
docs/              CV and original photo (reference only, never built)
.github/workflows/ build and deploy to Pages on push to main
```

`docs/` holds the source material the page content was written from. It is not a build input — Vite only ships `public/` and files
reachable from the import graph.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages automatically via `.github/workflows/deploy.yml`. Nothing manual, and no
`gh-pages` branch — the workflow uploads `dist/` as a Pages artifact.

Because the site is served from the `/klianos/` subpath rather than a root domain, `vite.config.js` sets `base: '/klianos/'` so
asset URLs resolve. If the site ever moves to a root domain or the repo is renamed to `k-lianos.github.io`, drop that setting.

The build output is plain static files with no server-side requirements, so it works equally well on Netlify, Cloudflare Pages, or
any static host.

## Conventions

Prettier owns all formatting (4-space indent, 140 columns). A Husky pre-commit hook runs `lint-staged`, so staged files are
formatted automatically — no need to run `npm run format` by hand.

## License

The code is free to borrow. The written content, CV, and photographs are not.
