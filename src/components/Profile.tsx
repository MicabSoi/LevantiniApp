import React from 'react';
import { User, MapPin, Star, Trophy, BookOpen, GraduationCap } from 'lucide-react';

const Profile = () => {
  // This would come from your user context/state management
  const userProfile = {
    name: "John Doe",
    country: "United States",
    level: 12,
    joinDate: "2024-01-15",
    totalXP: 2450,
    nextLevelXP: 3000,
    achievements: [
      { id: 1, name: "First Word", description: "Added your first word to your ocabulary", icon: BookOpen },
      { id: 2, name: "Grammar Master", description: "Completed all basic grammar lessons", icon: GraduationCap },
    ]
  };

  // Calculate level progress percentage
  const levelProgress = (userProfile.totalXP / userProfile.nextLevelXP) * 100;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <User size={40} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{userProfile.name}</h2>
              <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                <MapPin size={16} className="mr-1" />
                <span>{userProfile.country}</span>
              </div>
              <div className="flex items-center mt-2">
                <Star size={16} className="text-yellow-400 mr-1" />
                <span className="font-medium">Level {userProfile.level}</span>
              </div>
            </div>
          </div>
          <button className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <h3 className="font-bold mb-4">Level Progress</h3>
        <div className="mb-2 flex justify-between text-sm">
          <span>XP: {userProfile.totalXP}</span>
          <span>Next Level: {userProfile.nextLevelXP}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
          <div 
            className="bg-emerald-600 h-2.5 rounded-full"
            style={{ width: `${levelProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <h3 className="font-bold mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userProfile.achievements.map(achievement => {
            const Icon = achievement.icon;
            return (
              <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-100 rounded-lg">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                  <Icon size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Join Date */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Member since {new Date(userProfile.joinDate).toLocaleDateString()}
      </div>
    </div>
  );
};

export default Profile;

