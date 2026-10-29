import { Link } from 'react-router';
import { ArrowRight, Building, Layers } from 'lucide-react';
import { site } from '../../data/site';
import { IconBox, SectionHeader, Tag, Wrap } from '../brand/primitives';
import { Reveal } from '../motion/Reveal';
import { Picture } from '../ui/Picture';

const details = [
  {
    icon: Layers,
    tag: 'Structure',
    title: 'Concrete & Steel Frames',
    text: 'Structural works in reinforced concrete or steel, sequenced floor by floor with the trades that follow.',
    to: '/projects/sample-steel-frame',
  },
  {
    icon: Building,
    tag: 'Delivery',
    title: 'Envelope, Services & Handover',
    text: 'Glazing, roofing and building services coordinated through to inspections, snagging and handover.',
    to: '/services/commercial-construction',
  },
];

/** Reference "Commercial Tech Parks": large image card with two detail cards beside it. */
export function HomeCommercial() {
  return (
    <section id="commercial" aria-labelledby="commercial-title" className="relative bg-ink py-24">
      <Wrap>
        <SectionHeader
          id="commercial-title"
          eyebrow="Commercial & institutional"
          title="Workplaces, Retail & Mixed-Use Buildings"
          intro="Commercial buildings involve more consultants, more trades and tighter coordination. The work focuses on clear planning, careful sequencing and steady communication."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <article className="group relative h-[460px] overflow-hidden rounded-3xl border border-line md:h-[500px]">
              <Picture image="office-night" alt="" sizes="(min-width: 1024px) 66vw, 100vw" imgClassName="transition-transform duration-700 group-hover:scale-105" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute right-6 bottom-6 left-6 flex flex-col justify-between gap-4 md:right-8 md:bottom-8 md:left-8 md:flex-row md:items-end">
                <div>
                  <span className="mb-3 inline-block rounded-full bg-gold/20 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-gold backdrop-blur-md">
                    Commercial construction
                  </span>
                  <h3 className="mb-2 text-3xl text-white">
                    <Link to="/services/commercial-construction" className="after:absolute after:inset-0 after:content-['']">
                      Buildings That Work as Hard as the People Inside
                    </Link>
                  </h3>
                  <p className="max-w-lg text-xs text-gray-300">
                    New offices, retail and mixed-use buildings, extensions and added floors, delivered while neighbouring premises stay in use.
                  </p>
                </div>
                {site.demoMode && (
                  <div className="flex gap-2">
                    <Tag placeholder>Sample photograph</Tag>
                  </div>
                )}
              </div>
            </article>
          </Reveal>

          <div className="flex flex-col gap-6">
            {details.map(({ icon, tag, title, text, to }, i) => (
              <Reveal key={title} delay={0.1 * (i + 1)} className="flex-1">
                <article className="group relative flex h-full flex-col justify-between rounded-3xl border border-line bg-card p-6 transition-colors hover:border-gold/50">
                  <div className="flex items-start justify-between">
                    <IconBox icon={icon} size="sm" />
                    <span className="font-mono text-xs text-gold">{tag}</span>
                  </div>
                  <div className="mt-6">
                    <h3 className="mb-1 text-xl text-white transition-colors group-hover:text-gold">
                      <Link to={to} className="after:absolute after:inset-0 after:content-['']">
                        {title}
                      </Link>
                    </h3>
                    <p className="text-xs leading-relaxed text-gray-400">{text}</p>
                    <ArrowRight aria-hidden="true" className="mt-4 size-4 text-gold transition-transform group-hover:translate-x-1" />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}
