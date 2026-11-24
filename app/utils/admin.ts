export type AdminSection = 'accounts' | 'jobs' | 'workshops';

export const adminPageSize = 20;
export const adminFilters = {
  accounts: ['jobseeker', 'company', 'admin'],
  jobs: ['published', 'draft', 'closed'],
  workshops: [],
} as const;

export type AdminRow = {
  id: number;
  title: string;
  subtitle: string;
  status: string;
  date?: string;
  total?: number;
};

export type AdminOverview = {
  jobseekers: number;
  companies: number;
  admins: number;
  published: number;
  drafts: number;
  closed: number;
  applications: number;
  workshops: number;
  enrollments: number;
  recentJobs: AdminRow[];
};
