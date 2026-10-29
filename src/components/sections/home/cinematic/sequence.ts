import data from '../../../../data/cinematic.json';

export interface SequenceManifest {
  version: string;
  frames: number;
  /** d: landscape frames for wide screens; m: portrait crops for upright phones. */
  sets: Record<'d' | 'm', { width: number; height: number }>;
  /** First and last frame of each clip (inclusive, 0-based). */
  shots: { start: number; end: number }[];
  /** Captioned views, in order: the frame each scene's view sits on. */
  scenes: { label: string; frame: number }[];
}
const manifest = data as SequenceManifest;

/**
 * Scroll timeline for the cinematic walkthrough: the frame sequence built from the clips by
 * scripts/cinematic/build-frames.mjs. Each captioned scene sits on one frame of the sequence.
 * Scene 0 is the opening view; each later scene's slice of the scroll is mostly travel (the
 * footage plays from the previous scene's frame to this one) and ends with a short hold while
 * its caption is read.
 */

export const sequence = manifest;
export const SEQUENCE_SCENES = manifest.scenes?.length ?? 0;
/** The sequence has been built: the home page uses it instead of the real-time 3D scene. */
export const sequenceReady = manifest.frames > 0 && SEQUENCE_SCENES >= 2;

/** Share of each scene spent travelling; the rest is the hold. */
const TRAVEL = 0.78;
/** Opening view: starts slightly enlarged and settles as the visitor begins to scroll. */
const OPENING_ZOOM = 0.06;

const smooth = (t: number) => t * t * (3 - 2 * t);
// Half linear, half eased: no stop-start mid-travel, gentle into and out of each hold
const travelEase = (t: number) => 0.5 * t + 0.5 * smooth(t);

export interface SequenceFrame {
  scene: number;
  /** 0–1 within the scene. */
  local: number;
  /** Frame to show (fractional; the player rounds to the nearest loaded one). */
  frame: number;
  zoom: number;
  /** Dip to black (reduced motion only: scenes swap instead of playing). */
  fade: number;
}

/** Scroll position (0–1) where scene `i`'s hold begins: used by the scene rail to jump. */
export function sceneHoldStart(i: number) {
  return (i + (i === 0 ? 0 : TRAVEL)) / SEQUENCE_SCENES;
}

export function evaluateSequence(progress: number, reduced: boolean): SequenceFrame {
  const count = SEQUENCE_SCENES;
  const p = Math.min(Math.max(progress, 0), 0.99999) * count;
  const scene = Math.floor(p);
  const local = p - scene;
  const marks = manifest.scenes;

  if (scene === 0) {
    return { scene, local, frame: marks[0]!.frame, zoom: reduced ? 1 : 1 + OPENING_ZOOM * (1 - smooth(local)), fade: 0 };
  }
  const from = marks[scene - 1]!.frame;
  const to = marks[scene]!.frame;
  if (local >= TRAVEL) return { scene, local, frame: to, zoom: 1, fade: 0 };

  const t = local / TRAVEL;
  if (reduced) {
    // No camera motion: dip to black and swap to the next scene's view
    const fade = t < 0.5 ? smooth(t * 2) : smooth(2 - t * 2);
    return { scene, local, frame: t < 0.5 ? from : to, zoom: 1, fade };
  }
  return { scene, local, frame: from + (to - from) * travelEase(t), zoom: 1, fade: 0 };
}

/** Frames worth having before anything else: each scene's view (jump targets, reduced motion). */
export function keyFrames() {
  return manifest.scenes.map((s) => s.frame);
}

export function frameUrl(set: 'd' | 'm', index: number) {
  return `${import.meta.env.BASE_URL}cinematic/${set}/${String(index + 1).padStart(5, '0')}.webp?v=${manifest.version}`;
}
