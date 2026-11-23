'use client';

import { useLanguage } from './Language';

import { useState } from 'react';
import { Accessibility, Briefcase, Calendar, FileText } from 'lucide-react';
import { accessibilityOptions, emptyJob, experienceLevels, jobCategories, jobTextLimits, jobTypes, workArrangements, type CompanyJob, type JobDraft, type ListingStatus } from '../utils/recruitment';

export const companyCard = 'min-w-0 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6';
export const companyPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60';
export const companySecondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60';
export const companyInput = 'w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200';

export default function CompanyJobForm({ job, companyName, busy, save, onCancel, openProfile }: {
  job?: CompanyJob;
  companyName: string;
  busy: boolean;
  save: (job: JobDraft, status: ListingStatus) => void;
  onCancel: () => void;
  openProfile: () => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<JobDraft>(job ?? emptyJob);
  const update = (field: keyof JobDraft, value: string | string[]) => setDraft(current => ({ ...current, [field]: value }));
  const textField = (name: keyof typeof jobTextLimits, label: string, placeholder: string, multiline = false) => (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
      {label}
      {multiline ? (
        <textarea className={companyInput} rows={5} maxLength={jobTextLimits[name]} value={draft[name]}
          onChange={event => update(name, event.target.value)} placeholder={placeholder} />
      ) : (
        <input className={companyInput} type={name === 'contactEmail' ? 'email' : 'text'}
          maxLength={jobTextLimits[name]} required={name === 'title'} value={draft[name]}
          onChange={event => update(name, event.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
  const select = (name: 'type' | 'arrangement' | 'category' | 'experienceLevel', label: string, options: Record<string, string>) => (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
      {label}
      <select className={companyInput} value={draft[name]} onChange={event => update(name, event.target.value)}>
        {Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  );

  return (
    <form className="space-y-5" onSubmit={event => {
      event.preventDefault();
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const status = submitter?.value === 'draft' ? 'draft' : submitter?.value === 'closed' ? 'closed' : 'published';
      save(draft, status);
    }}>
      {!companyName && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {t("Isi nama di", "Enter your name in")} <button type="button" className="font-bold underline" onClick={openProfile}>{t("Profil Perusahaan", "Company Profile")}</button> {t("untuk menerbitkan lowongan. Kamu bisa menyimpan draf sekarang.", "to publish a job. You can save a draft now.")}
      </div>}
      <fieldset disabled={busy} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-5">
          <section className={companyCard}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Briefcase className="h-5 w-5 text-indigo-700" aria-hidden="true" /> {t("Informasi lowongan", "Job information")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{textField('title', t("Judul lowongan", "Job title"), 'Contoh: Desainer Produk')}</div>
              {select('type', t("Tipe pekerjaan", "Employment type"), jobTypes)}
              {select('arrangement', 'Pengaturan kerja', Object.fromEntries(workArrangements.map(value => [value, value])))}
              {select('category', t("Kategori", "Category"), jobCategories)}
              {select('experienceLevel', t("Tingkat pengalaman", "Experience level"), experienceLevels)}
              {textField('location', t("Lokasi", "Location"), 'Contoh: Bandung atau Indonesia')}
              {textField('salary', t("Kisaran gaji (opsional)", "Salary range (optional)"), 'Contoh: Rp5–7 juta per bulan')}
            </div>
          </section>
          <section className={companyCard}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5 text-indigo-700" aria-hidden="true" /> {t("Deskripsi dan kualifikasi", "Description and qualifications")}</h2>
            <div className="grid gap-4">
              {textField('description', t("Deskripsi pekerjaan", "Job description"), 'Jelaskan tanggung jawab dan bagaimana tim bekerja.', true)}
              {textField('requirementsText', t("Persyaratan", "Requirements"), 'Masukkan satu persyaratan per baris.', true)}
            </div>
          </section>
        </div>
        <div className="grid gap-5">
          <section className={companyCard}>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Accessibility className="h-5 w-5 text-indigo-700" aria-hidden="true" /> {t("Aksesibilitas kerja", "Workplace accessibility")}</h2>
            <p className="mb-4 mt-1 text-sm text-slate-600">{t("Pilih minimal satu dukungan yang tersedia sebelum memublikasikan lowongan.", "Select at least one available support option before publishing.")}</p>
            <div className="grid gap-2">
              {accessibilityOptions.map(option => (
                <label key={option} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-sm font-medium text-slate-800">
                  <input type="checkbox" className="h-4 w-4 accent-indigo-700" checked={draft.accessibilityOptions.includes(option)}
                    onChange={event => update('accessibilityOptions', event.target.checked
                      ? [...draft.accessibilityOptions, option]
                      : draft.accessibilityOptions.filter(value => value !== option))} />
                  {option}
                </label>
              ))}
            </div>
          </section>
          <section className={companyCard}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Calendar className="h-5 w-5 text-indigo-700" aria-hidden="true" /> {t("Pengaturan lamaran", "Application settings")}</h2>
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
                {t("Batas lamaran (opsional)", "Application deadline (optional)")}
                <input type="date" className={companyInput} value={draft.deadline} onChange={event => update('deadline', event.target.value)} />
              </label>
              {textField('contactEmail', t("Email kontak lowongan", "Recruitment email"), 'rekrutmen@perusahaan.com')}
              <p className="-mt-2 text-xs text-slate-600">{t("Alamat ini akan terlihat oleh pelamar.", "Applicants will see this email address.")}</p>
            </div>
          </section>
        </div>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2 border-t border-indigo-100 pt-4">
        <button type="button" disabled={busy} onClick={onCancel} className={companySecondary}>{t("Batal", "Cancel")}</button>
        {(!job || job.status === 'draft') && (
          <button type="submit" value="draft" disabled={busy} className={companySecondary}>{t("Simpan draf", "Save draft")}</button>
        )}
        {job?.status === 'closed' && (
          <button type="submit" value="closed" disabled={busy} className={companySecondary}>{t("Simpan perubahan", "Save changes")}</button>
        )}
        <button type="submit" value="published" disabled={busy || !companyName} className={companyPrimary}>
          {busy ? t("Menyimpan…", "Saving…") : job?.status === 'published' ? 'Simpan lowongan tayang' : t("Terbitkan lowongan", "Publish job")}
        </button>
      </div>
    </form>
  );
}
