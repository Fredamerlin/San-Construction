import { CircleAlert, Info, LoaderCircle } from 'lucide-react';

export type FormState =
  | 'idle'
  | 'invalid'
  | 'submitting'
  | 'sent'
  | 'not-configured'
  | 'rejected'
  | 'rate-limited'
  | 'failed'
  | 'blocked';

const messages: Partial<Record<FormState, { tone: 'info' | 'error'; text: string }>> = {
  submitting: { tone: 'info', text: 'Sending your enquiry…' },
  'not-configured': {
    tone: 'error',
    text: 'Online enquiries aren’t connected yet, so your message was not sent. Your details are still in the form.',
  },
  rejected: {
    tone: 'error',
    text: 'Your enquiry couldn’t be accepted. Please check your details and try again.',
  },
  'rate-limited': {
    tone: 'error',
    text: 'Too many enquiries have been sent from this connection. Please wait a few minutes and try again.',
  },
  failed: {
    tone: 'error',
    text: 'Your enquiry couldn’t be sent because of a connection problem. Your details are still in the form, so please try again.',
  },
  blocked: {
    tone: 'error',
    text: 'Your enquiry couldn’t be sent. If you are using an autofill tool, please fill in the form manually and try again.',
  },
};

/**
 * Polite live region announcing submission progress and outcomes. Always rendered (even
 * when empty) so screen readers register it before the first announcement.
 */
export function FormStatus({ state, errorCount }: { state: FormState; errorCount: number }) {
  const message =
    state === 'invalid'
      ? {
          tone: 'error' as const,
          text:
            errorCount === 1
              ? 'Please correct the highlighted field.'
              : `Please correct the ${errorCount} highlighted fields.`,
        }
      : messages[state];

  return (
    <div role="status" aria-live="polite" className="min-h-0">
      {message && (
        <p
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            message.tone === 'error' ? 'border-red-400/50 bg-red-950/20 text-gray-100' : 'border-line bg-ink text-gray-300'
          }`}
        >
          {state === 'submitting' ? (
            <LoaderCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 animate-spin text-gold" />
          ) : message.tone === 'error' ? (
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-300" />
          ) : (
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
          )}
          <span>{message.text}</span>
        </p>
      )}
    </div>
  );
}
