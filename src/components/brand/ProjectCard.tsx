import { Link } from 'react-router';
import { ArrowRight, Images } from 'lucide-react';
import { projectLabel, type Project } from '../../data/projects';
import { getService } from '../../data/services';
import { Picture } from '../ui/Picture';
import { Tag } from './primitives';

interface ProjectCardProps {
  project: Project;
  /** When given, the image and "View gallery" open the lightbox instead of the detail page. */
  onOpenGallery?: (project: Project) => void;
  headingLevel?: 'h2' | 'h3';
  imageHeight?: string;
  sizes?: string;
  tone?: 'ink' | 'card';
}

/** Reference portfolio card: zooming photograph, mono labels, serif title, gold action. */
export function ProjectCard({
  project,
  onOpenGallery,
  headingLevel: Heading = 'h3',
  imageHeight = 'h-72 sm:h-80',
  sizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  tone = 'card',
}: ProjectCardProps) {
  const cover = project.images[0]!;
  const label = projectLabel(project);
  const service = getService(project.service);
  const detail = `/projects/${project.slug}`;

  const image = (
    <>
      <Picture image={cover.key} alt="" sizes={sizes} imgClassName="transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none" />
      <span aria-hidden="true" className={`absolute inset-0 bg-gradient-to-t ${tone === 'card' ? 'from-card' : 'from-ink'} via-transparent to-transparent opacity-80`} />
      {/* Visual labels only: the type and count are repeated in the card text */}
      <span aria-hidden="true" className="absolute top-4 left-4">
        <Tag>{project.type}</Tag>
      </span>
      {project.images.length > 1 && (
        <span aria-hidden="true" className="absolute right-4 bottom-4">
          <Tag>
            <Images aria-hidden="true" className="mr-1.5 size-3.5 text-gold" />
            {project.images.length} images
          </Tag>
        </span>
      )}
    </>
  );

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line transition-colors duration-500 hover:border-gold ${tone === 'card' ? 'bg-card' : 'bg-ink'}`}
    >
      {onOpenGallery ? (
        // Pointer shortcut only; keyboard and screen reader users get the "View gallery" button below
        <div onClick={() => onOpenGallery(project)} aria-hidden="true" className={`relative block w-full cursor-pointer overflow-hidden ${imageHeight}`}>
          {image}
        </div>
      ) : (
        <Link to={detail} tabIndex={-1} aria-hidden="true" className={`relative block overflow-hidden ${imageHeight}`}>
          {image}
        </Link>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-gold">{service?.navTitle ?? project.type}</span>
          {label && <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-gray-400">{label}</span>}
        </div>
        <Heading className="mb-2 text-2xl text-white transition-colors group-hover:text-gold">
          {/* Without a gallery, the title link stretches over the whole card */}
          <Link to={detail} className={onOpenGallery ? '' : "after:absolute after:inset-0 after:content-['']"}>
            {project.title}
          </Link>
        </Heading>
        <p className="mb-6 line-clamp-2 text-sm font-light leading-relaxed text-gray-400">{project.summary}</p>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs">
          {onOpenGallery ? (
            <>
              <Link to={detail} className="relative inline-flex min-h-11 items-center text-gray-400 hover:text-white">
                Project details
              </Link>
              <button
                type="button"
                onClick={() => onOpenGallery(project)}
                className="relative inline-flex min-h-11 items-center gap-1.5 font-semibold uppercase tracking-wider text-gold transition-transform hover:translate-x-1"
              >
                View gallery
                <ArrowRight aria-hidden="true" className="size-3.5" />
                <span className="sr-only">: {project.title}</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-gray-400">{project.images.length > 1 ? `${project.images.length} images` : 'Project'}</span>
              <span aria-hidden="true" className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-gold transition-transform group-hover:translate-x-1">
                View project
                <ArrowRight className="size-3.5" />
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
