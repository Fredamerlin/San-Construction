import { useState, type ReactNode } from 'react';
import { images, type ImageKey } from '../../data/images';
import { Picture } from '../ui/Picture';

interface ImageSwitcherProps {
  items: { key: ImageKey; alt?: string }[];
  /** What the images show, for the thumbnail labels, e.g. "concept home". */
  label: string;
  /** Floating badge in the top-left corner. */
  badge?: ReactNode;
  heightClass?: string;
  sizes?: string;
  className?: string;
}

/**
 * Large photograph with a glass bar of thumbnails over its lower edge (reference residential
 * showcase). Each thumbnail is a button with aria-pressed; the main image cross-fades.
 */
export function ImageSwitcher({
  items,
  label,
  badge,
  heightClass = 'h-[420px] md:h-[580px]',
  sizes = '(min-width: 1024px) 58vw, 100vw',
  className = '',
}: ImageSwitcherProps) {
  const [index, setIndex] = useState(0);
  const current = items[index] ?? items[0]!;

  return (
    <div className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl ${className}`}>
      <div className={`relative ${heightClass}`}>
        {items.map((item, i) => (
          <div
            key={item.key}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          >
            <Picture image={item.key} alt={i === index ? (item.alt ?? images[item.key].alt) : ''} sizes={sizes} />
          </div>
        ))}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {badge && <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6">{badge}</div>}

      {items.length > 1 && (
        <div
          role="group"
          aria-label={`${label}: choose an image`}
          className="glass-panel absolute right-4 bottom-4 left-4 flex items-center gap-3 overflow-x-auto rounded-2xl p-3 sm:right-6 sm:bottom-6 sm:left-6"
        >
          {items.map((item, i) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={i === index}
              aria-label={`Show image ${i + 1}: ${item.alt ?? images[item.key].alt}`}
              onClick={() => setIndex(i)}
              className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg transition-all ${
                i === index ? 'border-2 border-gold' : 'border border-white/20 opacity-70 hover:opacity-100'
              }`}
            >
              <Picture image={item.key} alt="" sizes="64px" />
            </button>
          ))}
          <p className="sr-only" aria-live="polite">
            Showing image {index + 1} of {items.length}: {current.alt ?? images[current.key].alt}
          </p>
        </div>
      )}
    </div>
  );
}
