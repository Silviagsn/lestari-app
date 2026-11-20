'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Heart,
  Users,
  BookOpen,
  Phone,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  mood?: string;
}

interface MoodOption {
  emoji: string;
  label: string;
  color: string;
  value: string;
}

const moodOptions: MoodOption[] = [
  { emoji: '😊', label: 'Great', color: 'bg-green-100 text-green-800 border-green-300', value: 'great' },
  { emoji: '🙂', label: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-300', value: 'good' },
  { emoji: '😐', label: 'Okay', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', value: 'okay' },
  { emoji: '😟', label: 'Not Good', color: 'bg-orange-100 text-orange-800 border-orange-300', value: 'not-good' },
  { emoji: '😢', label: 'Terrible', color: 'bg-red-100 text-red-800 border-red-300', value: 'terrible' }
];

const quickResponses = [
  "I'm feeling anxious",
  "I need someone to talk to",
  "Help me relax",
  "I'm having trouble sleeping",
  "I feel overwhelmed",
  "I need motivation"
];

const selfCareTips = [
  {
    title: "Deep Breathing Exercise",
    description: "Try the 4-7-8 breathing technique",
    steps: [
      "Breathe in through your nose for 4 counts",
      "Hold your breath for 7 counts",
      "Exhale through your mouth for 8 counts",
      "Repeat this cycle 3-4 times slowly"
    ]
  },
  {
    title: "Mindfulness Moment",
    description: "Ground yourself with this 5-4-3-2-1 technique",
    steps: [
      "Name 5 things you can see around you",
      "Name 4 things you can touch",
      "Name 3 things you can hear right now",
      "Name 2 things you can smell",
      "Name 1 thing you can taste"
    ]
  },
  {
    title: "Progressive Muscle Relaxation",
    description: "Release tension from your body systematically",
    steps: [
      "Start with your toes, tense for 5 seconds",
      "Release and notice the relaxation feeling",
      "Move up through each muscle group",
      "End with your face and scalp muscles"
    ]
  },
  {
    title: "Gratitude Practice",
    description: "Shift focus to positive thoughts and feelings",
    steps: [
      "Think of 3 specific things you're grateful for today",
      "Write them down if possible",
      "Reflect deeply on why they matter to you",
      "Feel the positive emotions they bring"
    ]
  }
];

const supportGroups = [
  {
    title: "Weekly Peer Support",
    time: "Every Tuesday, 7:00 PM",
    description: "Connect with others in a safe, supportive environment",
    link: "https://meet.google.com/example-peer-support"
  },
  {
    title: "Deaf Mental Health Circle",
    time: "Saturdays, 2:00 PM",
    description: "Specialized support for the deaf community",
    link: "https://zoom.us/deaf-mental-health"
  },
  {
    title: "Young Adults Group",
    time: "Thursdays, 6:30 PM",
    description: "For ages 18-30, discussing life transitions and challenges",
    link: "https://meet.google.com/young-adults-support"
  },
  {
    title: "Anxiety Support Circle",
    time: "Mondays, 8:00 PM",
    description: "Focused support for anxiety management",
    link: "https://zoom.us/anxiety-support"
  }
];

const resources = [
  { title: "Understanding Depression", type: "Article", readTime: "5 min read", link: "https://www.who.int/news-room/fact-sheets/detail/depression" },
  { title: "Anxiety Management Techniques", type: "Video Guide", readTime: "12 min watch", link: "https://www.youtube.com/watch?v=anxiety-help" },
  { title: "Building Mental Resilience", type: "PDF Guide", readTime: "15 min read", link: "https://www.apa.org/topics/resilience" },
  { title: "Sleep Hygiene Tips", type: "Interactive Guide", readTime: "8 min guide", link: "https://www.sleepfoundation.org/sleep-hygiene" },
  { title: "Mindfulness Meditation", type: "Audio Guide", readTime: "10 min listen", link: "https://www.headspace.com/meditation/mindfulness" },
  { title: "Crisis Coping Strategies", type: "Emergency Guide", readTime: "3 min read", link: "https://suicidepreventionlifeline.org/help-yourself/" }
];

// Memanggil server (/api/chat), bukan Gemini langsung
const callGeminiAPI = async (messagesHistory: Message[], adultConsent: boolean, mood?: string): Promise<string> => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messagesHistory: messagesHistory.slice(-16).map(({ type, message }) => ({ type, message })), adultConsent, mood })
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.text !== 'string') throw new Error(data?.error || 'Chat AI sedang tidak tersedia.');
  return data.text;
};

export default function MentalHealthChatbot({ active }: { active: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      message: 'Hai, aku Lesbot. Aku bisa menemani kamu ngobrol. Apa yang ingin kamu ceritakan hari ini?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [adultConsent, setAdultConsent] = useState(false);
  const [chatError, setChatError] = useState('');
  const [currentMood, setCurrentMood] = useState<string>('');
  const [showMoodSelector, setShowMoodSelector] = useState(true);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/chat', { signal: controller.signal })
      .then(async response => setConfigured(response.ok && (await response.json()).configured === true))
      .catch(() => { if (!controller.signal.aborted) setConfigured(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const list = messagesEndRef.current?.parentElement;
    if (active && list) list.scrollTop = list.scrollHeight;
  }, [active, messages, isTyping]);

  const canSend = configured === true && adultConsent && !isTyping;

  const addBotMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, type: 'bot', message: text, timestamp: new Date() }
    ]);
  };

  const sendMessage = async (text: string, mood: string) => {
    if (!text.trim() || !canSend) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      message: text.trim(),
      timestamp: new Date(),
      mood
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setChatError('');
    setIsTyping(true);

    try {
      const response = await callGeminiAPI([...messages, userMessage], adultConsent, mood);
      addBotMessage(response);
    } catch (error) {
      setMessages(previous => previous.filter(message => message.id !== userMessage.id));
      setNewMessage(text);
      setChatError(error instanceof Error ? error.message : 'Chat AI sedang tidak tersedia.');
    } finally {
      setIsTyping(false);
      setShowMoodSelector(false);
    }
  };

  const handleSendMessage = () => void sendMessage(newMessage, currentMood);

  const handleQuickResponse = (response: string) => {
    setNewMessage(response);
  };

  const handleMoodSelection = (mood: string) => {
    const selectedMoodOption = moodOptions.find(option => option.value === mood);
    if (!selectedMoodOption) return;
    setCurrentMood(mood);
    const text = `I'm feeling ${selectedMoodOption.label.toLowerCase()} today ${selectedMoodOption.emoji}`;
    if (canSend) void sendMessage(text, mood);
    else setNewMessage(text);
  };

  const handleResourceClick = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <div>
        <div className="border-b border-indigo-100">
          {configured !== true && <p role="status" className="border-b border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
            {configured === null ? 'Menghubungkan ke Lesbot…' : 'Chat belum tersedia. Coba buka lagi nanti.'}
          </p>}
          {/* Mood Selector */}
          {showMoodSelector && (
            <div className="border-b bg-indigo-50/50 p-3">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Bagaimana perasaanmu?</h3>
              <div className="flex flex-wrap gap-1.5">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    disabled={isTyping}
                    onClick={() => handleMoodSelection(mood.value)}
                    className={`rounded-full px-2 py-1 text-xs ${mood.color} border hover:shadow-sm`}
                  >
                    <span className="mr-1" aria-hidden="true">{mood.emoji}</span>
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div role="log" aria-label="Percakapan Lesbot" className="max-h-36 min-h-24 space-y-3 overflow-y-auto overscroll-contain p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] md:max-w-md ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    )}
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900 border'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600">
                    <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-2xl border">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses */}
          <details className="border-t bg-gray-50 px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-indigo-800">Ide pesan cepat</summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickResponses.map((response, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickResponse(response)}
                  className="rounded-full border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-purple-50"
                >
                  {response}
                </button>
              ))}
            </div>
          </details>

          {/* Chat Input */}
          <div className="border-t border-indigo-100 p-3">
            {configured === true && (
              <label className="mb-2 flex items-start gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={adultConsent} disabled={isTyping} onChange={event => setAdultConsent(event.target.checked)} className="mt-1 shrink-0 accent-indigo-700" />
                <span>Saya berusia 18 tahun atau lebih dan setuju pesan dikirim ke Google Gemini. Hindari mencantumkan data pribadi.</span>
              </label>
            )}
            {chatError && <p role="alert" className="mb-3 text-sm text-red-800">{chatError}</p>}
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                maxLength={4000}
                disabled={isTyping || configured === false}
                aria-label="Pesan untuk Lesbot"
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tulis pesan…"
                className="min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white p-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !canSend}
                aria-label="Kirim pesan"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        <details className="p-3">
          <summary className="cursor-pointer text-sm font-semibold text-indigo-800">Panduan dan bantuan</summary>
          <div className="mt-3 space-y-3">
          {/* Self-Care Tips */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mr-3">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Self-Care Tips</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selfCareTips.map((tip, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <button
                    onClick={() => setExpandedTip(expandedTip === index ? null : index)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-sm md:text-base">{tip.title}</h4>
                      {expandedTip === index ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <p className="text-gray-600 text-xs md:text-sm mt-1">{tip.description}</p>
                  </button>
                  {expandedTip === index && (
                    <div className="mt-3 space-y-2">
                      {tip.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start text-xs md:text-sm text-gray-600">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Support Groups */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Support Groups</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportGroups.map((group, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 text-sm md:text-base">{group.title}</h4>
                  <p className="text-purple-600 text-xs md:text-sm font-medium">{group.time}</p>
                  <p className="text-gray-600 text-xs md:text-sm mt-1">{group.description}</p>
                  <button
                    onClick={() => handleResourceClick(group.link)}
                    className="mt-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs md:text-sm hover:bg-blue-200 transition-colors inline-flex items-center"
                  >
                    Join Group <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Resources & Articles */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Resources & Articles</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 text-sm md:text-base">{resource.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-purple-600 text-xs font-medium">{resource.type}</span>
                    <span className="text-gray-500 text-xs">{resource.readTime}</span>
                  </div>
                  <button
                    onClick={() => handleResourceClick(resource.link)}
                    className="mt-3 w-full bg-purple-100 text-purple-700 py-2 rounded-lg text-xs md:text-sm hover:bg-purple-200 transition-colors inline-flex items-center justify-center"
                  >
                    Read More <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Support */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 md:p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-red-800">Emergency Support</h3>
            </div>
            <p className="text-red-700 text-sm md:text-base mb-4">
              If you're in crisis or having thoughts of self-harm, please reach out immediately. You're not alone.
            </p>
            <div className="space-y-3">
              <a
                href="https://www.healing119.id/" target="_blank" rel="noopener noreferrer"
                className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors text-sm md:text-base font-medium flex items-center justify-center"
              >
                <Phone className="w-4 h-4 mr-2" />
                Bantuan krisis Kemenkes · Healing119.id
              </a>
            </div>
          </div>
        </div>
          <p className="px-3 pb-2 text-xs text-slate-600">Lesbot memberikan dukungan umum. Untuk perawatan kesehatan mental, hubungi tenaga profesional.</p>
        </details>
    </div>
  );
}
