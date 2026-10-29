import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import { tallVersion, type ImageKey } from '../../data/images';
import { Picture } from '../ui/Picture';
import { PillBadge, Wrap } from './primitives';

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  to?: string;
}

/** Reference breadcrumbs: small mono capitals, current page in gold. */
export function BrandCrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 font-mono text-xs uppercase tracking-widest text-gray-400">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <li aria-hidden="true">/</li>}
            <li>
              {item.to ? (
                <Link to={item.to} className="inline-flex min-h-11 items-center transition-colors hover:text-gold">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-gold">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

interface BrandHeroProps {
  badge: ReactNode;
  /** Use <em className="gold-text"> for the gold italic accent line. */
  title: ReactNode;
  lead?: ReactNode;
  image: ImageKey;
  /** "" marks the image as decorative. */
  imageAlt?: string;
  crumbs: Crumb[];
  pulse?: boolean;
  /** Minimum height, as in the reference pages (85vh services, 70vh contact...). */
  height?: 'tall' | 'medium' | 'short';
  /** CTAs, jump tags or a scroll cue under the lead. */
  children?: ReactNode;
}

/**
 * Inner-page hero from the reference: full-bleed photograph under a dark gradient and a faint
 * blueprint grid, with breadcrumbs, a pill badge, a serif headline with a gold italic accent and
 * a light lead paragraph. The image loads with priority as the page's main paint.
 */
export function BrandHero({ badge, title, lead, image, imageAlt, crumbs, pulse = false, height = 'tall', children }: BrandHeroProps) {
  const tall = tallVersion(image);
  const minH = { tall: 'min-h-[85svh]', medium: 'min-h-[75svh]', short: 'min-h-[70svh]' }[height];

  return (
    <section className={`relative flex items-center overflow-hidden px-0 pt-32 pb-16 ${minH}`}>
      <div className="absolute inset-0 z-0">
        <Picture
          image={image}
          sources={tall ? [{ media: '(orientation: portrait)', image: tall }] : []}
          alt={imageAlt}
          sizes="100vw"
          priority
          className="block h-full w-full"
          imgClassName="scale-105 animate-settle object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/45" />
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-20" />
      </div>

      <Wrap className="relative z-10 pt-6">
        <div className="animate-rise">
          <BrandCrumbs items={crumbs} />
        </div>
        <div className="max-w-3xl">
          <div className="mb-6 animate-rise [animation-delay:60ms]">
            <PillBadge pulse={pulse}>{badge}</PillBadge>
          </div>
          <h1 className="mb-6 animate-rise text-4xl leading-[1.1] text-white [animation-delay:120ms] sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>
          {lead && (
            <p className="mb-10 max-w-2xl animate-rise text-base font-light leading-relaxed text-gray-300 [animation-delay:180ms] md:text-xl">
              {lead}
            </p>
          )}
          {children && <div className="animate-rise [animation-delay:240ms]">{children}</div>}
        </div>
      </Wrap>
    </section>
  );
}
