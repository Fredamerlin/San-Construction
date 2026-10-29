import { Link, useParams } from 'react-router';
import { ArrowRight, CheckCircle2, ClipboardList } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { BrandHero } from '../components/brand/BrandHero';
import { ClosingCta } from '../components/brand/ClosingCta';
import { ProjectCard } from '../components/brand/ProjectCard';
import { Eyebrow, IconBox, SectionHeader, Wrap } from '../components/brand/primitives';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { Picture } from '../components/ui/Picture';
import { processSteps } from '../data/process';
import { getProjectsBySlugs } from '../data/projects';
import { getService, services } from '../data/services';
import { serviceMeta } from '../data/pageMeta';
import { Seo } from '../lib/seo';
import NotFoundPage from './NotFoundPage';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const service = getService(slug);

  if (!service) return <NotFoundPage />;

  const related = getProjectsBySlugs(service.relatedProjects);
  const otherServices = services.filter((s) => s.slug !== service.slug);
  const enquire = `/contact?service=${service.slug}`;
  const featureCaption = service.feature.image.startsWith('walk-') ? 'Concept home · 3D render' : 'Placeholder photograph';

  return (
    <div className="ref">
      <Seo meta={serviceMeta(service)} />
      <BrandHero
        image={service.image}
        imageAlt=""
        height="medium"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }, { label: service.navTitle }]}
        badge="Service"
        title={service.title}
        lead={service.summary}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          {/* Opens the enquiry form with this service already selected */}
          <Action to={enquire} icon={ArrowRight}>
            Request a consultation
          </Action>
          <Action to="/services" variant="glass">
            All services
          </Action>
        </div>
      </BrandHero>

      {/* Overview */}
      <section aria-labelledby="overview-title" className="border-t border-line bg-ink py-24">
        <Wrap className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Eyebrow>Overview</Eyebrow>
            <h2 id="overview-title" className="mb-6 text-3xl text-white md:text-5xl">
              {service.feature.statement} <em className="gold-text">{service.feature.accent}</em>
            </h2>
            <div className="space-y-5 text-sm font-light leading-relaxed text-gray-300 md:text-base">
              {service.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.12}>
            <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
              <h2 className="mb-4 font-jakarta text-xs font-semibold uppercase tracking-widest text-gold">Often needed for</h2>
              <ul className="space-y-3">
                {service.needs.map((need) => (
                  <li key={need} className="flex items-start gap-3 rounded-xl border border-white/5 bg-ink p-3 text-sm text-gray-200">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
                    {need}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* Scope with a feature image */}
      <section aria-labelledby="scope-title" className="border-t border-line bg-card py-24">
        <Wrap className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <figure className="relative overflow-hidden rounded-3xl border border-white/10">
              <Picture image={service.feature.image} alt="" sizes="(min-width: 1024px) 50vw, 100vw" className="block h-[380px] md:h-[480px]" />
              <figcaption className="glass-panel absolute bottom-4 left-4 rounded-xl px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-wider text-gray-200">
                {featureCaption}
              </figcaption>
            </figure>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={0.12}>
            <Eyebrow>Scope</Eyebrow>
            <h2 id="scope-title" className="mb-4 text-3xl text-white md:text-4xl">
              What the Work May Include
            </h2>
            <p className="mb-8 text-sm text-gray-400">The exact scope depends on each project and is agreed before work begins.</p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {service.scope.map((item, i) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-white/5 bg-ink/70 p-4 sm:[&:last-child:nth-child(odd)]:col-span-2">
                  <span aria-hidden="true" className="font-mono text-xs font-bold text-gold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold text-white">{item}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </Wrap>
      </section>

      {/* Process */}
      <section aria-labelledby="service-process-title" className="border-t border-line bg-slab/30 py-24">
        <Wrap>
          <SectionHeader
            id="service-process-title"
            eyebrow="How a project runs"
            title="Six Clear Stages"
            aside={
              <Action to="/process" variant="link" icon={ArrowRight}>
                Read about our process
              </Action>
            }
          />
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {processSteps.map((step, i) => (
              <StaggerItem key={step.title}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-line bg-card p-5">
                  <IconBox size="sm" className="text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </IconBox>
                  <div>
                    <h3 className="text-lg text-white">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-400">{step.short}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Wrap>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-line bg-ink py-24">
          <Wrap>
            <SectionHeader id="related-title" eyebrow="Projects" title="Related Projects" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {related.map((project) => (
                <ProjectCard key={project.slug} project={project} sizes="(min-width: 768px) 50vw, 100vw" />
              ))}
            </div>
          </Wrap>
        </section>
      )}

      <nav aria-labelledby="other-services-title" className="border-t border-line bg-card py-14">
        <Wrap>
          <h2 id="other-services-title" className="mb-6 flex items-center gap-2 font-jakarta text-xs font-semibold uppercase tracking-widest text-gold">
            <ClipboardList aria-hidden="true" className="size-4" />
            Other services
          </h2>
          <ul className="flex flex-wrap gap-3">
            {otherServices.map((other) => (
              <li key={other.slug}>
                <Link
                  to={`/services/${other.slug}`}
                  className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-ink px-4 py-2 text-sm text-gray-200 transition-colors hover:border-gold hover:text-gold"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </Wrap>
      </nav>

      <ClosingCta
        eyebrow="Start your project"
        title={
          <>
            Planning a Project <em className="gold-text">Like This?</em>
          </>
        }
        text="Share a few details and we can talk through what is involved."
      >
        <Action to={enquire} icon={ArrowRight}>
          Request a consultation
        </Action>
      </ClosingCta>
    </div>
  );
}
