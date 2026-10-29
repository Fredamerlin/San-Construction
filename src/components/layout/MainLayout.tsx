import { Suspense, useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { LazyMotion, MotionConfig } from 'motion/react';
import { PageTransition } from '../motion/PageTransition';
import { LoadingFallback } from '../ui/LoadingFallback';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { SkipToContent } from './SkipToContent';

const loadMotionFeatures = () => import('../motion/motionFeatures').then((module) => module.default);

export function MainLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // After client-side navigation, move focus to the new page so keyboard and
  // screen reader users start at the top of the new content.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    // "user" makes Motion respect the visitor's reduced-motion setting everywhere.
    // `strict` makes any accidental use of the heavy `motion.*` components an error; use `m.*`.
    <LazyMotion features={loadMotionFeatures} strict>
    <MotionConfig reducedMotion="user">
      <SkipToContent />
      <SiteHeader />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="min-h-viewport outline-none">
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </MotionConfig>
    </LazyMotion>
  );
}
