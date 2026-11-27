'use client';

import { useLanguage } from './Language';
import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Play, 
  Eye,
  Hand,
  MessageSquare,
  Volume2,
  BookOpen,
  Heart,
  Zap,
  Shield,
  Clock,
  Globe,
  Accessibility
} from 'lucide-react';
import { features } from './Features'; // Disesuaikan dengan F besar
import type { PublicCatalog } from './PublicHeader';
import WebsiteGuide from './WebsiteGuide';
import CommunityStats from './CommunityStats';
import CommunityStories from './CommunityStories';

const homeAction = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700';
const featureAction = 'inline-flex min-h-10 items-center gap-1.5 rounded-lg text-left font-semibold text-indigo-700 after:absolute after:inset-0 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700';

export default function HomePage({ setCurrentPage, onBrowse }: {
  setCurrentPage?: (page: string) => void;
  onBrowse?: (page: PublicCatalog) => void;
}) {
  const { t } = useLanguage();
  const [currentFeature, setCurrentFeature] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const accessibilityFeatures = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Visual Communication",
      description: "All content optimized for visual learning with clear icons and illustrations",
      color: "bg-blue-100 text-blue-600",
      shadow: "shadow-blue-200"
    },
    {
      icon: <Hand className="w-8 h-8" />,
      title: "Sign Language Support",
      description: "ASL interpretation available for all video content and live sessions",
      color: "bg-green-100 text-green-600",
      shadow: "shadow-green-200"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Text-Based Interface",
      description: "Chat and text communication prioritized throughout the platform",
      color: "bg-purple-100 text-purple-600",
      shadow: "shadow-purple-200"
    },
    {
      icon: <Volume2 className="w-8 h-8" />,
      title: "Audio-Visual Alerts",
      description: "Visual notifications and vibration alerts for important updates",
      color: "bg-orange-100 text-orange-600",
      shadow: "shadow-orange-200"
    }
  ];

  const benefits = [
    {
      icon: <Eye className="w-6 h-6 text-blue-500" />,
      title: "Visual-First Design",
      description: "Every feature designed with visual communication in mind",
      gradient: "from-blue-50 to-blue-100"
    },
    {
      icon: <Hand className="w-6 h-6 text-green-500" />,
      title: "ASL Integration",
      description: "Sign language tutorials and interpretation services",
      gradient: "from-green-50 to-green-100"
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      title: "Accessibility Verified",
      description: "All job postings verified for deaf-friendly workplaces",
      gradient: "from-purple-50 to-purple-100"
    },
    {
      icon: <Heart className="w-6 h-6 text-red-500" />,
      title: "Mental Wellness",
      description: "24/7 AI-powered mental health support chat",
      gradient: "from-red-50 to-red-100"
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Real-Time Tools",
      description: "Speech-to-text and live transcription services",
      gradient: "from-yellow-50 to-yellow-100"
    },
    {
      icon: <Globe className="w-6 h-6 text-indigo-500" />,
      title: t("Komunitas global", "Global Community"),
      description: "Connect with deaf professionals worldwide",
      gradient: "from-indigo-50 to-indigo-100"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
          
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-2xl opacity-60 animate-float"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-60 animate-float-delayed"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-sm font-medium mb-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <Accessibility className="w-4 h-4 mr-2" />
              {t("Platform untuk komunitas Tuli", "100% Deaf-Friendly Platform")}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-30 -z-10"></div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight mb-6">
              {t("Mendukung", "Empowering the")} <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t("Komunitas Tuli", "Deaf Community")}
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
              {t("Temukan pekerjaan, pelajari keterampilan baru, dan akses dukungan kesehatan mental dengan teknologi yang lebih aksesibel.", "The world’s first comprehensive platform designed exclusively for deaf individuals. Find employment, learn new skills, and maintain mental wellness through accessible technology.")}
            </p>

            <div className="flex flex-wrap justify-center items-center gap-4 mb-10">
              <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
                <Eye className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">{t("Mengutamakan visual", "Visual First")}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
                <Hand className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">{t("Dukungan ASL", "ASL Support")}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-100">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">{t("Berbasis teks", "Text Based")}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {setCurrentPage ? <WebsiteGuide navigate={setCurrentPage} /> : <>
                <Link href="/daftar" className={`${homeAction} bg-gradient-to-r from-indigo-700 to-violet-700 text-white hover:from-indigo-800 hover:to-violet-800`}>
                  {t('Daftar', 'Sign up')}<ChevronRight aria-hidden="true" className="h-5 w-5" />
                </Link>
                <Link href="/masuk" className={`${homeAction} border border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50`}>{t('Masuk', 'Sign in')}</Link>
              </>}
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="group border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-2xl font-semibold hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 bg-white cursor-pointer"
              >
                <Play className="w-5 h-5" />
                <span>{t("Lihat fitur", "Explore features")}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("Dirancang untuk aksesibilitas", "Built for Accessibility")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("Setiap fitur mempertimbangkan kebutuhan komunitas Tuli.", "Every feature designed with the deaf community's unique needs in mind")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {accessibilityFeatures.map((feature, index) => (
              <div key={index} className={`bg-white rounded-3xl p-6 text-center hover:shadow-2xl transition-all duration-500 border border-gray-100 transform hover:scale-105 hover:-translate-y-2 shadow-lg ${feature.shadow}`}>
                <div className={`w-16 h-16 ${feature.color} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-24 py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("Fitur Lestari", "Platform Features")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("Empat fitur untuk mendukung komunitas Tuli.", "Four powerful tools designed specifically for the deaf community's success")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const catalog = feature.page === 'job-portal' || feature.page === 'workshop' ? feature.page : undefined;
              const browse = setCurrentPage ? () => setCurrentPage(feature.page) :
                catalog && onBrowse ? () => onBrowse(catalog) : undefined;
              const title = feature.page === 'job-portal' ? t('Lowongan Kerja', 'Job Portal') : feature.title;
              return (
                <div
                  key={index}
                  className={`relative isolate overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl sm:p-8 sm:hover:scale-[1.02] group ${
                    currentFeature === index ? 'ring-4 ring-indigo-300 shadow-2xl sm:scale-105' : ''
                  }`}
                  onMouseEnter={() => setCurrentFeature(index)}
                >
                  <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-transparent to-gray-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  
                  <div className="flex items-start gap-3 sm:gap-6">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20 sm:rounded-3xl`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="min-w-0 flex-1 break-words">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        {title}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {feature.description}
                      </p>
                      {browse ? (
                        <button type="button" onClick={browse} className={featureAction}
                          aria-label={t(`Jelajahi fitur ${title}`, `Explore feature ${title}`)}>
                          {t('Jelajahi fitur', 'Explore feature')}<ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                        </button>
                      ) : (
                        <Link href="/masuk" className={featureAction}
                          aria-label={t(`Masuk untuk mengakses ${feature.title}`, `Sign in to access ${feature.title}`)}>
                          {t('Masuk untuk mengakses', 'Sign in to access')}<ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("Mengapa Lestari?", "Why Choose Lestari?")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We understand the unique challenges faced by the deaf community and have created solutions that truly work
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className={`group bg-gradient-to-br ${benefit.gradient} rounded-3xl p-6 hover:shadow-xl transition-all duration-500 border border-gray-100 transform hover:scale-105 hover:-translate-y-2 shadow-lg`}>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-4 bg-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CommunityStories canReview={Boolean(setCurrentPage)} />

      <CommunityStats onBrowse={setCurrentPage ?? onBrowse} />

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-2xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-float-delayed"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg">
            {t("Siap merencanakan langkah berikutnya?", "Ready to Transform Your Future?")}
          </h2>
          <div className="flex justify-center">
            {(setCurrentPage || onBrowse) && <button type="button"
              onClick={() => (setCurrentPage ?? onBrowse)?.('workshop')}
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span>{t("Lihat workshop", "Browse Workshops")}</span>
            </button>}
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 opacity-90">
            <div className="flex items-center space-x-2 text-white bg-white bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Shield className="w-5 h-5" />
              <span className="text-sm">100% Secure</span>
            </div>
            <div className="flex items-center space-x-2 text-white bg-white bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Clock className="w-5 h-5" />
              <span className="text-sm">24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2 text-white bg-white bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Globe className="w-5 h-5" />
              <span className="text-sm">{t("Komunitas global", "Global Community")}</span>
            </div>
          </div>
        </div>
      </section>

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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
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
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
