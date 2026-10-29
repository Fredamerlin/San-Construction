import { useRef } from 'react';
import { m, useReducedMotion, useScroll, useSpring } from 'motion/react';
import type { ProcessStep } from '../../data/process';
import { Reveal, StaggerItem, StaggerList } from '../motion/Reveal';
import { DimensionLine } from '../ui/DimensionLine';
import { Picture } from '../ui/Picture';
import { stageImages } from '../../data/process';
import { ProcessVisual } from './ProcessVisual';

interface ProcessStepsProps {
  steps: ProcessStep[];
  /** compact: six short columns for previews. full: numbered editorial timeline. */
  variant?: 'compact' | 'full';
}

const pad = (n: number) => String(n).padStart(2, '0');

export function ProcessSteps({ steps, variant = 'full' }: ProcessStepsProps) {
  if (variant === 'compact') {
    return (
      <div>
        {/* The dimension line draws across, then the six stages rise in sequence */}
        <DimensionLine draw className="mb-10" />
        <StaggerList ordered stagger={0.1} className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-6">
          {steps.map((step, index) => (
            <StaggerItem as="li" key={step.title}>
              <p aria-hidden="true" className="font-display text-title text-bronze">
                {pad(index + 1)}
              </p>
              <h3 className="mt-3 font-sans text-base font-semibold text-bone">{step.title}</h3>
              <p className="mt-2 text-[0.9375rem] text-stone">{step.short}</p>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    );
  }

  return <ProcessTimeline steps={steps} />;
}

/**
 * Full process sequence. A bronze progress line on the left fills as the visitor scrolls
 * through the steps (scroll-linked, never scroll-controlling), and each step rises in as it
 * enters view. Under reduced motion the line is simply shown complete.
 */
function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 55%'] });
  // Light smoothing so the line doesn't jitter with trackpad scrolling
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div className="grid gap-16 lg:grid-cols-12">
      <div className="relative lg:col-span-7">
        <div aria-hidden="true" className="absolute bottom-0 left-0 top-0 hidden w-px bg-concrete-800 md:block" />
        <m.div
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 hidden w-px origin-top bg-bronze md:block"
          style={reduced ? undefined : { scaleY: progress }}
        />
        <ol ref={ref} className="md:pl-12">
          {steps.map((step, index) => (
            <li key={step.title} className="border-b border-concrete-800 last:border-b-0">
              <Reveal className="py-10 lg:py-20">
                {/* Phones and tablets: a still of this stage of the build */}
                <div className="relative mb-8 aspect-[4/3] overflow-hidden bg-graphite lg:hidden">
                  <Picture image={stageImages[index] ?? 'render-stage-6'} alt="" sizes="(min-width: 768px) 80vw, 100vw" />
                </div>
                <div className="grid gap-4 md:grid-cols-12 md:gap-8">
                  <p aria-hidden="true" className="font-display text-headline leading-none text-bronze md:col-span-2">
                    {pad(index + 1)}
                  </p>
                  <div className="md:col-span-10">
                    <h2 className="text-title">{step.title}</h2>
                    <p className="mt-4 max-w-xl text-lead text-stone">{step.description}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
      <div className="hidden lg:col-span-5 lg:block">
        <ProcessVisual progress={reduced ? scrollYProgress : progress} />
      </div>
    </div>
  );
}
