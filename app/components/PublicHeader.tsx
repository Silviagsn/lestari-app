'use client';

import Link from 'next/link';
import { EarOff } from 'lucide-react';
import { LanguageSwitch, useLanguage } from './Language';

const primary = 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md shadow-purple-500/20 hover:from-indigo-800 hover:to-purple-800';

export type PublicCatalog = 'job-portal' | 'workshop';

export function PublicHeader({ login = false, signup = false, catalog, onBrowse }: {
  login?: boolean;
  signup?: boolean;
  catalog?: PublicCatalog;
  onBrowse?: (page: PublicCatalog | 'home') => void;
}) {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100 bg-slate-50/95 backdrop-blur">
      <nav aria-label={t('Navigasi utama', 'Main navigation')} className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <Link href="/" onClick={event => { if (onBrowse && catalog) { event.preventDefault(); onBrowse('home'); } }} className="inline-flex items-center gap-2 rounded-xl text-lg font-extrabold text-indigo-900 sm:text-xl">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-md shadow-purple-500/20 sm:h-10 sm:w-10"><EarOff aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" /></span>
          <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Lestari</span>
        </Link>
        {onBrowse && <div className="order-last flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-700 md:order-none md:w-auto md:gap-x-6">
          <button type="button" aria-current={catalog ? undefined : 'page'} onClick={() => onBrowse('home')}
            className="rounded-md px-1 py-2 hover:text-indigo-800 aria-[current=page]:text-indigo-700 aria-[current=page]:underline">{t('Beranda', 'Home')}</button>
          <button type="button" aria-current={catalog === 'job-portal' ? 'page' : undefined} onClick={() => onBrowse('job-portal')}
            className="rounded-md px-1 py-2 hover:text-indigo-800 aria-[current=page]:text-indigo-700 aria-[current=page]:underline">{t('Lowongan Kerja', 'Job Portal')}</button>
          <button type="button" aria-current={catalog === 'workshop' ? 'page' : undefined} onClick={() => onBrowse('workshop')}
            className="rounded-md px-1 py-2 hover:text-indigo-800 aria-[current=page]:text-indigo-700 aria-[current=page]:underline">Workshop</button>
        </div>}
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitch />
          {!login && <Link href="/masuk" className="rounded-lg px-1.5 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-50 sm:px-3 sm:text-sm">{t('Masuk', 'Sign in')}</Link>}
          <Link href="/daftar" aria-current={signup ? 'page' : undefined} className={`${primary} rounded-full px-2.5 py-2 text-xs font-bold sm:px-4 sm:text-sm`}>{t('Daftar', 'Sign up')}</Link>
        </div>
      </nav>
    </header>
  );
}
