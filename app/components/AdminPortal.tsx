'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowRight, BookOpen, Briefcase, Check, ChevronLeft, ChevronRight, ClipboardList, Cpu, Database, GitBranch, LayoutDashboard, LogOut, Minus, RefreshCw, Search, Server, ShieldCheck, User, Users } from 'lucide-react';
import { adminFilters, type AdminDiagnostics, type AdminOverview, type AdminRow, type AdminSection } from '../utils/admin';
import { applicantStatuses, applicantStatusesEnglish, type ApplicantStatus } from '../utils/recruitment';
import type { Profile } from '../utils/profile';
import { LanguageSwitch, useLanguage } from './Language';
import ProfilePage from './ProfilePage';
import { avatarUrl, ProfilePhoto } from './ProfilePhoto';
import SidebarAccount from './SidebarAccount';

const sections = [
  { id: 'overview', labels: ['Dasbor', 'Dashboard'], icon: LayoutDashboard },
  { id: 'jobs', labels: ['Lowongan', 'Job listings'], icon: Briefcase },
  { id: 'workshops', labels: ['Workshop', 'Workshops'], icon: BookOpen },
] as const;

const settings = [
  { id: 'accounts', labels: ['Akun pengguna', 'User accounts'], icon: Users },
  { id: 'roles', labels: ['Peran dan akses', 'Roles and access'], icon: ShieldCheck },
  { id: 'pipeline', labels: ['Tahapan lamaran', 'Application stages'], icon: GitBranch },
  { id: 'health', labels: ['Status sistem', 'System status'], icon: Activity },
] as const;

type View = (typeof sections | typeof settings)[number]['id'] | 'profile';
type AccountRole = typeof adminFilters.accounts[number];
const card = 'min-w-0 rounded-3xl border border-indigo-100 bg-white shadow-sm';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';
const buttonStyle = `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-45 ${focusRing}`;
const statusLabels: Record<string, [string, string]> = {
  jobseeker: ['Pencari kerja', 'Jobseeker'],
  company: ['Perusahaan', 'Employer'],
  admin: ['Admin', 'Admin'],
  published: ['Tayang', 'Live'],
  draft: ['Draf', 'Draft'],
  closed: ['Ditutup', 'Closed'],
};

function usePortalData<T>(url: string) {
  const [attempt, setAttempt] = useState(0);
  const key = `${url}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: number }>();

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) return { key, error: response.status };
        return { key, data: await response.json() as T };
      })
      .then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(() => { if (!controller.signal.aborted) setResult({ key, error: 500 }); });
    return () => controller.abort();
  }, [key, url]);

  return { result: result?.key === key ? result : undefined, retry: () => setAttempt(value => value + 1) };
}

function DataMessage({ error, retry }: { error?: number; retry: () => void }) {
  const { t } = useLanguage();
  if (!error) return <p role="status" className={`${card} p-5 text-sm text-slate-600`}>{t('Memuat data…', 'Loading data…')}</p>;
  return <div className={`${card} p-5`}>
    <p role="alert" className="text-sm text-rose-800">{error === 401 ? t('Sesi berakhir. Silakan masuk lagi.', 'Your session expired. Please sign in again.') :
      error === 403 ? t('Halaman ini khusus admin Lestari.', 'This page is for Lestari administrators.') :
      t('Data gagal dimuat. Silakan coba lagi.', 'Could not load the data. Please try again.')}</p>
    {error !== 401 && error !== 403 && <button type="button" onClick={retry} className={`${buttonStyle} mt-3`}>{t('Coba lagi', 'Try again')}</button>}
  </div>;
}

function Status({ status, section }: { status: string; section: AdminSection }) {
  const { t } = useLanguage();
  const labels = section === 'workshops' ? undefined : statusLabels[status];
  const color = status === 'published' ? 'bg-emerald-100 text-emerald-900' :
    status === 'draft' ? 'bg-amber-100 text-amber-900' :
    status === 'closed' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-50 text-indigo-900';
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{labels ? t(...labels) : status || '—'}</span>;
}

function Directory({ section, initialRole }: { section: AdminSection; initialRole: AccountRole | '' }) {
  const { t, locale } = useLanguage();
  const [input, setInput] = useState('');
  const [criteria, setCriteria] = useState({ search: '', status: String(initialRole), page: 1 });
  const { search, status, page } = criteria;
  const query = new URLSearchParams({ section, q: search, status, page: String(page) }).toString();
  const { result, retry } = usePortalData<{ items: AdminRow[]; hasMore: boolean }>('/api/admin?' + query);
  const name = section === 'accounts' ? t('Nama atau email', 'Name or email') :
    section === 'jobs' ? t('Judul atau perusahaan', 'Title or employer') : t('Judul atau instruktur', 'Title or instructor');
  const filterLabel = section === 'accounts' ? t('Peran', 'Role') : t('Status', 'Status');
  const countLabel = section === 'jobs' ? t('Lamaran', 'Applications') : t('Pendaftaran', 'Enrollments');
  const date = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });

  return <div className="space-y-4">
    <div className={`${card} flex flex-wrap items-end gap-4 p-4 sm:p-5`}>
      <form className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:flex-nowrap" onSubmit={event => {
        event.preventDefault();
        setCriteria(current => ({ ...current, search: input.trim(), page: 1 }));
      }}>
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-sm font-semibold text-slate-700">{name}</span>
          <input type="search" maxLength={100} value={input} onChange={event => {
            setInput(event.target.value);
            if (!event.target.value) setCriteria(current => ({ ...current, search: '', page: 1 }));
          }} className={`min-h-10 w-full rounded-xl border border-indigo-200 px-3 text-sm ${focusRing}`} />
        </label>
        <button type="submit" className={buttonStyle}><Search aria-hidden="true" className="h-4 w-4" />{t('Cari', 'Search')}</button>
      </form>
      {section !== 'workshops' && <label className="w-full sm:w-auto">
        <span className="mb-1 block text-sm font-semibold text-slate-700">{filterLabel}</span>
        <select value={status} onChange={event => setCriteria(current => ({ ...current, status: event.target.value, page: 1 }))}
          className={`min-h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 text-sm ${focusRing}`}>
          <option value="">{t('Semua', 'All')}</option>
          {adminFilters[section].map(value => <option key={value} value={value}>{t(...statusLabels[value])}</option>)}
        </select>
      </label>}
    </div>
    {result?.data ? <div className={card}>
      <ul className="divide-y divide-indigo-50">
        {result.data.items.map(item => <li key={item.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_10rem_8rem] sm:items-center sm:px-5">
          <div className="min-w-0 break-words">
            <p className="font-semibold text-slate-950">{item.title || (section === 'accounts' ? item.subtitle : '—')}</p>
            {item.title && item.subtitle && <p className="mt-0.5 text-sm text-slate-600">{item.subtitle}</p>}
          </div>
          <div><Status status={item.status} section={section} /></div>
          <div className="text-sm text-slate-600">
            {section === 'accounts' && item.date && <time dateTime={item.date}>{date.format(new Date(item.date))}</time>}
            {item.total !== undefined && <span>{countLabel} <strong className="text-slate-950">{item.total}</strong></span>}
          </div>
        </li>)}
      </ul>
      {!result.data.items.length && <p role="status" className="p-5 text-sm text-slate-600">{t('Tidak ada hasil. Coba kata kunci atau filter lain.', 'No results. Try another keyword or filter.')}</p>}
      {(page > 1 || result.data.hasMore) && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-indigo-100 px-4 py-3 sm:px-5">
        <p className="text-sm text-slate-600">{t('Halaman', 'Page')} {page}</p>
        <div className="flex gap-2">
          <button type="button" className={buttonStyle} disabled={page === 1} onClick={() => setCriteria(current => ({ ...current, page: current.page - 1 }))}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />{t('Sebelumnya', 'Previous')}
          </button>
          <button type="button" className={buttonStyle} disabled={!result.data.hasMore} onClick={() => setCriteria(current => ({ ...current, page: current.page + 1 }))}>
            {t('Berikutnya', 'Next')}<ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>}
    </div> : <DataMessage error={result?.error} retry={retry} />}
  </div>;
}

function Overview({ navigate }: { navigate: (view: View) => void }) {
  const { t, locale } = useLanguage();
  const { result, retry } = usePortalData<AdminOverview>('/api/admin?section=overview');
  const data = result?.data;
  const format = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB');
  const metrics = data && [
    { title: t('Akun pengguna', 'User accounts'), value: data.jobseekers + data.companies + data.admins, detail: t(`${format.format(data.companies)} akun perusahaan`, `${format.format(data.companies)} employer accounts`), icon: Users, color: 'bg-indigo-100 text-indigo-800', to: 'accounts' },
    { title: t('Lowongan tayang', 'Live job listings'), value: data.published, detail: t(`${format.format(data.drafts)} draf · ${format.format(data.closed)} ditutup`, `${format.format(data.drafts)} drafts · ${format.format(data.closed)} closed`), icon: Briefcase, color: 'bg-emerald-100 text-emerald-800', to: 'jobs' },
    { title: t('Total lamaran', 'Total applications'), value: data.applications, detail: t('Dari semua lowongan', 'Across all job listings'), icon: ClipboardList, color: 'bg-amber-100 text-amber-900', to: 'jobs' },
    { title: t('Workshop', 'Workshops'), value: data.workshops, detail: t(`${format.format(data.enrollments)} pendaftaran`, `${format.format(data.enrollments)} enrollments`), icon: BookOpen, color: 'bg-violet-100 text-violet-800', to: 'workshops' },
  ] as const;
  const roles = data && [
    { id: 'jobseeker', count: data.jobseekers, color: 'bg-indigo-600' },
    { id: 'company', count: data.companies, color: 'bg-violet-600' },
    { id: 'admin', count: data.admins, color: 'bg-blue-600' },
  ];
  const accountCount = data ? data.jobseekers + data.companies + data.admins : 0;

  return <div className="space-y-5">
    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 px-5 py-8 text-white shadow-md shadow-indigo-950/10 sm:px-8 sm:py-10">
      <div aria-hidden="true" className="absolute -bottom-36 -right-6 -z-10 h-80 w-80 rounded-full border-[36px] border-white/10 sm:right-8" />
      <div aria-hidden="true" className="absolute -bottom-24 right-6 -z-10 h-56 w-56 rounded-full border border-white/25 sm:right-20" />
      <h2 className="max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">{t('Pantau aktivitas Lestari', 'Monitor Lestari activity')}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-indigo-100 sm:text-base">{t('Lihat akun pengguna, lowongan, dan pendaftaran workshop dalam satu dasbor.', 'View accounts, job listings, and workshop enrollments in one dashboard.')}</p>
    </section>
    {data && metrics && roles ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ title, value, detail, icon: Icon, color, to }) => <button key={title} type="button" onClick={() => navigate(to)}
          className={`${card} ${focusRing} p-4 text-left hover:border-indigo-300 sm:p-5`}>
          <span className="flex items-center justify-between gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-indigo-700" />
          </span>
          <span className="mt-3 block text-sm font-semibold text-slate-700">{title}</span>
          <strong className="mt-0.5 block text-3xl tracking-tight text-slate-950">{format.format(value)}</strong>
          <span className="mt-1 block text-xs text-slate-600">{detail}</span>
        </button>)}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className={`${card} p-4 sm:p-5`}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-950">{t('Lowongan terbaru', 'Recent job listings')}</h2>
            <button type="button" className={buttonStyle} onClick={() => navigate('jobs')}>{t('Lihat semua', 'View all')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
          </div>
          {data.recentJobs.length ? <ul className="divide-y divide-indigo-50">
            {data.recentJobs.map(job => <li key={job.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0 break-words"><p className="text-sm font-semibold">{job.title || '—'}</p><p className="text-xs text-slate-600">{job.subtitle}</p></div>
              <div className="shrink-0"><Status status={job.status} section="jobs" /></div>
            </li>)}
          </ul> : <p className="py-3 text-sm text-slate-600">{t('Belum ada lowongan.', 'No job listings yet.')}</p>}
        </section>
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className="mb-4 text-lg font-bold text-slate-950">{t('Akun menurut peran', 'Accounts by role')}</h2>
          <ul className="space-y-4">
            {roles.map(({ id, count, color }) => <li key={id}>
              <div className="mb-1 flex justify-between gap-2 text-sm"><span>{t(...statusLabels[id])}</span><strong>{format.format(count)}</strong></div>
              <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-indigo-50">
                <div className={`h-full rounded-full ${color}`} style={{ width: accountCount ? `${100 * count / accountCount}%` : '0%' }} />
              </div>
            </li>)}
          </ul>
        </section>
      </div>
    </> : <DataMessage error={result?.error} retry={retry} />}
  </div>;
}

function RolesAndAccess({ showAccounts }: { showAccounts: (role: AccountRole) => void }) {
  const { t, locale } = useLanguage();
  const { result, retry } = usePortalData<AdminOverview>('/api/admin?section=overview');
  const data = result?.data;
  const counts = data && { jobseeker: data.jobseekers, company: data.companies, admin: data.admins };
  const number = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB');
  const roles = adminFilters.accounts;
  const permissions: { label: string; allowed: readonly AccountRole[] }[] = [
    { label: t('Edit profil sendiri', 'Edit own profile'), allowed: roles },
    { label: t('Kirim lamaran kerja', 'Apply for a job'), allowed: ['jobseeker'] },
    { label: t('Terbitkan lowongan perusahaan sendiri', 'Publish own company jobs'), allowed: ['company'] },
    { label: t('Tinjau pelamar dan ubah tahap untuk lowongan sendiri', 'Review applicants and update stages for own jobs'), allowed: ['company'] },
    { label: t('Lihat daftar akun pengguna Lestari', 'View the Lestari user directory'), allowed: ['admin'] },
    { label: t('Pantau tahapan lamaran lintas perusahaan', 'Monitor applications across employers'), allowed: ['admin'] },
  ];
  return <>
    <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{t('Bandingkan hak akses dan buka daftar akun per peran. Hak akses di halaman ini hanya untuk ditinjau.', 'Compare permissions and open the account list for each role. Permissions are read-only here.')}</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {roles.map(role => <div key={role} className={`${card} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold text-slate-700">{t(...statusLabels[role])}</h2>
        {counts && <p className="mt-1"><strong className="text-2xl text-indigo-950">{number.format(counts[role])}</strong> <span className="text-sm text-slate-600">{t('akun', 'accounts')}</span></p>}
        <button type="button" onClick={() => showAccounts(role)}
          aria-label={t(`Lihat akun ${statusLabels[role][0]}`, `View ${statusLabels[role][1]} accounts`)}
          className={`${buttonStyle} mt-3`}>
          {t('Lihat akun', 'View accounts')}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </button>
      </div>)}
    </div>
    {!counts && <DataMessage error={result?.error} retry={retry} />}
    <div className={`${card} overflow-hidden`}>
      <table className="w-full table-fixed text-sm">
        <caption className="px-4 py-4 text-left text-lg font-bold sm:px-5">{t('Perbandingan hak akses', 'Permissions comparison')}</caption>
        <colgroup><col className="w-[40%]" /><col span={3} /></colgroup>
        <thead className="bg-indigo-50 text-indigo-950">
          <tr>
            <th scope="col" className="p-2 text-left text-xs sm:p-4 sm:text-sm">{t('Fitur', 'Feature')}</th>
            {roles.map(role => <th key={role} scope="col" className="break-words px-1 py-2 text-xs sm:p-4 sm:text-sm">{t(...statusLabels[role])}</th>)}
          </tr>
        </thead>
        <tbody>
          {permissions.map(({ label, allowed }) => <tr key={label} className="border-t border-indigo-50">
            <th scope="row" className="break-words p-2 text-left text-xs font-medium text-slate-800 sm:p-4 sm:text-sm">{label}</th>
            {roles.map(role => {
              const canAccess = allowed.includes(role);
              const Icon = canAccess ? Check : Minus;
              return <td key={role} className="px-1 py-2 text-center">
                <Icon aria-hidden="true" className={`mx-auto h-4 w-4 ${canAccess ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span className="sr-only">{canAccess ? t('Diizinkan', 'Allowed') : t('Tanpa akses', 'No access')}</span>
              </td>;
            })}
          </tr>)}
        </tbody>
      </table>
      <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-indigo-50 p-3 text-xs text-slate-600 sm:px-5">
        <span className="inline-flex items-center gap-1"><Check aria-hidden="true" className="h-4 w-4 text-emerald-700" />{t('Diizinkan', 'Allowed')}</span>
        <span className="inline-flex items-center gap-1"><Minus aria-hidden="true" className="h-4 w-4 text-slate-500" />{t('Tanpa akses', 'No access')}</span>
      </p>
    </div>
  </>;
}

function ApplicationStages() {
  const { t, locale } = useLanguage();
  const { result, retry } = usePortalData<{ counts: Partial<Record<ApplicantStatus, number>> }>('/api/admin?section=pipeline');
  const counts = result?.data?.counts;
  const stages = Object.keys(applicantStatuses) as ApplicantStatus[];
  const format = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB');
  return <>
    <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{t('Lihat jumlah lamaran pada setiap tahap yang digunakan perusahaan untuk meninjau kandidat.', 'See how many applications are at each stage employers use to review candidates.')}</p>
    {counts ? <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {stages.map(stage => <div key={stage} className={`${card} p-5`}>
        <dt className="text-sm font-semibold text-slate-600">{t(applicantStatuses[stage], applicantStatusesEnglish[stage])}</dt>
        <dd className="mt-2 text-3xl font-extrabold text-indigo-950">{format.format(counts[stage] ?? 0)}</dd>
      </div>)}
    </dl> : <DataMessage error={result?.error} retry={retry} />}
  </>;
}

function SystemStatus() {
  const { t, locale } = useLanguage();
  const { result, retry } = usePortalData<AdminDiagnostics>('/api/admin?section=diagnostics');
  const data = result?.data;
  const language = locale === 'id' ? 'id-ID' : 'en-GB';
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
  const time = new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta' });
  const formatBytes = (bytes: number) => bytes >= 1024 ** 3
    ? `${number.format(bytes / 1024 ** 3)} GiB`
    : `${number.format(bytes / 1024 ** 2)} MiB`;
  const entities: [keyof AdminDiagnostics['records'], string][] = [
    ['users', t('Akun pengguna', 'User accounts')],
    ['profiles', t('Profil pengguna', 'User profiles')],
    ['photos', t('Foto profil', 'Profile photos')],
    ['jobs', t('Lowongan', 'Job listings')],
    ['applications', t('Lamaran kerja', 'Job applications')],
    ['workshops', t('Workshop', 'Workshops')],
    ['enrollments', t('Pendaftaran workshop', 'Workshop enrollments')],
    ['savedJobs', t('Lowongan tersimpan', 'Saved jobs')],
    ['savedWorkshops', t('Workshop tersimpan', 'Saved workshops')],
  ];

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-slate-600">{t('Pantau koneksi database, jumlah data, dan proses aplikasi Lestari.', 'Monitor the database connection, record counts, and the Lestari application process.')}</p>
        {data && <p role="status" className="mt-1 text-xs text-slate-600">{t('Pemeriksaan terakhir', 'Last checked')} <time dateTime={data.checkedAt}>{time.format(new Date(data.checkedAt))} WIB</time></p>}
      </div>
      <button type="button" className={buttonStyle} disabled={!result} onClick={retry}>
        <RefreshCw aria-hidden="true" className="h-4 w-4" />{t('Periksa ulang', 'Check again')}
      </button>
    </div>
    {data ? <>
      <div className="grid gap-4 md:grid-cols-3">
        <section className={`${card} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Activity aria-hidden="true" className="h-4 w-4 text-indigo-700" />PostgreSQL</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">{t('Terhubung', 'Connected')}</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums">{number.format(data.database.latencyMs)} ms</p>
          <p className="mt-1 text-xs text-slate-600">{t('Waktu respons kueri uji dari backend', 'Backend test query response time')}</p>
        </section>
        <section className={`${card} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-bold"><Database aria-hidden="true" className="h-4 w-4 text-indigo-700" />{t('Ukuran database', 'Database size')}</h2>
          <p className="mt-3 text-2xl font-extrabold tabular-nums">{formatBytes(data.database.sizeBytes)}</p>
          <p className="mt-1 text-xs text-slate-600">{t('Penyimpanan PostgreSQL, termasuk indeks', 'PostgreSQL storage, including indexes')}</p>
        </section>
        <section className={`${card} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-bold"><Cpu aria-hidden="true" className="h-4 w-4 text-indigo-700" />{t('Memori Node.js', 'Node.js memory')}</h2>
          <p className="mt-3 text-2xl font-extrabold tabular-nums">{formatBytes(data.runtime.heapBytes)}</p>
          <p className="mt-1 text-xs text-slate-600">{t('Heap terpakai', 'Heap used')} · RSS {formatBytes(data.runtime.rssBytes)}</p>
        </section>
      </div>
      <div className={`${card} overflow-hidden`}>
        <table className="w-full text-sm">
          <caption className="px-4 py-4 text-left text-lg font-bold sm:px-5">{t('Jumlah data per kategori', 'Records by category')}</caption>
          <thead className="bg-indigo-50 text-indigo-950">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left sm:px-5">{t('Kategori', 'Category')}</th>
              <th scope="col" className="px-4 py-2.5 text-right sm:px-5">{t('Jumlah', 'Count')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-50">
            {entities.map(([id, label]) => <tr key={id}>
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-700 sm:px-5">{label}</th>
              <td className="px-4 py-2.5 text-right tabular-nums sm:px-5">{number.format(data.records[id])}</td>
            </tr>)}
          </tbody>
          <tfoot className="border-t border-indigo-100 bg-indigo-50/60 font-bold">
            <tr>
              <th scope="row" className="px-4 py-3 text-left sm:px-5">{t('Total kategori di atas', 'Total across these categories')}</th>
              <td className="px-4 py-3 text-right tabular-nums sm:px-5">{number.format(entities.reduce((sum, [id]) => sum + data.records[id], 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className={`${card} p-5`}>
          <h2 className="flex items-center gap-2 font-bold"><Server aria-hidden="true" className="h-4 w-4 text-indigo-700" />{t('Proses aplikasi', 'Application process')}</h2>
          <dl className="mt-2 divide-y divide-indigo-50 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"><dt className="text-slate-600">{t('Versi Node.js', 'Node.js version')}</dt><dd className="font-medium">{data.runtime.version}</dd></div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"><dt className="text-slate-600">{t('Platform dan arsitektur', 'Platform and architecture')}</dt><dd className="font-medium">{data.runtime.platform} ({data.runtime.architecture})</dd></div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"><dt className="text-slate-600">{t('Mode aplikasi', 'Application mode')}</dt><dd className="font-medium">{data.runtime.mode}</dd></div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"><dt className="text-slate-600">{t('Waktu proses berjalan', 'Process uptime')}</dt><dd className="font-medium">{t(`${number.format(data.runtime.uptimeSeconds / 60)} menit`, `${number.format(data.runtime.uptimeSeconds / 60)} minutes`)}</dd></div>
          </dl>
        </section>
        <section className={`${card} p-5`}>
          <h2 className="flex items-center gap-2 font-bold"><Database aria-hidden="true" className="h-4 w-4 text-indigo-700" />{t('Database dan skema', 'Database and schema')}</h2>
          <dl className="mt-2 divide-y divide-indigo-50 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"><dt className="text-slate-600">{t('Versi PostgreSQL', 'PostgreSQL version')}</dt><dd className="font-medium">{data.database.version}</dd></div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"><dt className="text-slate-600">{t('Migrasi tercatat', 'Recorded migrations')}</dt><dd className="font-medium">{number.format(data.database.migrations)}</dd></div>
          </dl>
        </section>
      </div>
    </> : <DataMessage error={result?.error} retry={retry} />}
  </>;
}

function AdminAccount({ profile, view, navigate, logout }: {
  profile?: Profile;
  view: View;
  navigate: (view: View) => void;
  logout: () => void;
}) {
  const { t } = useLanguage();
  const name = profile?.displayName || t('Akun admin', 'Admin account');
  const initials = profile?.displayName.trim().split(/\s+/).slice(0, 2)
    .map(word => Array.from(word)[0]).join('').toUpperCase() || 'A';
  const links = [
    { id: 'profile', label: t('Profil Saya', 'My Profile'), icon: User },
    { id: 'accounts', label: t('Akun Pengguna', 'User Accounts'), icon: Users },
  ] as const;
  const actionStyle = `flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 text-left text-sm font-semibold ${focusRing}`;

  return <SidebarAccount className="lg:mt-auto" summary={<>
    <ProfilePhoto src={avatarUrl(profile?.avatarVersion ?? null)} initials={initials} label="" className="h-9 w-9 bg-indigo-100 text-indigo-800" />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-bold">{name}</span>
      <span className="block text-xs text-slate-600">{t('Admin Lestari', 'Lestari Admin')}</span>
    </span>
  </>}>
    {close => <>
      <div className="mb-1 border-b border-indigo-100 px-2.5 pb-3 pt-2">
        <p className="break-words text-sm font-bold text-indigo-950">{name}</p>
        {profile?.email && <p className="mt-0.5 text-xs text-slate-600 [overflow-wrap:anywhere]">{profile.email}</p>}
      </div>
      {links.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={view === id ? 'page' : undefined}
        className={`${actionStyle} text-indigo-950 ${view === id ? 'bg-indigo-50' : 'hover:bg-indigo-50'}`}
        onClick={() => { close(); navigate(id); }}>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{label}
      </button>)}
      <div className="mt-1 border-t border-indigo-100 pt-1">
        <button type="button" className={`${actionStyle} text-rose-800 hover:bg-rose-50`} onClick={() => { close(); logout(); }}>
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />{t('Keluar Akun', 'Sign Out')}
        </button>
      </div>
    </>}
  </SidebarAccount>;
}

export default function AdminPortal({ logout, authError }: { logout: () => void; authError: string }) {
  const { t } = useLanguage();
  const [view, setView] = useState<View>('overview');
  const [initialRole, setInitialRole] = useState<AccountRole | ''>('');
  const heading = useRef<HTMLHeadingElement>(null);
  const { result: identity, retry: refreshIdentity } = usePortalData<Profile>('/api/profile');

  function navigate(next: View, role: AccountRole | '' = '') {
    setInitialRole(role);
    setView(next);
    window.scrollTo(0, 0);
  }

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [view]);

  const section = [...sections, ...settings].find(item => item.id === view);
  const title = view === 'overview' ? t('Dasbor Admin', 'Admin Dashboard') : section ? t(section.labels[0], section.labels[1]) : t('Profil saya', 'My profile');
  let content: ReactNode;
  if (view === 'profile') content = <ProfilePage onProfileChange={refreshIdentity} />;
  else content = <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7 sm:py-8">
    <h1 ref={heading} tabIndex={-1} className="text-3xl font-extrabold tracking-tight outline-none sm:text-4xl">{title}</h1>
    {view === 'overview' ? <Overview navigate={navigate} /> :
      view === 'roles' ? <RolesAndAccess showAccounts={role => navigate('accounts', role)} /> :
      view === 'pipeline' ? <ApplicationStages /> :
      view === 'health' ? <SystemStatus /> : <Directory key={view + initialRole} section={view} initialRole={initialRole} />}
  </main>;

  return <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-[#fafaff] to-violet-50 text-slate-950 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
    <aside className="flex flex-col gap-3 border-b border-indigo-100 bg-white p-3 lg:sticky lg:top-0 lg:z-30 lg:h-dvh lg:gap-6 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
      <div className="flex items-center gap-2.5 px-1">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white"><ShieldCheck aria-hidden="true" className="h-5 w-5" /></span>
        <span><strong className="block text-xl tracking-tight text-indigo-950">Lestari</strong><span className="block text-xs text-slate-600">{t('Portal Admin', 'Admin Portal')}</span></span>
      </div>
      <nav aria-label={t('Menu admin', 'Admin navigation')} className="space-y-3 lg:space-y-5">
        {([sections, settings] as const).map((items, index) => <div key={items[0].id} className={index ? 'border-t border-indigo-100 pt-3' : undefined}>
          {index === 1 && <h2 className="mb-1.5 px-2.5 text-xs font-bold uppercase tracking-wide text-slate-600">{t('Pengaturan', 'Settings')}</h2>}
          <ul className="flex flex-wrap gap-1 lg:grid">
            {items.map(({ id, labels, icon: Icon }) => <li key={id}>
              <button type="button" onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined}
                className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-sm font-semibold lg:min-h-11 lg:px-3 ${focusRing} ${view === id ? 'bg-indigo-100 text-indigo-950' : 'text-slate-700 hover:bg-indigo-50'}`}>
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{t(labels[0], labels[1])}
              </button>
            </li>)}
          </ul>
        </div>)}
      </nav>
      <AdminAccount profile={identity?.data} view={view} navigate={navigate} logout={logout} />
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-7">
          <span className="text-sm font-semibold text-slate-700">{title}</span><LanguageSwitch />
        </div>
      </header>
      {authError && <p role="alert" className="mx-auto max-w-7xl px-4 py-3 text-sm text-rose-800 sm:px-7">{authError}</p>}
      {content}
    </div>
  </div>;
}
