'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Building2, Eye, EyeOff } from 'lucide-react';
import {
  isAccountEmail, maximumEmailLength, maximumPasswordLength, minimumPasswordLength,
} from '../utils/accountPolicy.mjs';

export type SignupRole = 'jobseeker' | 'company';

type SignupFormProps = {
  initialRole: SignupRole;
  initialEmail: string;
  onBack: () => void;
  onRegistered: (email: string, role: SignupRole) => void;
};

const accountOptions = [
  { role: 'jobseeker', title: 'Pencari Kerja', description: 'Cari kerja dan ikut workshop.', icon: Briefcase },
  { role: 'company', title: 'Perusahaan', description: 'Bergabung sebagai pemberi kerja.', icon: Building2 },
] as const;

const inputClass = 'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-800';

export default function SignupForm({ initialRole, initialEmail, onBack, onRegistered }: SignupFormProps) {
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState(isAccountEmail(initialEmail.trim()) ? initialEmail.trim() : '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmationInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError('');
    if (password !== confirmation) {
      setError('Kedua kata sandi harus sama.');
      confirmationInput.current?.focus();
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Pendaftaran gagal. Silakan coba lagi.');
        return;
      }
      onRegistered(result.email, result.role);
    } catch {
      setError('Pendaftaran gagal. Periksa koneksi dan coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        disabled={pending}
        className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 disabled:opacity-50"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Kembali ke login
      </button>

      <h2 ref={heading} tabIndex={-1} className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        Buat akun Lestari
      </h2>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" aria-busy={pending}>
        <fieldset disabled={pending} className="grid grid-cols-2 gap-2.5">
          <legend className={labelClass}>Daftar sebagai</legend>
          {accountOptions.map(({ role: option, title, description, icon: Icon }) => (
            <label key={option} className="relative cursor-pointer">
              <input
                type="radio"
                name="signup-role"
                value={option}
                checked={role === option}
                onChange={() => setRole(option)}
                className="peer sr-only"
              />
              <span className="flex h-full flex-col gap-1 rounded-2xl border border-slate-300 bg-white p-3 text-slate-700 hover:border-indigo-400 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-600 peer-focus-visible:ring-offset-2">
                <Icon aria-hidden="true" className="mb-1 h-5 w-5 text-indigo-700" />
                <span className="text-sm font-bold text-slate-900">{title}</span>
                <span className="text-xs leading-relaxed">{description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div>
          <label className={labelClass} htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={maximumEmailLength}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="signup-password">Kata sandi</label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={minimumPasswordLength}
              maxLength={maximumPasswordLength}
              aria-describedby="signup-password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={pending}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-controls="signup-password signup-confirmation"
              disabled={pending}
              className="absolute inset-y-1 right-1 grid w-10 place-items-center rounded-xl text-slate-600 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
          <p id="signup-password-hint" className="mt-1.5 text-xs text-slate-600">
            Minimal {minimumPasswordLength} karakter.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="signup-confirmation">Ulangi kata sandi</label>
          <input
            ref={confirmationInput}
            id="signup-confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            maxLength={maximumPasswordLength}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            disabled={pending}
            className={inputClass}
          />
        </div>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-800 hover:to-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 disabled:opacity-60"
        >
          {pending ? 'Sedang mendaftar…' : 'Buat akun'}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}
