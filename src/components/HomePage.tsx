import React, { useState } from 'react';
import {
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  ChevronRight,
  Settings as SettingsIcon,
  Calendar,
  BookA,
  Languages,
  Search,
  Volume2,
  AlignLeft,
  LogOut,
  Target,
  Flame,
  Users,
} from 'lucide-react';
import { useLearnedWords } from '../context/LearnedWordsContext';
import { supabase } from '../lib/supabaseClient';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setActiveTab }) => {
  const { getTodayLearnedCount, getTodayLearnedWords } = useLearnedWords();
  const [quickStartTabs, setQuickStartTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('quickStartTabs');
    return saved ? JSON.parse(saved) : ['daily', 'wordbank', 'translate'];
  });
  const [showLearnedWords, setShowLearnedWords] = useState(false);

  const todayCount = getTodayLearnedCount();
  const todayWords = getTodayLearnedWords();

  const tabInfo = {
    daily: { name: 'Daily Words', icon: Calendar, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
    wordbank: { name: 'Vocabulary', icon: BookA, color: 'from-emerald-600 to-emerald-700', bgColor: 'bg-emerald-100 dark:bg-emerald-800/20' },
    translate: { name: 'Translate', icon: Languages, color: 'from-emerald-400 to-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/15' },
    dictionary: { name: 'Dictionary', icon: Search, color: 'from-emerald-700 to-emerald-800', bgColor: 'bg-emerald-100 dark:bg-emerald-800/25' },
    alphabet: { name: 'Alphabet', icon: BookA, color: 'from-emerald-300 to-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/10' },
    pronunciation: { name: 'Pronunciation', icon: Volume2, color: 'from-emerald-600 to-emerald-700', bgColor: 'bg-emerald-100 dark:bg-emerald-800/20' },
    grammar: { name: 'Grammar', icon: AlignLeft, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/18' },
  };

  // Enhanced stats for the dashboard
  const stats = [
    {
      title: 'Words Learned Today',
      value: todayCount,
      icon: <BookOpen className="text-white" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      onClick: () => setShowLearnedWords(!showLearnedWords),
    },
    {
      title: 'Current Streak',
      value: '3 days',
      icon: <Flame className="text-white" />,
      gradient: 'from-emerald-600 to-orange-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-orange-50 dark:from-emerald-900/20 dark:to-orange-900/20',
    },
    {
      title: 'Total Words',
      value: todayCount,
      icon: <Target className="text-white" />,
      gradient: 'from-emerald-400 to-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/15',
    },
    {
      title: 'Study Time',
      value: '25 mins',
      icon: <Clock className="text-white" />,
      gradient: 'from-emerald-700 to-emerald-800',
      bgColor: 'bg-emerald-100 dark:bg-emerald-800/25',
    },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error.message);
      }
      // Redirect to login page or home page after logout
      window.location.href = '/login'; // Assuming you have a login route
    } catch (error) {
      console.error('An unexpected error occurred during logout:', error);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your learning progress</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden ${stat.bgColor} rounded-xl border border-gray-200 dark:border-dark-100 transition-all duration-300 hover:shadow-lg ${
              index === 0 ? 'cursor-pointer hover:scale-[1.02]' : ''
            }`}
            onClick={stat.onClick}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  {stat.icon}
                </div>
                {index === 0 && (
                  <ChevronRight
                    size={16}
                    className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform duration-200"
                  />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          </div>
        ))}
      </div>

      {/* Today's learned words section */}
      {showLearnedWords && (
        <div className="bg-white dark:bg-dark-100 rounded-xl p-6 border border-gray-200 dark:border-dark-100 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Words Learned Today</h3>
            <button
              onClick={() => setShowLearnedWords(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>

          {todayWords.length > 0 ? (
            <div className="space-y-3">
              {todayWords.map((word) => (
                <div
                  key={word.id}
                  className="group bg-gray-50 dark:bg-dark-200 border border-gray-200 dark:border-dark-100 rounded-lg p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">{word.word}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        {word.transliteration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        {word.definition}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No words learned today</p>
              <button 
                onClick={() => setActiveTab('learn')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Start Learning
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Start Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Quick Start</h3>
          <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
            Customize
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {quickStartTabs.map((tabId, index) => {
            const tab = tabInfo[tabId as keyof typeof tabInfo];
            const Icon = tab.icon;
            return (
              <button
                key={tabId}
                className={`group relative overflow-hidden ${tab.bgColor} border border-gray-200 dark:border-dark-100 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-left`}
                onClick={() => setActiveTab(tabId)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${tab.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{tab.name}</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;



