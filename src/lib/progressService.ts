import { supabase } from './supabaseClient';

export interface ProgressSummary {
  totalXP: number;
  level: number;
  streak: number;
  lessonsCompleted: number;
  wordsLearned: number;
  averageScore: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'lesson' | 'word' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  xp?: number;
  score?: number;
}

export interface LessonStats {
  lessonId: string;
  title: string;
  completed: boolean;
  score: number | null;
  attempts: number;
  timeSpent: number; // in minutes
  lastAttempt: string | null;
}

export interface WeeklyProgress {
  week: string;
  lessonsCompleted: number;
  xpGained: number;
  wordsLearned: number;
  studyTime: number;
}

// Get user's progress summary
export const getProgressSummary = async (userId: string): Promise<ProgressSummary | null> => {
  try {
    // Get user progress
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError) throw progressError;

    // Get lesson progress count
    const { count: lessonsCompleted } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    // Get learned words count
    const { count: wordsLearned } = await supabase
      .from('learned_words')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get average score
    const { data: scores } = await supabase
      .from('lesson_progress')
      .select('score')
      .eq('user_id', userId)
      .eq('completed', true)
      .not('score', 'is', null);

    const averageScore = scores && scores.length > 0
      ? scores.reduce((sum, item) => sum + (item.score || 0), 0) / scores.length
      : 0;

    // Get recent activity
    const recentActivity = await getRecentActivity(userId);

    return {
      totalXP: userProgress.xp,
      level: userProgress.level,
      streak: userProgress.streak,
      lessonsCompleted: lessonsCompleted || 0,
      wordsLearned: wordsLearned || 0,
      averageScore: Math.round(averageScore),
      recentActivity
    };

  } catch (error) {
    console.error('Error getting progress summary:', error);
    return null;
  }
};

// Get recent user activity
export const getRecentActivity = async (userId: string, limit: number = 10): Promise<ActivityItem[]> => {
  try {
    const activities: ActivityItem[] = [];

    // Get recent lesson completions
    const { data: recentLessons } = await supabase
      .from('lesson_progress')
      .select(`
        id,
        lesson_id,
        score,
        completed_at,
        lessons!inner (title)
      `)
      .eq('user_id', userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (recentLessons) {
      recentLessons.forEach(lesson => {
        const lessonData = lesson.lessons as any;
        activities.push({
          id: lesson.id,
          type: 'lesson',
          title: `Completed: ${lessonData?.title || 'Unknown Lesson'}`,
          description: `Score: ${lesson.score}%`,
          timestamp: lesson.completed_at,
          score: lesson.score,
          xp: Math.floor((lesson.score || 0) / 10) * 5
        });
      });
    }

    // Get recent words learned
    const { data: recentWords } = await supabase
      .from('learned_words')
      .select(`
        id,
        learned_at,
        vocabulary_items!inner (arabic, translation)
      `)
      .eq('user_id', userId)
      .order('learned_at', { ascending: false })
      .limit(limit);

    if (recentWords) {
      recentWords.forEach(word => {
        const vocabData = word.vocabulary_items as any;
        activities.push({
          id: word.id,
          type: 'word',
          title: `Learned: ${vocabData?.arabic || 'Unknown Word'}`,
          description: vocabData?.translation || '',
          timestamp: word.learned_at,
          xp: 2 // 2 XP per word learned
        });
      });
    }

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

// Get detailed lesson statistics
export const getLessonStats = async (userId: string): Promise<LessonStats[]> => {
  try {
    const { data: lessonProgress } = await supabase
      .from('lesson_progress')
      .select(`
        lesson_id,
        completed,
        score,
        completed_at,
        lessons!inner (title)
      `)
      .eq('user_id', userId);

    if (!lessonProgress) return [];

    // Group by lesson_id to calculate attempts
    const lessonMap = new Map<string, any>();

    lessonProgress.forEach(progress => {
      const lessonId = progress.lesson_id;
      if (!lessonMap.has(lessonId)) {
        const lessonData = progress.lessons as any;
        lessonMap.set(lessonId, {
          lessonId,
          title: lessonData?.title || 'Unknown Lesson',
          completed: progress.completed,
          score: progress.score,
          attempts: 0,
          timeSpent: 0, // TODO: Implement time tracking
          lastAttempt: progress.completed_at
        });
      }

      const lesson = lessonMap.get(lessonId);
      lesson.attempts += 1;
      
      // Keep the best score and most recent attempt
      if (progress.score && (!lesson.score || progress.score > lesson.score)) {
        lesson.score = progress.score;
      }
      
      if (progress.completed_at && (!lesson.lastAttempt || progress.completed_at > lesson.lastAttempt)) {
        lesson.lastAttempt = progress.completed_at;
        lesson.completed = progress.completed;
      }
    });

    return Array.from(lessonMap.values());

  } catch (error) {
    console.error('Error getting lesson stats:', error);
    return [];
  }
};

// Get weekly progress data for charts
export const getWeeklyProgress = async (userId: string, weeks: number = 12): Promise<WeeklyProgress[]> => {
  try {
    const weeklyData: WeeklyProgress[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Get lessons completed this week
      const { count: lessonsCompleted } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', weekStart.toISOString())
        .lte('completed_at', weekEnd.toISOString());

      // Get words learned this week
      const { count: wordsLearned } = await supabase
        .from('learned_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('learned_at', weekStart.toISOString())
        .lte('learned_at', weekEnd.toISOString());

      // Calculate XP gained (simplified calculation)
      const xpGained = (lessonsCompleted || 0) * 25 + (wordsLearned || 0) * 2;

      weeklyData.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        lessonsCompleted: lessonsCompleted || 0,
        xpGained,
        wordsLearned: wordsLearned || 0,
        studyTime: 0 // TODO: Implement time tracking
      });
    }

    return weeklyData;

  } catch (error) {
    console.error('Error getting weekly progress:', error);
    return [];
  }
};

// Calculate XP needed for next level
export const getXPForNextLevel = (currentLevel: number): number => {
  return currentLevel * 100; // 100 XP per level
};

// Calculate level from XP
export const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

// Get progress percentage for current level
export const getLevelProgress = (xp: number): number => {
  const currentLevelXP = xp % 100;
  return (currentLevelXP / 100) * 100;
};

// Award XP for different activities
export const calculateXPReward = (activityType: string, score?: number): number => {
  switch (activityType) {
    case 'lesson_complete':
      return score ? Math.floor(score / 10) * 5 : 10; // 5 XP per 10% score, minimum 10
    case 'word_learned':
      return 2;
    case 'quiz_complete':
      return score ? Math.floor(score / 10) * 3 : 5; // 3 XP per 10% score, minimum 5
    case 'daily_goal':
      return 20;
    case 'streak_bonus':
      return 10;
    default:
      return 1;
  }
}; 