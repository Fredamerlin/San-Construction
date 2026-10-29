import { isRouteErrorResponse, useRouteError } from 'react-router';
import { RotateCw } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { Eyebrow, Wrap } from '../components/brand/primitives';
import NotFoundPage from './NotFoundPage';

/**
 * Shown inside the site layout when a page fails to load or render (for example a
 * network error while fetching a page's code). Never shows raw error details.
 */
export default function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <div className="ref">
      <section className="relative flex min-h-viewport items-center overflow-hidden bg-ink py-32">
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-30" />
        <Wrap className="relative z-10">
          <Eyebrow>Loading problem</Eyebrow>
          <h1 className="max-w-4xl text-4xl text-white md:text-6xl">Something went wrong loading this page.</h1>
          <p className="mt-6 max-w-xl text-base font-light text-gray-300">Please check your connection and try again.</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Action onClick={() => window.location.reload()} icon={RotateCw}>
              Try again
            </Action>
            <Action to="/" variant="glass">
              Back to Home
            </Action>
          </div>
        </Wrap>
      </section>
    </div>
  );
}
