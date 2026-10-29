// Generates the social preview image (1200×630) and the Apple touch icon.
// Source: the hero render (public/images/render-hero-wide-2400.webp) and public/favicon.svg.
// Text uses system serif/sans fonts (Georgia/Arial or equivalents) because image tools
// can't read the site's web fonts. Re-run after changing the hero render or the wordmark.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

// --- Social preview ---------------------------------------------------------------
const W = 1200;
const H = 630;
// The render is scaled down and shifted right so the building clears the headline
const renderWidth = 1040;
const render = await sharp(join(pub, 'images/render-hero-wide-2400.webp'))
  .resize(renderWidth, Math.round(renderWidth / 1.6))
  .extract({ left: 0, top: 10, width: renderWidth, height: H })
  .toBuffer();
// Fill the strip on the left by repeating the render's own edge, so there is no seam
const background = await sharp(render)
  .extend({ left: W - renderWidth, extendWith: 'copy' })
  .jpeg()
  .toBuffer();

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${H}" fill="#080808" fill-opacity="0.18"/>
  <text x="64" y="132" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="#F5F2EC">SAN</text>
  <text x="198" y="128" font-family="Arial, Helvetica, sans-serif" font-size="18" letter-spacing="7" fill="#B8B2A8">CONSTRUCTION</text>
  <text x="64" y="420" font-family="Georgia, 'Times New Roman', serif" font-size="50" fill="#F5F2EC">Building spaces with</text>
  <text x="64" y="480" font-family="Georgia, 'Times New Roman', serif" font-size="50" font-style="italic" fill="#F5F2EC">quality and purpose.</text>
  <g stroke="#B8945B" stroke-width="2">
    <line x1="64" y1="540" x2="500" y2="540"/>
    <line x1="64" y1="532" x2="64" y2="548"/>
    <line x1="500" y1="532" x2="500" y2="548"/>
  </g>
</svg>`);

await sharp(background)
  .composite([{ input: overlay, left: 0, top: 0 }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(join(pub, 'og-image.jpg'));
console.log('✓ public/og-image.jpg 1200×630');

// --- Apple touch icon (iOS ignores SVG icons) ---------------------------------------
await sharp(readFileSync(join(pub, 'favicon.svg')), { density: 600 })
  .resize(180, 180)
  .flatten({ background: '#111111' })
  .png()
  .toFile(join(pub, 'apple-touch-icon.png'));
console.log('✓ public/apple-touch-icon.png 180×180');
