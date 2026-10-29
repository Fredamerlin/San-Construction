import type { ImageKey } from './images';

/**
 * Candidate service categories from the scope (section 6.3).
 * All are PROVISIONAL until SAN Construction confirms what it actually offers.
 * Copy is draft and deliberately general: no guarantees, costs, timeframes or credentials.
 */

export interface Service {
  slug: string;
  title: string;
  /** Short title for navigation menus. */
  navTitle: string;
  summary: string;
  /** Opening paragraph(s) for the detail page. */
  overview: string[];
  /** Typical situations where a client might need this service. */
  needs: string[];
  /** What the service may include. Varies by project. */
  scope: string[];
  image: ImageKey;
  /** Full-width statement band on the detail page: image, then text with an italic accent. */
  feature: { image: ImageKey; statement: string; accent: string };
  relatedProjects: string[];
  placeholder: boolean;
}

export const services: Service[] = [
  {
    slug: 'residential-construction',
    title: 'Residential construction',
    navTitle: 'Residential',
    summary: 'New homes and residential buildings, planned around how people will live in them.',
    overview: [
      'A home is built around the everyday: how light reaches a room, where people gather, what needs to be close at hand. Residential work starts with understanding those priorities, then turning them into a practical plan for the site and budget.',
      'From the first drawings to the final walkthrough, the aim is a build that is well organised, clearly communicated and finished with care.',
    ],
    needs: [
      'Building a new home on land you already own',
      'Replacing an older house with a new build',
      'Developing a small group of homes or apartments',
      'Understanding what is realistic before committing to a design',
    ],
    scope: [
      'Site review and early feasibility',
      'Coordination with architects and structural engineers',
      'Foundations, structure and roofing',
      'Building services, finishes and external works',
      'Final checks and handover',
    ],
    image: 'walk-1',
    feature: { image: 'walk-4', statement: 'A home planned around how you', accent: 'live.' },
    relatedProjects: ['concept-kerala-home', 'sample-residential-block'],
    placeholder: true,
  },
  {
    slug: 'commercial-construction',
    title: 'Commercial construction',
    navTitle: 'Commercial',
    summary: 'Workplaces, retail and mixed-use buildings delivered with clear coordination.',
    overview: [
      'Commercial buildings have to work hard: for the people inside them, for the business that runs them and for the neighbourhood around them. They also tend to involve more consultants, more trades and tighter coordination.',
      'Commercial work focuses on clear planning, careful sequencing and steady communication so that decisions are made at the right time.',
    ],
    needs: [
      'A new office, retail or mixed-use building',
      'Extending or adding floors to an existing commercial property',
      'Coordinating several consultants and trades on one programme',
      'Building while neighbouring premises stay in use',
    ],
    scope: [
      'Pre-construction planning and sequencing',
      'Structural works in concrete or steel',
      'Envelope, glazing and roofing',
      'Coordination of building services',
      'Inspections, snagging and handover',
    ],
    image: 'office-night',
    feature: { image: 'glass-towers', statement: 'Buildings that work as hard as', accent: 'the people inside.' },
    relatedProjects: ['sample-office-tower', 'sample-steel-frame'],
    placeholder: true,
  },
  {
    slug: 'renovation-and-remodeling',
    title: 'Renovation and remodeling',
    navTitle: 'Renovation',
    summary: 'Careful upgrades and reworking of existing structures and spaces.',
    overview: [
      'Existing buildings carry history, and often a few surprises. Renovation starts with understanding what is already there, its condition and its limits, before deciding what to keep, repair or replace.',
      'Work is planned to respect the original structure while making the building more useful, comfortable and durable.',
    ],
    needs: [
      'Updating an older home or commercial building',
      'Reconfiguring internal layouts',
      'Repairing or renewing facades, roofs and structure',
      'Adapting a building for a new use',
    ],
    scope: [
      'Condition review of the existing structure',
      'Strip-out and preparation',
      'Structural repairs and alterations',
      'New finishes, fixtures and services',
      'Making good and handover',
    ],
    image: 'concrete-block',
    feature: { image: 'scaffolding', statement: 'New life for', accent: 'existing spaces.' },
    relatedProjects: ['sample-facade-renewal'],
    placeholder: true,
  },
  {
    slug: 'interior-fit-out',
    title: 'Interior and fit-out work',
    navTitle: 'Interiors & fit-out',
    summary: 'Interior construction and finishing that turns a shell into a usable space.',
    overview: [
      'Fit-out is where a building becomes a place to live or work. It brings together partitions, ceilings, joinery, lighting and finishes, and the details matter.',
      'Interior work is planned around how the space will be used, with attention to the junctions and finishes people see and touch every day.',
    ],
    needs: [
      'Fitting out a new shell-and-core space',
      'Refreshing an office, studio or retail interior',
      'Creating new rooms within an existing floor',
      'Upgrading finishes, lighting or joinery',
    ],
    scope: [
      'Partitions, ceilings and floors',
      'Joinery and built-in elements',
      'Lighting and power coordination',
      'Decoration and finishes',
      'Final clean and handover',
    ],
    image: 'walk-3',
    feature: { image: 'walk-6', statement: 'Interiors finished down to', accent: 'the last detail.' },
    relatedProjects: ['sample-studio-fit-out'],
    placeholder: true,
  },
  {
    slug: 'planning-and-coordination',
    title: 'Planning and project coordination',
    navTitle: 'Planning & coordination',
    summary: 'Organising scope, sequencing and trades so a project runs predictably.',
    overview: [
      'Good buildings depend on good organisation. Planning and coordination bring the scope, programme and people together so that work happens in the right order and problems surface early.',
      'This can support a full build or help bring structure to a project that already has a design team in place.',
    ],
    needs: [
      'Turning a design into a workable construction sequence',
      'Coordinating consultants, suppliers and trades',
      'Keeping a complex project on a clear programme',
      'Getting early visibility of risks and decisions',
    ],
    scope: [
      'Scope definition and work breakdown',
      'Programme and sequencing',
      'Trade and supplier coordination',
      'Progress tracking and reporting',
      'Close-out and documentation',
    ],
    image: 'foundation-forms',
    feature: { image: 'rebar-slab', statement: 'Good buildings start with', accent: 'good plans.' },
    relatedProjects: ['sample-foundation-works', 'sample-steel-frame'],
    placeholder: true,
  },
  {
    slug: 'construction-consultation',
    title: 'Construction consultation',
    navTitle: 'Consultation',
    summary: 'Early advice on feasibility, approach and next steps before work begins.',
    overview: [
      'The earliest decisions on a project often shape everything that follows. A consultation is a chance to talk through an idea, a site or an existing building before committing to a design or a budget.',
      'The aim is to leave with a clearer picture of what is involved and what the sensible next steps are.',
    ],
    needs: [
      'Exploring whether an idea is practical',
      'Understanding the steps involved in a build',
      'Reviewing an existing building before buying or renovating',
      'Getting a construction perspective on a design',
    ],
    scope: [
      'Initial discussion of goals and constraints',
      'Review of the site or existing building',
      'Outline of possible approaches',
      'Guidance on next steps and the people to involve',
    ],
    image: 'city-window',
    feature: { image: 'walk-10', statement: 'Clear advice,', accent: 'before you commit.' },
    relatedProjects: [],
    placeholder: true,
  },
];

export function getService(slug: string | undefined): Service | undefined {
  return services.find((service) => service.slug === slug);
}
