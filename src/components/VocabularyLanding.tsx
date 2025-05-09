import React from 'react';
import { BookOpen, Clock, LibraryBig, Plane, CalendarDays } from 'lucide-react';

interface VocabularyLandingProps {
  setWordBankSubTab: (tab: string) => void;
}

const VocabularyLanding: React.FC<VocabularyLandingProps> = ({ setWordBankSubTab }) => {
  const mainOption = {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Practice with flashcards',
    icon: <BookOpen size={24} className="text-emerald-600" />,
  };

  const supplementaryOptions = [
    {
      id: 'recently learned',
      label: 'Recently Learned',
      description: 'Last 7 days',
      icon: <Clock size={24} className="text-emerald-600" />,
    },
    {
      id: 'daily words',
      label: 'Daily Words',
      description: 'Words for today',
      icon: <CalendarDays size={24} className="text-emerald-600" />,
    },
    {
      id: 'add words',
      label: 'Word Bank',
      description: 'Review and manage your words',
      icon: <LibraryBig size={24} className="text-emerald-600" />,
    },
    {
      id: 'travel dictionary',
      label: 'Travel',
      description: '100 phrases',
      icon: <Plane size={24} className="text-emerald-600" />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Vocabulary</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Build your Levantine Arabic vocabulary</p>

      {/* Main Focus: Flashcards */}
      <div
        key={mainOption.id}
        onClick={() => setWordBankSubTab(mainOption.id)}
        className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 mb-8"
      >
        <div className="flex items-center justify-center mb-3">
          <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
            {mainOption.icon}
          </div>
        </div>
        <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-gray-100">{mainOption.label}</h3>
        <p className="text-sm text-center text-gray-600 dark:text-gray-300">{mainOption.description}</p>
      </div>

      {/* Supplementary Tools Section */}
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100"> Tools</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {supplementaryOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => setWordBankSubTab(option.id)}
            className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500"
          >
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                {option.icon}
              </div>
            </div>
            <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-gray-100">{option.label}</h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocabularyLanding;
