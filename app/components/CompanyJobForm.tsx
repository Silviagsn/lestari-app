'use client';

import { useLanguage } from './Language';

import { useState, type ReactNode } from 'react';
import { accessibilityOptions, emptyJob, experienceLevels, jobCategories, jobDetailLabels, jobTextLimits, jobTypes, workArrangements, type CompanyJob, type JobDraft, type ListingStatus } from '../utils/recruitment';

export const companyCard = 'min-w-0 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6';
export const companyPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60';
export const companySecondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60';
export const companyInput = 'w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200';

type TextField = keyof typeof jobTextLimits;
type SelectField = 'type' | 'arrangement' | 'category' | 'experienceLevel';

export default function CompanyJobForm({ job, companyName, busy, save, onCancel, openProfile }: {
  job?: CompanyJob;
  companyName: string;
  busy: boolean;
  save: (job: JobDraft, status: ListingStatus) => void;
  onCancel: () => void;
  openProfile: () => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<JobDraft>(() => ({ ...emptyJob, ...job }));
  const update = <Field extends keyof JobDraft,>(field: Field, value: JobDraft[Field]) => {
    setDraft(current => ({ ...current, [field]: value }));
  };
  const onePerLine = t('Isi satu poin per baris.', 'Enter one item per line.');

  function text(name: TextField, placeholder: string, rows?: number, hint?: string) {
    const id = 'job-' + name;
    const props = {
      id, className: companyInput, maxLength: jobTextLimits[name], value: draft[name], placeholder,
      'aria-describedby': hint ? id + '-hint' : undefined,
    };
    return <>
      {rows ? <textarea {...props} rows={rows} onChange={event => update(name, event.target.value)} /> :
        <input {...props} type={name === 'contactEmail' ? 'email' : 'text'} required={name === 'title'}
          onChange={event => update(name, event.target.value)} />}
      {hint && <p id={id + '-hint'} className="mt-1 text-xs leading-relaxed text-slate-600">{hint}</p>}
    </>;
  }

  function select(name: SelectField, options: Record<string, string>) {
    return <select id={'job-' + name} className={companyInput} value={draft[name]} onChange={event => update(name, event.target.value)}>
      {Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>;
  }

  function row(label: string, control: ReactNode, field?: keyof JobDraft, optional = false) {
    return <tr className="border-t border-indigo-100">
      <th scope="row" className="bg-indigo-50/40 p-3 text-left align-top text-xs font-semibold leading-relaxed text-slate-900 [overflow-wrap:anywhere] sm:p-4 sm:text-sm">
        {field ? <label htmlFor={'job-' + field}>{label}</label> : label}
        {optional && <span className="mt-0.5 block text-xs font-normal text-slate-600">{t('Opsional', 'Optional')}</span>}
      </th>
      <td className="p-3 align-top text-sm sm:p-4">{control}</td>
    </tr>;
  }

  return (
    <form className="space-y-5" onSubmit={event => {
      event.preventDefault();
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const status = submitter?.value === 'draft' ? 'draft' : submitter?.value === 'closed' ? 'closed' : 'published';
      save(draft, status);
    }}>
      {!companyName && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {t('Isi nama di', 'Enter your company name in')} <button type="button" className="font-bold underline" onClick={openProfile}>{t('Profil Perusahaan', 'Company Profile')}</button> {t('untuk menerbitkan lowongan. Kamu tetap bisa menyimpan draf.', 'to publish the job. You can still save a draft.')}
      </div>}
      <fieldset disabled={busy} className="min-w-0 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
        <table className="w-full table-fixed border-collapse">
          <caption className="px-4 py-4 text-left sm:px-6">
            <strong className="block text-lg font-bold text-slate-950">{t('Detail lowongan untuk pencari kerja', 'Job details for applicants')}</strong>
            <span className="mt-1 block text-sm text-slate-600">{t('Isi kolom kanan. Baris mengikuti urutan informasi di detail lowongan.', 'Fill in the right column. The rows follow the order shown in the job details.')}</span>
          </caption>
          <colgroup><col className="w-[38%] sm:w-[30%]" /><col /></colgroup>
          <thead className="bg-indigo-100 text-xs font-bold text-indigo-950 sm:text-sm">
            <tr>
              <th scope="col" className="p-3 text-left sm:p-4">{t('Yang dilihat pencari kerja', 'What applicants see')}</th>
              <th scope="col" className="p-3 text-left sm:p-4">{t('Isian perusahaan', 'Employer input')}</th>
            </tr>
          </thead>
          <tbody>
            {row(t('Judul lowongan', 'Job title'), text('title', t('Contoh: Desainer Produk', 'Example: Product Designer')), 'title')}
            {row(t('Nama perusahaan', 'Company name'), <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-slate-700">
              <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">{companyName || t('Nama belum diisi', 'Name missing')}</span>
              <button type="button" onClick={openProfile} className="font-semibold text-indigo-800 hover:underline">{t('Buka profil', 'Open profile')}</button>
            </div>)}
            {row(t('Lokasi', 'Location'), text('location', t('Contoh: Bandung atau Indonesia', 'Example: Bandung or Indonesia')), 'location')}
            {row(t('Tipe pekerjaan', 'Employment type'), select('type', jobTypes), 'type')}
            {row(t('Tingkat pengalaman', 'Experience level'), select('experienceLevel', experienceLevels), 'experienceLevel')}
            {row(t('Pengaturan kerja', 'Work arrangement'), select('arrangement', Object.fromEntries(workArrangements.map(value => [value, value]))), 'arrangement')}
            {row(t('Kisaran gaji', 'Salary range'), text('salary', t('Contoh: Rp5–7 juta per bulan', 'Example: Rp5–7 million per month')), 'salary', true)}
            {row(t('Tenggat lamaran', 'Application deadline'), <input id="job-deadline" type="date" className={companyInput}
              value={draft.deadline} onChange={event => update('deadline', event.target.value)} />, 'deadline', true)}
            {row(t(...jobDetailLabels.description), text('description', t('Jelaskan pekerjaan dan cara tim bekerja.', 'Describe the role and how the team works.'), 3), 'description')}
            {row(t(...jobDetailLabels.responsibilities), text('responsibilitiesText', t('Contoh: Membuat dan menguji prototipe.', 'Example: Build and test prototypes.'), 3, onePerLine), 'responsibilitiesText', true)}
            {row(t(...jobDetailLabels.requirements), text('requirementsText', t('Contoh: Portofolio desain yang relevan.', 'Example: A relevant design portfolio.'), 3, onePerLine), 'requirementsText')}
            {row(t(...jobDetailLabels.skills), text('skillsText', t('Contoh: Figma atau riset pengguna.', 'Example: Figma or user research.'), 2, onePerLine), 'skillsText', true)}
            {row(t(...jobDetailLabels.benefits), text('benefitsText', t('Contoh: Asuransi kesehatan atau jam kerja fleksibel.', 'Example: Health insurance or flexible hours.'), 3, onePerLine), 'benefitsText', true)}
            {row(t(...jobDetailLabels.accessibility), <fieldset aria-label={t(...jobDetailLabels.accessibility)} className="min-w-0">
              <p className="mb-3 text-xs leading-relaxed text-slate-600">{t('Pilih minimal satu dukungan untuk menerbitkan lowongan.', 'Select at least one support option before publishing.')}</p>
              <div className="grid gap-2 lg:grid-cols-2">
                {accessibilityOptions.map(option => <label key={option} className="flex min-h-10 items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-2 text-sm [overflow-wrap:anywhere]">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-700" checked={draft.accessibilityOptions.includes(option)}
                    onChange={event => update('accessibilityOptions', event.target.checked ? [...draft.accessibilityOptions, option] : draft.accessibilityOptions.filter(value => value !== option))} />
                  {option}
                </label>)}
              </div>
              <label htmlFor="job-accessibilityDetails" className="mb-1 mt-3 block text-xs font-semibold text-slate-800">{t('Cara dukungan diberikan (opsional)', 'How support is provided (optional)')}</label>
              {text('accessibilityDetails', t('Contoh: Pertanyaan wawancara diberikan secara tertulis.', 'Example: Interview questions are provided in writing.'), 3)}
            </fieldset>)}
            {row(t('Email kontak', 'Contact email'), text('contactEmail', 'rekrutmen@perusahaan.com', undefined, t('Digunakan pada tombol Kontak.', 'Used by the Contact button.')), 'contactEmail')}
            {row(t('Kategori lowongan', 'Job category'), <>{select('category', jobCategories)}<p className="mt-1 text-xs leading-relaxed text-slate-600">{t('Dipakai untuk mengelompokkan lowongan di katalog.', 'Used to group the job listing in the catalog.')}</p></>, 'category')}
          </tbody>
        </table>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2 border-t border-indigo-100 pt-4">
        <button type="button" disabled={busy} onClick={onCancel} className={companySecondary}>{t('Batal', 'Cancel')}</button>
        {(!job || job.status === 'draft') && <button type="submit" value="draft" disabled={busy} className={companySecondary}>{t('Simpan draf', 'Save draft')}</button>}
        {job?.status === 'closed' && <button type="submit" value="closed" disabled={busy} className={companySecondary}>{t('Simpan perubahan', 'Save changes')}</button>}
        <button type="submit" value="published" disabled={busy || !companyName} className={companyPrimary}>
          {busy ? t('Menyimpan…', 'Saving…') : job?.status === 'published' ? t('Simpan lowongan tayang', 'Save published job') : t('Terbitkan lowongan', 'Publish job')}
        </button>
      </div>
    </form>
  );
}
