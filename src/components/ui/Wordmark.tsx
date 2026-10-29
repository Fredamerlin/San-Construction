/**
 * Provisional text wordmark until an approved logo is supplied. The space between the two
 * words is real text, so the accessible name reads "SAN Construction" (not "SANConstruction").
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 leading-none ${className}`}>
      <span className="font-display text-[1.75rem] tracking-[0.04em] text-bone">SAN</span>{' '}
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.32em] text-stone">Construction</span>
    </span>
  );
}
