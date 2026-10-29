import { useState } from 'react';
import { m } from 'motion/react';
import { images } from '../../data/images';
import type { ProjectImage } from '../../data/projects';
import { Picture } from '../ui/Picture';

/**
 * Main image with thumbnail buttons. Thumbnails are real buttons (keyboard and touch
 * friendly) with aria-pressed showing the current image.
 */
export function ProjectGallery({ items, title }: { items: ProjectImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];
  if (!current) return null;

  return (
    <section aria-label={`${title} gallery`}>
      <figure>
        <div className="relative aspect-[3/2] overflow-hidden bg-graphite">
          {/* Quick crossfade on change; keyed so each image mounts fresh */}
          <m.div
            key={`${current.key}-${active}`}
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Picture image={current.key} alt={current.alt} sizes="(min-width: 90rem) 1392px, 100vw" />
          </m.div>
        </div>
        <figcaption className="mt-3 text-sm text-stone">
          {current.alt ?? images[current.key].alt}
          <span className="sr-only">
            {' '}
            (image {active + 1} of {items.length})
          </span>
        </figcaption>
      </figure>

      {items.length > 1 && (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
          {items.map((item, index) => (
            <li key={`${item.key}-${index}`}>
              <button
                type="button"
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={`relative block aspect-[3/2] w-full overflow-hidden bg-graphite transition-opacity ${
                  index === active ? 'outline outline-2 outline-offset-2 outline-bronze' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Picture image={item.key} alt="" sizes="200px" />
                <span className="sr-only">
                  Show image {index + 1}: {item.alt ?? images[item.key].alt}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
