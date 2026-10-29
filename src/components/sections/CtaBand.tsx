import type { ReactNode } from 'react';
import type { ImageKey } from '../../data/images';
import { primaryCta } from '../../data/navigation';
import { Reveal } from '../motion/Reveal';
import { ScrollZoom } from '../motion/ScrollZoom';
import { ButtonLink } from '../ui/ButtonLink';
import { Container } from '../ui/Container';
import { Picture } from '../ui/Picture';

interface CtaBandProps {
  /** May contain <em> for an italic accent word. */
  title?: ReactNode;
  text?: string;
  image?: ImageKey;
  cta?: { label: string; to: string };
}

/** Closing call to action, over a darkened decorative image that eases in as you scroll. */
export function CtaBand({
  title = (
    <>
      Have a project <em>in mind?</em>
    </>
  ),
  text = 'Tell us what you are planning. A short description is enough to start the conversation.',
  image = 'walk-11',
  cta = primaryCta,
}: CtaBandProps) {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-night">
      <ScrollZoom className="absolute inset-0 -z-10">
        <Picture image={image} alt="" sizes="100vw" imgClassName="opacity-55" />
      </ScrollZoom>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-night/85 via-night/50 to-night/20" />
      <Container className="py-28 sm:py-36 lg:py-44">
        <Reveal>
          <h2 id="cta-title" className="max-w-4xl text-display">
            {title}
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-8 max-w-xl text-lead text-stone">{text}</p>
          <ButtonLink to={cta.to} className="mt-10">
            {cta.label}
          </ButtonLink>
        </Reveal>
      </Container>
    </section>
  );
}
