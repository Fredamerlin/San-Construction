import { site } from './site';

/**
 * Budget estimator (reference "Construction Cost Calculator").
 *
 * THE RATES BELOW ARE NOT SAN CONSTRUCTION PRICING. They are the illustrative figures from the
 * reference design, kept only so the tool can be previewed. While `ratesApproved` is false the
 * estimator is shown only in demo mode, labelled as sample figures. Replace the rates with
 * approved ones and set `ratesApproved: true` to show it on the live site.
 */
export const ratesApproved = false;

export const showEstimator = ratesApproved || site.demoMode;

export interface EstimatorOption {
  value: string;
  label: string;
}

/** Rupees per square foot of built-up area. */
export const finishTiers: (EstimatorOption & { rate: number })[] = [
  { value: 'standard', label: 'Standard finish', rate: 2800 },
  { value: 'premium', label: 'Premium finish', rate: 3600 },
  { value: 'signature', label: 'Signature finish', rate: 4800 },
];

/** Multiplier applied to the tier rate, and the service the enquiry link preselects. */
export const projectTypes: (EstimatorOption & { factor: number; service: string })[] = [
  { value: 'house', label: 'Independent house / villa', factor: 1, service: 'residential-construction' },
  { value: 'apartment', label: 'Multi-storey residential', factor: 0.9, service: 'residential-construction' },
  { value: 'commercial', label: 'Commercial building', factor: 0.85, service: 'commercial-construction' },
];

export const AREA = { min: 1000, max: 25000, step: 250, initial: 3500 } as const;

export function estimate(area: number, typeValue: string, tierValue: string): number {
  const tier = finishTiers.find((t) => t.value === tierValue) ?? finishTiers[1]!;
  const type = projectTypes.find((t) => t.value === typeValue) ?? projectTypes[0]!;
  return area * tier.rate * type.factor;
}

/** Indian notation: lakh below one crore, crore above. */
export function formatRupees(total: number): string {
  if (total >= 1_00_00_000) return `₹ ${(total / 1_00_00_000).toFixed(2)} Crore`;
  return `₹ ${(total / 1_00_000).toFixed(2)} Lakh`;
}
