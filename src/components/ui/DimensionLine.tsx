import { m } from 'motion/react';
import { EASE } from '../motion/tokens';

interface DimensionLineProps {
  /** Optional small caption set into the middle of the line, like a drawing dimension. */
  label?: string;
  /** Draw the line from left to right when it scrolls into view. */
  draw?: boolean;
  className?: string;
}

/**
 * The site's signature detail: an architect's dimension line (end ticks joined by a line).
 * Purely decorative, so it is hidden from assistive technology. Use sparingly.
 */
export function DimensionLine({ label, draw = false, className = '' }: DimensionLineProps) {
  const content = (
    <>
      <span className="h-3 w-px bg-current" />
      <span className="h-px flex-1 bg-current" />
      {label && (
        <>
          <span className="px-4 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-stone">{label}</span>
          <span className="h-px flex-1 bg-current" />
        </>
      )}
      <span className="h-3 w-px bg-current" />
    </>
  );
  const classes = `flex items-center text-bronze/70 ${className}`;

  if (!draw) {
    return (
      <div aria-hidden="true" className={classes}>
        {content}
      </div>
    );
  }

  return (
    <m.div
      aria-hidden="true"
      className={`origin-left ${classes}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1.4, ease: EASE }}
    >
      {content}
    </m.div>
  );
}
