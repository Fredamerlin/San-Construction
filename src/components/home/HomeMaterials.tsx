import { useId, useState, type KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { materials } from '../../data/materials';
import { SectionHeader, Wrap } from '../brand/primitives';
import { Reveal } from '../motion/Reveal';

/**
 * Reference "Material & BIM Studio": a list of materials on the left; choosing one updates the
 * specification card on the right. Implemented as tabs (arrow keys move between them).
 */
export function HomeMaterials() {
  const [active, setActive] = useState(0);
  const uid = useId();
  const material = materials[active]!;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next: number | null = null;
    if (event.key in keys) next = (active + keys[event.key]! + materials.length) % materials.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = materials.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  return (
    <section id="materials" aria-labelledby="materials-title" className="relative border-y border-line bg-slab/30 py-24">
      <Wrap>
        <SectionHeader
          layout="center"
          id="materials-title"
          eyebrow="Material studio"
          title="Careful Planning Meets Tactile Materials"
          intro="Every project has its own palette. These are four materials that suit homes in Indian climates, and how they are typically used."
        />

        <Reveal>
          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-line bg-card p-5 sm:p-6 md:p-10 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-5">
              <h3 id={`${uid}-label`} className="mb-2 font-jakarta text-xs font-semibold uppercase tracking-widest text-gold">
                Select a material
              </h3>
              <div role="tablist" aria-labelledby={`${uid}-label`} aria-orientation="vertical" onKeyDown={onKeyDown} className="flex flex-col gap-4">
                {materials.map((item, i) => {
                  const selected = i === active;
                  return (
                    <button
                      key={item.key}
                      id={`${uid}-tab-${i}`}
                      role="tab"
                      type="button"
                      aria-selected={selected}
                      aria-controls={`${uid}-panel`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActive(i)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        selected ? 'border-gold bg-ink' : 'border-white/10 bg-ink/50 hover:border-white/20'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className="size-8 shrink-0 rounded-lg border" style={{ background: item.swatch.fill, borderColor: item.swatch.edge }} />
                        <span>
                          <span className="block text-sm font-semibold text-white">{item.name}</span>
                          <span className="block text-[0.75rem] text-gray-400">{item.use}</span>
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className={`size-4 shrink-0 ${selected ? 'text-gold' : 'text-gray-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              id={`${uid}-panel`}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-${active}`}
              tabIndex={0}
              className="relative flex min-h-[360px] flex-col justify-between gap-8 overflow-hidden rounded-2xl border border-white/10 bg-ink p-6 lg:col-span-7"
            >
              <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-20" />
              <div key={material.key} className="relative z-10 animate-[fade-in_400ms_ease-out]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-md bg-gold/10 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-gold">
                    Material #{String(active + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-xs text-gray-400">Illustrative palette</span>
                </div>
                <h4 className="mb-2 text-3xl text-white">{material.name}</h4>
                <p className="text-sm font-light leading-relaxed text-gray-300">{material.description}</p>
              </div>

              <dl className="relative z-10 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
                {material.specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="block text-[0.625rem] uppercase text-gray-400">{spec.label}</dt>
                    <dd className="text-sm font-semibold text-white">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>
      </Wrap>
    </section>
  );
}
