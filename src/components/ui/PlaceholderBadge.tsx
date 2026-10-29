import { site } from '../../data/site';

/** Visible "Sample" label for placeholder content. Renders nothing outside demo mode. */
export function PlaceholderBadge({ label = 'Sample', className = '' }: { label?: string; className?: string }) {
  if (!site.demoMode) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/15 bg-black/60 px-3 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gray-200 ${className}`}
    >
      {label}
    </span>
  );
}
