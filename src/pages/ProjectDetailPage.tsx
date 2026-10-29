import { Link, useParams } from 'react-router';
import { ArrowRight, Info } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { BrandHero } from '../components/brand/BrandHero';
import { ClosingCta } from '../components/brand/ClosingCta';
import { ImageSwitcher } from '../components/brand/ImageSwitcher';
import { ProjectCard } from '../components/brand/ProjectCard';
import { Eyebrow, SectionHeader, Wrap } from '../components/brand/primitives';
import { Reveal } from '../components/motion/Reveal';
import { getProject, getRelatedProjects, projectLabel } from '../data/projects';
import { getService } from '../data/services';
import { projectMeta } from '../data/pageMeta';
import { Seo } from '../lib/seo';
import NotFoundPage from './NotFoundPage';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) return <NotFoundPage />;

  const service = getService(project.service);
  const related = getRelatedProjects(project);
  const label = projectLabel(project);
  // Only verified details are ever stored on a project; show them only if they exist
  const facts = [
    { label: 'Location', value: project.location },
    { label: 'Year', value: project.year },
    { label: 'Status', value: project.status },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <div className="ref">
      <Seo meta={projectMeta(project)} />
      <BrandHero
        image={project.images[0]!.key}
        imageAlt=""
        height="medium"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Projects', to: '/projects' }, { label: project.title }]}
        badge={label ? `${project.type} · ${label}` : project.type}
        title={project.title}
        lead={project.summary}
      />

      <section aria-labelledby="gallery-title" className="border-t border-line bg-ink py-16 lg:py-24">
        <Wrap>
          {project.placeholder && (
            <p role="note" className="mb-10 flex max-w-3xl gap-3 rounded-2xl border border-gold/30 bg-card p-5 text-sm text-gray-300">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
              <span>
                {project.concept
                  ? 'Concept design. This home was designed for this website; the images are 3D renders and do not show a SAN Construction project.'
                  : 'Sample project. This page demonstrates the layout for future case studies. The photographs are placeholders and do not show a SAN Construction project.'}
              </span>
            </p>
          )}
          <h2 id="gallery-title" className="sr-only">
            Gallery
          </h2>
          <Reveal>
            <ImageSwitcher label={project.title} items={project.images} heightClass="h-[60svh] min-h-[320px] md:h-[72vh]" sizes="(min-width: 1280px) 1216px, 100vw" />
          </Reveal>
        </Wrap>
      </section>

      <section aria-labelledby="project-overview-title" className="border-t border-line bg-card py-24">
        <Wrap className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Eyebrow>Overview</Eyebrow>
            <h2 id="project-overview-title" className="mb-6 text-3xl text-white md:text-5xl">
              About This Project
            </h2>
            <div className="space-y-5 text-sm font-light leading-relaxed text-gray-300 md:text-base">
              {project.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.12}>
            <dl className="space-y-3 rounded-3xl border border-line bg-ink p-6">
              <div className="flex justify-between gap-4 rounded-xl border border-white/5 bg-card p-3 text-sm">
                <dt className="text-xs uppercase text-gray-400">Type</dt>
                <dd className="font-semibold text-white">{project.type}</dd>
              </div>
              {service && (
                <div className="flex justify-between gap-4 rounded-xl border border-white/5 bg-card p-3 text-sm">
                  <dt className="text-xs uppercase text-gray-400">Service</dt>
                  <dd>
                    <Link to={`/services/${service.slug}`} className="font-semibold text-gold underline-offset-4 hover:underline">
                      {service.title}
                    </Link>
                  </dd>
                </div>
              )}
              {facts.map((fact) => (
                <div key={fact.label} className="flex justify-between gap-4 rounded-xl border border-white/5 bg-card p-3 text-sm">
                  <dt className="text-xs uppercase text-gray-400">{fact.label}</dt>
                  <dd className="font-semibold text-white">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Wrap>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="more-projects-title" className="border-t border-line bg-ink py-24">
          <Wrap>
            <SectionHeader
              id="more-projects-title"
              eyebrow="Portfolio"
              title="More Projects"
              aside={
                <Action to="/projects" variant="link" icon={ArrowRight}>
                  All projects
                </Action>
              }
            />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {related.map((item) => (
                <ProjectCard key={item.slug} project={item} />
              ))}
            </div>
          </Wrap>
        </section>
      )}

      <ClosingCta
        eyebrow="Start your project"
        title={
          <>
            Have a Similar Project <em className="gold-text">in Mind?</em>
          </>
        }
        text="Share a few details and we can talk through what is involved."
      >
        <Action to={service ? `/contact?service=${service.slug}` : '/contact'} icon={ArrowRight}>
          Discuss your project
        </Action>
      </ClosingCta>
    </div>
  );
}
