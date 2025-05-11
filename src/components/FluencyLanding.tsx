import React from 'react';
import {
  Languages,
  BookOpen,
  Users,
  GraduationCap,
} from 'lucide-react';

interface FluencyLandingProps {
  setSubTab: (tab: string) => void;
}

const FluencyLanding: React.FC<FluencyLandingProps> = ({ setSubTab }) => {
  // Combined options into a single array
  const options = [
    {
      id: 'translate',
      label: 'Translate',
      description: 'Translate between English and Arabic',
      icon: <Languages size={24} className="text-emerald-600" />,
    },
    {
      id: 'comprehension',
      label: 'Comprehension',
      description: 'Practice reading and listening',
      icon: <BookOpen size={24} className="text-emerald-600" />,
    },
    {
      id: 'community',
      label: 'Community',
      description: 'Join language exchange groups',
      icon: <Users size={24} className="text-emerald-600" />,
    },
    {
      id: 'tutor',
      label: 'Find a Tutor',
      description: 'Connect with native speakers',
      icon: <GraduationCap size={24} className="text-emerald-600" />,
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

      {/* Render all options in a single grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {options.map((option) => (
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
    </div>
  );
};

export default FluencyLanding;



