import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { cachedBox } from './geometry';
import type { HouseMaterials, InteriorMaterials } from './materials';

/*
 * Furniture and fittings built in code, in one modern Indian style: soft fabric seating,
 * rosewood and teak joinery, brass details, stone tops. Each piece is placed by its
 * centre on the floor (y = 0 is the floor surface), facing +z unless rotated.
 */

type V3 = [number, number, number];
interface Placed {
  position: V3;
  rotation?: number;
}

function Box({ size, position, material }: { size: V3; position: V3; material: THREE.Material }) {
  return <mesh geometry={cachedBox(...size)} material={material} position={position} />;
}

function Soft({ size, position, material, radius = 0.06, rotationX = 0 }: { size: V3; position: V3; material: THREE.Material; radius?: number; rotationX?: number }) {
  return <RoundedBox args={size} radius={Math.min(radius, Math.min(...size) / 2 - 0.001)} smoothness={3} position={position} rotation-x={rotationX} material={material} />;
}

/* ------------------------------------------------------------------ seating */

/** Upholstered sofa: plinth base on short legs, seat and back cushions, rounded arms. */
export function Sofa({ seats, fabric, cushion, legs, position, rotation = 0 }: Placed & { seats: number; fabric: THREE.Material; cushion: THREE.Material; legs: THREE.Material }) {
  const seat = 0.78;
  const width = seats * seat + 0.4;
  const depth = 0.95;
  return (
    <group position={position} rotation-y={rotation}>
      <Soft size={[width, 0.24, depth]} position={[0, 0.22, 0]} material={fabric} radius={0.05} />
      <Soft size={[width, 0.44, 0.2]} position={[0, 0.54, -depth / 2 + 0.1]} material={fabric} radius={0.07} />
      {[-1, 1].map((s) => (
        <Soft key={s} size={[0.2, 0.34, depth]} position={[s * (width / 2 - 0.1), 0.46, 0]} material={fabric} radius={0.08} />
      ))}
      {Array.from({ length: seats }, (_, i) => {
        const x = -((seats - 1) * seat) / 2 + i * seat;
        return (
          <group key={i}>
            <Soft size={[seat - 0.02, 0.16, depth - 0.24]} position={[x, 0.42, 0.1]} material={fabric} radius={0.07} />
            <Soft size={[seat - 0.06, 0.46, 0.18]} position={[x, 0.72, -depth / 2 + 0.27]} material={fabric} radius={0.09} rotationX={-0.12} />
          </group>
        );
      })}
      {/* Accent cushions at the ends */}
      {[-1, 1].map((s) => (
        <Soft key={`c${s}`} size={[0.42, 0.4, 0.14]} position={[s * (width / 2 - 0.42), 0.68, -depth / 2 + 0.42]} material={cushion} radius={0.08} rotationX={-0.25} />
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} size={[0.05, 0.1, 0.05]} position={[sx * (width / 2 - 0.08), 0.05, sz * (depth / 2 - 0.08)]} material={legs} />),
      )}
    </group>
  );
}

/** Dining chair: teak frame, upholstered seat and a woven back panel. */
export function DiningChair({ position, rotation = 0, m }: Placed & { m: InteriorMaterials }) {
  return (
    <group position={position} rotation-y={rotation}>
      <Box size={[0.46, 0.05, 0.46]} position={[0, 0.44, 0]} material={m.teak} />
      <Soft size={[0.44, 0.06, 0.42]} position={[0, 0.49, 0.01]} material={m.fabric} radius={0.025} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} size={[0.04, 0.44, 0.04]} position={[sx * 0.2, 0.22, sz * 0.2]} material={m.teak} />))}
      {[-1, 1].map((sx) => (
        <Box key={sx} size={[0.04, 0.5, 0.04]} position={[sx * 0.2, 0.72, -0.2]} material={m.teak} />
      ))}
      <Box size={[0.42, 0.06, 0.04]} position={[0, 0.95, -0.2]} material={m.teak} />
      <mesh material={m.jali} position={[0, 0.72, -0.2]}>
        <planeGeometry args={[0.36, 0.38]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ tables */

export function CoffeeTable({ position, rotation = 0, top, frame, width = 1.2, depth = 0.65 }: Placed & { top: THREE.Material; frame: THREE.Material; width?: number; depth?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <Box size={[width, 0.05, depth]} position={[0, 0.4, 0]} material={top} />
      <Box size={[width - 0.12, 0.03, depth - 0.12]} position={[0, 0.12, 0]} material={frame} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <Box key={`${sx}${sz}`} size={[0.05, 0.38, 0.05]} position={[sx * (width / 2 - 0.06), 0.19, sz * (depth / 2 - 0.06)]} material={frame} />),
      )}
    </group>
  );
}

export function DiningTable({ position, rotation = 0, m }: Placed & { m: InteriorMaterials }) {
  return (
    <group position={position} rotation-y={rotation}>
      <Box size={[2.2, 0.06, 1.0]} position={[0, 0.75, 0]} material={m.teak} />
      {[-1, 1].map((s) => (
        <group key={s} position-x={s * 0.78}>
          <Box size={[0.08, 0.72, 0.7]} position={[0, 0.36, 0]} material={m.teak} />
          <Box size={[0.12, 0.05, 0.86]} position={[0, 0.025, 0]} material={m.teak} />
        </group>
      ))}
      <Box size={[1.5, 0.06, 0.06]} position={[0, 0.2, 0]} material={m.teak} />
      {/* Table runner */}
      <Box size={[1.6, 0.004, 0.36]} position={[0, 0.782, 0]} material={m.rust} />
    </group>
  );
}

export function Rug({ position, size, m, rotation = 0 }: Placed & { size: [number, number]; m: InteriorMaterials }) {
  return (
    <mesh material={m.rug} position={[position[0], position[1] + 0.006, position[2]]} rotation={[-Math.PI / 2, 0, rotation]}>
      <planeGeometry args={size} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ walls and screens */

/** Carved jali screen in a timber frame. `width` × `height`, standing on the floor. */
export function JaliScreen({ width, height, position, rotation = 0, m }: Placed & { width: number; height: number; m: InteriorMaterials }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height);
    // One tile (two by two rosettes) every 0.7 m
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * width) / 0.7, (uv.getY(i) * height) / 0.7);
    return g;
  }, [width, height]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={geometry} material={m.jali} position-y={height / 2} />
      <Box size={[width + 0.1, 0.08, 0.08]} position={[0, height, 0]} material={m.rosewood} />
      <Box size={[width + 0.1, 0.08, 0.08]} position={[0, 0.04, 0]} material={m.rosewood} />
      {[-1, 0, 1].map((s) => (
        <Box key={s} size={[0.08, height, 0.08]} position={[(s * width) / 2, height / 2, 0]} material={m.rosewood} />
      ))}
    </group>
  );
}

/** Living-room media wall: fluted timber panel, floating console, TV, LED wash under the console. */
export function MediaWall({ position, rotation = 0, width, height, m, materials }: Placed & { width: number; height: number; m: InteriorMaterials; materials: HouseMaterials }) {
  return (
    <group position={position} rotation-y={rotation}>
      <Box size={[width, height, 0.05]} position={[0, height / 2, 0.025]} material={m.fluted} />
      <Box size={[1.7, 0.98, 0.05]} position={[0, 1.45, 0.08]} material={m.blackGlass} />
      <Box size={[2.6, 0.38, 0.42]} position={[0, 0.42, 0.26]} material={m.rosewood} />
      <Box size={[2.6, 0.02, 0.44]} position={[0, 0.62, 0.26]} material={m.counter} />
      <mesh material={materials.lampStrip} position={[0, 0.222, 0.45]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[2.5, 0.03]} />
      </mesh>
    </group>
  );
}

/** Pleated curtain panel hanging from `top`, `width` wide and `drop` long, against a wall. */
export function Curtain({ position, rotation = 0, width, drop, m }: Placed & { width: number; drop: number; m: InteriorMaterials }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, drop, 28, 1);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) / width) * Math.PI * 9) * 0.05);
    g.computeVertexNormals();
    return g;
  }, [width, drop]);
  return <mesh geometry={geometry} material={m.curtain} position={[position[0], position[1] - drop / 2, position[2]]} rotation-y={rotation} />;
}

/* ------------------------------------------------------------------ bedroom */

export function Bed({ position, rotation = 0, m, materials }: Placed & { m: InteriorMaterials; materials: HouseMaterials }) {
  const length = 2.15;
  return (
    <group position={position} rotation-y={rotation}>
      {/* Bed's head is at -z */}
      <Box size={[2.0, 0.28, length]} position={[0, 0.17, 0]} material={m.rosewood} />
      <Soft size={[1.86, 0.24, length - 0.12]} position={[0, 0.42, 0.02]} material={m.linen} radius={0.06} />
      <Soft size={[1.98, 0.07, 1.4]} position={[0, 0.56, 0.37]} material={m.fabric} radius={0.03} />
      <Soft size={[2.0, 0.08, 0.42]} position={[0, 0.6, 0.78]} material={m.rust} radius={0.03} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Soft size={[0.74, 0.16, 0.44]} position={[s * 0.45, 0.63, -length / 2 + 0.33]} material={m.linen} radius={0.07} />
          <Soft size={[0.46, 0.38, 0.14]} position={[s * 0.36, 0.76, -length / 2 + 0.62]} material={m.rust} radius={0.07} rotationX={-0.3} />
        </group>
      ))}
      {/* Upholstered headboard with a warm LED line above it */}
      <Soft size={[2.4, 1.05, 0.12]} position={[0, 0.95, -length / 2 - 0.02]} material={m.fabricDark} radius={0.05} />
      <mesh material={materials.lampStrip} position={[0, 1.5, -length / 2 - 0.07]}>
        <planeGeometry args={[2.3, 0.025]} />
      </mesh>
    </group>
  );
}

export function TableLamp({ position, m, materials }: Placed & { m: InteriorMaterials; materials: HouseMaterials }) {
  return (
    <group position={position}>
      <mesh material={materials.brass} position-y={0.14}>
        <cylinderGeometry args={[0.05, 0.08, 0.28, 16]} />
      </mesh>
      <mesh material={materials.lampShade} position-y={0.4}>
        <cylinderGeometry args={[0.13, 0.17, 0.24, 20, 1, true]} />
      </mesh>
      <mesh material={m.ceramic} position-y={0.29}>
        <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ kitchen */

/**
 * A run of kitchen cabinets along +x from the origin: rosewood base units with brass pulls,
 * stone counter, optional upper units; `skipUpper` leaves a gap (for a window or hood).
 */
export function CabinetRun({
  position,
  rotation = 0,
  length,
  upper = true,
  skipUpper = [],
  m,
  materials,
}: Placed & { length: number; upper?: boolean; skipUpper?: [number, number][]; m: InteriorMaterials; materials: HouseMaterials }) {
  const doors = Math.max(1, Math.round(length / 0.6));
  const doorW = length / doors;
  const inSkip = (x: number) => skipUpper.some(([a, b]) => x + doorW > a + 0.01 && x < b - 0.01);
  return (
    <group position={position} rotation-y={rotation}>
      {/* Base: toe-kick, carcass, door fronts, counter */}
      <Box size={[length, 0.1, 0.52]} position={[length / 2, 0.05, -0.32]} material={m.counter} />
      <Box size={[length, 0.76, 0.56]} position={[length / 2, 0.48, -0.3]} material={m.rosewood} />
      {Array.from({ length: doors }, (_, i) => (
        <group key={i}>
          <Box size={[doorW - 0.012, 0.74, 0.02]} position={[i * doorW + doorW / 2, 0.48, -0.01]} material={m.rosewood} />
          <Box size={[0.14, 0.012, 0.02]} position={[i * doorW + doorW / 2, 0.8, 0.01]} material={materials.brass} />
        </group>
      ))}
      <Box size={[length, 0.04, 0.62]} position={[length / 2, 0.88, -0.3]} material={m.counter} />
      {upper &&
        Array.from({ length: doors }, (_, i) =>
          inSkip(i * doorW) ? null : (
            <group key={`u${i}`}>
              <Box size={[doorW - 0.012, 0.75, 0.34]} position={[i * doorW + doorW / 2, 1.9, -0.44]} material={m.rosewood} />
              <Box size={[0.012, 0.14, 0.02]} position={[i * doorW + (i % 2 ? 0.06 : doorW - 0.06), 1.62, -0.26]} material={materials.brass} />
              {/* Under-cabinet LED */}
              <mesh material={materials.lampStrip} position={[i * doorW + doorW / 2, 1.522, -0.34]} rotation-x={Math.PI / 2}>
                <planeGeometry args={[doorW - 0.04, 0.025]} />
              </mesh>
            </group>
          ),
        )}
    </group>
  );
}

/* ------------------------------------------------------------------ bathroom */

/** Vessel basin: a lathe-turned ceramic bowl. */
export function VesselBasin({ position, m }: Placed & { m: InteriorMaterials }) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector2(0.12 + 0.12 * Math.sin((t * Math.PI) / 2), t * 0.14));
    }
    pts.push(new THREE.Vector2(0.235, 0.14), new THREE.Vector2(0.22, 0.03), new THREE.Vector2(0.0, 0.03));
    return new THREE.LatheGeometry(pts, 28);
  }, []);
  return (
    <group position={position}>
      <mesh geometry={geometry} material={m.ceramic} />
      <Box size={[0.03, 0.26, 0.03]} position={[0, 0.13, -0.3]} material={m.steel} />
      <Box size={[0.03, 0.03, 0.16]} position={[0, 0.25, -0.23]} material={m.steel} />
    </group>
  );
}

/** Wall-hung WC with a concealed cistern and a flush plate. Faces +z. */
export function Toilet({ position, rotation = 0, m }: Placed & { m: InteriorMaterials }) {
  return (
    <group position={position} rotation-y={rotation}>
      <Soft size={[0.38, 0.32, 0.56]} position={[0, 0.38, 0.12]} material={m.ceramic} radius={0.12} />
      <Soft size={[0.4, 0.04, 0.5]} position={[0, 0.56, 0.12]} material={m.ceramic} radius={0.02} />
      <Box size={[0.24, 0.16, 0.015]} position={[0, 1.0, -0.15]} material={m.steel} />
    </group>
  );
}

/** Mirror with a warm halo of light behind it. */
export function BacklitMirror({ position, rotation = 0, width, height, m, materials }: Placed & { width: number; height: number; m: InteriorMaterials; materials: HouseMaterials }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh material={materials.lampStrip} position-z={0.005}>
        <planeGeometry args={[width + 0.08, height + 0.08]} />
      </mesh>
      <Box size={[width, height, 0.02]} position={[0, 0, 0.03]} material={m.mirror} />
    </group>
  );
}

/* ------------------------------------------------------------------ ceilings */

/**
 * Dropped ceiling border with a concealed warm LED cove, the standard in Indian homes.
 * Room rectangle in world coordinates; `ceiling` is the slab soffit height.
 */
export function CoveCeiling({ x0, x1, z0, z1, ceiling, m, materials, band = 0.55, drop = 0.28 }: { x0: number; x1: number; z0: number; z1: number; ceiling: number; m: InteriorMaterials; materials: HouseMaterials; band?: number; drop?: number }) {
  const w = x1 - x0;
  const d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const y = ceiling - drop / 2;
  const stripY = ceiling - drop + 0.01;
  return (
    <group>
      <Box size={[w, drop, band]} position={[cx, y, z0 + band / 2]} material={m.ceiling} />
      <Box size={[w, drop, band]} position={[cx, y, z1 - band / 2]} material={m.ceiling} />
      <Box size={[band, drop, d - band * 2]} position={[x0 + band / 2, y, cz]} material={m.ceiling} />
      <Box size={[band, drop, d - band * 2]} position={[x1 - band / 2, y, cz]} material={m.ceiling} />
      {/* Glowing strip along the inner lip, facing up into the recess */}
      {[
        { size: [w - band * 2, 0.04] as [number, number], position: [cx, stripY + 0.04, z0 + band] as V3, ry: 0 },
        { size: [w - band * 2, 0.04] as [number, number], position: [cx, stripY + 0.04, z1 - band] as V3, ry: Math.PI },
        { size: [d - band * 2, 0.04] as [number, number], position: [x0 + band, stripY + 0.04, cz] as V3, ry: Math.PI / 2 },
        { size: [d - band * 2, 0.04] as [number, number], position: [x1 - band, stripY + 0.04, cz] as V3, ry: -Math.PI / 2 },
      ].map((s, i) => (
        <mesh key={i} material={materials.lampStrip} position={s.position} rotation-y={s.ry}>
          <planeGeometry args={s.size} />
        </mesh>
      ))}
    </group>
  );
}

/** Recessed downlights: small glowing discs on a ceiling. */
export function Downlights({ points, y, materials }: { points: [number, number][]; y: number; materials: HouseMaterials }) {
  return (
    <>
      {points.map(([x, z], i) => (
        <mesh key={i} material={materials.lampWarm} position={[x, y - 0.005, z]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.05, 14]} />
        </mesh>
      ))}
    </>
  );
}
