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
} from 'lucide-react';
import { useLearnedWords } from '../context/LearnedWordsContext';

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
    daily: { name: 'Daily Words', icon: Calendar, color: 'bg-emerald-600' },
    wordbank: { name: 'Vocabulary', icon: BookA, color: 'bg-emerald-100' },
    translate: { name: 'Translate', icon: Languages, color: 'bg-emerald-100' },
    dictionary: { name: 'Dictionary', icon: Search, color: 'bg-emerald-100' },
    alphabet: { name: 'Alphabet', icon: BookA, color: 'bg-emerald-100' },
    pronunciation: {
      name: 'Pronunciation',
      icon: Volume2,
      color: 'bg-emerald-100',
    },
    grammar: { name: 'Grammar', icon: AlignLeft, color: 'bg-emerald-100' },
  };

  // Mock stats for the dashboard
  const stats = [
    {
      title: 'Words Learned Today',
      value: todayCount,
      icon: <BookOpen className="text-emerald-500" />,
      onClick: () => setShowLearnedWords(!showLearnedWords),
    },
    {
      title: 'Current Streak',
      value: '3 days',
      icon: <TrendingUp className="text-emerald-500" />,
    },
    {
      title: 'Total Words Learned',
      value: todayCount,
      icon: <Award className="text-emerald-500" />,
    },
    {
      title: 'Study Time',
      value: '25 mins',
      icon: <Clock className="text-emerald-500" />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-6">Welcome Back!</h2>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 dark:text-gray-100">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-dark-200 p-4 rounded-lg shadow border border-gray-100 dark:border-dark-100 ${
              index === 0
                ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-100'
                : ''
            }`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-dark-100">
                {stat.icon}
              </div>
              {index === 0 && (
                <ChevronRight
                  size={16}
                  className="text-gray-400 dark:text-gray-500"
                />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stat.title}
            </p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Today's learned words section */}
      {showLearnedWords && (
        <div className="mt-6 bg-white dark:bg-dark-200 p-4 rounded-lg shadow border border-gray-100 dark:border-dark-100">
          <h3 className="text-lg font-bold mb-3">Words Learned Today</h3>

          {todayWords.length > 0 ? (
            <div className="space-y-3">
              {todayWords.map((word) => (
                <div
                  key={word.id}
                  className="border border-gray-200 dark:border-dark-100 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-dark-100"
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold">{word.word}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {word.transliteration}
                      </p>
                    </div>
                    <p className="text-emerald-600 font-medium">
                      {word.definition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No words learned today. Start learning!
            </p>
          )}
        </div>
      )}

      {/* Quick Start Section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold mb-3">Quick Start</h3>
        <div className="grid grid-cols-1 gap-3">
          {quickStartTabs.map((tabId, index) => {
            const tab = tabInfo[tabId];
            const Icon = tab.icon;
            return (
              <button
                key={tabId}
                className={`${tab.color} ${
                  tab.color === 'bg-emerald-600'
                    ? 'text-white'
                    : 'text-emerald-800'
                } p-4 rounded-lg shadow flex justify-between items-center`}
                onClick={() => setActiveTab(tabId)}
              >
                <div className="flex items-center">
                  <Icon size={20} className="mr-2" />
                  <span className="font-medium">{tab.name}</span>
                </div>
                <ChevronRight size={20} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;


