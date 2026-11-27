'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Briefcase, GraduationCap, RefreshCw, Users } from 'lucide-react';
import { useLanguage } from './Language';
import type { PublicCatalog } from './PublicHeader';

type Counts = { jobs: number; accounts: number; enrollments: number; workshops: number };

const metrics = [
  { key: 'jobs', label: ['Lowongan tersedia', 'Available jobs'], icon: Briefcase, color: 'text-indigo-600', page: 'job-portal' },
  { key: 'accounts', label: ['Akun terdaftar', 'Registered accounts'], icon: Users, color: 'text-purple-600', page: null },
  { key: 'enrollments', label: ['Pendaftaran workshop', 'Workshop enrollments'], icon: GraduationCap, color: 'text-green-600', page: null },
  { key: 'workshops', label: ['Workshop tersedia', 'Available workshops'], icon: BookOpen, color: 'text-blue-600', page: 'workshop' },
] as const;

export default function CommunityStats({ onBrowse }: { onBrowse?: (page: PublicCatalog) => void }) {
  const { locale, t } = useLanguage();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [request, setRequest] = useState(0);
  const numbers = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/community-stats', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data: Counts = await response.json();
        if (controller.signal.aborted) return;
        setCounts(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [request]);

  function refresh() {
    setStatus('loading');
    setRequest(previous => previous + 1);
  }

  return (
    <section aria-labelledby="community-stats-title" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h2 id="community-stats-title" className="text-3xl font-bold text-gray-900 md:text-4xl">
          {t('Lestari dalam angka', 'Lestari in numbers')}
        </h2>
        <div className="my-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <button type="button" onClick={refresh} disabled={status === 'loading'}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60">
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${status === 'loading' ? 'motion-safe:animate-spin' : ''}`} />
            {t('Perbarui angka', 'Refresh counts')}
          </button>
          <p role="status" className={status === 'ready' ? 'sr-only' : 'text-sm text-gray-600'}>
            {status === 'loading' ? t('Memuat statistik…', 'Loading statistics…') :
              status === 'error' ? t('Gagal memuat statistik. Coba perbarui lagi.', 'Could not load statistics. Try refreshing again.') :
              t('Statistik diperbarui.', 'Statistics updated.')}
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
          {metrics.map(({ key, label, icon: Icon, color, page }) => (
            <li key={key} className="flex flex-col items-center rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow-lg sm:p-6">
              <Icon aria-hidden="true" className={`mb-3 h-6 w-6 ${color}`} />
              <span className={`text-3xl font-bold tabular-nums sm:text-4xl ${color}`}>{counts ? numbers.format(counts[key]) : '—'}</span>
              <span className="mt-2 text-sm font-medium text-gray-600 sm:text-base">{t(label[0], label[1])}</span>
              {page && onBrowse && (
                <button type="button" onClick={() => { onBrowse(page); window.scrollTo(0, 0); }}
                  className="mt-auto inline-flex min-h-10 items-center gap-1.5 rounded-md pt-2 text-xs font-semibold text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 sm:text-sm">
                  {page === 'job-portal' ? t('Lihat lowongan', 'Browse jobs') : t('Lihat workshop', 'Browse workshops')}
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
