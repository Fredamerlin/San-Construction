import { useRef, type ReactNode } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';

/**
 * Background layer that eases from a 1.08 zoom to 1 as its section scrolls through the
 * viewport. Driven by a motion value, so React does not re-render on scroll.
 */
export function ScrollZoom({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <m.div className="h-full w-full" style={reduced ? undefined : { scale }}>
        {children}
      </m.div>
    </div>
  );
}
