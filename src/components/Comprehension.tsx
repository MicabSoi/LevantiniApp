import React from 'react';
import {
  BookOpen,
  ChevronRight,
  Star,
  Clock,
} from 'lucide-react';

interface ComprehensionProps {
  setSubTab: (tab: string) => void;
}

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

const Comprehension: React.FC<ComprehensionProps> = ({ setSubTab }) => {
  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Fluency
      </button>

      <h2 className="text-xl font-bold mb-6">Comprehension Practice</h2>

      <div className="p-4 border-b border-gray-200 dark:border-dark-300">
        <h4 className="font-bold text-md mb-3 flex items-center">
          New Learning Materials
        </h4>
        <div className="space-y-3 mt-3">
          {learningMaterials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300 hover:border-emerald-500 transition-colors cursor-pointer"
              onClick={() => { /* Add navigation logic here if needed */ }}
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

      <div className="p-4 bg-gray-100 dark:bg-dark-200 border-t border-gray-200 dark:border-dark-300">
         <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          More materials coming soon.
         </p>
      </div>
    </div>
  );
};

export default Comprehension;



