'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, GraduationCap, Hand, Users } from 'lucide-react';
import { PublicHeader } from './PublicHeader';
import { useLanguage } from './Language';
import { googleErrorMessage, signupPath, type SignupRole } from '../utils/signup';
import SignupForm from './SignupForm';

const registrationPages = (t: (id: string, en: string) => string) => ({
  jobseeker: {
    title: t("Daftar sebagai pencari kerja", "Sign up as a job seeker"),
    description: t("Buat profil karier untuk menyimpan lowongan, melamar pekerjaan, dan mengikuti workshop.", "Create a career profile to save jobs, apply, and join workshops."),
    panel: 'from-indigo-950 via-indigo-900 to-violet-800 text-white',
    background: 'bg-[#eef1fc]',
    iconStyle: 'border-white/35 bg-white/15',
    secondaryText: 'text-white/90',
    itemDivider: 'border-white/20',
    linkStyle: 'text-white',
    icon: Briefcase,
    items: [
      { icon: Briefcase, title: t("Temukan peluang kerja", "Find job opportunities"), description: t("Cari lowongan dan simpan posisi yang menarik.", "Search for jobs and save roles you like.") },
      { icon: GraduationCap, title: t("Bangun keterampilan", "Build new skills"), description: t("Ikuti workshop sesuai minat dan tujuan kariermu.", "Join workshops that match your interests and career goals.") },
      { icon: Hand, title: t("Pilih cara berkomunikasi", "Choose how to communicate"), description: t("Cantumkan preferensi seperti chat tertulis atau BISINDO di profilmu.", "Add communication preferences such as written chat or BISINDO to your profile.") },
    ],
    alternate: t("Daftar sebagai perusahaan", "Sign up as an employer"),
  },
  company: {
    title: t("Daftar sebagai perusahaan", "Sign up as an employer"),
    description: t("Buat profil pemberi kerja dengan informasi perusahaan dan dukungan aksesibilitas bagi pelamar.", "Create an employer profile with company details and accessibility options for applicants."),
    panel: 'from-[#edf4ff] via-[#e6eaff] to-[#eee2fc] text-indigo-950 shadow-sm ring-1 ring-inset ring-indigo-100',
    background: 'bg-gradient-to-br from-[#eef4ff] via-[#f9faff] to-[#f3ecfc]',
    iconStyle: 'border-indigo-200 bg-white/70 text-indigo-700',
    secondaryText: 'text-slate-700',
    itemDivider: 'border-indigo-200',
    linkStyle: 'text-indigo-800 hover:text-violet-800',
    icon: Building2,
    items: [
      { icon: Building2, title: t("Perkenalkan perusahaan", "Introduce your company"), description: t("Jelaskan bidang usaha, lokasi kantor, dan aktivitas tim.", "Describe your industry, office location, and team activities.") },
      { icon: Users, title: t("Gunakan email kerja", "Use your work email"), description: t("Pilih alamat yang bisa diakses oleh penanggung jawab akun.", "Use an address accessible to the person managing this account.") },
      { icon: Hand, title: t("Jelaskan dukungan aksesibilitas", "Describe accessibility support"), description: t("Cantumkan opsi komunikasi atau penyesuaian proses rekrutmen yang tersedia.", "List communication options or accommodations available during recruitment.") },
    ],
    alternate: t("Daftar sebagai pencari kerja", "Sign up as a job seeker"),
  },
} as const);

export default function RegistrationView({ role, googleError, googleAvailable }: { role: SignupRole; googleError?: string; googleAvailable: boolean }) {
  const { t, locale } = useLanguage();
  const page = registrationPages(t)[role];
  const Icon = page.icon;
  const alternate = signupPath[role === 'jobseeker' ? 'company' : 'jobseeker'];

  return (
    <>
    <PublicHeader />
    <main className={`min-h-screen px-4 py-5 text-slate-950 sm:px-6 sm:py-8 ${page.background}`}>
      <div className="mx-auto max-w-6xl">

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-7">
          <section className={`rounded-[1.75rem] bg-gradient-to-br p-6 sm:p-8 lg:sticky lg:top-6 ${page.panel}`}>
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl border ${page.iconStyle}`}>
              <Icon aria-hidden="true" className="h-6 w-6" />
            </div>
            <h1 className="max-w-[14ch] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{page.title}</h1>
            <p className={`mt-3 max-w-md text-sm leading-relaxed sm:text-base ${page.secondaryText}`}>{page.description}</p>
            <ul className={`mt-6 hidden space-y-4 border-t pt-5 lg:block ${page.itemDivider}`}>
              {page.items.map(({ icon: ItemIcon, title, description }) => (
                <li key={title} className="flex gap-3">
                  <ItemIcon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${page.secondaryText}`} />
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className={`mt-0.5 text-sm leading-relaxed ${page.secondaryText}`}>{description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href={alternate} className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 lg:mt-6 ${page.linkStyle}`}>
              {page.alternate} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </section>
          <SignupForm role={role} googleAvailable={googleAvailable}
            googleError={googleErrorMessage(googleError, locale)} />
        </div>
      </div>
    </main>
    </>
  );
}
