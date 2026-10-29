import type { SceneQuality } from '../capability';
import { House } from './House';
import { Interiors } from './Interiors';
import { useHouseMaterials } from './materials';
import { RoomLights, type WorldControls } from './RoomLights';
import { Site } from './Site';
import { SkyLight } from './SkyLight';

/**
 * Everything in the walkthrough world except the camera and post-processing, shared by the
 * live scroll scene and the still renderer. Suspends while textures, sky and models load.
 * `controls` is mutable and read every frame (time of day, interior glow, room lighting).
 */
export function HouseWorld({ quality, controls }: { quality: SceneQuality; controls: WorldControls }) {
  const materials = useHouseMaterials(quality);
  return (
    <>
      <SkyLight materials={materials} controls={controls} quality={quality} />
      <RoomLights controls={controls} />
      <House materials={materials} controls={controls} />
      <Interiors materials={materials} controls={controls} />
      <Site materials={materials} />
    </>
  );
}
