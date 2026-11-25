'use client';

import { useState } from 'react';
import { Bookmark, Briefcase, GraduationCap } from 'lucide-react';
import { applicantStatuses, applicantStatusesEnglish, type ApplicantStatus } from '../utils/recruitment';
import { useCatalog } from '../utils/useCatalog';
import { useLanguage } from './Language';

type Item = { id: number; title: string };
type Application = { jobId: number; title: string; appliedDate: string; status: ApplicantStatus };
type Enrollment = { workshopId: number; enrolledDate: string; status: keyof typeof enrollmentLabels };
const enrollmentLabels = {
  enrolled: ['Terdaftar', 'Enrolled'],
  'in-progress': ['Sedang berlangsung', 'In progress'],
  completed: ['Selesai', 'Completed'],
  paused: ['Dijeda', 'Paused'],
} as const;
const tabs = [
  { id: 'jobs', label: ['Lamaran', 'Applications'], icon: Briefcase },
  { id: 'workshops', label: ['Workshop diikuti', 'My workshops'], icon: GraduationCap },
  { id: 'saved', label: ['Tersimpan', 'Saved'], icon: Bookmark },
] as const;
const pageSize = 5;
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700';

export default function ProfileActivity() {
  const { t, locale } = useLanguage();
  const [view, setView] = useState<typeof tabs[number]['id']>('jobs');
  const [limit, setLimit] = useState(pageSize);
  const jobs = useCatalog<Item, Application>('jobs', entry => entry.jobId);
  const workshops = useCatalog<Item, Enrollment>('workshops', entry => entry.workshopId);
  const date = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });
  const formatDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : date.format(parsed);
  };
  const workshopNames = new Map(workshops.data?.items.map(item => [item.id, item.title]));
  const savedItems = (catalog: typeof jobs | typeof workshops, prefix: string, detail: string, fallback: string) => {
    const names = new Map(catalog.data?.items.map(item => [item.id, item.title]));
    return (catalog.data?.savedIds ?? []).map(id => ({ id: prefix + id, title: names.get(id) ?? fallback, detail, status: '' }));
  };
  const lists = {
    jobs: (jobs.data?.activity ?? []).map(item => ({
      id: 'job-' + item.jobId,
      title: item.title || t('Lowongan kerja', 'Job listing'),
      detail: formatDate(item.appliedDate),
      status: t(applicantStatuses[item.status], applicantStatusesEnglish[item.status]),
    })),
    workshops: (workshops.data?.activity ?? []).map(item => ({
      id: 'workshop-' + item.workshopId,
      title: workshopNames.get(item.workshopId) ?? t('Workshop', 'Workshop'),
      detail: formatDate(item.enrolledDate),
      status: t(enrollmentLabels[item.status][0], enrollmentLabels[item.status][1]),
    })),
    saved: [
      ...savedItems(jobs, 'job-', t('Lowongan kerja', 'Job listing'), t('Lowongan sudah tidak tayang', 'Job listing is no longer live')),
      ...savedItems(workshops, 'workshop-', t('Workshop', 'Workshop'), t('Workshop tidak tersedia', 'Workshop unavailable')),
    ],
  };
  const loading = { jobs: jobs.loading, workshops: workshops.loading, saved: jobs.loading || workshops.loading };
  const failure = { jobs: jobs.error, workshops: workshops.error, saved: jobs.error || workshops.error };
  const empty = {
    jobs: t('Belum ada lamaran kerja.', 'You have no job applications yet.'),
    workshops: t('Belum ada workshop yang diikuti.', 'You have not joined any workshops yet.'),
    saved: t('Belum ada lowongan atau workshop tersimpan.', 'You have no saved jobs or workshops yet.'),
  };
  const rows = lists[view];
  const Icon = tabs.find(tab => tab.id === view)?.icon ?? Briefcase;

  return <section className="min-w-0 rounded-[1.75rem] border border-indigo-100 bg-white p-4 shadow-sm sm:p-6">
    <h2 className="mb-4 text-lg font-extrabold tracking-tight text-slate-950">{t('Aktivitas saya', 'My activity')}</h2>
    <div role="group" aria-label={t('Jenis aktivitas', 'Activity type')} className="flex flex-wrap gap-2">
      {tabs.map(({ id, label, icon: TabIcon }) => <button key={id} type="button" aria-pressed={view === id}
        onClick={() => { setView(id); setLimit(pageSize); }}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold sm:text-sm ${focusRing} ${view === id ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-950 hover:bg-indigo-100'}`}>
        <TabIcon aria-hidden="true" className="h-4 w-4 shrink-0" />{t(label[0], label[1])}
        {!loading[id] && !failure[id] && <span className="tabular-nums opacity-90">{lists[id].length}</span>}
      </button>)}
    </div>
    {loading[view] ? <p role="status" className="mt-4 text-sm text-slate-600">{t('Memuat aktivitas…', 'Loading activity…')}</p> :
      failure[view] ? <p role="alert" className="mt-4 text-sm text-rose-800">{t('Aktivitas gagal dimuat. Buka ulang profil untuk mencoba lagi.', 'Could not load activity. Reopen your profile to try again.')}</p> :
      rows.length ? <>
        <ul className="mt-4 divide-y divide-indigo-50">
          {rows.slice(0, limit).map(item => <li key={item.id} className="flex flex-wrap items-center gap-2 py-3 sm:flex-nowrap sm:gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-800"><Icon aria-hidden="true" className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1 break-words">
              <p className="text-sm font-bold text-slate-950">{item.title}</p>
              {item.detail && <p className="mt-0.5 text-xs text-slate-600">{item.detail}</p>}
            </div>
            {item.status && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-900">{item.status}</span>}
          </li>)}
        </ul>
        {rows.length > limit && <button type="button" className={`mt-2 rounded-lg px-2 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50 ${focusRing}`}
          onClick={() => setLimit(current => current + pageSize)}>{t('Tampilkan lebih banyak', 'Show more')}</button>}
      </> : <p role="status" className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">{empty[view]}</p>}
  </section>;
}
