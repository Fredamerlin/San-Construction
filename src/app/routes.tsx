import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { MainLayout } from '../components/layout/MainLayout';
import RouteErrorPage from '../pages/RouteErrorPage';
// Not lazy: the error page and detail pages already include it, so a separate chunk saves nothing.
import NotFoundPage from '../pages/NotFoundPage';

// Each page is a separate chunk, loaded when first visited. The layout (header,
// footer) renders immediately and shows a quiet fallback while a page loads.
const HomePage = lazy(() => import('../pages/HomePage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const ServicesPage = lazy(() => import('../pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('../pages/ServiceDetailPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
const ProcessPage = lazy(() => import('../pages/ProcessPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));

export const routes: RouteObject[] = [
  {
    Component: MainLayout,
    children: [
      {
        // Pathless route so page errors render inside the layout
        ErrorBoundary: RouteErrorPage,
        children: [
          { index: true, Component: HomePage },
          { path: 'about', Component: AboutPage },
          { path: 'services', Component: ServicesPage },
          { path: 'services/:slug', Component: ServiceDetailPage },
          { path: 'projects', Component: ProjectsPage },
          { path: 'projects/:slug', Component: ProjectDetailPage },
          { path: 'process', Component: ProcessPage },
          { path: 'contact', Component: ContactPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];
