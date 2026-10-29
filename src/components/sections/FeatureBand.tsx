import type { ReactNode } from 'react';
import { tallVersion, type ImageKey } from '../../data/images';
import { Reveal } from '../motion/Reveal';
import { ScrollZoom } from '../motion/ScrollZoom';
import { Container } from '../ui/Container';
import { Picture } from '../ui/Picture';

interface FeatureBandProps {
  image: ImageKey;
  /** Large statement over the image. May contain <em>. Rendered as a paragraph, not a heading. */
  statement: ReactNode;
  /** Small caption, e.g. what the image shows. */
  caption?: string;
  /** Text block position. */
  align?: 'left' | 'right';
}

/**
 * Cinematic interlude between sections: a full-bleed image that eases in as it scrolls past,
 * with one large statement. Breaks the rhythm of text sections; decorative, so the image is
 * hidden from assistive technology and the statement is plain text.
 */
export function FeatureBand({ image, statement, caption, align = 'left' }: FeatureBandProps) {
  const tall = tallVersion(image);
  return (
    <div className="relative isolate flex min-h-[80svh] items-end overflow-hidden bg-night">
      <ScrollZoom className="absolute inset-0 -z-10">
        <Picture image={image} sources={tall ? [{ media: '(orientation: portrait)', image: tall }] : []} alt="" sizes="100vw" />
      </ScrollZoom>
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 ${align === 'left' ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-night/85 via-night/35 to-transparent`}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night/80 via-transparent to-transparent" />
      <Container className={`py-20 sm:py-28 ${align === 'right' ? 'flex justify-end text-right' : ''}`}>
        <Reveal className="max-w-3xl">
          <p className="font-display text-headline">{statement}</p>
          {caption && <p className="mt-6 text-[0.8125rem] uppercase tracking-[0.2em] text-stone">{caption}</p>}
        </Reveal>
      </Container>
    </div>
  );
}
