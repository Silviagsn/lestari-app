'use client';

import Image from 'next/image';
import type { SignupRole } from '../utils/signup';
import { useLanguage } from './Language';

export default function GoogleButton({ role, intent, available = true }: {
  role: SignupRole;
  intent: 'login' | 'signup';
  available?: boolean;
}) {
  const { t } = useLanguage();
  const style = 'inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#747775] bg-white px-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';
  const content = <>
    <Image src="/google-g.png" alt="" width={18} height={18} unoptimized loading="eager" />
    {intent === 'signup' ? t('Daftar dengan Google', 'Sign up with Google') : t('Masuk dengan Google', 'Sign in with Google')}
  </>;
  return available ? (
    <a className={style} href={`/api/auth/google/start?role=${role}&intent=${intent}`}>{content}</a>
  ) : (
    <button type="button" disabled className={`${style} cursor-not-allowed opacity-60`}>{content}</button>
  );
}
