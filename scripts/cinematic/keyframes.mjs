// Cuts the 12 panels out of the storyboard (image/sanimg.png.png) as keyframes for the
// AI image-to-video clips, into cinematic/keyframes/:
//   panel-NN.png      the panel at its original size (about 380×235)
//   kf-NN-1920.png    the same, cropped to 16:9 and enlarged to 1920×1080 (soft; run it through an
//                     AI upscaler before using it as a video keyframe for best results)
//
// Usage: node scripts/cinematic/keyframes.mjs
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = join(root, 'image', 'sanimg.png.png');
const out = join(root, 'cinematic', 'keyframes');
mkdirSync(out, { recursive: true });

// Panel image areas in the 1536×1024 storyboard (excluding the captions under each)
const COLS = [
  [0, 379],
  [392, 761],
  [775, 1143],
  [1157, 1536],
];
const ROWS = [
  [83, 318],
  [402, 635],
  [714, 929],
];
const INSET = 2;

let n = 0;
for (const [y0, y1] of ROWS) {
  for (const [x0, x1] of COLS) {
    n++;
    const id = String(n).padStart(2, '0');
    const box = { left: x0 + INSET, top: y0 + INSET, width: x1 - x0 - INSET * 2, height: y1 - y0 - INSET * 2 };
    await sharp(src).extract(box).png().toFile(join(out, `panel-${id}.png`));
    // Centre crop to 16:9, then enlarge
    const h = Math.min(box.height, Math.round((box.width * 9) / 16));
    const w = Math.round((h * 16) / 9);
    const crop = { left: box.left + Math.round((box.width - w) / 2), top: box.top + Math.round((box.height - h) / 2), width: w, height: h };
    await sharp(src).extract(crop).resize(1920, 1080, { kernel: 'lanczos3' }).sharpen({ sigma: 0.8 }).png().toFile(join(out, `kf-${id}-1920.png`));
    console.log(`✓ ${id}  panel ${box.width}×${box.height}`);
  }
}
