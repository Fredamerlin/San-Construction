import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { m } from 'motion/react';
import { X } from 'lucide-react';
import { primaryCta, primaryNav } from '../../data/navigation';
import { services } from '../../data/services';
import { Action } from '../brand/Action';
import { BrandLogo } from '../brand/BrandLogo';

interface MobileNavigationProps {
  id: string;
  /** `restoreFocus` is false when closing because the visitor followed a link. */
  onClose: (restoreFocus: boolean) => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Reference mobile drawer: slides in from the right over a blurred dark backdrop. It behaves
 * as a modal dialog: focus is kept inside, Escape closes it, and the page behind does not
 * scroll while it is open. Mounted only while open (the header wraps it in AnimatePresence).
 */
export function MobileNavigation({ id, onClose }: MobileNavigationProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose(true);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // Close if the window grows to the desktop layout while the menu is open
    const desktop = window.matchMedia('(min-width: 64rem)');
    function onBreakpoint(event: MediaQueryListEvent) {
      if (event.matches) onClose(false);
    }

    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onBreakpoint);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onBreakpoint);
    };
  }, [onClose]);

  const navigate = () => onClose(false);

  return (
    <m.div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="ref fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink/95 backdrop-blur-xl lg:hidden"
    >
      <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-2 sm:px-8">
        <BrandLogo />
        <button
          ref={closeRef}
          type="button"
          onClick={() => onClose(true)}
          className="-mr-2 inline-flex size-11 items-center justify-center text-white"
        >
          <X aria-hidden="true" className="size-6" />
          <span className="sr-only">Close menu</span>
        </button>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col px-5 pt-8 pb-8 sm:px-8">
        <m.ul
          className="flex flex-col gap-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } } }}
        >
          {primaryNav.map((item) => (
            <m.li
              key={item.to}
              className="border-b border-white/5 pb-2"
              variants={{ hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <NavLink
                to={item.to}
                end={item.end}
                onClick={navigate}
                className={({ isActive }) =>
                  `flex min-h-12 items-center font-cormorant text-2xl font-semibold transition-colors ${isActive ? 'text-gold' : 'text-gray-200 hover:text-gold'}`
                }
              >
                {item.label}
              </NavLink>

              {item.hasServicesMenu && (
                <ul aria-label="Service pages" className="mb-2 ml-1 border-l border-gold/30 pl-4">
                  {services.map((service) => (
                    <li key={service.slug}>
                      <NavLink
                        to={`/services/${service.slug}`}
                        onClick={navigate}
                        className={({ isActive }) =>
                          `flex min-h-11 items-center text-sm ${isActive ? 'text-gold' : 'text-gray-400 hover:text-white'}`
                        }
                      >
                        {service.navTitle}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </m.li>
          ))}
        </m.ul>

        <div className="mt-auto pt-10">
          <Action to={primaryCta.to} onClick={navigate} className="w-full">
            {primaryCta.label}
          </Action>
        </div>
      </nav>
    </m.div>
  );
}
