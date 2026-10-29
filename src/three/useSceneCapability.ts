import { useEffect, useState } from 'react';
import { detectSceneCapability, type SceneCapability } from './capability';

/** Capability, read once on first render. */
export function useSceneCapability(): SceneCapability {
  const [capability] = useState(detectSceneCapability);
  return capability;
}

/**
 * True once the browser is idle after first paint (or after `timeout` ms), so heavy 3D code
 * is only requested once the page's own content has loaded.
 */
export function useIdleReady(enabled: boolean, timeout = 1500): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const idle = window.requestIdleCallback;
    if (idle) {
      const id = idle(() => setReady(true), { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(id);
  }, [enabled, timeout]);

  return ready;
}
