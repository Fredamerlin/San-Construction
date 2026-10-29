import type { ReactNode } from 'react';
import { DimensionLine } from './DimensionLine';

interface SectionHeadingProps {
  /** May contain <em> for an italic accent word. */
  title: ReactNode;
  intro?: ReactNode;
  id?: string;
  /** Short dimension line above the heading. The site's signature detail, so use sparingly. */
  mark?: boolean;
  /** Use on light (warm white) sections. */
  tone?: 'dark' | 'light';
  className?: string;
}

/** Standard h2 + optional intro paragraph for page sections. */
export function SectionHeading({ title, intro, id, mark = false, tone = 'dark', className = '' }: SectionHeadingProps) {
  return (
    <div className={`max-w-3xl ${className}`}>
      {mark && <DimensionLine className="mb-8 w-24" />}
      <h2 id={id} className="text-headline">
        {title}
      </h2>
      {intro && <p className={`mt-5 max-w-xl text-lead ${tone === 'light' ? 'text-concrete-600' : 'text-stone'}`}>{intro}</p>}
    </div>
  );
}
