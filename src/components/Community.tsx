import React from 'react';
import {
  Users,
  MessageSquare,
  Calendar,
  Globe,
  Star,
  ChevronRight,
} from 'lucide-react';

interface CommunityProps {
  setSubTab: (tab: string) => void;
}

const communityFeatures = [
  {
    id: 1,
    title: 'Language Exchange Partners',
    description: 'Connect with native Arabic speakers learning English',
    icon: <Users size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
  {
    id: 2,
    title: 'Discussion Forums',
    description: 'Join conversations about culture, language, and more',
    icon: <MessageSquare size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
  {
    id: 3,
    title: 'Virtual Events',
    description: 'Attend online meetups and cultural events',
    icon: <Calendar size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
  {
    id: 4,
    title: 'Global Chat Rooms',
    description: 'Practice with learners from around the world',
    icon: <Globe size={24} className="text-emerald-600" />,
    status: 'Coming Soon'
  },
];

const Community: React.FC<CommunityProps> = ({ setSubTab }) => {
  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Fluency
      </button>

      <h2 className="text-xl font-bold mb-6">Community</h2>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <Star className="text-emerald-600 mr-2" size={20} />
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200">
            Connect with Fellow Learners
          </h3>
        </div>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Join our community of Levantine Arabic learners and native speakers. Practice together, share experiences, and make friends!
        </p>
      </div>

      <div className="space-y-4">
        {communityFeatures.map((feature) => (
          <div
            key={feature.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mr-4">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm mr-2">
                {feature.status}
              </span>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300">
        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-100">
          Be the First to Know
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Community features are in development. Stay tuned for updates on language exchange, forums, and events!
        </p>
        <button className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          Notify Me When Available
        </button>
      </div>
    </div>
  );
};

export default Community; 