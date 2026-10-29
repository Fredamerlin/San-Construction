import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { routes } from '../app/routes';
import { services } from '../data/services';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('routes', () => {
  it.each([
    ['/', /building spaces with quality and purpose/i],
    ['/about', /building dreams with strong foundations/i],
    ['/services', /construction solutions built around your vision/i],
    ['/projects', /architectural precision, built with care/i],
    ['/process', /from vision to architectural reality/i],
    ['/contact', /let’s build something great together/i],
  ])('renders %s with one main heading', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders every service detail page with breadcrumbs', async () => {
    for (const service of services) {
      const { unmount } = render(
        <RouterProvider router={createMemoryRouter(routes, { initialEntries: [`/services/${service.slug}`] })} />,
      );
      expect(await screen.findByRole('heading', { level: 1, name: service.title })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
      unmount();
    }
  });

  it.each(['/does-not-exist', '/services/unknown-service', '/projects/unknown-project'])(
    'shows the 404 page for %s',
    async (path) => {
      renderAt(path);
      expect(await screen.findByRole('heading', { name: /hasn’t been built yet/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    },
  );
});

describe('layout', () => {
  it('has a skip link, landmarks and the main call to action', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    const banner = within(screen.getByRole('banner'));
    expect(banner.getByRole('link', { name: /discuss your project/i })).toHaveAttribute('href', '/contact');
  });

  it('marks the active route in the main navigation', async () => {
    renderAt('/services/interior-fit-out');
    await screen.findByRole('heading', { level: 1 });
    const nav = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(nav.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('shows the current year in the footer', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    expect(within(screen.getByRole('contentinfo')).getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument();
  });
});

describe('services dropdown', () => {
  it('opens with the toggle and closes with Escape, returning focus', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });

    const toggle = screen.getByRole('button', { name: /show service pages/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(panel).not.toBeNull();
    expect(within(panel as HTMLElement).getByRole('link', { name: 'All services' })).toBeVisible();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });
});

describe('mobile menu', () => {
  it('opens as a dialog, locks page scroll and closes with Escape', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });

    const openButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(openButton);

    const dialog = await screen.findByRole('dialog', { name: /site menu/i });
    expect(openButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(within(dialog).getByRole('button', { name: /close menu/i })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes after following a link', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    const dialog = await screen.findByRole('dialog', { name: /site menu/i });
    await user.click(within(dialog).getByRole('link', { name: 'Process' }));

    expect(router.state.location.pathname).toBe('/process');
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
