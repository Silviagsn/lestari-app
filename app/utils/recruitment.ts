export const jobTypes = { 'Full-time': 'Penuh waktu', 'Part-time': 'Paruh waktu', Contract: 'Kontrak', Freelance: 'Lepas', Internship: 'Magang' };
export const jobCategories = { Design: 'Desain', Technology: 'Teknologi', Hospitality: 'Hospitalitas', Culinary: 'Kuliner', Retail: 'Ritel', Logistics: 'Logistik', Education: 'Pendidikan', Healthcare: 'Kesehatan', Communication: 'Komunikasi', Other: 'Lainnya' };
export const workArrangements = ['Di kantor', 'Hibrida', 'Remote'];
export const experienceLevels = { Entry: 'Pemula', Mid: 'Menengah', Senior: 'Senior' };
export const accessibilityOptions = ['Juru bahasa isyarat', 'Komunikasi lewat chat', 'Pemberitahuan visual', 'Instruksi kerja tertulis'];
export const applicantStatuses = { applied: 'Baru', reviewing: 'Ditinjau', interview: 'Wawancara', offer: 'Ditawari', rejected: 'Tidak lolos' };
export type ApplicantStatus = keyof typeof applicantStatuses;
export const listingStatuses = { draft: 'Draf', published: 'Tayang', closed: 'Ditutup' };
export type ListingStatus = keyof typeof listingStatuses;

export type JobDraft = {
  title: string; type: string; category: string; arrangement: string; experienceLevel: string;
  location: string; salary: string; description: string; requirementsText: string;
  deadline: string; contactEmail: string; accessibilityOptions: string[];
};

export const emptyJob: JobDraft = {
  title: '', type: 'Full-time', category: 'Technology', arrangement: 'Di kantor', experienceLevel: 'Entry',
  location: '', salary: '', description: '', requirementsText: '', deadline: '', contactEmail: '', accessibilityOptions: [],
};

export type CompanyJob = JobDraft & { id: number; status: ListingStatus; applicants: number; createdAt: string; expired: boolean };
export type CompanyApplicant = {
  jobId: number; applicantId: number; name: string; email: string; phone: string;
  coverLetter: string; communicationPreference: string; availabilityDate: string | null;
  salaryExpectation: string; status: ApplicantStatus; appliedAt: string;
};
export type RecruitmentData = { companyName: string; jobs: CompanyJob[]; applicants: CompanyApplicant[] };

export const jobTextLimits = { title: 120, location: 120, salary: 120, description: 4000, requirementsText: 2500, contactEmail: 254 };

export function isOptionalDate(value: unknown): value is string {
  if (value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function readJobDraft(data: unknown): JobDraft | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  const result = { ...emptyJob };
  for (const field of Object.keys(jobTextLimits) as (keyof typeof jobTextLimits)[]) {
    const value = raw[field];
    if (typeof value !== 'string' || value.length > jobTextLimits[field] || value.includes('\0')) return null;
    result[field] = value.trim();
  }
  if (!result.title || (result.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.contactEmail)) ||
    typeof raw.type !== 'string' || !Object.hasOwn(jobTypes, raw.type) ||
    typeof raw.category !== 'string' || !Object.hasOwn(jobCategories, raw.category) ||
    typeof raw.experienceLevel !== 'string' || !Object.hasOwn(experienceLevels, raw.experienceLevel) ||
    typeof raw.arrangement !== 'string' || !workArrangements.includes(raw.arrangement) ||
    !isOptionalDate(raw.deadline) ||
    !Array.isArray(raw.accessibilityOptions) ||
    raw.accessibilityOptions.length > accessibilityOptions.length ||
    raw.accessibilityOptions.some(option => !accessibilityOptions.includes(option))) return null;
  return {
    ...result, type: raw.type, category: raw.category, experienceLevel: raw.experienceLevel,
    arrangement: raw.arrangement, deadline: raw.deadline, accessibilityOptions: [...new Set(raw.accessibilityOptions)],
  };
}
