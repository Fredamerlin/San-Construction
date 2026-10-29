import { useState } from 'react';
import { Link } from 'react-router';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle,
  ClipboardList,
  Hammer,
  Home,
  Layers,
  MessagesSquare,
  PaintRoller,
  Phone,
  ShieldCheck,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { Action } from '../components/brand/Action';
import { jumpTo } from '../components/brand/scroll';
import { BrandHero } from '../components/brand/BrandHero';
import { ClosingCta } from '../components/brand/ClosingCta';
import { CostEstimator } from '../components/brand/CostEstimator';
import { ImageSwitcher } from '../components/brand/ImageSwitcher';
import { Eyebrow, IconBox, SectionHeader, Tag, Wrap } from '../components/brand/primitives';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { Picture } from '../components/ui/Picture';
import { showEstimator } from '../data/estimator';
import { residentialMaterialTabs } from '../data/materials';
import { staticPages } from '../data/pageMeta';
import { processSteps } from '../data/process';
import { getService, services, type Service } from '../data/services';
import { site } from '../data/site';
import { Seo } from '../lib/seo';

const residential = getService('residential-construction')!;
const commercial = getService('commercial-construction')!;
const others = services.filter((s) => s !== residential && s !== commercial);
const otherIcons: Record<string, LucideIcon> = {
  'renovation-and-remodeling': Hammer,
  'interior-fit-out': PaintRoller,
  'planning-and-coordination': ClipboardList,
  'construction-consultation': MessagesSquare,
};
const commercialIcons: LucideIcon[] = [Layers, Activity, Wind, ShieldCheck];

/** Large image card in the "Primary service spectrum" grid. */
function FeatureServiceCard({ service, icon, index, jump, className }: { service: Service; icon: LucideIcon; index: number; jump: string; className: string }) {
  return (
    <article className={`group relative flex h-[480px] flex-col justify-between overflow-hidden rounded-3xl border border-line bg-card p-6 transition-colors duration-500 hover:border-gold sm:p-8 ${className}`}>
      <div className="absolute inset-0 z-0">
        <Picture image={service.image} alt="" sizes="(min-width: 1024px) 58vw, 100vw" imgClassName="opacity-25 transition-all duration-700 group-hover:scale-105 group-hover:opacity-35" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-transparent" />
      </div>
      <div className="relative z-10 flex items-start justify-between">
        <IconBox icon={icon} />
        <span className="rounded-full bg-gold/15 px-3 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-gold">
          Capability {String(index).padStart(2, '0')}
        </span>
      </div>
      <div className="relative z-10 mt-auto">
        <h3 className="mb-3 text-3xl text-white transition-colors group-hover:text-gold">
          <Link to={`/services/${service.slug}`}>{service.title}</Link>
        </h3>
        <p className="mb-6 max-w-xl text-sm font-light leading-relaxed text-gray-300">{service.summary}</p>
        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <a href={`#${jump}`} onClick={jumpTo(jump)} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
            View capabilities
            <ArrowDown aria-hidden="true" className="size-3.5" />
          </a>
          <Link
            to={`/contact?service=${service.slug}`}
            className="inline-flex size-11 items-center justify-center rounded-xl bg-gold text-black transition-colors hover:bg-gold-hover"
          >
            <ArrowUpRight aria-hidden="true" className="size-4" />
            <span className="sr-only">Enquire about {service.title.toLowerCase()}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function ResidentialMaterials() {
  const [active, setActive] = useState(0);
  const tab = residentialMaterialTabs[active]!;
  return (
    <div className="mb-8 rounded-2xl border border-line bg-ink p-4">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-gold">Material highlights</span>
        <span className="font-mono text-[0.625rem] text-gray-400">{tab.title}</span>
      </div>
      <div role="group" aria-label="Choose a material" className="grid grid-cols-3 gap-2">
        {residentialMaterialTabs.map((item, i) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              i === active ? 'border-gold bg-gold text-black' : 'border-transparent bg-card text-gray-300 hover:border-gold'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-3 text-xs font-light text-gray-300">
        {tab.text}
      </p>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="ref">
      <Seo meta={staticPages.services} />
      <BrandHero
        image="walk-10"
        imageAlt=""
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Services' }]}
        badge="Our services"
        title={
          <>
            Construction Solutions <br className="hidden sm:block" />
            <em className="gold-text">Built Around Your Vision</em>
          </>
        }
        lead="From new homes to commercial buildings, renovation and fit-out: construction services planned around your project, your site and your priorities."
      >
        <div className="flex flex-wrap items-center gap-3">
          {[
            { id: 'residential', label: 'Residential', icon: Home },
            { id: 'commercial', label: 'Commercial', icon: Building2 },
            { id: 'workflow', label: 'How it works', icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={jumpTo(id)}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-gold hover:text-black"
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {label}
            </a>
          ))}
        </div>
      </BrandHero>

      {/* Service spectrum */}
      <section id="expertise" aria-labelledby="spectrum-title" className="relative border-t border-line bg-ink py-24">
        <Wrap>
          <SectionHeader
            id="spectrum-title"
            rule
            eyebrow="What we do"
            title="Primary Service Spectrum"
            intro="Six ways we can help, from a first conversation about an idea to building and handing over the finished space."
          />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <FeatureServiceCard service={residential} icon={Home} index={1} jump="residential" className="" />
            </Reveal>
            <Reveal className="lg:col-span-7" delay={0.1}>
              <FeatureServiceCard service={commercial} icon={Building2} index={2} jump="commercial" className="" />
            </Reveal>
          </div>

          <Stagger className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {others.map((service, i) => {
              const Icon = otherIcons[service.slug] ?? ClipboardList;
              return (
                <StaggerItem key={service.slug}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-slab/40 p-6 transition-colors duration-500 hover:border-gold">
                    <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-30" />
                    <div className="relative z-10 mb-6 flex items-center justify-between">
                      <IconBox icon={Icon} size="sm" />
                      <span aria-hidden="true" className="font-mono text-xs text-gold">
                        {String(i + 3).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="relative z-10 mb-2 text-2xl text-white transition-colors group-hover:text-gold">
                      <Link to={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-['']">
                        {service.title}
                      </Link>
                    </h3>
                    <p className="relative z-10 mb-6 text-xs leading-relaxed text-gray-400">{service.summary}</p>
                    <span aria-hidden="true" className="relative z-10 mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold transition-transform group-hover:translate-x-1">
                      Learn more
                      <ArrowRight className="size-3.5" />
                    </span>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Wrap>
      </section>

      {/* Residential */}
      <section id="residential" aria-labelledby="residential-title" className="relative border-t border-line bg-card py-24 outline-none">
        <Wrap className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <ImageSwitcher
              label="Concept home"
              items={[{ key: 'walk-1' }, { key: 'walk-3' }, { key: 'walk-5' }]}
              sizes="(min-width: 1024px) 50vw, 100vw"
              badge={
                <span className="glass-panel inline-flex items-center gap-3 rounded-xl border-gold/30! px-4 py-2.5 text-xs text-white">
                  <ShieldCheck aria-hidden="true" className="size-4 text-gold" />
                  <span>
                    <span className="block font-semibold">Concept home</span>
                    <span className="text-[0.625rem] text-gray-400">Teak entrance · tiled roofs · deep overhangs</span>
                  </span>
                </span>
              }
            />
          </Reveal>

          <Reveal className="flex flex-col justify-center lg:col-span-6" delay={0.12}>
            <Eyebrow>Residential expertise</Eyebrow>
            <h2 id="residential-title" className="mb-6 text-3xl text-white md:text-5xl">
              Homes Designed for the Way You Live
            </h2>
            <p className="mb-8 text-sm font-light leading-relaxed text-gray-300">{residential.overview[0]}</p>

            <ul className="mb-8 space-y-3">
              {residential.scope.slice(0, 4).map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-white/5 bg-ink/60 p-3">
                  <CheckCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span className="text-xs font-semibold uppercase text-white">{item}</span>
                </li>
              ))}
            </ul>

            <ResidentialMaterials />

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Action to={`/contact?service=${residential.slug}`} icon={ArrowRight}>
                Enquire about residential work
              </Action>
              <Action to={`/services/${residential.slug}`} variant="glass">
                Service details
              </Action>
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* Commercial */}
      <section id="commercial" aria-labelledby="commercial-title" className="relative border-t border-line bg-ink py-24 outline-none">
        <Wrap>
          <SectionHeader
            id="commercial-title"
            eyebrow="Commercial & institutional"
            title="Spaces That Move Business Forward"
            intro={commercial.overview[1]}
          />

          <Reveal className="mb-12">
            <article className="group relative h-[460px] overflow-hidden rounded-3xl border border-line md:h-[420px]">
              <Picture image="glass-towers" alt="" sizes="100vw" imgClassName="transition-transform duration-700 group-hover:scale-105" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20 md:to-transparent" />
              <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-20" />
              <div className="absolute inset-0 flex max-w-2xl flex-col justify-between p-6 sm:p-8 md:p-12">
                <span className="w-max rounded-full border border-gold/30 bg-gold/20 px-3.5 py-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-gold">
                  {commercial.navTitle} construction
                </span>
                <div>
                  <h3 className="mb-3 text-3xl text-white md:text-4xl">Offices, Retail & Mixed-Use</h3>
                  <p className="mb-6 text-sm font-light leading-relaxed text-gray-300">{commercial.overview[0]}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Action to={`/contact?service=${commercial.slug}`} icon={ArrowRight} size="sm">
                      Enquire about a commercial project
                    </Action>
                    {site.demoMode && <Tag placeholder>Sample photograph</Tag>}
                  </div>
                </div>
              </div>
            </article>
          </Reveal>

          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4" stagger={0.08}>
            {commercial.scope.slice(0, 4).map((item, i) => {
              const Icon = commercialIcons[i]!;
              return (
                <StaggerItem key={item}>
                  <div className="h-full rounded-2xl border border-line bg-card p-6">
                    <Icon aria-hidden="true" className="mb-3 size-6 text-gold" />
                    <h3 className="font-jakarta text-sm font-semibold text-white">{item}</h3>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Wrap>
      </section>

      {/* Workflow and estimator */}
      <section id="workflow" aria-labelledby="workflow-title" className="relative border-t border-line bg-slab/30 py-24 outline-none">
        <Wrap>
          <SectionHeader
            layout="center"
            id="workflow-title"
            eyebrow="How a project runs"
            title="From First Sketch to Final Structure"
            intro="Every project moves through the same clear stages, so you always know what is happening and what comes next."
          />
          <Stagger className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${showEstimator ? 'mb-20' : ''}`} stagger={0.07}>
            {processSteps.map((step, i) => (
              <StaggerItem key={step.title}>
                <div className="h-full rounded-2xl border border-line bg-card p-6 transition-colors hover:border-gold">
                  <IconBox size="sm" className="mb-4 text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </IconBox>
                  <h3 className="mb-2 text-xl text-white">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-400">{step.short}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          {!showEstimator && (
            <div className="mt-12 text-center">
              <Action to="/process" variant="outline" icon={ArrowRight}>
                Read about our process
              </Action>
            </div>
          )}
          <CostEstimator id="estimator" eyebrow="Scope planner" title="Service Budget Estimator" />
        </Wrap>
      </section>

      <ClosingCta
        eyebrow="Start your project"
        title={
          <>
            Let’s Build Something <em className="gold-text">Exceptional</em>
          </>
        }
        text="Have a home or commercial project in mind? Let’s discuss your requirements and explore the right construction approach."
      >
        <Action to="/contact" icon={ArrowRight}>
          Get a quote
        </Action>
        {site.contact.phone ? (
          <Action href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`} variant="glass" icon={Phone} iconStart>
            Call us
          </Action>
        ) : (
          <Action to="/projects" variant="glass">
            Explore our projects
          </Action>
        )}
      </ClosingCta>
    </div>
  );
}
