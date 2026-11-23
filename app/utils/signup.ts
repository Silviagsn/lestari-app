import { editableProfile, type ProfileFields } from './profile';

export type SignupRole = 'jobseeker' | 'company';

export function isSignupRole(value: unknown): value is SignupRole {
  return value === 'jobseeker' || value === 'company';
}

export const signupPath: Record<SignupRole, string> = {
  jobseeker: '/daftar/pencari-kerja',
  company: '/daftar/perusahaan',
};

export function signupProfile(input: unknown, role: SignupRole): ProfileFields | null {
  const profile = editableProfile(input, role);
  if (!profile?.location) return null;
  if (role === 'jobseeker' && !profile.headline) return null;
  if (role === 'company' && (!profile.details.industry || !profile.about)) return null;
  return profile;
}

export const googleErrors: Record<string, string> = {
  unavailable: 'Pendaftaran Google belum tersedia. Kamu bisa menggunakan email dan kata sandi.',
  canceled: 'Koneksi Google dibatalkan. Kamu bisa mencoba lagi.',
  expired: 'Sesi Google berakhir. Mulai lagi dari tombol Google.',
  unverified: 'Google belum mengonfirmasi email tersebut. Pilih akun Google lain.',
  usePassword: 'Email ini sudah terdaftar dengan kata sandi. Gunakan formulir masuk dengan email.',
  wrongRole: 'Akun Google ini terdaftar dengan peran lain. Pilih peran yang sesuai saat masuk.',
  notRegistered: 'Akun Google ini belum terdaftar. Gunakan tombol Daftar dengan Google untuk membuat akun.',
  failed: 'Koneksi ke Google gagal. Silakan coba lagi.',
};

const googleErrorsEnglish: Record<string, string> = {
  unavailable: 'Google sign-in is unavailable. You can use an email and password.',
  canceled: 'The Google connection was canceled. You can try again.',
  expired: 'Your Google session expired. Start again from the Google button.',
  unverified: 'Google has not verified that email address. Choose another Google account.',
  usePassword: 'This email already uses a password. Sign in with your email and password.',
  wrongRole: 'This Google account is registered under another role. Select that role to sign in.',
  notRegistered: 'This Google account is unregistered. Sign up with Google to create an account.',
  failed: 'Could not connect to Google. Please try again.',
};

export function googleErrorMessage(code: string | undefined, locale: 'id' | 'en') {
  const messages = locale === 'id' ? googleErrors : googleErrorsEnglish;
  return code && Object.hasOwn(messages, code) ? messages[code] : '';
}
