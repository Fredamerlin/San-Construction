// Downloads, crops, colour-grades and converts the placeholder images listed in sources.json.
//
// Outputs:
//   public/images/<name>-<width>.avif|webp     responsive sizes
//   src/data/images.generated.json            dimensions, alt text and credits for the app
//   ASSET-CREDITS.md                          human-readable licence record
//
// Downloads are cached in .image-cache/ so re-runs only re-process.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { images: allImages } = JSON.parse(readFileSync(join(root, 'scripts/images/sources.json'), 'utf8'));
// Optional names on the command line process only those images (the rest of the manifest is kept)
const only = process.argv.slice(2);
const images = only.length ? allImages.filter((img) => only.includes(img.name)) : allImages;
const manifestFile = join(root, 'src/data/images.generated.json');
const previous = only.length && existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
const cacheDir = join(root, '.image-cache');
const outDir = join(root, 'public/images');
const WIDTHS = [640, 1024, 1600, 2400];
const UA = 'san-construction-site-build/1.0 (placeholder image fetch)';

mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

async function fetchWithRetry(url, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`${res.status} for ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      if (i >= attempts) throw error;
      console.warn(`  retry ${i} for ${url}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

async function download(url, file) {
  if (existsSync(file)) return readFileSync(file);
  const buf = await fetchWithRetry(url);
  writeFileSync(file, buf);
  return buf;
}

async function picsumInfo(id) {
  const buf = await download(`https://picsum.photos/id/${id}/info`, join(cacheDir, `picsum-${id}.json`));
  return JSON.parse(buf.toString('utf8'));
}

const manifest = {};

for (const img of images) {
  let original;
  let credit;

  if (img.local) {
    // In-house renders of the site's own 3D scene (scripts/render-stills.mjs)
    const file = join(root, img.local);
    if (!existsSync(file)) throw new Error(`${img.name}: ${img.local} not found. Run \`npm run render\` first.`);
    original = readFileSync(file);
    credit = {
      title: img.name.startsWith('walk') ? 'Render of the site’s 3D concept house' : 'Render of the site’s procedural 3D building',
      creator: 'Created for this website',
      license: 'Original work',
      licenseUrl: '',
      page: '',
      via: 'Rendered in-house',
    };
  } else if (img.picsum) {
    const info = await picsumInfo(img.picsum);
    original = await download(`https://picsum.photos/id/${img.picsum}/2400/1600.jpg`, join(cacheDir, `picsum-${img.picsum}.jpg`));
    credit = {
      title: `Photo ${img.picsum}`,
      creator: info.author,
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      page: info.url,
      via: 'Unsplash (via Lorem Picsum)',
    };
  } else {
    original = await download(img.commons.image, join(cacheDir, `${img.name}.jpg`));
    credit = { ...img.commons, via: 'Wikimedia Commons' };
    delete credit.image;
  }

  let pipeline = sharp(original).rotate();
  if (img.crop) pipeline = pipeline.extract(img.crop);
  // House grade for photographs: slightly desaturated and darker with a little added
  // contrast, so mixed sources sit together on the charcoal palette. Renders are already
  // in the site's palette and skip it.
  if (img.grade !== false) {
    pipeline = pipeline.modulate({ saturation: img.saturation ?? 0.72, brightness: 0.9 }).linear(1.06, -8);
  }
  const graded = await pipeline.toBuffer({ resolveWithObject: true });
  const { width, height } = graded.info;

  const widths = WIDTHS.filter((w) => w <= width);
  // Add the full width when it is meaningfully larger than the biggest standard size
  const largest = widths[widths.length - 1] ?? 0;
  if (width < WIDTHS[WIDTHS.length - 1] && width > largest * 1.1) widths.push(width);

  for (const w of widths) {
    const resized = sharp(graded.data).resize({ width: w });
    await resized.clone().avif({ quality: 50, effort: 6 }).toFile(join(outDir, `${img.name}-${w}.avif`));
    await resized.clone().webp({ quality: 74, effort: 5 }).toFile(join(outDir, `${img.name}-${w}.webp`));
  }

  manifest[img.name] = { width, height, widths, alt: img.alt, credit };
  console.log(`✓ ${img.name} ${width}×${height} → ${widths.join(', ')}`);
}

// Keep source order; entries not processed this run come from the previous manifest
const merged = Object.fromEntries(allImages.filter((img) => manifest[img.name] ?? previous[img.name]).map((img) => [img.name, manifest[img.name] ?? previous[img.name]]));
writeFileSync(manifestFile, JSON.stringify(merged, null, 2) + '\n');
const credits = Object.entries(merged).map(([name, entry]) => ({ name, ...entry.credit }));

const houseCreditsFile = join(root, 'public/house/credits.json');
const houseCredits = existsSync(houseCreditsFile) ? JSON.parse(readFileSync(houseCreditsFile, 'utf8')) : [];

const lines = [
  '# Asset credits and licences',
  '',
  'All photographs are **placeholders**. None of them show SAN Construction projects, sites or staff.',
  'Replace them with approved company imagery before launch. Generated by `npm run images` from',
  '`scripts/images/sources.json`; images are cropped, colour-graded and resized.',
  '',
  '| File | Source | Creator | Licence |',
  '|---|---|---|---|',
  ...credits.map((c) => {
    const title = c.title.replace(/\|/g, '/');
    const source = c.page ? `[${title}](${c.page})` : title;
    const licence = c.licenseUrl ? `[${c.license}](${c.licenseUrl})` : c.license;
    return `| \`${c.name}\` | ${source} (${c.via}) | ${c.creator} | ${licence} |`;
  }),
  '',
  '## 3D walkthrough assets',
  '',
  'Textures, the sky and small props in the home-page walkthrough come from [Poly Haven](https://polyhaven.com)',
  '(CC0, no attribution required; listed for the record). Downloaded and resized by `node scripts/house-assets.mjs`.',
  'The house, furniture, palms and landscape are modelled in code for this website.',
  '',
  '| Asset | Type | Author(s) | Licence |',
  '|---|---|---|---|',
  ...houseCredits.map((c) => `| [${c.name}](${c.url}) | ${c.type} | ${c.authors.join(', ')} | CC0 |`),
  '',
  '## Fonts',
  '',
  '- Instrument Serif: SIL Open Font License 1.1 (via Fontsource)',
  '- Manrope: SIL Open Font License 1.1 (via Fontsource)',
  '',
];
writeFileSync(join(root, 'ASSET-CREDITS.md'), lines.join('\n'));
console.log(`\n${images.length} images processed.`);
