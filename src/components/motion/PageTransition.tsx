import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { m } from 'motion/react';

/**
 * Quick fade when the route changes. Enter-only (no exit animation), so navigation is
 * never held back waiting for the old page to leave. The very first page load is not
 * faded, so the first paint is never delayed. React Router gives the initial
 * location the key "default".
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isInitialLoad = location.key === 'default';

  return (
    <m.div
      key={location.pathname}
      initial={isInitialLoad ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  );
}
