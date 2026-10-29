import { Link } from 'react-router';
import { ArrowRight, Building2, CalendarDays, Home, PenTool, Sparkles, type LucideIcon } from 'lucide-react';
import type { ImageKey } from '../../data/images';
import { Action } from '../brand/Action';
import { IconBox, SectionHeader, Wrap } from '../brand/primitives';
import { Stagger, StaggerItem } from '../motion/Reveal';
import { Picture } from '../ui/Picture';

const pillars: { icon: LucideIcon; title: string; text: string; image: ImageKey; to: string; cta: string }[] = [
  {
    icon: Home,
    title: 'Residential Construction',
    text: 'New homes and residential buildings, planned around how the people living in them use each space.',
    image: 'walk-1',
    to: '/services/residential-construction',
    cta: 'Explore residential',
  },
  {
    icon: Building2,
    title: 'Commercial Buildings',
    text: 'Offices, retail and mixed-use buildings delivered with careful sequencing and clear coordination.',
    image: 'office-night',
    to: '/services/commercial-construction',
    cta: 'Explore commercial',
  },
  {
    icon: PenTool,
    title: 'Planning & Coordination',
    text: 'Scope, programme and trades organised so the work happens in the right order and problems surface early.',
    image: 'foundation-forms',
    to: '/services/planning-and-coordination',
    cta: 'How we plan',
  },
];

/** Reference "Architectural & Construction Pillars": three image cards and a gold CTA card. */
export function HomeExpertise() {
  return (
    <section id="expertise" aria-labelledby="expertise-title" className="relative bg-ink py-24">
      <Wrap>
        <SectionHeader
          id="expertise-title"
          rule
          eyebrow="Core offerings"
          title="Construction & Design Pillars"
          intro="From first drawings to final handover: residential and commercial building, renovation, fit-out and the planning that holds it together."
        />

        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {pillars.map((pillar, index) => (
            <StaggerItem key={pillar.title}>
              <article className="group relative flex h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-card p-6 transition-colors duration-500 hover:border-gold/60">
                <div className="absolute inset-0 z-0">
                  <Picture image={pillar.image} alt="" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" imgClassName="opacity-30 transition-transform duration-700 group-hover:scale-110" />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                </div>
                <div className="relative z-10 flex items-start justify-between">
                  <IconBox icon={pillar.icon} />
                  <span aria-hidden="true" className="font-mono text-xs text-gold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="relative z-10 mt-auto">
                  <h3 className="mb-2 text-2xl text-white transition-colors group-hover:text-gold">{pillar.title}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-gray-400">{pillar.text}</p>
                  <Link
                    to={pillar.to}
                    className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold transition-transform group-hover:translate-x-2 after:absolute after:inset-0 after:content-['']"
                  >
                    {pillar.cta}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
              </article>
            </StaggerItem>
          ))}

          <StaggerItem>
            <article className="group relative flex h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 via-card to-slab p-6 transition-colors duration-500 hover:border-gold">
              <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-40" />
              <div className="relative z-10 flex items-start justify-between">
                <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-xl bg-gold text-black">
                  <Sparkles className="size-6" />
                </span>
                <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[0.625rem] font-semibold uppercase text-gold">Your project</span>
              </div>
              <div className="relative z-10 mt-auto">
                <span className="text-xs font-semibold uppercase tracking-widest text-gold">Have a plot or a plan?</span>
                <h3 className="mb-3 text-3xl text-white">Let’s Build Something Exceptional</h3>
                <p className="mb-6 text-xs leading-relaxed text-gray-300">
                  Tell us what you have in mind and we can talk through what is involved.
                </p>
                <Action to="/contact" icon={CalendarDays} size="sm" className="w-full py-3">
                  Book a consultation
                </Action>
              </div>
            </article>
          </StaggerItem>
        </Stagger>
      </Wrap>
    </section>
  );
}
