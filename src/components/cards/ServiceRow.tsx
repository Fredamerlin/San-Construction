import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import type { Service } from '../../data/services';
import { ImageReveal } from '../motion/ImageReveal';
import { Reveal } from '../motion/Reveal';
import { Picture } from '../ui/Picture';

interface ServiceRowProps {
  service: Service;
  /** Place the image on the right instead of the left (for alternating layouts). */
  reverse?: boolean;
  /** Position in the list (0-based), shown as a large numeral. */
  index?: number;
}

/** Large editorial row for the services overview: image beside title, summary and link. */
export function ServiceRow({ service, reverse = false, index }: ServiceRowProps) {
  return (
    <article className="group relative grid items-center gap-8 py-10 md:grid-cols-12 md:gap-12 lg:py-14">
      <ImageReveal className={`aspect-[3/2] bg-graphite md:col-span-6 lg:col-span-7 ${reverse ? 'md:order-2' : ''}`}>
        <Picture
          image={service.image}
          alt=""
          sizes="(min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw"
          imgClassName="transition-transform duration-700 ease-cinematic group-hover:scale-[1.03]"
        />
      </ImageReveal>
      <Reveal className="md:col-span-6 lg:col-span-5" delay={0.15}>
        {index !== undefined && (
          <p aria-hidden="true" className="mb-6 flex items-center gap-4 font-display text-[1.75rem] leading-none text-bronze-light tabular-nums">
            {String(index + 1).padStart(2, '0')}
            <span className="h-px w-12 bg-bronze/60 transition-all duration-500 ease-cinematic group-hover:w-20" />
          </p>
        )}
        <h2 className="text-headline">
          <Link to={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {service.title}
          </Link>
        </h2>
        <p className="mt-5 max-w-md text-lead text-stone">{service.summary}</p>
        <p
          aria-hidden="true"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-bone transition-colors group-hover:text-bronze-light"
        >
          View service
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </p>
      </Reveal>
    </article>
  );
}
