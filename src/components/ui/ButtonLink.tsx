import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'quiet';

interface ButtonLinkProps {
  to: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-bronze text-night hover:bg-bronze-light',
  secondary:
    'border border-bone/35 text-bone hover:border-bone hover:bg-bone/5',
  quiet: 'text-bone underline-offset-4 hover:underline px-0',
};

/** A navigation link styled as a button. Use a <button> for actions instead. */
export function ButtonLink({ to, children, variant = 'primary', className = '', onClick }: ButtonLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap px-6 py-3 text-[0.9375rem] font-semibold tracking-wide transition-colors duration-200 ${variants[variant]} ${className}`}
    >
      <span>{children}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 transition-transform duration-200 ease-cinematic group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </Link>
  );
}
