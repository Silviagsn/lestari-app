'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { maximumPasswordLength, minimumPasswordLength } from '../utils/accountPolicy.mjs';
import { useLanguage } from './Language';

const input = 'mt-1 min-h-11 w-full rounded-xl border border-indigo-200 bg-white px-3 text-base text-slate-950 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60';

export default function ChangePasswordPage({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [availability, setAvailability] = useState<'loading' | 'ready' | 'google' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/profile/password', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const { hasPassword } = await response.json();
        if (!controller.signal.aborted) setAvailability(hasPassword ? 'ready' : 'google');
      })
      .catch(() => { if (!controller.signal.aborted) setAvailability('error'); });
    return () => controller.abort();
  }, [attempt]);

  const errors: Record<string, string> = {
    wrong_password: t('Kata sandi lama tidak cocok.', 'Your current password is incorrect.'),
    same_password: t('Gunakan kata sandi baru yang berbeda.', 'Choose a different new password.'),
    invalid_password: t('Periksa lagi isian kata sandi.', 'Check the password fields.'),
    session_expired: t('Sesi berakhir. Silakan masuk kembali.', 'Your session expired. Sign in again.'),
    session_changed: t('Sesi atau kata sandi sudah berubah. Silakan masuk kembali.', 'Your session or password changed. Sign in again.'),
    google_only: t('Akun ini masuk melalui Google.', 'This account signs in with Google.'),
  };
  const failed = t('Kata sandi gagal disimpan. Coba lagi.', 'Could not save your password. Try again.');

  return <main className="mx-auto max-w-xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10">
    <button type="button" onClick={onBack} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50">
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />{t('Kembali ke profil', 'Back to profile')}
    </button>
    <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-800"><KeyRound aria-hidden="true" className="h-5 w-5" /></span>
        <h1 className="text-xl font-extrabold text-slate-950">{t('Ubah Kata Sandi', 'Change Password')}</h1>
      </div>
      {availability === 'loading' && <p role="status" className="mt-4 text-sm text-slate-700">{t('Memeriksa metode masuk…', 'Checking how you sign in…')}</p>}
      {availability === 'google' && <p className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-950">
        {t('Akun ini memakai Google untuk masuk. Kelola kata sandi melalui akun Google kamu.', 'This account signs in with Google. Manage your password through your Google account.')}
      </p>}
      {availability === 'error' && <div className="mt-4 space-y-2">
        <p role="alert" className="text-sm text-rose-800">{t('Metode masuk gagal dimuat.', 'Could not load your sign-in method.')}</p>
        <button type="button" className="min-h-10 rounded-lg px-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50" onClick={() => { setAvailability('loading'); setAttempt(value => value + 1); }}>{t('Coba lagi', 'Try again')}</button>
      </div>}
      {availability === 'ready' && <form className="mt-5" onSubmit={async event => {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget;
        const values = new FormData(form);
        const currentPassword = values.get('currentPassword');
        const newPassword = values.get('newPassword');
        setSaved(false);
        if (newPassword !== values.get('confirmation')) {
          setError(t('Konfirmasi kata sandi baru tidak cocok.', 'The new passwords do not match.'));
          return;
        }
        setError('');
        setPending(true);
        try {
          const response = await fetch('/api/profile/password', { method: 'PUT',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            setError(payload && Object.hasOwn(errors, payload.error) ? errors[payload.error] : failed);
            return;
          }
          form.reset();
          setSaved(true);
        } catch {
          setError(failed);
        } finally {
          setPending(false);
        }
      }}>
        <fieldset disabled={pending} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            {t('Kata sandi lama', 'Current password')}
            <input name="currentPassword" type="password" autoComplete="current-password" required maxLength={maximumPasswordLength} className={input} />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            {t('Kata sandi baru', 'New password')}
            <input name="newPassword" type="password" autoComplete="new-password" required minLength={minimumPasswordLength} maxLength={maximumPasswordLength} aria-describedby="new-password-hint" className={input} />
          </label>
          <p id="new-password-hint" className="!mt-1 text-xs text-slate-600">{t(`Minimal ${minimumPasswordLength} karakter.`, `At least ${minimumPasswordLength} characters.`)}</p>
          <label className="block text-sm font-semibold text-slate-800">
            {t('Ulangi kata sandi baru', 'Confirm new password')}
            <input name="confirmation" type="password" autoComplete="new-password" required maxLength={maximumPasswordLength} className={input} />
          </label>
          <button type="submit" className="min-h-11 rounded-xl bg-indigo-700 px-4 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-60">
            {pending ? t('Menyimpan…', 'Saving…') : t('Simpan kata sandi', 'Save password')}
          </button>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
          {saved && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{t('Kata sandi berhasil diubah. Sesi di perangkat lain sudah berakhir.', 'Password changed. Other sessions have been signed out.')}</p>}
        </fieldset>
      </form>}
    </section>
  </main>;
}
