import { ArrowRight } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { Eyebrow, Wrap } from '../components/brand/primitives';
import { notFoundMeta } from '../data/pageMeta';
import { Seo } from '../lib/seo';

export default function NotFoundPage() {
  return (
    <div className="ref">
      <Seo meta={notFoundMeta} />
      <section className="relative flex min-h-viewport items-center overflow-hidden bg-ink py-32">
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-30" />
        <Wrap className="relative z-10">
          <Eyebrow>Error 404</Eyebrow>
          <p aria-hidden="true" className="gold-text font-cormorant text-8xl font-bold leading-none md:text-9xl">
            404
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl text-white md:text-6xl">This part hasn’t been built yet.</h1>
          <p className="mt-6 max-w-xl text-base font-light text-gray-300">The page you were looking for doesn’t exist or may have moved.</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Action to="/" icon={ArrowRight}>
              Back to Home
            </Action>
            <Action to="/contact" variant="glass">
              Contact us
            </Action>
          </div>
        </Wrap>
      </section>
    </div>
  );
}
