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
  failed: 'Koneksi ke Google gagal. Silakan coba lagi.',
};
