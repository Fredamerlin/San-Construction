import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { services } from '../../data/services';
import { navLinkClass } from './navStyles';

/**
 * Desktop "Services" item: the label is a normal link to /services, and a separate
 * toggle button opens the list of service pages (disclosure pattern, not an ARIA menu).
 */
export function ServicesMenu({ label, to }: { label: string; to: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <li
      ref={rootRef}
      className="relative flex items-center"
      onBlur={(event) => {
        // Close when keyboard focus leaves the whole item
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <NavLink to={to} className={navLinkClass}>
        {label}
      </NavLink>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="-ml-2 inline-flex size-9 min-h-11 items-center justify-center text-gray-400 transition-colors hover:text-gold"
      >
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        <span className="sr-only">{open ? 'Hide' : 'Show'} service pages</span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full mt-3 w-72 rounded-2xl border border-line bg-card/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-md"
      >
        <ul>
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                to={`/services/${service.slug}`}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-gold"
              >
                {service.navTitle}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mx-4 mt-2 border-t border-line pt-3 pb-1">
          <Link
            to={to}
            onClick={() => setOpen(false)}
            className="block py-1 text-xs font-semibold uppercase tracking-wider text-gold hover:text-gold-hover"
          >
            All services
          </Link>
        </div>
      </div>
    </li>
  );
}
