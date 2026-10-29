// Post-build step (runs after `vite build`, see package.json):
//   - one HTML file per page with the right <title>, description, social and canonical tags,
//     so crawlers and link previews that don't run JavaScript see correct metadata
//   - font preloads on every page, and responsive hero-image preloads on the home page
//   - robots.txt and, once the production URL is known, sitemap.xml
// Page data comes from src/data/pageMeta.ts, loaded through Vite so env variables apply.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('dist/index.html not found. Run vite build first.');

const server = await createServer({
  root,
  mode: 'production',
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true },
});
const pageMeta = await server.ssrLoadModule('/src/data/pageMeta.ts');
const { site } = await server.ssrLoadModule('/src/data/site.ts');
await server.close();

const images = JSON.parse(readFileSync(join(root, 'src/data/images.generated.json'), 'utf8'));
const template = readFileSync(join(dist, 'index.html'), 'utf8');
const siteUrl = site.siteUrl ? site.siteUrl.replace(/\/$/, '') : null;
const indexable = Boolean(siteUrl) && !site.demoMode;

const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- Preloads ----------------------------------------------------------------------
const assets = readdirSync(join(dist, 'assets'));
const font = (prefix) => assets.find((file) => file.startsWith(prefix) && file.endsWith('.woff2'));
// Two fonts only: preloads compete with the JavaScript needed for first paint on slow
// connections. The italic loads on demand (font-display: swap keeps text visible meanwhile).
const fontPreloads = [font('instrument-serif-latin-400-normal-'), font('manrope-latin-wght-normal-')]
  .filter(Boolean)
  .map((file) => `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin />`);

const srcset = (key) => images[key].widths.map((w) => `/images/${key}-${w}.avif ${w}w`).join(', ');
// Mirrors the opening view in HomeWalkthrough: the video sequence's first frame once it is
// built (same URLs as frameUrl in cinematic/sequence.ts), otherwise the 3D scene's still
const cinematic = JSON.parse(readFileSync(join(root, 'src/data/cinematic.json'), 'utf8'));
const cinematicReady = cinematic.frames > 0 && (cinematic.scenes?.length ?? 0) >= 2;
const heroPreloads = cinematicReady
  ? [
      ['m', '(orientation: portrait)'],
      ['d', '(orientation: landscape)'],
    ].map(
      ([set, media]) =>
        `<link rel="preload" as="image" type="image/webp" href="/cinematic/${set}/00001.webp?v=${cinematic.version}" media="${media}" fetchpriority="high" />`,
    )
  : [
      ['walk-1-tall', '(orientation: portrait)'],
      ['walk-1', '(orientation: landscape)'],
    ].map(
      ([key, media]) =>
        `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset(key)}" imagesizes="100vw" media="${media}" fetchpriority="high" />`,
    );

// --- Per-page HTML --------------------------------------------------------------------
function headFor(meta) {
  const title = pageMeta.fullTitle(meta);
  const canonical = siteUrl ? `${siteUrl}${meta.path === '/' ? '/' : meta.path}` : null;
  const image = siteUrl ? `${siteUrl}${pageMeta.socialImagePath}` : pageMeta.socialImagePath;
  const noindex = site.demoMode || meta.noindex;
  const tags = [
    `<title data-static>${escape(title)}</title>`,
    `<meta data-static name="description" content="${escape(meta.description)}" />`,
    noindex ? `<meta data-static name="robots" content="noindex" />` : '',
    canonical && !meta.noindex ? `<link data-static rel="canonical" href="${escape(canonical)}" />` : '',
    `<meta data-static property="og:type" content="website" />`,
    `<meta data-static property="og:site_name" content="${escape(site.name)}" />`,
    `<meta data-static property="og:locale" content="en" />`,
    `<meta data-static property="og:title" content="${escape(title)}" />`,
    `<meta data-static property="og:description" content="${escape(meta.description)}" />`,
    `<meta data-static property="og:image" content="${escape(image)}" />`,
    `<meta data-static property="og:image:width" content="1200" />`,
    `<meta data-static property="og:image:height" content="630" />`,
    canonical ? `<meta data-static property="og:url" content="${escape(canonical)}" />` : '',
    `<meta data-static name="twitter:card" content="summary_large_image" />`,
  ];
  return tags.filter(Boolean).join('\n    ');
}

// Inner pages: preload the PageHero image so it downloads alongside the JavaScript
// instead of after it (this is a client-rendered app). Mirrors PageHero's <picture>:
// full width, with a portrait composition for portrait screens when one exists.
const preloadLink = (key, media) =>
  `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset(key)}" imagesizes="100vw"${media ? ` media="${media}"` : ''} fetchpriority="high" />`;
const pageHeroPreload = (key) => {
  if (!images[key]) return '';
  const tall = images[`${key}-tall`] ? `${key}-tall` : null;
  return tall ? [preloadLink(tall, '(orientation: portrait)'), preloadLink(key, '(orientation: landscape)')].join('\n    ') : preloadLink(key);
};

function render(meta, { hero = false } = {}) {
  const imagePreloads = hero ? heroPreloads : meta.heroImage ? [pageHeroPreload(meta.heroImage)] : [];
  const preloads = [...fontPreloads, ...imagePreloads].filter(Boolean).join('\n    ');
  return template
    .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, headFor(meta))
    .replace('<!--preload-->', preloads);
}

function write(relativePath, html) {
  const file = join(dist, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const pages = pageMeta.allPages();
for (const meta of pages) {
  // "/" → index.html, "/about" → about.html, "/services/x" → services/x.html
  // (served at the clean URL by Netlify, by Vercel with cleanUrls, and by `vite preview`)
  const file = meta.path === '/' ? 'index.html' : `${meta.path.slice(1)}.html`;
  write(file, render(meta, { hero: meta.path === '/' }));
}
write('404.html', render(pageMeta.notFoundMeta));
console.log(`✓ ${pages.length} page HTML files + 404.html`);

// --- robots.txt and sitemap.xml ---------------------------------------------------------
if (indexable) {
  const urls = pages
    .filter((meta) => !meta.noindex)
    .map(
      (meta) =>
        `  <url><loc>${siteUrl}${meta.path === '/' ? '/' : meta.path}</loc><priority>${(meta.priority ?? 0.5).toFixed(1)}</priority></url>`,
    );
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`✓ robots.txt (indexable) + sitemap.xml with ${urls.length} URLs`);
} else {
  // Preview builds (demo mode on, or no production URL yet) are kept out of search engines
  write('robots.txt', 'User-agent: *\nDisallow: /\n');
  console.log(`✓ robots.txt (not indexable: ${site.demoMode ? 'demo mode is on' : 'VITE_SITE_URL not set'}); no sitemap`);
}
