import type { Opening } from './geometry';
import { DOOR, FF, FIRST_FLOOR, GROUND_FLOOR, HOUSE, PLINTH, SLAB, WALL_T } from './layout';

/*
 * Outer walls and their openings, shared by the house shell (House.tsx) and the interiors,
 * which line the inside faces of the same walls.
 */
const doorLeft = DOOR.x - DOOR.width / 2 - HOUSE.x0;

// Openings per wall, in each wall's own coordinates (x along the wall from its start corner)
export const OPENINGS: Record<'front' | 'right' | 'back' | 'left', { ground: Opening[]; first: Opening[] }> = {
  front: {
    ground: [
      { x: 1.0, y: 0.45, width: 3.0, height: 2.35 },
      { x: doorLeft, y: 0, width: DOOR.width, height: DOOR.height },
      { x: 10.0, y: 0.45, width: 3.0, height: 2.35 },
    ],
    first: [
      { x: 1.2, y: 0.75, width: 2.4, height: 1.75 },
      { x: 5.4, y: 0, width: 3.2, height: 2.5 }, // balcony doors
      { x: 10.4, y: 0.75, width: 2.4, height: 1.75 },
    ],
  },
  right: {
    ground: [
      { x: 1.6, y: 0.6, width: 2.4, height: 2.1 },
      { x: 7.0, y: 0.6, width: 2.6, height: 2.1 },
    ],
    first: [
      { x: 1.8, y: 0.8, width: 2.2, height: 1.7 },
      { x: 7.4, y: 0.8, width: 2.2, height: 1.7 },
    ],
  },
  back: {
    ground: [
      { x: 2.6, y: 0, width: 4.4, height: 2.7 }, // garden doors from the dining room
      { x: 9.4, y: 0.9, width: 2.6, height: 1.6 }, // kitchen window
    ],
    first: [
      { x: 2.0, y: 0.8, width: 2.4, height: 1.7 },
      { x: 9.0, y: 0.8, width: 2.4, height: 1.7 },
    ],
  },
  left: {
    // (No window beside the kitchen: its wall carries the upper cabinets)
    ground: [{ x: 7.6, y: 0.6, width: 2.4, height: 2.1 }],
    first: [
      { x: 2.0, y: 0.8, width: 2.4, height: 1.7 },
      { x: 7.6, y: 0.8, width: 2.2, height: 1.7 },
    ],
  },
};

// Walls run counter-clockwise seen from above, so each wall's local -z points into the house
export const WALLS = {
  front: { from: [HOUSE.x0, HOUSE.z1], to: [HOUSE.x1, HOUSE.z1] },
  right: { from: [HOUSE.x1, HOUSE.z1], to: [HOUSE.x1, HOUSE.z0] },
  back: { from: [HOUSE.x1, HOUSE.z0], to: [HOUSE.x0, HOUSE.z0] },
  left: { from: [HOUSE.x0, HOUSE.z0], to: [HOUSE.x0, HOUSE.z1] },
} as const;

// First floor: the back-right corner is the open terrace, so the back and right walls stop short
const TERRACE_EDGE_Z = FF.terrace.z1;
export const FIRST_FLOOR_WALLS: { from: [number, number]; to: [number, number]; openings: Opening[] }[] = [
  { from: [HOUSE.x0, HOUSE.z1], to: [HOUSE.x1, HOUSE.z1], openings: OPENINGS.front.first },
  { from: [HOUSE.x1, HOUSE.z1], to: [HOUSE.x1, TERRACE_EDGE_Z], openings: [OPENINGS.right.first[0]!] },
  {
    from: [FF.terrace.x0, HOUSE.z0],
    to: [HOUSE.x0, HOUSE.z0],
    openings: [
      { x: 0.6, y: 0.8, width: 1.8, height: 1.7 }, // study
      { x: 3.0, y: 0.8, width: 2.4, height: 1.7 }, // bathroom
    ],
  },
  { from: [HOUSE.x0, HOUSE.z0], to: [HOUSE.x0, HOUSE.z1], openings: OPENINGS.left.first },
];

export interface Lining {
  from: [number, number];
  to: [number, number];
  y: number;
  height: number;
  openings: Opening[];
}

/**
 * The inside face of an outer wall: the same line moved in by the wall thickness, shortened
 * at both ends to meet the neighbouring walls, with its openings shifted to match.
 */
function lining(from: readonly [number, number], to: readonly [number, number], openings: Opening[], y: number, height: number): Lining {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  const ux = dx / length;
  const uz = dz / length;
  // Each wall's local -z (into the house) in world space; see WALLS
  const angle = Math.atan2(-dz, dx);
  const ix = -Math.sin(angle);
  const iz = -Math.cos(angle);
  return {
    from: [from[0] + ux * WALL_T + ix * WALL_T, from[1] + uz * WALL_T + iz * WALL_T],
    to: [to[0] - ux * WALL_T + ix * WALL_T, to[1] - uz * WALL_T + iz * WALL_T],
    y,
    height,
    openings: openings.map((o) => ({ ...o, x: o.x - WALL_T })),
  };
}

/** Inside faces of every outer wall on both floors (painted in the interiors). */
export const LININGS: Lining[] = [
  ...(Object.keys(WALLS) as (keyof typeof WALLS)[]).map((side) =>
    lining(WALLS[side].from, WALLS[side].to, OPENINGS[side].ground, PLINTH, GROUND_FLOOR.height + SLAB),
  ),
  ...FIRST_FLOOR_WALLS.map((wall) => lining(wall.from, wall.to, wall.openings, FIRST_FLOOR.y, FIRST_FLOOR.height)),
];