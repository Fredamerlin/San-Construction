import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cachedBox, meterBox, ringFaces, slopedFaces } from './geometry';
import { GATE, HOUSE, PLOT, PORCH, ROAD } from './layout';
import type { HouseMaterials } from './materials';
import { Palms, type PalmSpec } from './Palms';
import { useStaticMerge } from './staticMerge';

/**
 * The plot around the house: lawn, granite paving and drive, a compound wall with gate
 * pillars and lamps, an open timber-and-steel gate, the road outside, garden lights,
 * coconut palms, and two neighbouring houses in the distance for depth.
 */

const WALL_H = 1.1;
const WALL_T = 0.22;
const PILLAR = 0.62;
const PILLAR_H = 1.6;

/** Plane lying flat with UVs in metres. */
function groundPlane(width: number, depth: number) {
  const geometry = new THREE.PlaneGeometry(width, depth);
  geometry.rotateX(-Math.PI / 2);
  const uv = geometry.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width, uv.getY(i) * depth);
  return geometry;
}

const PALMS: PalmSpec[] = [
  // Inside the plot, framing the house
  { x: -10.6, z: 2.5, height: 9.5, leanAngle: Math.PI, lean: 1.2 },
  { x: -12.6, z: -6.5, height: 11, leanAngle: Math.PI * 0.8, lean: 1.6 },
  { x: 10.8, z: -0.5, height: 10.2, leanAngle: 0.2, lean: 1.4 },
  { x: 12.4, z: -9.5, height: 9, leanAngle: -0.4, lean: 1 },
  { x: -4.5, z: -13.5, height: 11.5, leanAngle: -2.2, lean: 1.3 },
  { x: 5.5, z: -14.5, height: 10.4, leanAngle: -1, lean: 1.5 },
  { x: -12.4, z: 11.2, height: 7.6, leanAngle: 2.6, lean: 1.4 },
  { x: 12.8, z: 11.6, height: 8.4, leanAngle: 0.6, lean: 1.2 },
  // Beyond the plot, for depth and silhouette
  { x: -22, z: 28, height: 9, leanAngle: 2, lean: 1.8 },
  { x: 9, z: 29, height: 10.5, leanAngle: 1.1, lean: 1.4 },
  { x: 25, z: 6, height: 11, leanAngle: 0.3, lean: 2 },
  { x: -26, z: -4, height: 10, leanAngle: 3, lean: 1.5 },
  { x: -18, z: -25, height: 12, leanAngle: -2, lean: 1.6 },
  { x: 16, z: -27, height: 11, leanAngle: -0.6, lean: 1.8 },
  { x: 33, z: -12, height: 12.5, leanAngle: 0.4, lean: 1.2 },
  { x: -36, z: 12, height: 11.5, leanAngle: 2.8, lean: 1.6 },
];

// Deterministic pseudo-random, so the landscape is identical on every load and in stills
function rand(seed: number) {
  const s = Math.sin(seed * 91.7 + 47.3) * 43758.5453;
  return s - Math.floor(s);
}

/** Scattered positions in a ring around the plot, kept off the plot, the road and the neighbours. */
function scatter(count: number, seed: number, minR: number, maxR: number) {
  const out: [number, number][] = [];
  for (let i = 0; out.length < count && i < count * 20; i++) {
    const a = rand(seed + i * 2) * Math.PI * 2;
    const r = minR + rand(seed + i * 2 + 1) * (maxR - minR);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const onPlot = x > PLOT.x0 - 2 && x < PLOT.x1 + 2 && z > PLOT.z0 - 2 && z < PLOT.z1 + 1;
    const onRoad = z > PLOT.z1 - 1 && z < ROAD.z1 + 2.5;
    const nearNeighbour = NEIGHBOURS.some(([nx, nz]) => Math.abs(x - nx) < 9 && Math.abs(z - nz) < 8);
    if (!onPlot && !onRoad && !nearNeighbour) out.push([x, z]);
  }
  return out;
}

const NEIGHBOURS: [number, number][] = [
  [-36, -12],
  [40, -15],
  [-14, 40],
  [18, 42],
  [-4, -38],
];

// A grove of palms beyond the plot, so the house sits in a Kerala landscape rather than a plain
const ALL_PALMS: PalmSpec[] = [
  ...PALMS,
  ...scatter(34, 7, 26, 95).map(([x, z], i) => ({
    x,
    z,
    height: 9 + rand(i + 300) * 6,
    leanAngle: rand(i + 400) * Math.PI * 2,
    lean: 0.8 + rand(i + 500) * 1.6,
  })),
];

/**
 * Foliage mass shared by trees and shrubs: a smooth, lumpy sphere (icosphere pushed in and
 * out by a few overlapping waves), shaded with the leafy grass texture for leaf-scale detail.
 * Each instance gets its own green, so rows of shrubs don't look cloned.
 */
let foliageGeometry: THREE.BufferGeometry | null = null;
function getFoliageGeometry() {
  if (foliageGeometry) return foliageGeometry;
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 3);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  const uvs: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const n =
      1 +
      0.16 * Math.sin(3.1 * p.x + 1.3) * Math.sin(2.7 * p.y + 0.4) * Math.sin(3.3 * p.z + 2.1) +
      0.07 * Math.sin(8.3 * p.x + 2) * Math.sin(7.9 * p.z + 1);
    pos.setXYZ(i, p.x * n, p.y * n * 0.82, p.z * n);
    // Simple spherical UVs; seams are hidden by the noisy texture
    uvs.push(Math.atan2(p.z, p.x) * 1.2, p.y * 1.6);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  foliageGeometry = g;
  return g;
}

function useFoliageMaterial(materials: HouseMaterials) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: materials.grass.map,
        normalMap: materials.grass.normalMap,
        normalScale: new THREE.Vector2(1.6, 1.6),
        roughness: 0.92,
        color: '#ffffff',
      }),
    [materials],
  );
}

const leafGreens = ['#3c5530', '#2f4727', '#46603a', '#344d2b', '#52683c'].map((c) => new THREE.Color(c));

/** Broadleaf trees (mango, jackfruit) as clustered canopies on short trunks, all instanced. */
function Trees({ materials }: { materials: HouseMaterials }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => scatter(46, 91, 24, 110), []);
  const canopyGeometry = getFoliageGeometry();
  const canopyMaterial = useFoliageMaterial(materials);
  const blobs = 3;

  useLayoutEffect(() => {
    const t = trunks.current;
    const c = canopies.current;
    if (!t || !c) return;
    const dummy = new THREE.Object3D();
    spots.forEach(([x, z], i) => {
      const size = 3 + rand(i + 700) * 3;
      dummy.position.set(x, size * 0.45, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.35, size * 0.9, 0.35);
      dummy.updateMatrix();
      t.setMatrixAt(i, dummy.matrix);
      for (let k = 0; k < blobs; k++) {
        const a = rand(i * 5 + k) * Math.PI * 2;
        dummy.position.set(x + Math.cos(a) * size * 0.45, size * (1.05 + rand(i + k * 9) * 0.35), z + Math.sin(a) * size * 0.45);
        dummy.rotation.set(0, a, 0);
        const s = size * (0.65 + rand(i * 3 + k) * 0.3);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        c.setMatrixAt(i * blobs + k, dummy.matrix);
        c.setColorAt(i * blobs + k, leafGreens[(i + k) % leafGreens.length]!.clone().multiplyScalar(0.7));
      }
    });
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
    t.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;
    t.computeBoundingSphere();
    c.computeBoundingSphere();
  }, [spots]);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, materials.woodDark, spots.length]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 1, 6]} />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[canopyGeometry, canopyMaterial, spots.length * blobs]} castShadow receiveShadow />
    </>
  );
}

export function Site({ materials }: { materials: HouseMaterials }) {
  const root = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    root.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh) return;
      const basic = object.material instanceof THREE.MeshBasicMaterial;
      object.receiveShadow = !basic;
      object.castShadow = !basic && object.userData.noShadow !== true;
    });
  }, []);
  useStaticMerge(root);

  const plotW = PLOT.x1 - PLOT.x0;
  const plotD = PLOT.z1 - PLOT.z0;
  const geometries = useMemo(
    () => ({
      ground: groundPlane(400, 400),
      lawn: groundPlane(plotW, plotD),
      apron: groundPlane(HOUSE.x1 - HOUSE.x0 + 2.6, 18.2),
      drive: groundPlane(GATE.x1 - GATE.x0, PLOT.z1 + 1 - 10.4),
      road: groundPlane(220, ROAD.z1 - ROAD.z0),
      footpath: groundPlane(220, ROAD.z0 - PLOT.z1),
    }),
    [plotW, plotD],
  );

  return (
    <group ref={root}>
      {/* Surrounding land fades into the fog */}
      <mesh geometry={geometries.ground} material={materials.field} position-y={-0.02} userData={{ noShadow: true }} />
      <mesh geometry={geometries.lawn} material={materials.grass} position={[(PLOT.x0 + PLOT.x1) / 2, 0, (PLOT.z0 + PLOT.z1) / 2]} userData={{ noShadow: true }} />
      {/* Granite apron around the house, and the drive out to the gate */}
      <mesh geometry={geometries.apron} material={materials.granite} position={[0, 0.012, 1.5]} userData={{ noShadow: true }} />
      <mesh geometry={geometries.drive} material={materials.granite} position={[0, 0.014, (10.4 + PLOT.z1 + 1) / 2]} userData={{ noShadow: true }} />
      <mesh geometry={geometries.footpath} material={materials.granite} position={[0, 0.01, (PLOT.z1 + ROAD.z0) / 2]} userData={{ noShadow: true }} />
      <mesh geometry={geometries.road} material={materials.asphalt} position={[0, 0.005, (ROAD.z0 + ROAD.z1) / 2]} userData={{ noShadow: true }} />
      <RoadMarkings />
      <Kerbs materials={materials} />

      <CompoundWall materials={materials} />
      <Gate materials={materials} open={0.75} />
      <Hedges materials={materials} />
      <GardenLights materials={materials} />
      <StreetLamp materials={materials} x={-19} />
      <StreetLamp materials={materials} x={21} />
      <Palms palms={ALL_PALMS} />
      <Trees materials={materials} />
      {NEIGHBOURS.map(([x, z]) => (
        <Neighbour key={`${x},${z}`} materials={materials} x={x} z={z} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------- wall and gate */

function CompoundWall({ materials }: { materials: HouseMaterials }) {
  const pillarX = GATE.x1 + PILLAR / 2;
  const segments = useMemo(() => {
    // [x0, z0, x1, z1] centre lines
    const front = PLOT.z1;
    return [
      [PLOT.x0, front, -pillarX - PILLAR / 2, front],
      [pillarX + PILLAR / 2, front, PLOT.x1, front],
      [PLOT.x1, front, PLOT.x1, PLOT.z0],
      [PLOT.x1, PLOT.z0, PLOT.x0, PLOT.z0],
      [PLOT.x0, PLOT.z0, PLOT.x0, front],
    ].map(([ax, az, bx, bz]) => {
      const length = Math.hypot(bx! - ax!, bz! - az!);
      return {
        position: new THREE.Vector3((ax! + bx!) / 2, 0, (az! + bz!) / 2),
        rotation: Math.atan2(-(bz! - az!), bx! - ax!),
        body: meterBox(length, WALL_H, WALL_T),
        cap: meterBox(length + 0.1, 0.08, WALL_T + 0.12),
      };
    });
  }, [pillarX]);
  const pillar = useMemo(() => meterBox(PILLAR, PILLAR_H, PILLAR), []);
  const pillarCap = useMemo(() => meterBox(PILLAR + 0.14, 0.1, PILLAR + 0.14), []);

  return (
    <group>
      {segments.map((s, i) => (
        <group key={i} position={s.position} rotation-y={s.rotation}>
          <mesh geometry={s.body} material={materials.plaster} position-y={WALL_H / 2} />
          <mesh geometry={s.cap} material={materials.granite} position-y={WALL_H + 0.04} />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * pillarX, 0, PLOT.z1]}>
          <mesh geometry={pillar} material={materials.plaster} position-y={PILLAR_H / 2} />
          <mesh geometry={pillarCap} material={materials.granite} position-y={PILLAR_H + 0.05} />
          {/* Lantern on the pillar */}
          <mesh material={materials.metal} position-y={PILLAR_H + 0.16}>
            <boxGeometry args={[0.3, 0.04, 0.3]} />
          </mesh>
          <mesh material={materials.lampWarm} position-y={PILLAR_H + 0.36}>
            <boxGeometry args={[0.2, 0.34, 0.2]} />
          </mesh>
          <mesh material={materials.metal} position-y={PILLAR_H + 0.57}>
            <coneGeometry args={[0.2, 0.14, 4]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Two gate leaves: a steel frame with horizontal teak slats, hinged at the pillars. */
function Gate({ materials, open }: { materials: HouseMaterials; open: number }) {
  const leaf = (GATE.x1 - GATE.x0) / 2;
  const height = 1.15;
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * GATE.x1, 0.05, PLOT.z1]} rotation-y={-side * open * 1.3}>
          <group position-x={-side * leaf / 2}>
            {/* Frame */}
            {[
              { size: [leaf, 0.06, 0.06], pos: [0, height, 0] },
              { size: [leaf, 0.06, 0.06], pos: [0, 0.1, 0] },
              { size: [0.06, height, 0.06], pos: [-leaf / 2 + 0.03, height / 2 + 0.05, 0] },
              { size: [0.06, height, 0.06], pos: [leaf / 2 - 0.03, height / 2 + 0.05, 0] },
            ].map((b, i) => (
              <mesh key={i} material={materials.metal} position={b.pos as [number, number, number]}>
                <boxGeometry args={b.size as [number, number, number]} />
              </mesh>
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} material={materials.wood} position={[0, 0.25 + i * 0.15, 0]}>
                <boxGeometry args={[leaf - 0.1, 0.1, 0.035]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------- garden */

/** Rows of shrubs inside the compound wall, and a few clumps around the house. */
function Hedges({ materials }: { materials: HouseMaterials }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = getFoliageGeometry();
  const material = useFoliageMaterial(materials);
  const spots = useMemo(() => {
    const list: [number, number, number][] = [];
    const row = (x0: number, z0: number, x1: number, z1: number) => {
      const length = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.floor(length / 0.75);
      for (let i = 0; i <= n; i++) list.push([x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, 0.45 + rand(list.length) * 0.2]);
    };
    row(PLOT.x0 + 0.7, PLOT.z1 - 0.7, GATE.x0 - 1.2, PLOT.z1 - 0.7);
    row(GATE.x1 + 1.2, PLOT.z1 - 0.7, PLOT.x1 - 0.7, PLOT.z1 - 0.7);
    row(PLOT.x0 + 0.7, PLOT.z1 - 1.5, PLOT.x0 + 0.7, PLOT.z0 + 0.8);
    row(PLOT.x1 - 0.7, PLOT.z1 - 1.5, PLOT.x1 - 0.7, PLOT.z0 + 0.8);
    // Planting beds along the front of the house, either side of the porch
    row(HOUSE.x0 + 0.2, HOUSE.z1 + 1.9, PORCH.x0 - 0.9, HOUSE.z1 + 1.9);
    row(-PORCH.x0 + 0.9, HOUSE.z1 + 1.9, HOUSE.x1 - 0.2, HOUSE.z1 + 1.9);
    return list;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    spots.forEach(([x, z, s], i) => {
      dummy.position.set(x, s * 0.7, z);
      dummy.rotation.set(0, rand(i + 900) * 6.28, 0);
      dummy.scale.set(s * 1.2, s, s * 1.2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, leafGreens[i % leafGreens.length]!);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [spots]);

  return <instancedMesh ref={ref} args={[geometry, material, spots.length]} castShadow receiveShadow />;
}


/** Low bollard lights lining the drive. */
function GardenLights({ materials }: { materials: HouseMaterials }) {
  const posts = useMemo(() => {
    const list: [number, number][] = [];
    for (let z = 10.8; z < PLOT.z1 - 0.8; z += 1.4) list.push([GATE.x0 - 0.35, z], [GATE.x1 + 0.35, z]);
    // Along the side and back gardens, inside the shrub rows
    for (let z = 10; z > PLOT.z0 + 1; z -= 3.2) list.push([PLOT.x1 - 1.6, z], [PLOT.x0 + 1.6, z]);
    for (let x = -11; x <= 11; x += 3.6) list.push([x, PLOT.z0 + 1.6]);
    return list;
  }, []);
  return (
    <>
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={materials.metal} position-y={0.3}>
            <cylinderGeometry args={[0.07, 0.08, 0.6, 10]} />
          </mesh>
          <mesh material={materials.lampSoft} position-y={0.52}>
            <cylinderGeometry args={[0.072, 0.072, 0.08, 10]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------- road */

function Kerbs({ materials }: { materials: HouseMaterials }) {
  const kerb = useMemo(() => meterBox(220, 0.15, 0.25), []);
  return (
    <>
      <mesh geometry={kerb} material={materials.concrete} position={[0, 0.075, ROAD.z0]} />
      <mesh geometry={kerb} material={materials.concrete} position={[0, 0.075, ROAD.z1]} />
    </>
  );
}

function RoadMarkings() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 36;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(-105 + i * 6, 0.012, (ROAD.z0 + ROAD.z1) / 2);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} receiveShadow>
      <planeGeometry args={[2.6, 0.14]} />
      <meshStandardMaterial color="#d8d4c8" roughness={0.8} />
    </instancedMesh>
  );
}

function StreetLamp({ materials, x }: { materials: HouseMaterials; x: number }) {
  const z = ROAD.z0 - 0.4;
  return (
    <group position={[x, 0, z]}>
      <mesh material={materials.metal} position-y={3.2}>
        <cylinderGeometry args={[0.06, 0.09, 6.4, 10]} />
      </mesh>
      <mesh material={materials.metal} position={[0, 6.3, 0.7]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
      </mesh>
      <mesh material={materials.metal} position={[0, 6.32, 1.4]}>
        <boxGeometry args={[0.32, 0.1, 0.6]} />
      </mesh>
      <mesh material={materials.lampWarm} position={[0, 6.26, 1.4]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[0.26, 0.5]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------- neighbours */

/**
 * A neighbouring house, kept simple but recognisably local: plaster walls, a tiled skirt roof
 * between floors and a hipped tile roof, framed windows with sunshades on every side, a few lit.
 */
function Neighbour({ materials, x, z }: { materials: HouseMaterials; x: number; z: number }) {
  const w = 11;
  const d = 9;
  const h = 6.4;
  const geometry = useMemo(() => {
    const o = 0.7;
    const outer = { x0: -w / 2 - o, x1: w / 2 + o, z0: -d / 2 - o, z1: d / 2 + o, y: h };
    const half = (outer.x1 - outer.x0 - (outer.z1 - outer.z0)) / 2;
    const skirtTop = 3.55;
    const skirt = { x0: -w / 2 - 0.9, x1: w / 2 + 0.9, z0: -d / 2 - 0.9, z1: d / 2 + 0.9, y: skirtTop - 0.45 };
    return {
      body: meterBox(w, h, d),
      roof: slopedFaces(ringFaces(outer, { x0: -half, x1: half, z0: 0, z1: 0, y: h + 3 })),
      skirt: slopedFaces(ringFaces(skirt, { x0: -w / 2, x1: w / 2, z0: -d / 2, z1: d / 2, y: skirtTop })),
    };
  }, []);
  // Two windows per face per floor: [side angle, offset along the face, height]
  const windows = useMemo(() => {
    const list: { angle: number; along: number; y: number; half: number; lit: boolean }[] = [];
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((angle, f) => {
      const half = f % 2 === 0 ? d / 2 : w / 2;
      const span = f % 2 === 0 ? w : d;
      for (const y of [1.7, 4.9]) for (const s of [-1, 1]) list.push({ angle, along: (s * span) / 4, y, half, lit: (f + (y > 3 ? 1 : 0) + (s > 0 ? 1 : 0)) % 3 === 0 });
    });
    return list;
  }, []);
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geometry.body} material={materials.plasterWarm} position-y={h / 2} />
      <mesh geometry={geometry.roof} material={materials.roof} />
      <mesh geometry={geometry.skirt} material={materials.roof} />
      {windows.map((win, i) => (
        <group key={i} rotation-y={win.angle}>
          <group position={[win.along, win.y, win.half]}>
            <mesh geometry={cachedBox(1.75, 1.45, 0.08)} material={materials.woodDark} />
            <mesh material={win.lit ? materials.lampSoft : materials.glass} position-z={0.045}>
              <planeGeometry args={[1.55, 1.25]} />
            </mesh>
            <mesh geometry={cachedBox(2.1, 0.07, 0.5)} material={materials.paint} position={[0, 0.88, 0.25]} />
          </group>
        </group>
      ))}
    </group>
  );
}
