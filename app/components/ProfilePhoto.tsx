'use client';

import Image from 'next/image';
import { type ChangeEvent, useEffect, useState } from 'react';
import { Camera, Trash2, User } from 'lucide-react';
import { avatarMaxBytes, avatarTypes } from '../utils/avatar';

export const avatarUrl = (version: string | null) =>
  version ? `/api/profile/avatar?v=${encodeURIComponent(version)}` : '';

export function ProfilePhoto({ src, initials, label, className }: {
  src: string;
  initials: string;
  label: string;
  className: string;
}) {
  const [failedSource, setFailedSource] = useState('');
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full text-xl font-extrabold ${className}`}>
      {src && src !== failedSource ? (
        <Image src={src} unoptimized fill alt={label} sizes="96px" className="object-cover"
          onError={() => setFailedSource(src)} />
      ) : (
        <span aria-hidden="true">{initials || <User className="h-7 w-7" />}</span>
      )}
    </span>
  );
}

const control = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60';

export function ProfilePhotoEditor({ version, initials, onCancel, onSaved }: {
  version: string | null;
  initials: string;
  onCancel: () => void;
  onSaved: (version: string | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [remove, setRemove] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    if (!avatarTypes.includes(chosen.type) || chosen.size > avatarMaxBytes || chosen.size === 0) {
      setError('Pilih foto JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.');
      return;
    }
    setError('');
    setRemove(false);
    setFile(chosen);
  }

  async function save() {
    if (saving || (!file && !remove)) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/profile/avatar', file ? {
        method: 'PUT', headers: { 'Content-Type': file.type }, body: file,
      } : { method: 'DELETE' });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) {
        setError(result?.error ?? 'Foto gagal disimpan. Coba lagi.');
        return;
      }
      onSaved(result.avatarVersion);
    } catch {
      setError('Foto gagal disimpan. Periksa koneksi dan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="profile-photo-editor" aria-labelledby="profile-photo-title" aria-busy={saving}
      className="mt-5 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start gap-4 sm:gap-5">
        <ProfilePhoto src={remove ? '' : preview || avatarUrl(version)} initials={initials}
          label="Pratinjau foto profil" className="h-24 w-24 border-4 border-indigo-100 bg-indigo-50 text-indigo-900" />
        <div className="min-w-0 flex-1 basis-56">
          <h2 id="profile-photo-title" className="text-lg font-bold text-slate-950">Foto profil</h2>
          <p id="photo-help" className="mt-1 text-sm text-slate-600">
            Pilih foto dengan wajah di tengah agar terlihat jelas dalam bingkai bulat. JPG, PNG, atau WebP, maksimal 5 MB.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={`cursor-pointer border border-indigo-200 text-indigo-800 hover:bg-indigo-50 focus-within:outline focus-within:outline-2 focus-within:outline-indigo-600 ${control}`}>
              <Camera aria-hidden="true" className="h-4 w-4" />
              Pilih foto
              <input type="file" accept={avatarTypes.join(',')} disabled={saving}
                aria-describedby="photo-help" onChange={chooseFile} className="sr-only" />
            </label>
            {version && !remove && (
              <button type="button" disabled={saving} className={`${control} text-red-700 hover:bg-red-50`}
                onClick={() => { setFile(null); setRemove(true); setError(''); }}>
                <Trash2 aria-hidden="true" className="h-4 w-4" /> Hapus foto
              </button>
            )}
          </div>
          {file && <p className="mt-2 break-all text-xs text-slate-600">{file.name}</p>}
          {remove && <p role="status" className="mt-2 text-sm text-slate-700">Foto akan dihapus setelah disimpan.</p>}
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-900">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" disabled={saving} onClick={onCancel}
          className={`${control} border border-slate-200 text-slate-800 hover:bg-slate-50`}>Batal</button>
        <button type="button" disabled={saving || (!file && !remove)} onClick={save}
          className={`${control} bg-indigo-700 text-white hover:bg-indigo-800`}>
          {saving ? 'Menyimpan…' : 'Simpan foto'}
        </button>
      </div>
    </section>
  );
}
