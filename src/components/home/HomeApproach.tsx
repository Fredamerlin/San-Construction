import { CheckCircle2 } from 'lucide-react';
import { principles } from '../../data/company';
import { Action } from '../brand/Action';
import { Eyebrow, Wrap } from '../brand/primitives';
import { Reveal } from '../motion/Reveal';
import { PlaceholderBadge } from '../ui/PlaceholderBadge';

/**
 * Takes the place of the reference's press logos and client testimonial: SAN Construction has
 * not supplied any, so this shows the working principles instead, in the same layout.
 */
export function HomeApproach() {
  return (
    <section id="approach" aria-labelledby="approach-title" className="relative bg-ink py-24">
      <Wrap className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>How we work</Eyebrow>
          <h2 id="approach-title" className="mb-6 text-3xl text-white md:text-5xl">
            Built on Clear, Careful Work
          </h2>
          <p className="mb-8 text-sm font-light leading-relaxed text-gray-400">
            We believe the best buildings come from listening first: understanding how a space will be used, what matters to
            the people commissioning it, and what the site will allow.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Action to="/about" variant="glass">
              About SAN Construction
            </Action>
            <PlaceholderBadge label="Draft copy" />
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <ul className="glass-panel relative space-y-6 rounded-3xl p-8 md:p-10">
            {principles.map((principle) => (
              <li key={principle.title} className="flex gap-4 border-b border-white/10 pb-6 last:border-0 last:pb-0">
                <CheckCircle2 aria-hidden="true" className="mt-1 size-5 shrink-0 text-gold" />
                <div>
                  <h3 className="text-xl text-white md:text-2xl">{principle.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">{principle.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Wrap>
    </section>
  );
}
