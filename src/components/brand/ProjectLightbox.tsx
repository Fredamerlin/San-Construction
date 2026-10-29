import { useCallback, useId, useRef, useState, type TouchEvent } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, FileText, Info, X } from 'lucide-react';
import { images } from '../../data/images';
import { projectLabel, type Project } from '../../data/projects';
import { getService } from '../../data/services';
import { Picture } from '../ui/Picture';
import { Dialog } from './Dialog';

/**
 * Full-screen project gallery (reference Projects lightbox): counter, previous/next arrows,
 * thumbnails, arrow-key and swipe navigation, and a slide-over panel with the project's
 * details. Only verified facts are listed; sample and concept entries say so plainly.
 */
export function ProjectLightbox({ project, onClose }: { project: Project; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const count = project.images.length;
  const current = project.images[index]!;
  const alt = current.alt ?? images[current.key].alt;
  const service = getService(project.service);
  const label = projectLabel(project);

  const go = useCallback((step: number) => setIndex((i) => (i + step + count) % count), [count]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, select, textarea')) return;
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
    },
    [go],
  );

  const onTouchStart = (event: TouchEvent) => (touchStart.current = event.changedTouches[0]?.screenX ?? null);
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    const end = event.changedTouches[0]?.screenX;
    touchStart.current = null;
    if (start === null || end === undefined) return;
    if (end < start - 50) go(1);
    else if (end > start + 50) go(-1);
  };

  const facts = [
    { label: 'Type', value: project.type },
    { label: 'Service', value: service?.title },
    { label: 'Location', value: project.location },
    { label: 'Year', value: project.year },
    { label: 'Status', value: project.status },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <Dialog labelledBy={titleId} onClose={onClose} initialFocus={closeRef} onKeyDown={onKeyDown} className="flex items-center justify-center bg-black/95 p-2 backdrop-blur-xl md:p-6">
      {/* Top bar */}
      <div className="absolute top-3 right-3 left-3 z-20 flex items-center justify-between gap-3 md:top-4 md:right-4 md:left-4">
        <div className="glass-panel flex min-w-0 items-center gap-3 rounded-xl px-4 py-2 text-xs text-white">
          <h2 id={titleId} className="truncate text-sm text-gold">
            {project.title}
          </h2>
          <span aria-hidden="true" className="text-gray-500">
            |
          </span>
          <span className="shrink-0 font-mono text-gray-300" aria-live="polite">
            <span className="sr-only">Image </span>
            {index + 1} / {count}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={panelId}
            className="flex size-11 items-center justify-center rounded-xl border border-gold/40 bg-gold/20 text-gold transition-colors hover:bg-gold hover:text-black"
          >
            <Info aria-hidden="true" className="size-5" />
            <span className="sr-only">{detailsOpen ? 'Hide' : 'View'} project details</span>
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">Close image gallery</span>
          </button>
        </div>
      </div>

      {/* Image and controls */}
      <div className="relative flex h-full w-full max-w-6xl flex-col items-center justify-center pt-16">
        <div
          className="relative flex h-[62vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 md:h-[74vh]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Picture key={current.key} image={current.key} alt={alt} sizes="(min-width: 1152px) 1152px, 100vw" priority className="block h-full w-full animate-[fade-in_300ms_ease-out]" imgClassName="object-contain!" />
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute top-1/2 left-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white transition-colors hover:bg-gold hover:text-black md:left-4"
              >
                <ChevronLeft aria-hidden="true" className="size-6" />
                <span className="sr-only">Previous image</span>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute top-1/2 right-3 flex size-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/20 bg-black/60 text-white transition-colors hover:bg-gold hover:text-black md:right-4"
              >
                <ChevronRight aria-hidden="true" className="size-6" />
                <span className="sr-only">Next image</span>
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <div role="group" aria-label="Choose an image" className="mt-4 flex max-w-full items-center gap-3 overflow-x-auto p-2">
            {project.images.map((item, i) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={i === index}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-10 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === index ? 'scale-105 border-gold' : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <Picture image={item.key} alt="" sizes="56px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details slide-over */}
      <aside
        id={panelId}
        aria-label="Project details"
        hidden={!detailsOpen}
        className="absolute inset-y-0 right-0 z-30 flex w-full flex-col justify-between overflow-y-auto border-l border-line bg-card/95 p-6 md:w-[480px] md:p-8"
      >
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
              <FileText aria-hidden="true" className="size-5" />
              Project details
            </span>
            <button type="button" onClick={() => setDetailsOpen(false)} className="flex size-11 items-center justify-center text-gray-400 hover:text-white">
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close project details</span>
            </button>
          </div>

          <h3 className="mb-2 text-3xl text-white">{project.title}</h3>
          {label && <p className="mb-6 font-mono text-xs uppercase tracking-wider text-gold">{label}</p>}
          <p className="mb-6 text-sm font-light leading-relaxed text-gray-300">{project.summary}</p>

          <dl className="mb-8 space-y-3">
            {facts.map((fact) => (
              <div key={fact.label} className="flex justify-between gap-4 rounded-xl border border-white/5 bg-ink p-3 text-xs">
                <dt className="uppercase text-gray-400">{fact.label}</dt>
                <dd className="text-right font-semibold text-white">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {project.placeholder && (
            <p role="note" className="mb-6 rounded-2xl border border-white/10 bg-ink p-4 text-xs leading-relaxed text-gray-400">
              {project.concept
                ? 'Concept design created for this website. The images are 3D renders and do not show a SAN Construction project.'
                : 'Sample entry. The photographs are placeholders and do not show a SAN Construction project.'}
            </p>
          )}

          <Link to={`/projects/${project.slug}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold hover:text-gold-hover">
            Open the project page
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen(false)}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold text-xs font-semibold uppercase tracking-widest text-black hover:bg-gold-hover"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to the photo gallery
        </button>
      </aside>
    </Dialog>
  );
}
