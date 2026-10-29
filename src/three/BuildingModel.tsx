import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Procedural mid-rise mixed-use building, built entirely in code (no model file, no licence).
 *
 * It can be shown at any construction stage from 0 to 6, matching the six process steps:
 *   0–1 survey lines on the site       3–4 structural frame, floor by floor
 *   1–2 wireframe of the design        4–5 glazing and fins, floor by floor
 *   2–3 foundations / plinth           5–6 windows light up, roof plant appears
 * The home hero shows stage 6 (complete).
 *
 * Performance: one shared unit-box geometry (scaled per mesh) and instanced meshes for
 * repeated parts (columns, fins, lit windows) keep geometry memory and draw calls low.
 */

export interface BuildingModelProps {
  /** Target stage 0–6. Read every frame, so a ref can be driven by scrolling without re-renders. */
  stage: { current: number };
  /** Multiplier for window glow (the hero warms the windows as you scroll). */
  glow?: { current: number };
}

// --- Dimensions (metres) ---
const W = 18; // width along x
const D = 12; // depth along z
const SLAB = 0.42;
const PLINTH = 0.35;
const FLOOR_HEIGHTS = [4.4, 3.5, 3.5, 3.5, 3.5, 3.5];
const CANTILEVER = 3.6; // upper two floors shift +x
const FLOOR_COUNT = FLOOR_HEIGHTS.length;

interface Floor {
  index: number;
  y: number;
  height: number;
  x: number;
}

const FLOORS: Floor[] = FLOOR_HEIGHTS.map((height, index) => ({
  index,
  height,
  y: PLINTH + FLOOR_HEIGHTS.slice(0, index).reduce((sum, h) => sum + h, 0),
  x: index >= 4 ? CANTILEVER : 0,
}));
const TOP = PLINTH + FLOOR_HEIGHTS.reduce((sum, h) => sum + h, 0);

// Deterministic pseudo-random, so lit windows are the same on every render and in stills
function hash(a: number, b: number) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const smooth = (value: number, from: number, to: number) => {
  const t = THREE.MathUtils.clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};

// Unit box with its base at y = 0, so scaling y grows a part upward from the ground
function makeUnitBox() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);
  return geometry;
}
function makeUnitPlane() {
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.translate(0, 0.5, 0);
  return geometry;
}

// Window pane colours: warm interiors at varied brightness, and unlit panes with a faint cool cast
const WARM_LOW = new THREE.Color('#f59a4e');
const WARM_HIGH = new THREE.Color('#ffd7a1');
const UNLIT = new THREE.Color('#141a20');

export function BuildingModel({ stage, glow }: BuildingModelProps) {
  const box = useMemo(() => makeUnitBox(), []);
  const plane = useMemo(() => makeUnitPlane(), []);

  const materials = useMemo(
    () => ({
      concrete: new THREE.MeshStandardMaterial({ color: '#8b867e', roughness: 0.88, metalness: 0 }),
      slab: new THREE.MeshStandardMaterial({ color: '#a29c92', roughness: 0.82 }),
      glass: new THREE.MeshStandardMaterial({ color: '#18202a', roughness: 0.12, metalness: 0.85, envMapIntensity: 1.7 }),
      fin: new THREE.MeshStandardMaterial({ color: '#4d3d2b', roughness: 0.42, metalness: 0.7 }),
      // Per-pane colours come from instance colours; this material colour acts as a dimmer
      windows: new THREE.MeshBasicMaterial({ color: '#000000', toneMapped: false }),
      plinth: new THREE.MeshStandardMaterial({ color: '#2b2926', roughness: 0.95 }),
      survey: new THREE.LineBasicMaterial({ color: '#b8945b', transparent: true, opacity: 0, depthWrite: false }),
      wire: new THREE.LineBasicMaterial({ color: '#cfae7a', transparent: true, opacity: 0, depthWrite: false }),
    }),
    [],
  );

  const surveyGeometry = useMemo(() => {
    const points: number[] = [];
    const line = (x1: number, z1: number, x2: number, z2: number) => points.push(x1, 0.03, z1, x2, 0.03, z2);
    // Site boundary
    const sx = 17;
    const sz = 12.5;
    line(-sx, -sz, sx, -sz);
    line(sx, -sz, sx, sz);
    line(sx, sz, -sx, sz);
    line(-sx, sz, -sx, -sz);
    // Setting-out grid along the column lines, running past the footprint like survey strings
    for (const x of [-8.4, -2.8, 2.8, 8.4, 8.4 + CANTILEVER]) line(x, -sz - 2, x, sz + 2);
    for (const z of [-5.4, 0, 5.4]) line(-sx - 2, z, sx + 2, z);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  const wireGeometry = useMemo(() => {
    const positions: number[] = [];
    for (const floor of FLOORS) {
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(W, floor.height, D));
      edges.translate(floor.x, floor.y + floor.height / 2, 0);
      positions.push(...(edges.attributes.position?.array ?? []));
      edges.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  // Per-floor groups, collected by ref so the frame loop can grow them without re-rendering
  const frameGroups = useRef<(THREE.Group | null)[]>([]);
  const envelopeGroups = useRef<(THREE.Group | null)[]>([]);
  const plinthRef = useRef<THREE.Mesh>(null);
  const roofRef = useRef<THREE.Group>(null);
  const shown = useRef(-1);
  const applied = useRef({ stage: -1, glow: -1 });

  useFrame((_, delta) => {
    const target = stage.current;
    // Ease toward the target stage so scroll-driven changes read as construction, not jumps
    shown.current = shown.current < 0 ? target : THREE.MathUtils.damp(shown.current, target, 3.2, delta);
    if (Math.abs(shown.current - target) < 0.0005) shown.current = target;

    const s = shown.current;
    const g = glow?.current ?? 1;
    if (Math.abs(applied.current.stage - s) < 0.0001 && Math.abs(applied.current.glow - g) < 0.001) return;
    applied.current = { stage: s, glow: g };

    materials.survey.opacity = 0.8 * smooth(s, 0, 0.8) * (1 - smooth(s, 3, 4));
    materials.wire.opacity = 0.75 * smooth(s, 1, 1.8) * (1 - smooth(s, 4.2, 5.2));

    const plinth = plinthRef.current;
    if (plinth) {
      const t = smooth(s, 2, 2.8);
      plinth.visible = t > 0.001;
      plinth.scale.y = Math.max(t, 0.001) * PLINTH;
    }

    // Floors appear one after another within each stage band
    const grow = (group: THREE.Group | null | undefined, start: number, index: number) => {
      if (!group) return;
      const t = THREE.MathUtils.clamp((s - start) * FLOOR_COUNT - index, 0, 1);
      const eased = t * t * (3 - 2 * t);
      group.visible = eased > 0.001;
      group.scale.y = Math.max(eased, 0.001);
    };
    FLOORS.forEach((floor) => {
      grow(frameGroups.current[floor.index], 3, floor.index);
      grow(envelopeGroups.current[floor.index], 4, floor.index);
    });

    const lights = smooth(s, 5, 6);
    materials.windows.color.setScalar(lights * g);
    if (roofRef.current) {
      roofRef.current.visible = lights > 0.001;
      roofRef.current.scale.y = Math.max(lights, 0.001);
    }
  });

  return (
    <group>
      <lineSegments geometry={surveyGeometry} material={materials.survey} />
      <lineSegments geometry={wireGeometry} material={materials.wire} />

      <mesh ref={plinthRef} geometry={box} material={materials.plinth} position={[CANTILEVER / 2, 0, 0]} scale={[W + CANTILEVER + 6, PLINTH, D + 6]} />

      {FLOORS.map((floor) => (
        <group
          key={`frame-${floor.index}`}
          ref={(group) => {
            frameGroups.current[floor.index] = group;
          }}
          position={[floor.x, floor.y, 0]}
        >
          <FloorFrame floor={floor} box={box} concrete={materials.concrete} slab={materials.slab} />
        </group>
      ))}

      {FLOORS.map((floor) => (
        <group
          key={`envelope-${floor.index}`}
          ref={(group) => {
            envelopeGroups.current[floor.index] = group;
          }}
          position={[floor.x, floor.y, 0]}
        >
          <FloorEnvelope floor={floor} box={box} plane={plane} materials={materials} />
        </group>
      ))}

      {/* Roof slab and plant enclosure */}
      <group ref={roofRef} position={[CANTILEVER, TOP, 0]}>
        <mesh geometry={box} material={materials.slab} scale={[W + 0.6, SLAB, D + 0.6]} />
        <mesh geometry={box} material={materials.concrete} position={[-3, SLAB, -1]} scale={[6.5, 1.8, 4.5]} />
      </group>
    </group>
  );
}

/** Floor slab plus perimeter columns. */
function FloorFrame({
  floor,
  box,
  concrete,
  slab,
}: {
  floor: Floor;
  box: THREE.BufferGeometry;
  concrete: THREE.Material;
  slab: THREE.Material;
}) {
  const columnsRef = useRef<THREE.InstancedMesh>(null);
  const columnHeight = floor.height - SLAB;
  const columns = useMemo(() => {
    const list: [number, number][] = [];
    for (const x of [-8.4, -2.8, 2.8, 8.4]) for (const z of [-5.4, 5.4]) list.push([x, z]);
    return list;
  }, []);

  useLayoutEffect(() => {
    const mesh = columnsRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    columns.forEach(([x, z], i) => {
      dummy.position.set(x, SLAB, z);
      dummy.scale.set(0.55, columnHeight, 0.55);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [columns, columnHeight]);

  return (
    <>
      <mesh geometry={box} material={slab} scale={[W + 0.6, SLAB, D + 0.6]} />
      <instancedMesh ref={columnsRef} args={[box, concrete, columns.length]} />
    </>
  );
}

/** Recessed glazing, bronze fins and lit window bays for one floor. */
function FloorEnvelope({
  floor,
  box,
  plane,
  materials,
}: {
  floor: Floor;
  box: THREE.BufferGeometry;
  plane: THREE.BufferGeometry;
  materials: { glass: THREE.Material; fin: THREE.Material; windows: THREE.Material };
}) {
  const finsRef = useRef<THREE.InstancedMesh>(null);
  const windowsRef = useRef<THREE.InstancedMesh>(null);
  const height = floor.height - SLAB;
  const isGround = floor.index === 0;

  const { fins, windows } = useMemo(() => {
    const finList: { x: number; z: number; sx: number; sz: number }[] = [];
    const windowList: { x: number; z: number; w: number; rotY: number; color: THREE.Color }[] = [];
    const paneColour = (lit: boolean, seed: number) =>
      lit ? WARM_LOW.clone().lerp(WARM_HIGH, seed).multiplyScalar(0.55 + seed * 0.35) : UNLIT.clone();
    const frontZ = D / 2 - 0.55;
    const sideX = W / 2 - 0.55;

    if (!isGround) {
      for (let x = -W / 2 + 1; x <= W / 2 - 1 + 0.01; x += 1.2) finList.push({ x, z: frontZ + 0.35, sx: 0.12, sz: 0.7 });
      for (let z = -D / 2 + 1; z <= D / 2 - 1 + 0.01; z += 1.2) finList.push({ x: sideX + 0.35, z, sx: 0.7, sz: 0.12 });
    }

    // Lit bays sit a hair in front of the (opaque, reflective) glass face, between the fins.
    // The ground floor (shopfronts) is mostly lit, upper floors about 45%.
    const litChance = isGround ? 0.85 : 0.45;
    for (let k = 0; k < 7; k++) {
      const x = -W / 2 + 1.9 + k * 2.4;
      const lit = hash(floor.index, k) < litChance;
      windowList.push({ x, z: frontZ + 0.02, w: 2.1, rotY: 0, color: paneColour(lit, hash(k, floor.index + 3)) });
    }
    for (let k = 0; k < 4; k++) {
      const z = -D / 2 + 2 + k * 2.6;
      const lit = hash(floor.index + 10, k) < litChance;
      windowList.push({ x: sideX + 0.02, z, w: 2.3, rotY: Math.PI / 2, color: paneColour(lit, hash(k + 7, floor.index)) });
    }
    return { fins: finList, windows: windowList };
  }, [floor.index, isGround]);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const finMesh = finsRef.current;
    if (finMesh) {
      fins.forEach((fin, i) => {
        dummy.position.set(fin.x, SLAB, fin.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(fin.sx, height, fin.sz);
        dummy.updateMatrix();
        finMesh.setMatrixAt(i, dummy.matrix);
      });
      finMesh.instanceMatrix.needsUpdate = true;
    }
    const windowMesh = windowsRef.current;
    if (windowMesh) {
      windows.forEach((win, i) => {
        dummy.position.set(win.x, SLAB + 0.35, win.z);
        dummy.rotation.set(0, win.rotY, 0);
        dummy.scale.set(win.w, height - 0.7, 1);
        dummy.updateMatrix();
        windowMesh.setMatrixAt(i, dummy.matrix);
        windowMesh.setColorAt(i, win.color);
      });
      windowMesh.instanceMatrix.needsUpdate = true;
      if (windowMesh.instanceColor) windowMesh.instanceColor.needsUpdate = true;
    }
  }, [fins, windows, height]);

  return (
    <>
      {/* Lit window panes on the glass face */}
      {windows.length > 0 && <instancedMesh ref={windowsRef} args={[plane, materials.windows, windows.length]} />}
      <mesh geometry={box} material={materials.glass} position={[0, SLAB, 0]} scale={[W - 1.1, height, D - 1.1]} />
      {fins.length > 0 && <instancedMesh ref={finsRef} args={[box, materials.fin, fins.length]} />}
    </>
  );
}
