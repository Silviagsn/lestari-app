export type ProfileRole = 'jobseeker' | 'company' | 'admin';

export type ProfileFields = {
  displayName: string;
  headline: string;
  location: string;
  about: string;
  communication: string;
  details: Record<string, string>;
};

export type Profile = ProfileFields & { email: string; role: ProfileRole; isDemo: boolean };

export const communicationOptions = [
  'Email',
  'Chat tertulis',
  'BISINDO',
  'Video dengan juru bahasa isyarat',
];

type Field = { key: string; label: string; limit: number; multiline?: boolean; tags?: boolean };
type RoleProfile = {
  label: string;
  nameLabel: string;
  headlineLabel: string;
  aboutLabel: string;
  detailsLabel: string;
  fields: Field[];
};

export const profileByRole: Record<ProfileRole, RoleProfile> = {
  jobseeker: {
    label: 'Pencari Kerja',
    nameLabel: 'Nama lengkap',
    headlineLabel: 'Bidang atau posisi yang diminati',
    aboutLabel: 'Tentang saya',
    detailsLabel: 'Karier dan keahlian',
    fields: [
      { key: 'skills', label: 'Keahlian', limit: 180, tags: true },
      { key: 'experience', label: 'Pengalaman', limit: 400, multiline: true },
      { key: 'goal', label: 'Tujuan karier', limit: 240, multiline: true },
    ],
  },
  company: {
    label: 'Perusahaan',
    nameLabel: 'Nama perusahaan',
    headlineLabel: 'Ringkasan perusahaan',
    aboutLabel: 'Tentang perusahaan',
    detailsLabel: 'Perusahaan dan aksesibilitas',
    fields: [
      { key: 'industry', label: 'Industri', limit: 100 },
      { key: 'accessibility', label: 'Dukungan aksesibilitas', limit: 400, multiline: true },
    ],
  },
  admin: {
    label: 'Admin',
    nameLabel: 'Nama lengkap',
    headlineLabel: 'Jabatan',
    aboutLabel: 'Tentang saya',
    detailsLabel: 'Tim dan tanggung jawab',
    fields: [
      { key: 'team', label: 'Tim', limit: 100 },
      { key: 'responsibilities', label: 'Tanggung jawab', limit: 400, multiline: true },
    ],
  },
};

export const profileLimits = { displayName: 100, headline: 120, location: 100, about: 600 };

export function editableProfile(data: unknown, role: ProfileRole): ProfileFields | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const { displayName, headline, location, about, communication, details } = data as Record<string, unknown>;
  const fits = (value: unknown, length: number): value is string =>
    typeof value === 'string' && value.length <= length && !value.includes('\0');

  if (!fits(displayName, profileLimits.displayName) || !displayName.trim() ||
      !fits(headline, profileLimits.headline) || !fits(location, profileLimits.location) ||
      !fits(about, profileLimits.about) || typeof communication !== 'string' ||
      (communication !== '' && !communicationOptions.includes(communication)) ||
      !details || typeof details !== 'object' || Array.isArray(details)) return null;

  const values = details as Record<string, unknown>;
  const fields = profileByRole[role].fields;
  if (Object.keys(values).some(key => !fields.some(field => field.key === key))) return null;
  const cleanDetails: ProfileFields['details'] = {};
  for (const field of fields) {
    const value = values[field.key] ?? '';
    if (!fits(value, field.limit)) return null;
    cleanDetails[field.key] = value.trim();
  }
  return {
    displayName: displayName.trim(),
    headline: headline.trim(),
    location: location.trim(),
    about: about.trim(),
    communication,
    details: cleanDetails,
  };
}
