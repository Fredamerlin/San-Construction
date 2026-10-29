import { useRef, type ReactNode } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { tallVersion, type ImageKey } from '../../data/images';
import { Container } from '../ui/Container';
import { DimensionLine } from '../ui/DimensionLine';
import { Picture } from '../ui/Picture';

interface PageHeroProps {
  /** May contain <em> for an italic accent word. */
  title: ReactNode;
  lead?: string;
  image: ImageKey;
  imageAlt?: string;
  /** Rendered above the heading, e.g. breadcrumbs. */
  before?: ReactNode;
  /** Rendered after the lead, e.g. a call to action. */
  children?: ReactNode;
  /** Shown over the image, e.g. a "Sample" badge. */
  imageOverlay?: ReactNode;
}

/**
 * Inner-page opening: a full-bleed cinematic image filling most of the screen, with the
 * title set large over its darkened lower edge. As the page scrolls, the image drifts
 * slower than the text (parallax) and eases in; reduced motion keeps it still.
 * The image loads with priority and is never clipped, so it counts as the page's main paint.
 */
export function PageHero({ title, lead, image, imageAlt, before, children, imageOverlay }: PageHeroProps) {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const tall = tallVersion(image);

  return (
    <section ref={section} className="relative isolate flex min-h-[78svh] flex-col justify-end overflow-hidden bg-night pt-32 lg:min-h-[88svh]">
      <m.div aria-hidden={imageAlt === '' ? true : undefined} className="absolute inset-0 -z-20" style={reduced ? undefined : { y, scale }}>
        <Picture
          image={image}
          sources={tall ? [{ media: '(orientation: portrait)', image: tall }] : []}
          alt={imageAlt}
          sizes="100vw"
          priority
          className="block h-full w-full animate-settle"
        />
      </m.div>
      {/* Shade for the navigation at the top and the title at the bottom */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-night/75 via-night/10 to-transparent [background-size:100%_35%] bg-no-repeat" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/70 to-transparent [background-size:100%_75%] bg-bottom bg-no-repeat" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-night/60 via-transparent to-transparent" />

      {imageOverlay && (
        <Container className="absolute inset-x-0 top-24 sm:top-28">
          <div>{imageOverlay}</div>
        </Container>
      )}

      <Container className="pb-12 sm:pb-16 lg:pb-20">
        {before && <div className="mb-8 animate-rise">{before}</div>}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h1 className="max-w-[16ch] animate-rise text-display lg:col-span-8">{title}</h1>
          {lead && (
            <p className="max-w-xl animate-rise text-lead text-bone/85 [animation-delay:150ms] lg:col-span-4 lg:pb-3">
              {lead}
            </p>
          )}
        </div>
        {children && <div className="animate-rise [animation-delay:250ms]">{children}</div>}
        <DimensionLine draw className="mt-12 lg:mt-16" />
      </Container>
    </section>
  );
}
