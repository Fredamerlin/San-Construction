import { Link } from 'react-router';
import { Reveal } from '../../motion/Reveal';
import { Container } from '../../ui/Container';

export function HomeIntro() {
  return (
    <section aria-labelledby="intro-title" className="py-24 sm:py-32 lg:py-40">
      <Container className="grid gap-10 lg:grid-cols-12">
        <h2 id="intro-title" className="sr-only">
          About SAN Construction
        </h2>
        <Reveal className="lg:col-span-9">
          <p className="font-display text-title leading-snug text-bone lg:text-[clamp(2rem,1.2rem+2vw,3.25rem)]">
            SAN Construction plans and builds homes, workplaces and renovations, bringing careful preparation and
            steady communication to every stage between the first sketch and the final handover.
          </p>
        </Reveal>
        <Reveal className="lg:col-span-3 lg:col-start-10 lg:self-end" delay={0.2}>
          <p className="text-stone">
            Every project starts with listening: how the space will be used, what matters most, and what the site
            allows.
          </p>
          <Link
            to="/about"
            className="mt-6 inline-flex min-h-11 items-center font-semibold text-bone underline decoration-bronze underline-offset-8 hover:text-bronze-light"
          >
            About our approach
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
