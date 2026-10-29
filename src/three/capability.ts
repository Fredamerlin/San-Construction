/**
 * Decides whether a device should get the live 3D scene or the still-image fallback.
 * Runs synchronously on first render (this is a client-only app), so layout decisions
 * that depend on it are made before first paint and never cause a layout shift.
 */

export type SceneQuality = 'high' | 'low';

export interface SceneCapability {
  enabled: boolean;
  quality: SceneQuality;
  /** Why 3D is off, for debugging. */
  reason?: 'reduced-motion' | 'save-data' | 'no-webgl' | 'software-gl' | 'low-power' | 'small-or-touch' | 'disabled-by-url';
}

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** WebGL support and, where the browser reveals it, the graphics chip's name. */
function probeGPU(): { ok: boolean; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, renderer: '' };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    // Release the probe context straight away; browsers limit live contexts
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { ok: true, renderer };
  } catch {
    return { ok: false, renderer: '' };
  }
}

// Software rasterisers can't run the scene smoothly; integrated and mobile GPUs get the
// lighter setting (measured: the walkthrough at 'high' ran ~22 fps on Intel UHD, 'low' ~60).
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|basic render|software/i;
const INTEGRATED_GPU = /intel|uhd|iris|mali|adreno|powervr|videocore|vivante/i;
export function detectSceneCapability(): SceneCapability {
  const off = (reason: SceneCapability['reason']): SceneCapability => ({ enabled: false, quality: 'low', reason });

  // ?3d=off forces the fallback, ?3d=low or ?3d=high forces the live scene (QA and comparison)
  const forced = new URLSearchParams(window.location.search).get('3d');
  if (forced === 'off') return off('disabled-by-url');
  if (forced === 'low' || forced === 'high') return { enabled: true, quality: forced };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return off('reduced-motion');

  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return off('save-data');

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (memory < 2 || cores < 2) return off('low-power');
  const gpu = probeGPU();
  if (!gpu.ok) return off('no-webgl');
  if (SOFTWARE_GL.test(gpu.renderer)) return off('software-gl');

  // Live 3D is reserved for desktop-class devices. On phones and tablets, starting three.js
  // cost several seconds of main-thread time in throttled Lighthouse runs, so they get the
  // still renders instead (same composition, no drift or camera move).
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const largeScreen = window.matchMedia('(min-width: 64rem)').matches;
  if (!finePointer || !largeScreen) return off('small-or-touch');

  const quality: SceneQuality = memory <= 4 || cores <= 4 || INTEGRATED_GPU.test(gpu.renderer) ? 'low' : 'high';
  return { enabled: true, quality };
}
