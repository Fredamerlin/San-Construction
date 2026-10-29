import { useEffect, useRef, type RefObject } from 'react';
import { frameUrl, keyFrames, sequence } from './sequence';

export interface SequenceApi {
  /** Show `frame` (fractional is fine) at `zoom` (1 = cover-fit). Cheap when nothing changed. */
  draw: (frame: number, zoom: number) => void;
}

type SetKey = 'd' | 'm';

/** Upright screens get the portrait crops; everything else the landscape frames. */
const pickSet = (width: number, height: number): SetKey => (height > width * 1.1 ? 'm' : 'd');

const MAX_DPR = 1.5;
const PARALLEL = 6;
/** Frames ahead of / behind the current one that load before the rest of the sequence. */
const AHEAD = 36;
const BEHIND = 8;

/**
 * Canvas that shows one frame of the walkthrough sequence, cover-fitted.
 *
 * Loading: the first frame, then every scene's view, then the whole sequence coarse to fine
 * (every 16th frame, every 8th, …), always preferring frames just ahead of the current one.
 * Until a frame arrives the nearest loaded one is shown, so scrolling never shows a gap.
 * Decoded images are left to the browser's cache, as with any large image sequence.
 */
export function FrameSequence({ apiRef, onReady }: { apiRef: RefObject<SequenceApi | null>; onReady: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext('2d', { alpha: false });
    if (!element || !ctx) return;
    const total = sequence.frames;

    let set: SetKey = pickSet(element.clientWidth, element.clientHeight);
    let images: (HTMLImageElement | undefined)[] = [];
    let loaded = new Uint8Array(total);
    let requested = new Uint8Array(total);
    let order: number[] = [];
    let cursor = 0;
    let inflight = 0;
    let firstSettled = false;
    let generation = 0;
    let wanted = 0;
    let wantedZoom = 1;
    let drawn = { index: -1, zoom: 0, width: 0, height: 0, set };
    let readySent = false;

    const resetLoader = () => {
      generation++;
      images = new Array(total);
      loaded = new Uint8Array(total);
      requested = new Uint8Array(total);
      inflight = 0;
      firstSettled = false;
      cursor = 0;
      // Coarse to fine after the scene views, so a fast scroll always has something close by
      const seen = new Set<number>([0, ...keyFrames()]);
      order = [...seen];
      for (const stride of [16, 8, 4, 2, 1]) {
        for (let i = 0; i < total; i += stride) {
          if (!seen.has(i)) {
            seen.add(i);
            order.push(i);
          }
        }
      }
      pump();
    };

    const next = () => {
      const centre = Math.round(wanted);
      for (let d = 0; d <= AHEAD; d++) {
        const ahead = centre + d;
        if (ahead < total && !requested[ahead]) return ahead;
        const behind = centre - d;
        if (d <= BEHIND && behind >= 0 && !requested[behind]) return behind;
      }
      while (cursor < order.length && requested[order[cursor]!]) cursor++;
      return cursor < order.length ? order[cursor]! : -1;
    };

    function pump() {
      while (inflight < PARALLEL) {
        // The first frame on its own, so the opening view appears as early as possible
        const index = requested[0] ? (firstSettled ? next() : -1) : 0;
        if (index < 0) return;
        requested[index] = 1;
        inflight++;
        const gen = generation;
        const image = new Image();
        image.decoding = 'async';
        image.src = frameUrl(set, index);
        image
          .decode()
          .then(() => {
            if (gen !== generation) return;
            images[index] = image;
            loaded[index] = 1;
            if (index === 0 && !readySent) {
              readySent = true;
              onReady();
            }
            paint(true);
          })
          .catch(() => {})
          .finally(() => {
            if (gen !== generation) return;
            if (index === 0) firstSettled = true;
            inflight--;
            pump();
          });
      }
    }

    const nearestLoaded = (target: number) => {
      for (let d = 0; d < total; d++) {
        if (target + d < total && loaded[target + d]) return target + d;
        if (target - d >= 0 && loaded[target - d]) return target - d;
      }
      return -1;
    };

    function paint(force = false) {
      if (!element || !ctx) return;
      const target = Math.min(total - 1, Math.max(0, Math.round(wanted)));
      const index = loaded[target] ? target : nearestLoaded(target);
      if (index < 0) return;
      const { width, height } = element;
      if (!force && index === drawn.index && wantedZoom === drawn.zoom && width === drawn.width && height === drawn.height && set === drawn.set) return;
      const image = images[index]!;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * wantedZoom;
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      drawn = { index, zoom: wantedZoom, width, height, set };
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      element.width = Math.round(element.clientWidth * dpr);
      element.height = Math.round(element.clientHeight * dpr);
      const nextSet = pickSet(element.clientWidth, element.clientHeight);
      if (nextSet !== set) {
        set = nextSet;
        resetLoader();
      }
      paint(true);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    resetLoader();

    apiRef.current = {
      draw(frame, zoom) {
        const moved = Math.abs(frame - wanted) > 0.5;
        wanted = frame;
        wantedZoom = Math.round(zoom * 2000) / 2000;
        // Moving into frames that aren't loaded: start fetching them
        if (moved && !loaded[Math.round(frame)]) pump();
        paint();
      },
    };

    return () => {
      generation++;
      observer.disconnect();
      apiRef.current = null;
    };
  }, [apiRef, onReady]);

  return <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />;
}
