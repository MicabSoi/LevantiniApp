import React from 'react';
import { Calendar, BookOpen, Star, Clock } from 'lucide-react';

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
    <div className="bg-white dark:bg-dark-200 rounded-lg shadow-md p-6 border border-gray-200 dark:border-dark-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Calendar size={20} className="text-emerald-600 mr-2" />
          Today's Words
        </h3>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock size={14} className="mr-1" />
          {learnedCount}/{totalCount} learned
        </div>
      </div>

      <div className="space-y-3">
        {dailyWords.map((word) => (
          <div 
            key={word.id} 
            className={`p-3 rounded-lg border transition-colors ${
              word.learned 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                : 'bg-gray-50 dark:bg-dark-100 border-gray-200 dark:border-dark-300 hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{word.english}</span>
                  {word.learned && <Star size={14} className="text-emerald-600 fill-current" />}
                </div>
                <div className="text-lg font-arabic text-emerald-700 dark:text-emerald-300 mb-1">{word.arabic}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 italic">{word.transliteration}</div>
              </div>
              <button
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  word.learned
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300'
                }`}
              >
                {word.learned ? 'Learned' : 'Learn'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
          <BookOpen size={16} />
          View All Daily Words
        </button>
      </div>
    </div>
  );
};

export default DailyWordsSection; 