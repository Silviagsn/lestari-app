'use client';

import { useLanguage } from './Language';

import { type FormEvent, useEffect, useState } from 'react';
import { ArrowUpRight, BadgeCheck, Briefcase, Building2, Camera, GraduationCap, Mail, MapPin, MessageSquare, Pencil, User } from 'lucide-react';
import { avatarUrl, ProfilePhoto, ProfilePhotoEditor } from './ProfilePhoto';
import ProfileActivity from './ProfileActivity';
import {
  communicationOptions, profileByRole, profileLimits, type Profile, type ProfileFields,
} from '../utils/profile';

const inputStyle = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200';
const panelStyle = 'min-w-0 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7';
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60';
const roleIcons = { jobseeker: Briefcase, company: Building2, admin: BadgeCheck };
const sectionIcon = 'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700';
const sectionTitle = 'flex items-center gap-3 text-lg font-bold tracking-tight text-slate-950';

type TextFieldProps = {
  label: string;
  value: string;
  limit: number;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  hint?: string;
};

function TextField({ label, value, limit, onChange, multiline, required, hint }: TextFieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-slate-800">{label}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          maxLength={limit}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputStyle} resize-y`}
        />
      ) : (
        <input
          value={value}
          maxLength={limit}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className={inputStyle}
        />
      )}
      {hint && <span className="block text-xs text-slate-600">{hint}</span>}
    </label>
  );
}

function Detail({ label, value, tags, className }: { label: string; value: string; tags?: boolean; className?: string }) {
  const items = value.split(',').map(part => part.trim()).filter(Boolean);
  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <dt className="text-sm font-semibold text-slate-900">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
        {tags && items.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {[...new Set(items)].map(item => (
              <li key={item} className="max-w-full rounded-full border border-indigo-100 bg-white px-3 py-1 font-medium text-indigo-800">{item}</li>
            ))}
          </ul>
        ) : (
          <span className="whitespace-pre-wrap">{value || 'Belum diisi'}</span>
        )}
      </dd>
    </div>
  );
}

export default function ProfilePage({ onProfileChange, onNavigate }: {
  onProfileChange?: () => void;
  onNavigate?: (page: 'job-portal' | 'workshop') => void;
}) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<ProfileFields | null>(null);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/profile', { signal: controller.signal })
      .then(async response => {
        if (response.status === 401) throw new Error('Sesi berakhir. Silakan masuk kembali.');
        if (!response.ok) throw new Error('Profil gagal dimuat.');
        setProfile(await response.json());
      })
      .catch(error => {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Profil gagal dimuat.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  function startEditing() {
    if (!profile) return;
    const { displayName, headline, location, about, communication, details } = profile;
    setDraft({ displayName, headline, location, about, communication, details: { ...details } });
    setError('');
    setNotice('');
  }

  function updateDraft(field: Exclude<keyof ProfileFields, 'details'>, value: string) {
    setDraft(current => current && { ...current, [field]: value });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !profile || saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? 'Profil gagal disimpan. Coba lagi.');
        return;
      }
      const saved = await response.json();
      setProfile(current => current && { ...current, ...saved });
      onProfileChange?.();
      setDraft(null);
      setNotice(t("Perubahan profil tersimpan.", "Profile changes saved."));
    } catch {
      setError('Profil gagal disimpan. Periksa koneksi dan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-950">{t("Profil saya", "My profile")}</h1>
        {loading ? <p role="status" className="mt-4 text-slate-700">{t("Memuat profil…", "Loading profile…")}</p> : (
          <div className="mt-4 space-y-3">
            <p role="alert" className="text-red-800">{error}</p>
            <button type="button" className={secondaryButton} onClick={() => {
              setError('');
              setLoading(true);
              setLoadAttempt(current => current + 1);
            }}>{t("Coba lagi", "Try again")}</button>
          </div>
        )}
      </main>
    );
  }

  const role = profileByRole[profile.role];
  const RoleIcon = roleIcons[profile.role];
  const initials = profile.displayName.split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();
  const photoLabel = profile.avatarVersion ? t("Ubah foto profil", "Change profile photo") : t("Unggah foto profil", "Upload profile photo");
  const photoProps = {
    'aria-label': photoLabel,
    'aria-expanded': editingPhoto,
    'aria-controls': editingPhoto ? 'profile-photo-editor' : undefined,
    onClick: () => { setEditingPhoto(true); setNotice(''); },
  };
  const feedback = notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900">{notice}</p>;
  const photoEditor = editingPhoto && (
    <ProfilePhotoEditor version={profile.avatarVersion} initials={initials}
      onCancel={() => setEditingPhoto(false)}
      onSaved={avatarVersion => {
        setProfile(current => current && { ...current, avatarVersion });
        onProfileChange?.();
        setEditingPhoto(false);
        setNotice(avatarVersion ? 'Foto profil tersimpan.' : 'Foto profil dihapus.');
      }} />
  );
  const about = <section className={`${panelStyle} border-t-4 border-t-violet-300`}>
    <h2 className={sectionTitle}><span className={sectionIcon}><User aria-hidden="true" className="h-5 w-5" /></span>{role.aboutLabel}</h2>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere] sm:text-base">{profile.about || 'Belum ada deskripsi.'}</p>
  </section>;
  const details = <section className={`${panelStyle} ${profile.role === 'jobseeker' && onNavigate ? '' : 'lg:col-span-2'}`}>
    <h2 className={sectionTitle}><span className={sectionIcon}><RoleIcon aria-hidden="true" className="h-5 w-5" /></span>{role.detailsLabel}</h2>
    <dl className={`mt-4 grid gap-3 sm:grid-cols-2 ${role.fields.length === 3 && !onNavigate ? 'lg:grid-cols-3' : ''}`}>
      {role.fields.map(field => <Detail key={field.key} label={field.label}
        value={profile.details[field.key] ?? ''} tags={field.tags} className="rounded-2xl border border-indigo-50 bg-gradient-to-br from-slate-50 to-indigo-50/70 px-4 py-4" />)}
    </dl>
  </section>;
  const contacts = <dl className="mt-3 divide-y divide-indigo-50">
    <div className="flex min-w-0 gap-2.5 py-3">
      <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
      <Detail label={t("Email akun", "Account email")} value={profile.email} />
    </div>
    <div className="flex min-w-0 gap-2.5 pt-3">
      <MessageSquare aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
      <Detail label={t("Preferensi komunikasi", "Communication preference")} value={profile.communication} />
    </div>
  </dl>;

  if (profile.role === 'jobseeker' && onNavigate && !draft) {
    const shortcuts = [
      { id: 'job-portal', label: t('Lowongan Kerja', 'Job Listings'), icon: Briefcase, color: 'bg-blue-50 text-blue-900 hover:bg-blue-100' },
      { id: 'workshop', label: t('Workshop', 'Workshops'), icon: GraduationCap, color: 'bg-violet-50 text-violet-900 hover:bg-violet-100' },
    ] as const;
    return <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-9">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-violet-200 px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 -z-10 h-72 w-72 rounded-full border-[30px] border-white/45 sm:right-2" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-6 right-10 -z-10 hidden h-20 w-36 bg-[radial-gradient(circle,#7763c6_1px,transparent_1px)] [background-size:12px_12px] opacity-30 sm:block" />
        <h1 className="max-w-3xl break-words text-3xl font-extrabold tracking-tight text-indigo-950 [overflow-wrap:anywhere] sm:text-4xl">
          {profile.displayName ? t(`Halo, ${profile.displayName}`, `Hi, ${profile.displayName}`) : t('Profil saya', 'My profile')}
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-700 sm:text-base">{t('Pantau lamaran, workshop yang kamu ikuti, dan daftar tersimpan dari profilmu.', 'Track your applications, workshops, and saved items from your profile.')}</p>
      </section>
      {feedback}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.53fr)]">
        <div className="grid min-w-0 gap-4 lg:col-start-2 lg:row-start-1">
          <section aria-label={t('Ringkasan profil', 'Profile overview')} className="overflow-hidden rounded-[1.75rem] border border-indigo-100 bg-white shadow-sm">
            <div aria-hidden="true" className="relative h-20 overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-600 to-indigo-400">
              <div className="absolute -right-3 -top-24 h-48 w-48 rounded-full border-[22px] border-white/20" />
              <div className="absolute bottom-2 left-5 h-12 w-28 bg-[radial-gradient(circle,#ffffff_1px,transparent_1px)] [background-size:10px_10px] opacity-30" />
            </div>
            <div className="px-5 pb-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <button type="button" {...photoProps} className="relative -mt-9 shrink-0 rounded-full border-4 border-white bg-indigo-50 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
                  <ProfilePhoto src={avatarUrl(profile.avatarVersion)} initials={initials} label="" className="h-20 w-20 bg-indigo-100 text-indigo-900" />
                  <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-indigo-700 text-white"><Camera aria-hidden="true" className="h-4 w-4" /></span>
                </button>
                <button type="button" onClick={startEditing} className={secondaryButton}>
                  <Pencil aria-hidden="true" className="h-4 w-4" />{t('Edit profil', 'Edit profile')}
                </button>
              </div>
              <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-950 [overflow-wrap:anywhere]">{profile.displayName || t('Nama belum diisi', 'Name missing')}</h2>
              {profile.headline && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 [overflow-wrap:anywhere]">{profile.headline}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800"><RoleIcon aria-hidden="true" className="h-3.5 w-3.5" />{role.label}</span>
                {profile.isDemo && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900">{t('Data contoh', 'Sample data')}</span>}
              </div>
              {profile.location && <p className="mt-3 flex items-start gap-2 text-sm text-slate-700 [overflow-wrap:anywhere]"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" /><span className="min-w-0">{profile.location}</span></p>}
              <h3 className="mt-5 border-t border-indigo-100 pt-4 text-sm font-bold text-slate-900">{t('Akun dan komunikasi', 'Account and communication')}</h3>
              {contacts}
            </div>
          </section>
          {photoEditor}
          <section className="relative isolate grid gap-2 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-indigo-800 via-indigo-700 to-violet-700 p-4 text-white shadow-sm">
            <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 -z-10 h-40 w-40 rounded-full border-[18px] border-white/20" />
            <h2 className="px-1 pb-1 text-base font-extrabold">{t('Jelajahi Lestari', 'Explore Lestari')}</h2>
            {shortcuts.map(({ id, label, icon: Icon, color }) => <button key={id} type="button" onClick={() => onNavigate(id)}
              className={`flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ${color}`}>
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" /><span className="flex-1">{label}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </button>)}
          </section>
        </div>
        <div className="grid min-w-0 gap-5 lg:col-start-1 lg:row-start-1">
          <ProfileActivity />
          {about}
          {details}
        </div>
      </div>
    </main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-9">
      <section aria-label={t("Ringkasan profil", "Profile overview")} className="relative isolate overflow-hidden rounded-[2rem] bg-[#1d1846] px-5 pb-6 pt-5 text-white shadow-lg shadow-indigo-950/15 sm:px-8 sm:pb-8 sm:pt-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_0%,#674bbb,transparent_62%),radial-gradient(ellipse_at_75%_100%,#303e94,transparent_62%)]">
          <div className="absolute -right-16 -top-40 h-96 w-72 rotate-[32deg] rounded-[45%] border border-white/20 sm:right-4 sm:w-96" />
          <div className="absolute -right-24 -top-36 h-96 w-72 rotate-[32deg] rounded-[45%] border border-indigo-200/25 sm:-right-4 sm:w-96" />
          <div className="absolute -right-32 -top-32 h-96 w-72 rotate-[32deg] rounded-[45%] border border-violet-200/20 sm:-right-12 sm:w-96" />
          <div className="absolute bottom-8 right-10 hidden h-20 w-36 bg-[radial-gradient(circle,#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-20 sm:block" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3 sm:pb-4">
          <h1 className="text-sm font-semibold text-indigo-100 sm:text-base">{profile.role === 'company' ? t("Profil Perusahaan", "Company profile") : t("Profil saya", "My profile")}</h1>
          {!draft && (
            <button type="button" onClick={startEditing} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 text-sm font-semibold text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <Pencil aria-hidden="true" className="h-4 w-4" />
              {t("Edit profil", "Edit profile")}
            </button>
          )}
        </div>
        <div className="mt-5 flex flex-col items-start gap-4 sm:mt-6 sm:flex-row sm:items-center sm:gap-6">
          <button type="button" {...photoProps}
            className="group relative shrink-0 rounded-[1.75rem] border border-white/30 bg-white/10 p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <ProfilePhoto src={avatarUrl(profile.avatarVersion)} initials={initials} label=""
              className="h-20 w-20 !rounded-[1.35rem] bg-indigo-100 text-indigo-900 shadow-md sm:h-28 sm:w-28" />
            <span className="absolute -bottom-1.5 -right-1.5 grid h-9 w-9 place-items-center rounded-xl border-2 border-indigo-200 bg-white text-indigo-800 shadow-sm group-hover:bg-indigo-50">
              <Camera aria-hidden="true" className="h-4 w-4" />
            </span>
          </button>
          <div className="min-w-0 max-w-full flex-1 [overflow-wrap:anywhere]">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-indigo-50">
                <RoleIcon aria-hidden="true" className="h-3.5 w-3.5" />
                {role.label}
              </span>
              {profile.isDemo && <span className="rounded-full border border-violet-200/25 bg-violet-200/10 px-2.5 py-1 text-xs font-medium text-violet-50">{t("Data contoh", "Sample data")}</span>}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{profile.displayName || t("Nama belum diisi", "Name missing")}</h2>
            {profile.headline && <p className="mt-1 whitespace-pre-wrap text-sm text-indigo-50 sm:text-base">{profile.headline}</p>}
            {profile.location && <p className="mt-2 flex items-start gap-1.5 text-sm text-indigo-100">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0">{profile.location}</span>
            </p>}
          </div>
        </div>
      </section>

      {feedback}
      {photoEditor}

      {draft ? (
        <form onSubmit={save} className={`mt-5 ${panelStyle}`} aria-busy={saving}>
          <h2 className={sectionTitle}><span className={sectionIcon}><Pencil aria-hidden="true" className="h-4 w-4" /></span>{t("Edit profil", "Edit profile")}</h2>
          <fieldset disabled={saving} className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label={role.nameLabel} value={draft.displayName} limit={profileLimits.displayName} required onChange={value => updateDraft('displayName', value)} />
            <TextField label={role.headlineLabel} value={draft.headline} limit={profileLimits.headline} onChange={value => updateDraft('headline', value)} />
            <TextField label={t("Lokasi", "Location")} value={draft.location} limit={profileLimits.location} onChange={value => updateDraft('location', value)} />
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-slate-800">{t("Preferensi komunikasi", "Communication preference")}</span>
              <select value={draft.communication} onChange={event => updateDraft('communication', event.target.value)} className={inputStyle}>
                <option value="">{t("Pilih preferensi", "Choose a preference")}</option>
                {communicationOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2">
              <TextField label={role.aboutLabel} value={draft.about} limit={profileLimits.about} multiline onChange={value => updateDraft('about', value)} />
            </div>
            {role.fields.map(field => (
              <div key={field.key} className={field.multiline ? 'sm:col-span-2' : undefined}>
                <TextField
                  label={field.label}
                  value={draft.details[field.key] ?? ''}
                  limit={field.limit}
                  multiline={field.multiline}
                  hint={field.tags ? t("Pisahkan setiap keahlian dengan koma.", "Separate skills with commas.") : undefined}
                  onChange={value => setDraft(current => current && { ...current, details: { ...current.details, [field.key]: value } })}
                />
              </div>
            ))}
          </fieldset>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-900">{error}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" disabled={saving} className={secondaryButton} onClick={() => { setDraft(null); setError(''); }}>{t("Batal", "Cancel")}</button>
            <button type="submit" disabled={saving} className={primaryButton}>{saving ? t("Menyimpan…", "Saving…") : t("Simpan perubahan", "Save changes")}</button>
          </div>
        </form>
      ) : (
        <div className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]">
          {about}
          <section className={`${panelStyle} border-sky-100 bg-gradient-to-br from-white to-sky-50`}>
            <h2 className={sectionTitle}><span className={sectionIcon}><MessageSquare aria-hidden="true" className="h-5 w-5" /></span>{t("Akun dan komunikasi", "Account and communication")}</h2>
            {contacts}
          </section>
          {details}
        </div>
      )}
    </main>
  );
}
