'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Bot, Briefcase, ChevronLeft, ChevronRight, HelpCircle, Mic, User, X } from 'lucide-react';
import { useLanguage } from './Language';

const topics = [
  {
    page: 'job-portal', icon: Briefcase, title: ['Melamar lowongan', 'Apply for a job'],
    instructions: [
      ['Buka Lowongan Kerja dan cari posisi yang kamu minati. Gunakan filter untuk mempersempit hasil.', 'Open Job Listings, search for a role, and use the filters to narrow your results.'],
      ['Buka detail lowongan dan cek persyaratan serta dukungan aksesibilitas, lalu pilih Lamar pekerjaan ini.', 'Open the job details, review the requirements and accessibility support, then select Apply for this Job.'],
      ['Isi data lamaran dan preferensi komunikasi, lalu pilih Simpan Lamaran. Ikuti petunjuk di formulir jika perusahaan menerima lamaran lewat email.', 'Enter your application details and communication preference, then select Save Application. Follow the form instructions if the employer accepts applications by email.'],
    ],
    action: ['Buka Lowongan Kerja', 'Open Job Listings'],
  },
  {
    page: 'workshop', icon: BookOpen, title: ['Ikut workshop', 'Join a workshop'],
    instructions: [
      ['Buka Workshop dan pilih topik yang ingin kamu pelajari.', 'Open Workshops and choose a topic you want to learn.'],
      ['Pilih Lihat detail untuk mengecek materi, jadwal, dan dukungan aksesibilitas.', 'Select View details to review the content, schedule, and accessibility support.'],
      ['Pilih Daftar workshop dan ikuti petunjuk yang muncul.', 'Select Enroll in Workshop and follow the instructions.'],
    ],
    action: ['Buka Workshop', 'Open Workshops'],
  },
  {
    page: 'profile', icon: User, title: ['Lengkapi profil', 'Complete your profile'],
    instructions: [
      ['Buka Profil, lalu pilih Edit profil.', 'Open Profile and select Edit profile.'],
      ['Tambahkan informasi diri, keterampilan, dan preferensi komunikasi. Simpan perubahan setelah selesai.', 'Add your personal details, skills, and communication preference. Save your changes when finished.'],
      ['Untuk menambah foto, pilih tombol kamera di foto profil.', 'To add a photo, select the camera button on your profile picture.'],
    ],
    action: ['Buka Profil', 'Open Profile'],
  },
  {
    page: 'mental-health', icon: Bot, title: ['Chat dengan Lesbot', 'Chat with Lesbot'],
    instructions: [
      ['Pilih Chat Lesbot di pojok kanan bawah.', 'Select Chat with Lesbot in the bottom-right corner.'],
      ['Ketik pesan atau pilih topik yang tersedia, lalu kirim untuk memulai percakapan dengan Lesbot.', 'Type a message or pick a suggested topic, then send it to start a conversation with Lesbot.'],
    ],
    action: ['Buka Chat Lesbot', 'Open Lesbot'],
  },
  {
    page: 'speech-to-text', icon: Mic, title: ['Gunakan Bantu Komunikasi', 'Use Communication Aid'],
    instructions: [
      ['Pilih Bantu Komunikasi di pojok kanan bawah.', 'Select Communication Aid in the bottom-right corner.'],
      ['Pilih Mulai rekam dan izinkan akses mikrofon jika browser memintanya.', 'Select Start listening and allow microphone access if your browser asks.'],
      ['Minta lawan bicara berbicara ke mikrofon, lalu baca teks yang muncul.', 'Ask the other person to speak into the microphone, then read the resulting text.'],
    ],
    action: ['Buka Bantu Komunikasi', 'Open Communication Aid'],
  },
] as const;

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';
const secondary = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-indigo-100 px-3 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-45 ${focusRing}`;

export default function WebsiteGuide({ navigate }: { navigate: (page: string) => void }) {
  const { t } = useLanguage();
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const { page, icon: Icon, title, instructions, action } = topics[index];

  useEffect(() => {
    if (dialog.current?.open) heading.current?.focus();
  }, [index]);

  return <>
    <button type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 px-6 py-3 font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-violet-800 ${focusRing}`}>
      <HelpCircle aria-hidden="true" className="h-5 w-5" />{t('Panduan Lestari', 'Lestari Guide')}
    </button>
    <dialog ref={dialog} aria-labelledby={titleId} onClose={() => setIndex(0)}
      className="m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-indigo-100 bg-white text-left text-slate-950 shadow-2xl backdrop:bg-slate-950/50">
      <div className="p-4 sm:p-6">
        <header className="flex items-start justify-between gap-3 border-b border-indigo-100 pb-4">
          <div>
            <h2 id={titleId} className="text-xl font-extrabold text-indigo-950">{t('Panduan Lestari', 'Lestari Guide')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('Pilih topik yang ingin kamu pelajari.', 'Choose a topic you want to learn.')}</p>
          </div>
          <button type="button" aria-label={t('Tutup panduan', 'Close guide')} onClick={() => dialog.current?.close()}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-900 hover:bg-indigo-100 ${focusRing}`}><X aria-hidden="true" className="h-5 w-5" /></button>
        </header>
        <nav aria-label={t('Topik panduan', 'Guide topics')} className="mt-4 flex flex-wrap gap-2">
          {topics.map((topic, position) => <button key={topic.page} type="button" aria-current={index === position ? 'step' : undefined}
            onClick={() => setIndex(position)}
            className={`min-h-10 rounded-xl px-2.5 py-2 text-xs font-semibold sm:text-sm ${focusRing} ${index === position ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-950 hover:bg-indigo-100'}`}>
            {t(topic.title[0], topic.title[1])}
          </button>)}
        </nav>
        <section className="my-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
          <h3 ref={heading} tabIndex={-1} className="flex items-center gap-2 text-lg font-bold text-indigo-950 focus:outline-none">
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-indigo-700" />{t(title[0], title[1])}
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700 marker:font-semibold marker:text-indigo-700">
            {instructions.map(([id, en]) => <li key={id}>{t(id, en)}</li>)}
          </ol>
          <button type="button" onClick={() => { dialog.current?.close(); navigate(page); }}
            className={`mt-4 inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl bg-indigo-700 px-3 text-left text-sm font-semibold text-white hover:bg-indigo-800 ${focusRing}`}>
            {t(action[0], action[1])}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </button>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className={secondary}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />{t('Sebelumnya', 'Previous')}
          </button>
          <span className="text-xs text-slate-600">{t(`${index + 1} dari ${topics.length}`, `${index + 1} of ${topics.length}`)}</span>
          {index === topics.length - 1
            ? <button type="button" className={secondary} onClick={() => dialog.current?.close()}>{t('Selesai', 'Done')}</button>
            : <button type="button" className={secondary} onClick={() => setIndex(index + 1)}>{t('Berikutnya', 'Next')}<ChevronRight aria-hidden="true" className="h-4 w-4" /></button>}
        </footer>
      </div>
    </dialog>
  </>;
}
