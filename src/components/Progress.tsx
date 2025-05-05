import React from 'react';
import { BookOpen, GraduationCap, Star, Trophy, Award, TrendingUp } from 'lucide-react';

const Progress = () => {
  // This would come from your user context/state management
  const progressData = {
    level: 12,
    totalXP: 2450,
    lessonsCompleted: 15,
    totalLessons: 30,
    grammarPoints: 8,
    totalGrammarPoints: 20,
    wordsLearned: 124,
    streak: 7,
    achievements: [
      { name: "Word Collector", progress: 124, target: 200 },
      { name: "Grammar Master", progress: 8, target: 20 },
      { name: "Lesson Champion", progress: 15, target: 30 }
    ]
  };

  const calculateProgress = (current: number, total: number) => {
    return (current / total) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Level Overview */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Current Level</h3>
          <div className="flex items-center">
            <Star size={20} className="text-yellow-400 mr-2" />
            <span className="font-bold text-xl">Level {progressData.level}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 mb-2">
              <Trophy size={20} className="mr-2" />
              <span className="font-medium">Total XP</span>
            </div>
            <span className="text-2xl font-bold">{progressData.totalXP}</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center text-blue-600 dark:text-blue-400 mb-2">
              <TrendingUp size={20} className="mr-2" />
              <span className="font-medium">Day Streak</span>
            </div>
            <span className="text-2xl font-bold">{progressData.streak} days</span>
          </div>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <h3 className="font-bold mb-6">Learning Progress</h3>
        <div className="space-y-6">
          {/* Lessons Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <div className="flex items-center">
                <BookOpen size={18} className="mr-2 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium">Lessons Completed</span>
              </div>
              <span>{progressData.lessonsCompleted}/{progressData.totalLessons}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
              <div 
                className="bg-emerald-600 h-2.5 rounded-full"
                style={{ width: `${calculateProgress(progressData.lessonsCompleted, progressData.totalLessons)}%` }}
              ></div>
            </div>
          </div>

          {/* Grammar Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <div className="flex items-center">
                <GraduationCap size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Grammar Points Mastered</span>
              </div>
              <span>{progressData.grammarPoints}/{progressData.totalGrammarPoints}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${calculateProgress(progressData.grammarPoints, progressData.totalGrammarPoints)}%` }}
              ></div>
            </div>
          </div>

          {/* Words Learned */}
          <div>
            <div className="flex justify-between mb-2">
              <div className="flex items-center">
                <Award size={18} className="mr-2 text-purple-600 dark:text-purple-400" />
                <span className="font-medium">Words Learned</span>
              </div>
              <span>{progressData.wordsLearned}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full"
                style={{ width: "62%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Progress */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <h3 className="font-bold mb-4">Achievement Progress</h3>
        <div className="space-y-4">
          {progressData.achievements.map((achievement, index) => (
            <div key={index} className="bg-gray-50 dark:bg-dark-100 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{achievement.name}</span>
                <span>{achievement.progress}/{achievement.target}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-300 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${calculateProgress(achievement.progress, achievement.target)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Progress;

