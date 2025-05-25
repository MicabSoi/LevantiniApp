import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Star, CheckCircle } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import AchievementNotification from './AchievementNotification';

interface LessonWithProgressProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent: any;
  onComplete?: () => void;
}

const LessonWithProgress: React.FC<LessonWithProgressProps> = ({
  lessonId,
  lessonTitle,
  lessonContent,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lessonScore, setLessonScore] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState<any>(null);

  const { userProgress, achievements, updateProgress } = useProgress();
  const { completeLessonWithScore, isLessonCompleted, getLessonScore } = useLessonProgress();

  const isCompleted = isLessonCompleted(lessonId);
  const previousScore = getLessonScore(lessonId);

  // Check for new achievements when progress updates
  useEffect(() => {
    const checkForNewAchievements = () => {
      const unlockedAchievements = achievements.filter(a => a.unlocked && !a.unlocked_at);
      if (unlockedAchievements.length > 0) {
        setNewAchievement(unlockedAchievements[0]);
        setShowAchievement(true);
      }
    };

    checkForNewAchievements();
  }, [achievements]);

  const handleStepComplete = async (stepScore: number) => {
    const newScore = Math.min(lessonScore + stepScore, 100);
    setLessonScore(newScore);
    
    if (currentStep < lessonContent.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Lesson completed
      await handleLessonComplete(newScore);
    }
  };

  const handleLessonComplete = async (finalScore: number) => {
    try {
      await completeLessonWithScore(lessonId, finalScore);
      
      // Award bonus XP for improvement
      if (previousScore && finalScore > previousScore) {
        const bonusXP = Math.floor((finalScore - previousScore) / 10) * 2;
        await updateProgress(bonusXP);
      }
      
      onComplete?.();
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent work! 🎉';
    if (score >= 70) return 'Good job! 👍';
    return 'Keep practicing! 💪';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Achievement Notification */}
      {showAchievement && newAchievement && (
        <AchievementNotification
          achievement={newAchievement}
          onClose={() => setShowAchievement(false)}
        />
      )}

      {/* Lesson Header */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 mb-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BookOpen size={24} className="text-emerald-600 mr-3" />
            <h1 className="text-2xl font-bold">{lessonTitle}</h1>
          </div>
          
          {isCompleted && (
            <div className="flex items-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={20} className="mr-2" />
              <span className="font-medium">Completed</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Lesson Progress</span>
            <span>{Math.round((currentStep / lessonContent.steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / lessonContent.steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Score Display */}
        {(lessonScore > 0 || previousScore) && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Score: </span>
              <span className={`font-bold ${getScoreColor(lessonScore)}`}>
                {lessonScore}%
              </span>
            </div>
            {previousScore && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Best Score: </span>
                <span className={`font-bold ${getScoreColor(previousScore)}`}>
                  {previousScore}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-200 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
              <p className="text-2xl font-bold">{userProgress?.level || 1}</p>
            </div>
            <Star className="text-yellow-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-200 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">XP</p>
              <p className="text-2xl font-bold">{userProgress?.xp || 0}</p>
            </div>
            <Trophy className="text-emerald-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-200 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Streak</p>
              <p className="text-2xl font-bold">{userProgress?.streak || 0}</p>
            </div>
            <div className="text-orange-500 text-xl">🔥</div>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        {lessonContent.steps && lessonContent.steps[currentStep] && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Step {currentStep + 1}: {lessonContent.steps[currentStep].title}
            </h2>
            
            <div className="mb-6">
              {lessonContent.steps[currentStep].content}
            </div>

            {/* Step Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={() => handleStepComplete(20)} // Award 20 points per step
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {currentStep === lessonContent.steps.length - 1 ? 'Complete Lesson' : 'Next Step'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Completion Message */}
      {lessonScore >= 100 && (
        <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400 mr-3" size={24} />
            <div>
              <h3 className="font-bold text-emerald-700 dark:text-emerald-300">
                Lesson Completed!
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400">
                {getScoreMessage(lessonScore)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonWithProgress; 