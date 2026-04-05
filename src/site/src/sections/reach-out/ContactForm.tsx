/**
 * Shell layer — Contact form React island (T064).
 * JS cost: ~4 KB (React island with client:load) — justified: requires interactive
 * validation, API submission, honeypot handling, and success/error UI state.
 */
import { useState } from 'react';

type Subject = 'general' | 'collaboration' | 'academic' | 'work' | 'other';

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'general',       label: 'General' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'academic',      label: 'Academic' },
  { value: 'work',          label: 'Work' },
  { value: 'other',         label: 'Other' },
];

interface FormState {
  name: string;
  email: string;
  subject: Subject;
  message: string;
  honeypot: string; // must remain empty — bot detection
}

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited';

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5000';

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    subject: 'general',
    message: '',
    honeypot: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>('idle');

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    else if (form.name.length > 100) next.name = 'Name must be 100 characters or fewer.';

    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    else if (form.email.length > 254) next.email = 'Email is too long.';

    if (!form.message.trim()) next.message = 'Message is required.';
    else if (form.message.length > 1000) next.message = `Message must be 1000 characters or fewer (${form.message.length}/1000).`;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (form.honeypot) return; // silently drop bot submissions

    setStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim(),
          subject:  form.subject,
          message:  form.message.trim(),
          honeypot: form.honeypot,
        }),
      });

      if (res.status === 429) {
        setStatus('rate_limited');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        return;
      }

      setStatus('success');
      setForm({ name: '', email: '', subject: 'general', message: '', honeypot: '' });
    } catch {
      setStatus('error');
    }
  }

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  if (status === 'success') {
    return (
      <div className="contact-form contact-form--success" role="status" aria-live="polite">
        <span className="contact-form__success-icon" aria-hidden="true">✓</span>
        <h2 className="contact-form__success-title">Message received!</h2>
        <p className="contact-form__success-desc">
          Thanks for reaching out. I'll get back to you as soon as I can.
        </p>
        <button
          className="contact-form__btn"
          onClick={() => setStatus('idle')}
          type="button"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Contact form"
    >
      {status === 'error' && (
        <div className="contact-form__alert contact-form__alert--error" role="alert">
          Something went wrong. Please try again in a moment.
        </div>
      )}
      {status === 'rate_limited' && (
        <div className="contact-form__alert contact-form__alert--error" role="alert">
          You've sent too many messages recently. Please wait an hour before trying again.
        </div>
      )}

      {/* Honeypot — hidden from real users, filled by bots */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="contact-hp">Leave this empty</label>
        <input
          id="contact-hp"
          name="honeypot"
          type="text"
          value={form.honeypot}
          onChange={change}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="contact-form__row">
        <div className="contact-form__field">
          <label className="contact-form__label" htmlFor="contact-name">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            className={`contact-form__input${errors.name ? ' contact-form__input--error' : ''}`}
            type="text"
            name="name"
            value={form.name}
            onChange={change}
            required
            maxLength={100}
            autoComplete="name"
            aria-describedby={errors.name ? 'contact-name-err' : undefined}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <span id="contact-name-err" className="contact-form__error" role="alert">{errors.name}</span>
          )}
        </div>

        <div className="contact-form__field">
          <label className="contact-form__label" htmlFor="contact-email">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            className={`contact-form__input${errors.email ? ' contact-form__input--error' : ''}`}
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            required
            maxLength={254}
            autoComplete="email"
            aria-describedby={errors.email ? 'contact-email-err' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <span id="contact-email-err" className="contact-form__error" role="alert">{errors.email}</span>
          )}
        </div>
      </div>

      <div className="contact-form__field">
        <label className="contact-form__label" htmlFor="contact-subject">Subject</label>
        <select
          id="contact-subject"
          className="contact-form__select"
          name="subject"
          value={form.subject}
          onChange={change}
        >
          {SUBJECTS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="contact-form__field">
        <label className="contact-form__label" htmlFor="contact-message">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          className={`contact-form__textarea${errors.message ? ' contact-form__input--error' : ''}`}
          name="message"
          value={form.message}
          onChange={change}
          required
          maxLength={1000}
          rows={6}
          aria-describedby={errors.message ? 'contact-msg-err' : 'contact-msg-count'}
          aria-invalid={!!errors.message}
        />
        <div className="contact-form__field-footer">
          {errors.message ? (
            <span id="contact-msg-err" className="contact-form__error" role="alert">{errors.message}</span>
          ) : (
            <span id="contact-msg-count" className="contact-form__counter" aria-live="polite">
              {form.message.length}/1000
            </span>
          )}
        </div>
      </div>

      <button
        className="contact-form__btn"
        type="submit"
        disabled={status === 'submitting'}
        aria-busy={status === 'submitting'}
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
