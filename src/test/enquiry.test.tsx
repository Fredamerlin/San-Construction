import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnquiryForm } from '../components/forms/EnquiryForm';
import { validateField } from '../lib/validation';

const ENDPOINT = 'https://forms.example.test/submit';

function renderForm(path = '/contact') {
  const router = createMemoryRouter([{ path: '/contact', element: <EnquiryForm /> }], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return userEvent.setup();
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'Alex Example');
  await user.type(screen.getByLabelText(/^email/i), 'alex@example.com');
  await user.type(screen.getByLabelText(/about your project/i), 'A two-storey home on an existing plot.');
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('validation rules', () => {
  it('accepts and rejects emails sensibly', () => {
    expect(validateField('email', 'name@example.com')).toBeUndefined();
    expect(validateField('email', 'name@example')).toBeDefined();
    expect(validateField('email', 'name example.com')).toBeDefined();
  });

  it('treats phone as optional but checks it when given', () => {
    expect(validateField('phone', '')).toBeUndefined();
    expect(validateField('phone', '+44 (0)20 7946 0000')).toBeUndefined();
    expect(validateField('phone', 'call me')).toBeDefined();
  });
});

describe('enquiry form', () => {
  it('shows text errors for missing required fields and focuses the first one', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = renderForm();

    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    const name = screen.getByLabelText(/full name/i);
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription(/please enter your name/i);
    expect(name).toHaveFocus();
    expect(screen.getByLabelText(/^email/i)).toHaveAccessibleDescription(/please enter your email/i);
    expect(screen.getByRole('status')).toHaveTextContent(/correct the 3 highlighted fields/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    vi.stubGlobal('fetch', vi.fn());
    const user = renderForm();

    await user.type(screen.getByLabelText(/^email/i), 'not-an-email');
    await user.tab();
    expect(screen.getByLabelText(/^email/i)).toHaveAccessibleDescription(/valid email address/i);
  });

  it('never pretends to send when no provider is configured, and keeps the values', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = renderForm();

    expect(screen.getByText(/not connected yet/i)).toBeInTheDocument();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/your message was not sent/i);
    expect(screen.queryByRole('heading', { name: /thank you/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Alex Example');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows success only after the provider confirms, then moves focus to the confirmation', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const user = renderForm('/contact?service=interior-fit-out');

    expect(screen.getByLabelText(/service of interest/i)).toHaveValue('interior-fit-out');
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    const heading = await screen.findByRole('heading', { name: /your enquiry has been sent/i });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ name: 'Alex Example', email: 'alex@example.com', service: 'Interior and fit-out work' });
    expect(body).not.toHaveProperty('website'); // honeypot is never sent
  });

  it('keeps values and allows a retry after a network failure', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(jsonResponse(200, { success: true }));
    vi.stubGlobal('fetch', fetchMock);
    const user = renderForm();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));
    expect(await screen.findByText(/connection problem/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveValue('alex@example.com');

    await user.click(screen.getByRole('button', { name: /send enquiry/i }));
    expect(await screen.findByRole('heading', { name: /your enquiry has been sent/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('treats a provider-reported failure as a failure, even with HTTP 200', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { success: false, message: 'spam' })));
    const user = renderForm();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));
    expect(await screen.findByText(/couldn’t be accepted/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /thank you/i })).not.toBeInTheDocument();
  });

  it('sends only once when the button is clicked repeatedly, and shows progress', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    let resolve: (value: Response) => void = () => {};
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    vi.stubGlobal('fetch', fetchMock);
    const user = renderForm();

    await fillValid(user);
    const button = screen.getByRole('button', { name: /send enquiry/i });
    await user.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/sending/i);
    await user.click(button);
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolve(jsonResponse(200, { ok: true }));
    expect(await screen.findByRole('heading', { name: /your enquiry has been sent/i })).toBeInTheDocument();
  });

  it('blocks submissions that fill the hidden honeypot field', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = renderForm();

    await fillValid(user);
    const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).not.toBeNull();
    if (honeypot) honeypot.value = 'https://spam.example';
    await user.click(screen.getByRole('button', { name: /send enquiry/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/couldn’t be sent/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
