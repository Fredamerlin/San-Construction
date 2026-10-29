import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  /** Accessible name (or use labelledBy). */
  label?: string;
  labelledBy?: string;
  onClose: () => void;
  /** Receives focus on open; defaults to the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Extra keyboard handling (e.g. arrow keys in a gallery). Escape is handled already. */
  onKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
  children: ReactNode;
}

/**
 * Modal dialog, mounted only while open. Keeps focus inside, closes on Escape, stops the page
 * behind from scrolling, and returns focus to whatever opened it. Rendered in a portal so it
 * sits above the fixed header; `.ref` keeps the reference type inside it.
 */
export function Dialog({ label, labelledBy, onClose, initialFocus, onKeyDown, className = '', children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  // Latest handlers without re-running the effect (which would steal focus again)
  const handlers = useRef({ onClose, onKeyDown });
  useLayoutEffect(() => {
    handlers.current = { onClose, onKeyDown };
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    (initialFocus?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        handlers.current.onClose();
        return;
      }
      handlers.current.onKeyDown?.(event);
      if (event.key !== 'Tab' || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
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

    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      root.style.overflow = previousOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [initialFocus]);

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={`ref fixed inset-0 z-[70] animate-[fade-in_200ms_ease-out] ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
