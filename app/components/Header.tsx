'use client';

import { useEffect, useState } from 'react';
import { EarOff, KeyRound, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react';
import type { Profile } from '../utils/profile';
import { LanguageSwitch, useLanguage } from './Language';
import SidebarAccount from './SidebarAccount';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  features: Array<{ id: string; title: string; page: string }>;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
}

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700';

export default function Header({ currentPage, setCurrentPage, features, onLogout, theme, onThemeChange }: HeaderProps) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [identity, setIdentity] = useState<Pick<Profile, 'displayName' | 'email'>>();
  const navigation = [
    { id: 'home', page: 'home', label: t('Beranda', 'Home') },
    ...features.map(feature => ({
      ...feature, label: feature.page === 'job-portal' ? t('Lowongan Kerja', 'Job Portal') : t('Workshop', 'Workshops'),
    })),
  ];
  const themeLabel = theme === 'dark' ? t('Aktifkan mode terang', 'Switch to light mode') : t('Aktifkan mode gelap', 'Switch to dark mode');
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const initials = identity?.displayName.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();
  const accountAction = `flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold hover:bg-indigo-50 ${focus}`;

  useEffect(() => {
    if (!accountOpen) return;
    const controller = new AbortController();
    fetch('/api/profile', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return;
        const profile: Profile = await response.json();
        if (!controller.signal.aborted) setIdentity({ displayName: profile.displayName, email: profile.email });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [accountOpen]);

  function navigate(page: string) {
    setMobileMenuOpen(false);
    setCurrentPage(page);
  }

  function links() {
    return navigation.map(({ id, page, label }) => <button key={id} type="button" onClick={() => navigate(page)}
      aria-current={currentPage === page ? 'page' : undefined}
      className={`min-h-10 rounded-full px-3 py-2 text-left text-sm font-semibold hover:bg-indigo-50 ${focus} ${currentPage === page ? 'bg-indigo-100 text-indigo-900' : 'text-slate-700'}`}>
      {label}
    </button>);
  }

  return <header className="sticky top-0 z-50 border-b border-indigo-100 bg-white/90 shadow-sm backdrop-blur">
    <div className="mx-auto max-w-7xl px-1.5 sm:px-6 lg:px-8">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-1.5 gap-y-1 py-1.5 sm:gap-4">
        <button type="button" onClick={() => navigate('home')} className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl sm:gap-2.5 ${focus}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-sm sm:h-10 sm:w-10">
            <EarOff aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-indigo-800 sm:text-xl">Lestari</span>
        </button>
        <nav aria-label={t('Navigasi utama', 'Main navigation')} className="ml-auto hidden items-center gap-1 lg:flex">{links()}</nav>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2 lg:ml-0">
          <LanguageSwitch />
          <button type="button" onClick={onThemeChange} aria-label={themeLabel} title={themeLabel}
            className={`grid h-11 w-10 shrink-0 place-items-center rounded-full border border-indigo-100 bg-white text-indigo-800 hover:bg-indigo-50 sm:w-11 ${focus}`}>
            <ThemeIcon aria-hidden="true" className="h-5 w-5" />
          </button>
          <SidebarAccount inHeader onOpenChange={setAccountOpen} summary={<>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-900 sm:h-7 sm:w-7">
              {initials || <User aria-hidden="true" className="h-4 w-4" />}
            </span>
            <span className="sr-only text-sm font-bold sm:not-sr-only">{t('Profil', 'Profile')}</span>
          </>}>
            {close => <>
              <div className="border-b border-indigo-100 px-3 py-2.5">
                <p className="text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">{identity?.displayName || t('Akun Lestari', 'Lestari account')}</p>
                {identity?.email && <p className="mt-0.5 text-xs text-slate-600 [overflow-wrap:anywhere]">{identity.email}</p>}
              </div>
              <button type="button" aria-current={currentPage === 'profile' ? 'page' : undefined} onClick={() => { close(); navigate('profile'); }} className={`${accountAction} mt-1 text-indigo-950`}>
                <User aria-hidden="true" className="h-4 w-4" />{t('Profil Saya', 'My Profile')}
              </button>
              <button type="button" aria-current={currentPage === 'password' ? 'page' : undefined} onClick={() => { close(); navigate('password'); }} className={`${accountAction} text-indigo-950`}>
                <KeyRound aria-hidden="true" className="h-4 w-4" />{t('Ubah Kata Sandi', 'Change Password')}
              </button>
              <div className="mt-1 border-t border-indigo-100 pt-1">
                <button type="button" onClick={() => { close(); setMobileMenuOpen(false); onLogout(); }} className={`${accountAction} text-rose-700 hover:bg-rose-50`}>
                  <LogOut aria-hidden="true" className="h-4 w-4" />{t('Keluar', 'Sign out')}
                </button>
              </div>
            </>}
          </SidebarAccount>
          <button type="button" onClick={() => setMobileMenuOpen(open => !open)}
            aria-label={mobileMenuOpen ? t('Tutup menu', 'Close menu') : t('Buka menu', 'Open menu')} aria-expanded={mobileMenuOpen}
            aria-controls="mobile-header-navigation"
            className={`grid h-10 w-8 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-indigo-50 sm:w-10 lg:hidden ${focus}`}>
            {mobileMenuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && <nav id="mobile-header-navigation" aria-label={t('Navigasi utama', 'Main navigation')}
        className="flex flex-wrap gap-1 border-t border-indigo-100 pb-3 pt-2 lg:hidden">{links()}</nav>}
    </div>
  </header>;
}
