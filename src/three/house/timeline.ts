import * as THREE from 'three';
import type { WorldControls } from './RoomLights';
import { SHOTS, type Shot } from './shots';

/**
 * The scroll timeline of the walkthrough: one continuous camera move through the 12
 * storyboard scenes, evaluated from a single progress value (0 at the top of the section,
 * 1 at its end). It drives the 3D camera and world, and the HTML overlay (captions, the
 * dip-to-black between disconnected spaces, the still-image fallback) reads the same result,
 * so text and picture always agree.
 *
 * Each scene has a travel phase (moving from the previous scene) followed by a hold (the
 * camera eases slowly toward the subject while the caption is read). Spaces that connect are
 * travelled through along waypoints (through the gate, in at the front door, into the
 * kitchen, bedroom to bathroom); the others dip briefly to black.
 */

type V3 = [number, number, number];

interface SceneDef {
  shot: Shot;
  /** Points the camera passes through on the way in from the previous scene. */
  via?: V3[];
  /** Dip to black instead of travelling (spaces that don't connect). */
  cut?: boolean;
  /** Front door: open while inside the house. */
  door: number;
}

const shot = (id: number) => SHOTS.find((s) => s.id === id)!;

const DEFS: SceneDef[] = [
  { shot: shot(1), door: 0 },
  { shot: shot(2), via: [[4.5, 2.6, 18.5], [0.4, 2.0, 14.6]], door: 0 },
  { shot: shot(3), via: [[0.15, 1.85, 9.4], [0, 1.8, 6.7], [0.2, 1.95, 5.4]], door: 1 },
  { shot: shot(4), door: 1 },
  { shot: shot(5), via: [[2.4, 2.15, -0.4], [0.5, 2.1, -2.3], [-0.6, 2.1, -2.3]], door: 1 },
  { shot: shot(6), cut: true, door: 1 },
  { shot: shot(7), via: [[-1.0, 5.72, 2.4], [-2.4, 5.7, 1.2], [-2.4, 5.7, 0.2], [-2.6, 5.72, -0.8]], door: 1 },
  { shot: shot(8), cut: true, door: 1 },
  { shot: shot(9), cut: true, door: 0 },
  { shot: shot(10), via: [[21, 9, -8]], door: 0 },
  { shot: shot(11), via: [[16, 11, 33]], door: 0 },
  { shot: shot(12), door: 0 },
];

/** Share of each scene spent travelling in; the rest is the hold. */
const TRAVEL = 0.5;
/** How far the camera eases toward its subject during a hold (fraction of the distance). */
const PUSH = 0.07;

export const SCENE_COUNT = DEFS.length;

export interface Frame {
  /** Scene whose caption is showing (0-based). */
  scene: number;
  /** 0–1 within the current scene. */
  local: number;
  /** Black dip between disconnected spaces, 0–1. */
  fade: number;
  /** Cross-fade weight of the previous scene's still image (fallback mode), 0–1. */
  fromPrevious: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const vec = (v: V3) => new THREE.Vector3(...v);
const ease = (t: number) => t * t * (3 - 2 * t);

// Where each scene's hold ends (the camera has eased toward the subject)
const holdEnd = DEFS.map((d) => vec(d.shot.position).lerp(vec(d.shot.target), PUSH));

// Precomputed travel curves (from the previous scene's hold end, via waypoints, to this shot)
const curves = DEFS.map((d, i) => {
  if (i === 0 || d.cut) return null;
  const points = [holdEnd[i - 1]!, ...(d.via ?? []).map(vec), vec(d.shot.position)];
  return new THREE.CatmullRomCurve3(points, false, 'centripetal');
});

/** Scroll position (0–1) where scene `i`'s hold begins: used by the scene rail to jump. */
export function sceneHoldStart(i: number) {
  return (i + (i === 0 ? 0 : TRAVEL)) / SCENE_COUNT;
}

const scratch = { position: new THREE.Vector3(), target: new THREE.Vector3() };

/** Evaluate the timeline at `progress` (0–1). Reuses its vectors: copy them to keep values. */
export function evaluate(progress: number): Frame {
  const p = THREE.MathUtils.clamp(progress, 0, 0.99999) * SCENE_COUNT;
  const i = Math.floor(p);
  const local = p - i;
  const def = DEFS[i]!;
  const pos = scratch.position;
  const tgt = scratch.target;
  let fade = 0;
  let fromPrevious = 0;
  let fov = def.shot.fov;

  const hold = (t: number) => {
    pos.copy(vec(def.shot.position)).lerp(holdEnd[i]!, ease(t));
    tgt.copy(vec(def.shot.target));
  };

  if (i === 0 || local >= TRAVEL) {
    hold(i === 0 ? local : (local - TRAVEL) / (1 - TRAVEL));
  } else {
    const t = local / TRAVEL;
    const prev = DEFS[i - 1]!;
    fromPrevious = 1 - ease(t);
    if (def.cut) {
      // Hold the previous view while fading out, then fade in on a slight push into the new one
      fade = t < 0.5 ? ease(t * 2) : ease(2 - t * 2);
      if (t < 0.5) {
        pos.copy(holdEnd[i - 1]!);
        tgt.copy(vec(prev.shot.target));
        fov = prev.shot.fov;
      } else {
        const k = ease((t - 0.5) * 2);
        const start = vec(def.shot.position).lerp(vec(def.shot.target), -0.08);
        pos.copy(start).lerp(vec(def.shot.position), k);
        tgt.copy(vec(def.shot.target));
      }
    } else {
      const k = ease(t);
      curves[i]!.getPoint(k, pos);
      tgt.copy(vec(prev.shot.target)).lerp(vec(def.shot.target), k);
      fov = THREE.MathUtils.lerp(prev.shot.fov, def.shot.fov, k);
    }
  }
  return { scene: i, local, fade, fromPrevious, position: pos, target: tgt, fov };
}

/** Write the world state (time of day, lights, interior glow, door) for `progress`. */
export function applyWorld(progress: number, controls: WorldControls) {
  const p = THREE.MathUtils.clamp(progress, 0, 0.99999) * SCENE_COUNT;
  const i = Math.floor(p);
  const local = p - i;
  const def = DEFS[i]!;
  const prev = DEFS[Math.max(0, i - 1)]!;
  let k = 1;
  if (i > 0 && local < TRAVEL) {
    const t = local / TRAVEL;
    // Cuts switch at the darkest moment; travel blends along the way
    k = def.cut ? (t < 0.5 ? 0 : 1) : ease(t);
  }
  controls.night = THREE.MathUtils.lerp(prev.shot.night, def.shot.night, k);
  controls.ambient = THREE.MathUtils.lerp(prev.shot.ambient, def.shot.ambient, k);
  controls.from = prev.shot.lights;
  controls.to = def.shot.lights;
  controls.mix = k;
  // The door swings open early in the approach from the porch, so it is fully open before
  // the camera reaches the threshold
  controls.door = i === 2 && local < TRAVEL ? THREE.MathUtils.clamp((local / TRAVEL) * 2.6, 0, 1) : def.door;
}

/** Widen the lens on narrower screens so rooms keep their width in frame (live and stills). */
export function fovForAspect(fov: number, aspect: number) {
  return fov * Math.min(1.45, Math.max(1, Math.pow(1.6 / aspect, 0.55)));
}