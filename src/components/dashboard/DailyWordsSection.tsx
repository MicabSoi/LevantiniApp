import React from 'react';
import { Calendar, BookOpen, Star, Clock, ChevronRight } from 'lucide-react';

const DailyWordsSection: React.FC = () => {
  // Mock data for daily words
  const dailyWords = [
    {
      id: 1,
      english: 'Hello',
      arabic: 'مرحبا',
      transliteration: 'marhaban',
      learned: true
    },
    {
      id: 2,
      english: 'Good morning',
      arabic: 'صباح الخير',
      transliteration: 'sabah al-khayr',
      learned: false
    },
    {
      id: 3,
      english: 'Thank you',
      arabic: 'شكرا',
      transliteration: 'shukran',
      learned: true
    }
  ];

  const learnedCount = dailyWords.filter(word => word.learned).length;
  const totalCount = dailyWords.length;

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Today's Words
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Daily vocabulary practice
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700/50">
          <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {learnedCount}/{totalCount} learned
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round((learnedCount / totalCount) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(learnedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Words List */}
      <div className="space-y-3 mb-6">
        {dailyWords.map((word, index) => (
          <div 
            key={word.id} 
            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${
              word.learned 
                ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-700/50' 
                : 'bg-white dark:bg-dark-100 border-gray-200 dark:border-dark-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      word.learned 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{word.english}</span>
                      {word.learned && <Star size={16} className="text-emerald-600 dark:text-emerald-400 fill-current" />}
                    </div>
                  </div>
                  
                  <div className="ml-11 space-y-1">
                    <div className="text-xl font-arabic text-emerald-700 dark:text-emerald-300">{word.arabic}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 italic">{word.transliteration}</div>
                  </div>
                </div>
                
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    word.learned
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {word.learned ? (
                    <>
                      <Star size={14} className="fill-current" />
                      Learned
                    </>
                  ) : (
                    <>
                      Learn
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Subtle hover effect */}
            {!word.learned && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <BookOpen size={18} />
          <span>View All Daily Words</span>
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
};

export default DailyWordsSection; 