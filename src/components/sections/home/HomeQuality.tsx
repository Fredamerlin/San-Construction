import { qualityCopy } from '../../../data/company';
import { ImageReveal } from '../../motion/ImageReveal';
import { Reveal } from '../../motion/Reveal';
import { Container } from '../../ui/Container';
import { Picture } from '../../ui/Picture';

export function HomeQuality() {
  return (
    <section aria-labelledby="quality-title" className="py-24 sm:py-32">
      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <ImageReveal className="aspect-[4/3] bg-graphite lg:col-span-6">
          <Picture image="scaffolding" sizes="(min-width: 1024px) 50vw, 100vw" />
        </ImageReveal>
        <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.15}>
          <h2 id="quality-title" className="text-headline">
            {qualityCopy.title}
          </h2>
          {qualityCopy.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-6 text-lead text-stone">
              {paragraph}
            </p>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
