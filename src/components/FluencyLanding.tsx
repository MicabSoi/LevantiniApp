import React from 'react';
import {
  Languages,
  BookOpen,
  Users,
  GraduationCap,
  MessageSquare,
  ChevronRight,
  Star,
  Clock,
} from 'lucide-react';

interface FluencyLandingProps {
  setSubTab: (tab: string) => void;
}

// Sample forum topics data
const forumTopics = [
  {
    id: 1,
    title: 'Tips for mastering Levantine verb conjugation',
    participants: 24,
    timestamp: '2h ago',
    preview:
      "I've been struggling with past tense conjugations. Here's what helped me...",
  },
  {
    id: 2,
    title: 'Common expressions in Damascus dialect',
    participants: 18,
    timestamp: '4h ago',
    preview: "Here are some everyday phrases you'll hear in Damascus...",
  },
  {
    id: 3,
    title: 'Lebanese vs Palestinian pronunciation',
    participants: 31,
    timestamp: '6h ago',
    preview: "Let's discuss the main differences in pronunciation between...",
  },
];

// Sample learning materials data
const learningMaterials = [
  {
    id: 1,
    title: 'Shopping at the Souq',
    date: '1 day ago',
    level: 'Intermediate',
    category: 'Daily Life',
  },
  {
    id: 2,
    title: 'Family Gatherings Vocabulary',
    date: '2 days ago',
    level: 'Beginner',
    category: 'Culture',
  },
];

const FluencyLanding: React.FC<FluencyLandingProps> = ({ setSubTab }) => {
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
      id: 'tutor',
      label: 'Find a Tutor',
      description: 'Connect with native speakers',
      icon: <GraduationCap size={24} className="text-emerald-600" />,
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
      <div className="grid grid-cols-2 gap-4">
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
            <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-white">
              {option.label}
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              {option.description}
            </p>
          </div>
        ))}
      </div>

      {/* Trending Topics Section */}
      <div className="mt-8 bg-gray-50 dark:bg-dark-100 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-300">
        <div className="p-4 border-b border-gray-200 dark:border-dark-300">
          <h3 className="font-bold text-lg flex items-center">
            <MessageSquare size={20} className="mr-2 text-emerald-600" />
            Trending Topics
          </h3>
        </div>

        {/* Forum Topics */}
        <div className="divide-y divide-gray-200 dark:divide-dark-300">
          {forumTopics.map((topic) => (
  <div
    key={topic.id}
    onClick={() => setSubTab('community')}
    className="p-4 bg-white dark:bg-dark-100 rounded-lg border border-gray-200 dark:border-dark-300 transition-colors duration-200 cursor-pointer hover:!border-emerald-500 dark:hover:!border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
  >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {topic.title}
                </h4>
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {topic.timestamp}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                {topic.preview}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <Users size={14} className="mr-1" />
                {topic.participants} participants
              </div>
            </div>
          ))}
        </div>

        {/* New Learning Materials */}
        <div className="border-t border-gray-200 dark:border-dark-300 p-4">
          <h4 className="font-bold text-md mb-3 flex items-center">
            <BookOpen size={18} className="mr-2 text-emerald-600" />
            New Learning Materials
          </h4>
          <div className="space-y-3">
            {learningMaterials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300 hover:border-emerald-500 transition-colors cursor-pointer"
                onClick={() => setSubTab('comprehension')}
              >
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {material.title}
                  </h5>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full">
                      {material.level}
                    </span>
                    <span className="text-gray-500">{material.category}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{material.date}</span>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="p-4 bg-gray-100 dark:bg-dark-200 border-t border-gray-200 dark:border-dark-300">
          <button
            onClick={() => setSubTab('community')}
            className="w-full text-center text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center justify-center"
          >
            View All Topics
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FluencyLanding;


