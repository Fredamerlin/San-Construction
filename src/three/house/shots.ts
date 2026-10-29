import type { LightPreset } from './RoomLights';

/**
 * Camera framings for the walkthrough, following the storyboard (scene numbers match it).
 * Each shot is where the camera rests for that scene; the scroll timeline moves between them.
 * Interior shots switch the room lights to that room and turn the interiors' self-glow down.
 */

export interface Shot {
  id: number;
  title: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** 0 = sunset, 1 = night */
  night: number;
  lights: LightPreset;
  /** Interiors' own warm glow: higher outside (lit windows), low inside (room lights do it). */
  ambient: number;
}

const OUTSIDE = 0.55;
const INSIDE = 0.1;

export const SHOTS: Shot[] = [
  { id: 1, title: 'Exterior view', position: [11, 3.3, 27.5], target: [-3.6, 4.1, 0], fov: 40, night: 0, lights: 'exterior', ambient: OUTSIDE },
  { id: 2, title: 'Front approach', position: [0.6, 1.75, 12.6], target: [0, 2.2, 6], fov: 52, night: 0.15, lights: 'exterior', ambient: OUTSIDE },
  { id: 3, title: 'Living room', position: [1.1, 2.15, 5.1], target: [-4.4, 1.35, 1.0], fov: 62, night: 0.2, lights: 'living', ambient: INSIDE },
  { id: 4, title: 'Dining area', position: [1.9, 2.2, 2.7], target: [2.3, 1.3, -3.3], fov: 58, night: 0.25, lights: 'dining', ambient: INSIDE },
  { id: 5, title: 'Kitchen', position: [-1.65, 2.1, -1.9], target: [-5.0, 1.4, -4.95], fov: 64, night: 0.3, lights: 'kitchen', ambient: INSIDE },
  { id: 6, title: 'Bedroom', position: [1.7, 5.75, 4.65], target: [-3.6, 4.85, 1.3], fov: 60, night: 0.35, lights: 'bedroom', ambient: INSIDE },
  { id: 7, title: 'Bathroom', position: [-2.4, 5.75, -1.5], target: [-4.9, 5.3, -5.5], fov: 66, night: 0.4, lights: 'bathroom', ambient: INSIDE },
  { id: 8, title: 'Terrace', position: [6.3, 5.6, -1.85], target: [1.6, 5.0, -5.6], fov: 62, night: 0.2, lights: 'terrace', ambient: INSIDE },
  { id: 9, title: 'Side garden', position: [13.6, 1.7, -16], target: [3, 3.2, 1], fov: 52, night: 0.35, lights: 'exterior', ambient: OUTSIDE },
  { id: 10, title: 'Aerial view', position: [24, 27, 27], target: [0, 1.5, -1], fov: 36, night: 0.3, lights: 'exterior', ambient: OUTSIDE },
  { id: 11, title: 'Night view', position: [4, 2.1, 25], target: [0, 4, 2], fov: 40, night: 1, lights: 'exterior', ambient: OUTSIDE },
  { id: 12, title: 'Closing', position: [-2.5, 8, 40], target: [0.6, 5.0, 0], fov: 32, night: 1, lights: 'exterior', ambient: OUTSIDE },
];

export const shotById = (id: number) => SHOTS.find((s) => s.id === id) ?? SHOTS[0]!;
