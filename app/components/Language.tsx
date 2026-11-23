'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Globe } from 'lucide-react';

type Locale = 'id' | 'en';
const localeKey = 'lestari.language';
const LanguageContext = createContext({ locale: 'id' as Locale, setLocale: (_locale: Locale) => {}, t: (id: string, _en: string) => id });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('id');
  useEffect(() => {
    try { if (localStorage.getItem(localeKey) === 'en') setLocale('en'); } catch {}
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  function changeLocale(value: Locale) {
    setLocale(value);
    try { localStorage.setItem(localeKey, value); } catch {}
  }
  return <LanguageContext.Provider value={{ locale, setLocale: changeLocale, t: (id, en) => locale === 'id' ? id : en }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage();
  return <div role="group" aria-label={t('Bahasa situs', 'Site language')} className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-indigo-100 bg-white p-1 text-slate-700">
    <Globe aria-hidden="true" className="mx-1 hidden h-4 w-4 text-indigo-700 sm:block" />
    {(['id', 'en'] as const).map(value => <button key={value} type="button" aria-pressed={locale === value}
      aria-label={value === 'id' ? 'Bahasa Indonesia' : 'English'} lang={value} onClick={() => setLocale(value)}
      className={`rounded-full px-2 py-1.5 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 ${locale === value ? 'bg-indigo-700 text-white' : 'hover:bg-indigo-50'}`}>
      {value.toUpperCase()}
    </button>)}
  </div>;
}
