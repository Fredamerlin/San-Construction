import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';

type Variant = 'gold' | 'glass' | 'outline' | 'link' | 'whatsapp';

const base =
  'group relative inline-flex min-h-11 items-center justify-center gap-3 overflow-hidden text-xs font-semibold uppercase tracking-widest transition-all duration-300 disabled:cursor-progress disabled:opacity-70';

const variants: Record<Variant, string> = {
  gold: 'rounded-xl bg-gold text-black shadow-[0_10px_30px_rgba(197,160,89,0.3)] hover:bg-gold-hover',
  glass: 'rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/15',
  outline: 'rounded-xl border border-gold/40 bg-card text-gold hover:border-gold',
  link: 'tracking-wider text-gold',
  whatsapp: 'rounded-xl border border-emerald-500/30 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30',
};

const sizes = { md: 'px-7 py-4', sm: 'px-5 py-2.5' };

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  size?: 'md' | 'sm';
  /** Icon after the label (default) or before it. */
  icon?: LucideIcon;
  iconStart?: boolean;
  className?: string;
}

type ActionProps = CommonProps &
  (
    | { to: string; href?: never; onClick?: () => void; type?: never; disabled?: never }
    | { href: string; to?: never; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void; type?: never; disabled?: never }
    | { onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; to?: never; href?: never }
  );

/**
 * Reference-style call to action. Renders a router link (`to`), a plain anchor (`href`:
 * external links, tel:, mailto:, in-page #anchors) or a button.
 */
export function Action(props: ActionProps) {
  const { children, variant = 'gold', size = 'md', icon: Icon, iconStart = false, className = '' } = props;
  const glyph = Icon && (
    <Icon
      aria-hidden="true"
      className={`size-4 shrink-0 transition-transform duration-300 ${iconStart ? '' : 'group-hover:translate-x-1'} ${variant === 'glass' && iconStart ? 'text-gold' : ''}`}
    />
  );
  const content = (
    <>
      {iconStart && glyph}
      <span className="relative z-10">{children}</span>
      {!iconStart && glyph}
      {variant === 'gold' && (
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
        />
      )}
    </>
  );
  const classes = `${base} ${variants[variant]} ${variant === 'link' ? '' : sizes[size]} ${className}`;

  if (props.to !== undefined) {
    return (
      <Link to={props.to} onClick={props.onClick} className={classes}>
        {content}
      </Link>
    );
  }
  if (props.href !== undefined) {
    const external = /^https?:/.test(props.href);
    return (
      <a
        href={props.href}
        onClick={props.onClick}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }
  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} disabled={props.disabled} className={classes}>
      {content}
    </button>
  );
}
