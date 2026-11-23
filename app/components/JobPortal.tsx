import { useLanguage } from './Language';
import React, { useEffect, useRef, useState } from 'react';
import { useCatalog } from '../utils/useCatalog';
import { applicantStatuses, type ApplicantStatus } from '../utils/recruitment';
import { 
  Search, 
  MapPin, 
  Clock, 
  Briefcase, 
  Accessibility,
  Star,
  Building,
  DollarSign,
  Users,
  Eye,
  Heart,
  Send,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Globe,
  Zap,
  Shield,
  Code,
  Palette,
  BookOpen,
  Stethoscope,
  Calculator,
  Megaphone,
  ChevronDown,
  X,
  Download,
  ArrowRight,
  Target,
  ChevronRight,
  ChevronLeft,
  Coffee,
  Camera,
  Scissors,
  Home,
  Utensils,
  Shirt,
  Car,
  Laptop,
  Package,
  Headphones
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  accessibility: string;
  posted: string;
  logo?: string;
  rating?: number;
  employees?: string;
  benefits?: string[];
  category: string;
  experienceLevel: string;
  isRemote: boolean;
  arrangement?: string;
  urgency: 'low' | 'medium' | 'high';
  companyEmail: string;
  applicationDeadline: string;
  tags: string[];
  isAccessibilityVerified: boolean;
  deafFriendlyScore: number;
  recommendationScore?: number;
  companyListing?: boolean;
}

interface ApplicationStatus {
  jobId: number;
  title: string;
  status: ApplicantStatus;
  appliedDate: string;
  lastUpdate: string;
  notes?: string;
}

const getCategories = (jobs: Job[]) => [
  { id: 'all', name: 'All Categories', icon: <Briefcase className="w-4 h-4" />, count: jobs.length },
  { id: 'design', name: 'Design & Creative', icon: <Palette className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Design' || j.category === 'Creative').length },
  { id: 'hospitality', name: 'Hospitality', icon: <Coffee className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Hospitality').length },
  { id: 'technology', name: 'Technology', icon: <Code className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Technology').length },
  { id: 'culinary', name: 'Culinary', icon: <Utensils className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Culinary').length },
  { id: 'retail', name: 'Retail & Fashion', icon: <Shirt className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Retail' || j.category === 'Fashion').length },
  { id: 'logistics', name: 'Logistics', icon: <Package className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Logistics').length },
  { id: 'education', name: 'Education', icon: <BookOpen className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Education').length },
  { id: 'healthcare', name: 'Healthcare', icon: <Stethoscope className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Healthcare').length },
  { id: 'communication', name: 'Communication', icon: <Users className="w-4 h-4" />, count: jobs.filter(j => j.category === 'Communication').length }
];

interface JobPortalProps {
  userAssessment?: {
    primaryGoal: string;
    experienceLevel: string;
    interests: string[];
    communicationPreferences: string[];
  };
}

export default function JobPortalPage({ userAssessment }: JobPortalProps) {
  const { t } = useLanguage();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const { data, loading, pending, error, mutate } = useCatalog<Job, ApplicationStatus>('jobs', (entry) => entry.jobId);
  const jobs = data?.items ?? [];
  const savedJobs = data?.savedIds ?? [];
  const applications = data?.activity ?? [];
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [currentApplicationJob, setCurrentApplicationJob] = useState<Job | null>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  const showJobDetails = selectedJob !== null && !showApplicationModal && !showContactModal;

  useEffect(() => {
    const dialog = detailsDialog.current;
    if (!dialog) return;
    if (showJobDetails && !dialog.open) dialog.showModal();
    if (!showJobDetails && dialog.open) dialog.close();
  }, [showJobDetails]);

  // Enhanced recommendation algorithm
  const getRecommendedJobs = () => {
    if (!userAssessment) return jobs;
    
    return jobs.map(job => {
      let score = 0;
      
      // Match based on interests from assessment
      if (userAssessment.interests) {
        const jobCategory = job.category.toLowerCase();
        const jobTags = job.tags.map(tag => tag.toLowerCase());
        
        userAssessment.interests.forEach(interest => {
          const interestLower = interest.toLowerCase();
          
          // Direct category match
          if (jobCategory.includes(interestLower) || interestLower.includes(jobCategory)) {
            score += 30;
          }
          
          // Tag matching
          jobTags.forEach(tag => {
            if (tag.includes(interestLower) || interestLower.includes(tag)) {
              score += 15;
            }
          });
          
          // Specific skill matching
          if (job.requirements.some(req => 
            req.toLowerCase().includes(interestLower) || 
            interestLower.includes(req.toLowerCase())
          )) {
            score += 20;
          }
        });
      }
      
      // Experience level matching
      if (userAssessment.experienceLevel) {
        const userLevel = userAssessment.experienceLevel.toLowerCase();
        const jobLevel = job.experienceLevel.toLowerCase();
        
        if (jobLevel === userLevel) {
          score += 25;
        } else if (
          (userLevel === 'beginner' && jobLevel === 'entry') ||
          (userLevel === 'intermediate' && jobLevel === 'mid') ||
          (userLevel === 'advanced' && jobLevel === 'senior')
        ) {
          score += 20;
        }
      }
      
      // Boost for accessibility features
      if (job.isAccessibilityVerified) {
        score += 15;
      }
      
      // Boost high deaf-friendly scores
      score += job.deafFriendlyScore * 0.2;
      
      // Boost for remote work if preferred
      if (job.isRemote && userAssessment.communicationPreferences?.includes('remote')) {
        score += 10;
      }
      
      // Location bonus for Indonesia jobs
      if (job.location.includes('Indonesia')) {
        score += 5;
      }
      
      return { ...job, recommendationScore: Math.min(score, 100) };
    }).sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
  };
   const filteredJobs = getRecommendedJobs().filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           job.category.toLowerCase() === selectedCategory ||
                           (selectedCategory === 'design' && (job.category === 'Design' || job.category === 'Creative')) ||
                           (selectedCategory === 'retail' && (job.category === 'Retail' || job.category === 'Fashion'));
    
    const matchesType = filterType === 'all' || job.type.toLowerCase().includes(filterType);
    
    return matchesSearch && matchesCategory && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'salary') {
      const aSalary = parseInt(a.salary.replace(/[^0-9]/g, '')) || 0;
      const bSalary = parseInt(b.salary.replace(/[^0-9]/g, '')) || 0;
      return bSalary - aSalary;
    }
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'accessibility') {
      return b.deafFriendlyScore - a.deafFriendlyScore;
    }
    if (sortBy === 'newest') {
      return 0; // Would use actual date comparison in real app
    }
    return 0; // recommended by default
  });

  const toggleSaveJob = (jobId: number) => {
    void mutate({ action: 'save', id: jobId, saved: !savedJobs.includes(jobId) });
  };

  const handleApplyNow = (job: Job) => {
    setCurrentApplicationJob(job);
    setShowApplicationModal(true);
  };

  const handleContactEmployer = (job: Job) => {
    setCurrentApplicationJob(job);
    setShowContactModal(true);
  };

  const submitApplication = async (application: Record<string, string>) => {
    if (currentApplicationJob &&
        await mutate({ action: 'apply', id: currentApplicationJob.id, application })) {
      setShowApplicationModal(false);
      setCurrentApplicationJob(null);
    }
  };

  const getApplicationStatus = (jobId: number) => {
    return applications.find(app => app.jobId === jobId);
  };

  const formatAppliedDate = (application?: ApplicationStatus) =>
    application ? new Date(application.appliedDate).toLocaleDateString() : '';

  const generateEmailContent = (job: Job) => {
    const subject = `Application for ${job.title} Position - [Your Name]`;
    const body = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. As a member of the deaf community, I am particularly excited about your company's commitment to accessibility and inclusion.

My background includes:
- [Your relevant experience]
- [Your key skills]
- [Your achievements]

I am confident that my skills and passion for ${job.category.toLowerCase()} would make me a valuable addition to your team. I appreciate your company's accessibility features including ${job.accessibility}.

I have attached my resume and would welcome the opportunity to discuss how I can contribute to your team. I am available for interviews via video call with ASL interpretation or written communication as needed.

Thank you for your consideration.

Best regards,
[Your Name]
[Your Email]
[Your Phone]

---
Application Details:
Position: ${job.title}
Company: ${job.company}
Application Date: ${new Date().toLocaleDateString()}`;

    return { subject, body };
  };

  if (!data) {
    return <p className="p-8 text-center text-slate-700" role={error ? 'alert' : 'status'}>
      {loading ? 'Memuat lowongan...' : error}
    </p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-pink-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-6xl">
          {error && !showApplicationModal && <p role="alert" className="mb-4 text-center text-red-700">{error}</p>}
          {/* Enhanced Header */}
          <div className="mb-5 sm:mb-8">
            <div className="mb-4 text-center sm:mb-6">
              <h1 className="mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent sm:mb-4 sm:text-4xl md:text-5xl">
                {t("Temukan Pekerjaan yang Tepat", "Find Your Perfect Job")}
              </h1>
              <p className="mx-auto max-w-3xl text-sm text-slate-600 sm:text-lg md:text-xl">
                {t("Jelajahi peluang kerja yang ramah bagi komunitas Tuli di seluruh Indonesia.", "Discover deaf-friendly opportunities tailored to your skills and preferences across Indonesia")}
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-2.5 text-center shadow-sm sm:p-4">
                <div className="text-2xl font-bold text-indigo-600">{filteredJobs.length}</div>
                <div className="text-sm text-gray-600">{t("Lowongan tersedia", "Available Jobs")}</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-2.5 text-center shadow-sm sm:p-4">
                <div className="text-2xl font-bold text-green-600">{jobs.filter(job => job.isAccessibilityVerified).length}</div>
                <div className="text-sm text-gray-600">{t("Aksesibilitas terverifikasi", "Accessibility Verified")}</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-2.5 text-center shadow-sm sm:p-4">
                <div className="text-2xl font-bold text-purple-600">{savedJobs.length}</div>
                <div className="text-sm text-gray-600">{t("Lowongan tersimpan", "Saved Jobs")}</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-2.5 text-center shadow-sm sm:p-4">
                <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                <div className="text-sm text-gray-600">{t("Lamaran", "Applications")}</div>
              </div>
            </div>
          </div>

          {applications.length > 0 && (
            <details className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer font-bold text-indigo-900">Riwayat lamaran ({applications.length})</summary>
              <ul className="mt-3 divide-y divide-indigo-100">
                {applications.map(application => <li key={application.jobId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="break-words font-semibold text-slate-800 [overflow-wrap:anywhere]">{application.title}</span>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-900">{application.status === 'applied' ? 'Terkirim' : applicantStatuses[application.status]}</span>
                </li>)}
              </ul>
            </details>
          )}

          {/* Recommendation Banner */}
          {userAssessment && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Target className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">{t("Rekomendasi untukmu", "Personalized Recommendations")}</h3>
              </div>
              <p className="text-green-700">
                Based on your assessment, we've found {filteredJobs.filter(job => job.recommendationScore && job.recommendationScore > 60).length} highly recommended jobs matching your interests in{' '}
                {userAssessment.interests?.slice(0, 2).join(', ')} and experience level: {userAssessment.experienceLevel}
              </p>
            </div>
          )}

          {/* Category Filters */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {getCategories(jobs).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                  className={`inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'border-indigo-700 bg-indigo-700 text-white'
                      : 'border-indigo-100 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-800'
                  }`}
                >
                  {category.icon}
                  <span className="font-medium">{category.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="relative col-span-2 min-w-0 lg:col-span-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  aria-label={t("Cari lowongan", "Search jobs")}
                  placeholder={t("Cari lowongan, perusahaan, atau keahlian…", "Search jobs, companies, or skills...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-12 pr-4 text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              
              <div className="min-w-0">
                <select
                  aria-label={t("Jenis pekerjaan", "Job type")}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:px-4 sm:text-base"
                >
                  <option value="all">{t("Semua jenis", "All Types")}</option>
                  <option value="full-time">{t("Penuh waktu", "Full-time")}</option>
                  <option value="part-time">{t("Paruh waktu", "Part-time")}</option>
                  <option value="contract">{t("Kontrak", "Contract")}</option>
                  <option value="freelance">{t("Lepas", "Freelance")}</option>
                  <option value="remote">{t("Jarak jauh", "Remote")}</option>
                </select>
              </div>
              
              <div className="min-w-0">
                <select
                  aria-label={t("Urutkan lowongan", "Sort jobs")}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-2 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:px-4 sm:text-base"
                >
                  <option value="recommended">{t("Direkomendasikan", "Recommended")}</option>
                  <option value="newest">{t("Terbaru", "Newest First")}</option>
                  <option value="salary">{t("Gaji tertinggi", "Highest Salary")}</option>
                  <option value="rating">{t("Penilaian tertinggi", "Highest Rated")}</option>
                  <option value="accessibility">{t("Paling aksesibel", "Most Accessible")}</option>
                </select>
              </div>
            </div>
          </div>

          <section aria-label={t("Daftar lowongan", "Job listings")} className="grid gap-5 md:grid-cols-2 sm:gap-6">
              {filteredJobs.map((job) => {
                const applicationStatus = getApplicationStatus(job.id);
                return (
                  <article
                    key={job.id}
                    className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm transition-shadow hover:shadow-lg [overflow-wrap:anywhere]"
                    onClick={() => setSelectedJob(job)}
                  >
                    {/* Job Header */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <div className="flex items-start justify-between gap-3 bg-black/20 p-5 sm:p-6">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">{job.category}</span>
                              {job.urgency === 'high' && (
                                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                                  {t("🔥 Mendesak", "🔥 Urgent")}
                                </span>
                              )}
                              {userAssessment && job.recommendationScore && job.recommendationScore > 70 && (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                                  <Target className="w-3 h-3 mr-1" />
                                  {t("Direkomendasikan", "Recommended")}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-extrabold leading-tight">
                              <button type="button" aria-haspopup="dialog" className="rounded-md text-left hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                                {job.title}
                              </button>
                            </h3>
                            
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-indigo-50">
                              <div className="flex min-w-0 items-start gap-1.5">
                                <Building className="mt-0.5 h-4 w-4 shrink-0" />
                                <span className="font-semibold text-white">{job.company}</span>
                              </div>
                              
                              <div className="flex min-w-0 items-start gap-1.5">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{job.location}</span>
                              </div>
                              
                              <div className="flex min-w-0 items-start gap-1.5">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{job.posted}</span>
                              </div>
                              
                              {job.rating && (
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                  <span>{job.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveJob(job.id);
                              }}
                              disabled={pending}
                              aria-label={`Save ${job.title}`}
                              aria-pressed={savedJobs.includes(job.id)}
                              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                                savedJobs.includes(job.id) ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {/* Job Type and Salary */}
                    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          job.type === 'Full-time' ? 'bg-green-100 text-green-800' :
                          job.type === 'Part-time' ? 'bg-blue-100 text-blue-800' :
                          job.type === 'Freelance' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {job.type}
                        </span>
                        
                        {(job.arrangement || job.isRemote) && (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                            {job.arrangement || 'Remote'}
                          </span>
                        )}
                        
                      </div>
                      
                      <div className="text-sm font-bold text-emerald-800">
                        {job.salary || 'Gaji tidak dicantumkan'}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description}
                    </p>

                    {/* Accessibility Score */}
                    {!job.companyListing && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <Accessibility className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {t("Skor ramah Tuli:", "Deaf-Friendly Score:")} {job.deafFriendlyScore}%
                          </span>
                        </div>
                        <div aria-hidden="true" className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-full ${
                                i < Math.floor(job.deafFriendlyScore / 20) ? 'bg-emerald-600' : 'bg-emerald-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.slice(0, 4).map((tag, index) => (
                        <span key={index} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {tag}
                        </span>
                      ))}
                      {job.tags.length > 4 && (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800">
                          +{job.tags.length - 4} {t("lainnya", "more")}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                      {applicationStatus ? (
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-800 font-medium">
                              {applicationStatus.status === 'applied' ? 'Lamaran terkirim' : applicantStatuses[applicationStatus.status]}
                            </span>
                          </div>
                          <span className="text-xs text-green-600">
                            {formatAppliedDate(applicationStatus)}
                          </span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyNow(job);
                            }}
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 px-3 py-2 text-sm font-semibold text-white hover:from-indigo-800 hover:to-violet-800"
                          >
                            <Send className="w-4 h-4" />
                            <span>{t("Lamar sekarang", "Apply Now")}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactEmployer(job);
                            }}
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
                          >
                            <Mail className="w-4 h-4" />
                            <span>{t("Kontak", "Contact")}</span>
                          </button>
                        </>
                      )}
                    </div>
                    </div>
                  </article>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="col-span-full rounded-3xl border border-indigo-100 bg-white px-5 py-12 text-center shadow-sm">
                  <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t("Lowongan belum ditemukan", "No jobs found")}</h3>
                  <p className="text-gray-600 mb-6">{t("Coba ubah pencarian atau pilih kategori lain.", "Try adjusting your search criteria or browse different categories")}</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setFilterType('all');
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {t("Hapus filter", "Clear Filters")}
                  </button>
                </div>
              )}
          </section>
        </div>
      </div>

      <dialog
        ref={detailsDialog}
        aria-labelledby="job-detail-title"
        onCancel={event => { event.preventDefault(); setSelectedJob(null); }}
        onClick={event => { if (event.target === event.currentTarget) setSelectedJob(null); }}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-indigo-100 bg-white shadow-2xl backdrop:bg-slate-950/50 [overflow-wrap:anywhere]"
      >
              {selectedJob && (
                <div>
                  <div className="border-b border-indigo-100 bg-gradient-to-br from-blue-50 to-violet-100 p-5 sm:p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h2 id="job-detail-title" className="text-2xl font-extrabold leading-tight text-slate-950">
                        {selectedJob.title}
                      </h2>
                      <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => toggleSaveJob(selectedJob.id)}
                        disabled={pending}
                        aria-label={`Save ${selectedJob.title}`}
                        aria-pressed={savedJobs.includes(selectedJob.id)}
                        className={`grid h-10 w-10 place-items-center rounded-full bg-white transition-colors ${
                          savedJobs.includes(selectedJob.id) 
                            ? 'text-rose-700 hover:bg-rose-100'
                            : 'text-indigo-800 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${savedJobs.includes(selectedJob.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button type="button" aria-label={t("Tutup detail lowongan", "Close job details")} onClick={() => setSelectedJob(null)}
                        className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">
                        <X aria-hidden="true" className="h-5 w-5" />
                      </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Building className="w-5 h-5 text-indigo-500" />
                      <span className="text-lg font-medium text-indigo-600">{selectedJob.company}</span>
                      {selectedJob.rating && (
                        <div className="flex items-center ml-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm text-gray-600">{selectedJob.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                  {/* Quick Info */}
                  <div className="mb-6 grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                      <span>{selectedJob.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <Briefcase className="w-5 h-5 mr-3 text-gray-400" />
                      <span>{selectedJob.type} • {selectedJob.experienceLevel}</span>
                    </div>
                    <div className="flex items-center text-green-600 font-semibold bg-green-50 p-3 rounded-xl">
                      <DollarSign className="w-5 h-5 mr-3" />
                      <span className="text-lg">{selectedJob.salary || 'Gaji tidak dicantumkan'}</span>
                    </div>
                    <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <span>{t("Tenggat:", "Deadline:")} {selectedJob.applicationDeadline || 'Tidak ditentukan'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">{t("Tentang pekerjaan ini", "About this role")}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">{selectedJob.description}</p>
                  </div>

                  {/* Requirements */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">{t("Persyaratan", "Requirements")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requirements.map((req, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm shadow-md">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  {selectedJob.benefits && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">{t("Manfaat", "Benefits")}</h3>
                      <div className="space-y-2">
                        {selectedJob.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accessibility Features */}
                  <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-lg">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                      <Accessibility className="w-5 h-5 mr-2" />
                      {t("Dukungan aksesibilitas", "Accessibility Support")}
                    </h3>
                    <p className="text-green-700 text-sm leading-relaxed mb-3">{selectedJob.accessibility}</p>
                    {!selectedJob.companyListing && <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        {t("Skor ramah Tuli", "Deaf-Friendly Score")}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-3 bg-green-200 rounded-full shadow-inner">
                          <div 
                            className="h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500 shadow-md"
                            style={{ width: `${selectedJob.deafFriendlyScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {selectedJob.deafFriendlyScore}%
                        </span>
                      </div>
                    </div>}
                  </div>

                  {/* Application Status or Actions */}
                  {getApplicationStatus(selectedJob.id) ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4 shadow-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Lamaran Tersimpan</span>
                      </div>
                      <p className="text-green-600 text-xs mt-1">
                        {t("Dilamar:", "Applied:")} {formatAppliedDate(getApplicationStatus(selectedJob.id))}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleApplyNow(selectedJob)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 transform hover:scale-105"
                      >
                        <Send className="w-5 h-5" />
                        <span>{t("Lamar pekerjaan ini", "Apply for this Job")}</span>
                      </button>
                      
                      <div>
                        <button
                          onClick={() => handleContactEmployer(selectedJob)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 py-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
                        >
                          <Mail className="w-4 h-4" />
                          <span>{t("Kontak", "Contact")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
      </dialog>

      {/* Application Modal */}
      {showApplicationModal && currentApplicationJob && (
        <ApplicationModal
          job={currentApplicationJob}
          onClose={() => setShowApplicationModal(false)}
          onSubmit={submitApplication}
          pending={pending}
          error={error}
        />
      )}

      {/* Contact Modal */}
      {showContactModal && currentApplicationJob && (
        <ContactModal
          job={currentApplicationJob}
          onClose={() => setShowContactModal(false)}
          emailContent={generateEmailContent(currentApplicationJob)}
        />
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Application Modal Component
function ApplicationModal({ job, onClose, onSubmit, pending, error }: {
  job: Job;
  onClose: () => void;
  onSubmit: (application: Record<string, string>) => void;
  pending: boolean;
  error: string;
}) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    communicationPreference: 'email',
    availabilityDate: '',
    salaryExpectation: ''
  });

  const steps = [
    'Personal Information',
    'Documents',
    'Preferences',
    'Review & Submit'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full min-w-0 max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-indigo-100 bg-white shadow-2xl [overflow-wrap:anywhere]">
        <div className="border-b border-indigo-100 bg-gradient-to-r from-blue-50 to-violet-100 p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h2>
            <button
              onClick={onClose}
              aria-label={t("Tutup formulir lamaran", "Close application")}
              className="shrink-0 rounded-full p-2 transition-colors hover:bg-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step} aria-current={index === currentStep ? 'step' : undefined} className="flex min-w-0 items-center gap-1.5 text-xs font-semibold sm:text-sm">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  index <= currentStep ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'
                }`}>
                  {index + 1}
                </span>
                <span className={index <= currentStep ? 'text-indigo-900' : 'text-slate-600'}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-4 sm:p-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">{t("Informasi pribadi", "Personal Information")}</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("Nama lengkap *", "Full Name *")}</label>
                <input
                  type="text"
                  value={applicationData.name}
                  onChange={(e) => setApplicationData({...applicationData, name: e.target.value})}
                  className="w-full px-4 py-3 border text-gray-500  bg-white border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("Alamat email *", "Email Address *")}</label>
                <input
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                  className="w-full px-4 py-3 text-gray-500  bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("Nomor telepon", "Phone Number")}</label>
                <input
                  type="tel"
                  value={applicationData.phone}
                  onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                  className="w-full px-4 py-3 text-gray-500  bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">{t("Dokumen", "Documents")}</h3>
              <div>
                  <p className="text-sm text-gray-600">Unggah CV belum tersedia.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("Surat lamaran", "Cover Letter")}</label>
                <textarea
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-3 text-gray-500  bg-white  border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                  placeholder="Tell us why you're interested in this position..."
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg text-gray-500  bg-white  font-semibold mb-4">{t("Preferensi komunikasi", "Communication Preferences")}</h3>
              <div>
                <label className="block text-sm text-gray-500  bg-white  font-medium text-gray-700 mb-2">{t("Cara komunikasi yang dipilih", "Preferred Communication Method")}</label>
                <select
                  value={applicationData.communicationPreference}
                  onChange={(e) => setApplicationData({...applicationData, communicationPreference: e.target.value})}
                  className="w-full px-4 py-3 text-gray-500  bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                >
                  <option value="email">Email</option>
                  <option value="text">Text/SMS</option>
                  <option value="video-asl">{t("Panggilan video dengan penerjemah ASL", "Video Call with ASL Interpreter")}</option>
                  <option value="written-chat">{t("Chat tertulis", "Written Chat")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500  bg-white  font-medium text-gray-700 mb-2">{t("Tanggal siap mulai", "Available Start Date")}</label>
                <input
                  type="date"
                  value={applicationData.availabilityDate}
                  onChange={(e) => setApplicationData({...applicationData, availabilityDate: e.target.value})}
                  className="w-full px-4 py-3 text-gray-500  bg-white  border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("Ekspektasi gaji", "Salary Expectation")}</label>
                <input
                  type="text"
                  value={applicationData.salaryExpectation}
                  onChange={(e) => setApplicationData({...applicationData, salaryExpectation: e.target.value})}
                  placeholder="e.g., Rp 5,000,000 - Rp 7,000,000"
                  className="w-full px-4 py-3 text-gray-500  bg-white  border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">{t("Tinjau lamaran", "Review Your Application")}</h3>
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4 space-y-4 shadow-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{t("Posisi", "Position")}</h4>
                  <p className="text-gray-600">{job.title} at {job.company}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{t("Pelamar", "Applicant")}</h4>
                  <p className="text-gray-600">{applicationData.name} ({applicationData.email})</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{t("Preferensi komunikasi", "Communication Preference")}</h4>
                  <p className="text-gray-600">{applicationData.communicationPreference}</p>
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">{t("Lamaran siap", "Application Ready")}</span>
                </div>
                <p className="text-green-700 text-sm mt-2">
                  {job.companyListing
                    ? 'Lamaran dan preferensi komunikasimu akan tersedia untuk perusahaan di portal Lestari.'
                    : 'Lamaran dan preferensi komunikasimu akan disimpan di akun Lestari. Gunakan tombol kontak perusahaan untuk mengirimkannya melalui email.'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-6">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 shadow-lg transform hover:scale-105'
              }`}
            >
              {t("Sebelumnya", "Previous")}
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t("Lanjut", "Next Step")}
              </button>
            ) : (
              <button
                onClick={() => onSubmit(applicationData)}
                disabled={pending}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                {pending ? 'Menyimpan...' : 'Simpan Lamaran'}
              </button>
            )}
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// Contact Modal Component
function ContactModal({ job, onClose, emailContent }: { job: Job; onClose: () => void; emailContent: { subject: string; body: string }; }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailContent.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${job.companyEmail}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full min-w-0 max-w-3xl overflow-y-auto overscroll-contain rounded-3xl border border-indigo-100 bg-white shadow-2xl [overflow-wrap:anywhere]">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t("Hubungi perusahaan", "Contact Employer")}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("Templat email siap pakai", "Ready-to-Send Email Template")}</h3>
            <p className="text-gray-600">We've prepared a professional email template for you to contact {job.company} about the {job.title} position.</p>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl p-4 mb-6 shadow-lg">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Mail className="h-5 w-5 shrink-0 text-gray-500" />
                <span className="font-medium text-gray-900">{t("Kepada:", "To:")} {job.companyEmail}</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  copied ? 'bg-green-100 text-green-800 shadow-lg' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 shadow-lg'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy Email'}
              </button>
            </div>
            
            <div className="mb-3">
              <strong className="text-gray-900">{t("Subjek:", "Subject:")}</strong>
              <div className="bg-white p-3 rounded-xl border mt-1 text-gray-700 shadow-md">
                {emailContent.subject}
              </div>
            </div>
            
            <div>
              <strong className="text-gray-900">{t("Pesan:", "Message:")}</strong>
              <div className="bg-white p-4 rounded-xl border mt-1 text-gray-700 whitespace-pre-line text-sm max-h-64 overflow-y-auto shadow-md">
                {emailContent.body}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSendEmail}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 transform hover:scale-105"
            >
              <Send className="w-5 h-5" />
              <span>{t("Buka aplikasi email", "Open in Email Client")}</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyEmail}
                className="border-2 border-indigo-600 text-indigo-600 py-3 rounded-2xl font-medium hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              
              <button
                onClick={onClose}
                className="border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t("Tutup", "Close")}
              </button>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">{t("Catatan aksesibilitas", "Accessibility Note")}</h4>
                <p className="text-blue-800 text-sm mt-1">
                  The email template includes your accessibility needs and communication preferences. 
                  Feel free to customize it before sending to better reflect your personal style and specific interests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
