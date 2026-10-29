import { ArrowRight, Box, Compass, MapPin, Sun } from 'lucide-react';
import { Action } from '../brand/Action';
import { ImageSwitcher } from '../brand/ImageSwitcher';
import { Eyebrow, Wrap } from '../brand/primitives';
import { Reveal } from '../motion/Reveal';

const highlights = [
  { icon: Compass, title: 'Planned around daily life', text: 'Orientation, light and the flow between rooms considered from the first sketch.' },
  { icon: Sun, title: 'Made for the climate', text: 'Deep overhangs, shaded verandahs and cross-ventilation for hot, wet seasons.' },
];

/** Reference "Residential Sanctuary": gallery with thumbnails beside an editorial column. */
export function HomeResidential() {
  return (
    <section id="residential" aria-labelledby="residential-title" className="relative overflow-hidden bg-card py-24">
      <Wrap className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <ImageSwitcher
            label="Concept home"
            items={[{ key: 'walk-1' }, { key: 'walk-2' }, { key: 'walk-3' }, { key: 'walk-4' }]}
            badge={
              <span className="glass-panel inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs text-white">
                <MapPin aria-hidden="true" className="size-3.5 text-gold" />
                Concept home · 3D renders
              </span>
            }
          />
        </Reveal>

        <Reveal className="flex flex-col lg:col-span-5" delay={0.12}>
          <Eyebrow className="mb-3">Residential sanctuary</Eyebrow>
          <h2 id="residential-title" className="mb-6 text-3xl leading-tight text-white md:text-5xl">
            Contemporary Homes Rooted in Indian Heritage
          </h2>
          <p className="mb-8 text-sm font-light leading-relaxed text-gray-300">
            Homes that bring traditional Indian planning together with open, light-filled modern rooms. Shown here is a concept
            home designed for this website: sloping clay-tile roofs, a carved teak entrance, jali screens and a covered terrace.
          </p>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-white/5 bg-slab/60 p-4">
                <Icon aria-hidden="true" className="mb-2 size-5 text-gold" />
                <h3 className="mb-1 font-jakarta text-sm font-semibold text-white">{title}</h3>
                <p className="text-[0.75rem] leading-relaxed text-gray-400">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line pt-6">
            <Action to="/projects/concept-kerala-home" variant="link" icon={ArrowRight}>
              See the concept home
            </Action>
            <Action to="/services/residential-construction" variant="link" icon={Box}>
              Residential services
            </Action>
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}
