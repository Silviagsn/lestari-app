'use client';

import { LanguageSwitch, useLanguage } from './Language';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Accessibility, ArrowLeft, ArrowRight, Briefcase, Building2, ClipboardList, EarOff, LayoutDashboard, LogOut, Plus, Users } from 'lucide-react';
import CompanyJobForm, { companyCard, companyInput, companyPrimary, companySecondary } from './CompanyJobForm';
import ProfilePage from './ProfilePage';
import { accessibilityOptions, applicantStatuses, jobTypes, listingStatuses, type ApplicantStatus, type CompanyApplicant, type CompanyJob, type ListingStatus, type RecruitmentData } from '../utils/recruitment';

const companyNavigation = (t: (id: string, en: string) => string) => [
  { id: 'overview', title: t("Dasbor", "Dashboard"), icon: LayoutDashboard },
  { id: 'jobs', title: t("Lowongan", "Jobs"), icon: Briefcase },
  { id: 'editor', title: t("Buat lowongan", "Create job"), icon: Plus },
  { id: 'applicants', title: t("Pelamar", "Applicants"), icon: Users },
  { id: 'profile', title: t("Profil Perusahaan", "Company Profile"), icon: Building2 },
] as const;
type View = ReturnType<typeof companyNavigation>[number]['id'];
const compactDate = (value: string) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
const listingState = (job: CompanyJob): ListingStatus => job.status === 'published' && job.expired ? 'closed' : job.status;
const applicationCommunication: Record<string, string> = {
  email: 'Email', text: 'Pesan teks', 'video-asl': 'Panggilan video dengan juru bahasa isyarat', 'written-chat': 'Chat tertulis',
};

function ListingBadge({ job }: { job: CompanyJob }) {
  const { t } = useLanguage();
  const status = listingState(job);
  const styles = { draft: 'bg-amber-100 text-amber-900', published: 'bg-emerald-100 text-emerald-900', closed: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
    {job.status === 'published' && job.expired ? t("Berakhir", "Expired") : listingStatuses[status]}
  </span>;
}

function Listings({ jobs, openEditor, openApplicants, closeJob, busy }: {
  jobs: CompanyJob[]; openEditor: (job: CompanyJob) => void; openApplicants: (id: number) => void;
  closeJob?: (id: number) => void; busy: boolean;
}) {
  const { t } = useLanguage();
  return jobs.length ? (
    <ul className="divide-y divide-slate-100">
      {jobs.map(job => (
        <li key={job.id} className="grid gap-3 py-4 first:pt-1 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="break-words font-bold text-slate-950">{job.title}</p>
            <p className="mt-1 break-words text-sm text-slate-600">
              {jobTypes[job.type as keyof typeof jobTypes]} · {job.location || t("Lokasi belum diisi", "Location missing")} · {compactDate(job.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ListingBadge job={job} />
            <button type="button" onClick={() => openApplicants(job.id)} className="min-h-9 rounded-lg px-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50">
              {job.applicants} {t("pelamar", "applicants")}
            </button>
            <button type="button" onClick={() => openEditor(job)} className="min-h-9 rounded-lg border border-violet-200 px-3 text-sm font-semibold text-indigo-900 hover:bg-indigo-50">{t("Edit", "Edit")}</button>
            {closeJob && job.status === 'published' && (
              <button type="button" disabled={busy} onClick={() => closeJob(job.id)} className="min-h-9 rounded-lg px-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60">{t("Tutup", "Close")}</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  ) : <p className="py-5 text-sm text-slate-600">{t("Belum ada lowongan di tampilan ini.", "There are no jobs in this view yet.")}</p>;
}

function ApplicantCard({ applicant, jobTitle, busy, update }: {
  applicant: CompanyApplicant; jobTitle: string; busy: boolean; update: (status: ApplicantStatus) => void;
}) {
  const { t } = useLanguage();
  return (
    <details className={`${companyCard} group`}>
      <summary className="cursor-pointer rounded-lg marker:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">
        <span className="ml-1 inline-block break-words text-base font-bold">{applicant.name}</span>
        <span className="ml-2 inline-block rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-indigo-900">{applicantStatuses[applicant.status]}</span>
        <span className="mt-1 block break-words text-sm text-slate-600">{jobTitle} · {compactDate(applicant.appliedAt)}</span>
      </summary>
      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-bold">{t("Kontak", "Contact")}</dt><dd className="break-all"><a className="text-indigo-800 underline" href={`mailto:${encodeURIComponent(applicant.email)}`}>{applicant.email}</a></dd>{applicant.phone && <dd>{applicant.phone}</dd>}</div>
          <div><dt className="font-bold">{t("Preferensi komunikasi", "Communication preference")}</dt><dd>{applicationCommunication[applicant.communicationPreference]}</dd></div>
          {applicant.availabilityDate && <div><dt className="font-bold">{t("Bisa mulai", "Available from")}</dt><dd>{compactDate(applicant.availabilityDate)}</dd></div>}
          {applicant.salaryExpectation && <div><dt className="font-bold">{t("Ekspektasi gaji", "Salary expectations")}</dt><dd className="break-words">{applicant.salaryExpectation}</dd></div>}
          {applicant.coverLetter && <div className="sm:col-span-2"><dt className="font-bold">{t("Surat lamaran", "Cover letter")}</dt><dd className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{applicant.coverLetter}</dd></div>}
        </dl>
        <label className="grid max-w-xs gap-1.5 text-sm font-bold text-slate-900">
          {t("Status lamaran", "Application status")}
          <select disabled={busy} value={applicant.status} onChange={event => update(event.target.value as ApplicantStatus)} className={companyInput}>
            {Object.entries(applicantStatuses).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
          </select>
        </label>
      </div>
    </details>
  );
}

export default function CompanyPortal({ logout, authError }: { logout: () => void; authError: string }) {
  const { t } = useLanguage();
  const navigation = companyNavigation(t);
  const [data, setData] = useState<RecruitmentData | null>(null);
  const [view, setView] = useState<View>('overview');
  const [editing, setEditing] = useState<CompanyJob>();
  const [listingFilter, setListingFilter] = useState<ListingStatus | 'all'>('all');
  const [applicantFilter, setApplicantFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch('/api/company', { signal });
    if (!response.ok) throw new Error('Data rekrutmen gagal dimuat. Coba lagi.');
    setData(await response.json());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((failure: Error) => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [view]);

  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error]);

  function navigate(next: View) {
    if (busy || next === view) return;
    if (next === 'editor') setEditing(undefined);
    if (next === 'applicants') setApplicantFilter('all');
    setView(next);
    if (data) setError('');
    setNotice('');
    if (view === 'profile') load().catch((failure: Error) => setError(failure.message));
  }

  function openEditor(job?: CompanyJob) {
    if (busy) return;
    setEditing(job);
    setView('editor');
    if (data) setError('');
    setNotice('');
  }

  function openApplicants(id: number) {
    if (busy) return;
    setApplicantFilter(String(id));
    setView('applicants');
    setError('');
    setNotice('');
  }

  async function mutate(payload: object, message: string, next?: View) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/company', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? 'Perubahan gagal disimpan.');
      if (next) {
        setView(next);
        setListingFilter('all');
      }
      setNotice(message);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Perubahan gagal disimpan.');
    } finally {
      setBusy(false);
    }
  }

  const activeJobs = data?.jobs.filter(job => listingState(job) === 'published') ?? [];
  const drafts = data?.jobs.filter(job => job.status === 'draft').length ?? 0;
  const newApplicants = data?.applicants.filter(item => item.status === 'applied').length ?? 0;
  const title = view === 'editor' ? editing ? t("Edit lowongan", "Edit job") : t("Buat lowongan", "Create job") :
    view === 'jobs' ? t("Lowongan Saya", "My jobs") : view === 'applicants' ? t("Pelamar", "Applicants") : t("Dasbor Rekrutmen", "Recruitment Dashboard");
  const jobs = data?.jobs.filter(job => listingFilter === 'all' || listingState(job) === listingFilter) ?? [];
  const applicants = data?.applicants.filter(item => applicantFilter === 'all' || String(item.jobId) === applicantFilter) ?? [];

  return (
    <div className="min-h-screen bg-[#f1f1fa] text-slate-950 lg:grid lg:grid-cols-[15.25rem_minmax(0,1fr)]">
      <aside className="bg-[#211746] px-4 pb-3 pt-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-4 lg:py-7">
        <div className="mb-4 flex items-center justify-between gap-3 px-1 lg:mb-8">
          <button type="button" onClick={() => navigate('overview')} className="flex items-center gap-2 rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600"><EarOff className="h-5 w-5" aria-hidden="true" /></span>
            <span><span className="block text-xl font-extrabold tracking-tight">Lestari</span><span className="block text-xs text-violet-200">{t("Portal Perusahaan", "Employer Portal")}</span></span>
          </button>
          <button type="button" onClick={logout} className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-800 lg:hidden">
            <LogOut aria-hidden="true" className="h-4 w-4" /> {t("Keluar", "Sign out")}
          </button>
        </div>
        <div className="mb-3 lg:mb-5"><LanguageSwitch /></div>
        <nav aria-label={t('Menu perusahaan', 'Employer navigation')} className="flex flex-wrap gap-1 text-sm lg:grid lg:gap-2">
          {navigation.map(({ id, title, icon: Icon }) => (
            <button key={id} type="button" aria-current={view === id ? 'page' : undefined}
              onClick={() => id === 'editor' ? openEditor() : navigate(id)}
              className={`flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-left font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:min-h-11 lg:px-3 ${view === id ? 'bg-violet-700 text-white' : 'text-violet-100 hover:bg-violet-900'}`}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{title}
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden rounded-2xl border border-white/15 bg-white/5 p-3 lg:block">
          <p className="break-words text-sm font-semibold">{data?.companyName || t("Akun perusahaan", "Employer account")}</p>
          <button type="button" className="mt-2 flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-violet-200 hover:text-white" onClick={logout}>
            <LogOut aria-hidden="true" className="h-4 w-4" /> {t("Keluar akun", "Sign out")}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {view === 'profile' ? <ProfilePage /> : (
          <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7 sm:py-8">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                {view === 'editor' && <button type="button" onClick={() => navigate('jobs')} className="mb-2 flex items-center gap-1.5 text-sm font-bold text-indigo-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("Kembali ke lowongan", "Back to jobs")}</button>}
                <h1 ref={heading} tabIndex={-1} className="text-3xl font-extrabold tracking-tight outline-none sm:text-4xl">{title}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {view === 'overview' ? t("Pantau lowongan dan tindak lanjuti lamaran dari satu tempat.", "Track job listings and follow up on applications in one place.") : view === 'editor' ? t("Jelaskan pekerjaan dan dukungan yang tersedia bagi kandidat.", "Describe the role and the support available to candidates.") : view === 'jobs' ? t("Kelola draf, lowongan tayang, dan lowongan yang ditutup.", "Manage draft, published, and closed job listings.") : t("Buka lamaran dan perbarui tahap rekrutmen.", "Review applications and update the recruitment stage.")}
                </p>
              </div>
              {view !== 'editor' && <button type="button" className={companyPrimary} onClick={() => openEditor()}><Plus className="h-4 w-4" aria-hidden="true" /> {t("Buat lowongan", "Create job")}</button>}
            </header>
            {notice && <p role="status" className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-950">{notice}</p>}
            {error && <p ref={alert} tabIndex={-1} role="alert" className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-950">{error}</p>}
            {!data && !error && <p role="status" className={companyCard}>{t("Memuat data rekrutmen…", "Loading recruitment data…")}</p>}
            {!data && error && <button type="button" className={companySecondary} onClick={() => { setError(''); load().catch((failure: Error) => setError(failure.message)); }}>{t("Coba lagi", "Try again")}</button>}

            {data && view === 'overview' && (
              <>
                <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#25205a] via-indigo-800 to-violet-800 px-6 py-7 text-white sm:px-8 sm:py-9">
                  <span aria-hidden="true" className="absolute -right-14 -top-20 h-72 w-72 rounded-full border-[25px] border-white/10" />
                  <span aria-hidden="true" className="absolute -right-6 -top-12 h-52 w-52 rounded-full border border-white/25" />
                  <div className="relative max-w-xl [overflow-wrap:anywhere]">
                    <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{data.companyName || t("Selamat datang di portal perusahaan", "Welcome to the employer portal")}</h2>
                    <p className="mt-2 text-sm text-indigo-100">{newApplicants ? `${newApplicants} lamaran baru siap ditinjau.` : t("Terbitkan lowongan inklusif dan tinjau lamaran dari kandidat.", "Publish inclusive job listings and review candidate applications.")}</p>
                    <button type="button" onClick={() => navigate('applicants')} className="mt-4 flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-bold text-indigo-900 hover:bg-violet-100">{t("Lihat pelamar", "View applicants")} <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
                  </div>
                </section>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: t("Lowongan tayang", "Published jobs"), value: activeJobs.length, icon: Briefcase, tone: 'bg-emerald-100 text-emerald-900' },
                    { label: t("Draf lowongan", "Draft jobs"), value: drafts, icon: ClipboardList, tone: 'bg-amber-100 text-amber-900' },
                    { label: t("Total lamaran", "Total applications"), value: data.applicants.length, icon: Users, tone: 'bg-violet-100 text-indigo-900' },
                  ].map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className={`flex items-center gap-3 ${companyCard}`}>
                      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                      <div><p className="text-sm font-medium text-slate-600">{label}</p><p className="text-2xl font-extrabold">{value}</p></div>
                    </div>
                  ))}
                </div>
                <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
                  <section className={companyCard}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-bold">{t("Lowongan terbaru", "Recent jobs")}</h2>
                      <button type="button" onClick={() => navigate('jobs')} className="text-sm font-bold text-indigo-800 hover:underline">{t("Lihat semua", "View all")}</button>
                    </div>
                    <Listings jobs={data.jobs.slice(0, 5)} openEditor={openEditor} openApplicants={openApplicants} busy={busy} />
                  </section>
                  <section className={companyCard}>
                    <h2 className="flex items-center gap-2 text-lg font-bold"><Accessibility className="h-5 w-5 text-indigo-700" aria-hidden="true" /> {t("Aksesibilitas lowongan", "Job accessibility")}</h2>
                    <p className="mb-3 mt-1 text-sm text-slate-600">{t("Dukungan yang tercantum di lowongan tayang.", "Support listed on published jobs.")}</p>
                    {activeJobs.length ? (
                      <ul className="divide-y divide-slate-100 text-sm">
                        {accessibilityOptions.map(option => <li key={option} className="flex justify-between gap-2 py-2">
                          <span>{option}</span><span className="shrink-0 font-semibold text-indigo-900">{activeJobs.filter(job => job.accessibilityOptions.includes(option)).length} {t("lowongan", "jobs")}</span>
                        </li>)}
                      </ul>
                    ) : <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-indigo-900">{t("Belum ada lowongan tayang.", "There are no published jobs yet.")}</p>}
                  </section>
                </div>
              </>
            )}

            {data && view === 'jobs' && <section className={companyCard}>
              <div aria-label={t("Filter lowongan", "Filter by job")} className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                {(['all', 'published', 'draft', 'closed'] as const).map(status => (
                  <button key={status} type="button" aria-pressed={listingFilter === status} onClick={() => setListingFilter(status)}
                    className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${listingFilter === status ? 'bg-indigo-700 text-white' : 'bg-violet-50 text-indigo-900 hover:bg-violet-100'}`}>
                    {status === 'all' ? t("Semua", "All") : listingStatuses[status]}
                  </button>
                ))}
              </div>
              <Listings jobs={jobs} openEditor={openEditor} openApplicants={openApplicants} busy={busy}
                closeJob={id => void mutate({ action: 'close-job', id }, 'Lowongan ditutup. Lamaran yang masuk tetap bisa ditinjau.')} />
            </section>}

            {data && view === 'editor' && <CompanyJobForm key={editing?.id ?? 'new'} job={editing} companyName={data.companyName} busy={busy}
              openProfile={() => navigate('profile')} onCancel={() => navigate('jobs')}
              save={(job, status) => void mutate({ action: 'save-job', id: editing?.id, job, status },
                status === 'draft' ? t("Draf tersimpan.", "Draft saved.") : status === 'closed' ? 'Perubahan lowongan tersimpan.' : t("Lowongan sudah tayang.", "Job published."), 'jobs')} />}

            {data && view === 'applicants' && (
              <section aria-label="Daftar lamaran" className="grid gap-3">
                <label className="grid max-w-sm gap-1.5 text-sm font-bold">{t("Filter lowongan", "Filter by job")}
                  <select value={applicantFilter} onChange={event => setApplicantFilter(event.target.value)} className={companyInput}>
                    <option value="all">{t("Semua lowongan", "All jobs")}</option>
                    {data.jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                  </select>
                </label>
                {applicants.length ? applicants.map(applicant => <ApplicantCard key={`${applicant.jobId}-${applicant.applicantId}`}
                  applicant={applicant} jobTitle={data.jobs.find(job => job.id === applicant.jobId)?.title ?? ''}
                  busy={busy} update={status => void mutate({ action: 'applicant-status', jobId: applicant.jobId, applicantId: applicant.applicantId, status }, t("Status lamaran diperbarui.", "Application status updated."))} />
                ) : <p className={`${companyCard} text-sm text-slate-600`}>{t("Belum ada lamaran untuk lowongan yang dipilih.", "There are no applications for the selected job.")}</p>}
              </section>
            )}
          </main>
        )}
        {authError && <p role="alert" className="px-4 py-3 text-sm text-red-800">{authError}</p>}
      </div>
    </div>
  );
}
