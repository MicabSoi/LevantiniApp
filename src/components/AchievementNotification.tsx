import React, { useState, useEffect } from 'react';
import { Trophy, X } from 'lucide-react';
import { Achievement } from '../context/ProgressContext';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ 
  achievement, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close after 5 seconds
    const autoClose = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoClose);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white dark:bg-dark-200 rounded-lg shadow-lg border border-emerald-200 dark:border-emerald-800 p-4 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-2 mr-3">
              <Trophy size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                Achievement Unlocked!
              </h4>
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{achievement.icon}</span>
                <span className="font-medium">{achievement.name}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {achievement.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification; 