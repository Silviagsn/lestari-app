import { useLanguage } from './Language';
import React, { useState } from 'react';
import { useCatalog } from '../utils/useCatalog';
import { 
  Clock, 
  Users, 
  Star, 
  Calendar, 
  CheckCircle, 
  Play, 
  BookOpen, 
  Medal,
  Filter,
  Search,
  Video,
  FileText,
  Download,
  MessageCircle,
  TrendingUp,
  Globe,
  Hand,
  Eye,
  Target,
  Zap,
  Shield,
  Code,
  Palette,
  BarChart,
  Monitor,
  Megaphone,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Accessibility,
  Heart,
  Share2,
  ExternalLink,
  Lightbulb,
  Brain,
  Award,
  User,
  MapPin,
  DollarSign,
  Timer,
  PlayCircle,
  Bookmark,
  Activity,
  Coffee,
  Camera,
  Scissors,
  Utensils,
  Calculator,
  Shirt,
  Music,
  Wrench,
  PenTool,
  Headphones,
  Languages
} from 'lucide-react';

interface Workshop {
  id: number;
  title: string;
  instructor: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  features: string[];
  nextSession: string;
  enrolled: number;
  rating: number;
  price: string;
  category: string;
  thumbnail?: string;
  lessons?: number;
  certificateIncluded?: boolean;
  language: string[];
  prerequisites?: string[];
  learningOutcomes: string[];
  isAccessible: boolean;
  maxStudents: number;
  deafFriendlyScore: number;
  instructorRating: number;
  completionRate: number;
  jobPlacementRate?: number;
  skillTags: string[];
  difficulty: number; // 1-5 scale
  recommendationScore?: number;
}

interface EnrollmentStatus {
  workshopId: number;
  status: 'enrolled' | 'in-progress' | 'completed' | 'paused';
  progress: number;
  enrolledDate: string;
  lastActivity: string;
}

const getCategories = (workshops: Workshop[]) => [
  { id: 'all', name: 'All Categories', icon: <BookOpen className="w-4 h-4" />, count: workshops.length },
  { id: 'technology', name: 'Technology', icon: <Code className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Technology').length },
  { id: 'design', name: 'Design', icon: <Palette className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Design').length },
  { id: 'marketing', name: 'Marketing', icon: <Megaphone className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Marketing').length },
  { id: 'programming', name: 'Programming', icon: <Monitor className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Programming').length },
  { id: 'business', name: 'Business', icon: <BarChart className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Business').length },
  { id: 'hospitality', name: 'Hospitality', icon: <Coffee className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Hospitality').length },
  { id: 'culinary', name: 'Culinary', icon: <Utensils className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Culinary').length },
  { id: 'fashion', name: 'Fashion', icon: <Shirt className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Fashion').length },
  { id: 'communication', name: 'Communication', icon: <Hand className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Communication').length },
  { id: 'health & wellness', name: 'Health & Wellness', icon: <Heart className="w-4 h-4" />, count: workshops.filter(w => w.category === 'Health & Wellness').length }
];

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

interface WorkshopPageProps {
  userAssessment?: {
    primaryGoal: string;
    experienceLevel: string;
    interests: string[];
    communicationPreferences: string[];
  };
}

export default function WorkshopPage({ userAssessment }: WorkshopPageProps) {
  const { t } = useLanguage();
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');
  const { data, loading, pending, error, mutate } = useCatalog<Workshop, EnrollmentStatus>(
    'workshops', (entry) => entry.workshopId,
  );
  const workshops = data?.items ?? [];
  const savedWorkshops = data?.savedIds ?? [];
  const enrollmentStatuses = data?.activity ?? [];
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [currentEnrollmentWorkshop, setCurrentEnrollmentWorkshop] = useState<Workshop | null>(null);

  // Enhanced recommendation algorithm
  const getRecommendedWorkshops = () => {
    if (!userAssessment) return workshops;
    
    return workshops.map(workshop => {
      let score = 0;
      
      // Match based on interests from assessment
      if (userAssessment.interests) {
        const workshopCategory = workshop.category.toLowerCase();
        const workshopTags = workshop.skillTags.map(tag => tag.toLowerCase());
        
        userAssessment.interests.forEach(interest => {
          const interestLower = interest.toLowerCase();
          
          // Direct category match
          if (workshopCategory.includes(interestLower) || interestLower.includes(workshopCategory)) {
            score += 30;
          }
          
          // Tag matching
          workshopTags.forEach(tag => {
            if (tag.includes(interestLower) || interestLower.includes(tag)) {
              score += 15;
            }
          });
          
          // Specific skill matching
          if (workshop.skillTags.some(skill => 
            skill.toLowerCase().includes(interestLower) || 
            interestLower.includes(skill.toLowerCase())
          )) {
            score += 20;
          }
        });
      }
// Experience level matching
      if (userAssessment.experienceLevel) {
        const userLevel = userAssessment.experienceLevel.toLowerCase();
        const workshopLevel = workshop.level.toLowerCase();
        
        if (workshopLevel === userLevel) {
          score += 25;
        } else if (
          (userLevel === 'beginner' && workshopLevel === 'beginner') ||
          (userLevel === 'intermediate' && workshopLevel === 'intermediate') ||
          (userLevel === 'advanced' && workshopLevel === 'advanced')
        ) {
          score += 20;
        }
      }
      
      // Boost high accessibility scores
      score += workshop.deafFriendlyScore * 0.2;
      
      // Boost high job placement rates
      if (workshop.jobPlacementRate) {
        score += workshop.jobPlacementRate * 0.15;
      }
      
      // Boost for ASL support
      if (workshop.language.includes('ASL')) {
        score += 10;
      }
      
      // Boost for Indonesian language support
      if (workshop.language.includes('Indonesian')) {
        score += 5;
      }
      
      return { ...workshop, recommendationScore: Math.min(score, 100) };
    }).sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
  };

  const filteredWorkshops = getRecommendedWorkshops().filter(workshop => {
    const matchesSearch = workshop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workshop.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workshop.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workshop.skillTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || workshop.category.toLowerCase() === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || workshop.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price') {
      const aPrice = parseInt(a.price.replace(/[^0-9]/g, ''));
      const bPrice = parseInt(b.price.replace(/[^0-9]/g, ''));
      return aPrice - bPrice;
    }
    if (sortBy === 'duration') return parseInt(a.duration) - parseInt(b.duration);
    if (sortBy === 'accessibility') return b.deafFriendlyScore - a.deafFriendlyScore;
    return b.enrolled - a.enrolled; // recommended/popularity by default
  });

  const handleEnroll = (workshop: Workshop) => {
    setCurrentEnrollmentWorkshop(workshop);
    setShowEnrollmentModal(true);
  };

  const confirmEnrollment = async () => {
    if (currentEnrollmentWorkshop &&
        await mutate({ action: 'enroll', id: currentEnrollmentWorkshop.id })) {
      setShowEnrollmentModal(false);
      setCurrentEnrollmentWorkshop(null);
    }
  };

  const toggleSaveWorkshop = (workshopId: number) => {
    void mutate({ action: 'save', id: workshopId, saved: !savedWorkshops.includes(workshopId) });
  };

  const getEnrollmentStatus = (workshopId: number) => {
    return enrollmentStatuses.find(status => status.workshopId === workshopId);
  };

  if (!data) {
    return <p className="p-8 text-center text-slate-700" role={error ? 'alert' : 'status'}>
      {loading ? 'Memuat workshop...' : error}
    </p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {error && !showEnrollmentModal && <p role="alert" className="mb-4 text-center text-red-700">{error}</p>}
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {t("Pelajari Keterampilan Baru", "Learn New Skills")}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("Kembangkan keterampilan lewat tutorial visual, dukungan ASL, dan proyek praktik untuk komunitas Tuli.", "Master new skills with visual tutorials, ASL support, and hands-on projects designed for the deaf community")}
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-indigo-600">{filteredWorkshops.length}</div>
                <div className="text-sm text-gray-600">{t("Workshop tersedia", "Available Workshops")}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-600">{t("Dukungan ASL", "ASL Supported")}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-purple-600">{savedWorkshops.length}</div>
                <div className="text-sm text-gray-600">{t("Workshop tersimpan", "Saved Workshops")}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-2xl font-bold text-blue-600">{enrollmentStatuses.length}</div>
                <div className="text-sm text-gray-600">{t("Terdaftar", "Enrolled")}</div>
              </div>
            </div>
          </div>

          {/* Recommendation Banner */}
          {userAssessment && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Target className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">{t("Rekomendasi untukmu", "Personalized Recommendations")}</h3>
              </div>
              <p className="text-green-700">
                Based on your assessment, we've found {filteredWorkshops.filter(workshop => workshop.recommendationScore && workshop.recommendationScore > 60).length} highly recommended workshops matching your interests and experience level: {userAssessment.experienceLevel}
              </p>
            </div>
          )}

          {/* Category Filters */}
          <div className="mb-6">
            <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
              {getCategories(workshops).map((category) => (
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
          <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("Cari workshop, pengajar, atau keterampilan…", "Search workshops, instructors, or skills...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border text-gray-500 border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg bg-white/90 backdrop-blur-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-4 border text-gray-500 border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg bg-white/90 backdrop-blur-sm"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level} Level</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-4 border text-gray-500 border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg bg-white/90 backdrop-blur-sm"
                >
                  <option value="recommended">{t("Direkomendasikan", "Recommended")}</option>
                  <option value="popularity">{t("Terpopuler", "Most Popular")}</option>
                  <option value="rating">{t("Penilaian tertinggi", "Highest Rated")}</option>
                  <option value="price">{t("Harga terendah", "Lowest Price")}</option>
                  <option value="accessibility">{t("Paling aksesibel", "Most Accessible")}</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
                  <Filter className="w-4 h-4" />
                  <span>{t("Filter lainnya", "More Filters")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workshop Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWorkshops.map((workshop) => {
              const enrollmentStatus = getEnrollmentStatus(workshop.id);
              return (
                <div
                  key={workshop.id}
                  className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20 group overflow-hidden transform hover:scale-[1.02]"
                >
                  {/* Workshop Header with Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <div className="absolute top-4 left-4 flex space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
                        workshop.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        workshop.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {workshop.level}
                      </span>
                      {userAssessment && workshop.recommendationScore && workshop.recommendationScore > 70 && (
                        <span className="bg-white/90 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium flex items-center animate-pulse shadow-lg">
                          <Target className="w-3 h-3 mr-1" />
                          {t("Direkomendasikan", "Recommended")}
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={() => toggleSaveWorkshop(workshop.id)}
                        disabled={pending}
                        className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                          savedWorkshops.includes(workshop.id) 
                            ? 'bg-red-500 text-white shadow-lg' 
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${savedWorkshops.includes(workshop.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white">
                        <div className="text-sm opacity-90 mb-1">{workshop.category}</div>
                        <h3 className="text-xl font-bold leading-tight mb-2">{workshop.title}</h3>
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4" />
                          <span>by {workshop.instructor}</span>
                          <div className="flex items-center ml-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span>{workshop.instructorRating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workshop Content */}
                  <div className="p-6">
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2 leading-relaxed">
                      {workshop.description.length > 120 ? `${workshop.description.substring(0, 120)}...` : workshop.description}
                    </p>

                    {/* Workshop Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                        <span>{workshop.duration}</span>
                      </div>
                      <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Users className="w-4 h-4 mr-2 text-green-500" />
                        <span>{workshop.enrolled} {t("peserta", "enrolled")}</span>
                      </div>
                      <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <BookOpen className="w-4 h-4 mr-2 text-purple-500" />
                        <span>{workshop.lessons} {t("pelajaran", "lessons")}</span>
                      </div>
                      <div className="flex items-center bg-gray-50 p-2 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-gray-600">{workshop.rating}</span>
                      </div>
                    </div>

                    {/* Accessibility Score */}
                    <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Accessibility className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {t("Skor aksesibilitas:", "Accessibility Score:")} {workshop.deafFriendlyScore}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i < Math.floor(workshop.deafFriendlyScore / 20) ? 'bg-green-500 shadow-md' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workshop.skillTags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                          {tag}
                        </span>
                      ))}
                      {workshop.skillTags.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs shadow-md">
                          +{workshop.skillTags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Next Session */}
                    <div className="flex items-center text-sm text-gray-600 mb-4 bg-blue-50 rounded-xl p-3 shadow-lg">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      <span>{t("Sesi berikutnya:", "Next session:")} {workshop.nextSession}</span>
                    </div>

                    {/* Language Support */}
                    <div className="flex items-center mb-4 text-sm bg-gray-50 rounded-xl p-3 shadow-lg">
                      <Hand className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-gray-600">{workshop.language.join(', ')}</span>
                      {workshop.language.includes('ASL') && (
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium shadow-md">
                          {t("Dukungan ASL", "ASL Supported")}
                        </span>
                      )}
                    </div>

                    {/* Job Placement Rate */}
                    {workshop.jobPlacementRate && (
                      <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {t("Tingkat penempatan kerja:", "Job Placement Rate:")} {workshop.jobPlacementRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-2xl shadow-md">
                        {workshop.price}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedWorkshop(workshop)}
                          className="px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          {t("Lihat detail", "View Details")}
                        </button>
                        {enrollmentStatus ? (
                          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-2xl text-sm font-medium flex items-center shadow-lg">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t("Terdaftar", "Enrolled")}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(workshop)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-xl hover:shadow-2xl transform hover:scale-105"
                          >
                            {t("Daftar sekarang", "Enroll Now")}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Enrollment Status Progress */}
                    {enrollmentStatus && (
                      <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-2xl p-3 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-800">{t("Progres", "Progress")}</span>
                          <span className="text-sm text-green-600">{enrollmentStatus.progress}%</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300 shadow-md"
                            style={{ width: `${enrollmentStatus.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredWorkshops.length === 0 && (
            <div className="text-center py-16 bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
              <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t("Workshop belum ditemukan", "No workshops found")}</h3>
              <p className="text-gray-600 mb-6">{t("Coba ubah pencarian atau pilih kategori lain.", "Try adjusting your search criteria or browse different categories")}</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLevel('All');
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t("Hapus filter", "Clear Filters")}
              </button>
            </div>
          )}

          {/* Workshop Detail Modal */}
          {selectedWorkshop && (
            <WorkshopDetailModal
              workshop={selectedWorkshop}
              isEnrolled={Boolean(getEnrollmentStatus(selectedWorkshop.id))}
              enrollmentStatus={getEnrollmentStatus(selectedWorkshop.id)}
              onClose={() => setSelectedWorkshop(null)}
              onEnroll={() => handleEnroll(selectedWorkshop)}
              onSave={() => toggleSaveWorkshop(selectedWorkshop.id)}
              isSaved={savedWorkshops.includes(selectedWorkshop.id)}
            />
          )}

          {/* Enrollment Modal */}
          {showEnrollmentModal && currentEnrollmentWorkshop && (
            <EnrollmentModal
              workshop={currentEnrollmentWorkshop}
              onClose={() => setShowEnrollmentModal(false)}
              onConfirm={confirmEnrollment}
              pending={pending}
              error={error}
            />
          )}
        </div>
      </div>

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

// Workshop Detail Modal Component
function WorkshopDetailModal({ 
  workshop, 
  isEnrolled, 
  enrollmentStatus, 
  onClose, 
  onEnroll, 
  onSave, 
  isSaved 
}: { 
  workshop: Workshop; 
  isEnrolled: boolean; 
  enrollmentStatus?: EnrollmentStatus; 
  onClose: () => void; 
  onEnroll: () => void; 
  onSave: () => void; 
  isSaved: boolean; 
}) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t("Detail workshop", "Workshop Details")}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Workshop Header */}
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    workshop.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                    workshop.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {workshop.level}
                  </span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {workshop.category}
                  </span>
                  {workshop.certificateIncluded && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm flex items-center">
                      <Award className="w-3 h-3 mr-1" />
                      {t("Sertifikat", "Certificate")}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{workshop.title}</h2>
                <p className="text-lg text-indigo-600 font-medium mb-4">by {workshop.instructor}</p>
                
                {/* Instructor Rating */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span>{t("Pengajar:", "Instructor:")} {workshop.instructorRating}</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span>{t("Penyelesaian:", "Completion:")} {workshop.completionRate}%</span>
                  </div>
                  {workshop.jobPlacementRate && (
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-blue-500 mr-1" />
                      <span>{t("Penempatan kerja:", "Job Placement:")} {workshop.jobPlacementRate}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("Tentang workshop", "About This Workshop")}</h3>
                <p className="text-gray-600 leading-relaxed">{workshop.description}</p>
              </div>

              {/* Learning Outcomes */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("Yang akan dipelajari", "What You'll Learn")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workshop.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills You'll Gain */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("Keterampilan yang akan didapat", "Skills You'll Gain")}</h3>
                <div className="flex flex-wrap gap-2">
                  {workshop.skillTags.map((skill, index) => (
                    <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              {workshop.prerequisites && workshop.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("Prasyarat", "Prerequisites")}</h3>
                  <div className="space-y-2">
                    {workshop.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                        {prereq}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Features */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("Fitur kursus", "Course Features")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Video className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">{t("Pelajaran video", "Video Lessons")}</div>
                    <div className="text-xs text-gray-600">{workshop.lessons} {t("pelajaran", "lessons")}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Hand className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">{t("Dukungan ASL", "ASL Support")}</div>
                    <div className="text-xs text-gray-600">Full interpretation</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">{t("Komunitas", "Community")}</div>
                    <div className="text-xs text-gray-600">Peer support</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">{t("Sertifikat", "Certificate")}</div>
                    <div className="text-xs text-gray-600">Upon completion</div>
                  </div>
                </div>
              </div>

              {/* Accessibility Features */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("Fitur aksesibilitas", "Accessibility Features")}</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">Sign language interpretation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">Visual learning materials</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">Written transcripts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">Flexible pacing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">Live Q&A sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">Mobile accessibility</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 sticky top-4">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{workshop.price}</div>
                  <div className="text-sm text-gray-600">Full course access</div>
                </div>

                {/* Workshop Stats */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Durasi:", "Duration:")}</span>
                    <span className="font-medium">{workshop.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Tingkat:", "Level:")}</span>
                    <span className="font-medium">{workshop.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Pelajaran:", "Lessons:")}</span>
                    <span className="font-medium">{workshop.lessons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Terdaftar:", "Enrolled:")}</span>
                    <span className="font-medium">{workshop.enrolled} students</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Kapasitas:", "Max Students:")}</span>
                    <span className="font-medium">{workshop.maxStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Penilaian:", "Rating:")}</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">{workshop.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Sesi berikutnya:", "Next session:")}</span>
                    <span className="font-medium text-sm">{workshop.nextSession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("Bahasa:", "Languages:")}</span>
                    <span className="font-medium text-sm">{workshop.language.join(', ')}</span>
                  </div>
                </div>

                {/* Accessibility Score */}
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    <Accessibility className="w-5 h-5 mr-2" />
                    Accessibility Score
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="w-full mr-3">
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${workshop.deafFriendlyScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {workshop.deafFriendlyScore}%
                    </span>
                  </div>
                </div>

                {/* Enrollment Status or Actions */}
                {isEnrolled ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">{t("Terdaftar", "Enrolled")}</span>
                      </div>
                      {enrollmentStatus && (
                        <div>
                          <div className="flex justify-between text-sm text-green-700 mb-1">
                            <span>{t("Progres", "Progress")}</span>
                            <span>{enrollmentStatus.progress}%</span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${enrollmentStatus.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
                      <PlayCircle className="w-5 h-5" />
                      <span>{t("Lanjut belajar", "Continue Learning")}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={onEnroll}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <span>{t("Daftar workshop", "Enroll in Workshop")}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={onSave}
                        className={`border border-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm flex items-center justify-center space-x-1 ${
                          isSaved ? 'bg-red-50 border-red-300 text-red-600' : 'text-gray-700'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                      <button className="border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm flex items-center justify-center space-x-1">
                        <ExternalLink className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* What's Included */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">This workshop includes:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>{workshop.lessons} video lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Hand className="w-4 h-4" />
                      <span>ASL interpretation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Downloadable resources</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Community access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Lifetime access</span>
                    </div>
                    {workshop.jobPlacementRate && (
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span>Job placement assistance</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enrollment Modal Component
function EnrollmentModal({ workshop, onClose, onConfirm, pending, error }: {
  workshop: Workshop;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  error: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t("Daftar workshop", "Enroll in Workshop")}</h3>
          <p className="text-gray-600 mb-6">
            You're about to enroll in <strong>{workshop.title}</strong> by {workshop.instructor}.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("Harga:", "Price:")}</span>
                <span className="font-semibold">{workshop.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("Durasi:", "Duration:")}</span>
                <span className="font-semibold">{workshop.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("Tingkat:", "Level:")}</span>
                <span className="font-semibold">{workshop.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("Sesi berikutnya:", "Next Session:")}</span>
                <span className="font-semibold text-xs">{workshop.nextSession}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              {t("Batal", "Cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
            >
              {pending ? 'Menyimpan...' : 'Confirm Enrollment'}
            </button>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}

