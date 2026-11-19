'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { BadgeCheck, Briefcase, Building2, Mail, MapPin, MessageSquare, Pencil, User } from 'lucide-react';
import {
  communicationOptions, profileByRole, profileLimits, type Profile, type ProfileFields,
} from '../utils/profile';

const inputStyle = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200';
const panelStyle = 'min-w-0 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7';
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60';
const roleIcons = { jobseeker: Briefcase, company: Building2, admin: BadgeCheck };

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

function Detail({ label, value, tags }: { label: string; value: string; tags?: boolean }) {
  const items = value.split(',').map(part => part.trim()).filter(Boolean);
  return (
    <div className="min-w-0">
      <dt className="text-sm font-semibold text-slate-900">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
        {tags && items.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {[...new Set(items)].map(item => (
              <li key={item} className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-800">{item}</li>
            ))}
          </ul>
        ) : (
          <span className="whitespace-pre-wrap">{value || 'Belum diisi'}</span>
        )}
      </dd>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<ProfileFields | null>(null);
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
      setProfile({ ...profile, ...await response.json() });
      setDraft(null);
      setNotice('Perubahan profil tersimpan.');
    } catch {
      setError('Profil gagal disimpan. Periksa koneksi dan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-950">Profil saya</h1>
        {loading ? <p role="status" className="mt-4 text-slate-700">Memuat profil…</p> : (
          <div className="mt-4 space-y-3">
            <p role="alert" className="text-red-800">{error}</p>
            <button type="button" className={secondaryButton} onClick={() => {
              setError('');
              setLoading(true);
              setLoadAttempt(current => current + 1);
            }}>Coba lagi</button>
          </div>
        )}
      </main>
    );
  }

  const role = profileByRole[profile.role];
  const RoleIcon = roleIcons[profile.role];
  const initials = profile.displayName.split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 sm:mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Profil saya</h1>
        {!draft && (
          <button type="button" onClick={startEditing} className={primaryButton}>
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Edit profil
          </button>
        )}
      </div>

      <section aria-label="Ringkasan profil" className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-800 px-5 py-8 text-white sm:px-8 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5 sm:flex-nowrap">
          <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/35 bg-white/15 text-xl font-extrabold text-white sm:h-20 sm:w-20 sm:text-2xl">
            {initials || <User className="h-7 w-7" />}
          </span>
          <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                <RoleIcon aria-hidden="true" className="h-3.5 w-3.5" />
                {role.label}
              </span>
              {profile.isDemo && <span className="rounded-full bg-violet-950/55 px-2.5 py-1 text-xs font-medium text-white">Data contoh</span>}
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{profile.displayName || 'Nama belum diisi'}</h2>
            {profile.headline && <p className="mt-1 text-sm text-indigo-50 sm:text-base">{profile.headline}</p>}
            {profile.location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-indigo-100">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />{profile.location}
              </p>
            )}
          </div>
        </div>
      </section>

      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900">{notice}</p>}

      {draft ? (
        <form onSubmit={save} className={`mt-5 ${panelStyle}`} aria-busy={saving}>
          <h2 className="text-lg font-bold text-slate-950">Edit profil</h2>
          <fieldset disabled={saving} className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label={role.nameLabel} value={draft.displayName} limit={profileLimits.displayName} required onChange={value => updateDraft('displayName', value)} />
            <TextField label={role.headlineLabel} value={draft.headline} limit={profileLimits.headline} onChange={value => updateDraft('headline', value)} />
            <TextField label="Lokasi" value={draft.location} limit={profileLimits.location} onChange={value => updateDraft('location', value)} />
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-slate-800">Preferensi komunikasi</span>
              <select value={draft.communication} onChange={event => updateDraft('communication', event.target.value)} className={inputStyle}>
                <option value="">Pilih preferensi</option>
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
                  hint={field.tags ? 'Pisahkan setiap keahlian dengan koma.' : undefined}
                  onChange={value => setDraft(current => current && { ...current, details: { ...current.details, [field.key]: value } })}
                />
              </div>
            ))}
          </fieldset>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-900">{error}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" disabled={saving} className={secondaryButton} onClick={() => { setDraft(null); setError(''); }}>Batal</button>
            <button type="submit" disabled={saving} className={primaryButton}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
          </div>
        </form>
      ) : (
        <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)]">
          <div className="grid min-w-0 gap-5">
            <section className={panelStyle}>
              <h2 className="text-lg font-bold text-slate-950">{role.aboutLabel}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{profile.about || 'Belum ada deskripsi.'}</p>
            </section>
            <section className={panelStyle}>
              <h2 className="text-lg font-bold text-slate-950">{role.detailsLabel}</h2>
              <dl className="mt-4 space-y-4">
                {role.fields.map(field => <Detail key={field.key} label={field.label} value={profile.details[field.key] ?? ''} tags={field.tags} />)}
              </dl>
            </section>
          </div>
          <section className={panelStyle}>
            <h2 className="text-lg font-bold text-slate-950">Akun dan komunikasi</h2>
            <dl className="mt-4 space-y-4">
              <div className="flex min-w-0 gap-2.5">
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                <Detail label="Email akun" value={profile.email} />
              </div>
              <div className="flex min-w-0 gap-2.5">
                <MessageSquare aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                <Detail label="Preferensi komunikasi" value={profile.communication} />
              </div>
            </dl>
          </section>
        </div>
      )}
    </main>
  );
}
