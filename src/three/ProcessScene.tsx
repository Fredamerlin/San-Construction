import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingModel } from './BuildingModel';
import { SceneCanvas } from './SceneCanvas';
import { SceneEnvironment } from './SceneEnvironment';
import type { SceneQuality } from './capability';

export interface ProcessSceneProps {
  quality: SceneQuality;
  /** Construction stage 0–6, driven by scroll progress through the process steps. */
  stage: { current: number };
  onReady: () => void;
  onFail: () => void;
}

/** Process-page "build sequence". Default export so it can be lazy-loaded as its own chunk. */
export default function ProcessScene({ quality, stage, onReady, onFail }: ProcessSceneProps) {
  return (
    <SceneCanvas quality={quality} fov={32} position={[48, 26, 58]} onReady={onReady} onFail={onFail} className="absolute inset-0">
      <ProcessContent stage={stage} animate />
    </SceneCanvas>
  );
}

/** Scene contents, shared with the still-image renderer. */
export function ProcessContent({ stage, animate }: { stage: { current: number }; animate: boolean }) {
  return (
    <>
      {/* Matches the graphite panel the scene sits in */}
      <SceneEnvironment background="#181716" />
      <BuildingModel stage={stage} />
      <ProcessCamera animate={animate} />
    </>
  );
}

const CENTRE = new THREE.Vector3(2, 8, 0);

/** Fixed three-quarter view from above, with a very slow orbit so the model feels alive. */
function ProcessCamera({ animate }: { animate: boolean }) {
  const { camera, size } = useThree();
  const target = useMemo(() => CENTRE.clone(), []);

  useFrame((state) => {
    const aspect = size.width / size.height;
    const angle = 0.7 + (animate ? Math.sin(state.clock.elapsedTime * 0.08) * 0.08 : 0);
    // Pull back on narrow panels so the whole site stays in frame
    const radius = 54 * THREE.MathUtils.clamp(1 / aspect, 1, 1.5);
    camera.position.set(CENTRE.x + Math.sin(angle) * radius, 27, CENTRE.z + Math.cos(angle) * radius);
    camera.lookAt(target);
  });

  return null;
}
