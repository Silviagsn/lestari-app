'use client';

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
        Isi nama di <button type="button" className="font-bold underline" onClick={openProfile}>Profil Perusahaan</button> untuk menerbitkan lowongan. Kamu bisa menyimpan draf sekarang.
      </div>}
      <fieldset disabled={busy} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-5">
          <section className={companyCard}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Briefcase className="h-5 w-5 text-indigo-700" aria-hidden="true" /> Informasi lowongan</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{textField('title', 'Judul lowongan', 'Contoh: Desainer Produk')}</div>
              {select('type', 'Tipe pekerjaan', jobTypes)}
              {select('arrangement', 'Pengaturan kerja', Object.fromEntries(workArrangements.map(value => [value, value])))}
              {select('category', 'Kategori', jobCategories)}
              {select('experienceLevel', 'Tingkat pengalaman', experienceLevels)}
              {textField('location', 'Lokasi', 'Contoh: Bandung atau Indonesia')}
              {textField('salary', 'Kisaran gaji (opsional)', 'Contoh: Rp5–7 juta per bulan')}
            </div>
          </section>
          <section className={companyCard}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5 text-indigo-700" aria-hidden="true" /> Deskripsi dan kualifikasi</h2>
            <div className="grid gap-4">
              {textField('description', 'Deskripsi pekerjaan', 'Jelaskan tanggung jawab dan bagaimana tim bekerja.', true)}
              {textField('requirementsText', 'Persyaratan', 'Masukkan satu persyaratan per baris.', true)}
            </div>
          </section>
        </div>
        <div className="grid gap-5">
          <section className={companyCard}>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Accessibility className="h-5 w-5 text-indigo-700" aria-hidden="true" /> Aksesibilitas kerja</h2>
            <p className="mb-4 mt-1 text-sm text-slate-600">Pilih minimal satu dukungan yang tersedia sebelum memublikasikan lowongan.</p>
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
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Calendar className="h-5 w-5 text-indigo-700" aria-hidden="true" /> Pengaturan lamaran</h2>
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
                Batas lamaran (opsional)
                <input type="date" className={companyInput} value={draft.deadline} onChange={event => update('deadline', event.target.value)} />
              </label>
              {textField('contactEmail', 'Email kontak lowongan', 'rekrutmen@perusahaan.com')}
              <p className="-mt-2 text-xs text-slate-600">Alamat ini akan terlihat oleh pelamar.</p>
            </div>
          </section>
        </div>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2 border-t border-indigo-100 pt-4">
        <button type="button" disabled={busy} onClick={onCancel} className={companySecondary}>Batal</button>
        {(!job || job.status === 'draft') && (
          <button type="submit" value="draft" disabled={busy} className={companySecondary}>Simpan draf</button>
        )}
        {job?.status === 'closed' && (
          <button type="submit" value="closed" disabled={busy} className={companySecondary}>Simpan perubahan</button>
        )}
        <button type="submit" value="published" disabled={busy || !companyName} className={companyPrimary}>
          {busy ? 'Menyimpan…' : job?.status === 'published' ? 'Simpan lowongan tayang' : 'Terbitkan lowongan'}
        </button>
      </div>
    </form>
  );
}
