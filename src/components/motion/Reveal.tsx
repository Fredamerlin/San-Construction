import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { EASE, VIEWPORT, riseVariants, staggerVariants } from './tokens';

// riseVariants is used by StaggerItem below; Reveal builds its own to add a delay.

/*
 * Motion vocabulary for the site. Everything is restrained: short distances, one easing
 * curve, and each element animates once as it first enters the viewport.
 * Under reduced motion, MotionConfig (in MainLayout) drops the movement and keeps a
 * simple fade.
 */

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fades and lifts its content once, when it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay } },
      }}
    >
      {children}
    </m.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Seconds between children. */
  stagger?: number;
}

/** Container whose StaggerItem children rise in sequence. */
export function Stagger({ children, className, stagger = 0.08 }: StaggerProps) {
  return (
    <m.div className={className} initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={staggerVariants(stagger)}>
      {children}
    </m.div>
  );
}

/** List version of Stagger, keeping <ul>/<ol> semantics. */
export function StaggerList({
  children,
  className,
  stagger = 0.08,
  ordered = false,
}: StaggerProps & { ordered?: boolean }) {
  const props = {
    className,
    initial: 'hidden',
    whileInView: 'visible',
    viewport: VIEWPORT,
    variants: staggerVariants(stagger),
  } as const;
  return ordered ? <m.ol {...props}>{children}</m.ol> : <m.ul {...props}>{children}</m.ul>;
}

export function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  return as === 'li' ? (
    <m.li className={className} variants={riseVariants}>
      {children}
    </m.li>
  ) : (
    <m.div className={className} variants={riseVariants}>
      {children}
    </m.div>
  );
}
