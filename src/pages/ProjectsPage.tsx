import { useMemo, useState } from 'react';
import { ArrowRight, Building, ChevronDown, MessageSquare } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { BrandHero } from '../components/brand/BrandHero';
import { ClosingCta } from '../components/brand/ClosingCta';
import { FilterTabs } from '../components/brand/FilterTabs';
import { ProjectCard } from '../components/brand/ProjectCard';
import { ProjectLightbox } from '../components/brand/ProjectLightbox';
import { SectionHeader, Wrap } from '../components/brand/primitives';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { staticPages } from '../data/pageMeta';
import { inCategory, projectCategories, visibleProjects, type Project, type ProjectCategory } from '../data/projects';
import { site } from '../data/site';
import { Seo } from '../lib/seo';

type Filter = ProjectCategory | 'all';
/** Projects shown before "View all" (reference: four flagship projects). */
const FIRST = 4;

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<Project | null>(null);

  const options = useMemo(
    () => [
      { value: 'all' as Filter, label: `All projects (${visibleProjects.length})` },
      ...projectCategories
        .map((c) => ({ value: c.value as Filter, label: c.label, count: visibleProjects.filter((p) => inCategory(p, c.value)).length }))
        .filter((c) => c.count > 0),
    ],
    [],
  );

  const filtered = visibleProjects.filter((p) => inCategory(p, filter));
  const shown = showAll ? filtered : filtered.slice(0, FIRST);

  const changeFilter = (value: Filter) => {
    setFilter(value);
    setShowAll(false);
  };

  return (
    <div className="ref">
      <Seo meta={staticPages.projects} />
      <BrandHero
        image="walk-11"
        imageAlt=""
        height="medium"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Projects' }]}
        badge="Our portfolio"
        title={
          <>
            Architectural Precision, <br className="hidden sm:block" />
            <em className="gold-text">Built With Care</em>
          </>
        }
        lead={
          site.demoMode
            ? 'The concept home is a 3D design created for this site; the other entries are samples with placeholder photographs. None of them show SAN Construction work yet.'
            : 'A look at the homes and buildings we plan and build.'
        }
      />

      <section id="projects" aria-labelledby="showcase-title" className="relative border-t border-line bg-ink py-24">
        <Wrap>
          <SectionHeader
            id="showcase-title"
            eyebrow="Featured works"
            title="Project Showcase"
            aside={<FilterTabs label="Filter projects" options={options} value={filter} onChange={changeFilter} tone="card" className="md:max-w-xl md:justify-end" />}
          />

          {filtered.length > 0 ? (
            <Stagger key={`${filter}-${showAll}`} className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2" stagger={0.08}>
              {shown.map((project) => (
                <StaggerItem key={project.slug}>
                  <ProjectCard project={project} onOpenGallery={setOpen} headingLevel="h3" sizes="(min-width: 768px) 50vw, 100vw" />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <p className="mb-12 max-w-xl border-t border-line pt-10 text-gray-400">Project case studies will be published here soon.</p>
          )}

          {filtered.length > FIRST && (
            <div className="border-t border-line pt-8 text-center">
              <button
                type="button"
                aria-expanded={showAll}
                onClick={() => setShowAll((value) => !value)}
                className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-gold/40 bg-card px-8 py-4 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:border-gold"
              >
                {showAll ? `Show the first ${FIRST} projects` : `View all ${filtered.length} projects`}
                <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </Wrap>
      </section>

      <ClosingCta
        eyebrow="Start your project"
        title={
          <>
            Ready to Build Your <em className="gold-text">Vision</em>?
          </>
        }
        text="Tell us about your site and what you would like to build. We can talk through the layout, the approach and a realistic budget."
      >
        <Action to="/contact" icon={ArrowRight}>
          Schedule an initial meeting
        </Action>
        {site.contact.whatsapp ? (
          <Action href={`https://wa.me/${site.contact.whatsapp.replace(/\D/g, '')}`} variant="whatsapp" icon={MessageSquare} iconStart>
            WhatsApp us
          </Action>
        ) : (
          <Action to="/services" variant="glass" icon={Building} iconStart>
            Our services
          </Action>
        )}
      </ClosingCta>

      {open && <ProjectLightbox project={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
