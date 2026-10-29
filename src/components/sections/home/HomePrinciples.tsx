import { principles } from '../../../data/company';
import { Reveal, Stagger, StaggerItem } from '../../motion/Reveal';
import { Container } from '../../ui/Container';
import { SectionHeading } from '../../ui/SectionHeading';

/** The one warm-white section on the home page: a deliberate break in the dark rhythm. */
export function HomePrinciples() {
  return (
    <section aria-labelledby="principles-title" className="on-light bg-bone py-24 text-night sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <SectionHeading
            id="principles-title"
            title={
              <>
                How we <em>work.</em>
              </>
            }
            intro="The principles behind every project, large or small."
            tone="light"
          />
        </Reveal>
        <Stagger className="lg:col-span-7 lg:col-start-6" stagger={0.1}>
          <dl className="grid gap-x-12 gap-y-14 sm:grid-cols-2">
            {principles.map((principle) => (
              <StaggerItem key={principle.title}>
                <span aria-hidden="true" className="block h-px w-10 bg-bronze" />
                <dt className="mt-6 font-display text-title">{principle.title}</dt>
                <dd className="mt-3 text-concrete-600">{principle.description}</dd>
              </StaggerItem>
            ))}
          </dl>
        </Stagger>
      </Container>
    </section>
  );
}
