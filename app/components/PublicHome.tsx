'use client';

import Link from 'next/link';
import { Accessibility, ArrowRight, Briefcase, EarOff, GraduationCap, MessageCircle, Mic, MoveUpRight } from 'lucide-react';
import { LanguageSwitch, useLanguage } from './Language';

const action = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700';
const primary = 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md shadow-purple-500/20 hover:from-indigo-800 hover:to-purple-800';

export function PublicHeader({ login = false, signup = false }: { login?: boolean; signup?: boolean }) {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100 bg-slate-50/95 backdrop-blur">
      <nav aria-label={t('Navigasi utama', 'Main navigation')} className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl text-lg font-extrabold text-indigo-900 sm:text-xl">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-md shadow-purple-500/20 sm:h-10 sm:w-10"><EarOff aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" /></span>
          <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Lestari</span>
        </Link>
        <div className="hidden gap-6 font-semibold text-slate-700 md:flex">
          <Link href="/" className="hover:text-indigo-800">{t('Beranda', 'Home')}</Link>
          <Link href="/#fitur" className="hover:text-indigo-800">{t('Jelajahi fitur', 'Explore features')}</Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitch />
          {!login && <Link href="/masuk" className="rounded-lg px-1.5 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-50 sm:px-3 sm:text-sm">{t('Masuk', 'Sign in')}</Link>}
          <Link href="/daftar" aria-current={signup ? 'page' : undefined} className={`${primary} rounded-full px-2.5 py-2 text-xs font-bold sm:px-4 sm:text-sm`}>{t('Daftar', 'Sign up')}</Link>
        </div>
      </nav>
    </header>
  );
}

export default function PublicHome() {
  const { t } = useLanguage();
  const offerings = [
    { icon: Briefcase, title: t('Lowongan Kerja', 'Job Portal'), description: t('Jelajahi lowongan dan lihat dukungan aksesibilitas sebelum melamar.', 'Explore jobs and check workplace accessibility before applying.') },
    { icon: GraduationCap, title: t('Workshop', 'Workshops'), description: t('Temukan pelatihan sesuai minat dan pelajari keterampilan baru.', 'Find training that matches your interests and build new skills.') },
    { icon: MessageCircle, title: 'Chat Lesbot', description: t('Buka ruang ngobrol dengan pendamping AI saat kamu membutuhkan dukungan.', 'Open a chat with an AI companion when you need support.') },
    { icon: Mic, title: t('Bantu Komunikasi', 'Communication Aid'), description: t('Baca ucapan sebagai teks saat berkomunikasi.', 'Read speech as text during conversations.') },
  ];

  return <>
    <PublicHeader />
    <main className="bg-gradient-to-b from-white to-[#f7f4fc] text-slate-950">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#f1f4fc] via-white to-[#fbf6fc]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-300 to-violet-400 opacity-55 blur-[64px] sm:h-96 sm:w-96" />
          <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-fuchsia-300 to-pink-400 opacity-45 blur-[66px] sm:h-80 sm:w-80" />
          <div className="absolute -bottom-24 left-[5%] h-56 w-56 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 opacity-55 blur-[58px] sm:h-80 sm:w-80" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-9 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#087d4f] to-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-800/15 sm:text-sm">
              <Accessibility aria-hidden="true" className="h-4 w-4 shrink-0" />{t('Platform inklusif untuk komunitas Tuli', 'An inclusive platform for the Deaf community')}
            </p>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">{t('Peluang kerja dan belajar', 'Work and learning opportunities')} <span className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">{t('yang lebih aksesibel', 'with accessibility in mind')}</span></h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-700 sm:text-lg">{t('Temukan lowongan, ikuti workshop, dan gunakan alat bantu komunikasi di satu tempat. Perusahaan juga bisa membuka lowongan yang lebih inklusif.', 'Find jobs, join workshops, and use communication tools in one place. Employers can also publish more inclusive job listings.')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/daftar" className={`${action} ${primary}`}>{t('Buat akun', 'Create an account')} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              <Link href="#fitur" className={`${action} border border-indigo-500 bg-white text-indigo-800 shadow-sm hover:bg-indigo-50`}>{t('Jelajahi Lestari', 'Explore Lestari')}</Link>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-white bg-white/80 p-5 text-slate-950 shadow-xl shadow-indigo-900/10 backdrop-blur sm:p-7">
            <div aria-hidden="true" className="absolute -right-16 -top-16 -z-10 h-52 w-52 rounded-full border-[1.75rem] border-violet-100" />
            <h2 className="text-xl font-bold">{t('Jelajahi dari satu akun', 'Explore with one account')}</h2>
            <div className="mt-4 grid gap-2.5">
              {offerings.map(({ icon: Icon, title }) => <Link key={title} href="#fitur" className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-3 text-sm font-semibold text-indigo-950 hover:border-purple-400">
                <Icon aria-hidden="true" className="h-5 w-5 text-indigo-700" /> <span className="flex-1">{title}</span><MoveUpRight aria-hidden="true" className="h-3.5 w-3.5 text-purple-700" />
              </Link>)}
            </div>
          </div>
        </div>
      </section>
      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-3xl font-extrabold tracking-tight">{t('Apa yang bisa kamu lakukan di Lestari?', 'What can you do with Lestari?')}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {offerings.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <Icon aria-hidden="true" className="mb-4 h-6 w-6 text-indigo-700" />
            <h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          </article>)}
        </div>
      </section>
    </main>
  </>;
}
