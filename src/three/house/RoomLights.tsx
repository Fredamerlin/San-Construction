import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EAVE_Y, FIRST_FLOOR, PLINTH } from './layout';

/**
 * Shared, mutable state that drives the world. The scroll timeline (or a still render)
 * writes it; components read it every frame, so nothing re-renders React while scrolling.
 */
export interface WorldControls {
  /** 0 = sunset, 1 = night. */
  night: number;
  /** How strongly interiors glow on their own (high outside, low inside). */
  ambient: number;
  /** Room lighting: blend from preset `from` to preset `to` by `mix` (0–1). */
  from: LightPreset;
  to: LightPreset;
  mix: number;
  /** Front door: 0 closed, 1 open. */
  door: number;
}

export type LightPreset = 'exterior' | 'living' | 'dining' | 'kitchen' | 'bedroom' | 'bathroom' | 'terrace';

interface RoomLight {
  position: [number, number, number];
  intensity: number;
  distance: number;
  color?: string;
}

const G = PLINTH; // ground-floor level
const C0 = FIRST_FLOOR.y - 0.3; // just below the ground-floor ceiling
const F = FIRST_FLOOR.y;
const C1 = EAVE_Y - 0.3;

// Up to three lights per room, placed at its fittings. Values tuned by eye in renders.
const PRESETS: Record<LightPreset, RoomLight[]> = {
  exterior: [{ position: [0, C0 - 0.05, 7.7], intensity: 9, distance: 9 }],
  living: [
    { position: [-3.3, C0, 2.9], intensity: 24, distance: 10 },
    { position: [-3.6, G + 2.2, 1.0], intensity: 7, distance: 5 },
    { position: [1.8, C0, 3.4], intensity: 12, distance: 8 },
  ],
  dining: [
    { position: [2.2, G + 2.4, -2.7], intensity: 16, distance: 7 },
    { position: [-0.2, C0, -1.0], intensity: 6, distance: 6 },
    { position: [5.2, C0, -4.4], intensity: 9, distance: 7 },
  ],
  kitchen: [
    { position: [-4.0, C0, -3.0], intensity: 20, distance: 8 },
    { position: [-5.9, G + 1.4, -3.0], intensity: 4, distance: 3 },
    { position: [-3.7, G + 1.4, -5.0], intensity: 4, distance: 3 },
  ],
  bedroom: [
    { position: [-2.4, C1, 3.1], intensity: 18, distance: 9 },
    { position: [-4.75, F + 1.0, 1.05], intensity: 4, distance: 3.5, color: '#ffb46a' },
    { position: [-2.05, F + 1.0, 1.05], intensity: 4, distance: 3.5, color: '#ffb46a' },
  ],
  bathroom: [
    { position: [-4.2, C1, -3.4], intensity: 14, distance: 7 },
    { position: [-5.85, F + 1.6, -5.4], intensity: 4, distance: 2.5 },
    { position: [-4.3, C1, -5.1], intensity: 5, distance: 3.5 },
  ],
  terrace: [
    { position: [3.9, C1 + 0.1, -3.4], intensity: 10, distance: 8 },
    { position: [3.9, F + 0.65, -3.3], intensity: 3, distance: 3, color: '#ff9c4a' },
  ],
};

const BANK = 3;
const DEFAULT_COLOR = new THREE.Color('#ffc58a');

/**
 * Six point lights, always present (so the shader never recompiles as rooms change):
 * bank A shows preset `from`, bank B shows preset `to`, cross-faded by `mix`.
 * No shadows: interior shadowing comes from the scene's ambient occlusion and fittings.
 */
export function RoomLights({ controls }: { controls: WorldControls }) {
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  const color = new THREE.Color();

  useFrame(() => {
    const apply = (preset: LightPreset, offset: number, weight: number) => {
      const list = PRESETS[preset];
      for (let i = 0; i < BANK; i++) {
        const light = lights.current[offset + i];
        if (!light) continue;
        const spec = list[i];
        if (!spec || weight <= 0.001) {
          light.intensity = 0;
          continue;
        }
        light.position.set(...spec.position);
        light.intensity = spec.intensity * weight;
        light.distance = spec.distance;
        light.color.copy(spec.color ? color.set(spec.color) : DEFAULT_COLOR);
      }
    };
    const mix = controls.to === controls.from ? 0 : THREE.MathUtils.clamp(controls.mix, 0, 1);
    apply(controls.from, 0, 1 - mix);
    apply(controls.to, BANK, mix);
  });

  return (
    <>
      {Array.from({ length: BANK * 2 }, (_, i) => (
        <pointLight
          key={i}
          ref={(light) => {
            lights.current[i] = light;
          }}
          intensity={0}
          decay={2}
        />
      ))}
    </>
  );
}
