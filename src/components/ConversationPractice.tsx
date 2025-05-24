import React from 'react';
import {
  MessageCircle,
  Play,
  Mic,
  Users,
  Coffee,
  ShoppingCart,
  MapPin,
  ChevronRight,
} from 'lucide-react';

interface ConversationPracticeProps {
  setSubTab: (tab: string) => void;
}

const conversationScenarios = [
  {
    id: 1,
    title: 'At the Café',
    description: 'Order drinks and food, ask for recommendations',
    icon: <Coffee size={24} className="text-emerald-600" />,
    level: 'Beginner',
    duration: '5-10 min',
    status: 'Coming Soon'
  },
  {
    id: 2,
    title: 'Shopping at the Market',
    description: 'Negotiate prices, ask about products',
    icon: <ShoppingCart size={24} className="text-emerald-600" />,
    level: 'Intermediate',
    duration: '10-15 min',
    status: 'Coming Soon'
  },
  {
    id: 3,
    title: 'Asking for Directions',
    description: 'Find your way around the city',
    icon: <MapPin size={24} className="text-emerald-600" />,
    level: 'Beginner',
    duration: '5-8 min',
    status: 'Coming Soon'
  },
  {
    id: 4,
    title: 'Meeting New Friends',
    description: 'Introduce yourself and make small talk',
    icon: <Users size={24} className="text-emerald-600" />,
    level: 'Beginner',
    duration: '8-12 min',
    status: 'Coming Soon'
  },
];

const practiceFeatures = [
  {
    icon: <MessageCircle size={20} className="text-emerald-600" />,
    title: 'AI Conversation Partner',
    description: 'Practice with an AI that responds like a native speaker'
  },
  {
    icon: <Mic size={20} className="text-emerald-600" />,
    title: 'Speech Recognition',
    description: 'Get feedback on your pronunciation and fluency'
  },
  {
    icon: <Play size={20} className="text-emerald-600" />,
    title: 'Role-Play Scenarios',
    description: 'Practice real-life situations you\'ll encounter'
  },
];

const ConversationPractice: React.FC<ConversationPracticeProps> = ({ setSubTab }) => {
  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Fluency
      </button>

      <h2 className="text-xl font-bold mb-6">Conversation Practice</h2>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-3">
          Practice Real Conversations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {practiceFeatures.map((feature, index) => (
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
        Conversation Scenarios
      </h3>

      <div className="space-y-4">
        {conversationScenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mr-4">
                {scenario.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {scenario.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {scenario.description}
                </p>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full">
                    {scenario.level}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {scenario.duration}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm mr-2">
                {scenario.status}
              </span>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300">
        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-100">
          Interactive Conversations Coming Soon
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We're developing an AI conversation partner that will help you practice real-life scenarios with instant feedback on your pronunciation and grammar.
        </p>
        <button className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          Get Notified When Ready
        </button>
      </div>
    </div>
  );
};

export default ConversationPractice; 