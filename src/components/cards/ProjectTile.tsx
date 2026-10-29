import { Link } from 'react-router';
import type { Project } from '../../data/projects';
import { ImageReveal } from '../motion/ImageReveal';
import { PlaceholderBadge } from '../ui/PlaceholderBadge';
import { Picture } from '../ui/Picture';

interface ProjectTileProps {
  project: Project;
  sizes: string;
  /** Tailwind aspect class for the image, so grids can mix proportions. */
  aspect?: string;
  headingLevel?: 'h2' | 'h3';
}

export function ProjectTile({ project, sizes, aspect = 'aspect-[4/3]', headingLevel: Heading = 'h3' }: ProjectTileProps) {
  const cover = project.images[0];

  return (
    <article className="group relative">
      <div className="relative">
        <ImageReveal className={`bg-graphite ${aspect}`}>
          {cover && (
            <Picture
              image={cover.key}
              alt={cover.alt}
              sizes={sizes}
              imgClassName="transition-transform duration-700 ease-cinematic group-hover:scale-[1.03]"
            />
          )}
        </ImageReveal>
        {project.placeholder && <PlaceholderBadge label={project.concept ? 'Concept' : 'Sample'} className="absolute left-4 top-4" />}
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <Heading className="font-display text-title">
          {/* The link covers the whole card; the heading text is its accessible name */}
          <Link
            to={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-bronze-light"
          >
            {project.title}
          </Link>
        </Heading>
        <p className="shrink-0 text-sm uppercase tracking-[0.16em] text-stone">{project.type}</p>
      </div>
      <p className="mt-2 max-w-md text-stone">{project.summary}</p>
    </article>
  );
}
