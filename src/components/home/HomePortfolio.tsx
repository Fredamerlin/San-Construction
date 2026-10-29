import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { inCategory, projectCategories, visibleProjects, type ProjectCategory } from '../../data/projects';
import { site } from '../../data/site';
import { Action } from '../brand/Action';
import { FilterTabs } from '../brand/FilterTabs';
import { ProjectCard } from '../brand/ProjectCard';
import { SectionHeader, Wrap } from '../brand/primitives';
import { Stagger, StaggerItem } from '../motion/Reveal';

type Filter = ProjectCategory | 'all';
const SHOWN = 3;

/** Reference "Architectural Portfolio": filter tabs over a three-column project grid. */
export function HomePortfolio() {
  const [filter, setFilter] = useState<Filter>('all');

  const options = useMemo(
    () => [
      { value: 'all' as Filter, label: 'All projects' },
      ...projectCategories.filter((c) => visibleProjects.some((p) => inCategory(p, c.value))).map((c) => ({ value: c.value as Filter, label: c.label })),
    ],
    [],
  );

  if (visibleProjects.length === 0) return null;
  const shown = visibleProjects.filter((p) => inCategory(p, filter)).slice(0, SHOWN);

  return (
    <section id="projects" aria-labelledby="portfolio-title" className="relative bg-card py-24">
      <Wrap>
        <SectionHeader
          id="portfolio-title"
          eyebrow="Selected work"
          title="Project Portfolio"
          aside={<FilterTabs label="Filter projects" options={options} value={filter} onChange={setFilter} className="md:justify-end" />}
        />
        {site.demoMode && (
          <p className="-mt-6 mb-10 max-w-2xl text-xs text-gray-400">
            The concept home is a 3D design made for this site; the other entries are samples with placeholder photographs.
          </p>
        )}

        <Stagger key={filter} className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((project) => (
            <StaggerItem key={project.slug}>
              <ProjectCard project={project} tone="ink" />
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-12 text-center">
          <Action to="/projects" variant="outline" icon={ArrowRight}>
            View all projects
          </Action>
        </div>
      </Wrap>
    </section>
  );
}
