import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroContent } from '../three/HeroScene';
import { ProcessContent } from '../three/ProcessScene';
import { Effects } from '../three/house/Effects';
import { HouseWorld } from '../three/house/HouseWorld';
import type { WorldControls } from '../three/house/RoomLights';
import { shotById } from '../three/house/shots';
import { fovForAspect } from '../three/house/timeline';

/**
 * Development-only still renderer (see render.html and scripts/render-stills.mjs).
 *   render.html?view=hero            the home hero at scroll position 0
 *   render.html?view=stage&stage=3   the building at a construction stage, for the Process page
 *   render.html?view=house&shot=1    a walkthrough shot (&night=0..1 and &ambient=n override it)
 *   &bg=#181716                      background colour (default: page charcoal)
 * Sets window.__renderReady once enough frames have rendered for everything to settle.
 */

declare global {
  interface Window {
    __renderReady?: boolean;
  }
}

const params = new URLSearchParams(window.location.search);
const view = params.get('view') ?? 'hero';
const stageValue = Number(params.get('stage') ?? 6);
const background = params.get('bg') ?? '#080808';

function ReadyAfterFrames({ frames = 90 }: { frames?: number }) {
  const count = useRef(0);
  useFrame(() => {
    count.current += 1;
    if (count.current === frames) window.__renderReady = true;
  });
  return null;
}

function ShotCamera({ shot }: { shot: ReturnType<typeof shotById> }) {
  const get = useThree((state) => state.get);
  useLayoutEffect(() => {
    const cam = get().camera as THREE.PerspectiveCamera;
    cam.position.set(...shot.position);
    cam.fov = fovForAspect(shot.fov, window.innerWidth / window.innerHeight);
    cam.near = 0.1;
    cam.far = 600;
    cam.lookAt(new THREE.Vector3(...shot.target));
    cam.updateProjectionMatrix();
  }, [get, shot]);
  return null;
}

// Optional free camera for development: &pos=x,y,z&target=x,y,z&fov=n
const vec = (key: string) => params.get(key)?.split(',').map(Number) as [number, number, number] | undefined;

function HouseStill() {
  const base = shotById(Number(params.get('shot') ?? 1));
  const shot = { ...base, position: vec('pos') ?? base.position, target: vec('target') ?? base.target, fov: Number(params.get('fov') ?? base.fov) };
  const controls = useMemo<WorldControls>(
    () => ({
      night: params.has('night') ? Number(params.get('night')) : base.night,
      ambient: params.has('ambient') ? Number(params.get('ambient')) : base.ambient,
      from: base.lights,
      to: base.lights,
      mix: 0,
      door: params.has('door') ? Number(params.get('door')) : 0,
    }),
    [base],
  );
  const quality = params.get('quality') === 'low' ? 'low' : 'high';
  return (
    <Canvas dpr={1} shadows flat gl={{ antialias: false, preserveDrawingBuffer: true }} camera={{ fov: shot.fov }}>
      <Suspense fallback={null}>
        <ShotCamera shot={shot} />
        <HouseWorld quality={quality} controls={controls} />
        <Effects quality={quality} />
        <ReadyAfterFrames frames={12} />
      </Suspense>
    </Canvas>
  );
}

function Still() {
  const stage = useMemo(() => ({ current: stageValue }), []);
  const progress = useMemo(() => ({ current: 0 }), []);

  if (view === 'house') return <HouseStill />;

  return (
    <Canvas
      dpr={1}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 30, near: 1, far: 400, position: [30, 12, 50] }}
      style={{ background }}
    >
      {view === 'hero' ? (
        <HeroContent quality="high" progress={progress} interactive={false} />
      ) : (
        <ProcessContent stage={stage} animate={false} />
      )}
      <ReadyAfterFrames />
    </Canvas>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<Still />);
