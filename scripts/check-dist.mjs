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

// Every local src/href in the built HTML resolves to a file in dist/.
const assetPattern = /(?:src|href)="(\/[^"#?]+)"/g;
const seen = new Set();
let m;
while ((m = assetPattern.exec(html)) !== null) {
    const ref = m[1];
    if (seen.has(ref)) continue;
    seen.add(ref);
    const abs = join(dist, ref);
    if (existsSync(abs)) pass(`asset exists:  ${ref}`);
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

// No JS bundle — the page ships zero JavaScript.
const jsFiles = readdirSync(join(dist, 'assets')).filter(f => f.endsWith('.js'));
if (jsFiles.length === 0) pass('no JS bundle in dist/assets/');
else fail(`JS bundle found: ${jsFiles.join(', ')}`);

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
