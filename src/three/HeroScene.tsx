import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BuildingModel } from './BuildingModel';
import { SceneCanvas } from './SceneCanvas';
import { SceneEnvironment } from './SceneEnvironment';
import type { SceneQuality } from './capability';

gsap.registerPlugin(ScrollTrigger);

export interface HeroSceneProps {
  quality: SceneQuality;
  /** The hero section; its scroll progress drives the camera. */
  scrollTarget: RefObject<HTMLElement | null>;
  /** The hero holds for an extra screen on desktop (CSS sticky); scroll runs to its bottom edge. */
  tall: boolean;
  onReady: () => void;
  onFail: () => void;
}

/** Live home-hero scene. Default export so it can be lazy-loaded as its own chunk. */
export default function HeroScene({ quality, scrollTarget, tall, onReady, onFail }: HeroSceneProps) {
  const progress = useRef(0);

  // Scroll progress only *reads* the page's native scroll position (no pinning, no hijacking).
  // GSAP's ScrollTrigger handles resize/refresh; the camera rig smooths the value per frame.
  useLayoutEffect(() => {
    const element = scrollTarget.current;
    if (!element) return;
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top top',
      end: tall ? 'bottom bottom' : 'bottom top',
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => trigger.kill();
  }, [scrollTarget, tall]);

  return (
    <SceneCanvas quality={quality} fov={30} position={[30, 12, 50]} onReady={onReady} onFail={onFail} className="absolute inset-0">
      <HeroContent quality={quality} progress={progress} interactive />
    </SceneCanvas>
  );
}

/** Scene contents, shared with the still-image renderer. */
export function HeroContent({
  quality,
  progress,
  interactive,
}: {
  quality: SceneQuality;
  progress: { current: number };
  /** Drift and pointer response. Off for still renders. */
  interactive: boolean;
}) {
  const stage = useMemo(() => ({ current: 6 }), []);
  const glow = useRef(1);

  return (
    <>
      <SceneEnvironment background="#080808" />
      <BuildingModel stage={stage} glow={glow} />
      {quality === 'high' && (
        <ContactShadows frames={1} position={[2, 0.01, 0]} scale={60} blur={2.6} far={24} opacity={0.75} resolution={512} />
      )}
      <HeroCameraRig progress={progress} glow={glow} interactive={interactive} />
    </>
  );
}

const BUILDING_CENTRE = new THREE.Vector3(2, 10, 0);

/**
 * Camera choreography:
 * - wide screens: a three-quarter view with the building framed to the right of the headline
 * - portrait screens: wider lens, building centred in the upper half above the text
 * - scroll: a short arc toward the corner, lower and closer, as windows warm up
 * - idle drift and a slight pointer response on devices with a mouse
 */
function HeroCameraRig({
  progress,
  glow,
  interactive,
}: {
  progress: { current: number };
  glow: { current: number };
  interactive: boolean;
}) {
  const { camera, size } = useThree();
  const smoothed = useRef(progress.current);
  const pointer = useRef({ x: 0, y: 0 });
  const pointerSmoothed = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!interactive || !window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [interactive]);

  useFrame((state, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const portrait = aspect < 1;

    smoothed.current = THREE.MathUtils.damp(smoothed.current, progress.current, 4, delta);
    pointerSmoothed.current.x = THREE.MathUtils.damp(pointerSmoothed.current.x, pointer.current.x, 2.5, delta);
    pointerSmoothed.current.y = THREE.MathUtils.damp(pointerSmoothed.current.y, pointer.current.y, 2.5, delta);
    const p = smoothed.current;
    const drift = interactive ? Math.sin(state.clock.elapsedTime * 0.12) * 0.03 : 0;

    const fov = portrait ? 44 : 30;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    const angle = THREE.MathUtils.lerp(0.62, 0.98, p) + drift + pointerSmoothed.current.x * 0.06;
    // Narrower landscape screens (e.g. 4:3 tablets) pull back so the building stays clear of the text
    const narrowness = portrait ? 1 : THREE.MathUtils.clamp(1.6 / aspect, 1, 1.4);
    const radius = (portrait ? 68 : 70) * narrowness * THREE.MathUtils.lerp(1, 0.86, p);
    const height = THREE.MathUtils.lerp(portrait ? 9 : 10, 4.5, p) - pointerSmoothed.current.y * 1.2;

    cam.position.set(
      BUILDING_CENTRE.x + Math.sin(angle) * radius,
      height,
      BUILDING_CENTRE.z + Math.cos(angle) * radius,
    );

    // Frame the building: on wide screens aim left of it so it sits right of the headline;
    // on portrait screens aim low so it sits above the text block.
    target.copy(BUILDING_CENTRE);
    if (portrait) {
      target.y -= 9;
    } else {
      right.set(Math.cos(angle), 0, -Math.sin(angle));
      target.addScaledVector(right, -THREE.MathUtils.lerp(10, 9, p) * narrowness * Math.min(aspect / 1.6, 1.2) ** 0.5);
      target.y += 1.5;
    }
    cam.lookAt(target);

    glow.current = THREE.MathUtils.lerp(1, 1.35, p);
  });

  return null;
}
