'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicHeader, type PublicCatalog } from './PublicHeader';
import { useLanguage } from './Language';
import Header from './Header';
import ChangePasswordPage from './ChangePasswordPage';
import HomePage from './HomePage';
import JobPortalPage from './JobPortal';
import WorkshopPage from './Workshop';
import FloatingTools, { type FloatingTool } from './FloatingTools';
import GoogleButton from './GoogleButton';
import ProfilePage from './ProfilePage';
import CompanyPortal from './CompanyPortal';
import AdminPortal from './AdminPortal';
import { googleErrorMessage, isSignupRole, signupPath } from '../utils/signup';
import { features } from './Features';
import { ArrowRight, X, Lock, Mail, EarOff, CheckCircle2, ShieldCheck, Briefcase } from 'lucide-react';

export default function LestariApp({ initialLogin = false }: { initialLogin?: boolean }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(initialLogin);
  const [currentPage, setCurrentPage] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTool, setActiveTool] = useState<FloatingTool | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 3 Kategori Role: 'jobseeker' | 'company' | 'admin'
  const [role, setRole] = useState<'jobseeker' | 'company' | 'admin'>('jobseeker');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState('');
  const [oauthError, setOauthError] = useState<string>();
  const [registered, setRegistered] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const loginError = authError ? t(authError, 'Could not sign in. Check your details and try again.') : googleErrorMessage(oauthError, locale);

  useEffect(() => {
    try {
      if (localStorage.getItem('lestari.theme') === 'dark') setTheme('dark');
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('lestari.theme', next); } catch {}
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signupRole = params.get('role');
    const googleError = params.get('google');
    if (isSignupRole(signupRole)) setRole(signupRole);
    if (googleError) setOauthError(googleError);
    if (params.get('registered') === '1') {
      try {
        setEmail(sessionStorage.getItem('lestari.registeredEmail') ?? '');
        sessionStorage.removeItem('lestari.registeredEmail');
      } catch {}
      setRegistered(true);
    }
    if (googleError || params.has('registered')) {
      setShowLogin(true);
      if (initialLogin) window.history.replaceState(null, '', '/masuk');
    }

    const controller = new AbortController();
    fetch('/api/session', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const session = await response.json();
        setGoogleAvailable(session.googleAvailable === true);
        if (session.role) {
          setRole(session.role);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setAuthError('Sesi gagal diperiksa. Silakan coba masuk.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingSession(false);
      });
    return () => controller.abort();
  }, [initialLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPending) return;
    setAuthPending(true);
    setAuthError('');
    setRegistered(false);
    setOauthError(undefined);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, role }),
      });
      const session = await response.json();
      if (!response.ok) {
        setAuthError(session.error ?? 'Gagal masuk. Silakan coba lagi.');
        return;
      }
      setRole(session.role);
      setPassword('');
      setIsAuthenticated(true);
    } catch {
      setAuthError('Gagal masuk. Silakan coba lagi.');
    } finally {
      setAuthPending(false);
    }
  };

  const handleLogout = async () => {
    if (authPending) return;
    setAuthPending(true);
    setAuthError('');
    try {
      const response = await fetch('/api/session', { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setIsAuthenticated(false);
      setCurrentPage('home');
      setActiveTool(null);
      setEmail('');
      setRole('jobseeker');
    } catch {
      setAuthError('Gagal keluar. Silakan coba lagi.');
    } finally {
      setAuthPending(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && showLogin) router.replace('/');
  }, [isAuthenticated, showLogin, router]);

  function browsePublicPage(page: PublicCatalog | 'home') {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }

  const publicCatalog = currentPage === 'job-portal' || currentPage === 'workshop' ? currentPage : undefined;
  if (!isAuthenticated && !showLogin) return <>
    <PublicHeader catalog={publicCatalog} onBrowse={browsePublicPage} />
    <main>
      {publicCatalog === 'job-portal' ? <JobPortalPage guest /> :
        publicCatalog === 'workshop' ? <WorkshopPage guest /> :
        <HomePage onBrowse={browsePublicPage} />}
    </main>
  </>;

  // Tampilan Login
  if (!isAuthenticated) {
    return (
      <>
      <PublicHeader login />
      <main className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-[#EEF2FF] p-4 sm:p-6 lg:p-8">

        {/* Bulatan (Blob) Background Estetik Persis Homepage */}
        <div className="absolute top-5 left-5 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-purple-300/40 rounded-full blur-[90px] sm:blur-[110px] pointer-events-none"></div>
        <div className="absolute bottom-5 right-5 w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] bg-pink-300/40 rounded-full blur-[90px] sm:blur-[110px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Outer Container Glassmorphism */}
        <div className="w-full max-w-md lg:max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 lg:bg-white/40 lg:backdrop-blur-2xl lg:border lg:border-white/60 lg:p-10 lg:rounded-[3rem] lg:shadow-2xl lg:shadow-indigo-500/10">

          {/* SISI KIRI: Branding (Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between py-2 lg:pr-6 h-full min-h-[480px]">

            {/* Logo Persis Homepage */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/20">
                <EarOff className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Lestari
              </span>
            </div>

            {/* Konten Teks */}
            <div className="my-auto py-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('Platform untuk komunitas Tuli', 'A platform for the Deaf community')}
              </div>

              <h1 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                {t('Mendukung', 'Empowering the')} <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('Komunitas Tuli', 'Deaf Community')}
                </span>
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {t("Platform inklusif komprehensif pertama yang dirancang khusus untuk komunitas Tuli. Temukan peluang kerja, belajar keahlian baru, dan akses layanan pendukung karir.", "An inclusive platform for the Deaf community. Find work, build skills, and access career support.")}
              </p>

              {/* Badge Fitur */}
              <div className="flex flex-wrap gap-2.5">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-white shadow-sm text-xs font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" /> {t('Mengutamakan visual', 'Visual first')}
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-white shadow-sm text-xs font-medium text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-purple-600" /> {t('Dukungan BISINDO', 'BISINDO support')}
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-white shadow-sm text-xs font-medium text-slate-700">
                  <Briefcase className="w-4 h-4 text-pink-600" /> {t('Kesempatan setara', 'Equal opportunity')}
                </div>
              </div>
            </div>

            <div></div>
          </div>

          {/* SISI KANAN / UTAMA DI MOBILE: Card Login */}
          <div className="w-full lg:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/90 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-indigo-500/10">

              {/* Header Mobile: Logo di Kiri, Judul Login di Tengah */}
                <div className="lg:hidden flex items-center justify-start space-x-2.5 mb-5">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
                    <EarOff className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                    Lestari
                  </span>
                </div>

                <div className="mb-6 text-center">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {t("Masuk ke Lestari", "Sign in to Lestari")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {role === 'jobseeker' && t("Masuk untuk menjelajahi portal karir.", "Sign in to explore the career portal.")}
                    {role === 'company' && t("Masuk dengan akun perusahaan.", "Sign in with your employer account.")}
                    {role === 'admin' && t("Masuk dengan akun admin.", "Sign in with your administrator account.")}
                  </p>
                </div>

              {/* Role Selector Tabs (3 Kategori) */}
              <div className="grid grid-cols-3 bg-slate-100/80 p-1 rounded-2xl mb-6 text-[11px] sm:text-xs font-semibold border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setRole('jobseeker')}
                  aria-pressed={role === 'jobseeker'}
                  className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer truncate ${role === 'jobseeker' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {t("Pencari Kerja", "Job Seeker")}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('company')}
                  aria-pressed={role === 'company'}
                  className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer truncate ${role === 'company' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {t("Perusahaan", "Employer")}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  aria-pressed={role === 'admin'}
                  className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer truncate ${role === 'admin' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Admin
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {registered && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">{t('Akun berhasil dibuat. Masuk dengan kata sandi yang kamu buat.', 'Your account is ready. Sign in with the password you created.')}</p>}
                {loginError && <p role="alert" className="text-sm text-red-700">{loginError}</p>}

                {/* Email / Identifier */}
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {role === 'company' ? t("Email atau nomor telepon", "Email or phone number") : 'Email'}
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="text"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-200/80 pl-11 pr-4 py-3.5 text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition font-medium placeholder-slate-400"
                      placeholder={role === 'company' ? 'name@company.com / 08xxxx' : 'name@email.com'}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t("Kata sandi", "Password")}
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-semibold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                    >
                      {t("Lupa kata sandi?", "Forgot your password?")}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-200/80 pl-11 pr-4 py-3.5 text-xs sm:text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition font-medium placeholder-slate-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={authPending || checkingSession}
                  className="w-full mt-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-4 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition transform active:scale-[0.98] flex items-center justify-center space-x-2 group cursor-pointer"
                >
                  <span>{authPending ? t("Sedang masuk…", "Signing in…") : t("Masuk", "Sign in")}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

              </form>

              {role !== 'admin' && googleAvailable && (
                <div className="mt-3"><GoogleButton role={role} intent="login" /></div>
              )}
              <div className="mt-5 text-center text-sm text-slate-600">
                {role === 'admin' ? (
                  <span>{t("Login khusus admin Lestari.", "Lestari administrator access.")}</span>
                ) : (
                  <>
                    <p>{t("Belum punya akun?", "New to Lestari?")}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-x-4">
                      <Link href={signupPath.jobseeker} className="inline-flex min-h-9 items-center rounded-md text-xs font-semibold text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">{t("Daftar Pencari Kerja", "Sign up as a job seeker")}</Link>
                      <Link href={signupPath.company} className="inline-flex min-h-9 items-center rounded-md text-xs font-semibold text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">{t("Daftar Perusahaan", "Sign up as an employer")}</Link>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Modal Bantuan */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div role="dialog" aria-modal="true" aria-labelledby="reset-password-title" className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setShowForgotPassword(false)}
                aria-label={t("Tutup bantuan kata sandi", "Close password help")}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div aria-hidden="true" className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 id="reset-password-title" className="text-xl font-bold mb-2">{t("Lupa kata sandi", "Forgot your password")}</h3>
              <p className="text-sm text-slate-600 mb-6">
                {t("Hubungi administrator Lestari untuk memulihkan akses akunmu.", "Contact the Lestari administrator to recover access to your account.")}
              </p>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition cursor-pointer"
              >
                {t("Tutup", "Close")}
              </button>
            </div>
          </div>
        )}

      </main>
      </>
    );
  }

  if (role === 'admin') {
    return <AdminPortal logout={handleLogout} authError={authError} />;
  }

  if (role === 'company') {
    return (
      <div className="pb-16">
        <CompanyPortal logout={handleLogout} authError={authError} />
        <FloatingTools active={activeTool} onChange={setActiveTool} />
      </div>
    );
  }

  // Navigasi Halaman
  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return <ProfilePage onNavigate={setCurrentPage} />;
      case 'password':
        return <ChangePasswordPage onBack={() => setCurrentPage('profile')} />;
      case 'job-portal':
        return <JobPortalPage />;
      case 'workshop':
        return <WorkshopPage />;
      default:
        return <HomePage setCurrentPage={page => {
          if (page === 'mental-health' || page === 'speech-to-text') setActiveTool(page);
          else setCurrentPage(page);
        }} />;
    }
  };

  // Tampilan Utama Setelah Login
  return (
    <div className="lestari-portal min-h-screen bg-[#EEF2FF] pb-16" data-theme={theme}>
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        features={features.filter(feature => feature.page !== 'mental-health' && feature.page !== 'speech-to-text')}
        onLogout={handleLogout}
        theme={theme}
        onThemeChange={toggleTheme}
      />
      {authError && <p role="alert" className="p-4 text-center text-sm text-red-700">{authError}</p>}
      {renderPage()}
      <FloatingTools active={activeTool} onChange={setActiveTool} />
    </div>
  );
}
