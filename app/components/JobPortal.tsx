import React, { useState } from 'react';
import { useCatalog } from '../utils/useCatalog';
import { applicantStatuses, type ApplicantStatus } from '../utils/recruitment';
import { 
  Search, 
  Filter, 
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
  Share2,
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
  ExternalLink,
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
        <div className="max-w-7xl mx-auto">
          {error && !showApplicationModal && <p role="alert" className="mb-4 text-center text-red-700">{error}</p>}
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Find Your Perfect Job
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover deaf-friendly opportunities tailored to your skills and preferences across Indonesia
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-indigo-600">{filteredJobs.length}</div>
                <div className="text-sm text-gray-600">Available Jobs</div>
              </div>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-green-600">{jobs.filter(job => job.isAccessibilityVerified).length}</div>
                <div className="text-sm text-gray-600">Accessibility Verified</div>
              </div>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-purple-600">{savedJobs.length}</div>
                <div className="text-sm text-gray-600">Saved Jobs</div>
              </div>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                <div className="text-sm text-gray-600">Applications</div>
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
                <h3 className="text-lg font-semibold text-green-800">Personalized Recommendations</h3>
              </div>
              <p className="text-green-700">
                Based on your assessment, we've found {filteredJobs.filter(job => job.recommendationScore && job.recommendationScore > 60).length} highly recommended jobs matching your interests in{' '}
                {userAssessment.interests?.slice(0, 2).join(', ')} and experience level: {userAssessment.experienceLevel}
              </p>
            </div>
          )}

          {/* Category Filters */}
          <div className="mb-6">
            <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
              {getCategories(jobs).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl'
                      : 'bg-white/80 backdrop-blur-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 shadow-lg'
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
          <div className="mb-8 bg-gray-100 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg bg-white/90 text-gray-600 backdrop-blur-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-4 border  text-gray-600 border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg bg-white/90 backdrop-blur-sm"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-4 border  text-gray-600 border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg bg-white/90 backdrop-blur-sm"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest First</option>
                  <option value="salary">Highest Salary</option>
                  <option value="rating">Highest Rated</option>
                  <option value="accessibility">Most Accessible</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Job List */}
            <div className="lg:col-span-3 space-y-6">
              {filteredJobs.map((job) => {
                const applicationStatus = getApplicationStatus(job.id);
                return (
                  <div
                    key={job.id}
                    className={`bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl cursor-pointer transition-all duration-500 hover:shadow-2xl border border-white/20 group transform hover:scale-[1.02] ${
                      selectedJob?.id === job.id 
                        ? 'ring-4 ring-indigo-300 scale-[1.02] shadow-2xl' 
                        : 'hover:ring-2 hover:ring-indigo-200'
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    {/* Job Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {job.title}
                              </h3>
                              {job.urgency === 'high' && (
                                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                                  🔥 Urgent
                                </span>
                              )}
                              {userAssessment && job.recommendationScore && job.recommendationScore > 70 && (
                                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium flex items-center animate-bounce">
                                  <Target className="w-3 h-3 mr-1" />
                                  Recommended
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-2">
                              <div className="flex items-center">
                                <Building className="w-4 h-4 mr-2 text-indigo-500" />
                                <span className="font-medium text-indigo-600">{job.company}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{job.location}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
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
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveJob(job.id);
                              }}
                              disabled={pending}
                              className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                                savedJobs.includes(job.id) 
                                  ? 'text-red-500 bg-red-50 hover:bg-red-100 scale-110 shadow-lg' 
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-lg'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-3 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-300 hover:shadow-lg transform hover:scale-110"
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Type and Salary */}
                    <div className="flex flex-wrap items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-4 py-2 rounded-2xl text-sm font-medium shadow-md ${
                          job.type === 'Full-time' ? 'bg-green-100 text-green-800' :
                          job.type === 'Part-time' ? 'bg-blue-100 text-blue-800' :
                          job.type === 'Freelance' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {job.type}
                        </span>
                        
                        {(job.arrangement || job.isRemote) && (
                          <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-2xl text-sm font-medium shadow-md">
                            {job.arrangement || 'Remote'}
                          </span>
                        )}
                        
                        <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl text-sm shadow-md">
                          {job.category}
                        </span>
                      </div>
                      
                      <div className="text-xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-2xl shadow-md">
                        {job.salary || 'Gaji tidak dicantumkan'}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description}
                    </p>

                    {/* Accessibility Score */}
                    {!job.companyListing && <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Accessibility className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Deaf-Friendly Score: {job.deafFriendlyScore}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                i < Math.floor(job.deafFriendlyScore / 20) ? 'bg-green-500 shadow-md' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.slice(0, 4).map((tag, index) => (
                        <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                          {tag}
                        </span>
                      ))}
                      {job.tags.length > 4 && (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs shadow-md">
                          +{job.tags.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {applicationStatus ? (
                        <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center justify-between shadow-lg">
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
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 transform hover:scale-105"
                          >
                            <Send className="w-4 h-4" />
                            <span>Apply Now</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactEmployer(job);
                            }}
                            className="flex-1 border-2 border-indigo-600 text-indigo-600 py-4 rounded-2xl font-semibold hover:bg-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 transform hover:scale-105"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Contact</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="text-center py-16 bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
                  <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">No jobs found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search criteria or browse different categories</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setFilterType('all');
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Job Details Sidebar */}
            <div className="lg:col-span-1">
              {selectedJob ? (
                <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-2xl sticky top-6 border border-white/20">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        {selectedJob.title}
                      </h2>
                      <button
                        onClick={() => toggleSaveJob(selectedJob.id)}
                        disabled={pending}
                        className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                          savedJobs.includes(selectedJob.id) 
                            ? 'text-red-500 bg-red-50 hover:bg-red-100 shadow-lg' 
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-lg'
                        }`}
                      >
                        <Heart className={`w-6 h-6 ${savedJobs.includes(selectedJob.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4">
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

                  {/* Quick Info */}
                  <div className="space-y-4 mb-6">
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
                      <span>Deadline: {selectedJob.applicationDeadline || 'Tidak ditentukan'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">About this role</h3>
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">{selectedJob.description}</p>
                  </div>

                  {/* Requirements */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
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
                      <h3 className="font-semibold text-gray-900 mb-3">Benefits</h3>
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
                      Accessibility Support
                    </h3>
                    <p className="text-green-700 text-sm leading-relaxed mb-3">{selectedJob.accessibility}</p>
                    {!selectedJob.companyListing && <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        Deaf-Friendly Score
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
                        Applied: {formatAppliedDate(getApplicationStatus(selectedJob.id))}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleApplyNow(selectedJob)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 transform hover:scale-105"
                      >
                        <Send className="w-5 h-5" />
                        <span>Apply for this Job</span>
                      </button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleContactEmployer(selectedJob)}
                          className="border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-300 text-sm flex items-center justify-center space-x-1 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Contact</span>
                        </button>
                        <button className="border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-300 text-sm flex items-center justify-center space-x-1 shadow-lg hover:shadow-xl transform hover:scale-105">
                          <ExternalLink className="w-4 h-4" />
                          <span>Company</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-2xl text-center text-gray-500 sticky top-6 border border-white/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a job to view details</h3>
                  <p className="text-sm">Click on any job card to see comprehensive information and application options</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index <= currentStep ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${index <= currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-1 w-16 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={applicationData.name}
                  onChange={(e) => setApplicationData({...applicationData, name: e.target.value})}
                  className="w-full px-4 py-3 border text-gray-500  bg-white border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                  className="w-full px-4 py-3 text-gray-500  bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
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
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
              <div>
                  <p className="text-sm text-gray-600">Unggah CV belum tersedia.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
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
              <h3 className="text-lg text-gray-500  bg-white  font-semibold mb-4">Communication Preferences</h3>
              <div>
                <label className="block text-sm text-gray-500  bg-white  font-medium text-gray-700 mb-2">Preferred Communication Method</label>
                <select
                  value={applicationData.communicationPreference}
                  onChange={(e) => setApplicationData({...applicationData, communicationPreference: e.target.value})}
                  className="w-full px-4 py-3 text-gray-500  bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                >
                  <option value="email">Email</option>
                  <option value="text">Text/SMS</option>
                  <option value="video-asl">Video Call with ASL Interpreter</option>
                  <option value="written-chat">Written Chat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500  bg-white  font-medium text-gray-700 mb-2">Available Start Date</label>
                <input
                  type="date"
                  value={applicationData.availabilityDate}
                  onChange={(e) => setApplicationData({...applicationData, availabilityDate: e.target.value})}
                  className="w-full px-4 py-3 text-gray-500  bg-white  border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Expectation</label>
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
              <h3 className="text-lg font-semibold">Review Your Application</h3>
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4 space-y-4 shadow-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Position</h4>
                  <p className="text-gray-600">{job.title} at {job.company}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Applicant</h4>
                  <p className="text-gray-600">{applicationData.name} ({applicationData.email})</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Communication Preference</h4>
                  <p className="text-gray-600">{applicationData.communicationPreference}</p>
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Application Ready</span>
                </div>
                <p className="text-green-700 text-sm mt-2">
                  {job.companyListing
                    ? 'Lamaran dan preferensi komunikasimu akan tersedia untuk perusahaan di portal Lestari.'
                    : 'Lamaran dan preferensi komunikasimu akan disimpan di akun Lestari. Gunakan tombol kontak perusahaan untuk mengirimkannya melalui email.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 shadow-lg transform hover:scale-105'
              }`}
            >
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Next Step
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
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Contact Employer</h2>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready-to-Send Email Template</h3>
            <p className="text-gray-600">We've prepared a professional email template for you to contact {job.company} about the {job.title} position.</p>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">To: {job.companyEmail}</span>
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
              <strong className="text-gray-900">Subject:</strong>
              <div className="bg-white p-3 rounded-xl border mt-1 text-gray-700 shadow-md">
                {emailContent.subject}
              </div>
            </div>
            
            <div>
              <strong className="text-gray-900">Message:</strong>
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
              <span>Open in Email Client</span>
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
                Close
              </button>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Accessibility Note</h4>
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
