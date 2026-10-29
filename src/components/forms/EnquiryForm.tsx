import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { CircleCheck, Info, Send } from 'lucide-react';
import { services } from '../../data/services';
import { site } from '../../data/site';
import { isFormConfigured, submitEnquiry } from '../../lib/emailService';
import {
  FIELD_ORDER,
  LIMITS,
  validateEnquiry,
  validateField,
  type EnquiryData,
  type EnquiryErrors,
  type EnquiryField,
} from '../../lib/validation';
import { PlaceholderBadge } from '../ui/PlaceholderBadge';
import { FormField } from './FormField';
import { FormStatus, type FormState } from './FormStatus';

const OTHER = 'other';
const EMPTY: EnquiryData = { name: '', email: '', phone: '', service: '', location: '', timeframe: '', area: '', message: '' };
const TIMEFRAMES = ['As soon as possible', 'Within 1–3 months', 'Within 3–6 months', 'Still planning / flexible'];

/**
 * Enquiry form.
 * - Client-side validation for usability; the provider's validation is authoritative.
 * - One submission at a time: the button is disabled and a ref guards against double clicks.
 * - Values are kept on every failure; success is shown only when the provider confirms it.
 * - A hidden honeypot field catches simple bots without bothering people.
 * - Nothing the visitor types is ever logged.
 */
export function EnquiryForm() {
  const formId = useId();
  const [searchParams] = useSearchParams();
  const configured = isFormConfigured();

  const [values, setValues] = useState<EnquiryData>(() => {
    const preselected = searchParams.get('service');
    return { ...EMPTY, service: services.some((s) => s.slug === preselected) ? (preselected ?? '') : '' };
  });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [state, setState] = useState<FormState>('idle');

  const inFlight = useRef(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<EnquiryField, HTMLElement | null>>>({});
  const successRef = useRef<HTMLHeadingElement>(null);

  const id = (field: EnquiryField) => `${formId}-${field}`;
  const register = (field: EnquiryField) => (element: HTMLElement | null) => {
    fieldRefs.current[field] = element;
  };

  const onChange = (field: EnquiryField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    // After a submit attempt, update that field's error live so corrections are acknowledged
    if (attempted) setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
  };

  const onBlur = (field: EnquiryField) => () => {
    // Validate on leaving a field only if something was typed, so tabbing through is quiet
    if (values[field].trim() || attempted) setErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }));
  };

  const serviceLabel = () => {
    if (values.service === OTHER) return 'Something else / not sure';
    return services.find((s) => s.slug === values.service)?.title ?? 'Not specified';
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const found = validateEnquiry(values);
    setErrors(found);
    setAttempted(true);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      setState('invalid');
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    if (honeypotRef.current?.value) {
      setState('blocked');
      return;
    }

    inFlight.current = true;
    setState('submitting');
    try {
      const outcome = await submitEnquiry(values, serviceLabel());
      if (outcome.status === 'sent') {
        setState('sent');
        setValues(EMPTY);
        setAttempted(false);
        requestAnimationFrame(() => successRef.current?.focus());
      } else if (outcome.status === 'rejected') {
        setState(outcome.rateLimited ? 'rate-limited' : 'rejected');
      } else {
        setState(outcome.status);
      }
    } finally {
      inFlight.current = false;
    }
  }

  if (state === 'sent') {
    return (
      <div className="relative z-10 rounded-2xl border border-gold/40 bg-ink/80 p-8 sm:p-12">
        <CircleCheck aria-hidden="true" className="size-10 text-gold" />
        <h2 ref={successRef} tabIndex={-1} className="mt-6 text-3xl text-white outline-none md:text-4xl">
          Thank you. Your enquiry has been sent.
        </h2>
        <p className="mt-4 text-sm text-gray-300">We have received your message and the details you shared.</p>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="mt-8 inline-flex min-h-11 items-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/15"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const submitting = state === 'submitting';

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby={`${formId}-title`} aria-busy={submitting} className="relative z-10">
      <h2 id={`${formId}-title`} className="sr-only">
        Send an enquiry
      </h2>

      {!configured && (
        <p className="mb-8 flex items-start gap-3 rounded-2xl border border-gold/40 bg-ink/70 p-4 text-sm text-gray-300">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
          <span>
            <strong className="font-semibold text-white">Not connected yet.</strong> This form is ready but online
            enquiries haven’t been switched on, so messages can’t be sent from it yet.
          </span>
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id={id('name')} name="name" label="Full name" required error={errors.name}>
          {(control) => (
            <input
              {...control}
              ref={register('name')}
              type="text"
              autoComplete="name"
              maxLength={LIMITS.name}
              value={values.name}
              onChange={onChange('name')}
              onBlur={onBlur('name')}
            />
          )}
        </FormField>

        <FormField id={id('email')} name="email" label="Email" required error={errors.email}>
          {(control) => (
            <input
              {...control}
              ref={register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              maxLength={LIMITS.email}
              value={values.email}
              onChange={onChange('email')}
              onBlur={onBlur('email')}
            />
          )}
        </FormField>

        <FormField id={id('phone')} name="phone" label="Phone" error={errors.phone}>
          {(control) => (
            <input
              {...control}
              ref={register('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={LIMITS.phone}
              value={values.phone}
              onChange={onChange('phone')}
              onBlur={onBlur('phone')}
            />
          )}
        </FormField>

        <FormField id={id('service')} name="service" label="Service of interest" error={errors.service}>
          {(control) => (
            <select {...control} ref={register('service')} value={values.service} onChange={onChange('service')}>
              <option value="">Choose a service</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.title}
                </option>
              ))}
              <option value={OTHER}>Something else / not sure</option>
            </select>
          )}
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            id={id('location')}
            name="location"
            label="Project location"
            hint="Town, city or area is enough."
            error={errors.location}
          >
            {(control) => (
              <input
                {...control}
                ref={register('location')}
                type="text"
                autoComplete="address-level2"
                maxLength={LIMITS.location}
                value={values.location}
                onChange={onChange('location')}
                onBlur={onBlur('location')}
              />
            )}
          </FormField>
        </div>

        <FormField id={id('timeframe')} name="timeframe" label="Expected start" error={errors.timeframe}>
          {(control) => (
            <select {...control} ref={register('timeframe')} value={values.timeframe} onChange={onChange('timeframe')}>
              <option value="">Choose a timeframe</option>
              {TIMEFRAMES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField id={id('area')} name="area" label="Plot or built-up area (sq. ft)" hint="An approximate figure is fine." error={errors.area}>
          {(control) => (
            <input
              {...control}
              ref={register('area')}
              type="text"
              inputMode="numeric"
              maxLength={LIMITS.area}
              placeholder="e.g. 2400"
              value={values.area}
              onChange={onChange('area')}
              onBlur={onBlur('area')}
            />
          )}
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            id={id('message')}
            name="message"
            label="About your project"
            required
            hint="What you would like to build or change, and roughly when."
            error={errors.message}
          >
            {(control) => (
              <textarea
                {...control}
                ref={register('message')}
                rows={5}
                placeholder="For example: number of floors and bedrooms, preferred style, or anything special you need."
                maxLength={LIMITS.message}
                value={values.message}
                onChange={onChange('message')}
                onBlur={onBlur('message')}
              />
            )}
          </FormField>
        </div>
      </div>

      {/* Honeypot: invisible to people and skipped by keyboard and screen readers.
          Bots that fill every field are stopped here. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${formId}-website`}>Leave this field empty</label>
        <input ref={honeypotRef} id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="mt-8 space-y-6">
        <FormStatus state={state} errorCount={errorCount} />

        <p className="text-xs leading-relaxed text-gray-400">
          We use the details you share only to respond to your enquiry.
          {site.privacyPath && (
            <>
              {' '}
              <a href={site.privacyPath} className="text-gray-200 underline underline-offset-4 hover:text-gold">
                Read our privacy notice
              </a>
              .
            </>
          )}{' '}
          <PlaceholderBadge label="Draft wording" className="ml-1 align-middle" />
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-gold px-8 py-4 text-xs font-semibold uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(197,160,89,0.3)] transition-colors hover:bg-gold-hover disabled:cursor-progress disabled:opacity-70"
        >
          {submitting ? 'Sending…' : 'Send enquiry'}
          {submitting ? (
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <Send aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
    </form>
  );
}
