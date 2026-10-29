import { useRef, type ReactNode } from 'react';
import { m, useInView, useReducedMotion } from 'motion/react';
import { EASE } from './tokens';

interface ImageRevealProps {
  children: ReactNode;
  /** Classes for the frame: give it the aspect ratio, background and grid placement. */
  className?: string;
}

/**
 * Unmasks an image from the bottom edge upward while the image settles from a slight zoom.
 *
 * Visibility is detected on the unclipped outer frame: an element clipped to nothing is not
 * reported as intersecting by the browser, so observing the masked layer itself would never fire.
 * clip-path isn't covered by Motion's reduced-motion handling, so reduced motion gets the
 * plain frame. Don't use on a page's main above-the-fold image: a clipped image isn't
 * counted as painted, which would delay the largest-contentful-paint metric.
 */
export function ImageReveal({ children, className = '' }: ImageRevealProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();

  if (reduced) return <div className={`relative overflow-hidden ${className}`}>{children}</div>;

  return (
    <div ref={frameRef} className={`relative overflow-hidden ${className}`}>
      <m.div
        className="h-full w-full"
        initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={inView ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <m.div
          className="h-full w-full"
          initial={{ scale: 1.12 }}
          animate={inView ? { scale: 1 } : undefined}
          transition={{ duration: 1.6, ease: EASE }}
        >
          {children}
        </m.div>
      </m.div>
    </div>
  );
}
