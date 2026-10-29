import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BASE = `${import.meta.env.BASE_URL}house/models/`;
const modelUrl = (id: string) => `${BASE}${id}/${id}.gltf`;

/** Every downloaded prop; all are requested in parallel as soon as this chunk loads. */
const PROP_IDS = [
  'brass_diya_lantern',
  'potted_plant_04',
  'potted_plant_02',
  'ceiling_fan',
  'modern_arm_chair_01',
  'mid_century_lounge_chair',
  'modern_ceiling_lamp_01',
  'side_table_01',
  'brass_vase_01',
  'carved_wooden_elephant',
  'brass_pot_01',
  'wooden_bowl_01',
] as const;
export type PropId = (typeof PROP_IDS)[number];

/**
 * A downloaded CC0 prop (Poly Haven glTF), cloned so it can be placed many times.
 * `anchor` decides which point of its bounding box sits at `position`: the bottom centre
 * (things on floors and tables) or the top centre (things hanging from ceilings).
 * Props stay out of the static merge (they use a second UV set for shading).
 */
export function Prop({
  id,
  position,
  rotation = 0,
  scale = 1,
  anchor = 'bottom',
  spin = 0,
}: {
  id: PropId;
  position: [number, number, number];
  rotation?: number;
  scale?: number;
  anchor?: 'bottom' | 'top';
  /** Radians per second around the vertical axis (ceiling fans). */
  spin?: number;
}) {
  const gltf = useGLTF(modelUrl(id));
  const { object, offset } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const centre = box.getCenter(new THREE.Vector3());
    const y = anchor === 'bottom' ? box.min.y : box.max.y;
    return { object: clone, offset: new THREE.Vector3(-centre.x, -y, -centre.z) };
  }, [gltf, anchor]);

  const spinner = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin && spinner.current) spinner.current.rotation.y += spin * Math.min(delta, 0.1);
  });

  useLayoutEffect(() => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [object]);

  return (
    <group position={position} rotation-y={rotation} scale={scale} userData={{ dynamic: true }}>
      <group ref={spinner}>
        <primitive object={object} position={offset} />
      </group>
    </group>
  );
}

for (const id of PROP_IDS) useGLTF.preload(modelUrl(id));
