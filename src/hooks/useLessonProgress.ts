import { useProgress } from '../context/ProgressContext';
import { useCallback } from 'react';

export const useLessonProgress = () => {
  const { markLessonComplete, lessonProgress } = useProgress();

  const completeLessonWithScore = useCallback(async (lessonId: string, score: number) => {
    try {
      await markLessonComplete(lessonId, score);
      
      // Show success notification or celebration
      if (score >= 90) {
        // Excellent score celebration
        console.log('Excellent work! 🎉');
      } else if (score >= 70) {
        // Good score
        console.log('Good job! 👍');
      } else {
        // Needs improvement
        console.log('Keep practicing! 💪');
      }
      
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  }, [markLessonComplete]);

  const getLessonProgress = useCallback((lessonId: string) => {
    return lessonProgress.find(p => p.lesson_id === lessonId);
  }, [lessonProgress]);

  const isLessonCompleted = useCallback((lessonId: string) => {
    const progress = getLessonProgress(lessonId);
    const completed = progress?.completed || false;
    console.log(`🔍 Checking if lesson ${lessonId} is completed:`, { progress, completed });
    return completed;
  }, [getLessonProgress]);

  const getLessonScore = useCallback((lessonId: string) => {
    const progress = getLessonProgress(lessonId);
    return progress?.score || null;
  }, [getLessonProgress]);

  return {
    completeLessonWithScore,
    getLessonProgress,
    isLessonCompleted,
    getLessonScore
  };
}; 