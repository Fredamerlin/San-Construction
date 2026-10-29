import { useId, useState } from 'react';
import { FileText, Info } from 'lucide-react';
import { AREA, estimate, finishTiers, formatRupees, projectTypes, ratesApproved, showEstimator } from '../../data/estimator';
import { Reveal } from '../motion/Reveal';
import { Action } from './Action';
import { Eyebrow } from './primitives';

const selectClass =
  'min-h-12 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-white transition-colors focus:border-gold focus-visible:outline-2 focus-visible:outline-offset-2';

interface CostEstimatorProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  id?: string;
}

/**
 * Reference "Construction Cost Calculator": project type, built-up area slider and finish
 * level produce a live budget figure. While the rates are not approved it appears only on the
 * preview build, with a clear "sample figures" notice, and never on the live site.
 */
export function CostEstimator({
  eyebrow = 'Budget planner',
  title = 'Construction Cost Estimator',
  intro = 'Get a rough feel for the construction budget of a project from its size and finish level.',
  id,
}: CostEstimatorProps) {
  const uid = useId();
  const [type, setType] = useState(projectTypes[0]!.value);
  const [area, setArea] = useState<number>(AREA.initial);
  const [tier, setTier] = useState(finishTiers[1]!.value);

  if (!showEstimator) return null;

  const total = formatRupees(estimate(area, type, tier));
  const service = projectTypes.find((t) => t.value === type)?.service;

  return (
    <Reveal>
      <div id={id} className="glass-panel relative mx-auto max-w-5xl overflow-hidden rounded-3xl border-gold/30! p-6 sm:p-8 md:p-12">
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-15" />

        <div className="relative z-10 mx-auto mb-10 max-w-2xl text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mb-3 text-3xl text-white md:text-4xl">{title}</h2>
          <p className="text-xs text-gray-400 md:text-sm">{intro}</p>
        </div>

        {!ratesApproved && (
          <p role="note" className="relative z-10 mb-8 flex items-start gap-3 rounded-2xl border border-gold/40 bg-ink/70 p-4 text-xs leading-relaxed text-gray-300">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>
              <strong className="font-semibold text-white">Sample rates for this preview.</strong> These figures are illustrative
              and are not SAN Construction pricing. A real estimate depends on your site, design and specification.
            </span>
          </p>
        )}

        <div className="relative z-10 mb-8 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${uid}-type`} className="text-xs font-semibold uppercase text-gray-300">
              Project type
            </label>
            <select id={`${uid}-type`} value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
              {projectTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`${uid}-area`} className="text-xs font-semibold uppercase text-gray-300">
                Built-up area
              </label>
              <output htmlFor={`${uid}-area`} className="font-mono text-xs font-bold text-gold">
                {area.toLocaleString('en-IN')} sq. ft
              </output>
            </div>
            <input
              id={`${uid}-area`}
              type="range"
              min={AREA.min}
              max={AREA.max}
              step={AREA.step}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              aria-valuetext={`${area.toLocaleString('en-IN')} square feet`}
              className="mt-3 h-2 w-full cursor-pointer rounded-lg bg-slab"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`${uid}-tier`} className="text-xs font-semibold uppercase text-gray-300">
              Finish level
            </label>
            <select id={`${uid}-tier`} value={tier} onChange={(e) => setTier(e.target.value)} className={selectClass}>
              {finishTiers.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} (₹{option.rate.toLocaleString('en-IN')}/sq. ft{ratesApproved ? '' : ', sample'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-card p-6 md:flex-row md:p-8">
          <div className="text-center md:text-left">
            <span className="mb-1 block text-xs uppercase tracking-wider text-gray-400">
              {ratesApproved ? 'Estimated construction budget' : 'Sample estimate'}
            </span>
            <span aria-live="polite" className="gold-text font-cormorant text-4xl font-bold md:text-5xl">
              {total}
            </span>
          </div>
          <Action to={service ? `/contact?service=${service}` : '/contact'} icon={FileText} className="w-full md:w-auto">
            Ask for a real estimate
          </Action>
        </div>

        <p className="relative z-10 mt-4 text-center text-[0.6875rem] text-gray-400">
          Excludes approvals and statutory fees, loose furniture and site-specific work. Every project is priced individually.
        </p>
      </div>
    </Reveal>
  );
}
