// Downloads the CC0 assets used by the 3D house walkthrough from Poly Haven
// (https://polyhaven.com, all assets CC0) and prepares them for the web:
//   - textures: 1k JPG maps re-encoded as WebP
//   - sky: 1k HDR for lighting/reflections + a tonemapped WebP for the visible background
//   - models: 1k glTF with their textures re-encoded as smaller WebP
// Output goes to public/house/ along with credits.json. Re-run after editing the lists below.
//
// Usage: node scripts/house-assets.mjs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/house');

// Texture sets: Poly Haven id -> maps to fetch (diffuse colour, OpenGL normal, AO/rough/metal)
const TEXTURES = [
  'clay_roof_tiles_02', // roof
  'painted_plaster_wall', // walls
  'marble_01', // steps, porch and interior floors
  'granite_tile', // driveway
  'leafy_grass', // lawn
  'asphalt_02', // road
  'dark_wood', // doors, soffits, railings
  // Interiors
  'oak_wood_planks', // bedroom floor
  'terracotta_floor_tiles', // terrace floor
  'long_white_tiles', // kitchen backsplash
  'wood_plank_wall', // fluted feature wall in the living room
];
const SKIES = ['industrial_sunset_02_puresky'];
// Small models only (Poly Haven trees are tens of MB; palms and hedges are built in code).
// Main furniture is built in code too, so the interiors share one modern style.
const MODELS = [
  'brass_diya_lantern',
  'potted_plant_04',
  'planter_pot_clay',
  'potted_plant_02',
  'ceiling_fan',
  'modern_arm_chair_01',
  'mid_century_lounge_chair',
  'modern_ceiling_lamp_01',
  'side_table_01',
  'brass_vase_01',
  'carved_wooden_elephant',
  'brass_pot_01',
  'wooden_bowl_01',
  'throw_pillows_01',
];

const api = async (path) => {
  const res = await fetch(`https://api.polyhaven.com/${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
};
const download = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};
const credits = [];
const credit = async (id, type) => {
  const info = await api(`info/${id}`);
  credits.push({ id, type, name: info.name, authors: Object.keys(info.authors ?? {}), url: `https://polyhaven.com/a/${id}`, licence: 'CC0' });
};

mkdirSync(join(out, 'tex'), { recursive: true });
for (const id of TEXTURES) {
  const files = await api(`files/${id}`);
  const maps = { diff: files.Diffuse, nor: files.nor_gl, arm: files.arm };
  for (const [key, map] of Object.entries(maps)) {
    const url = map?.['1k']?.jpg?.url;
    if (!url) throw new Error(`${id} has no 1k ${key}`);
    // Normal and ARM maps are data, not colour: keep quality higher so lighting doesn't band
    const quality = key === 'diff' ? 80 : 88;
    await sharp(await download(url)).webp({ quality }).toFile(join(out, 'tex', `${id}_${key}.webp`));
  }
  await credit(id, 'texture');
  console.log('✓ texture', id);
}

mkdirSync(join(out, 'sky'), { recursive: true });
for (const id of SKIES) {
  const files = await api(`files/${id}`);
  writeFileSync(join(out, 'sky', `${id}_1k.hdr`), await download(files.hdri['1k'].hdr.url));
  // Visible backdrop: the tonemapped panorama at 4096×2048 (sharp enough behind a wide lens)
  await sharp(await download(files.tonemapped.url)).resize(4096, 2048).webp({ quality: 78 }).toFile(join(out, 'sky', `${id}.webp`));
  await credit(id, 'hdri');
  console.log('✓ sky', id);
}

for (const id of MODELS) {
  const files = await api(`files/${id}`);
  const entry = files.gltf['1k'].gltf;
  const dir = join(out, 'models', id);
  mkdirSync(dir, { recursive: true });
  const gltf = JSON.parse((await download(entry.url)).toString('utf8'));
  for (const [rel, file] of Object.entries(entry.include ?? {})) {
    const target = join(dir, rel);
    mkdirSync(dirname(target), { recursive: true });
    const data = await download(file.url);
    if (/\.(jpe?g|png)$/i.test(rel)) {
      // Props are seen small: 512px WebP is plenty
      await sharp(data).resize(512, 512, { fit: 'inside' }).webp({ quality: 82 }).toFile(target.replace(/\.(jpe?g|png)$/i, '.webp'));
    } else {
      writeFileSync(target, data);
    }
  }
  for (const image of gltf.images ?? []) {
    if (image.uri) image.uri = image.uri.replace(/\.(jpe?g|png)$/i, '.webp');
    delete image.mimeType;
  }
  writeFileSync(join(dir, `${id}.gltf`), JSON.stringify(gltf));
  await credit(id, 'model');
  console.log('✓ model', id);
}

writeFileSync(join(out, 'credits.json'), JSON.stringify(credits, null, 2));
const size = (p) => readFileSync(p).length;
console.log('done', credits.length, 'assets', size(join(out, 'credits.json')) > 0 ? '' : '');
