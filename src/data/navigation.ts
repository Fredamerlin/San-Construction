export interface NavItem {
  label: string;
  to: string;
  /** Match only the exact path (used for Home). */
  end?: boolean;
  /** Renders a submenu of service pages. */
  hasServicesMenu?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: 'Home', to: '/', end: true },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services', hasServicesMenu: true },
  { label: 'Projects', to: '/projects' },
  { label: 'Process', to: '/process' },
  { label: 'Contact', to: '/contact' },
];

export const primaryCta = { label: 'Discuss Your Project', to: '/contact' } as const;
