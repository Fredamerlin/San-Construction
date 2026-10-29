import { lazy, Suspense, useRef, useState } from 'react';
import { primaryCta } from '../../../data/navigation';
import { services } from '../../../data/services';
import { SceneErrorBoundary } from '../../../three/SceneErrorBoundary';
import { useIdleReady, useSceneCapability } from '../../../three/useSceneCapability';
import { ButtonLink } from '../../ui/ButtonLink';
import { Container } from '../../ui/Container';
import { DimensionLine } from '../../ui/DimensionLine';
import { Picture } from '../../ui/Picture';

// Three.js, React Three Fiber, Drei and GSAP live in this chunk only. It is requested
// after the page is idle, and only on devices that can run it.
const HeroScene = lazy(() => import('../../../three/HeroScene'));

type SceneStatus = 'loading' | 'ready' | 'failed';

/**
 * Home hero.
 * - A still rendered from the same 3D scene loads first, with priority, so the page is
 *   complete and fast even if 3D never arrives. It is the permanent fallback.
 * - On capable devices the live scene loads when the browser is idle and fades in over the
 *   still once its first frames have rendered.
 * - On large screens with 3D, the hero holds for one extra screen (CSS sticky, no scroll
 *   hijacking) while the camera arcs toward the building. The decision is made on first
 *   render, so the layout never shifts afterwards.
 * - Headline, text and buttons are plain HTML above the canvas and never wait for 3D.
 */
export function HomeHero() {
  const capability = useSceneCapability();
  const [tall] = useState(() => capability.enabled && window.matchMedia('(min-width: 64rem)').matches);
  const idle = useIdleReady(capability.enabled);
  const [status, setStatus] = useState<SceneStatus>('loading');
  const sectionRef = useRef<HTMLElement>(null);
  const showScene = capability.enabled && idle && status !== 'failed';

  return (
    <section
      ref={sectionRef}
      // QA aid: off (still only), loading, ready or failed. Not used for styling.
      data-scene={capability.enabled ? status : 'off'}
      className={`relative bg-night ${tall ? 'h-[200svh]' : ''}`}
    >
      <div className={`${tall ? 'sticky top-0' : 'relative'} isolate flex min-h-viewport flex-col justify-end overflow-hidden`}>
        <div className="absolute inset-0 -z-10 animate-settle">
          {/* Three compositions rendered from the same scene, matching what the live camera
              frames on each screen shape. Anchored right so any extra crop takes empty sky. */}
          <Picture
            image="render-hero-wide"
            sources={[
              { media: '(orientation: portrait)', image: 'render-hero-tall' },
              { media: '(max-aspect-ratio: 3/2)', image: 'render-hero-medium' },
            ]}
            alt=""
            sizes="100vw"
            priority
            imgClassName="object-right portrait:object-top"
          />
        </div>

        {showScene && (
          <SceneErrorBoundary onError={() => setStatus('failed')}>
            <Suspense fallback={null}>
              <div
                className={`absolute inset-0 -z-10 transition-opacity duration-[1400ms] ease-cinematic ${
                  status === 'ready' ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <HeroScene
                  quality={capability.quality}
                  scrollTarget={sectionRef}
                  tall={tall}
                  onReady={() => setStatus('ready')}
                  onFail={() => setStatus('failed')}
                />
              </div>
            </Suspense>
          </SceneErrorBoundary>
        )}

        {/* Scrim for text contrast: light on landscape screens (the text sits over open sky),
            stronger on portrait screens where the text overlaps the building */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-night/50 landscape:md:bg-night/10" />

        <Container className="pt-36">
          <h1 className="max-w-[14ch] animate-rise text-display">
            Building spaces with <em>quality</em> and <em>purpose.</em>
          </h1>
          {/* Text and buttons stay in the left half so the building on the right is unobstructed */}
          <div className="mt-10 max-w-xl">
            <p className="max-w-md animate-rise text-lead text-stone [animation-delay:150ms]">
              From first conversation to final handover, we plan and build with care, clarity and craft.
            </p>
            <div className="mt-10 flex animate-rise flex-col gap-3 [animation-delay:300ms] xs:flex-row">
              <ButtonLink to={primaryCta.to}>{primaryCta.label}</ButtonLink>
              <ButtonLink to="/projects" variant="secondary">
                Explore Our Work
              </ButtonLink>
            </div>
          </div>
        </Container>

        {/* Drawing-style base line with the service disciplines */}
        <Container className="mt-16 pb-8 sm:mt-20">
          <DimensionLine draw />
          <ul className="mt-4 hidden animate-rise justify-between text-[0.8125rem] uppercase tracking-[0.2em] text-stone [animation-delay:600ms] md:flex">
            {services.slice(0, 4).map((service) => (
              <li key={service.slug}>{service.navTitle}</li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
