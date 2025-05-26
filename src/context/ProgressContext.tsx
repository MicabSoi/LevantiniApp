import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
import { supabase } from '../lib/supabaseClient';

export interface UserProgress {
  id: string;
  user_id: string;
  level: number;
  xp: number;
  streak: number;
  last_active: string;
  preferences: {
    daily_goal: number;
    notifications: boolean;
    theme: string;
  };
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  score: number | null;
  completed_at: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  totalWords: number;
  learnedWords: number;
  averageScore: number;
  studyTime: number; // in minutes
  currentStreak: number;
  longestStreak: number;
}

interface ProgressContextType {
  userProgress: UserProgress | null;
  lessonProgress: LessonProgress[];
  achievements: Achievement[];
  stats: ProgressStats | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  updateProgress: (xp: number) => Promise<void>;
  markLessonComplete: (lessonId: string, score: number) => Promise<void>;
  updateStreak: () => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const { user } = useSupabase();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize or fetch user progress
  const initializeProgress = async () => {
    if (!user) {
      setUserProgress(null);
      setLessonProgress([]);
      setAchievements([]);
      setStats(null);
      setLoading(false);
      return;
    }

    console.log('ProgressContext - initializing progress for user:', user.id);

    try {
      setLoading(true);
      setError(null);

      // Get or create user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      if (!progressData) {
        // Create initial progress record
        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            level: 1,
            xp: 0,
            streak: 0,
            last_active: new Date().toISOString(),
            preferences: {
              daily_goal: 10,
              notifications: true,
              theme: 'light'
            }
          })
          .select()
          .single();

        if (createError) throw createError;
        setUserProgress(newProgress);
      } else {
        setUserProgress(progressData);
      }

      // Fetch lesson progress
      console.log('ProgressContext - fetching lesson progress for user:', user.id);
      const { data: lessonProgressData, error: lessonError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id);

      if (lessonError) throw lessonError;
      console.log('ProgressContext - lesson progress data:', lessonProgressData);
      setLessonProgress(lessonProgressData || []);

      // Calculate stats
      await calculateStats();
      
      // Initialize achievements
      await initializeAchievements();

    } catch (err) {
      console.error('Error initializing progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  // Calculate user statistics
  const calculateStats = async () => {
    if (!user) return;

    try {
      // Get total lessons count
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      // Get completed lessons count
      const { count: completedLessons } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      // Get learned words count
      const { count: learnedWords } = await supabase
        .from('learned_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total vocabulary count
      const { count: totalWords } = await supabase
        .from('vocabulary_items')
        .select('*', { count: 'exact', head: true });

      // Calculate average score
      const { data: scores } = await supabase
        .from('lesson_progress')
        .select('score')
        .eq('user_id', user.id)
        .eq('completed', true)
        .not('score', 'is', null);

      const averageScore = scores && scores.length > 0
        ? scores.reduce((sum, item) => sum + (item.score || 0), 0) / scores.length
        : 0;

      setStats({
        totalLessons: totalLessons || 0,
        completedLessons: completedLessons || 0,
        totalWords: totalWords || 0,
        learnedWords: learnedWords || 0,
        averageScore: Math.round(averageScore),
        studyTime: 0, // TODO: Implement study time tracking
        currentStreak: userProgress?.streak || 0,
        longestStreak: userProgress?.streak || 0 // TODO: Track longest streak separately
      });

    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  // Initialize achievements system
  const initializeAchievements = async () => {
    const defaultAchievements: Omit<Achievement, 'current' | 'unlocked' | 'unlocked_at'>[] = [
      {
        id: 'first_lesson',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        target: 1
      },
      {
        id: 'lesson_streak_3',
        name: 'Getting Started',
        description: 'Complete lessons for 3 days in a row',
        icon: '🔥',
        target: 3
      },
      {
        id: 'lesson_streak_7',
        name: 'Week Warrior',
        description: 'Complete lessons for 7 days in a row',
        icon: '⚡',
        target: 7
      },
      {
        id: 'lesson_streak_30',
        name: 'Month Master',
        description: 'Complete lessons for 30 days in a row',
        icon: '👑',
        target: 30
      },
      {
        id: 'words_50',
        name: 'Word Collector',
        description: 'Learn 50 new words',
        icon: '📚',
        target: 50
      },
      {
        id: 'words_200',
        name: 'Vocabulary Master',
        description: 'Learn 200 new words',
        icon: '🧠',
        target: 200
      },
      {
        id: 'lessons_10',
        name: 'Lesson Champion',
        description: 'Complete 10 lessons',
        icon: '🏆',
        target: 10
      },
      {
        id: 'lessons_50',
        name: 'Learning Legend',
        description: 'Complete 50 lessons',
        icon: '🌟',
        target: 50
      },
      {
        id: 'perfect_score',
        name: 'Perfectionist',
        description: 'Get a perfect score on any lesson',
        icon: '💯',
        target: 1
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        target: 5
      },
      {
        id: 'level_10',
        name: 'Expert Learner',
        description: 'Reach level 10',
        icon: '🎓',
        target: 10
      }
    ];

    // Calculate current progress for each achievement
    const achievementsWithProgress = await Promise.all(
      defaultAchievements.map(async (achievement) => {
        let current = 0;
        let unlocked = false;
        let unlocked_at = null;

        switch (achievement.id) {
          case 'first_lesson':
          case 'lessons_10':
          case 'lessons_50':
            current = stats?.completedLessons || 0;
            break;
          case 'lesson_streak_3':
          case 'lesson_streak_7':
          case 'lesson_streak_30':
            current = userProgress?.streak || 0;
            break;
          case 'words_50':
          case 'words_200':
            current = stats?.learnedWords || 0;
            break;
          case 'perfect_score':
            // Check if user has any perfect scores
            const { data: perfectScores } = await supabase
              .from('lesson_progress')
              .select('score')
              .eq('user_id', user?.id)
              .eq('score', 100)
              .limit(1);
            current = perfectScores && perfectScores.length > 0 ? 1 : 0;
            break;
          case 'level_5':
          case 'level_10':
            current = userProgress?.level || 1;
            break;
        }

        unlocked = current >= achievement.target;
        if (unlocked) {
          unlocked_at = new Date().toISOString(); // In a real app, you'd track when it was actually unlocked
        }

        return {
          ...achievement,
          current,
          unlocked,
          unlocked_at
        };
      })
    );

    setAchievements(achievementsWithProgress);
  };

  // Update user progress (XP and level)
  const updateProgress = async (xpGained: number) => {
    if (!user || !userProgress) return;

    try {
      const newXP = userProgress.xp + xpGained;
      const newLevel = Math.floor(newXP / 100) + 1; // Simple leveling: 100 XP per level

      const { data, error } = await supabase
        .from('user_progress')
        .update({
          xp: newXP,
          level: newLevel,
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProgress(data);
      await calculateStats();
      await initializeAchievements();

    } catch (err) {
      console.error('Error updating progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  };

  // Mark lesson as complete
  const markLessonComplete = async (lessonId: string, score: number) => {
    if (!user) return;

    try {
      console.log('🔄 Marking lesson complete in database:', { lessonId, score, userId: user.id });
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          score: score,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Lesson progress saved to database:', data);

      // Update local state
      setLessonProgress(prev => {
        const existing = prev.find(p => p.lesson_id === lessonId);
        const newProgress = existing 
          ? prev.map(p => p.lesson_id === lessonId ? data : p)
          : [...prev, data];
        
        console.log('📊 Updated lesson progress state:', newProgress);
        return newProgress;
      });

      // Award XP based on score
      const xpGained = Math.floor(score / 10) * 5; // 5 XP per 10% score
      console.log('🎯 Awarding XP:', xpGained);
      await updateProgress(xpGained);

      // Update streak if this is a new completion today
      await updateStreak();

      // Recalculate stats
      await calculateStats();
      
      // Refresh all progress data to ensure context consumers have the latest information
      await refreshProgress();

    } catch (err) {
      console.error('Error marking lesson complete:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark lesson complete');
    }
  };

  // Update daily streak
  const updateStreak = async () => {
    if (!user || !userProgress) return;

    try {
      const today = new Date().toDateString();
      const lastActive = new Date(userProgress.last_active).toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      let newStreak = userProgress.streak;

      if (lastActive === today) {
        // Already active today, no change
        return;
      } else if (lastActive === yesterday) {
        // Consecutive day, increment streak
        newStreak += 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }

      const { data, error } = await supabase
        .from('user_progress')
        .update({
          streak: newStreak,
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProgress(data);
      await initializeAchievements();

    } catch (err) {
      console.error('Error updating streak:', err);
    }
  };

  // Unlock achievement (placeholder for future use)
  const unlockAchievement = async (achievementId: string) => {
    // This would be used for manual achievement unlocking
    // For now, achievements are automatically calculated
    console.log('Achievement unlocked:', achievementId);
  };

  // Refresh all progress data
  const refreshProgress = async () => {
    await initializeProgress();
  };

  // Initialize progress when user changes
  useEffect(() => {
    initializeProgress();
  }, [user]);

  // Recalculate achievements when stats change
  useEffect(() => {
    if (stats && userProgress) {
      initializeAchievements();
    }
  }, [stats, userProgress]);

  const value: ProgressContextType = {
    userProgress,
    lessonProgress,
    achievements,
    stats,
    loading,
    error,
    updateProgress,
    markLessonComplete,
    updateStreak,
    unlockAchievement,
    refreshProgress
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}; 