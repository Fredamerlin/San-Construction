import type { ImageKey } from './images';
import { visibleProjects, type Project } from './projects';
import { services, type Service } from './services';
import { site } from './site';

/**
 * Titles and descriptions for every public page, in one place. Used by the <Seo> component
 * at runtime and by scripts/seo-files.mjs at build time (per-page HTML, sitemap).
 */

export interface PageMeta {
  path: string;
  /** Page title without the site name. Omit for the home page. */
  title?: string;
  description: string;
  /** Lower-priority pages in the sitemap (detail pages). */
  priority?: number;
  /** Excluded from indexing and the sitemap. */
  noindex?: boolean;
  /** The page's main above-the-fold image (PageHero), preloaded in the generated HTML. */
  heroImage?: ImageKey;
}

export const staticPages = {
  home: {
    path: '/',
    description: 'SAN Construction plans and builds residential and commercial spaces with care, clarity and craft.',
    priority: 1,
  },
  about: {
    path: '/about',
    title: 'About',
    description: 'About SAN Construction: how we approach planning, building and working with clients.',
    priority: 0.8,
    heroImage: 'walk-2',
  },
  services: {
    path: '/services',
    title: 'Services',
    description:
      'Construction services from SAN Construction, from residential and commercial building to renovation, fit-out and consultation.',
    priority: 0.9,
    heroImage: 'walk-10',
  },
  projects: {
    path: '/projects',
    title: 'Projects',
    description: 'A selection of construction work by SAN Construction.',
    priority: 0.8,
    heroImage: 'walk-11',
  },
  process: {
    path: '/process',
    title: 'Our Process',
    description: 'How a SAN Construction project typically moves from first enquiry to handover.',
    priority: 0.7,
    heroImage: 'walk-9',
  },
  contact: {
    path: '/contact',
    title: 'Contact',
    description: 'Tell SAN Construction about your project and request a consultation.',
    priority: 0.9,
    heroImage: 'walk-8',
  },
} satisfies Record<string, PageMeta>;

export const serviceMeta = (service: Service): PageMeta => ({
  path: `/services/${service.slug}`,
  title: service.title,
  description: service.summary,
  priority: 0.7,
  heroImage: service.image,
});

export const projectMeta = (project: Project): PageMeta => ({
  path: `/projects/${project.slug}`,
  title: project.placeholder ? `${project.title} (sample)` : project.title,
  description: project.summary,
  priority: 0.6,
  // Sample projects are never presented to search engines as real work
  noindex: project.placeholder,
  heroImage: project.images[0]?.key,
});

export const notFoundMeta: PageMeta = {
  path: '/404',
  title: 'Page not found',
  description: 'The page you were looking for could not be found.',
  noindex: true,
};

export function fullTitle(meta: Pick<PageMeta, 'title'>): string {
  return meta.title ? `${meta.title} | ${site.name}` : `${site.name} | Building spaces with purpose`;
}

/** Every routable public page, for the sitemap and per-page HTML. */
export function allPages(): PageMeta[] {
  return [...Object.values(staticPages), ...services.map(serviceMeta), ...visibleProjects.map(projectMeta)];
}

export const socialImagePath = '/og-image.jpg';
