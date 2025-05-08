import React from 'react';
import { BookOpen, AlignLeft, Volume2, GraduationCap } from 'lucide-react';

interface LearnLandingProps {
  setSubTab: (tab: string) => void;
}

const LearnLanding: React.FC<LearnLandingProps> = ({ setSubTab }) => {
  const mainOption = {
    id: 'topic', // Clicking this will lead to the topics grid view
    label: 'Lessons',
    description: 'Progressive chapters and interactive exercises',
    icon: <BookOpen size={24} className="text-emerald-600" />,
  };

  const supplementaryOptions = [
    {
      id: 'alphabet',
      label: 'Alphabet',
      description: 'Learn Arabic letters and pronunciation',
      icon: <AlignLeft size={24} className="text-emerald-600" />,
    },
    {
      id: 'pronunciation',
      label: 'Pronunciation',
      description: 'Perfect your Arabic accent',
      icon: <Volume2 size={24} className="text-emerald-600" />,
    },
    {
      id: 'grammar',
      label: 'Grammar',
      description: 'Master Arabic grammar rules',
      icon: <GraduationCap size={24} className="text-emerald-600" />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Learn
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Master Levantine Arabic step by step
      </p>

      {/* Main Focus: Lessons */}
      <div
        key={mainOption.id}
        onClick={() => setSubTab(mainOption.id)}
        className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 mb-8"
      >
        <div className="flex items-center justify-center mb-3">
          <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
            {mainOption.icon}
          </div>
        </div>
        <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-gray-100">
          {mainOption.label}
        </h3>
        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
          {mainOption.description}
        </p>
      </div>


      {/* Supplementary Materials Section */}
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Materials
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
        {supplementaryOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => setSubTab(option.id)}
            className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500"
          >
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                {option.icon}
              </div>
            </div>
            <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-gray-100">
              {option.label}
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              {option.description}
            </p>
          </div>
        ))}
      </div>


      {/* Progress Section (optional) */}
      <div className="mb-4 bg-gray-50 dark:bg-dark-100 rounded-lg p-4 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 transition-colors duration-200">
        <h3 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
          Pick up where you left off
        </h3>
        <div className="mb-2">
          <p className="font-medium text-gray-600 dark:text-gray-300">
            Letters
          </p>
        </div>
        <div className="relative">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-emerald-600">
                65%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded bg-emerald-100 dark:bg-emerald-900/20">
            <div
              style={{ width: '65%' }}
              className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 dark:bg-emerald-500"
            ></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors">
          Continue Learning
        </button>
        <button className="w-full py-3 px-4 bg-white dark:bg-dark-100 border border-emerald-600 text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 dark:hover:bg-dark-200 transition-colors">
          Quiz Me
        </button>
      </div>
    </div>
  );
};

export default LearnLanding;
