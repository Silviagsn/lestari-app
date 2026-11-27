'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Building2 } from 'lucide-react';
import { signupPath } from '../utils/signup';
import { useLanguage } from './Language';
import { PublicHeader } from './PublicHome';

export default function AccountTypePicker() {
  const { t } = useLanguage();
  const choices = [
    {
      icon: Briefcase, href: signupPath.jobseeker,
      title: t('Pencari Kerja', 'Job Seeker'),
      description: t('Cari dan simpan lowongan, kirim lamaran, dan ikuti workshop.', 'Find and save jobs, send applications, and join workshops.'),
      color: 'bg-indigo-100 text-indigo-800',
    },
    {
      icon: Building2, href: signupPath.company,
      title: t('Perusahaan', 'Employer'),
      description: t('Terbitkan lowongan inklusif dan tinjau pelamar dari dasbor rekrutmen.', 'Publish inclusive jobs and review applicants in your recruitment dashboard.'),
      color: 'bg-violet-100 text-violet-800',
    },
  ];

  return <>
    <PublicHeader signup />
    <main className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-violet-100 px-4 py-12 text-slate-950 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t('Pilih jenis akun', 'Choose your account type')}</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-slate-700 sm:text-base">
          {t('Pilih akun sesuai kebutuhanmu untuk melanjutkan pendaftaran.', 'Choose the account that fits your needs to continue signing up.')}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {choices.map(({ icon: Icon, href, title, description, color }) => (
            <Link href={href} key={href}
              className="group flex min-w-0 flex-col rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm shadow-indigo-950/5 hover:border-indigo-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 sm:p-6">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}><Icon aria-hidden="true" className="h-6 w-6" /></span>
              <h2 className="mt-4 text-lg font-bold">{title}</h2>
              <p className="mb-4 mt-1.5 flex-1 text-sm leading-relaxed text-slate-700">{description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-800 group-hover:underline">
                {t('Lanjutkan', 'Continue')}<ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  </>;
}
