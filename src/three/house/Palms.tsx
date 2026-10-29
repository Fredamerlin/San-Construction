import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { taperedTube } from './geometry';

/**
 * Coconut palms, generated in code: a curved, tapering trunk and a crown of arching fronds.
 * Frond leaflets come from a small canvas-drawn texture with transparency, so the whole
 * grove is a few hundred triangles per palm and no downloads. All fronds of all palms share
 * one instanced mesh (one draw call), and so do the coconuts.
 */

export interface PalmSpec {
  x: number;
  z: number;
  height: number;
  /** Lean direction (radians around y) and amount (metres of offset at the crown). */
  leanAngle: number;
  lean: number;
}

// Deterministic pseudo-random, so the grove looks the same on every load and in stills
function rand(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function frondTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 512);
  // Leaflets: angled strokes from the midrib to the edges, pointing toward the tip (top)
  for (let i = 0; i < 70; i++) {
    const y = 500 - i * 7;
    for (const side of [-1, 1]) {
      const shade = 70 + Math.floor(rand(i * 3 + side) * 50);
      ctx.strokeStyle = `rgb(${shade - 25}, ${shade + 35}, ${Math.floor(shade * 0.45)})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.quadraticCurveTo(64 + side * 34, y - 16, 64 + side * 62, y - 34 + rand(i + side) * 8);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = '#6d6a3a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(64, 512);
  ctx.lineTo(64, 0);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function trunkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < 256; y++) {
    // Leaf-scar rings: dark bands every 16px with lighter bark between
    const ring = Math.pow(Math.abs(Math.sin((y / 16) * Math.PI)), 6);
    const base = 120 - ring * 55 + rand(y) * 12;
    ctx.fillStyle = `rgb(${base}, ${base * 0.9}, ${base * 0.78})`;
    ctx.fillRect(0, y, 64, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** One arching frond along local +x: V-folded ribbon, widest in the middle, drooping at the tip. */
function frondGeometry(length: number, width: number) {
  const segments = 12;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = t * length;
    const y = length * (0.42 * t - 0.78 * t * t);
    const w = width * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - 0.25 * t);
    const fold = w * 0.28; // leaflets rise from the midrib in a shallow V
    positions.push(x, y + fold, -w / 2, x, y, 0, x, y + fold, w / 2);
    uvs.push(0, t, 0.5, t, 1, t);
    if (i < segments) {
      const a = i * 3;
      indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function trunkCurve(palm: PalmSpec) {
  const dx = Math.cos(palm.leanAngle) * palm.lean;
  const dz = Math.sin(palm.leanAngle) * palm.lean;
  // Bends more near the top, like a palm that has grown toward the light
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(palm.x, -0.2, palm.z),
    new THREE.Vector3(palm.x + dx * 0.15, palm.height * 0.35, palm.z + dz * 0.15),
    new THREE.Vector3(palm.x + dx * 0.45, palm.height * 0.7, palm.z + dz * 0.45),
    new THREE.Vector3(palm.x + dx, palm.height, palm.z + dz),
  ]);
}

const FRONDS_PER_PALM = 18;

export function Palms({ palms }: { palms: PalmSpec[] }) {
  const frondsRef = useRef<THREE.InstancedMesh>(null);
  const nutsRef = useRef<THREE.InstancedMesh>(null);

  const assets = useMemo(() => {
    const leaf = frondTexture();
    const bark = trunkTexture();
    const frondMaterial = new THREE.MeshStandardMaterial({
      map: leaf,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.8,
      color: '#c8d6a8',
    });
    // Shadows need the same cut-out, or fronds would cast solid ribbon shadows
    const frondDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leaf, alphaTest: 0.45 });
    const trunkMaterial = new THREE.MeshStandardMaterial({ map: bark, roughness: 0.95, color: '#857563' });
    const nutMaterial = new THREE.MeshStandardMaterial({ color: '#4d5a22', roughness: 0.6 });
    return {
      frond: frondGeometry(3.4, 1.25),
      nut: new THREE.SphereGeometry(0.13, 8, 6),
      frondMaterial,
      frondDepth,
      trunkMaterial,
      nutMaterial,
    };
  }, []);

  const trunks = useMemo(() => palms.map((palm) => ({ curve: trunkCurve(palm), geometry: taperedTube(trunkCurve(palm), 16, 8, 0.2, 0.13) })), [palms]);

  useLayoutEffect(() => {
    const fronds = frondsRef.current;
    const nuts = nutsRef.current;
    if (!fronds || !nuts) return;
    const dummy = new THREE.Object3D();
    const top = new THREE.Vector3();
    let f = 0;
    let n = 0;
    palms.forEach((_palm, p) => {
      trunks[p]!.curve.getPointAt(1, top);
      for (let k = 0; k < FRONDS_PER_PALM; k++) {
        const r = rand(p * 31 + k);
        // Golden-angle spiral around the crown; upper fronds rise, older ones droop
        const yaw = k * 2.39996 + p;
        const age = k / FRONDS_PER_PALM;
        const pitch = THREE.MathUtils.lerp(0.75, -0.55, age) + (r - 0.5) * 0.25;
        dummy.position.copy(top);
        dummy.rotation.set(0, yaw, 0, 'YXZ');
        dummy.rotateZ(pitch);
        dummy.rotateX((r - 0.5) * 0.5); // slight twist
        const s = 0.8 + r * 0.35;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        fronds.setMatrixAt(f++, dummy.matrix);
      }
      for (let k = 0; k < 5; k++) {
        const a = k * 1.3 + p;
        dummy.position.set(top.x + Math.cos(a) * 0.22, top.y - 0.25 - rand(k + p) * 0.15, top.z + Math.sin(a) * 0.22);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        nuts.setMatrixAt(n++, dummy.matrix);
      }
    });
    fronds.instanceMatrix.needsUpdate = true;
    nuts.instanceMatrix.needsUpdate = true;
    fronds.computeBoundingSphere();
    nuts.computeBoundingSphere();
  }, [palms, trunks]);

  return (
    <group>
      {trunks.map((trunk, i) => (
        <mesh key={i} geometry={trunk.geometry} material={assets.trunkMaterial} castShadow receiveShadow />
      ))}
      <instancedMesh
        ref={frondsRef}
        args={[assets.frond, assets.frondMaterial, palms.length * FRONDS_PER_PALM]}
        customDepthMaterial={assets.frondDepth}
        castShadow
        receiveShadow
      />
      <instancedMesh ref={nutsRef} args={[assets.nut, assets.nutMaterial, palms.length * 5]} castShadow />
    </group>
  );
}
