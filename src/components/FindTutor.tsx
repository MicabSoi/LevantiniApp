import React from 'react';
import { Users } from 'lucide-react';

interface FindTutorProps {
  setSubTab: (tab: string) => void;
}

const FindTutor: React.FC<FindTutorProps> = ({ setSubTab }) => {
  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Fluency
      </button>

      <h2 className="text-xl font-bold mb-6">Find a Tutor</h2>

      <div className="bg-gray-50 dark:bg-dark-100 p-6 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
        <Users className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 dark:text-gray-400">
          Connect with native speakers and qualified tutors.
        </p>
      </div>

      <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">
          Coming Soon
        </h3>
        <ul className="mt-2 text-sm text-emerald-700 dark:text-emerald-200 list-disc list-inside">
          <li>Browse tutor profiles and availability</li>
          <li>Schedule one-on-one sessions</li>
          <li>Group conversation practice</li>
          <li>Reviews and ratings system</li>
        </ul>
      </div>
    </div>
  );
};

export default FindTutor;


