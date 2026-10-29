import type { Variants } from 'motion/react';

/** The single easing curve used across the site (matches --ease-cinematic in CSS). */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Animate once, a little before the element is fully in view. */
export const VIEWPORT = { once: true, amount: 0.15, margin: '0px 0px -8% 0px' } as const;

export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

export const staggerVariants = (stagger: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});
