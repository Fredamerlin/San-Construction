import type { ReactNode } from 'react';
import { Reveal } from '../motion/Reveal';
import { Eyebrow, Wrap } from './primitives';

interface ClosingCtaProps {
  eyebrow: string;
  /** Use <em className="gold-text"> for the accent word. */
  title: ReactNode;
  text: string;
  /** Buttons. */
  children: ReactNode;
}

/**
 * Closing call to action from the reference pages: a dark gradient band over a blueprint grid.
 * (The reference also lists three regional offices here; those are not verified, so they are
 * left out until SAN Construction supplies its real office details.)
 */
export function ClosingCta({ eyebrow, title, text, children }: ClosingCtaProps) {
  return (
    <section aria-label={eyebrow} className="relative overflow-hidden border-t border-line bg-gradient-to-b from-ink via-card to-black py-24">
      <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-20" />
      <Wrap className="relative z-10 max-w-4xl text-center">
        <Reveal>
          <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
          <h2 className="mb-6 text-4xl text-white md:text-6xl">{title}</h2>
          <p className="mx-auto mb-10 max-w-2xl text-sm font-light text-gray-300 md:text-base">{text}</p>
          <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
        </Reveal>
      </Wrap>
    </section>
  );
}
