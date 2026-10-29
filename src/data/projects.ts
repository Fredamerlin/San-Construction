import type { ImageKey } from './images';
import { site } from './site';

/**
 * SAMPLE PROJECTS ONLY. SAN Construction has not supplied a portfolio yet.
 * These entries show how real projects will be presented. Their photographs are licensed
 * stock and public-domain images, not SAN Construction work, and every entry is flagged
 * `placeholder: true`. They are labelled "Sample" in demo mode and hidden when demo mode is off.
 *
 * Location, year, status, client, budget and outcome fields are intentionally absent:
 * add them only for real, verified projects.
 */

export interface ProjectImage {
  key: ImageKey;
  /** Overrides the default alt text from the image manifest. */
  alt?: string;
}

export interface Project {
  slug: string;
  title: string;
  /** Service slug this project belongs to. */
  service: string;
  /** Short type label, e.g. "Residential". */
  type: string;
  summary: string;
  description: string[];
  images: ProjectImage[];
  /** Verified details only. */
  location?: string;
  year?: string;
  status?: string;
  placeholder: boolean;
  /** A concept design shown as 3D renders (labelled "Concept" rather than "Sample"). */
  concept?: boolean;
}

const sampleNote =
  'This is a sample entry. It shows how a project will be presented once SAN Construction’s own work and photographs are added. The images are placeholder photographs and do not show a SAN Construction project.';

const conceptNote =
  'This is a concept design created for this website to show the kind of home SAN Construction plans and builds. The images are 3D renders of that design; they do not show a SAN Construction project.';

export const projects: Project[] = [
  {
    slug: 'concept-kerala-home',
    title: 'Kerala-style concept home',
    service: 'residential-construction',
    type: 'Residential',
    summary: 'A two-storey home with a tiled roof, carved teak entrance, open living spaces and a covered terrace.',
    description: [
      conceptNote,
      'The design brings traditional Kerala elements (sloping clay-tile roofs, a timber-latticed gable, a pillared porch, jali screens) together with open, light-filled modern rooms. You can walk through it room by room at the top of the home page.',
    ],
    images: [
      { key: 'walk-1' },
      { key: 'walk-2' },
      { key: 'walk-3' },
      { key: 'walk-4' },
      { key: 'walk-5' },
      { key: 'walk-6' },
      { key: 'walk-8' },
      { key: 'walk-11' },
    ],
    placeholder: true,
    concept: true,
  },
  {
    slug: 'sample-residential-block',
    title: 'Residential block',
    service: 'residential-construction',
    type: 'Residential',
    summary: 'A multi-storey residential building with repeating balconies and shared circulation.',
    description: [
      sampleNote,
      'A real entry here would describe the brief, the site and the approach taken, alongside photographs of the finished building.',
    ],
    images: [{ key: 'apartment-facade' }, { key: 'lightwell' }, { key: 'stair-opening' }],
    placeholder: true,
  },
  {
    slug: 'sample-office-tower',
    title: 'Office building',
    service: 'commercial-construction',
    type: 'Commercial',
    summary: 'A commercial building with a glazed facade and open-plan floors.',
    description: [
      sampleNote,
      'A real entry would explain how the building was planned, sequenced and delivered, with images of the completed work.',
    ],
    images: [{ key: 'office-night' }, { key: 'glass-towers' }],
    placeholder: true,
  },
  {
    slug: 'sample-steel-frame',
    title: 'Steel frame structure',
    service: 'commercial-construction',
    type: 'Structure',
    summary: 'A multi-storey steel frame rising floor by floor during construction.',
    description: [
      sampleNote,
      'A real entry could show the structure at different stages, from foundations to topping out.',
    ],
    images: [{ key: 'steel-frame' }, { key: 'rebar-slab' }],
    placeholder: true,
  },
  {
    slug: 'sample-facade-renewal',
    title: 'Facade renewal',
    service: 'renovation-and-remodeling',
    type: 'Renovation',
    summary: 'Renewal work on an existing concrete building, carried out behind scaffolding.',
    description: [
      sampleNote,
      'A real entry would show the building before and after, and describe what was repaired, kept and replaced.',
    ],
    images: [{ key: 'scaffolding' }, { key: 'concrete-block' }],
    placeholder: true,
  },
  {
    slug: 'sample-studio-fit-out',
    title: 'Studio fit-out',
    service: 'interior-fit-out',
    type: 'Interior',
    summary: 'A bright interior fitted out for flexible work and meetings.',
    description: [
      sampleNote,
      'A real entry would show the finished interior and the details that make it work day to day.',
    ],
    images: [{ key: 'studio-interior' }, { key: 'stair-opening' }],
    placeholder: true,
  },
  {
    slug: 'sample-foundation-works',
    title: 'Foundation works',
    service: 'planning-and-coordination',
    type: 'Groundworks',
    summary: 'Formwork and reinforcement prepared for a foundation slab on a cleared site.',
    description: [
      sampleNote,
      'A real entry could follow the early stages of a project, from site preparation to the first concrete pour.',
    ],
    images: [{ key: 'foundation-forms' }, { key: 'rebar-slab' }],
    placeholder: true,
  },
];

/** Filter groups for the portfolio, by the service a project belongs to. */
export const projectCategories = [
  { value: 'residential', label: 'Residential', services: ['residential-construction'] },
  { value: 'commercial', label: 'Commercial', services: ['commercial-construction'] },
  { value: 'renovation', label: 'Renovation & interiors', services: ['renovation-and-remodeling', 'interior-fit-out'] },
  { value: 'planning', label: 'Planning & groundworks', services: ['planning-and-coordination', 'construction-consultation'] },
] as const;

export type ProjectCategory = (typeof projectCategories)[number]['value'];

export function inCategory(project: Project, category: ProjectCategory | 'all'): boolean {
  if (category === 'all') return true;
  const group = projectCategories.find((c) => c.value === category);
  return Boolean(group && (group.services as readonly string[]).includes(project.service));
}

/** "Concept design", "Sample project" or nothing for real, verified work. */
export function projectLabel(project: Project): string | null {
  if (project.concept) return 'Concept design';
  if (project.placeholder) return 'Sample project';
  return null;
}

/** Projects that may be shown publicly: samples only appear in demo mode. */
export const visibleProjects = site.demoMode ? projects : projects.filter((project) => !project.placeholder);

export function getProject(slug: string | undefined): Project | undefined {
  return visibleProjects.find((project) => project.slug === slug);
}

export function getProjectsBySlugs(slugs: string[]): Project[] {
  return slugs.map((slug) => getProject(slug)).filter((project): project is Project => Boolean(project));
}

export function getRelatedProjects(project: Project, limit = 3): Project[] {
  const sameService = visibleProjects.filter((p) => p.slug !== project.slug && p.service === project.service);
  const others = visibleProjects.filter((p) => p.slug !== project.slug && p.service !== project.service);
  return [...sameService, ...others].slice(0, limit);
}
