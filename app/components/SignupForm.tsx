'use client';

import { useLanguage } from './Language';

import { type FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
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
  const { t } = useLanguage();
  const props = { id: name, name, className: inputStyle, maxLength, placeholder, required };
  return (
    <div>
      <label htmlFor={name} className={labelStyle}>
        {label}{!required && <span className="ml-1.5 text-xs font-normal text-slate-600">{t("(opsional)", "(optional)")}</span>}
      </label>
      {multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
    </div>
  );
}

function JobseekerFields() {
  const { t } = useLanguage();
  const career = profileByRole.jobseeker;
  return (
    <>
      <ProfileInput name="displayName" label={t(career.nameLabel, "Display name")} maxLength={profileLimits.displayName} placeholder={t("Nama yang ingin ditampilkan", "Name you want to display")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileInput name="location" label={t("Domisili", "Location")} maxLength={profileLimits.location} placeholder={t("Contoh: Bandung", "Example: Bandung")} required />
        <ProfileInput name="headline" label={t("Posisi yang diminati", "Preferred role")} maxLength={profileLimits.headline} placeholder={t("Contoh: Desainer visual", "Example: Visual designer")} required />
      </div>
      <ProfileInput name="skills" label={t("Keahlian", "Skills")} maxLength={career.fields[0].limit} placeholder={t("Contoh: Figma, ilustrasi, desain konten", "Example: Figma, illustration, content design")} />
      <ProfileInput name="experience" label={t("Pengalaman atau proyek", "Experience or projects")} maxLength={career.fields[1].limit} placeholder={t("Ceritakan singkat proyek, kegiatan, atau pengalaman kerja yang relevan.", "Briefly describe relevant projects, activities, or work experience.")} multiline />
    </>
  );
}

function CompanyFields() {
  const { t } = useLanguage();
  const company = profileByRole.company;
  return (
    <>
      <ProfileInput name="displayName" label={t(company.nameLabel, "Company name")} maxLength={profileLimits.displayName} placeholder={t("Nama perusahaan atau organisasi", "Company or organization name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileInput name="industry" label={t("Bidang usaha", "Industry")} maxLength={company.fields[0].limit} placeholder={t("Contoh: Teknologi pendidikan", "Example: Education technology")} required />
        <ProfileInput name="location" label={t("Lokasi kantor", "Office location")} maxLength={profileLimits.location} placeholder={t("Contoh: Jakarta Selatan", "Example: South Jakarta")} required />
      </div>
      <ProfileInput name="about" label={t(company.aboutLabel, "About the company")} maxLength={profileLimits.about} placeholder={t("Jelaskan kegiatan perusahaan dan jenis pekerjaan yang dilakukan tim.", "Describe your business and the work your team does.")} required multiline />
      <ProfileInput name="accessibility" label={t("Dukungan aksesibilitas", "Accessibility support")} maxLength={company.fields[1].limit} placeholder={t("Contoh: instruksi tertulis, wawancara lewat chat, atau juru bahasa isyarat.", "Example: Written instructions, chat interviews, or a sign language interpreter.")} multiline />
    </>
  );
}

export default function SignupForm({ role, googleAvailable, googleError }: {
  role: SignupRole;
  googleAvailable: boolean;
  googleError?: string;
}) {
  const { t } = useLanguage();
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
    if (password !== read('confirmation')) {
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
          method: 'password', role,
          email: read('email'), password, profile,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Pendaftaran gagal. Silakan coba lagi.');
        return;
      }
      try { sessionStorage.setItem('lestari.registeredEmail', result.email); } catch {}
      window.location.assign(`/masuk?registered=1&role=${role}`);
    } catch {
      setError('Pendaftaran gagal. Periksa koneksi dan coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <h2 className="text-xl font-extrabold tracking-tight">{t("Cara mendaftar", "How to sign up")}</h2>
      <div className="mt-3"><GoogleButton role={role} intent="signup" available={googleAvailable} /></div>
      <p className="mt-2 text-sm text-slate-600">
        {googleAvailable
          ? t("Daftar dengan Google untuk langsung masuk. Kamu bisa melengkapi profil nanti.", "Sign up with Google to get started right away. You can complete your profile later.")
          : t("Google belum tersedia. Daftar dengan email di bawah.", "Google is unavailable. You can sign up by email below.")}
      </p>

      {googleError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{googleError}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-5" aria-busy={pending}>
          <fieldset disabled={pending} className="space-y-4 border-t border-slate-200 pb-5 pt-5">
            <h3 className="text-base font-bold">{t("Daftar dengan email", "Sign up with email")}</h3>
            <div>
              <label htmlFor="signup-email" className={labelStyle}>{isCompany ? t("Email kerja", "Work email") : t("Alamat email", "Email address")}</label>
              <input id="signup-email" name="email" type="email" required autoComplete="email"
                maxLength={maximumEmailLength} className={inputStyle} placeholder={isCompany ? 'nama@perusahaan.com' : 'nama@email.com'} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="signup-password" className={labelStyle}>{t("Kata sandi", "Password")}</label>
                <div className="relative">
                  <input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    minLength={minimumPasswordLength} maxLength={maximumPasswordLength} required
                    aria-describedby="password-hint" className={`${inputStyle} pr-11`} />
                  <button type="button" aria-label={showPassword ? t("Sembunyikan kata sandi", "Hide password") : t("Tampilkan kata sandi", "Show password")}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-1 right-1 grid w-9 place-items-center rounded-lg text-slate-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                    {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                  </button>
                </div>
                <p id="password-hint" className="mt-1 text-xs text-slate-600">{t(`Minimal ${minimumPasswordLength} karakter.`, `At least ${minimumPasswordLength} characters.`)}</p>
              </div>
              <div>
                <label htmlFor="signup-confirmation" className={labelStyle}>{t("Ulangi kata sandi", "Confirm password")}</label>
                <input id="signup-confirmation" name="confirmation" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" maxLength={maximumPasswordLength} required className={inputStyle} />
              </div>
            </div>
          </fieldset>

        <fieldset disabled={pending} className="space-y-4 border-t border-slate-200 pt-5">
          <div>
            <h3 className="text-base font-bold">{isCompany ? t("Profil perusahaan", "Company profile") : t("Profil karier", "Career profile")}</h3>
            <p className="mt-1 text-sm text-slate-600">{isCompany ? t("Isi informasi dasar pemberi kerja.", "Enter basic company information.") : t("Bagikan informasi dasar untuk profil pencari kerja.", "Share the basics for your job seeker profile.")}</p>
          </div>
          {isCompany ? <CompanyFields /> : <JobseekerFields />}
          <div>
            <label htmlFor="communication" className={labelStyle}>
              {t("Preferensi komunikasi", "Communication preference")} <span className="text-xs font-normal text-slate-600">{t("(opsional)", "(optional)")}</span>
            </label>
            <select name="communication" id="communication" className={inputStyle} defaultValue="">
              <option value="">{t("Pilih cara berkomunikasi", "Choose a communication preference")}</option>
              {communicationOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </div>
        </fieldset>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={pending}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-bold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60">
          {pending ? t("Sedang mendaftar…", "Signing up…") : isCompany ? t("Buat akun perusahaan", "Create employer account") : t("Buat akun pencari kerja", "Create job seeker account")}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
