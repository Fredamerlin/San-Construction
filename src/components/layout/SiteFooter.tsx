import { Link } from 'react-router';
import { primaryNav } from '../../data/navigation';
import { services } from '../../data/services';
import { hasContactDetails, site } from '../../data/site';
import { BrandLogo } from '../brand/BrandLogo';

const linkClass = 'inline-flex min-h-11 items-center text-gray-400 transition-colors hover:text-gold sm:min-h-9';
const headingClass = 'font-jakarta text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-gold';

/**
 * Reference footer (black, hairline top border, small type), extended with the site's
 * page, service and contact links. Contact details appear only once real ones are supplied.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const { contact } = site;
  // Draft copy is shown only on the preview build, never presented as approved in production
  const showDescription = site.descriptionApproved || site.demoMode;

  return (
    <footer className="ref border-t border-line bg-black text-sm text-gray-400">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Link to="/" className="inline-block">
            <BrandLogo />
            <span className="sr-only">, home</span>
          </Link>
          {showDescription && <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-400">{site.description}</p>}
        </div>

        {/* 4 + (gap) + 2 + 3 + 3 = 12 columns */}
        <nav aria-label="Footer" className="lg:col-span-2 lg:col-start-5">
          <h2 className={headingClass}>Explore</h2>
          <ul className="mt-3">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Services" className="lg:col-span-3">
          <h2 className={headingClass}>Services</h2>
          <ul className="mt-3">
            {services.map((service) => (
              <li key={service.slug}>
                <Link to={`/services/${service.slug}`} className={linkClass}>
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className={headingClass}>Contact</h2>
          {hasContactDetails ? (
            <ul className="mt-3 space-y-1">
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className={linkClass}>
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && <li className="pt-2 leading-relaxed">{contact.address}</li>}
            </ul>
          ) : (
            <p className="mt-3 max-w-xs leading-relaxed">
              Tell us about your project through the{' '}
              <Link to="/contact" className="text-gray-200 underline underline-offset-4 hover:text-gold">
                enquiry form
              </Link>
              .
            </p>
          )}
          {site.social.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-5">
              {site.social.map((profile) => (
                <li key={profile.href}>
                  <a href={profile.href} className={linkClass} rel="noopener noreferrer" target="_blank">
                    {profile.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-line px-4 py-6 text-xs text-gray-500 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="text-gray-400">
          © {year} {site.name}. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {site.demoMode && <p className="text-gray-400">Preview build: sample content and imagery are placeholders.</p>}
          {site.privacyPath && (
            <Link to={site.privacyPath} className={linkClass}>
              Privacy notice
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
