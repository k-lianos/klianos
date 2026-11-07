/**
 * Tier 1 build-output assertions.
 * Run after `npm run build`. No browser needed; exits non-zero on any failure.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
let failures = 0;

function fail(msg) {
    console.error(`  FAIL  ${msg}`);
    failures++;
}

function pass(msg) {
    console.log(`  pass  ${msg}`);
}

const html = readFileSync(join(dist, 'index.html'), 'utf8');

// Every local src, href, and srcset candidate in the built HTML resolves to a file in dist/.
const refs = [
    ...[...html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)].map(m => m[1]),
    ...[...html.matchAll(/srcset="([^"]+)"/g)].flatMap(m => m[1].split(',').map(candidate => candidate.trim().split(/\s+/)[0])),
];
for (const ref of new Set(refs.filter(ref => ref.startsWith('/')))) {
    if (existsSync(join(dist, ref))) pass(`asset exists:  ${ref}`);
    else fail(`asset missing: ${ref}`);
}

// JSON-LD parses and the Person node has @type, name, url.
const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ldMatch) {
    fail('no JSON-LD block found');
} else {
    try {
        const data = JSON.parse(ldMatch[1]);
        const nodes = data['@graph'] ?? [data];
        const person = nodes.find(n => n['@type'] === 'Person');
        if (!person) {
            fail('JSON-LD: no Person node');
        } else {
            if (person['@type']) pass('JSON-LD: @type present');
            else fail('JSON-LD: missing @type');
            if (person['name']) pass('JSON-LD: name present');
            else fail('JSON-LD: missing name');
            if (person['url']) pass('JSON-LD: url present');
            else fail('JSON-LD: missing url');
        }
    } catch (e) {
        fail(`JSON-LD parse error: ${e.message}`);
    }
}

// sitemap.xml is present and starts like XML.
const sitemapPath = join(dist, 'sitemap.xml');
if (!existsSync(sitemapPath)) {
    fail('sitemap.xml missing');
} else {
    const sitemap = readFileSync(sitemapPath, 'utf8').trimStart();
    if (sitemap.startsWith('<?xml') || sitemap.startsWith('<urlset')) pass('sitemap.xml present');
    else fail('sitemap.xml does not look like XML');
}

// favicon.svg is present and contains an <svg> element.
const faviconPath = join(dist, 'favicon.svg');
if (!existsSync(faviconPath)) {
    fail('favicon.svg missing');
} else {
    const favicon = readFileSync(faviconPath, 'utf8');
    if (favicon.includes('<svg')) pass('favicon.svg present');
    else fail('favicon.svg does not look like SVG');
}

// Required meta tags are present.
const metaChecks = [
    ['canonical', /rel="canonical"/],
    ['og:image', /property="og:image"/],
    ['og:title', /property="og:title"/],
    ['description', /name="description"/],
];
for (const [name, re] of metaChecks) {
    if (re.test(html)) pass(`meta: ${name}`);
    else fail(`meta missing: ${name}`);
}

// No executable JavaScript ships: no bundle, and no script in either page except the JSON-LD data block, no inline event
// handlers, and no javascript: URLs.
const jsFiles = readdirSync(join(dist, 'assets')).filter(f => f.endsWith('.js'));
if (jsFiles.length === 0) pass('no JS bundle in dist/assets/');
else fail(`JS bundle found: ${jsFiles.join(', ')}`);

// Quoted attribute values may contain ">" (Tailwind variants such as [&>svg]), so match tags attribute by attribute.
const TAG = /<([a-z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/gi;
const ATTRIBUTE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
for (const page of ['index.html', '404.html']) {
    const scripts = [];
    for (const [, tag, attrs] of readFileSync(join(dist, page), 'utf8').matchAll(TAG)) {
        const attributes = [...attrs.matchAll(ATTRIBUTE)].map(([, name, ...values]) => [
            name.toLowerCase(),
            values.find(v => v !== undefined) ?? '',
        ]);
        if (tag.toLowerCase() === 'script' && !attributes.some(([name, value]) => name === 'type' && value === 'application/ld+json')) {
            scripts.push('<script> that is not JSON-LD');
        }
        for (const [name, value] of attributes) {
            if (name.startsWith('on')) scripts.push(`<${tag} ${name}> event handler`);
            if (/^\s*javascript:/i.test(value)) scripts.push(`<${tag} ${name}="javascript:...">`);
        }
    }
    if (scripts.length === 0) pass(`${page}: no executable script`);
    else for (const script of scripts) fail(`${page}: ${script}`);
}

// Older-browser fallbacks survive the build. Chrome < 104 and Safari < 16.4 ignore range media queries such as (width>=48rem),
// so they must be lowered to min-width (vite.config.mjs cssTarget). Browsers without @layer get fallback.css, which only stays
// out of modern browsers' way while it is inside its @supports gate.
const cssFiles = readdirSync(join(dist, 'assets')).filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
    const css = readFileSync(join(dist, 'assets', file), 'utf8');
    const ranges = css.match(/@media[^{]*\((?:width|height)\s*[<>=]/g) ?? [];
    if (ranges.length === 0) pass(`${file}: no range media queries`);
    else fail(`${file}: ${ranges.length} range media quer${ranges.length === 1 ? 'y' : 'ies'}, e.g. ${ranges[0]}`);
}
const gate = '@supports not (all:revert-layer){';
if (cssFiles.some(f => readFileSync(join(dist, 'assets', f), 'utf8').includes(gate))) pass('no-@layer fallback is present and gated');
else fail('no-@layer fallback missing, or no longer inside @supports not (all: revert-layer)');

// index.html stays under 300 KB.
const HTML_CEILING = 300 * 1024;
const htmlBytes = statSync(join(dist, 'index.html')).size;
if (htmlBytes < HTML_CEILING) pass(`index.html ${htmlBytes} bytes`);
else fail(`index.html ${htmlBytes} bytes — exceeds ${HTML_CEILING}-byte ceiling`);

// Summary
console.log('');
if (failures > 0) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
} else {
    console.log('all checks passed');
}
