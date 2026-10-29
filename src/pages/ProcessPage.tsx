import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, Building, CalendarDays, CheckCircle, ClipboardCheck, Compass, FileText, Info, MessagesSquare, Ruler, ShieldCheck } from 'lucide-react';
import { Action } from '../components/brand/Action';
import { jumpTo, scrollToSection } from '../components/brand/scroll';
import { BrandHero } from '../components/brand/BrandHero';
import { ClosingCta } from '../components/brand/ClosingCta';
import { Eyebrow, IconBox, SectionHeader, Wrap } from '../components/brand/primitives';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { Picture } from '../components/ui/Picture';
import type { ImageKey } from '../data/images';
import { staticPages } from '../data/pageMeta';
import { processCaveat, processSteps, type ProcessStep } from '../data/process';
import { qualityCopy } from '../data/company';
import { Seo } from '../lib/seo';

const stageId = (i: number) => `stage-${i + 1}`;
const ordinal = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];

function StageHeading({ step, index }: { step: ProcessStep; index: number }) {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <IconBox size="sm" className="text-sm">
          {String(index + 1).padStart(2, '0')}
        </IconBox>
        <span className="font-mono text-xs uppercase tracking-wider text-gold">
          Stage {ordinal[index]} · {step.navLabel}
        </span>
      </div>
      <h3 id={`${stageId(index)}-title`} className="mb-4 text-3xl text-white md:text-4xl">{step.title}</h3>
      <p className="mb-6 text-sm font-light leading-relaxed text-gray-300 md:text-base">{step.description}</p>
    </>
  );
}

function Checklist({ points, tone = 'ink' }: { points: ProcessStep['points']; tone?: 'ink' | 'card' }) {
  return (
    <ul className="space-y-3">
      {points.map((point) => (
        <li key={point.title} className={`flex items-start gap-3 rounded-xl border border-white/5 p-3 ${tone === 'ink' ? 'bg-ink' : 'bg-card'}`}>
          <CheckCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
          <div>
            <h4 className="font-jakarta text-xs font-semibold text-white">{point.title}</h4>
            <p className="text-[0.75rem] text-gray-400">{point.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StageImage({ image, label, className = 'h-[300px] sm:h-[380px]' }: { image: ImageKey; label?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      <Picture image={image} alt="" sizes="(min-width: 1024px) 45vw, 100vw" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
      {label && <span className="glass-panel absolute bottom-4 left-4 rounded-xl px-4 py-2 font-mono text-[0.6875rem] uppercase text-gold">{label}</span>}
    </div>
  );
}

/** Each stage gets its own composition, as in the reference. */
function Stage({ step, index }: { step: ProcessStep; index: number }) {
  const id = stageId(index);
  const shell = 'scroll-mt-28 rounded-3xl border border-line p-6 sm:p-8 md:scroll-mt-52 md:p-12 outline-none';
  let body: ReactNode;

  switch (index) {
    case 0:
      body = (
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <StageHeading step={step} index={index} />
            <div className="mb-8">
              <Checklist points={step.points} />
            </div>
            <Action to="/contact" icon={CalendarDays} size="sm">
              Send an enquiry
            </Action>
          </div>
          <div className="lg:col-span-6">
            <StageImage image="city-window" label="First conversation" />
          </div>
        </div>
      );
      return <article id={id} aria-labelledby={`${id}-title`} className={`${shell} bg-card`}>{body}</article>;
    case 1:
      body = (
        <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:order-2 lg:col-span-6">
            <StageHeading step={step} index={index} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {step.points.map((point, i) => {
                const Icon = i === 0 ? Compass : FileText;
                return (
                  <div key={point.title} className="rounded-xl border border-white/5 bg-card p-4">
                    <Icon aria-hidden="true" className="mb-2 size-5 text-gold" />
                    <h4 className="mb-1 font-jakarta text-xs font-semibold text-white">{point.title}</h4>
                    <p className="text-[0.75rem] text-gray-400">{point.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:order-1 lg:col-span-6">
            <StageImage image="render-stage-2" label="Brief & outline" />
          </div>
        </div>
      );
      return (
        <article id={id} aria-labelledby={`${id}-title`} className={`${shell} relative overflow-hidden bg-slab/30`}>
          <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-25" />
          {body}
        </article>
      );
    case 2:
      body = (
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <StageHeading step={step} index={index} />
            <Checklist points={step.points} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            <StageImage image="render-stage-1" className="h-48 sm:h-64" />
            <StageImage image="foundation-forms" className="h-48 sm:h-64" />
          </div>
        </div>
      );
      return <article id={id} aria-labelledby={`${id}-title`} className={`${shell} bg-card`}>{body}</article>;
    case 3:
      body = (
        <>
          <div className="max-w-2xl">
            <StageHeading step={step} index={index} />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3">
            {step.points.map((point, i) => (
              <div key={point.title} className={`rounded-2xl border bg-ink p-6 ${i === 1 ? 'border-gold/50' : 'border-line'}`}>
                <span className="mb-2 block font-mono text-xs uppercase text-gold">Part {String(i + 1).padStart(2, '0')}</span>
                <h4 className="mb-2 text-xl text-white">{point.title}</h4>
                <p className="text-xs leading-relaxed text-gray-400">{point.text}</p>
              </div>
            ))}
          </div>
        </>
      );
      return <article id={id} aria-labelledby={`${id}-title`} className={`${shell} bg-slab/30`}>{body}</article>;
    case 4:
      body = (
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <StageHeading step={step} index={index} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {step.points.map((point) => (
                <div key={point.title} className="rounded-xl border border-white/5 bg-ink p-3.5">
                  <h4 className="mb-1 font-jakarta text-xs font-semibold text-white">{point.title}</h4>
                  <p className="text-[0.75rem] text-gray-400">{point.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            <StageImage image="rebar-slab" className="h-48" />
            <StageImage image="steel-frame" className="h-48" />
            <StageImage image="render-stage-4" className="col-span-2 h-48" />
          </div>
        </div>
      );
      return <article id={id} aria-labelledby={`${id}-title`} className={`${shell} bg-card`}>{body}</article>;
    default:
      body = (
        <div className="relative z-10 max-w-2xl">
          <StageHeading step={step} index={index} />
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-xs text-gray-300">
            {step.points.map((point) => (
              <li key={point.title} className="flex items-center gap-2">
                <ClipboardCheck aria-hidden="true" className="size-4 text-gold" />
                <span>
                  <strong className="font-semibold text-white">{point.title}:</strong> {point.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
      return (
        <article id={id} aria-labelledby={`${id}-title`} className={`${shell} relative overflow-hidden bg-card`}>
          <div className="absolute inset-0">
            <Picture image="render-stage-6" alt="" sizes="100vw" imgClassName="opacity-30" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/30" />
          </div>
          {body}
        </article>
      );
  }
}


export default function ProcessPage() {
  const [active, setActive] = useState(0);

  // Highlight the stage currently in the middle of the screen
  useEffect(() => {
    const stages = processSteps.map((_, i) => document.getElementById(stageId(i))).filter((el): el is HTMLElement => Boolean(el));
    if (!('IntersectionObserver' in window) || stages.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(stages.indexOf(entry.target as HTMLElement));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    stages.forEach((stage) => observer.observe(stage));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ref">
      <Seo meta={staticPages.process} />
      <BrandHero
        image="walk-9"
        imageAlt=""
        pulse
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Our process' }]}
        badge="A structured project workflow"
        title={
          <>
            From Vision To <br className="hidden sm:block" />
            <em className="gold-text">Architectural Reality</em>
          </>
        }
        lead="A clear, structured approach to turning your idea into a space built to last, from the first conversation to the final walkthrough."
      >
        <a
          href="#overview"
          onClick={jumpTo('overview')}
          className="group inline-flex min-h-11 items-center gap-3 font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-gold"
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md group-hover:border-gold">
            <ArrowDown aria-hidden="true" className="size-4 animate-bounce text-gold motion-reduce:animate-none" />
          </span>
          Explore the {processSteps.length} stages
        </a>
      </BrandHero>

      {/* Overview and stage navigation */}
      <section id="overview" aria-labelledby="overview-title" className="relative border-t border-line bg-ink pt-20 pb-4 outline-none">
        <Wrap>
          <SectionHeader
            layout="center"
            id="overview-title"
            eyebrow="Project journey"
            title="A Thoughtful Process. Exceptional Results."
            intro="Choose a stage below to see what happens at each step of a SAN Construction project."
            className="mb-12"
          />
          <p className="mx-auto -mt-4 mb-10 flex max-w-2xl items-start gap-3 rounded-2xl border border-line bg-card p-4 text-xs leading-relaxed text-gray-400">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
            {processCaveat}
          </p>
        </Wrap>
      </section>

      <nav aria-label="Process stages" className="z-30 bg-ink/85 px-0 py-3 backdrop-blur-md md:sticky md:top-[5.5rem]">
        <Wrap>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {processSteps.map((step, i) => {
              const current = i === active;
              return (
                <li key={step.title}>
                  <a
                    href={`#${stageId(i)}`}
                    aria-current={current ? 'step' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      setActive(i);
                      scrollToSection(stageId(i));
                    }}
                    className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                      current ? 'border-gold bg-gold text-black' : 'border-white/10 bg-card text-gray-300 hover:border-gold'
                    }`}
                  >
                    <span className={`mb-1 font-mono text-xs font-bold ${current ? '' : 'text-gold'}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-center text-xs font-semibold uppercase tracking-wider">{step.navLabel}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </Wrap>
      </nav>

      {/* The six stages */}
      <section aria-label="Construction stages" className="relative bg-ink py-12">
        <Wrap className="space-y-12 md:space-y-24">
          {processSteps.map((step, i) => (
            <Reveal key={step.title}>
              <Stage step={step} index={i} />
            </Reveal>
          ))}
        </Wrap>
      </section>

      {/* Quality at every stage */}
      <section aria-labelledby="quality-title" className="relative border-t border-line bg-card py-24">
        <Wrap>
          <SectionHeader layout="center" id="quality-title" eyebrow="Craftsmanship" title="Quality At Every Stage" intro={qualityCopy.paragraphs[0]} />
          <Stagger className="grid grid-cols-1 gap-8 md:grid-cols-3" stagger={0.1}>
            {[
              { icon: Compass, title: 'Planning With Care', text: 'Scope, sequence, materials and approvals thought through and aligned before work begins.' },
              { icon: Ruler, title: 'Attention To Detail', text: 'Junctions, edges and finishes given the same care as the main structure.' },
              { icon: ShieldCheck, title: 'Checks As We Go', text: qualityCopy.paragraphs[1] },
            ].map(({ icon, title, text }) => (
              <StaggerItem key={title}>
                <div className="h-full rounded-3xl border border-line bg-ink p-8">
                  <IconBox icon={icon} className="mb-6" />
                  <h3 className="mb-3 text-2xl text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Wrap>
      </section>

      {/* Built with transparency */}
      <section aria-labelledby="transparency-title" className="relative border-t border-line bg-ink py-24">
        <Wrap>
          <Reveal>
            <div className="glass-panel relative mx-auto max-w-5xl overflow-hidden rounded-3xl border-gold/30! p-6 sm:p-8 md:p-12">
              <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-20" />
              <div className="relative z-10 mx-auto mb-10 max-w-2xl text-center">
                <Eyebrow>Keeping you informed</Eyebrow>
                <h2 id="transparency-title" className="mb-3 text-3xl text-white md:text-4xl">
                  Built With Transparency
                </h2>
                <p className="text-xs text-gray-400 md:text-sm">How we keep you informed about progress, decisions and changes.</p>
              </div>
              <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  { icon: FileText, title: 'Agreed scope', text: 'What is included, and what is not, written down before work starts.' },
                  { icon: CalendarDays, title: 'Progress updates', text: 'Regular updates on progress at agreed stages of the work.' },
                  { icon: MessagesSquare, title: 'Early notice of decisions', text: 'Choices that need your input raised early, with the options explained.' },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl border border-white/5 bg-card p-5">
                    <Icon aria-hidden="true" className="mb-3 size-6 text-gold" />
                    <h3 className="mb-1 font-jakarta text-sm font-semibold text-white">{title}</h3>
                    <p className="text-xs text-gray-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Wrap>
      </section>

      <ClosingCta
        eyebrow="Get started"
        title={
          <>
            Ready to Build With <em className="gold-text">Confidence</em>?
          </>
        }
        text="Let’s discuss your project and plan the next step together."
      >
        <Action to="/contact" icon={ArrowRight}>
          Start your project
        </Action>
        <Action to="/projects" variant="glass" icon={Building} iconStart>
          Explore our projects
        </Action>
      </ClosingCta>
    </div>
  );
}
