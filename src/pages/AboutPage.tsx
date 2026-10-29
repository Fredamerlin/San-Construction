import { useId, useState } from 'react';
import { ArrowDown, CalendarDays, CheckCircle2, ChevronDown, Compass, Eye, HardHat, Lightbulb, MessagesSquare, Ruler, Scale, Target, type LucideIcon } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { jumpTo } from '../components/brand/scroll';
import { BrandHero } from '../components/brand/BrandHero';
import { Eyebrow, IconBox, SectionHeader, Wrap } from '../components/brand/primitives';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { Picture } from '../components/ui/Picture';
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge';
import { aboutCopy, expectations, principles, type Principle } from '../data/company';
import { staticPages } from '../data/pageMeta';
import { Seo } from '../lib/seo';

const valueIcons: LucideIcon[] = [MessagesSquare, Compass, Ruler, Scale];

function ValueCard({ principle, index }: { principle: Principle; index: number }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const Icon = valueIcons[index % valueIcons.length]!;

  return (
    <article className="group h-full rounded-3xl border border-line bg-ink p-8 transition-colors duration-300 hover:border-gold">
      <div className="mb-6 flex items-start justify-between">
        <IconBox icon={Icon} size="lg" className="group-hover:bg-gold group-hover:text-black" />
        <span aria-hidden="true" className="font-mono text-xs text-gold">
          PILLAR {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="mb-3 text-2xl text-white">{principle.title}</h3>
      <p className="mb-6 text-sm leading-relaxed text-gray-400">{principle.description}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold"
      >
        {open ? 'Hide' : 'What this means in practice'}
        <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <ul id={panelId} hidden={!open} className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm leading-relaxed text-gray-300">
        {principle.details.map((detail) => (
          <li key={detail} className="flex gap-2">
            <span aria-hidden="true" className="text-gold">
              •
            </span>
            {detail}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function AboutPage() {
  return (
    <div className="ref">
      <Seo meta={staticPages.about} />
      <BrandHero
        image="walk-2"
        imageAlt=""
        height="tall"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About us' }]}
        badge="About SAN Construction"
        title={
          <>
            Building Dreams With <br className="hidden sm:block" />
            <em className="gold-text">Strong Foundations</em>
          </>
        }
        lead={aboutCopy.intro[0]}
      >
        <a
          href="#story"
          onClick={jumpTo('story')}
          className="group inline-flex min-h-11 items-center gap-3 text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-gold"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-line group-hover:border-gold">
            <ArrowDown aria-hidden="true" className="size-4 animate-bounce text-gold motion-reduce:animate-none" />
          </span>
          Scroll to discover our story
        </a>
      </BrandHero>

      {/* Story, mission and vision */}
      <section id="story" aria-labelledby="story-title" className="relative border-t border-line bg-ink py-24 outline-none">
        <Wrap className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="relative lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-line shadow-2xl">
              <Picture image="walk-1" alt="" sizes="(min-width: 1024px) 50vw, 100vw" className="block h-[450px] md:h-[520px]" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="glass-panel absolute right-6 bottom-6 left-6 flex items-center gap-4 rounded-xl p-4">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold text-black">
                  <HardHat className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white">Planning to handover</p>
                  <p className="text-[0.75rem] text-gray-300">One approach, from the first conversation to the final walkthrough.</p>
                </div>
              </div>
            </div>
            {/* Floating inset: a second view of the concept home */}
            <div className="absolute -top-8 -right-4 hidden w-56 overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-2xl sm:block xl:-right-6">
              <Picture image="walk-4" alt="" sizes="224px" className="block h-32" />
              <p className="p-3 text-[0.6875rem] text-gray-400">Concept home · dining room · 3D render</p>
            </div>
          </Reveal>

          <Reveal className="flex flex-col justify-center lg:col-span-6" delay={0.12}>
            <Eyebrow className="mb-3">Our story</Eyebrow>
            <h2 id="story-title" className="mb-6 text-3xl leading-tight text-white md:text-5xl">
              Planning and Building, Brought Together
            </h2>
            {aboutCopy.intro.map((paragraph, i) => (
              <p key={paragraph} className={`mb-6 text-sm font-light leading-relaxed md:text-base ${i === 0 ? 'text-gray-300' : 'text-gray-400'}`}>
                {paragraph}
              </p>
            ))}
            <PlaceholderBadge label="Draft copy, pending approval" className="mb-8 self-start" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-card p-5">
                <Eye aria-hidden="true" className="mb-3 size-6 text-gold" />
                <h3 className="mb-1 text-lg text-white">Our vision</h3>
                <p className="text-xs leading-relaxed text-gray-400">{aboutCopy.vision}</p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5">
                <Target aria-hidden="true" className="mb-3 size-6 text-gold" />
                <h3 className="mb-1 text-lg text-white">Our mission</h3>
                <p className="text-xs leading-relaxed text-gray-400">{aboutCopy.mission}</p>
              </div>
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* Core values */}
      <section id="values" aria-labelledby="values-title" className="relative border-t border-line bg-card py-24">
        <Wrap>
          <SectionHeader
            layout="center"
            id="values-title"
            eyebrow="What guides the work"
            title="Our Core Values"
            intro="Four working principles that shape how every project is planned and run."
          />
          <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-2" stagger={0.1}>
            {principles.map((principle, index) => (
              <StaggerItem key={principle.title}>
                <ValueCard principle={principle} index={index} />
              </StaggerItem>
            ))}
          </Stagger>
        </Wrap>
      </section>

      {/* Why choose SAN Construction */}
      <section id="why" aria-labelledby="why-title" className="relative border-t border-line bg-ink py-24">
        <Wrap>
          <SectionHeader
            layout="center"
            id="why-title"
            eyebrow="Working with us"
            title="What You Can Expect"
            intro="How we approach each part of a project, whatever its size."
          />

          <Reveal className="mb-20">
            <div className="overflow-hidden rounded-3xl border border-line">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">What you can expect from SAN Construction at each part of a project</caption>
                <thead>
                  <tr className="border-b border-line bg-card">
                    <th scope="col" className="w-1/3 p-4 text-xs font-semibold uppercase text-gray-400 md:p-5">
                      Part of the project
                    </th>
                    <th scope="col" className="p-4 text-xs font-semibold uppercase text-gold md:p-5">
                      What you can expect
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {expectations.map((row) => (
                    <tr key={row.topic}>
                      <th scope="row" className="p-4 align-top font-semibold text-white md:p-5">
                        {row.topic}
                      </th>
                      <td className="bg-card/50 p-4 text-gray-300 md:p-5">
                        <span className="flex items-start gap-2">
                          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
                          {row.detail}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Closing CTA box */}
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-r from-ink via-slab to-ink p-8 text-center md:p-14">
              <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-20" />
              <div className="relative z-10 mx-auto max-w-3xl">
                <Eyebrow className="mb-3">Begin your project</Eyebrow>
                <h2 className="mb-6 text-3xl text-white md:text-5xl">Let’s Discuss Your Plot & Vision</h2>
                <p className="mb-8 text-sm font-light text-gray-300 md:text-base">
                  Tell us what you would like to build, renovate or fit out. A short description is enough to start the conversation.
                </p>
                <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
                  <Action to="/contact" icon={CalendarDays}>
                    Request a consultation
                  </Action>
                  <Action to="/process" variant="glass" icon={Lightbulb} iconStart>
                    See how we work
                  </Action>
                </div>
              </div>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </div>
  );
}
