/**
 * Dimensions of the concept house and its plot, in metres. Shared by the building, the site,
 * the interiors and the camera path so they always line up.
 *
 * Axes: x runs across the front (left to right as seen from the road), y is up,
 * z points from the house toward the road (the front facade faces +z).
 */

export const PLINTH = 0.6; // raised ground floor, reached by steps
export const SLAB = 0.25;
export const WALL_T = 0.25;

export const GROUND_FLOOR = { y: PLINTH, height: 3.3 };
export const FIRST_FLOOR = { y: PLINTH + 3.3 + SLAB, height: 3.1 };
export const EAVE_Y = FIRST_FLOOR.y + FIRST_FLOOR.height; // where the main roof starts

/** Main two-storey block. */
export const HOUSE = { x0: -7, x1: 7, z0: -6, z1: 6 };

/** Entrance porch in front of the main door, with a balcony above it. */
export const PORCH = { x0: -2.4, x1: 2.4, z0: HOUSE.z1, z1: 8.8 };
export const STEPS = { count: 3, rise: PLINTH / 3, tread: 0.42, width: 3.6 };

/** Front door opening, centred on the facade. */
export const DOOR = { x: 0, width: 1.6, height: 2.6 };

/** Plot boundary (compound wall line) and the gate in the front wall. */
export const PLOT = { x0: -15, x1: 15, z0: -18, z1: 14 };
export const GATE = { x0: -2.6, x1: 2.6 };
export const ROAD = { z0: 15, z1: 23 };

/*
 * Interior plan. Inner faces of the outer walls are at x = ±6.75 and z = ±5.75.
 *
 * Ground floor                          First floor
 *   front (z+)                            front (z+)
 *   ┌──────────────┬──────┐              ┌──────────────┬──────┐
 *   │ living       │stair │              │ bedroom      │ hall │
 *   ├────────┬jali─┘ up→ │              ├──────┬───────┤ (void)
 *   │kitchen │  dining   │              │ bath │ study │terrace│
 *   └────────┴───────────┘              └──────┴───────┴──────┘
 */
export const IN = { x0: HOUSE.x0 + WALL_T, x1: HOUSE.x1 - WALL_T, z0: HOUSE.z0 + WALL_T, z1: HOUSE.z1 - WALL_T };
export const PARTITION_T = 0.12;

export const GF = {
  /** Wall between the living room (front) and kitchen/dining (back). */
  backOfLiving: 0,
  /** Wall between the kitchen (left) and dining room. */
  kitchenSide: -1.2,
  /** Jali screen spans from the kitchen wall to here; beyond it the opening to the dining room. */
  jaliEnd: 0.6,
  /** Staircase: along the right wall, rising toward the back. */
  stair: { x0: 4.7, x1: IN.x1, zBottom: 5.3, risers: 18 },
};
export const STAIR_RISE = (FIRST_FLOOR.y - PLINTH) / GF.stair.risers;
export const STAIR_TREAD = 0.27;
/** Where the top step meets the first floor. */
export const STAIR_TOP_Z = GF.stair.zBottom - (GF.stair.risers - 1) * STAIR_TREAD;

export const FF = {
  /** Bedroom back wall (headboard wall). */
  backOfBedroom: 0.6,
  /** Bedroom's right wall, beside the upper hall. */
  bedroomSide: 2.4,
  /** Bathroom's front wall; between it and the bedroom is a dressing passage. */
  bathFront: -1.2,
  /** Bathroom's right wall (beside the study). */
  bathSide: -1.8,
  /** Covered terrace: open to the back and right, under the main roof. */
  terrace: { x0: 1, z1: -1.5 },
};

/** Roof */
export const MAIN_ROOF = { overhang: 0.9, rise: 3.6 };
export const SKIRT_ROOF = { overhang: 1.1, drop: 0.55 }; // Kerala-style tiled eave between floors
