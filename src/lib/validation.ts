/**
 * Client-side validation for the enquiry form. This is for usability only: the email
 * provider's own validation is authoritative.
 */

export interface EnquiryData {
  name: string;
  email: string;
  phone: string;
  service: string;
  location: string;
  /** When the visitor hopes to start (optional select). */
  timeframe: string;
  /** Approximate plot or built-up area in sq. ft (optional). */
  area: string;
  message: string;
}

export type EnquiryField = keyof EnquiryData;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

export const LIMITS = {
  name: 100,
  email: 200,
  phone: 30,
  location: 120,
  area: 12,
  message: 3000,
  messageMin: 10,
} as const;

// Deliberately permissive: something@something.tld, no spaces
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Digits plus common separators; at least 6 digits overall
const PHONE_PATTERN = /^[+()\-.\s\d]*$/;

export function validateField(field: EnquiryField, raw: string): string | undefined {
  const value = raw.trim();

  switch (field) {
    case 'name':
      if (!value) return 'Please enter your name.';
      if (value.length > LIMITS.name) return `Please keep your name under ${LIMITS.name} characters.`;
      return undefined;
    case 'email':
      if (!value) return 'Please enter your email address.';
      if (value.length > LIMITS.email || !EMAIL_PATTERN.test(value)) {
        return 'Please enter a valid email address, for example name@example.com.';
      }
      return undefined;
    case 'phone':
      if (!value) return undefined; // optional
      if (!PHONE_PATTERN.test(value) || value.replace(/\D/g, '').length < 6 || value.length > LIMITS.phone) {
        return 'Please enter a valid phone number, or leave this blank.';
      }
      return undefined;
    case 'location':
      if (value.length > LIMITS.location) return `Please keep the location under ${LIMITS.location} characters.`;
      return undefined;
    case 'service':
    case 'timeframe':
      return undefined; // optional selects
    case 'area':
      if (!value) return undefined; // optional
      if (value.length > LIMITS.area || !/^\d[\d,]*(\.\d+)?$/.test(value)) return 'Please enter the area as a number, for example 2400, or leave this blank.';
      return undefined;
    case 'message':
      if (!value) return 'Please tell us a little about your project.';
      if (value.length < LIMITS.messageMin) return 'Please add a few more details about your project.';
      if (value.length > LIMITS.message) return `Please keep your message under ${LIMITS.message} characters.`;
      return undefined;
  }
}

/** Fields in on-screen order, so the first error found is the first one a visitor sees. */
export const FIELD_ORDER: EnquiryField[] = ['name', 'email', 'phone', 'service', 'location', 'timeframe', 'area', 'message'];

export function validateEnquiry(data: EnquiryData): EnquiryErrors {
  const errors: EnquiryErrors = {};
  for (const field of FIELD_ORDER) {
    const error = validateField(field, data[field]);
    if (error) errors[field] = error;
  }
  return errors;
}
