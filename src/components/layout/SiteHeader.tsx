import { useCallback, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { ArrowRight, Menu, Phone } from 'lucide-react';
import { primaryCta, primaryNav } from '../../data/navigation';
import { site } from '../../data/site';
import { useScrolled } from '../../hooks/useScrolled';
import { Action } from '../brand/Action';
import { BrandLogo } from '../brand/BrandLogo';
import { MobileNavigation } from './MobileNavigation';
import { ScrollProgress } from './ScrollProgress';
import { ServicesMenu } from './ServicesMenu';
import { navLinkClass } from './navStyles';

/**
 * Reference header: a floating glass panel that tightens its top spacing once the page
 * scrolls, with a gold reading-progress bar above it.
 */
export function SiteHeader() {
  const scrolled = useScrolled(50);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const phone = site.contact.phone;

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setMenuOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  return (
    <>
      <ScrollProgress />
      <header
        className={`ref pointer-events-none fixed inset-x-0 top-0 z-50 px-3 transition-[padding] duration-300 sm:px-4 md:px-8 ${scrolled ? 'py-3' : 'py-3 sm:py-5'}`}
      >
        <div className="glass-panel pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-2 sm:px-6 sm:py-2.5">
          {/* Accessible name = visible text + ", home" */}
          <Link to="/" className="-my-1 py-1">
            <BrandLogo />
            <span className="sr-only">, home</span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center">
              {primaryNav.map((item) =>
                item.hasServicesMenu ? (
                  <ServicesMenu key={item.to} label={item.label} to={item.to} />
                ) : (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className={navLinkClass}>
                      {item.label}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            {phone && (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-300 hover:text-white xl:flex"
              >
                <Phone aria-hidden="true" className="size-3.5 text-gold" />
                {phone}
              </a>
            )}
            {/* Hidden on phones (it's in the menu) and at 1024px, where it would crowd the nav */}
            <div className="hidden sm:block lg:hidden xl:block">
              <Action to={primaryCta.to} icon={ArrowRight} size="sm" className="shadow-none hover:shadow-[0_0_20px_rgba(197,160,89,0.4)]">
                {primaryCta.label}
              </Action>
            </div>
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? menuId : undefined}
              onClick={() => setMenuOpen(true)}
              className="-mr-2 inline-flex size-11 items-center justify-center text-white lg:hidden"
            >
              <Menu aria-hidden="true" className="size-6" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Outside <header>: its backdrop-filter would confine the fixed full-screen panel */}
      <AnimatePresence>{menuOpen && <MobileNavigation id={menuId} onClose={closeMenu} />}</AnimatePresence>
    </>
  );
}
