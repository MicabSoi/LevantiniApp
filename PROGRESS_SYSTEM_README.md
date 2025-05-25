# User Progress System Documentation

This document explains how to use the comprehensive user progress system implemented in the Levantine Arabic learning app.

## Overview

The progress system tracks user learning activities, awards XP, manages levels, maintains streaks, and unlocks achievements. It provides a gamified learning experience that motivates users to continue their language learning journey.

## Core Components

### 1. ProgressContext (`src/context/ProgressContext.tsx`)

The main context that provides progress data and functions throughout the app.

**Key Features:**
- User progress tracking (level, XP, streak)
- Lesson completion tracking
- Achievement system
- Statistics calculation
- Automatic progress initialization

**Usage:**
```tsx
import { useProgress } from '../context/ProgressContext';

const MyComponent = () => {
  const { 
    userProgress, 
    lessonProgress, 
    achievements, 
    stats,
    markLessonComplete,
    updateProgress 
  } = useProgress();
  
  // Use progress data...
};
```

### 2. Progress Service (`src/lib/progressService.ts`)

Utility functions for progress calculations and data retrieval.

**Key Functions:**
- `getProgressSummary(userId)` - Get user's overall progress
- `getRecentActivity(userId)` - Get recent learning activities
- `getLessonStats(userId)` - Get detailed lesson statistics
- `getWeeklyProgress(userId)` - Get weekly progress data for charts
- `calculateXPReward(activityType, score)` - Calculate XP for activities

### 3. Lesson Progress Hook (`src/hooks/useLessonProgress.ts`)

Custom hook for lesson-specific progress operations.

**Usage:**
```tsx
import { useLessonProgress } from '../hooks/useLessonProgress';

const LessonComponent = () => {
  const { 
    completeLessonWithScore,
    isLessonCompleted,
    getLessonScore 
  } = useLessonProgress();
  
  // Complete a lesson with score
  await completeLessonWithScore('lesson-id', 85);
  
  // Check if lesson is completed
  const completed = isLessonCompleted('lesson-id');
  
  // Get best score for lesson
  const score = getLessonScore('lesson-id');
};
```

### 4. Progress Component (`src/components/Progress.tsx`)

Main UI component for displaying user progress with multiple tabs:
- **Overview**: Level progress, learning statistics, weekly charts
- **Achievements**: Achievement grid with progress indicators
- **Activity**: Recent learning activities timeline
- **Statistics**: Detailed performance metrics

### 5. Achievement Notification (`src/components/AchievementNotification.tsx`)

Displays achievement unlock notifications with animations.

## Database Schema

### Tables

1. **user_progress**
   - `user_id` (UUID, FK to auth.users)
   - `level` (INTEGER)
   - `xp` (INTEGER)
   - `streak` (INTEGER)
   - `last_active` (TIMESTAMP)
   - `preferences` (JSONB)

2. **lesson_progress**
   - `user_id` (UUID, FK to auth.users)
   - `lesson_id` (UUID, FK to lessons)
   - `completed` (BOOLEAN)
   - `score` (INTEGER)
   - `completed_at` (TIMESTAMP)

3. **learned_words**
   - `user_id` (UUID, FK to auth.users)
   - `word_id` (UUID, FK to vocabulary_items)
   - `learned_at` (TIMESTAMP)
   - `strength` (INTEGER)
   - `next_review` (TIMESTAMP)

## Implementation Examples

### 1. Basic Lesson Integration

```tsx
import { useProgress } from '../context/ProgressContext';
import { useLessonProgress } from '../hooks/useLessonProgress';

const MyLesson = ({ lessonId }) => {
  const { updateProgress } = useProgress();
  const { completeLessonWithScore } = useLessonProgress();
  
  const handleLessonComplete = async (score) => {
    // Mark lesson as complete and award XP
    await completeLessonWithScore(lessonId, score);
    
    // Award bonus XP for perfect score
    if (score === 100) {
      await updateProgress(10); // Bonus XP
    }
  };
  
  return (
    <div>
      {/* Lesson content */}
      <button onClick={() => handleLessonComplete(95)}>
        Complete Lesson
      </button>
    </div>
  );
};
```

### 2. Quiz Integration

```tsx
const Quiz = ({ lessonId, questions }) => {
  const { completeLessonWithScore } = useLessonProgress();
  
  const handleQuizComplete = async (correctAnswers, totalQuestions) => {
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    await completeLessonWithScore(lessonId, score);
  };
  
  // Quiz implementation...
};
```

### 3. Vocabulary Learning

```tsx
const VocabularyPractice = () => {
  const { updateProgress } = useProgress();
  
  const handleWordLearned = async (wordId) => {
    // Add word to learned_words table
    await supabase.from('learned_words').insert({
      user_id: user.id,
      word_id: wordId,
      learned_at: new Date().toISOString(),
      strength: 1
    });
    
    // Award XP for learning new word
    await updateProgress(2);
  };
};
```

### 4. Progress Display

```tsx
const ProgressDisplay = () => {
  const { userProgress, stats } = useProgress();
  
  return (
    <div>
      <h2>Level {userProgress?.level}</h2>
      <p>XP: {userProgress?.xp}</p>
      <p>Streak: {userProgress?.streak} days</p>
      <p>Lessons Completed: {stats?.completedLessons}/{stats?.totalLessons}</p>
    </div>
  );
};
```

## Achievement System

### Default Achievements

1. **First Steps** - Complete your first lesson
2. **Getting Started** - 3-day streak
3. **Week Warrior** - 7-day streak
4. **Month Master** - 30-day streak
5. **Word Collector** - Learn 50 words
6. **Vocabulary Master** - Learn 200 words
7. **Lesson Champion** - Complete 10 lessons
8. **Learning Legend** - Complete 50 lessons
9. **Perfectionist** - Get a perfect score
10. **Rising Star** - Reach level 5
11. **Expert Learner** - Reach level 10

### Custom Achievements

You can add custom achievements by modifying the `initializeAchievements` function in `ProgressContext.tsx`.

## XP System

### XP Rewards

- **Lesson Completion**: 5 XP per 10% score (minimum 10 XP)
- **Word Learning**: 2 XP per word
- **Quiz Completion**: 3 XP per 10% score (minimum 5 XP)
- **Daily Goal**: 20 XP
- **Streak Bonus**: 10 XP

### Leveling

- **Level Calculation**: Level = floor(XP / 100) + 1
- **XP per Level**: 100 XP
- **Level Progress**: (XP % 100) / 100 * 100

## Streak System

- **Daily Activity**: Completing any lesson updates the streak
- **Streak Maintenance**: Must complete activity within 24 hours
- **Streak Reset**: Missing a day resets streak to 1 (not 0)

## Statistics Tracked

- Total lessons completed
- Total words learned
- Average lesson score
- Current and longest streak
- Study time (planned feature)
- Weekly progress data

## Setup Instructions

1. **Database Migration**: Run the migration files in `supabase/migrations/`
2. **Context Setup**: Wrap your app with `ProgressProvider`
3. **Component Integration**: Use `useProgress` and `useLessonProgress` hooks
4. **UI Components**: Import and use progress components as needed

## Best Practices

1. **Always await progress updates** to ensure data consistency
2. **Handle errors gracefully** in progress operations
3. **Use the hooks** rather than direct context access
4. **Award XP immediately** after user actions for better UX
5. **Show progress feedback** to keep users motivated
6. **Test achievement unlocking** thoroughly

## Troubleshooting

### Common Issues

1. **Progress not updating**: Check if user is authenticated
2. **Achievements not unlocking**: Verify achievement calculation logic
3. **Streak not working**: Ensure `last_active` is being updated
4. **XP calculation errors**: Check XP reward functions

### Debug Tools

Use the browser console to check:
- Progress context state
- Database queries
- Achievement calculations
- XP calculations

## Future Enhancements

- Study time tracking
- Spaced repetition system
- Social features (leaderboards, friends)
- Custom learning goals
- Advanced analytics
- Offline progress sync

## Example Implementation

See `src/components/LessonWithProgress.tsx` for a complete example of how to integrate the progress system into a lesson component.

This comprehensive progress system provides a solid foundation for gamifying the language learning experience and keeping users engaged with their studies. 