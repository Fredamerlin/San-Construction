import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { SceneQuality } from './capability';

const STARTUP_TIMEOUT = 5000;

export interface SceneCanvasProps {
  quality: SceneQuality;
  fov: number;
  position: [number, number, number];
  children: ReactNode;
  /** Called once the first frames have rendered, so the still underneath can fade out. */
  onReady?: () => void;
  /** Called if the device can't keep up (sustained low frame rate) or loses its WebGL context. */
  onFail?: () => void;
  className?: string;
}

/**
 * Shared canvas setup for every scene:
 * - capped pixel ratio (1.5 on low-quality devices, 2 otherwise)
 * - stops rendering entirely when off-screen or when the tab is hidden
 * - never receives pointer events, so it can't block links, buttons or focus
 * - hidden from assistive technology; all content is in regular HTML
 */
export function SceneCanvas({ quality, fov, position, children, onReady, onFail, className = '' }: SceneCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  // Startup guard: if the first frames haven't rendered within STARTUP_TIMEOUT (slow shader
  // compilation on a weak GPU, or a software renderer), give up and keep the still image,
  // so the scene can't monopolise the main thread.
  // The timer starts once on mount; the latest onFail is read from a ref so parent re-renders
  // (e.g. while scrolling) don't keep restarting it.
  const readyRef = useRef(false);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onFailRef.current = onFail;
  });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!readyRef.current) onFailRef.current?.();
    }, STARTUP_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const element = wrapRef.current;
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
    <div ref={wrapRef} aria-hidden="true" className={`pointer-events-none ${className}`}>
      <Canvas
        dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
        gl={{ antialias: quality === 'high', alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov, near: 1, far: 400, position }}
        frameloop={onScreen && pageVisible ? 'always' : 'never'}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onFail?.();
          });
        }}
      >
        {children}
        <FrameWatch
          onReady={() => {
            readyRef.current = true;
            onReady?.();
          }}
          onSlow={onFail}
        />
      </Canvas>
    </div>
  );
}

/**
 * Reports the first rendered frames, then samples frame times once. If the average over
 * ~60 frames is slower than ~24fps, the scene is handed back to the still image to protect
 * battery and responsiveness on weaker devices.
 */
function FrameWatch({ onReady, onSlow }: { onReady?: () => void; onSlow?: () => void }) {
  const frames = useRef(0);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    if (frames.current === 3) onReady?.();
    if (frames.current > 15 && frames.current <= 75) {
      // Ignore huge gaps (tab switches) so they don't count as slowness
      elapsed.current += Math.min(delta, 0.25);
      if (frames.current === 75 && elapsed.current / 60 > 1 / 24) onSlow?.();
    }
  });

  return null;
}
