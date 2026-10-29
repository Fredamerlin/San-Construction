/**
 * Site-wide settings and company details.
 *
 * Nothing here is approved company information yet. Contact fields stay `null` until
 * SAN Construction supplies real details, and components hide anything that is `null`
 * instead of showing invented values.
 */

export interface ContactDetails {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  /** e.g. "Mon–Sat, 9:00 am – 6:00 pm". */
  hours: string | null;
}

/**
 * Office location for the Contact page map. Leave everything null until SAN Construction
 * confirms it: the page then shows a clearly labelled placeholder instead of a pin.
 * No API key is needed. Fill in either:
 * - `embedUrl`: the src from Google Maps → Share → "Embed a map" (preferred, exact pin), or
 * - `query`: the full postal address or the exact business name as listed on Google Maps.
 * `mapsUrl` (Google Maps → Share → link) is used for "Get directions" when supplied.
 */
export interface OfficeLocation {
  label: string | null;
  embedUrl: string | null;
  query: string | null;
  mapsUrl: string | null;
}

export interface SiteConfig {
  name: string;
  /** Draft description, pending owner approval. */
  description: string;
  descriptionApproved: boolean;
  contact: ContactDetails;
  location: OfficeLocation;
  /** Real social profile URLs only. Empty until supplied. */
  social: { label: string; href: string }[];
  /** Privacy notice route, once the policy exists. */
  privacyPath: string | null;
  /** Shows "Sample" labels and a preview notice on placeholder content. */
  demoMode: boolean;
  siteUrl: string | null;
}

export const site: SiteConfig = {
  name: 'SAN Construction',
  description:
    'A construction company planning and building residential and commercial spaces with care, clarity and craft.',
  descriptionApproved: false,
  contact: {
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    hours: null,
  },
  location: {
    label: null,
    embedUrl: null,
    query: null,
    mapsUrl: null,
  },
  social: [],
  privacyPath: null,
  demoMode: import.meta.env.VITE_DEMO_MODE !== 'false',
  siteUrl: import.meta.env.VITE_SITE_URL || null,
};

export const hasContactDetails = Object.values(site.contact).some(Boolean);

export const hasLocation = Boolean(site.location.embedUrl || site.location.query);

/** Iframe src for the map, or null when the location has not been confirmed. */
export function mapEmbedSrc(location: OfficeLocation = site.location): string | null {
  if (location.embedUrl) return location.embedUrl;
  if (location.query) return `https://www.google.com/maps?q=${encodeURIComponent(location.query)}&output=embed`;
  return null;
}

/** "Get directions" link, or null when the location has not been confirmed. */
export function directionsUrl(location: OfficeLocation = site.location): string | null {
  if (location.mapsUrl) return location.mapsUrl;
  if (location.query) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.query)}`;
  return null;
}
