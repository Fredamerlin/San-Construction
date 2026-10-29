import type { EnquiryData } from './validation';

/**
 * Enquiry delivery through a third-party form/email service.
 *
 * SECURITY: only *public* configuration belongs here. Everything read via import.meta.env
 * with a VITE_ prefix is bundled into client code. Supported providers are ones designed
 * for static sites, where the endpoint (Formspree) or access key (Web3Forms) is public and
 * abuse is limited by the provider (domain restrictions, spam filtering, rate limits).
 * Never put SMTP credentials or private API keys in VITE_ variables. If a provider needs a
 * secret, send the form to a serverless function instead and keep the secret there.
 *
 * Success is reported ONLY when the provider confirms it.
 */

export type SubmitOutcome =
  | { status: 'sent' }
  /** No provider configured yet: nothing was sent. */
  | { status: 'not-configured' }
  /** Provider refused the submission (spam filter, validation, rate limit). */
  | { status: 'rejected'; rateLimited: boolean }
  /** Network failure, timeout or unexpected server error. */
  | { status: 'failed' };

export interface FormConfig {
  endpoint: string;
  accessKey?: string;
}

export function getFormConfig(): FormConfig | null {
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT?.trim();
  if (!endpoint) return null;
  const accessKey = import.meta.env.VITE_FORM_ACCESS_KEY?.trim() || undefined;
  return { endpoint, accessKey };
}

export const isFormConfigured = () => getFormConfig() !== null;

export async function submitEnquiry(data: EnquiryData, serviceLabel: string): Promise<SubmitOutcome> {
  const config = getFormConfig();
  if (!config) return { status: 'not-configured' };

  // Field names chosen to read well in the provider's notification email
  const payload: Record<string, string> = {
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    service: serviceLabel,
    location: data.location.trim(),
    timeframe: data.timeframe.trim() || 'Not specified',
    area: data.area.trim() ? `${data.area.trim()} sq. ft` : 'Not specified',
    message: data.message.trim(),
    subject: `New enquiry from ${data.name.trim()}`,
    _subject: `New enquiry from ${data.name.trim()}`,
  };
  if (config.accessKey) payload.access_key = config.accessKey;

  let response: Response;
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      // Give up after 20s so the visitor gets an error and a retry, not an endless spinner
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(20000) : undefined,
    });
  } catch {
    return { status: 'failed' };
  }

  // Some providers report refusals (e.g. spam) inside a 200 response, so read the body too
  const body = (await response.json().catch(() => null)) as { success?: unknown; ok?: unknown } | null;
  const explicitFailure = body?.success === false || body?.ok === false;

  if (response.status === 429) return { status: 'rejected', rateLimited: true };
  if (response.ok && !explicitFailure) return { status: 'sent' };
  if (response.ok || (response.status >= 400 && response.status < 500)) return { status: 'rejected', rateLimited: false };
  return { status: 'failed' };
}
