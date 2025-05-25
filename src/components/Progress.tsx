import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Star, 
  Trophy, 
  Award, 
  TrendingUp, 
  Calendar,
  Target,
  Clock,
  Zap,
  BarChart3,
  Medal
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getWeeklyProgress, getRecentActivity, ActivityItem, WeeklyProgress } from '../lib/progressService';
import { useSupabase } from '../context/SupabaseContext';

const Progress = () => {
  const { user } = useSupabase();
  const { userProgress, achievements, stats, loading, error } = useProgress();
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyProgress[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity' | 'stats'>('overview');

  useEffect(() => {
    if (user) {
      loadAdditionalData();
    }
  }, [user]);

  const loadAdditionalData = async () => {
    if (!user) return;

    try {
      const [activity, weekly] = await Promise.all([
        getRecentActivity(user.id, 10),
        getWeeklyProgress(user.id, 8)
      ]);

      setRecentActivity(activity);
      setWeeklyData(weekly);
    } catch (err) {
      console.error('Error loading additional progress data:', err);
    }
  };

  const calculateProgress = (current: number, total: number) => {
    return total > 0 ? (current / total) * 100 : 0;
  };

  const getLevelProgress = () => {
    if (!userProgress) return 0;
    const currentLevelXP = userProgress.xp % 100;
    return (currentLevelXP / 100) * 100;
  };

  const getXPForNextLevel = () => {
    if (!userProgress) return 100;
    return 100 - (userProgress.xp % 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen size={16} className="text-emerald-600" />;
      case 'word':
        return <Award size={16} className="text-purple-600" />;
      case 'achievement':
        return <Trophy size={16} className="text-yellow-600" />;
      default:
        return <Star size={16} className="text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading progress: {error}</p>
      </div>
    );
  }

  if (!userProgress || !stats) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No progress data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-dark-100">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'activity', label: 'Activity', icon: Clock },
            { id: 'stats', label: 'Statistics', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Level Overview */}
          <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Current Level</h3>
              <div className="flex items-center">
                <Star size={20} className="text-emerald-400 mr-2" />
                <span className="font-bold text-xl">Level {userProgress.level}</span>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress to Level {userProgress.level + 1}</span>
                <span>{getXPForNextLevel()} XP to go</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getLevelProgress()}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 mb-2">
                  <Trophy size={20} className="mr-2" />
                  <span className="font-medium">Total XP</span>
                </div>
                <span className="text-2xl font-bold">{userProgress.xp.toLocaleString()}</span>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center text-orange-600 dark:text-orange-400 mb-2">
                  <Zap size={20} className="mr-2" />
                  <span className="font-medium">Day Streak</span>
                </div>
                <span className="text-2xl font-bold">{userProgress.streak} days</span>
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
                  <span>{stats.completedLessons}/{stats.totalLessons}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
                  <div 
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(stats.completedLessons, stats.totalLessons)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(calculateProgress(stats.completedLessons, stats.totalLessons))}% Complete
                </p>
              </div>

              {/* Words Learned */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <Award size={18} className="mr-2 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium">Words Learned</span>
                  </div>
                  <span>{stats.learnedWords}/{stats.totalWords}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(stats.learnedWords, stats.totalWords)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(calculateProgress(stats.learnedWords, stats.totalWords))}% Complete
                </p>
              </div>

              {/* Average Score */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <Target size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">Average Score</span>
                  </div>
                  <span>{stats.averageScore}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${stats.averageScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          {weeklyData.length > 0 && (
            <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
              <h3 className="font-bold mb-4">Weekly Progress</h3>
              <div className="flex items-end space-x-2 h-32">
                {weeklyData.map((week, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-t relative">
                      <div 
                        className="bg-emerald-500 rounded-t transition-all duration-300"
                        style={{ 
                          height: `${Math.max((week.lessonsCompleted / Math.max(...weeklyData.map(w => w.lessonsCompleted))) * 100, 5)}px` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{week.week}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
          <h3 className="font-bold mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{achievement.icon}</span>
                    <div>
                      <h4 className={`font-medium ${achievement.unlocked ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <Medal size={20} className="text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.min(achievement.current, achievement.target)}/{achievement.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        achievement.unlocked ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min((achievement.current / achievement.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {achievement.unlocked && achievement.unlocked_at && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Unlocked {formatDate(achievement.unlocked_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
          <h3 className="font-bold mb-6">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 bg-gray-50 dark:bg-dark-100 rounded-lg">
                  <div className="mr-3">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{activity.description}</p>
                  </div>
                  <div className="text-right">
                    {activity.xp && (
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        +{activity.xp} XP
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No recent activity. Start learning to see your progress here!
            </p>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-200 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
                  <p className="text-2xl font-bold">{userProgress.xp.toLocaleString()}</p>
                </div>
                <Trophy className="text-emerald-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-200 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Level</p>
                  <p className="text-2xl font-bold">{userProgress.level}</p>
                </div>
                <Star className="text-yellow-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-200 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold">{userProgress.streak}</p>
                </div>
                <Zap className="text-orange-600" size={24} />
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-200 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-dark-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
                <Target className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
            <h3 className="font-bold mb-4">Detailed Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Learning Progress</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Lessons Completed</span>
                    <span className="font-medium">{stats.completedLessons}/{stats.totalLessons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Words Learned</span>
                    <span className="font-medium">{stats.learnedWords}/{stats.totalWords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-medium">
                      {Math.round(calculateProgress(stats.completedLessons, stats.totalLessons))}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average Score</span>
                    <span className="font-medium">{stats.averageScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Streak</span>
                    <span className="font-medium">{userProgress.streak} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Achievements Unlocked</span>
                    <span className="font-medium">
                      {achievements.filter(a => a.unlocked).length}/{achievements.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;


