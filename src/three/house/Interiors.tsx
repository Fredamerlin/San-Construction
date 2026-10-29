import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bed, BacklitMirror, CabinetRun, CoffeeTable, CoveCeiling, Curtain, DiningChair, DiningTable, Downlights, JaliScreen, MediaWall, Rug, Sofa, TableLamp, Toilet, VesselBasin } from './furniture';
import { beamBetween, cachedBox, wallGeometry, type Opening } from './geometry';
import { Wall } from './House';
import { EAVE_Y, FF, FIRST_FLOOR, GF, GROUND_FLOOR, HOUSE, IN, PARTITION_T, PLINTH, SLAB, STAIR_RISE, STAIR_TOP_Z, STAIR_TREAD } from './layout';
import { LININGS } from './plan';
import { setInteriorAmbient, type HouseMaterials, type InteriorMaterials } from './materials';
import { Prop } from './Model';
import type { WorldControls } from './RoomLights';
import { useStaticMerge } from './staticMerge';

/**
 * Interiors of the concept house (plan in layout.ts): living room, dining, kitchen and
 * staircase on the ground floor; master bedroom, dressing, bathroom, study, upper hall and
 * a covered terrace on the first floor. Static parts are merged into a few meshes.
 */

const G = PLINTH; // ground-floor level
const C0 = FIRST_FLOOR.y - SLAB; // ground-floor ceiling
const F = FIRST_FLOOR.y; // first-floor level
const C1 = EAVE_Y; // first-floor ceiling

export function Interiors({ materials, controls }: { materials: HouseMaterials; controls: WorldControls }) {
  const m = materials.interior;
  const root = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    root.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.Material;
      const solid = !material.transparent && !(material instanceof THREE.MeshBasicMaterial);
      object.castShadow = solid;
      object.receiveShadow = solid;
    });
  }, []);
  useStaticMerge(root);

  const applied = useRef(-1);
  useFrame(() => {
    if (Math.abs(controls.ambient - applied.current) < 0.001) return;
    applied.current = controls.ambient;
    setInteriorAmbient(m, controls.ambient);
  });

  return (
    <group ref={root}>
      <Shell m={m} materials={materials} />
      <Living m={m} materials={materials} />
      <Staircase m={m} materials={materials} />
      <Dining m={m} materials={materials} />
      <Kitchen m={m} materials={materials} />
      <Bedroom m={m} materials={materials} />
      <Bathroom m={m} materials={materials} />
      <Study m={m} materials={materials} />
      <Terrace m={m} materials={materials} />
    </group>
  );
}

type RoomProps = { m: InteriorMaterials; materials: HouseMaterials };

/* ------------------------------------------------------------------ floors, ceilings, walls */

function Plane({ x0, x1, z0, z1, y, material, down = false }: { x0: number; x1: number; z0: number; z1: number; y: number; material: THREE.Material; down?: boolean }) {
  const geometry = useMemo(() => {
    const w = x1 - x0;
    const d = z1 - z0;
    const g = new THREE.PlaneGeometry(w, d);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
    g.rotateX(down ? Math.PI / 2 : -Math.PI / 2);
    return g;
  }, [x0, x1, z0, z1, down]);
  return <mesh geometry={geometry} material={material} position={[(x0 + x1) / 2, y + (down ? -0.003 : 0.003), (z0 + z1) / 2]} />;
}

/** Thin cladding on the inside face of an outer wall, with the wall's window cut out. */
function Cladding({ from, to, y, height, openings, material, thickness = 0.01 }: { from: [number, number]; to: [number, number]; y: number; height: number; openings: Opening[]; material: THREE.Material; thickness?: number }) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const angle = Math.atan2(-(to[1] - from[1]), to[0] - from[0]);
  // `from` → `to` runs counter-clockwise like the outer walls, so the cladding's thickness
  // (local -z) extends from the wall surface into the room
  const geometry = useMemo(() => wallGeometry(length, height, thickness, openings), [length, height, thickness, openings]);
  return <mesh geometry={geometry} material={material} position={[from[0], y, from[1]]} rotation-y={angle} />;
}

const T = PARTITION_T;

function Shell({ m, materials }: RoomProps) {
  const sx = GF.stair.x0;
  return (
    <group>
      {/* Painted inside faces of the outer walls (the outside is textured plaster) */}
      {LININGS.map((lining, i) => (
        <Cladding key={i} {...lining} material={m.paint} />
      ))}

      {/* Ground floor: floor, ceiling (stairwell left open) */}
      <Plane x0={IN.x0} x1={IN.x1} z0={IN.z0} z1={IN.z1} y={G} material={m.floor} />
      <Plane x0={IN.x0} x1={sx} z0={IN.z0} z1={IN.z1} y={C0} material={m.ceiling} down />
      <Plane x0={sx} x1={IN.x1} z0={IN.z0} z1={STAIR_TOP_Z} y={C0} material={m.ceiling} down />

      {/* Ground-floor partitions */}
      <Wall from={[IN.x0, GF.backOfLiving + T / 2]} to={[GF.kitchenSide, GF.backOfLiving + T / 2]} y={G} height={GROUND_FLOOR.height} openings={[]} material={m.paint} materials={materials} thickness={T} interior />
      <Wall
        from={[GF.kitchenSide - T / 2, IN.z0]}
        to={[GF.kitchenSide - T / 2, GF.backOfLiving]}
        y={G}
        height={GROUND_FLOOR.height}
        openings={[{ x: 2.35, y: 0, width: 2.0, height: 2.4 }]}
        material={m.paint}
        materials={materials}
        thickness={T}
        interior
      />
      <JaliScreen width={GF.jaliEnd - GF.kitchenSide} height={GROUND_FLOOR.height} position={[(GF.kitchenSide + GF.jaliEnd) / 2, G, GF.backOfLiving]} m={m} />
      {/* Bulkhead over the wide opening from living to dining */}
      <mesh geometry={cachedBox(sx - GF.jaliEnd, 0.4, 0.16)} material={m.paint} position={[(sx + GF.jaliEnd) / 2, C0 - 0.2, GF.backOfLiving]} />

      {/* First floor: floors per room */}
      <Plane x0={IN.x0} x1={FF.bedroomSide} z0={FF.backOfBedroom} z1={IN.z1} y={F} material={m.oak} />
      <Plane x0={IN.x0} x1={FF.bathSide} z0={FF.bathFront} z1={FF.backOfBedroom} y={F} material={m.oak} />
      <Plane x0={IN.x0} x1={FF.bathSide} z0={IN.z0} z1={FF.bathFront} y={F} material={m.bathStone} />
      <Plane x0={FF.bathSide} x1={FF.terrace.x0} z0={IN.z0} z1={FF.backOfBedroom} y={F} material={m.oak} />
      <Plane x0={FF.bedroomSide} x1={sx} z0={FF.backOfBedroom} z1={IN.z1} y={F} material={m.floor} />
      <Plane x0={FF.terrace.x0} x1={sx} z0={FF.terrace.z1} z1={FF.backOfBedroom} y={F} material={m.floor} />
      <Plane x0={sx} x1={IN.x1} z0={FF.terrace.z1} z1={STAIR_TOP_Z} y={F} material={m.floor} />
      <Plane x0={FF.terrace.x0} x1={HOUSE.x1} z0={HOUSE.z0} z1={FF.terrace.z1} y={F} material={m.terracotta} />

      {/* First-floor ceilings: plaster indoors, timber over the terrace */}
      <Plane x0={IN.x0} x1={IN.x1} z0={FF.terrace.z1} z1={IN.z1} y={C1} material={m.ceiling} down />
      <Plane x0={IN.x0} x1={FF.terrace.x0} z0={IN.z0} z1={FF.terrace.z1} y={C1} material={m.ceiling} down />
      <Plane x0={FF.terrace.x0} x1={HOUSE.x1} z0={HOUSE.z0} z1={FF.terrace.z1} y={C1 - 0.02} material={m.teak} down />

      {/* First-floor partitions */}
      <Wall
        from={[IN.x0, FF.backOfBedroom + T / 2]}
        to={[FF.bedroomSide, FF.backOfBedroom + T / 2]}
        y={F}
        height={FIRST_FLOOR.height}
        openings={[{ x: -2.8 - IN.x0, y: 0, width: 0.85, height: 2.2 }]}
        material={m.paint}
        materials={materials}
        thickness={T}
        interior
      />
      <Wall
        from={[FF.bedroomSide - T / 2, FF.backOfBedroom]}
        to={[FF.bedroomSide - T / 2, IN.z1]}
        y={F}
        height={FIRST_FLOOR.height}
        openings={[{ x: 0.4, y: 0, width: 1.0, height: 2.2 }]}
        material={m.paint}
        materials={materials}
        thickness={T}
        interior
      />
      <Wall
        from={[IN.x0, FF.bathFront + T / 2]}
        to={[FF.bathSide, FF.bathFront + T / 2]}
        y={F}
        height={FIRST_FLOOR.height}
        openings={[{ x: -3.0 - IN.x0, y: 0, width: 0.8, height: 2.2 }]}
        material={m.bathStone}
        materials={materials}
        thickness={T}
        interior
      />
      <Wall from={[FF.bathSide - T / 2, IN.z0]} to={[FF.bathSide - T / 2, FF.backOfBedroom]} y={F} height={FIRST_FLOOR.height} openings={[]} material={m.paint} materials={materials} thickness={T} interior />
      <Wall
        from={[FF.terrace.x0 - T / 2, IN.z0]}
        to={[FF.terrace.x0 - T / 2, FF.backOfBedroom]}
        y={F}
        height={FIRST_FLOOR.height}
        openings={[{ x: -0.9 - IN.z0, y: 0, width: 0.9, height: 2.2 }]}
        material={m.paint}
        materials={materials}
        thickness={T}
        interior
      />
      {/* Glazed sliding doors from the upper hall onto the terrace */}
      <Wall
        from={[FF.terrace.x0, FF.terrace.z1]}
        to={[IN.x1, FF.terrace.z1]}
        y={F}
        height={FIRST_FLOOR.height}
        openings={[{ x: 1.4, y: 0, width: 2.8, height: 2.5 }]}
        material={m.paint}
        materials={materials}
        thickness={0.2}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ ground floor */

function Living({ m, materials }: RoomProps) {
  const cz = 2.9;
  return (
    <group>
      <CoveCeiling x0={IN.x0} x1={GF.stair.x0 - 0.1} z0={GF.backOfLiving + T / 2} z1={IN.z1} ceiling={C0} m={m} materials={materials} />
      <Downlights points={[[-6.2, 0.6], [-6.2, 5.2], [0.2, 0.6], [0.2, 5.2], [3.6, 5.2]]} y={C0 - 0.28} materials={materials} />
      <MediaWall position={[-3.6, G, GF.backOfLiving + T / 2]} width={3.8} height={GROUND_FLOOR.height} m={m} materials={materials} />
      <Prop id="brass_vase_01" position={[-4.85, G + 0.63, GF.backOfLiving + 0.33]} scale={0.9} />
      <Prop id="carved_wooden_elephant" position={[-2.45, G + 0.63, GF.backOfLiving + 0.33]} scale={2.6} rotation={0.5} />

      <Rug position={[-3.4, G, cz]} size={[3.4, 2.4]} m={m} />
      <Sofa seats={3} position={[-3.4, G, cz + 1.55]} rotation={Math.PI} fabric={m.fabric} cushion={m.rust} legs={m.rosewood} />
      <CoffeeTable position={[-3.4, G, cz]} top={m.counter} frame={m.rosewood} width={1.3} depth={0.7} />
      <Prop id="wooden_bowl_01" position={[-3.6, G + 0.425, cz]} scale={1.1} />
      <Prop id="modern_arm_chair_01" position={[-1.05, G, cz - 0.1]} rotation={-Math.PI / 2} />
      <Prop id="mid_century_lounge_chair" position={[-5.85, G, cz - 0.4]} rotation={Math.PI / 2} />
      <Prop id="potted_plant_02" position={[-6.25, G, GF.backOfLiving + 0.55]} scale={1.3} />
      <Prop id="potted_plant_02" position={[1.5, G, IN.z1 - 0.45]} scale={1.1} rotation={1.2} />
      <Prop id="ceiling_fan" position={[-3.4, C0, cz]} anchor="top" spin={2.4} />

      {/* Curtains either side of the front window */}
      {[-6.3, -2.7].map((x) => (
        <Curtain key={x} position={[x, C0 - 0.3, IN.z1 - 0.12]} rotation={Math.PI} width={0.7} drop={2.95} m={m} />
      ))}
    </group>
  );
}

function Staircase({ m }: RoomProps) {
  const { x0, x1, zBottom, risers } = GF.stair;
  const width = x1 - x0 - 0.05;
  const cx = (x0 + x1) / 2;
  const steps = Array.from({ length: risers - 1 }, (_, i) => ({
    top: G + (i + 1) * STAIR_RISE,
    z: zBottom - i * STAIR_TREAD - STAIR_TREAD / 2,
  }));
  const slope = beamBetween(new THREE.Vector3(cx, G - 0.2, zBottom + 0.2), new THREE.Vector3(cx, F - 0.2, STAIR_TOP_Z));
  const rail = beamBetween(new THREE.Vector3(x0 + 0.02, G + 1.0, zBottom), new THREE.Vector3(x0 + 0.02, F + 1.0, STAIR_TOP_Z));
  const glass = beamBetween(new THREE.Vector3(x0 + 0.02, G + 0.55, zBottom), new THREE.Vector3(x0 + 0.02, F + 0.55, STAIR_TOP_Z));
  return (
    <group>
      {/* Floating rosewood treads on a concrete spine */}
      {steps.map((s, i) => (
        <mesh key={i} geometry={cachedBox(width, 0.06, STAIR_TREAD + 0.03)} material={m.rosewood} position={[cx + 0.02, s.top - 0.03, s.z]} />
      ))}
      <mesh geometry={cachedBox(0.5, 0.3, slope.length)} material={m.paint} position={slope.position} quaternion={slope.quaternion} />
      {/* Glass balustrade with a timber handrail, up the stair and around the stairwell */}
      <mesh material={balustradeGlass} position={glass.position} quaternion={glass.quaternion}>
        <boxGeometry args={[0.012, 0.9, glass.length]} />
      </mesh>
      <mesh geometry={cachedBox(0.06, 0.05, rail.length)} material={m.rosewood} position={rail.position} quaternion={rail.quaternion} />
      <mesh material={balustradeGlass} position={[x0, F + 0.5, (STAIR_TOP_Z + IN.z1) / 2]}>
        <boxGeometry args={[0.012, 0.95, IN.z1 - STAIR_TOP_Z]} />
      </mesh>
      <mesh geometry={cachedBox(0.06, 0.05, IN.z1 - STAIR_TOP_Z)} material={m.rosewood} position={[x0, F + 1.0, (STAIR_TOP_Z + IN.z1) / 2]} />
    </group>
  );
}

// Balustrade glass: a lightly tinted, reflective pane
const balustradeGlass = new THREE.MeshStandardMaterial({ color: '#cfe0dc', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false, envMapIntensity: 0.6 });

function Dining({ m, materials }: RoomProps) {
  const tx = 2.2;
  const tz = -2.7;
  return (
    <group>
      <CoveCeiling x0={GF.kitchenSide + T / 2} x1={IN.x1} z0={IN.z0} z1={GF.backOfLiving - 0.08} ceiling={C0} m={m} materials={materials} />
      <DiningTable position={[tx, G, tz]} m={m} />
      {[tx - 0.6, tx + 0.6].map((x) => (
        <group key={x}>
          <DiningChair position={[x, G, tz - 0.72]} m={m} />
          <DiningChair position={[x, G, tz + 0.72]} rotation={Math.PI} m={m} />
        </group>
      ))}
      <DiningChair position={[tx - 1.45, G, tz]} rotation={Math.PI / 2} m={m} />
      <DiningChair position={[tx + 1.45, G, tz]} rotation={-Math.PI / 2} m={m} />
      {[tx - 0.75, tx, tx + 0.75].map((x) => (
        <group key={x}>
          <Prop id="modern_ceiling_lamp_01" position={[x, C0, tz]} anchor="top" scale={1.1} />
        </group>
      ))}
      <Prop id="brass_pot_01" position={[tx, G + 0.785, tz]} scale={0.9} />
      <Prop id="potted_plant_02" position={[IN.x1 - 0.5, G, IN.z0 + 0.5]} scale={1.3} />
      {/* Framed carved panel on the kitchen wall, dining side */}
      <group position={[GF.kitchenSide + 0.01, G + 1.75, -4.6]} rotation-y={Math.PI / 2}>
        <mesh geometry={cachedBox(1.0, 1.0, 0.05)} material={m.rosewood} />
        <mesh material={materials.brass} position-z={0.03}>
          <planeGeometry args={[0.84, 0.84]} />
        </mesh>
        <mesh material={m.jali} position-z={0.04}>
          <planeGeometry args={[0.84, 0.84]} />
        </mesh>
      </group>
    </group>
  );
}

function Kitchen({ m, materials }: RoomProps) {
  const backZ = IN.z0;
  const runStart = IN.x0 + 0.6;
  const runEnd = GF.kitchenSide - T / 2 - 0.05;
  const hobZ = -3.2;
  const sideRunStart = -0.75; // the side run starts here and runs toward the back wall
  const hobAlongRun = sideRunStart - hobZ;
  return (
    <group>
      <Downlights points={[[-5.0, -1.4], [-2.6, -1.4], [-5.0, -4.2], [-2.6, -4.2]]} y={C0} materials={materials} />
      {/* Run along the back wall, under the window; no upper units in front of the glass */}
      <CabinetRun position={[runStart, G, backZ + 0.62]} length={runEnd - runStart} skipUpper={[[1.0, 3.95]]} m={m} materials={materials} />
      {/* Run along the side wall, with a gap in the uppers for the hood */}
      <CabinetRun position={[IN.x0 + 0.62, G, -0.75]} rotation={Math.PI / 2} length={-0.75 - IN.z0} skipUpper={[[hobAlongRun - 0.5, hobAlongRun + 0.5]]} m={m} materials={materials} />

      {/* Backsplash tiles either side of the window, and along the side wall */}
      <mesh geometry={cachedBox(-5.0 - IN.x0, 0.62, 0.01)} material={m.whiteTile} position={[(IN.x0 - 5.0) / 2, G + 1.21, backZ + 0.016]} />
      <mesh geometry={cachedBox(runEnd + 0.05 - -2.4, 0.62, 0.01)} material={m.whiteTile} position={[(-2.4 + runEnd + 0.05) / 2, G + 1.21, backZ + 0.016]} />
      <mesh geometry={cachedBox(0.01, 0.62, -0.75 - IN.z0)} material={m.whiteTile} position={[IN.x0 + 0.016, G + 1.21, (IN.z0 - 0.75) / 2]} />

      {/* Hob and chimney hood */}
      <mesh geometry={cachedBox(0.52, 0.012, 0.62)} material={m.blackGlass} position={[IN.x0 + 0.33, G + 0.906, hobZ]} />
      <mesh geometry={cachedBox(0.5, 0.12, 0.8)} material={m.steel} position={[IN.x0 + 0.27, G + 1.62, hobZ]} />
      <mesh geometry={cachedBox(0.26, C0 - G - 1.68, 0.3)} material={m.steel} position={[IN.x0 + 0.14, (G + 1.68 + C0) / 2, hobZ]} />
      <Prop id="brass_pot_01" position={[IN.x0 + 0.33, G + 0.912, hobZ + 0.12]} scale={0.8} />

      {/* Sink under the window */}
      <mesh geometry={cachedBox(0.8, 0.01, 0.42)} material={m.steel} position={[-3.7, G + 0.906, backZ + 0.32]} />
      <mesh geometry={cachedBox(0.03, 0.32, 0.03)} material={m.steel} position={[-3.7, G + 1.06, backZ + 0.07]} />
      <mesh geometry={cachedBox(0.03, 0.03, 0.2)} material={m.steel} position={[-3.7, G + 1.21, backZ + 0.16]} />
      <Prop id="wooden_bowl_01" position={[-2.0, G + 0.9, backZ + 0.32]} />
      <Prop id="potted_plant_04" position={[-5.4, G + 0.9, backZ + 0.25]} scale={1.6} />
    </group>
  );
}

/* ------------------------------------------------------------------ first floor */

function Bedroom({ m, materials }: RoomProps) {
  const bx = -3.4;
  const headZ = FF.backOfBedroom + T / 2;
  return (
    <group>
      <CoveCeiling x0={IN.x0} x1={FF.bedroomSide - T / 2} z0={headZ} z1={IN.z1} ceiling={C1} m={m} materials={materials} />
      {/* Fluted timber wall behind the bed */}
      <mesh geometry={cachedBox(3.8, FIRST_FLOOR.height, 0.04)} material={m.fluted} position={[bx, F + FIRST_FLOOR.height / 2, headZ + 0.02]} />
      <Bed position={[bx, F, headZ + 0.16 + 2.15 / 2]} m={m} materials={materials} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Prop id="side_table_01" position={[bx + s * 1.38, F, headZ + 0.35]} scale={1.0} />
          <TableLamp position={[bx + s * 1.38, F + 0.55, headZ + 0.35]} m={m} materials={materials} />
        </group>
      ))}
      <Rug position={[bx, F, 2.6]} size={[3.0, 3.4]} m={m} />
      <Prop id="ceiling_fan" position={[bx + 0.6, C1, 3.3]} anchor="top" spin={2.4} />
      <Prop id="modern_arm_chair_01" position={[-5.7, F, 4.75]} rotation={Math.PI * 0.8} />
      <Prop id="potted_plant_02" position={[1.85, F, IN.z1 - 0.45]} scale={1.2} />
      {/* Curtains at the balcony doors and the side window */}
      {[-2.05, 2.05, -6.2, -3.0].map((x) => (
        <Curtain key={x} position={[x, C1 - 0.3, IN.z1 - 0.12]} rotation={Math.PI} width={0.75} drop={2.75} m={m} />
      ))}
      {/* Framed artwork on the wall beside the hall */}
      <group position={[FF.bedroomSide - T / 2 - 0.03, F + 1.65, 3.4]} rotation-y={-Math.PI / 2}>
        <mesh geometry={cachedBox(1.5, 1.05, 0.05)} material={materials.brass} />
        <mesh material={m.rug} position-z={0.03}>
          <planeGeometry args={[1.36, 0.91]} />
        </mesh>
      </group>
      {/* Wardrobe in the dressing passage */}
      <mesh geometry={cachedBox(0.62, 2.5, 1.7)} material={m.rosewood} position={[IN.x0 + 0.31, F + 1.25, (FF.bathFront + FF.backOfBedroom) / 2]} />
    </group>
  );
}

function Bathroom({ m, materials }: RoomProps) {
  const back = IN.z0;
  const vx = -5.85;
  return (
    <group>
      {/* Stone cladding on the outer walls, windows left open */}
      <Cladding from={[FF.bathSide - T / 2, back]} to={[IN.x0, back]} y={F} height={FIRST_FLOOR.height} openings={[{ x: FF.bathSide - T / 2 + 2.0, y: 0.8, width: 2.4, height: 1.7 }]} material={m.bathStone} thickness={0.02} />
      <Cladding from={[IN.x0, back]} to={[IN.x0, FF.bathFront]} y={F} height={FIRST_FLOOR.height} openings={[{ x: -4.0 - back, y: 0.8, width: 2.4, height: 1.7 }]} material={m.bathStone} thickness={0.02} />
      <Downlights points={[[-4.2, -2.4], [-2.6, -3.8], [-5.8, -2.4]]} y={C1} materials={materials} />

      {/* Floating vanity, vessel basin and backlit mirror */}
      <mesh geometry={cachedBox(1.5, 0.45, 0.5)} material={m.rosewood} position={[vx, F + 0.62, back + 0.27]} />
      <mesh geometry={cachedBox(1.56, 0.04, 0.54)} material={m.counter} position={[vx, F + 0.865, back + 0.28]} />
      <VesselBasin position={[vx, F + 0.885, back + 0.33]} m={m} />
      <BacklitMirror position={[vx, F + 1.62, back + 0.025]} width={1.0} height={0.85} m={m} materials={materials} />
      <Prop id="potted_plant_04" position={[vx - 0.55, F + 0.885, back + 0.25]} scale={1.4} />

      {/* Walk-in shower behind glass */}
      <mesh material={materials.glass} position={[-4.3, F + 1.0, -4.35]}>
        <boxGeometry args={[1.3, 2.0, 0.012]} />
      </mesh>
      <mesh material={materials.glass} position={[-5.0, F + 1.0, (back - 4.35) / 2]}>
        <boxGeometry args={[0.012, 2.0, -4.35 - back]} />
      </mesh>
      {/* Slim black frame on the shower glass */}
      <mesh geometry={cachedBox(1.32, 0.03, 0.03)} material={materials.metal} position={[-4.3, F + 2.0, -4.35]} />
      <mesh geometry={cachedBox(0.03, 2.0, 0.03)} material={materials.metal} position={[-3.65, F + 1.0, -4.35]} />
      <mesh geometry={cachedBox(0.03, 0.03, -4.35 - back)} material={materials.metal} position={[-5.0, F + 2.0, (back - 4.35) / 2]} />
      <mesh geometry={cachedBox(1.3, 0.02, 1.36)} material={m.counter} position={[-4.33, F + 0.01, (back - 4.35) / 2]} />
      <Prop id="potted_plant_02" position={[-2.3, F, FF.bathFront - 0.55]} scale={1.15} rotation={0.6} />
      <mesh material={m.steel} position={[-4.35, C1 - 0.06, -5.15]}>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 24]} />
      </mesh>

      <Toilet position={[-2.55, F, back + 0.2]} m={m} />
      {/* Bath mat, a plant under the window, and a teak stool with folded towels */}
      <mesh geometry={cachedBox(0.9, 0.012, 0.55)} material={m.linen} position={[-4.3, F + 0.006, -3.7]} />
      <Prop id="potted_plant_02" position={[-3.2, F, back + 0.4]} scale={1.05} rotation={1.4} />
      <group position={[IN.x0 + 0.35, F, -3.4]}>
        <mesh geometry={cachedBox(0.45, 0.04, 0.45)} material={m.teak} position-y={0.46} />
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={cachedBox(0.04, 0.44, 0.04)} material={m.teak} position={[sx * 0.19, 0.22, sz * 0.19]} />))}
        <mesh geometry={cachedBox(0.36, 0.08, 0.3)} material={m.linen} position-y={0.52} />
        <mesh geometry={cachedBox(0.34, 0.07, 0.28)} material={m.rust} position-y={0.595} />
      </group>
      {/* Towel on a rail by the door */}
      <mesh geometry={cachedBox(0.6, 0.02, 0.02)} material={m.steel} position={[-3.9, F + 1.25, FF.bathFront - T / 2 - 0.05]} />
      <mesh geometry={cachedBox(0.55, 0.55, 0.04)} material={m.linen} position={[-3.9, F + 1.0, FF.bathFront - T / 2 - 0.07]} />
    </group>
  );
}

function Study({ m, materials }: RoomProps) {
  return (
    <group>
      <Downlights points={[[-0.4, -2.6]]} y={C1} materials={materials} />
      <mesh geometry={cachedBox(1.4, 0.05, 0.62)} material={m.rosewood} position={[-0.4, F + 0.74, IN.z0 + 0.4]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cachedBox(0.05, 0.72, 0.58)} material={m.rosewood} position={[-0.4 + s * 0.66, F + 0.36, IN.z0 + 0.4]} />
      ))}
      <TableLamp position={[-0.95, F + 0.765, IN.z0 + 0.35]} m={m} materials={materials} />
      <DiningChair position={[-0.4, F, IN.z0 + 1.05]} rotation={Math.PI} m={m} />
    </group>
  );
}

function Terrace({ m, materials }: RoomProps) {
  const cx = 3.9;
  return (
    <group>
      <Sofa seats={3} position={[cx, F, FF.terrace.z1 - 0.75]} rotation={Math.PI} fabric={m.linen} cushion={m.rust} legs={m.teak} />
      <CoffeeTable position={[cx, F, -3.35]} top={m.teak} frame={m.rosewood} width={1.2} depth={0.7} />
      <Prop id="brass_diya_lantern" position={[cx - 0.2, F + 0.425, -3.35]} scale={1.6} />
      <Prop id="mid_century_lounge_chair" position={[6.0, F, -4.4]} rotation={-2.3} />
      <Prop id="potted_plant_02" position={[FF.terrace.x0 + 0.55, F, HOUSE.z0 + 0.7]} scale={1.4} />
      <Prop id="potted_plant_02" position={[HOUSE.x1 - 0.6, F, FF.terrace.z1 - 0.6]} scale={1.2} rotation={2} />
      <Prop id="modern_ceiling_lamp_01" position={[cx, C1 - 0.02, -3.35]} anchor="top" scale={1.1} />
      {/* Brass wall lights on the terrace's inner wall */}
      {[-2.6, -4.6].map((z) => (
        <group key={z} position={[FF.terrace.x0 + T / 2 + 0.02, F + 1.95, z]}>
          <mesh geometry={cachedBox(0.04, 0.32, 0.16)} material={materials.brass} />
          <mesh geometry={cachedBox(0.08, 0.24, 0.1)} material={materials.lampSoft} position-x={0.05} />
        </group>
      ))}
    </group>
  );
}
