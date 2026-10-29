import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneQuality } from '../capability';

/*
 * Materials for the house, built from CC0 Poly Haven texture sets (see scripts/house-assets.mjs
 * and public/house/credits.json). Each set has a colour map, an OpenGL normal map and a packed
 * ARM map (R = ambient occlusion, G = roughness, B = metalness), which is exactly how three.js
 * reads aoMap, roughnessMap and metalnessMap, so one texture serves all three.
 */

const BASE = `${import.meta.env.BASE_URL}house/tex/`;

/** Poly Haven id -> real-world size of one texture tile, in metres. */
const SETS = {
  roof: { id: 'clay_roof_tiles_02', tile: 1.6 },
  plaster: { id: 'painted_plaster_wall', tile: 3 },
  stone: { id: 'marble_01', tile: 2.4 },
  granite: { id: 'granite_tile', tile: 2.4 },
  grass: { id: 'leafy_grass', tile: 2.5 },
  asphalt: { id: 'asphalt_02', tile: 4 },
  wood: { id: 'dark_wood', tile: 1.6 },
  oak: { id: 'oak_wood_planks', tile: 2 },
  terracotta: { id: 'terracotta_floor_tiles', tile: 1.6 },
  whiteTile: { id: 'long_white_tiles', tile: 0.8 },
  fluted: { id: 'wood_plank_wall', tile: 1.2 },
} as const;
type SetName = keyof typeof SETS;

const urls = Object.fromEntries(
  Object.entries(SETS).flatMap(([name, { id }]) => [
    [`${name}_diff`, `${BASE}${id}_diff.webp`],
    [`${name}_nor`, `${BASE}${id}_nor.webp`],
    [`${name}_arm`, `${BASE}${id}_arm.webp`],
  ]),
);

/** Start downloading the textures before the scene mounts. */
export function preloadHouseTextures() {
  useTexture.preload(Object.values(urls));
}

export type HouseMaterials = ReturnType<typeof useHouseMaterials>;

export function useHouseMaterials(quality: SceneQuality) {
  const textures = useTexture(urls) as Record<string, THREE.Texture>;

  return useMemo(() => {
    const anisotropy = quality === 'high' ? 8 : 4;
    const set = (name: SetName, params: THREE.MeshStandardMaterialParameters = {}) => {
      const { tile } = SETS[name];
      const map = textures[`${name}_diff`]!;
      const normalMap = textures[`${name}_nor`]!;
      const arm = textures[`${name}_arm`]!;
      map.colorSpace = THREE.SRGBColorSpace;
      for (const t of [map, normalMap, arm]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1 / tile, 1 / tile);
        t.anisotropy = anisotropy;
        t.needsUpdate = true;
      }
      return new THREE.MeshStandardMaterial({
        map,
        normalMap,
        roughnessMap: arm,
        aoMap: arm,
        metalnessMap: arm,
        metalness: 1, // scaled by the ARM map's blue channel (≈0 for all of these)
        ...params,
      });
    };

    // Lamp glass and LED strips: unlit, brighter than 1 so the bloom pass picks them up.
    // Their brightness is changed together by the time-of-day controller.
    const lamp = (color: string, strength: number) => {
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), toneMapped: false });
      material.userData.base = material.color.clone();
      return material;
    };

    // Uplight wash painted onto walls with additive blending: looks like a ground spotlight
    // grazing the wall, at no lighting cost (real spotlights are slow on integrated graphics)
    const wash = new THREE.MeshBasicMaterial({
      map: washTexture(),
      color: new THREE.Color('#ff9c4a').multiplyScalar(0.9),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    wash.userData.base = wash.color.clone();

    return {
      wash,
      roof: set('roof', { color: '#c9a08a', side: THREE.FrontSide }),
      plaster: set('plaster', { color: '#f4e9d8', normalScale: new THREE.Vector2(0.6, 0.6) }),
      plasterWarm: set('plaster', { color: '#e9d9c0' }),
      stone: set('stone', { color: '#efe2cc' }),
      granite: set('granite', { color: '#8d8a86' }),
      grass: set('grass', { color: '#a6b58d' }),
      field: set('grass', { color: '#5f6d4c' }),
      asphalt: set('asphalt', { color: '#7b7b80' }),
      wood: set('wood', { color: '#d29e72' }),
      woodDark: set('wood', { color: '#8a5a3a' }),
      // Plain materials
      paint: new THREE.MeshStandardMaterial({ color: '#f1ebe0', roughness: 0.85 }),
      concrete: new THREE.MeshStandardMaterial({ color: '#9c968c', roughness: 0.9 }),
      metal: new THREE.MeshStandardMaterial({ color: '#1c1b1a', roughness: 0.45, metalness: 0.8 }),
      brass: new THREE.MeshStandardMaterial({ color: '#c08a3e', roughness: 0.3, metalness: 1 }),
      glass: new THREE.MeshStandardMaterial({
        color: '#202a33',
        roughness: 0.04,
        metalness: 0.1,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        envMapIntensity: 1.6,
      }),
      hedge: new THREE.MeshStandardMaterial({ color: '#2f4a26', roughness: 0.95 }),
      soil: new THREE.MeshStandardMaterial({ color: '#2a2018', roughness: 1 }),
      lampWarm: lamp('#ffb26b', 6),
      lampSoft: lamp('#ffc890', 2.6),
      lampStrip: lamp('#ffcf94', 4),
      lampShade: lamp('#ffd9a8', 1.6),
      interior: interiorMaterials(set),
    };
  }, [textures, quality]);
}

/*
 * Interior materials. Each glows faintly warm through its own texture (emissiveMap = map),
 * controlled as one group: noticeably when the camera is outside, so rooms read as lamp-lit
 * through the windows, and only slightly when inside, where the room lights take over.
 * Reflections of the outdoor sky are turned down indoors.
 */
const WARM = new THREE.Color('#ffc58c');

function interiorMaterials(set: (name: SetName, params?: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial) {
  const textured = (name: SetName, params: THREE.MeshStandardMaterialParameters = {}) => {
    const material = set(name, { envMapIntensity: 0.35, ...params });
    material.emissiveMap = material.map;
    material.emissive = WARM.clone();
    return material;
  };
  const plain = (color: string, params: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      envMapIntensity: 0.3,
      emissive: new THREE.Color(color).multiply(WARM),
      ...params,
    });

  const list = {
    paint: plain('#efe6d8'),
    ceiling: plain('#f4efe7'),
    floor: textured('stone', { color: '#f3e7d3', envMapIntensity: 0.6 }),
    oak: textured('oak', { color: '#e0b98f' }),
    // Joinery (cabinets, consoles, treads, bed): deep teak-brown grain
    rosewood: textured('wood', { color: '#a06a46' }),
    teak: textured('wood', { color: '#d8a274' }),
    fluted: textured('fluted', { color: '#b98458' }),
    terracotta: textured('terracotta', { color: '#e0a383', envMapIntensity: 0.5 }),
    whiteTile: textured('whiteTile', { color: '#f6f1e8', envMapIntensity: 0.6 }),
    bathStone: textured('stone', { color: '#c9b9a4', envMapIntensity: 0.55 }),
    counter: textured('granite', { color: '#4a4440', envMapIntensity: 0.8, roughness: 0.35 }),
    fabric: plain('#d9ccb6', { roughness: 1 }),
    fabricDark: plain('#7d5a44', { roughness: 1 }),
    rust: plain('#a24f2c', { roughness: 1 }),
    linen: plain('#f2ede4', { roughness: 1 }),
    curtain: plain('#e9dcc4', { roughness: 1, side: THREE.DoubleSide }),
    ceramic: plain('#f7f5f1', { roughness: 0.18, envMapIntensity: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: '#c7c7c7', metalness: 1, roughness: 0.28, envMapIntensity: 0.6 }),
    blackGlass: new THREE.MeshStandardMaterial({ color: '#0c0c0e', roughness: 0.06, metalness: 0.2, envMapIntensity: 0.6 }),
    mirror: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.02, metalness: 1, envMapIntensity: 1 }),
    jali: new THREE.MeshStandardMaterial({
      map: jaliTexture(),
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      color: '#b47a4c',
      roughness: 0.7,
      envMapIntensity: 0.3,
    }),
    rug: new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 1, envMapIntensity: 0.2 }),
  };
  // The plank texture runs horizontally; turn it so the flutes are vertical
  for (const t of [list.fluted.map, list.fluted.normalMap, list.fluted.roughnessMap]) if (t) t.rotation = Math.PI / 2;
  list.jali.emissiveMap = list.jali.map;
  list.jali.emissive = WARM.clone();
  list.rug.emissiveMap = list.rug.map;
  list.rug.emissive = WARM.clone();
  return list;
}

export type InteriorMaterials = ReturnType<typeof interiorMaterials>;

/** Set how strongly the interiors glow on their own (see interiorMaterials). */
export function setInteriorAmbient(interior: InteriorMaterials, amount: number) {
  for (const material of Object.values(interior)) {
    if (material instanceof THREE.MeshStandardMaterial && material.emissive) material.emissiveIntensity = amount;
  }
}

/**
 * Carved timber jali: each tile is two by two rosettes (eight petals around a round boss)
 * with small diamonds where the rosettes meet. Cut-outs are transparent (alpha-tested).
 */
function jaliTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'destination-out';
  const cell = size / 2;
  const petal = (cx: number, cy: number, angle: number) => {
    ctx.beginPath();
    const r = cell * 0.28;
    ctx.ellipse(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, cell * 0.15, cell * 0.06, angle, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const cx = (gx + 0.5) * cell;
      const cy = (gy + 0.5) * cell;
      for (let k = 0; k < 8; k++) petal(cx, cy, (k * Math.PI) / 4 + Math.PI / 8);
      // Ring around the central boss
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.1, 0, Math.PI * 2);
      ctx.arc(cx, cy, cell * 0.06, 0, Math.PI * 2, true);
      ctx.fill();
    }
  }
  // Diamonds at the corners and edge midpoints, where neighbouring rosettes meet
  for (let gy = 0; gy <= 2; gy++) {
    for (let gx = 0; gx <= 2; gx++) {
      const x = gx * cell;
      const y = gy * cell;
      const d = cell * 0.11;
      ctx.beginPath();
      ctx.moveTo(x, y - d);
      ctx.lineTo(x + d, y);
      ctx.lineTo(x, y + d);
      ctx.lineTo(x - d, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
/** Hand-woven dhurrie rug: rust field, indigo and cream borders, a row of diamonds. */
function rugTexture() {
  const w = 512;
  const h = 340;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#a5552f';
  ctx.fillRect(0, 0, w, h);
  const band = (inset: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  };
  band(14, 22, '#e8dcc4');
  band(32, 10, '#2e3a52');
  band(48, 6, '#d39a4c');
  ctx.fillStyle = '#e8dcc4';
  for (let i = 0; i < 5; i++) {
    const cx = 110 + i * 73;
    const cy = h / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 46);
    ctx.lineTo(cx + 28, cy);
    ctx.lineTo(cx, cy + 46);
    ctx.lineTo(cx - 28, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2e3a52';
    ctx.fillRect(cx - 7, cy - 7, 14, 14);
    ctx.fillStyle = '#e8dcc4';
  }
  // Woven texture: fine horizontal lines
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Materials whose brightness follows the time of day. */
export function lampMaterials(materials: HouseMaterials) {
  return [materials.lampWarm, materials.lampSoft, materials.lampStrip, materials.wash];
}

/** Soft cone of light: brightest just above the fitting, fading upward and to the sides. */
function washTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(128, 256);
  for (let y = 0; y < 256; y++) {
    // Canvas rows run top to bottom: the bottom row is the fitting (height 0)
    const height = 1 - y / 255;
    for (let x = 0; x < 128; x++) {
      const across = (x - 63.5) / 63.5;
      // The cone widens as it rises
      const spread = 0.25 + 0.75 * Math.min(1, height * 1.6);
      const side = Math.max(0, 1 - (across * across) / (spread * spread));
      const fadeUp = Math.pow(1 - height, 1.6) * Math.min(1, height * 9);
      const value = Math.round(255 * side * side * fadeUp);
      const i = (y * 128 + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
