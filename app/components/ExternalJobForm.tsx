'use client';

import { useState } from 'react';
import { Building2, ExternalLink, Link2, MapPin } from 'lucide-react';
import { externalJobLimits, jobStreetUrl, type ExternalJobFields } from '../utils/externalJobs';
import { useLanguage } from './Language';

const fieldStyle = 'mt-1 min-h-11 w-full min-w-0 rounded-xl border border-indigo-200 px-3 py-2 text-base text-slate-950 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-60';

export default function ExternalJobForm({ initial, id, onCancel, onSaved }: {
  initial?: ExternalJobFields;
  id?: number;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<ExternalJobFields>(initial ?? { url: '', title: '', company: '', location: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const url = jobStreetUrl(draft.url);
  const fields = [
    { id: 'title', label: t('Judul lowongan', 'Job title'), placeholder: t('Contoh: Program Magang Inklusif', 'Example: Inclusive Internship Program') },
    { id: 'company', label: t('Nama perusahaan', 'Company name'), placeholder: t('Nama di halaman sumber', 'Name on the source page') },
    { id: 'location', label: t('Lokasi', 'Location'), placeholder: t('Contoh: Kendal, Jawa Tengah', 'Example: Kendal, Central Java') },
  ] as const;

  return <section aria-labelledby="external-editor-title" className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
    <header className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 sm:px-6">
      <h2 id="external-editor-title" className="flex items-center gap-2 text-lg font-extrabold text-indigo-950">
        <Link2 aria-hidden="true" className="h-5 w-5 text-indigo-700" />
        {id ? t('Edit lowongan eksternal', 'Edit external listing') : t('Tambah lowongan eksternal', 'Add external listing')}
      </h2>
      <p className="mt-1 text-sm text-slate-700">{t('Tambahkan tautan JobStreet dan informasi yang tampil di kartu Lestari.', 'Add a JobStreet link and the information shown on the Lestari card.')}</p>
    </header>
    <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
      <form className="min-w-0" onSubmit={async event => {
        event.preventDefault();
        if (pending) return;
        if (!url) {
          setError(t('Masukkan tautan HTTPS langsung ke satu lowongan JobStreet Indonesia.', 'Enter a direct HTTPS link to a JobStreet Indonesia listing.'));
          return;
        }
        setPending(true);
        setError('');
        try {
          const response = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...draft, url, id, action: 'save-external-job' }) });
          if (response.ok) {
            onSaved();
            return;
          }
          if (response.status === 409) setError(t('Tautan ini sudah terdaftar. Cari lowongannya untuk mengelola publikasi.', 'This link is already listed. Find the existing listing to manage publication.'));
          else if (response.status === 400) setError(t('Periksa tautan dan lengkapi judul, perusahaan, serta lokasi.', 'Check the link and fill in the title, company, and location.'));
          else setError(t('Lowongan gagal disimpan. Coba lagi.', 'Could not save the listing. Try again.'));
        } catch {
          setError(t('Lowongan gagal disimpan. Coba lagi.', 'Could not save the listing. Try again.'));
        } finally {
          setPending(false);
        }
      }}>
        <fieldset disabled={pending} className="min-w-0 space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            {t('Tautan JobStreet', 'JobStreet link')}
            <input type="url" maxLength={2048} required value={draft.url} aria-describedby="external-url-hint"
              onChange={event => setDraft(current => ({ ...current, url: event.target.value }))}
              placeholder="https://id.jobstreet.com/id/job/12345678" className={fieldStyle} />
          </label>
          <p id="external-url-hint" className="!mt-1 text-xs text-slate-600">{t('Salin alamat dari halaman detail satu lowongan.', 'Copy the address from a single listing’s detail page.')}</p>
          {fields.map(field => <label key={field.id} className="block text-sm font-semibold text-slate-800">
            {field.label}
            <input required maxLength={externalJobLimits[field.id]} value={draft[field.id]}
              onChange={event => setDraft(current => ({ ...current, [field.id]: event.target.value }))}
              placeholder={field.placeholder} className={fieldStyle} />
          </label>)}
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-indigo-100 pt-4">
            <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-indigo-200 px-4 text-sm font-semibold text-indigo-900 hover:bg-indigo-50">{t('Batal', 'Cancel')}</button>
            <button type="submit" className={primary}>{pending ? t('Menyimpan…', 'Saving…') : id ? t('Simpan perubahan', 'Save changes') : t('Terbitkan lowongan', 'Publish listing')}</button>
          </div>
        </fieldset>
      </form>
      <aside className="min-w-0 self-start rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <h3 className="mb-3 text-sm font-bold text-indigo-950">{t('Pratinjau kartu', 'Card preview')}</h3>
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white">
          <div className="break-words bg-gradient-to-br from-indigo-800 to-violet-700 p-4 text-white">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">JobStreet</span>
            <p className="mt-3 text-lg font-extrabold [overflow-wrap:anywhere]">{draft.title.trim() || t('Judul lowongan', 'Job title')}</p>
            <p className="mt-2 flex items-start gap-2 text-sm text-indigo-50"><Building2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0 [overflow-wrap:anywhere]">{draft.company.trim() || t('Nama perusahaan', 'Company name')}</span></p>
            <p className="mt-1 flex items-start gap-2 text-sm text-indigo-50"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0 [overflow-wrap:anywhere]">{draft.location.trim() || t('Lokasi', 'Location')}</span></p>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-700">{t('Baca detail dan kirim lamaran di JobStreet.', 'Read the details and submit your application on JobStreet.')}</p>
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className={`${primary} mt-3`}>
              {t('Periksa tautan sumber', 'Check source link')}<ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
            </a>}
          </div>
        </div>
      </aside>
    </div>
  </section>;
}
