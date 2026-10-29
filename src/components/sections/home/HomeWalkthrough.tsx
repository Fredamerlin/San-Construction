import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { primaryCta } from '../../../data/navigation';
import { walkthroughScenes as houseScenes } from '../../../data/walkthrough';
import { cinematicScenes } from '../../../data/cinematicScenes';
import type { ImageKey } from '../../../data/images';
import { SceneErrorBoundary } from '../../../three/SceneErrorBoundary';
import { evaluate, sceneHoldStart } from '../../../three/house/timeline';
import { useIdleReady, useSceneCapability } from '../../../three/useSceneCapability';
import { EASE } from '../../motion/tokens';
import { ButtonLink } from '../../ui/ButtonLink';
import { Picture } from '../../ui/Picture';
import { FrameSequence, type SequenceApi } from './cinematic/FrameSequence';
import { evaluateSequence, frameUrl, sequence, sequenceReady, sceneHoldStart as sequenceHoldStart } from './cinematic/sequence';

gsap.registerPlugin(ScrollTrigger);

// three.js, the house and its assets load as a separate chunk, after the page is idle,
// and only on devices that can run them
const WalkthroughScene = lazy(() => import('../../../three/house/WalkthroughScene'));

type Status = 'loading' | 'ready' | 'failed';

const stillKey = (scene: number, tall = false) => `walk-${scene + 1}${tall ? '-tall' : ''}` as ImageKey;

// The cinematic frame sequence (cinematic/README.md) replaces the real-time 3D scene once all
// of its clips are built
const cinematic = sequenceReady;
const walkthroughScenes = cinematic ? cinematicScenes(sequence.scenes.map((s) => s.label)) : houseScenes;
const SCENE_COUNT = walkthroughScenes.length;

/**
 * Home-page walkthrough of a concept house, controlled by scrolling.
 *
 * - The section is tall; inside it a full-screen stage stays pinned (CSS sticky, no scroll
 *   hijacking) while the visitor scrolls through 12 scenes from the storyboard.
 * - Desktop-class devices get the live 3D scene (WalkthroughScene). Everyone else, and anyone
 *   while it loads or if it fails, gets still renders of the same 12 shots that cross-fade
 *   and slowly push in as you scroll, so the stage is never blank.
 * - One smoothed progress value drives both the 3D camera and this HTML layer (captions,
 *   rail, the dip to black between rooms), updated outside React except when the scene changes.
 * - All text is real HTML; the canvas is decorative and hidden from assistive technology.
 */
export function HomeWalkthrough() {
  const capability = useSceneCapability();
  const idle = useIdleReady(capability.enabled);
  const [status, setStatus] = useState<Status>('loading');
  const live = !cinematic && capability.enabled && status !== 'failed';
  const showCanvas = live && idle;
  const sequenceApi = useRef<SequenceApi | null>(null);
  const reduced = useReducedMotion();

  const section = useRef<HTMLElement>(null);
  // Smoothed progress, shared with the 3D scene (which reads .current every frame)
  const progress = useRef(0);
  const target = useRef(0);
  const [scene, setScene] = useState(0);
  const [caption, setCaption] = useState(0);
  const [slowLoad, setSlowLoad] = useState(false);

  // DOM nodes updated every frame without re-rendering
  const intro = useRef<HTMLDivElement>(null);
  const introShade = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLDivElement>(null);
  const barFill = useRef<HTMLDivElement>(null);
  const stills = useRef(new Map<number, HTMLDivElement>());

  // Scroll position → target progress (GSAP ScrollTrigger only reads the native scroll)
  useLayoutEffect(() => {
    const element = section.current;
    if (!element) return;
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target.current = self.progress;
      },
    });
    target.current = trigger.progress;
    return () => trigger.kill();
  }, []);

  // Frame loop: smooth the progress, then update the overlay; runs only while the section is near
  useEffect(() => {
    const element = section.current;
    if (!element) return;
    let raf = 0;
    let last = performance.now();
    let current = { scene: -1, caption: -1 };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const p = progress;
      p.current = reduced ? target.current : p.current + (target.current - p.current) * (1 - Math.exp(-dt * 5));
      if (Math.abs(target.current - p.current) < 0.00002) p.current = target.current;
      const frame = cinematic ? { fromPrevious: 0, ...evaluateSequence(p.current, !!reduced) } : evaluate(p.current);
      if (cinematic && 'zoom' in frame) sequenceApi.current?.draw(frame.frame, frame.zoom);

      if (intro.current) {
        const t = Math.min(1, Math.max(0, (p.current * SCENE_COUNT - 0.3) / 0.45));
        intro.current.style.opacity = String(1 - t);
        intro.current.style.transform = `translateY(${-t * 40}px)`;
        intro.current.style.visibility = t >= 1 ? 'hidden' : 'visible';
        if (introShade.current) introShade.current.style.opacity = String(1 - t);
      }
      if (fade.current) fade.current.style.opacity = String(frame.fade);
      if (railFill.current) railFill.current.style.transform = `scaleY(${p.current})`;
      if (barFill.current) barFill.current.style.transform = `scaleX(${p.current})`;

      // Still images: current scene underneath (slow push-in), the previous one fading out on top
      stills.current.forEach((node, i) => {
        if (i === frame.scene) {
          node.style.opacity = '1';
          node.style.zIndex = '1';
          node.style.transform = reduced ? 'none' : `scale(${1.08 - 0.08 * frame.local})`;
        } else if (i === frame.scene - 1) {
          node.style.opacity = String(frame.fromPrevious);
          node.style.zIndex = '2';
        } else {
          node.style.opacity = '0';
          node.style.zIndex = '0';
        }
      });

      // Captions change halfway into the move to the next scene (or at the darkest point of a cut)
      const captionIndex = frame.scene > 0 && frame.local < 0.25 ? frame.scene - 1 : frame.scene;
      if (frame.scene !== current.scene || captionIndex !== current.caption) {
        current = { scene: frame.scene, caption: captionIndex };
        setScene(frame.scene);
        setCaption(captionIndex);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()), { rootMargin: '200px 0px' });
    observer.observe(element);
    start();
    return () => {
      observer.disconnect();
      stop();
    };
  }, [reduced]);

  // Only mention loading if it is actually noticeable
  useEffect(() => {
    if (!showCanvas || status !== 'loading') return;
    const timer = window.setTimeout(() => setSlowLoad(true), 1500);
    return () => window.clearTimeout(timer);
  }, [showCanvas, status]);

  const jumpTo = useCallback(
    (i: number) => {
      const element = section.current;
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const scrollable = element.offsetHeight - window.innerHeight;
      const holdStart = cinematic ? sequenceHoldStart(i) : sceneHoldStart(i);
      window.scrollTo({ top: top + holdStart * scrollable + 2, behavior: reduced ? 'auto' : 'smooth' });
    },
    [reduced],
  );

  const onReady = useCallback(() => setStatus('ready'), []);
  const onFail = useCallback(() => setStatus('failed'), []);
  const last = SCENE_COUNT - 1;

  return (
    <section
      ref={section}
      aria-label="Walkthrough of a concept home"
      // QA aid: off (stills only), loading, ready or failed. Not used for styling.
      data-scene={cinematic || capability.enabled ? status : 'off'}
      data-mode={cinematic ? 'sequence' : '3d'}
      // 3D: twelve scenes, ~80% of a screen of scrolling each on large screens, ~60% on small ones.
      // Video: about a screen of scrolling per scene (a little less on phones).
      style={cinematic ? ({ '--scenes': SCENE_COUNT } as CSSProperties) : undefined}
      className={cinematic ? 'relative h-[calc(var(--scenes)*85vh)] bg-night lg:h-[calc(var(--scenes)*105vh)]' : 'relative h-[820vh] bg-night lg:h-[1060vh]'}
    >
      <div className="sticky top-0 isolate h-svh overflow-hidden">
        {cinematic && (
          <div aria-hidden="true" className="absolute inset-0 z-0">
            <FrameSequence apiRef={sequenceApi} onReady={onReady} />
            {/* Poster: the opening frame as a normal image, until the canvas has drawn it */}
            <picture className={`absolute inset-0 transition-opacity duration-700 ${status === 'ready' ? 'opacity-0' : 'opacity-100'}`}>
              <source media="(orientation: portrait)" srcSet={frameUrl('m', 0)} />
              <img src={frameUrl('d', 0)} alt="" fetchPriority="high" className="size-full scale-[1.06] object-cover" />
            </picture>
          </div>
        )}

        {/* Still renders: the fallback, and the poster while the 3D scene loads.
            z-0 contains the per-image z-index used for cross-fades, so text stays on top. */}
        {!cinematic && (
        <div aria-hidden="true" className={`absolute inset-0 z-0 transition-opacity duration-[1200ms] ease-cinematic ${status === 'ready' && live ? 'opacity-0' : 'opacity-100'}`}>
          {[scene - 1, scene, scene + 1]
            .filter((i) => i >= 0 && i < SCENE_COUNT)
            .map((i) => (
              <div
                key={i}
                ref={(node) => {
                  if (node) stills.current.set(i, node);
                  else stills.current.delete(i);
                }}
                className="absolute inset-0 will-change-transform"
                style={{ opacity: i === scene ? 1 : 0 }}
              >
                <Picture
                  image={stillKey(i)}
                  sources={[{ media: '(orientation: portrait)', image: stillKey(i, true) }]}
                  sizes="100vw"
                  alt=""
                  priority={i === 0}
                />
              </div>
            ))}
        </div>
        )}

        {showCanvas && (
          <SceneErrorBoundary onError={onFail}>
            <Suspense fallback={null}>
              <div className={`absolute inset-0 transition-opacity duration-[1200ms] ease-cinematic ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}>
                <WalkthroughScene quality={capability.quality} progress={progress} onReady={onReady} onFail={onFail} />
              </div>
            </Suspense>
          </SceneErrorBoundary>
        )}

        {/* Legibility: darker at the top (navigation) and toward the lower left (text) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/70 via-transparent to-transparent [background-size:100%_30%] bg-no-repeat" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_0%_100%,rgba(8,8,8,0.88)_0%,rgba(8,8,8,0.45)_45%,transparent_72%)]" />
        {/* Behind the scene rail, so its labels stay readable over light interiors */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-96 bg-gradient-to-l from-night/85 via-night/50 to-transparent lg:block" />
        {/* Extra shade behind the opening headline, fading with it */}
        <div ref={introShade} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-night/80 via-night/35 to-transparent lg:via-night/25" />
        {/* Dip to black between spaces that don't connect */}
        <div ref={fade} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-night opacity-0" />

        {/* Opening: headline and actions, visible straight away, fading as the walk begins */}
        <div ref={intro} className="absolute inset-x-0 bottom-0 px-4 pb-24 will-change-transform sm:px-6 sm:pb-20 lg:px-10 xl:px-12">
          <div className="mx-auto max-w-[90rem]">
            <p className="animate-rise text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-bronze-light">{cinematic ? 'Concept home · Walkthrough' : 'Concept home · 3D walkthrough'}</p>
            <h1 className="mt-5 max-w-[13ch] animate-rise text-display [animation-delay:100ms] lg:text-[clamp(3.5rem,0.6rem+4.4vw,6rem)]">
              Building spaces with <em>quality</em> and <em>purpose.</em>
            </h1>
            <p className="mt-7 max-w-lg animate-rise text-lead text-bone/85 [animation-delay:200ms]">
              {cinematic
                ? 'Scroll to walk through a home designed around Indian living: in at the carved front door and up to the rooms above.'
                : 'Scroll to walk through a home designed around Indian living: from the carved front door to the terrace at dusk.'}
            </p>
            <div className="mt-9 flex animate-rise flex-col gap-3 [animation-delay:300ms] xs:flex-row">
              <ButtonLink to={primaryCta.to}>{primaryCta.label}</ButtonLink>
              <ButtonLink to="/projects" variant="secondary">
                Explore Our Work
              </ButtonLink>
            </div>
            <p aria-hidden="true" className="mt-10 hidden animate-rise items-center gap-3 text-[0.8125rem] uppercase tracking-[0.2em] text-stone [animation-delay:600ms] sm:flex">
              <span className="relative block h-10 w-px overflow-hidden bg-bone/20">
                <span className="absolute inset-x-0 top-0 h-4 animate-scrollcue bg-bronze motion-reduce:animate-none" />
              </span>
              Scroll to explore
            </p>
          </div>
        </div>

        {/* Scene captions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-24 sm:px-6 sm:pb-16 lg:px-10 xl:px-12">
          <div className="mx-auto max-w-[90rem]">
            <AnimatePresence mode="wait">
              {caption > 0 && caption < last && (
                <m.div
                  key={caption}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } }}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.3, ease: EASE } }}
                  className="max-w-xl"
                >
                  <p className="font-display text-[1.75rem] leading-none text-bronze-light tabular-nums">
                    {String(caption + 1).padStart(2, '0')}
                    <span className="text-[1rem] text-stone"> / {SCENE_COUNT}</span>
                  </p>
                  <h2 className="mt-4 text-headline">{walkthroughScenes[caption]!.title}</h2>
                  <p className="mt-4 max-w-md text-lead text-bone/85">{walkthroughScenes[caption]!.caption}</p>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Closing scene: brand and call to action */}
        <AnimatePresence>
          {caption === last && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.9, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <p className="font-display text-[clamp(4.5rem,3rem+9vw,11rem)] leading-[0.85] tracking-tight">SAN</p>
              <p className="mt-3 text-[0.875rem] font-semibold uppercase tracking-[0.5em] text-bone/80">Construction</p>
              <h2 className="mt-10 text-headline">
                Building your <em>dream home.</em>
              </h2>
              <p className="mt-5 max-w-md text-lead text-bone/80">{walkthroughScenes[last]!.caption}</p>
              <div className="mt-9 flex flex-col gap-3 xs:flex-row">
                <ButtonLink to={primaryCta.to}>{primaryCta.label}</ButtonLink>
                <ButtonLink to="/projects" variant="secondary">
                  Explore Our Work
                </ButtonLink>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Scene rail (large screens): jump to any scene */}
        <nav aria-label="Walkthrough scenes" className="absolute top-1/2 right-6 hidden -translate-y-1/2 lg:block xl:right-10">
          <div className="relative pr-5">
            <div aria-hidden="true" className="absolute top-1 right-0 bottom-1 w-px bg-bone/20">
              <div ref={railFill} className="h-full w-full origin-top scale-y-0 bg-bronze" />
            </div>
            <ol className="flex flex-col items-end gap-1.5">
              {walkthroughScenes.map((s, i) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    aria-current={i === scene ? 'step' : undefined}
                    className={`group flex min-h-7 items-center gap-3 text-[0.75rem] uppercase tracking-[0.18em] transition-colors duration-300 ${
                      i === scene ? 'text-bone' : 'text-bone/45 hover:text-bone/80'
                    }`}
                  >
                    <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span>{s.label}</span>
                    <span aria-hidden="true" className={`h-px transition-all duration-300 ${i === scene ? 'w-6 bg-bronze' : 'w-3 bg-bone/40'}`} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Progress bar (small screens) */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-bone/15 lg:hidden">
          <div ref={barFill} className="h-full w-full origin-left scale-x-0 bg-bronze" />
        </div>

        {/* Skip link, concept note and (only if slow) a loading note */}
        <div className="absolute right-4 bottom-5 flex flex-col items-end gap-2 text-right sm:right-6 lg:right-10 xl:right-12">
          {slowLoad && status === 'loading' && live && <p className="text-[0.75rem] text-stone">Loading the 3D walkthrough…</p>}
          <p className="hidden max-w-[16rem] text-[0.75rem] leading-snug text-stone/90 sm:block">Concept design for illustration. Not a completed SAN project.</p>
          <a href="#after-walkthrough" className="inline-flex min-h-11 items-center gap-2 text-[0.8125rem] font-semibold tracking-wide text-bone underline-offset-4 hover:underline">
            Skip walkthrough
            <ArrowDown aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
      <div id="after-walkthrough" tabIndex={-1} className="absolute bottom-0 h-px w-px outline-none" />
    </section>
  );
}
