import Link from 'next/link';
import { ArrowLeft, ArrowRight, Briefcase, Building2, EarOff, GraduationCap, Hand, Users } from 'lucide-react';
import { googleConfig } from '../server/google';
import { googleErrors, signupPath, type SignupRole } from '../utils/signup';
import SignupForm from './SignupForm';

const pages = {
  jobseeker: {
    title: 'Daftar sebagai pencari kerja',
    description: 'Buat profil karier untuk menyimpan lowongan, melamar pekerjaan, dan mengikuti workshop.',
    panel: 'from-indigo-950 via-indigo-900 to-violet-800 text-white',
    background: 'bg-[#eef1fc]',
    iconStyle: 'border-white/35 bg-white/15',
    secondaryText: 'text-white/90',
    itemDivider: 'border-white/20',
    linkStyle: 'text-white',
    icon: Briefcase,
    items: [
      { icon: Briefcase, title: 'Temukan peluang kerja', description: 'Cari lowongan dan simpan posisi yang menarik.' },
      { icon: GraduationCap, title: 'Bangun keterampilan', description: 'Ikuti workshop sesuai minat dan tujuan kariermu.' },
      { icon: Hand, title: 'Pilih cara berkomunikasi', description: 'Cantumkan preferensi seperti chat tertulis atau BISINDO di profilmu.' },
    ],
    alternate: 'Daftar sebagai perusahaan',
  },
  company: {
    title: 'Daftar sebagai perusahaan',
    description: 'Buat profil pemberi kerja dengan informasi perusahaan dan dukungan aksesibilitas bagi pelamar.',
    panel: 'from-[#edf4ff] via-[#e6eaff] to-[#eee2fc] text-indigo-950 shadow-sm ring-1 ring-inset ring-indigo-100',
    background: 'bg-gradient-to-br from-[#eef4ff] via-[#f9faff] to-[#f3ecfc]',
    iconStyle: 'border-indigo-200 bg-white/70 text-indigo-700',
    secondaryText: 'text-slate-700',
    itemDivider: 'border-indigo-200',
    linkStyle: 'text-indigo-800 hover:text-violet-800',
    icon: Building2,
    items: [
      { icon: Building2, title: 'Perkenalkan perusahaan', description: 'Jelaskan bidang usaha, lokasi kantor, dan aktivitas tim.' },
      { icon: Users, title: 'Gunakan email kerja', description: 'Pilih alamat yang bisa diakses oleh penanggung jawab akun.' },
      { icon: Hand, title: 'Jelaskan dukungan aksesibilitas', description: 'Cantumkan opsi komunikasi atau penyesuaian proses rekrutmen yang tersedia.' },
    ],
    alternate: 'Daftar sebagai pencari kerja',
  },
} as const;

export default function RegistrationPage({ role, googleError }: { role: SignupRole; googleError?: string }) {
  const page = pages[role];
  const Icon = page.icon;
  const alternate = signupPath[role === 'jobseeker' ? 'company' : 'jobseeker'];

  return (
    <main className={`min-h-screen px-4 py-5 text-slate-950 sm:px-6 sm:py-8 ${page.background}`}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl text-xl font-extrabold tracking-tight text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
              <EarOff aria-hidden="true" className="h-5 w-5" />
            </span>
            Lestari
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Kembali ke login
          </Link>
        </header>
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
          <SignupForm role={role} googleAvailable={Boolean(googleConfig())}
            googleError={googleError && Object.hasOwn(googleErrors, googleError) ? googleErrors[googleError] : undefined} />
        </div>
      </div>
    </main>
  );
}
