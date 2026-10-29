import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneQuality } from '../capability';
import { Effects } from './Effects';
import { HouseWorld } from './HouseWorld';
import type { WorldControls } from './RoomLights';
import { applyWorld, evaluate, fovForAspect } from './timeline';

/**
 * Live 3D walkthrough for the home page. Default export so it loads as its own chunk.
 * Reads the (already smoothed) scroll progress each frame; never re-renders while scrolling.
 */
export interface WalkthroughSceneProps {
  quality: SceneQuality;
  /** Smoothed scroll progress through the walkthrough section, 0–1 (owned by the page). */
  progress: { current: number };
  onReady: () => void;
  /** The device can't keep up, the context was lost, or assets didn't load in time. */
  onFail: () => void;
}

// Assets are ~12 MB; allow for a slow connection before giving up and keeping the stills
const LOAD_TIMEOUT = 30000;

export default function WalkthroughScene({ quality, progress, onReady, onFail }: WalkthroughSceneProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const controls = useMemo<WorldControls>(() => ({ night: 0, ambient: 0.55, from: 'exterior', to: 'exterior', mix: 0, door: 0 }), []);

  // Keep the latest callbacks without restarting timers on parent re-renders
  const callbacks = useRef({ onReady, onFail });
  useEffect(() => {
    callbacks.current = { onReady, onFail };
  });
  const ready = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!ready.current) callbacks.current.onFail();
    }, LOAD_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, []);

  // Stop rendering entirely when the section is off-screen or the tab is hidden
  useEffect(() => {
    const element = wrap.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)));
    observer.observe(element);
    const onVisibility = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Canvas
        dpr={quality === 'high' ? [1, 1.5] : 1}
        shadows
        flat
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 38, near: 0.1, far: 600, position: [11, 3.3, 27.5] }}
        frameloop={onScreen && pageVisible ? 'always' : 'never'}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          // Shader-log checks cost time and only surface driver notes (e.g. ANGLE/D3D
          // precision warnings); keep them for development only
          gl.debug.checkShaderErrors = import.meta.env.DEV;
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            callbacks.current.onFail();
          });
        }}
      >
        <Suspense fallback={null}>
          <HouseWorld quality={quality} controls={controls} />
          <Effects quality={quality} />
          <CameraRig progress={progress} controls={controls} />
          <FrameWatch
            onReady={() => {
              ready.current = true;
              callbacks.current.onReady();
            }}
            onSlow={() => callbacks.current.onFail()}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

/** Places the camera and updates the world from the timeline, every frame. */
function CameraRig({ progress, controls }: { progress: { current: number }; controls: WorldControls }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const frame = evaluate(progress.current);
    applyWorld(progress.current, controls);
    const camera = state.camera as THREE.PerspectiveCamera;
    camera.position.copy(frame.position);
    target.copy(frame.target);
    camera.lookAt(target);
    const fov = fovForAspect(frame.fov, state.size.width / state.size.height);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/**
 * Lives inside the Suspense boundary, so it only counts frames once the house has loaded.
 * Reports ready after the first frames, then checks the frame rate once: if the average
 * over ~60 frames is under ~24 fps, the page falls back to the still images.
 */
function FrameWatch({ onReady, onSlow }: { onReady: () => void; onSlow: () => void }) {
  const frames = useRef(0);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    frames.current += 1;
    if (frames.current === 3) onReady();
    // Skip the first frames (shader compilation), ignore tab-switch gaps
    if (frames.current > 20 && frames.current <= 80) {
      elapsed.current += Math.min(delta, 0.25);
      if (frames.current === 80 && elapsed.current / 60 > 1 / 24) onSlow();
    }
  });
  return null;
}
