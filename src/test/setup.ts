import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// Pages are lazy-loaded chunks; allow a little longer than the 1s default for them to appear
configure({ asyncUtilTimeout: 4000 });

afterEach(() => {
  cleanup();
  document.documentElement.style.overflow = '';
});

// jsdom lacks these browser APIs used by the layout
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
window.scrollTo = () => {};

// No WebGL in jsdom: report "unsupported" quietly so pages take the still-image path
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

// Motion's whileInView needs IntersectionObserver. This stub never fires, so content stays
// in its pre-reveal state; tests query by role and text, which is unaffected.
const globals = globalThis as { IntersectionObserver?: typeof IntersectionObserver };
if (!globals.IntersectionObserver) {
  class IntersectionObserverStub {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globals.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
