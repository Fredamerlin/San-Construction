import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { services } from '../../../data/services';
import { ImageReveal } from '../../motion/ImageReveal';
import { Reveal, StaggerItem, StaggerList } from '../../motion/Reveal';
import { ButtonLink } from '../../ui/ButtonLink';
import { Container } from '../../ui/Container';
import { Picture } from '../../ui/Picture';
import { SectionHeading } from '../../ui/SectionHeading';

/** Services as an editorial index: a featured image beside a full list of linked rows. */
export function HomeServices() {
  return (
    <section aria-labelledby="services-title" className="bg-graphite py-24 sm:py-32">
      <Container>
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="services-title"
            mark
            title={
              <>
                What we <em>build.</em>
              </>
            }
            intro="Construction services from new builds to renovation, fit-out and early advice."
          />
          <ButtonLink to="/services" variant="secondary" className="self-start lg:self-auto">
            All services
          </ButtonLink>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <ImageReveal className="hidden aspect-[4/5] bg-charcoal lg:col-span-5 lg:block">
            <Picture image="walk-3" alt="" sizes="40vw" imgClassName="object-[35%_center]" />
          </ImageReveal>
          <StaggerList className="border-t border-concrete-800 lg:col-span-7" stagger={0.07}>
            {services.map((service) => (
              <StaggerItem as="li" key={service.slug} className="border-b border-concrete-800">
                <Link
                  to={`/services/${service.slug}`}
                  className="group flex items-start justify-between gap-6 py-7 transition-colors hover:text-bronze-light"
                >
                  <span>
                    <span className="block font-display text-title">{service.title}</span>
                    <span className="mt-2 block max-w-lg text-stone">{service.summary}</span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mt-2 size-5 shrink-0 text-stone transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-bronze-light"
                  />
                </Link>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </Container>
    </section>
  );
}
