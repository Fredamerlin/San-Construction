import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { beamBetween, cachedBox, gableRoof, ringFaces, slopedFaces, wallGeometry, type Opening, type SlopedFace } from './geometry';
import { DOOR, EAVE_Y, FF, FIRST_FLOOR, GF, GROUND_FLOOR, HOUSE, MAIN_ROOF, PLINTH, PORCH, SKIRT_ROOF, SLAB, STAIR_TOP_Z, STEPS, WALL_T } from './layout';
import type { HouseMaterials } from './materials';
import { FIRST_FLOOR_WALLS, OPENINGS, WALLS } from './plan';
import type { WorldControls } from './RoomLights';
import { useStaticMerge } from './staticMerge';

/**
 * The concept house: a two-storey modern Indian home with a Kerala-style tiled roof.
 * - white plaster walls on a raised stone plinth, timber windows with concrete sunshades (chajjas)
 * - a columned entrance porch with a carved double door, and a balcony above it
 * - a tiled skirt roof between the floors, a hipped main roof and a timber-latticed front gable
 * Interiors are in Interiors.tsx; this file is the shell, porch, roofs and the terrace edge.
 */

const MODELS = `${import.meta.env.BASE_URL}house/models/`;
export const DIYA_URL = `${MODELS}brass_diya_lantern/brass_diya_lantern.gltf`;
export const PLANT_URL = `${MODELS}potted_plant_04/potted_plant_04.gltf`;
export const POT_URL = `${MODELS}planter_pot_clay/planter_pot_clay.gltf`;

const DIYA_SCALE = 2.8;
const GF_WALL = GROUND_FLOOR.height + SLAB; // ground-floor walls run up to the first floor
export function House({ materials, controls }: { materials: HouseMaterials; controls?: WorldControls }) {
  const root = useRef<THREE.Group>(null);

  // Everything solid casts and receives shadows; glass and lamps don't.
  // (Declared before the merge so the merged meshes inherit these flags.)
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

  return (
    <group ref={root}>
      {/* Plinth */}
      <mesh geometry={cachedBox(HOUSE.x1 - HOUSE.x0 + 0.3, PLINTH, HOUSE.z1 - HOUSE.z0 + 0.3)} material={materials.granite} position={[0, PLINTH / 2, 0]} />

      {(Object.keys(WALLS) as (keyof typeof WALLS)[]).map((side) => (
        <Wall key={side} {...WALLS[side]} y={PLINTH} height={GF_WALL} openings={OPENINGS[side].ground} material={materials.plaster} materials={materials} />
      ))}
      {FIRST_FLOOR_WALLS.map((wall, i) => (
        <Wall key={i} {...wall} y={FIRST_FLOOR.y} height={FIRST_FLOOR.height} material={materials.plaster} materials={materials} />
      ))}

      {/* First-floor slab, with the stairwell cut out */}
      <mesh
        geometry={cachedBox(GF.stair.x0 - (HOUSE.x0 + 0.05), SLAB, HOUSE.z1 - HOUSE.z0 - 0.1)}
        material={materials.paint}
        position={[(GF.stair.x0 + HOUSE.x0 + 0.05) / 2, FIRST_FLOOR.y - SLAB / 2, 0]}
      />
      <mesh
        geometry={cachedBox(HOUSE.x1 - 0.05 - GF.stair.x0, SLAB, STAIR_TOP_Z - (HOUSE.z0 + 0.05))}
        material={materials.paint}
        position={[(HOUSE.x1 - 0.05 + GF.stair.x0) / 2, FIRST_FLOOR.y - SLAB / 2, (STAIR_TOP_Z + HOUSE.z0 + 0.05) / 2]}
      />

      <TerraceEdge materials={materials} />

      <Porch materials={materials} />
      <FacadeUplights materials={materials} />
      <FrontDoor materials={materials} controls={controls} />
      <SkirtRoof materials={materials} />
      <MainRoof materials={materials} />
      <FrontGable materials={materials} />
    </group>
  );
}

/* ----------------------------------------------------------------------------- walls */

/**
 * A straight wall with openings. Exterior walls get timber windows with sills and sunshades;
 * interior partitions (`interior`) get plain timber casings around open doorways.
 */
export function Wall({
  from,
  to,
  y,
  height,
  openings,
  material,
  materials,
  thickness = WALL_T,
  interior = false,
}: {
  from: readonly [number, number];
  to: readonly [number, number];
  y: number;
  height: number;
  openings: Opening[];
  material: THREE.Material;
  materials: HouseMaterials;
  thickness?: number;
  interior?: boolean;
}) {
  const [x0, z0] = from;
  const [x1, z1] = to;
  const length = Math.hypot(x1 - x0, z1 - z0);
  const angle = Math.atan2(-(z1 - z0), x1 - x0);
  const geometry = useMemo(() => wallGeometry(length, height, thickness, openings), [length, height, thickness, openings]);

  return (
    <group position={[x0, y, z0]} rotation-y={angle}>
      <mesh geometry={geometry} material={material} />
      {openings.map((o, i) =>
        interior ? (
          <Casing key={i} opening={o} thickness={thickness} material={materials.woodDark} />
        ) : (
          <WindowUnit key={i} opening={o} materials={materials} door={o.y === 0} skip={isMainDoor(o)} />
        ),
      )}
    </group>
  );
}

/** Timber casing around an interior doorway, on both faces of the partition. */
function Casing({ opening, thickness, material }: { opening: Opening; thickness: number; material: THREE.Material }) {
  const { x, y, width: w, height: h } = opening;
  const d = thickness + 0.04;
  return (
    <group position-z={-thickness / 2}>
      <mesh material={material} position={[x - 0.04, y + h / 2, 0]} geometry={cachedBox(0.08, h, d)} />
      <mesh material={material} position={[x + w + 0.04, y + h / 2, 0]} geometry={cachedBox(0.08, h, d)} />
      <mesh material={material} position={[x + w / 2, y + h + 0.04, 0]} geometry={cachedBox(w + 0.16, 0.08, d)} />
    </group>
  );
}
const isMainDoor = (o: Opening) => o.y === 0 && o.width === DOOR.width && o.height === DOOR.height;

const FRAME = 0.08;

/** Timber frame, glazing bars and glass for one opening; windows add a sill and a sunshade. */
function WindowUnit({ opening, materials, door, skip }: { opening: Opening; materials: HouseMaterials; door: boolean; skip: boolean }) {
  const { x, y, width: w, height: h } = opening;
  const z = -0.07;
  const mullions = Math.max(0, Math.round(w / 1.1) - 1);
  const parts = useMemo(() => {
    const list: { size: [number, number, number]; position: [number, number, number] }[] = [
      { size: [FRAME, h, 0.12], position: [x + FRAME / 2, y + h / 2, z] },
      { size: [FRAME, h, 0.12], position: [x + w - FRAME / 2, y + h / 2, z] },
      { size: [w, FRAME, 0.12], position: [x + w / 2, y + h - FRAME / 2, z] },
    ];
    if (!door) list.push({ size: [w, FRAME, 0.12], position: [x + w / 2, y + FRAME / 2, z] });
    for (let i = 1; i <= mullions; i++) list.push({ size: [0.05, h, 0.08], position: [x + (w * i) / (mullions + 1), y + h / 2, z] });
    // Transom bar on windows: the upper ventilator band typical of Indian windows
    if (!door) list.push({ size: [w, 0.05, 0.08], position: [x + w / 2, y + h * 0.74, z] });
    return list;
  }, [x, y, w, h, z, door, mullions]);

  if (skip) {
    // Main door: a stone surround; the door leaves are their own component
    return (
      <group>
        <mesh material={materials.stone} position={[x - 0.09, y + h / 2 + 0.09, 0.04]} geometry={cachedBox(0.18, h + 0.18, 0.1)} />
        <mesh material={materials.stone} position={[x + w + 0.09, y + h / 2 + 0.09, 0.04]} geometry={cachedBox(0.18, h + 0.18, 0.1)} />
        <mesh material={materials.stone} position={[x + w / 2, y + h + 0.12, 0.04]} geometry={cachedBox(w + 0.36, 0.24, 0.12)} />
      </group>
    );
  }

  return (
    <group>
      {parts.map((p, i) => (
        <mesh key={i} material={materials.woodDark} position={p.position}>
          <boxGeometry args={p.size} />
        </mesh>
      ))}
      <mesh material={materials.glass} position={[x + w / 2, y + h / 2, z - 0.01]}>
        <planeGeometry args={[w - FRAME, h - FRAME]} />
      </mesh>
      {!door && (
        <>
          {/* Stone sill */}
          <mesh material={materials.stone} position={[x + w / 2, y - 0.03, 0.06]}>
            <boxGeometry args={[w + 0.2, 0.06, 0.3]} />
          </mesh>
          {/* Concrete sunshade (chajja) */}
          <mesh material={materials.paint} position={[x + w / 2, y + h + 0.2, 0.3]}>
            <boxGeometry args={[w + 0.5, 0.08, 0.6]} />
          </mesh>
        </>
      )}
    </group>
  );
}



/* ----------------------------------------------------------------------------- terrace */

/** Open edge of the first-floor terrace: a parapet with stone coping, posts and an eave beam. */
function TerraceEdge({ materials }: { materials: HouseMaterials }) {
  const parapet = 0.95;
  const top = FIRST_FLOOR.y + parapet;
  const runs: { from: [number, number]; to: [number, number] }[] = [
    { from: [HOUSE.x1, FF.terrace.z1], to: [HOUSE.x1, HOUSE.z0] },
    { from: [HOUSE.x1, HOUSE.z0], to: [FF.terrace.x0, HOUSE.z0] },
  ];
  const postHeight = EAVE_Y - top;
  const posts: [number, number][] = [
    [HOUSE.x1 - 0.15, HOUSE.z0 + 0.15],
    [(HOUSE.x1 + FF.terrace.x0) / 2, HOUSE.z0 + 0.15],
    [FF.terrace.x0 + 0.15, HOUSE.z0 + 0.15],
    [HOUSE.x1 - 0.15, (HOUSE.z0 + FF.terrace.z1) / 2],
  ];
  return (
    <group>
      {runs.map((run, i) => (
        <Wall key={i} {...run} y={FIRST_FLOOR.y} height={parapet} openings={[]} material={materials.plaster} materials={materials} />
      ))}
      {/* Coping */}
      <mesh geometry={cachedBox(HOUSE.x1 - FF.terrace.x0 + 0.1, 0.07, WALL_T + 0.1)} material={materials.stone} position={[(HOUSE.x1 + FF.terrace.x0) / 2, top + 0.035, HOUSE.z0 + WALL_T / 2]} />
      <mesh geometry={cachedBox(WALL_T + 0.1, 0.07, FF.terrace.z1 - HOUSE.z0)} material={materials.stone} position={[HOUSE.x1 - WALL_T / 2, top + 0.035, (FF.terrace.z1 + HOUSE.z0) / 2]} />
      {posts.map(([x, z], i) => (
        <mesh key={i} geometry={cachedBox(0.26, postHeight, 0.26)} material={materials.paint} position={[x, top + postHeight / 2, z]} />
      ))}
      <mesh geometry={cachedBox(HOUSE.x1 - FF.terrace.x0, 0.3, 0.2)} material={materials.woodDark} position={[(HOUSE.x1 + FF.terrace.x0) / 2, EAVE_Y - 0.15, HOUSE.z0 + 0.12]} />
      <mesh geometry={cachedBox(0.2, 0.3, FF.terrace.z1 - HOUSE.z0)} material={materials.woodDark} position={[HOUSE.x1 - 0.12, EAVE_Y - 0.15, (FF.terrace.z1 + HOUSE.z0) / 2]} />
    </group>
  );
}

/* ----------------------------------------------------------------------------- porch */

const PORCH_DEPTH = PORCH.z1 - PORCH.z0;
const PORCH_WIDTH = PORCH.x1 - PORCH.x0;
const PORCH_CZ = (PORCH.z0 + PORCH.z1) / 2;
const CANOPY_BOTTOM = FIRST_FLOOR.y - SLAB;

function Porch({ materials }: { materials: HouseMaterials }) {
  const diya = useGLTF(DIYA_URL);
  const plant = useGLTF(PLANT_URL);
  const props = useMemo(() => {
    // The flame sits at the lantern's centre, measured from the model itself
    const box = new THREE.Box3().setFromObject(diya.scene);
    return {
      diyas: [diya.scene.clone(), diya.scene.clone()],
      plants: [plant.scene.clone(), plant.scene.clone()],
      flameY: box.getCenter(new THREE.Vector3()).y * DIYA_SCALE,
    };
  }, [diya, plant]);

  return (
    <group>
      {/* Raised porch floor and steps down to the drive */}
      <mesh geometry={cachedBox(PORCH_WIDTH, PLINTH, PORCH_DEPTH)} material={materials.stone} position={[0, PLINTH / 2, PORCH_CZ]} />
      {[1, 2].map((i) => {
        const top = PLINTH - i * STEPS.rise;
        return (
          <mesh
            key={i}
            geometry={cachedBox(STEPS.width + i * 0.3, top, STEPS.tread)}
            material={materials.stone}
            position={[0, top / 2, PORCH.z1 + (i - 0.5) * STEPS.tread]}
          />
        );
      })}

      {/* Pillars */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (PORCH_WIDTH / 2 - 0.42), PLINTH, PORCH.z1 - 0.42]}>
          <mesh geometry={cachedBox(0.52, 0.36, 0.52)} material={materials.stone} position-y={0.18} />
          <mesh geometry={cachedBox(0.34, CANOPY_BOTTOM - PLINTH - 0.56, 0.34)} material={materials.paint} position-y={0.36 + (CANOPY_BOTTOM - PLINTH - 0.56) / 2} />
          <mesh geometry={cachedBox(0.5, 0.2, 0.5)} material={materials.paint} position-y={CANOPY_BOTTOM - PLINTH - 0.1} />
        </group>
      ))}

      {/* Canopy slab with a timber ceiling and downlights */}
      <mesh geometry={cachedBox(PORCH_WIDTH + 0.3, SLAB, PORCH_DEPTH + 0.3)} material={materials.paint} position={[0, FIRST_FLOOR.y - SLAB / 2, PORCH_CZ + 0.15]} />
      <mesh material={materials.wood} position={[0, CANOPY_BOTTOM - 0.01, PORCH_CZ + 0.15]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[PORCH_WIDTH + 0.28, PORCH_DEPTH + 0.28]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} material={materials.lampWarm} position={[sx * 1.1, CANOPY_BOTTOM - 0.02, PORCH_CZ + sz * 0.7]} rotation-x={Math.PI / 2}>
            <circleGeometry args={[0.07, 16]} />
          </mesh>
        )),
      )}

      {/* Balcony balustrade on top of the canopy */}
      <Balusters material={materials.paint} />
      {[
        { size: [PORCH_WIDTH + 0.3, 0.09, 0.14], position: [0, FIRST_FLOOR.y + 0.98, PORCH.z1 + 0.2] },
        { size: [0.14, 0.09, PORCH_DEPTH + 0.2], position: [PORCH.x0 - 0.1, FIRST_FLOOR.y + 0.98, PORCH_CZ + 0.1] },
        { size: [0.14, 0.09, PORCH_DEPTH + 0.2], position: [PORCH.x1 + 0.1, FIRST_FLOOR.y + 0.98, PORCH_CZ + 0.1] },
      ].map((rail, i) => (
        <mesh key={i} material={materials.wood} position={rail.position as [number, number, number]}>
          <boxGeometry args={rail.size as [number, number, number]} />
        </mesh>
      ))}

      {/* Slim first-floor posts carrying the front gable */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={cachedBox(0.24, EAVE_Y - FIRST_FLOOR.y - 0.1, 0.24)}
          material={materials.paint}
          position={[side * (PORCH_WIDTH / 2 + 0.05), FIRST_FLOOR.y + (EAVE_Y - FIRST_FLOOR.y - 0.1) / 2, PORCH.z1 + 0.2]}
        />
      ))}
      <mesh geometry={cachedBox(PORCH_WIDTH + 0.5, 0.26, 0.24)} material={materials.woodDark} position={[0, EAVE_Y - 0.2, PORCH.z1 + 0.2]} />

      {/* Wall lights either side of the door */}
      {[-1, 1].map((side) => (
        <group key={side} position={[DOOR.x + side * (DOOR.width / 2 + 0.55), PLINTH + 2.05, HOUSE.z1 + 0.05]}>
          <mesh material={materials.metal}>
            <boxGeometry args={[0.18, 0.4, 0.04]} />
          </mesh>
          <mesh material={materials.lampSoft} position-z={0.07}>
            <boxGeometry args={[0.12, 0.3, 0.1]} />
          </mesh>
        </group>
      ))}

      {/* Brass lamps at the top of the steps, plants beside the door */}
      {/* Downloaded models stay out of the static merge (they use a second UV set for shading) */}
      {[-1, 1].map((side, i) => (
        <group key={side} userData={{ dynamic: true }}>
          <primitive object={props.diyas[i]!} position={[side * 1.55, PLINTH, PORCH.z1 - 0.25]} scale={DIYA_SCALE} />
          <mesh material={materials.lampWarm} position={[side * 1.55, PLINTH + props.flameY, PORCH.z1 - 0.25]}>
            <sphereGeometry args={[0.045, 8, 8]} />
          </mesh>
          <primitive object={props.plants[i]!} position={[side * 1.45, PLINTH, HOUSE.z1 + 0.45]} scale={4} />
        </group>
      ))}


    </group>
  );
}

/**
 * Warm ground-mounted uplights washing the front facade, the way architectural lighting
 * is done at dusk: additive light washes on the plaster (see materials.wash) above small glowing fittings.
 */
// [x, z] of each fitting on the ground and the wall point it washes (front, right side, back)
const UPLIGHTS: { at: [number, number]; wall: [number, number] }[] = [
  ...[-6.4, -3.6, 3.6, 6.4].map((x) => ({ at: [x, HOUSE.z1 + 0.75] as [number, number], wall: [x, HOUSE.z1] as [number, number] })),
  ...[3.2, -2.6].map((z) => ({ at: [HOUSE.x1 + 0.75, z] as [number, number], wall: [HOUSE.x1, z] as [number, number] })),
  ...[4.6, -3.8].map((x) => ({ at: [x, HOUSE.z0 - 0.75] as [number, number], wall: [x, HOUSE.z0] as [number, number] })),
];
function FacadeUplights({ materials }: { materials: HouseMaterials }) {
  return (
    <>
      {UPLIGHTS.map(({ at, wall }, i) => {
        // Face the wash outward from its wall, 2 cm in front of the plaster
        const nx = at[0] - wall[0];
        const nz = at[1] - wall[1];
        const len = Math.hypot(nx, nz);
        const ux = nx / len;
        const uz = nz / len;
        return (
          <group key={i}>
            <mesh
              material={materials.wash}
              position={[wall[0] + ux * 0.02, 2.25, wall[1] + uz * 0.02]}
              rotation-y={Math.atan2(ux, uz)}
            >
              <planeGeometry args={[2.6, 4.4]} />
            </mesh>
            <mesh material={materials.lampSoft} position={[at[0], 0.05, at[1]]} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.06, 12]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
/** Turned balusters along the balcony edge (one instanced mesh). */
function Balusters({ material }: { material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const profile = [
      [0.0, 0],
      [0.06, 0],
      [0.06, 0.08],
      [0.035, 0.12],
      [0.03, 0.3],
      [0.06, 0.45],
      [0.03, 0.62],
      [0.035, 0.82],
      [0.06, 0.86],
      [0.06, 0.94],
      [0.0, 0.94],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(profile, 10);
  }, []);
  const positions = useMemo(() => {
    const list: [number, number][] = [];
    const step = 0.2;
    for (let x = PORCH.x0; x <= PORCH.x1 + 1e-6; x += step) list.push([x, PORCH.z1 + 0.2]);
    for (let z = PORCH.z0 + 0.2; z < PORCH.z1 + 0.1; z += step) {
      list.push([PORCH.x0 - 0.1, z]);
      list.push([PORCH.x1 + 0.1, z]);
    }
    return list;
  }, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach(([x, z], i) => {
      dummy.position.set(x, FIRST_FLOOR.y, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions]);
  return <instancedMesh ref={ref} args={[geometry, material, positions.length]} castShadow />;
}

/* ----------------------------------------------------------------------------- door */

/**
 * Carved teak double door: raised panels and brass studs. The leaves swing inward as
 * `controls.door` goes from 0 to 1 (the walkthrough opens it as the camera approaches).
 */
export function FrontDoor({ materials, controls }: { materials: HouseMaterials; controls?: WorldControls }) {
  const leafWidth = DOOR.width / 2;
  const leaves = useRef<(THREE.Group | null)[]>([]);
  const studs = useMemo(() => {
    const list: [number, number][] = [];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 3; col++) list.push([0.14 + col * 0.25, 0.3 + row * 0.33]);
    return list;
  }, []);
  useFrame(() => {
    const open = THREE.MathUtils.clamp(controls?.door ?? 0, 0, 1);
    const eased = open * open * (3 - 2 * open);
    leaves.current.forEach((leaf, i) => {
      if (leaf) leaf.rotation.y = (i === 0 ? 1 : -1) * eased * 1.55;
    });
  });
  return (
    <group position={[DOOR.x, PLINTH, HOUSE.z1 - 0.08]} userData={{ dynamic: true }}>
      {[-1, 1].map((side, i) => (
        <group
          key={side}
          position-x={(side * DOOR.width) / 2}
          ref={(leaf) => {
            leaves.current[i] = leaf;
          }}
        >
          <group position-x={(-side * leafWidth) / 2}>
            <mesh material={materials.woodDark} position-y={DOOR.height / 2}>
              <boxGeometry args={[leafWidth - 0.01, DOOR.height - 0.01, 0.07]} />
            </mesh>
            {/* Raised panels, both faces */}
            {[0.45, 1.25, 2.05].flatMap((py) =>
              [1, -1].map((face) => (
                <mesh key={`${py}${face}`} material={materials.wood} position={[0, py, face * 0.045]}>
                  <boxGeometry args={[leafWidth - 0.2, 0.62, 0.025]} />
                </mesh>
              )),
            )}
            {/* Brass studs */}
            {studs.map(([sx, sy], k) => (
              <mesh key={k} material={materials.brass} position={[sx - leafWidth / 2, sy, 0.065]}>
                <sphereGeometry args={[0.018, 6, 6]} />
              </mesh>
            ))}
            <mesh material={materials.brass} position={[side * -(leafWidth / 2 - 0.08), 1.1, 0.08]}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
/* ----------------------------------------------------------------------------- roofs */

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Short tiled roof around the house between the floors, interrupted by the porch. */
function SkirtRoof({ materials }: { materials: HouseMaterials }) {
  const { top, bottom, faces } = useMemo(() => {
    const topY = FIRST_FLOOR.y + 0.45;
    const bottomY = topY - SKIRT_ROOF.drop;
    const o = SKIRT_ROOF.overhang;
    const outer = { x0: HOUSE.x0 - o, x1: HOUSE.x1 + o, z0: HOUSE.z0 - o, z1: HOUSE.z1 + o, y: bottomY };
    const inner = { ...HOUSE, y: topY };
    const [, right, back, left] = ringFaces(outer, inner);
    // The front face is split around the porch
    const cut = PORCH.x1 + 0.15;
    const frontLeft: SlopedFace = [v3(outer.x0, bottomY, outer.z1), v3(-cut, bottomY, outer.z1), v3(-cut, topY, inner.z1), v3(inner.x0, topY, inner.z1)];
    const frontRight: SlopedFace = [v3(cut, bottomY, outer.z1), v3(outer.x1, bottomY, outer.z1), v3(inner.x1, topY, inner.z1), v3(cut, topY, inner.z1)];
    const list = [frontLeft, frontRight, right!, back!, left!];
    return { top: slopedFaces(list), bottom: slopedFaces(list, true), faces: list };
  }, []);
  return (
    <group>
      <mesh geometry={top} material={materials.roof} />
      <mesh geometry={bottom} material={materials.woodDark} />
      <Fascias faces={faces} materials={materials} />
    </group>
  );
}

/** Timber boards along the eave edge of each face. */
function Fascias({ faces, materials, height = 0.2 }: { faces: SlopedFace[]; materials: HouseMaterials; height?: number }) {
  return (
    <>
      {faces.map(([a, b], i) => {
        const beam = beamBetween(a.clone().setY(a.y - height / 2), b.clone().setY(b.y - height / 2));
        return (
          <mesh key={i} material={materials.woodDark} position={beam.position} quaternion={beam.quaternion}>
            <boxGeometry args={[0.06, height, beam.length + 0.06]} />
          </mesh>
        );
      })}
    </>
  );
}

function MainRoof({ materials }: { materials: HouseMaterials }) {
  const data = useMemo(() => {
    const o = MAIN_ROOF.overhang;
    const outer = { x0: HOUSE.x0 - o, x1: HOUSE.x1 + o, z0: HOUSE.z0 - o, z1: HOUSE.z1 + o, y: EAVE_Y };
    // Equal pitch on all four sides: the ridge length is the difference of the two spans
    const halfRidge = (outer.x1 - outer.x0 - (outer.z1 - outer.z0)) / 2;
    const ridgeY = EAVE_Y + MAIN_ROOF.rise;
    const inner = { x0: -halfRidge, x1: halfRidge, z0: 0, z1: 0, y: ridgeY };
    const faces = ringFaces(outer, inner);
    const corners = [v3(outer.x0, EAVE_Y, outer.z1), v3(outer.x1, EAVE_Y, outer.z1), v3(outer.x1, EAVE_Y, outer.z0), v3(outer.x0, EAVE_Y, outer.z0)];
    const ridgeEnds = [v3(-halfRidge, ridgeY, 0), v3(halfRidge, ridgeY, 0)];
    const caps = [
      beamBetween(ridgeEnds[0]!, ridgeEnds[1]!),
      beamBetween(corners[0]!, ridgeEnds[0]!),
      beamBetween(corners[3]!, ridgeEnds[0]!),
      beamBetween(corners[1]!, ridgeEnds[1]!),
      beamBetween(corners[2]!, ridgeEnds[1]!),
    ];
    // Soffit downlights, 0.45 m in from the eave along the front and sides
    const slope = MAIN_ROOF.rise / (outer.z1 - outer.z0) / 0.5;
    const lightY = EAVE_Y + 0.45 * slope - 0.03;
    const lights: [number, number][] = [];
    for (const x of [-6.2, -4.2, 4.2, 6.2]) lights.push([x, HOUSE.z1 + o - 0.45]);
    for (const z of [-4, 0, 4]) {
      lights.push([HOUSE.x0 - o + 0.45, z]);
      lights.push([HOUSE.x1 + o - 0.45, z]);
    }
    return { top: slopedFaces(faces), bottom: slopedFaces(faces, true), faces, caps, lights, lightY };
  }, []);

  return (
    <group>
      <mesh geometry={data.top} material={materials.roof} />
      <mesh geometry={data.bottom} material={materials.woodDark} />
      <Fascias faces={data.faces} materials={materials} height={0.24} />
      {data.caps.map((cap, i) => (
        <mesh key={i} material={materials.roof} position={cap.position} quaternion={cap.quaternion}>
          <boxGeometry args={[0.24, 0.16, cap.length]} />
        </mesh>
      ))}
      {data.lights.map(([x, z], i) => (
        <mesh key={i} material={materials.lampWarm} position={[x, data.lightY, z]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.06, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/** Front gable over the balcony, with a timber lattice face and a brass finial. */
function FrontGable({ materials }: { materials: HouseMaterials }) {
  const x0 = PORCH.x0 - 0.55;
  const x1 = PORCH.x1 + 0.55;
  const z1 = PORCH.z1 + 0.75;
  const y = EAVE_Y - 0.12;
  const rise = 2.7;
  const roof = useMemo(() => gableRoof(x0, x1, 1.5, z1, y, rise), [x0, x1, z1, y]);
  const half = (x1 - x0) / 2;
  const faceZ = z1 - 0.3;

  // Lattice slats: horizontal boards across the triangle, narrowing toward the apex
  const slats = useMemo(() => {
    const list: { y: number; width: number }[] = [];
    for (let h = 0.25; h < rise - 0.25; h += 0.22) list.push({ y: h, width: 2 * half * (1 - h / rise) - 0.2 });
    return list;
  }, [half]);
  const rakes = useMemo(
    () => [beamBetween(v3(x0, y, z1), v3(0, y + rise, z1)), beamBetween(v3(x1, y, z1), v3(0, y + rise, z1))],
    [x0, x1, y, z1],
  );

  return (
    <group>
      <mesh geometry={roof.slopes} material={materials.roof} />
      <mesh geometry={roof.underside} material={materials.woodDark} />
      {/* Dark backing behind the lattice */}
      <mesh geometry={roof.gable} material={materials.woodDark} position={[0, y, faceZ - 0.12]} />
      {slats.map((s) => (
        <mesh key={s.y} material={materials.wood} position={[0, y + s.y, faceZ]}>
          <boxGeometry args={[Math.max(s.width, 0.1), 0.07, 0.05]} />
        </mesh>
      ))}
      <mesh material={materials.wood} position={[0, y + rise / 2, faceZ + 0.02]}>
        <boxGeometry args={[0.1, rise - 0.2, 0.06]} />
      </mesh>
      {rakes.map((r, i) => (
        <mesh key={i} material={materials.woodDark} position={r.position} quaternion={r.quaternion}>
          <boxGeometry args={[0.08, 0.28, r.length]} />
        </mesh>
      ))}
      {/* Brass finial at the apex */}
      <mesh material={materials.brass} position={[0, y + rise + 0.25, z1 - 0.05]}>
        <coneGeometry args={[0.07, 0.5, 10]} />
      </mesh>
    </group>
  );
}

useGLTF.preload(DIYA_URL);
useGLTF.preload(PLANT_URL);
