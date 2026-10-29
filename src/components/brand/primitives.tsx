import type { ElementType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { site } from '../../data/site';

/** Page-width wrapper used by the reference layout (max-w-7xl with 16/32px gutters). */
export function Wrap({ as: Tag = 'div', className = '', children }: { as?: ElementType; className?: string; children: ReactNode }) {
  return <Tag className={`mx-auto w-full max-w-7xl px-4 md:px-8 ${className}`}>{children}</Tag>;
}

/** Small gold uppercase label above a heading. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`mb-2 block text-xs font-semibold uppercase tracking-widest text-gold ${className}`}>{children}</span>;
}

/** Rounded gold-tinted square holding an icon or a stage number. */
export function IconBox({
  icon: Icon,
  children,
  size = 'md',
  className = '',
}: {
  icon?: LucideIcon;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const box = { sm: 'size-10 rounded-xl', md: 'size-12 rounded-xl', lg: 'size-14 rounded-2xl' }[size];
  const glyph = { sm: 'size-5', md: 'size-6', lg: 'size-7' }[size];
  return (
    <span
      aria-hidden={Icon ? true : undefined}
      className={`inline-flex shrink-0 items-center justify-center border border-gold/30 bg-gold/10 font-mono font-bold text-gold transition-colors ${box} ${className}`}
    >
      {Icon ? <Icon className={glyph} /> : children}
    </span>
  );
}

/** Pill badge with a gold dot (hero eyebrow). */
export function PillBadge({ children, pulse = false, className = '' }: { children: ReactNode; pulse?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur-md ${className}`}
    >
      <span aria-hidden="true" className="relative flex size-2">
        {pulse && <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-70 motion-reduce:animate-none" />}
        <span className="relative inline-flex size-2 rounded-full bg-gold" />
      </span>
      {children}
    </span>
  );
}

/** Small mono tag, e.g. "Sample photograph". Placeholder tags render only in demo mode. */
export function Tag({ children, placeholder = false, className = '' }: { children: ReactNode; placeholder?: boolean; className?: string }) {
  if (placeholder && !site.demoMode) return null;
  return (
    <span
      className={`inline-flex items-center rounded-lg border border-white/10 bg-black/60 px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-gray-200 backdrop-blur-md ${className}`}
    >
      {children}
    </span>
  );
}

interface SectionHeaderProps {
  id?: string;
  eyebrow: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  /** "split": title left, intro right. "center": stacked and centred. */
  layout?: 'split' | 'center';
  /** Rule under a split header (reference "Core Offerings" style). */
  rule?: boolean;
  /** Extra content on the right of a split header, e.g. filter tabs. */
  aside?: ReactNode;
  className?: string;
}

export function SectionHeader({ id, eyebrow, title, intro, layout = 'split', rule = false, aside, className = '' }: SectionHeaderProps) {
  if (layout === 'center') {
    return (
      <div className={`mx-auto mb-16 max-w-3xl text-center ${className}`}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={id} className="mb-4 text-3xl text-white md:text-5xl">
          {title}
        </h2>
        {intro && <p className="text-sm font-light text-gray-400 md:text-base">{intro}</p>}
      </div>
    );
  }
  return (
    <div
      className={`mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end ${rule ? 'border-b border-line pb-6' : ''} ${className}`}
    >
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={id} className="text-3xl text-white md:text-5xl">
          {title}
        </h2>
      </div>
      {intro && <p className="max-w-md text-sm font-light text-gray-400">{intro}</p>}
      {aside}
    </div>
  );
}
