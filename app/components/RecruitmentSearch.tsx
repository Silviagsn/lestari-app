'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Briefcase, Search, Users, X } from 'lucide-react';
import { useLanguage } from './Language';
import type { CompanyApplicant, CompanyJob, RecruitmentData } from '../utils/recruitment';

export default function RecruitmentSearch({ data, busy, openJob, openApplicant }: {
  data: RecruitmentData | null;
  busy: boolean;
  openJob: (job: CompanyJob) => void;
  openApplicant: (applicant: CompanyApplicant) => void;
}) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');

  function show() {
    if (!dialog.current?.open) dialog.current?.showModal();
    field.current?.focus();
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (busy || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      if (document.querySelector('dialog[open]') && !dialog.current?.open) return;
      event.preventDefault();
      show();
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, [busy]);

  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = (...values: string[]) => terms.every(term => values.join(' ').toLocaleLowerCase().includes(term));
  const jobs = terms.length ? data?.jobs.filter(job => matches(job.title, job.location)).slice(0, 6) ?? [] : [];
  const titles = new Map(data?.jobs.map(job => [job.id, job.title]));
  const applicants = terms.length ? data?.applicants.filter(applicant => matches(applicant.name, applicant.email, titles.get(applicant.jobId) ?? '')).slice(0, 6) ?? [] : [];
  const resultStyle = 'flex w-full min-w-0 items-center gap-3 rounded-xl border border-indigo-100 px-3 py-2.5 text-left text-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700';

  return <>
    <button ref={trigger} type="button" onClick={show} disabled={busy} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K"
      className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-2.5 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 disabled:opacity-60 sm:px-3">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="sm:hidden">{t('Cari', 'Search')}</span><span className="hidden sm:inline">{t('Cari lowongan atau pelamar', 'Find jobs or applicants')}</span>
    </button>
    <dialog ref={dialog} aria-labelledby="recruitment-search-title" onClose={() => { setQuery(''); if (!document.activeElement || document.activeElement === document.body) trigger.current?.focus(); }}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          dialog.current?.close();
        }
      }}
      className="m-auto max-h-[80dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-indigo-100 bg-white shadow-2xl backdrop:bg-slate-950/45">
      <div className="space-y-4 p-4 sm:p-6">
        <header className="flex items-center justify-between gap-2">
          <h2 id="recruitment-search-title" className="text-lg font-bold text-slate-950">{t('Cari di portal perusahaan', 'Search the employer portal')}</h2>
          <button type="button" aria-label={t('Tutup pencarian', 'Close search')} onClick={() => dialog.current?.close()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-900 hover:bg-indigo-100"><X aria-hidden="true" className="h-5 w-5" /></button>
        </header>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">{t('Judul, lokasi, atau nama pelamar', 'Job title, location, or applicant name')}
          <input ref={field} type="search" value={query} maxLength={160} onChange={event => setQuery(event.target.value)}
            className="w-full rounded-xl border border-indigo-200 p-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700" />
        </label>
        {!data && <p role="status" className="text-sm text-slate-600">{t('Data rekrutmen belum tersedia.', 'Recruitment data is not available yet.')}</p>}
        {!!terms.length && data && !jobs.length && !applicants.length && <p role="status" className="text-sm text-slate-600">{t('Tidak ada hasil. Coba kata kunci lain.', 'No results. Try another search.')}</p>}
        {!!jobs.length && <section aria-label={t('Hasil lowongan', 'Job results')} className="grid gap-2">
          <h3 className="text-xs font-bold uppercase text-indigo-800">{t('Lowongan', 'Jobs')}</h3>
          {jobs.map(job => <button key={job.id} type="button" className={resultStyle} onClick={() => { dialog.current?.close(); openJob(job); }}>
            <Briefcase aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-700" /><span className="min-w-0 flex-1 break-words font-semibold">{job.title}{job.location && <span className="block text-xs font-normal text-slate-600">{job.location}</span>}</span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-700" />
          </button>)}
        </section>}
        {!!applicants.length && <section aria-label={t('Hasil pelamar', 'Applicant results')} className="grid gap-2">
          <h3 className="text-xs font-bold uppercase text-indigo-800">{t('Pelamar', 'Applicants')}</h3>
          {applicants.map(applicant => <button key={`${applicant.jobId}-${applicant.applicantId}`} type="button" className={resultStyle} onClick={() => { dialog.current?.close(); openApplicant(applicant); }}>
            <Users aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-700" /><span className="min-w-0 flex-1 break-words font-semibold">{applicant.name}<span className="block text-xs font-normal text-slate-600">{titles.get(applicant.jobId)}</span></span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-700" />
          </button>)}
        </section>}
      </div>
    </dialog>
  </>;
}
