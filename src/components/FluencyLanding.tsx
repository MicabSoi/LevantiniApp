import React from 'react';
import {
  Languages,
  BookOpen,
  Users,
  GraduationCap,
  MessageCircle,
  Headphones,
  Keyboard,
  Clock,
  Hash
} from 'lucide-react';

interface FluencyLandingProps {
  setSubTab: (tab: string) => void;
}

const FluencyLanding: React.FC<FluencyLandingProps> = ({ setSubTab }) => {
  // Main feature
  const mainOption = {
    id: 'translate',
    label: 'Translate',
    description: 'Translate between English and Arabic',
    icon: <Languages size={24} className="text-emerald-600" />,
  };

  // Supplementary options
  const supplementaryOptions = [
    {
      id: 'typing',
      label: 'Typing',
      description: 'Learn Arabic keyboard and typing',
      icon: <Keyboard size={24} className="text-emerald-600" />,
    },
    {
      id: 'time',
      label: 'Time',
      description: 'Learn to tell time in Arabic',
      icon: <Clock size={24} className="text-emerald-600" />,
    },
    {
      id: 'numbers',
      label: 'Numbers',
      description: 'Practice Arabic numbers and digits',
      icon: <Hash size={24} className="text-emerald-600" />,
    },
    {
      id: 'conversation',
      label: 'Conversation',
      description: 'Role-play and dialogue exercises',
      icon: <MessageCircle size={24} className="text-emerald-600" />,
    },
    {
      id: 'listening',
      label: 'Listening Skills',
      description: 'Audio stories and listening exercises',
      icon: <Headphones size={24} className="text-emerald-600" />,
    },
    {
      id: 'community',
      label: 'Community',
      description: 'Join language exchange groups',
      icon: <Users size={24} className="text-emerald-600" />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Fluency
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Practice your Levantine Arabic skills
      </p>

      {/* Emerald wrapper div for all content */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-900/10 dark:via-dark-200 dark:to-emerald-900/5 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">

        {/* Main Focus: Translate */}
        <div
          key={mainOption.id}
          onClick={() => setSubTab(mainOption.id)}
          className="p-6 rounded-lg cursor-pointer transition-colors duration-200 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:border-emerald-500 dark:hover:border-emerald-500 mb-8 shadow-sm"
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

        {/* Supplementary Tools Section */}
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Practice
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {supplementaryOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => setSubTab(option.id)}
              className="p-6 rounded-lg cursor-pointer transition-colors duration-200 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm"
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
      </div>
    </div>
  );
};

export default FluencyLanding;



