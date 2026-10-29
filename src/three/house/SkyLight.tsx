import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useEnvironment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneQuality } from '../capability';
import { lampMaterials, type HouseMaterials } from './materials';
import type { WorldControls } from './RoomLights';

/**
 * Sky, sun and time of day.
 * - A CC0 sunset HDRI lights the scene and appears in reflections; a tonemapped copy of the
 *   same panorama is the visible sky (lighter download than showing the HDR itself).
 * - Both are rotated so the sunset glow sits behind the house, to the left of the opening
 *   shot, and the sun light comes from the same direction as the glow.
 * - `controls.night` (0 = sunset, 1 = night) dims the sky and sun and brightens every lamp, read each
 *   frame from a ref so scrolling never re-renders React.
 */

const SKY = `${import.meta.env.BASE_URL}house/sky/industrial_sunset_02_puresky`;

// Where the sun is in the panorama, as atan2(z, x) of its direction (measured from the image).
const SUN_AZIMUTH_IN_SKY = THREE.MathUtils.degToRad(36);
// Where we want it in the world: low, behind the house and to its left as seen from the road,
// so the opening shot (from the front right) has the glow beside the house and a warm rim on
// the roof, while the facade is lit by its own lamps, as in dusk architectural photography.
const SUN_DIRECTION = new THREE.Vector3(-0.75, 0.15, -0.64).normalize();
const SKY_ROTATION = Math.atan2(SUN_DIRECTION.z, SUN_DIRECTION.x) - SUN_AZIMUTH_IN_SKY;

const DUSK_FOG = new THREE.Color('#9a8f9c');
const NIGHT_FOG = new THREE.Color('#121826');

export function SkyLight({ materials, controls, quality }: { materials: HouseMaterials; controls: WorldControls; quality: SceneQuality }) {
  const { scene } = useThree();
  const environment = useEnvironment({ files: `${SKY}_1k.hdr` });
  const backdrop = useTexture(`${SKY}.webp`);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fog = useMemo(() => new THREE.Fog(DUSK_FOG.clone(), 45, 210), []);
  const lamps = useMemo(() => lampMaterials(materials), [materials]);
  const applied = useRef(-1);

  useLayoutEffect(() => {
    backdrop.mapping = THREE.EquirectangularReflectionMapping;
    backdrop.colorSpace = THREE.SRGBColorSpace;
    const previous = { background: scene.background, environment: scene.environment, fog: scene.fog };
    scene.background = backdrop;
    scene.environment = environment;
    scene.fog = fog;
    // Three.js rotates the lookup direction; negating gives the intended world rotation
    scene.backgroundRotation.set(0, -SKY_ROTATION, 0);
    scene.environmentRotation.set(0, -SKY_ROTATION, 0);
    return () => {
      scene.background = previous.background;
      scene.environment = previous.environment;
      scene.fog = previous.fog;
    };
  }, [scene, backdrop, environment, fog]);

  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
  }, []);

  // Nothing in the world moves except the camera and the door, so the sun's shadow map is
  // rendered once instead of every frame (a large saving on integrated graphics).
  const get = useThree((state) => state.get);
  useEffect(() => {
    const { gl } = get();
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [get]);

  useFrame(() => {
    const n = THREE.MathUtils.clamp(controls.night, 0, 1);
    if (Math.abs(n - applied.current) < 0.0005) return;
    applied.current = n;
    const day = 1 - n;
    scene.backgroundIntensity = THREE.MathUtils.lerp(0.16, 0.92, day * day);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.1, 0.55, day);
    if (sun.current) sun.current.intensity = 3.2 * Math.pow(day, 1.5);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.12, 0.22, day);
    fog.color.copy(DUSK_FOG).lerp(NIGHT_FOG, n);
    // Lamps read stronger as the sky darkens
    const glow = THREE.MathUtils.lerp(1, 1.5, n);
    for (const lamp of lamps) lamp.color.copy(lamp.userData.base as THREE.Color).multiplyScalar(glow);
  });

  const shadowSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <directionalLight
        ref={sun}
        position={SUN_DIRECTION.clone().multiplyScalar(60)}
        color="#ffb27a"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={10}
        shadow-camera-far={130}
      />
      {/* Cool sky fill from above, so shaded walls read blue-grey rather than black */}
      <hemisphereLight ref={hemi} args={['#a7b2c8', '#3a2c22', 0.22]} />
    </>
  );
}
