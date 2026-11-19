'use client';

import { type FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import {
  maximumEmailLength, maximumPasswordLength, minimumPasswordLength,
} from '../utils/accountPolicy.mjs';
import { communicationOptions, profileByRole, profileLimits } from '../utils/profile';
import type { SignupRole } from '../utils/signup';
import GoogleButton from './GoogleButton';

const inputStyle = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200';
const labelStyle = 'mb-1.5 block text-sm font-semibold text-slate-900';

function ProfileInput({ name, label, maxLength, placeholder, required, multiline }: {
  name: string;
  label: string;
  maxLength: number;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const props = { id: name, name, className: inputStyle, maxLength, placeholder, required };
  return (
    <div>
      <label htmlFor={name} className={labelStyle}>
        {label}{!required && <span className="ml-1.5 text-xs font-normal text-slate-600">(opsional)</span>}
      </label>
      {multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
    </div>
  );
}

function JobseekerFields() {
  const career = profileByRole.jobseeker;
  return (
    <>
      <ProfileInput name="displayName" label={career.nameLabel} maxLength={profileLimits.displayName} placeholder="Nama yang ingin ditampilkan" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileInput name="location" label="Domisili" maxLength={profileLimits.location} placeholder="Contoh: Bandung" required />
        <ProfileInput name="headline" label="Posisi yang diminati" maxLength={profileLimits.headline} placeholder="Contoh: Desainer visual" required />
      </div>
      <ProfileInput name="skills" label="Keahlian" maxLength={career.fields[0].limit} placeholder="Contoh: Figma, ilustrasi, desain konten" />
      <ProfileInput name="experience" label="Pengalaman atau proyek" maxLength={career.fields[1].limit} placeholder="Ceritakan singkat proyek, kegiatan, atau pengalaman kerja yang relevan." multiline />
    </>
  );
}

function CompanyFields() {
  const company = profileByRole.company;
  return (
    <>
      <ProfileInput name="displayName" label={company.nameLabel} maxLength={profileLimits.displayName} placeholder="Nama perusahaan atau organisasi" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileInput name="industry" label="Bidang usaha" maxLength={company.fields[0].limit} placeholder="Contoh: Teknologi pendidikan" required />
        <ProfileInput name="location" label="Lokasi kantor" maxLength={profileLimits.location} placeholder="Contoh: Jakarta Selatan" required />
      </div>
      <ProfileInput name="about" label={company.aboutLabel} maxLength={profileLimits.about} placeholder="Jelaskan kegiatan perusahaan dan jenis pekerjaan yang dilakukan tim." required multiline />
      <ProfileInput name="accessibility" label="Dukungan aksesibilitas" maxLength={company.fields[1].limit} placeholder="Contoh: instruksi tertulis, wawancara lewat chat, atau juru bahasa isyarat." multiline />
    </>
  );
}

export default function SignupForm({ role, googleAvailable, googleEmail, googleError }: {
  role: SignupRole;
  googleAvailable: boolean;
  googleEmail?: string;
  googleError?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isCompany = role === 'company';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError('');
    const form = event.currentTarget;
    const fields = new FormData(form);
    const read = (name: string) => String(fields.get(name) ?? '');
    const password = read('password');
    if (!googleEmail && password !== read('confirmation')) {
      setError('Kedua kata sandi harus sama.');
      form.querySelector<HTMLInputElement>('#signup-confirmation')?.focus();
      return;
    }
    const profile = {
      displayName: read('displayName'),
      location: read('location'),
      headline: read('headline'),
      about: read('about'),
      communication: read('communication'),
      details: isCompany
        ? { industry: read('industry'), accessibility: read('accessibility') }
        : { skills: read('skills'), experience: read('experience') },
    };
    setPending(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: googleEmail ? 'google' : 'password', role,
          email: read('email'), password, profile,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Pendaftaran gagal. Silakan coba lagi.');
        return;
      }
      if (googleEmail) {
        window.location.assign('/');
        return;
      }
      try { sessionStorage.setItem('lestari.registeredEmail', result.email); } catch {}
      window.location.assign(`/?registered=1&role=${role}`);
    } catch {
      setError('Pendaftaran gagal. Periksa koneksi dan coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      {googleEmail ? (
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-950">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <p className="font-semibold">Email Google terkonfirmasi</p>
            <p>{googleEmail}</p>
            <a href={`/api/auth/google/start?role=${role}&intent=signup`}
              className="mt-1 inline-flex min-h-9 items-center rounded-md font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
              Pilih akun Google lain
            </a>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-extrabold tracking-tight">Cara mendaftar</h2>
          <div className="mt-3"><GoogleButton role={role} intent="signup" available={googleAvailable} /></div>
          {!googleAvailable && <p className="mt-2 text-sm text-slate-600">Google belum tersedia. Daftar dengan email di bawah.</p>}
        </>
      )}

      {googleError && !googleEmail && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{googleError}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-5" aria-busy={pending}>
        {!googleEmail && (
          <fieldset disabled={pending} className="space-y-4 border-t border-slate-200 pb-5 pt-5">
            <h3 className="text-base font-bold">Daftar dengan email</h3>
            <div>
              <label htmlFor="signup-email" className={labelStyle}>{isCompany ? 'Email kerja' : 'Alamat email'}</label>
              <input id="signup-email" name="email" type="email" required autoComplete="email"
                maxLength={maximumEmailLength} className={inputStyle} placeholder={isCompany ? 'nama@perusahaan.com' : 'nama@email.com'} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="signup-password" className={labelStyle}>Kata sandi</label>
                <div className="relative">
                  <input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    minLength={minimumPasswordLength} maxLength={maximumPasswordLength} required
                    aria-describedby="password-hint" className={`${inputStyle} pr-11`} />
                  <button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-1 right-1 grid w-9 place-items-center rounded-lg text-slate-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                    {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                  </button>
                </div>
                <p id="password-hint" className="mt-1 text-xs text-slate-600">Minimal {minimumPasswordLength} karakter.</p>
              </div>
              <div>
                <label htmlFor="signup-confirmation" className={labelStyle}>Ulangi kata sandi</label>
                <input id="signup-confirmation" name="confirmation" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" maxLength={maximumPasswordLength} required className={inputStyle} />
              </div>
            </div>
          </fieldset>
        )}

        <fieldset disabled={pending} className="space-y-4 border-t border-slate-200 pt-5">
          <div>
            <h3 className="text-base font-bold">{isCompany ? 'Profil perusahaan' : 'Profil karier'}</h3>
            <p className="mt-1 text-sm text-slate-600">{isCompany ? 'Isi informasi dasar pemberi kerja.' : 'Bagikan informasi dasar untuk profil pencari kerja.'}</p>
          </div>
          {isCompany ? <CompanyFields /> : <JobseekerFields />}
          <div>
            <label htmlFor="communication" className={labelStyle}>
              Preferensi komunikasi <span className="text-xs font-normal text-slate-600">(opsional)</span>
            </label>
            <select name="communication" id="communication" className={inputStyle} defaultValue="">
              <option value="">Pilih cara berkomunikasi</option>
              {communicationOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </div>
        </fieldset>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={pending}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-bold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60">
          {pending ? 'Sedang mendaftar…' : isCompany ? 'Buat akun perusahaan' : 'Buat akun pencari kerja'}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
