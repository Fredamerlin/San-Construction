import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { routes } from '../app/routes';
import { images } from '../data/images';
import { projects, visibleProjects } from '../data/projects';
import { services } from '../data/services';

const staticPaths = ['/', '/about', '/services', '/projects', '/process', '/contact'];
const validPaths = new Set([
  ...staticPaths,
  ...services.map((s) => `/services/${s.slug}`),
  ...visibleProjects.map((p) => `/projects/${p.slug}`),
]);

async function renderPage(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { level: 1 });
  return view;
}

describe('content data', () => {
  it('links every service to existing projects', () => {
    const slugs = new Set(projects.map((p) => p.slug));
    for (const service of services) {
      for (const related of service.relatedProjects) expect(slugs, `${service.slug} → ${related}`).toContain(related);
    }
  });

  it('assigns every project to an existing service and existing images', () => {
    const serviceSlugs = new Set(services.map((s) => s.slug));
    for (const project of projects) {
      expect(serviceSlugs).toContain(project.service);
      expect(project.images.length).toBeGreaterThan(0);
      for (const image of project.images) expect(images[image.key]).toBeDefined();
    }
  });

  it('never stores unverified facts on sample projects', () => {
    for (const project of projects.filter((p) => p.placeholder)) {
      expect(project.location).toBeUndefined();
      expect(project.year).toBeUndefined();
      expect(project.status).toBeUndefined();
    }
  });

  it('has unique slugs', () => {
    expect(new Set(services.map((s) => s.slug)).size).toBe(services.length);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
  });
});

describe('internal links', () => {
  it('has no dead internal links on any page', async () => {
    const pages = [...validPaths];
    const broken: string[] = [];

    for (const path of pages) {
      const { container, unmount } = await renderPage(path);
      for (const anchor of container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')) {
        const href = anchor.getAttribute('href') ?? '';
        const [pathname = '', query] = href.split('?');
        if (!validPaths.has(pathname)) broken.push(`${path} → ${href}`);
        // A preselected service must be a real one
        const service = new URLSearchParams(query).get('service');
        if (service && !services.some((s) => s.slug === service)) broken.push(`${path} → ${href}`);
      }
      unmount();
    }

    expect(broken).toEqual([]);
  }, 30000); // renders every page in turn
});

describe('sample projects', () => {
  it('labels a sample project page clearly', async () => {
    const sample = visibleProjects.find((p) => p.placeholder);
    if (!sample) return;
    await renderPage(`/projects/${sample.slug}`);
    expect(screen.getByRole('heading', { level: 1, name: sample.title })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/do not show a SAN Construction project/i);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('lets the gallery switch images with buttons', async () => {
    const sample = visibleProjects.find((p) => p.images.length > 1);
    if (!sample) return;
    await renderPage(`/projects/${sample.slug}`);
    const second = screen.getByRole('button', { name: /show image 2/i });
    expect(second).toHaveAttribute('aria-pressed', 'false');
    second.click();
    expect(await screen.findByRole('button', { name: /show image 2/i, pressed: true })).toBeInTheDocument();
  });
});
