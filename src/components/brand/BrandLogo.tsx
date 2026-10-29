/**
 * Reference logo lockup: a gold "S" tile with SAN / CONSTRUCTION. Provisional, like the old
 * wordmark, until an approved logo is supplied. Reads as "SAN Construction".
 */
export function BrandLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const tile = size === 'md' ? 'size-10 text-2xl' : 'size-8 text-xl';
  return (
    <span className="group/logo inline-flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-lg border border-gold/40 bg-gold/10 font-cormorant font-bold text-gold transition-all duration-300 group-hover/logo:bg-gold group-hover/logo:text-black ${tile}`}
      >
        S
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-cormorant text-xl font-bold tracking-wider text-white transition-colors group-hover/logo:text-gold">SAN</span>{' '}
        <span className="mt-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.25em] text-gold">Construction</span>
      </span>
    </span>
  );
}
