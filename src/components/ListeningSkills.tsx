import React from 'react';
import {
  Headphones,
  Play,
  BookOpen,
  Radio,
  Music,
  Volume2,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react';

interface ListeningSkillsProps {
  setSubTab: (tab: string) => void;
}

const listeningContent = [
  {
    id: 1,
    title: 'Lebanese Family Stories',
    description: 'Traditional stories about family life in Lebanon',
    type: 'Story',
    level: 'Beginner',
    duration: '3-5 min',
    icon: <BookOpen size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
  {
    id: 2,
    title: 'Damascus Street Conversations',
    description: 'Real conversations recorded in Damascus markets',
    type: 'Conversation',
    level: 'Intermediate',
    duration: '8-12 min',
    icon: <Radio size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
  {
    id: 3,
    title: 'Palestinian Folk Songs',
    description: 'Traditional songs with lyrics and explanations',
    type: 'Music',
    level: 'Intermediate',
    duration: '4-6 min',
    icon: <Music size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
  {
    id: 4,
    title: 'Jordanian News Clips',
    description: 'Short news segments with simplified vocabulary',
    type: 'News',
    level: 'Advanced',
    duration: '5-8 min',
    icon: <Radio size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
];

const listeningFeatures = [
  {
    icon: <Volume2 size={20} className="text-emerald-600" />,
    title: 'Variable Speed',
    description: 'Adjust playback speed from 0.5x to 2x'
  },
  {
    icon: <BookOpen size={20} className="text-emerald-600" />,
    title: 'Interactive Transcripts',
    description: 'Toggle transcripts on/off during listening'
  },
  {
    icon: <Star size={20} className="text-emerald-600" />,
    title: 'Comprehension Quizzes',
    description: 'Test your understanding after listening'
  },
];

const ListeningSkills: React.FC<ListeningSkillsProps> = ({ setSubTab }) => {
  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Fluency
      </button>

      <h2 className="text-xl font-bold mb-6">Listening Skills</h2>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <Headphones className="text-emerald-600 mr-2" size={20} />
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200">
            Immerse Yourself in Levantine Arabic
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {listeningFeatures.map((feature, index) => (
            <div key={index} className="flex items-start">
              <div className="mr-3 mt-1">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-medium text-emerald-800 dark:text-emerald-200 text-sm">
                  {feature.title}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">
        Audio Content Library
      </h3>

      <div className="space-y-4">
        {listeningContent.map((content) => (
          <div
            key={content.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mr-4">
                {content.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {content.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {content.description}
                </p>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                    {content.type}
                  </span>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full">
                    {content.level}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {content.duration}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm mr-2">
                {content.status}
              </span>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                  <Play size={16} />
                </button>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300">
        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-100">
          Rich Audio Content Coming Soon
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We're curating authentic Levantine Arabic audio content from across the region. Stories, conversations, music, and news will help you develop natural listening skills.
        </p>
        <button className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          Subscribe for Updates
        </button>
      </div>
    </div>
  );
};

export default ListeningSkills; 