import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

export interface ControlProps {
  id: string;
  name: string;
  required: boolean;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  className: string;
}

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Renders the input/select/textarea, wired to the label, hint and error. */
  children: (control: ControlProps) => ReactNode;
}

export const controlClass =
  'block w-full min-h-12 rounded-xl border bg-ink px-4 py-3 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-gold focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * Label + control + optional hint + error, programmatically associated (reference form style).
 * Errors are shown as text with an icon (never colour alone) and linked through
 * aria-describedby, so screen readers announce them with the field.
 */
export function FormField({ id, name, label, required = false, hint, error, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-4 text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-300">
        <span>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-gold">
              *
            </span>
          )}
        </span>
        <span className="text-[0.625rem] font-normal normal-case tracking-normal text-gray-400">{required ? 'Required' : 'Optional'}</span>
      </label>
      {hint && (
        <p id={hintId} className="-mt-1 mb-2 text-xs text-gray-400">
          {hint}
        </p>
      )}
      {children({
        id,
        name,
        required,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
        className: `${controlClass} ${error ? 'border-red-400' : 'border-line hover:border-white/25'}`,
      })}
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-2 text-xs text-red-300">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
