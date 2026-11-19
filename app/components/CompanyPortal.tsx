'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Accessibility, ArrowLeft, ArrowRight, Briefcase, Building2, ClipboardList, EarOff, LayoutDashboard, LogOut, Plus, Users } from 'lucide-react';
import CompanyJobForm, { companyCard, companyInput, companyPrimary, companySecondary } from './CompanyJobForm';
import ProfilePage from './ProfilePage';
import { accessibilityOptions, applicantStatuses, jobTypes, listingStatuses, type ApplicantStatus, type CompanyApplicant, type CompanyJob, type ListingStatus, type RecruitmentData } from '../utils/recruitment';

const navigation = [
  { id: 'overview', title: 'Dasbor', icon: LayoutDashboard },
  { id: 'jobs', title: 'Lowongan', icon: Briefcase },
  { id: 'editor', title: 'Buat lowongan', icon: Plus },
  { id: 'applicants', title: 'Pelamar', icon: Users },
  { id: 'profile', title: 'Profil Perusahaan', icon: Building2 },
] as const;
type View = typeof navigation[number]['id'];
const compactDate = (value: string) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
const listingState = (job: CompanyJob): ListingStatus => job.status === 'published' && job.expired ? 'closed' : job.status;
const applicationCommunication: Record<string, string> = {
  email: 'Email', text: 'Pesan teks', 'video-asl': 'Panggilan video dengan juru bahasa isyarat', 'written-chat': 'Chat tertulis',
};

function ListingBadge({ job }: { job: CompanyJob }) {
  const status = listingState(job);
  const styles = { draft: 'bg-amber-100 text-amber-900', published: 'bg-emerald-100 text-emerald-900', closed: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
    {job.status === 'published' && job.expired ? 'Berakhir' : listingStatuses[status]}
  </span>;
}

function Listings({ jobs, openEditor, openApplicants, closeJob, busy }: {
  jobs: CompanyJob[]; openEditor: (job: CompanyJob) => void; openApplicants: (id: number) => void;
  closeJob?: (id: number) => void; busy: boolean;
}) {
  return jobs.length ? (
    <ul className="divide-y divide-slate-100">
      {jobs.map(job => (
        <li key={job.id} className="grid gap-3 py-4 first:pt-1 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="break-words font-bold text-slate-950">{job.title}</p>
            <p className="mt-1 break-words text-sm text-slate-600">
              {jobTypes[job.type as keyof typeof jobTypes]} · {job.location || 'Lokasi belum diisi'} · {compactDate(job.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ListingBadge job={job} />
            <button type="button" onClick={() => openApplicants(job.id)} className="min-h-9 rounded-lg px-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50">
              {job.applicants} pelamar
            </button>
            <button type="button" onClick={() => openEditor(job)} className="min-h-9 rounded-lg border border-violet-200 px-3 text-sm font-semibold text-indigo-900 hover:bg-indigo-50">Edit</button>
            {closeJob && job.status === 'published' && (
              <button type="button" disabled={busy} onClick={() => closeJob(job.id)} className="min-h-9 rounded-lg px-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60">Tutup</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  ) : <p className="py-5 text-sm text-slate-600">Belum ada lowongan di tampilan ini.</p>;
}

function ApplicantCard({ applicant, jobTitle, busy, update }: {
  applicant: CompanyApplicant; jobTitle: string; busy: boolean; update: (status: ApplicantStatus) => void;
}) {
  return (
    <details className={`${companyCard} group`}>
      <summary className="cursor-pointer rounded-lg marker:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">
        <span className="ml-1 inline-block break-words text-base font-bold">{applicant.name}</span>
        <span className="ml-2 inline-block rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-indigo-900">{applicantStatuses[applicant.status]}</span>
        <span className="mt-1 block break-words text-sm text-slate-600">{jobTitle} · {compactDate(applicant.appliedAt)}</span>
      </summary>
      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-bold">Kontak</dt><dd className="break-all"><a className="text-indigo-800 underline" href={`mailto:${encodeURIComponent(applicant.email)}`}>{applicant.email}</a></dd>{applicant.phone && <dd>{applicant.phone}</dd>}</div>
          <div><dt className="font-bold">Preferensi komunikasi</dt><dd>{applicationCommunication[applicant.communicationPreference]}</dd></div>
          {applicant.availabilityDate && <div><dt className="font-bold">Bisa mulai</dt><dd>{compactDate(applicant.availabilityDate)}</dd></div>}
          {applicant.salaryExpectation && <div><dt className="font-bold">Ekspektasi gaji</dt><dd className="break-words">{applicant.salaryExpectation}</dd></div>}
          {applicant.coverLetter && <div className="sm:col-span-2"><dt className="font-bold">Surat lamaran</dt><dd className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{applicant.coverLetter}</dd></div>}
        </dl>
        <label className="grid max-w-xs gap-1.5 text-sm font-bold text-slate-900">
          Status lamaran
          <select disabled={busy} value={applicant.status} onChange={event => update(event.target.value as ApplicantStatus)} className={companyInput}>
            {Object.entries(applicantStatuses).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
          </select>
        </label>
      </div>
    </details>
  );
}

export default function CompanyPortal({ logout, authError }: { logout: () => void; authError: string }) {
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
  const title = view === 'editor' ? editing ? 'Edit lowongan' : 'Buat lowongan' :
    view === 'jobs' ? 'Lowongan Saya' : view === 'applicants' ? 'Pelamar' : 'Dasbor Rekrutmen';
  const jobs = data?.jobs.filter(job => listingFilter === 'all' || listingState(job) === listingFilter) ?? [];
  const applicants = data?.applicants.filter(item => applicantFilter === 'all' || String(item.jobId) === applicantFilter) ?? [];

  return (
    <div className="min-h-screen bg-[#f1f1fa] text-slate-950 lg:grid lg:grid-cols-[15.25rem_minmax(0,1fr)]">
      <aside className="bg-[#211746] px-4 pb-3 pt-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-4 lg:py-7">
        <div className="mb-4 flex items-center justify-between gap-3 px-1 lg:mb-8">
          <button type="button" onClick={() => navigate('overview')} className="flex items-center gap-2 rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600"><EarOff className="h-5 w-5" aria-hidden="true" /></span>
            <span><span className="block text-xl font-extrabold tracking-tight">Lestari</span><span className="block text-xs text-violet-200">Portal Perusahaan</span></span>
          </button>
          <button type="button" onClick={logout} className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-800 lg:hidden">
            <LogOut aria-hidden="true" className="h-4 w-4" /> Keluar
          </button>
        </div>
        <nav aria-label="Menu perusahaan" className="flex flex-wrap gap-1 text-sm lg:grid lg:gap-2">
          {navigation.map(({ id, title, icon: Icon }) => (
            <button key={id} type="button" aria-current={view === id ? 'page' : undefined}
              onClick={() => id === 'editor' ? openEditor() : navigate(id)}
              className={`flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-left font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:min-h-11 lg:px-3 ${view === id ? 'bg-violet-700 text-white' : 'text-violet-100 hover:bg-violet-900'}`}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{title}
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden rounded-2xl border border-white/15 bg-white/5 p-3 lg:block">
          <p className="break-words text-sm font-semibold">{data?.companyName || 'Akun perusahaan'}</p>
          <button type="button" className="mt-2 flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-violet-200 hover:text-white" onClick={logout}>
            <LogOut aria-hidden="true" className="h-4 w-4" /> Keluar akun
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        {view === 'profile' ? <ProfilePage /> : (
          <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7 sm:py-8">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                {view === 'editor' && <button type="button" onClick={() => navigate('jobs')} className="mb-2 flex items-center gap-1.5 text-sm font-bold text-indigo-800"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke lowongan</button>}
                <h1 ref={heading} tabIndex={-1} className="text-3xl font-extrabold tracking-tight outline-none sm:text-4xl">{title}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {view === 'overview' ? 'Pantau lowongan dan tindak lanjuti lamaran dari satu tempat.' : view === 'editor' ? 'Jelaskan pekerjaan dan dukungan yang tersedia bagi kandidat.' : view === 'jobs' ? 'Kelola draf, lowongan tayang, dan lowongan yang ditutup.' : 'Buka lamaran dan perbarui tahap rekrutmen.'}
                </p>
              </div>
              {view !== 'editor' && <button type="button" className={companyPrimary} onClick={() => openEditor()}><Plus className="h-4 w-4" aria-hidden="true" /> Buat lowongan</button>}
            </header>
            {notice && <p role="status" className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-950">{notice}</p>}
            {error && <p ref={alert} tabIndex={-1} role="alert" className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-950">{error}</p>}
            {!data && !error && <p role="status" className={companyCard}>Memuat data rekrutmen…</p>}
            {!data && error && <button type="button" className={companySecondary} onClick={() => { setError(''); load().catch((failure: Error) => setError(failure.message)); }}>Coba lagi</button>}

            {data && view === 'overview' && (
              <>
                <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#25205a] via-indigo-800 to-violet-800 px-6 py-7 text-white sm:px-8 sm:py-9">
                  <span aria-hidden="true" className="absolute -right-14 -top-20 h-72 w-72 rounded-full border-[25px] border-white/10" />
                  <span aria-hidden="true" className="absolute -right-6 -top-12 h-52 w-52 rounded-full border border-white/25" />
                  <div className="relative max-w-xl [overflow-wrap:anywhere]">
                    <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{data.companyName || 'Selamat datang di portal perusahaan'}</h2>
                    <p className="mt-2 text-sm text-indigo-100">{newApplicants ? `${newApplicants} lamaran baru siap ditinjau.` : 'Terbitkan lowongan inklusif dan tinjau lamaran dari kandidat.'}</p>
                    <button type="button" onClick={() => navigate('applicants')} className="mt-4 flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-bold text-indigo-900 hover:bg-violet-100">Lihat pelamar <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
                  </div>
                </section>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Lowongan tayang', value: activeJobs.length, icon: Briefcase, tone: 'bg-emerald-100 text-emerald-900' },
                    { label: 'Draf lowongan', value: drafts, icon: ClipboardList, tone: 'bg-amber-100 text-amber-900' },
                    { label: 'Total lamaran', value: data.applicants.length, icon: Users, tone: 'bg-violet-100 text-indigo-900' },
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
                      <h2 className="text-lg font-bold">Lowongan terbaru</h2>
                      <button type="button" onClick={() => navigate('jobs')} className="text-sm font-bold text-indigo-800 hover:underline">Lihat semua</button>
                    </div>
                    <Listings jobs={data.jobs.slice(0, 5)} openEditor={openEditor} openApplicants={openApplicants} busy={busy} />
                  </section>
                  <section className={companyCard}>
                    <h2 className="flex items-center gap-2 text-lg font-bold"><Accessibility className="h-5 w-5 text-indigo-700" aria-hidden="true" /> Aksesibilitas lowongan</h2>
                    <p className="mb-3 mt-1 text-sm text-slate-600">Dukungan yang tercantum di lowongan tayang.</p>
                    {activeJobs.length ? (
                      <ul className="divide-y divide-slate-100 text-sm">
                        {accessibilityOptions.map(option => <li key={option} className="flex justify-between gap-2 py-2">
                          <span>{option}</span><span className="shrink-0 font-semibold text-indigo-900">{activeJobs.filter(job => job.accessibilityOptions.includes(option)).length} lowongan</span>
                        </li>)}
                      </ul>
                    ) : <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-indigo-900">Belum ada lowongan tayang.</p>}
                  </section>
                </div>
              </>
            )}

            {data && view === 'jobs' && <section className={companyCard}>
              <div aria-label="Filter lowongan" className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                {(['all', 'published', 'draft', 'closed'] as const).map(status => (
                  <button key={status} type="button" aria-pressed={listingFilter === status} onClick={() => setListingFilter(status)}
                    className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${listingFilter === status ? 'bg-indigo-700 text-white' : 'bg-violet-50 text-indigo-900 hover:bg-violet-100'}`}>
                    {status === 'all' ? 'Semua' : listingStatuses[status]}
                  </button>
                ))}
              </div>
              <Listings jobs={jobs} openEditor={openEditor} openApplicants={openApplicants} busy={busy}
                closeJob={id => void mutate({ action: 'close-job', id }, 'Lowongan ditutup. Lamaran yang masuk tetap bisa ditinjau.')} />
            </section>}

            {data && view === 'editor' && <CompanyJobForm key={editing?.id ?? 'new'} job={editing} companyName={data.companyName} busy={busy}
              openProfile={() => navigate('profile')} onCancel={() => navigate('jobs')}
              save={(job, status) => void mutate({ action: 'save-job', id: editing?.id, job, status },
                status === 'draft' ? 'Draf tersimpan.' : status === 'closed' ? 'Perubahan lowongan tersimpan.' : 'Lowongan sudah tayang.', 'jobs')} />}

            {data && view === 'applicants' && (
              <section aria-label="Daftar lamaran" className="grid gap-3">
                <label className="grid max-w-sm gap-1.5 text-sm font-bold">Filter lowongan
                  <select value={applicantFilter} onChange={event => setApplicantFilter(event.target.value)} className={companyInput}>
                    <option value="all">Semua lowongan</option>
                    {data.jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                  </select>
                </label>
                {applicants.length ? applicants.map(applicant => <ApplicantCard key={`${applicant.jobId}-${applicant.applicantId}`}
                  applicant={applicant} jobTitle={data.jobs.find(job => job.id === applicant.jobId)?.title ?? ''}
                  busy={busy} update={status => void mutate({ action: 'applicant-status', jobId: applicant.jobId, applicantId: applicant.applicantId, status }, 'Status lamaran diperbarui.')} />
                ) : <p className={`${companyCard} text-sm text-slate-600`}>Belum ada lamaran untuk lowongan yang dipilih.</p>}
              </section>
            )}
          </main>
        )}
        {authError && <p role="alert" className="px-4 py-3 text-sm text-red-800">{authError}</p>}
      </div>
    </div>
  );
}
