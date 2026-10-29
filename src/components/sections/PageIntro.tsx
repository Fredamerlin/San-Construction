import type { ReactNode } from 'react';
import { Container } from '../ui/Container';

interface PageIntroProps {
  /** May contain <em> for an italic accent word. */
  title: ReactNode;
  lead?: string;
  /** Rendered above the heading, e.g. breadcrumbs. */
  before?: ReactNode;
  children?: ReactNode;
}

/** Opening block for inner pages. Leaves room for the fixed header. */
export function PageIntro({ title, lead, before, children }: PageIntroProps) {
  return (
    <section className="pb-16 pt-32 sm:pt-40 lg:pb-24 lg:pt-48">
      <Container>
        {before && <div className="mb-8">{before}</div>}
        <h1 className="max-w-5xl animate-rise text-headline">{title}</h1>
        {lead && <p className="mt-6 max-w-2xl animate-rise text-lead text-stone [animation-delay:150ms]">{lead}</p>}
        {children}
      </Container>
    </section>
  );
}
