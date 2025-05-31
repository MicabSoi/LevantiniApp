import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  AlignLeft,
  Volume2,
  GraduationCap,
  Keyboard,
  Clock,
  Hash,
  Badge,
  Target,
  ArrowRight,
  Award,
  Star,
  FileText,
  Lightbulb,
  CheckCircle,
  PlusCircle,
  AlertCircle,
  Trophy,
  ChevronRight,
  ChevronDown,
  User
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { useLessonContext } from '../context/LessonContext';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabaseClient';

interface LearnLandingProps {
  setSubTab: (tab: string) => void;
  handleNavigateToLesson: (lessonId: string) => void;
  handleStartQuiz: (questionCount: number) => void;
}

const LearnLanding: React.FC<LearnLandingProps> = ({ setSubTab, handleNavigateToLesson, handleStartQuiz }) => {
  const { lessonProgress } = useProgress();
  const { allLessons, getLessonById } = useLessonContext();
  const { user } = useSupabase();
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  // Debug logging
  console.log('LearnLanding - lessonProgress:', lessonProgress);
  console.log('LearnLanding - allLessons:', allLessons);

  const latestCompletedLessonProgress = useMemo(() => {
    if (!lessonProgress || lessonProgress.length === 0) {
      console.log('No lesson progress found');
      return null;
    }

    // Find the latest completed lesson based on completed_at timestamp
    const completedLessons = lessonProgress.filter(lesson => lesson.completed);
    console.log('Completed lessons:', completedLessons);
    
    if (completedLessons.length === 0) {
      console.log('No completed lessons found');
      return null;
    }

    // Sort by completed_at desc and take the first one
    const sortedLessons = completedLessons.sort((a, b) => {
      if (!a.completed_at) return 1;
      if (!b.completed_at) return -1;
      return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
    });

    console.log('Latest completed lesson progress:', sortedLessons[0]);
    return sortedLessons[0];
  }, [lessonProgress]);

  const latestCompletedLesson = useMemo(() => {
    if (!latestCompletedLessonProgress) return null;
    return getLessonById(latestCompletedLessonProgress.lesson_id);
  }, [latestCompletedLessonProgress, getLessonById]);

  // Find the next lesson to work on (next incomplete lesson after the latest completed one)
  const nextLessonToWorkOn = useMemo(() => {
    console.log('Calculating nextLessonToWorkOn...');
    console.log('latestCompletedLesson:', latestCompletedLesson);
    console.log('allLessons.length:', allLessons.length);
    
    if (!latestCompletedLesson || !allLessons.length) {
      console.log('No completed lessons or no lessons available, finding first lesson at level 1');
      // If no completed lessons, start with the first lesson at level 1
      const firstLesson = allLessons.find(lesson => lesson.level === 1) || null;
      console.log('First lesson found:', firstLesson);
      return firstLesson;
    }

    // Find all lessons at the same level or next level
    const currentLevel = latestCompletedLesson.level;
    console.log('Current level:', currentLevel);
    
    const sameLevelLessons = allLessons.filter(lesson => lesson.level === currentLevel);
    const nextLevelLessons = allLessons.filter(lesson => lesson.level === currentLevel + 1);
    
    console.log('Same level lessons:', sameLevelLessons);
    console.log('Next level lessons:', nextLevelLessons);

    // Check if there are incomplete lessons at the current level
    for (const lesson of sameLevelLessons) {
      const isCompleted = lessonProgress?.some(progress => 
        progress.lesson_id === lesson.id && progress.completed
      );
      console.log(`Lesson ${lesson.id} (${lesson.title}) completed:`, isCompleted);
      if (!isCompleted) {
        console.log('Found incomplete lesson at current level:', lesson);
        return lesson;
      }
    }

    // If all lessons at current level are completed, move to next level
    if (nextLevelLessons.length > 0) {
      console.log('All current level lessons completed, moving to next level:', nextLevelLessons[0]);
      return nextLevelLessons[0]; // Return first lesson of next level
    }

    // If no next lessons available, return null
    console.log('No next lessons available');
    return null;
  }, [latestCompletedLesson, allLessons, lessonProgress]);

  // Get all completed lessons up to the latest one (for quiz)
  const completedLessonsForQuiz = useMemo(() => {
    if (!lessonProgress || lessonProgress.length === 0 || !latestCompletedLesson) return [];

    const completedLessons = lessonProgress
      .filter(lesson => lesson.completed)
      .map(progress => getLessonById(progress.lesson_id))
      .filter(lesson => lesson !== undefined)
      .filter(lesson => lesson!.level <= latestCompletedLesson.level); // Only include lessons up to current level

    return completedLessons as any[];
  }, [lessonProgress, latestCompletedLesson, getLessonById]);

  const handleQuizMeClick = () => {
    console.log('Quiz Me button clicked');
    console.log('completedLessonsForQuiz:', completedLessonsForQuiz);
    
    if (completedLessonsForQuiz.length === 0) {
      console.log("No completed lessons - Quiz disabled");
      return;
    }
    setIsQuizModalOpen(true);
  };

  const handleStartQuizWithCount = (questionCount: number) => {
    console.log('Starting quiz with count:', questionCount);
    console.log('latestCompletedLesson:', latestCompletedLesson);
    
    if (!latestCompletedLesson) return;

    // For now, we'll use a simple quiz data structure
    // In a real implementation, you would fetch actual quiz questions from the database
    const quizData = {
      completedLessons: completedLessonsForQuiz,
      maxLevel: latestCompletedLesson.level
    };

    console.log('Calling handleStartQuiz with:', latestCompletedLesson.id, quizData, questionCount);
    handleStartQuiz(questionCount);
    setIsQuizModalOpen(false);
  };

  const mainOption = {
    id: 'topic', // Clicking this will lead to the topics grid view
    label: 'Lessons',
    description: 'Progressive chapters and interactive exercises',
    icon: <BookOpen size={24} className="text-emerald-600" />,
  };

  const supplementaryOptions = [
    {
      id: 'alphabet',
      label: 'Alphabet',
      description: 'Learn Arabic letters and pronunciation',
      icon: <AlignLeft size={24} className="text-emerald-600" />,
    },
    {
      id: 'pronunciation',
      label: 'Pronunciation',
      description: 'Perfect your Arabic accent',
      icon: <Volume2 size={24} className="text-emerald-600" />,
    },
    {
      id: 'grammar',
      label: 'Grammar',
      description: 'Master Arabic grammar rules',
      icon: <GraduationCap size={24} className="text-emerald-600" />,
    },
    {
      id: 'comprehension',
      label: 'Comprehension',
      description: 'Improve reading and listening comprehension',
      icon: <Lightbulb size={24} className="text-emerald-600" />,
    },
    {
      id: 'tutor',
      label: 'Find a Tutor',
      description: 'Connect with native Arabic speakers',
      icon: <User size={24} className="text-emerald-600" />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Learn
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Master Levantine Arabic step by step
      </p>

      {/* Main Focus: Lessons */}
      <div
        key={mainOption.id}
        onClick={() => setSubTab(mainOption.id)}
        className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 mb-8"
      >
        <div className="flex items-center justify-center mb-3">
          <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
            {mainOption.icon}
          </div>
        </div>
        <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-gray-100">
          {mainOption.label}
        </h3>
        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
          {mainOption.description}
        </p>
      </div>


      {/* Supplementary Materials Section */}
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Materials
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {supplementaryOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => setSubTab(option.id)}
            className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500"
          >
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                {option.icon}
              </div>
            </div>
            <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-gray-100">
              {option.label}
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              {option.description}
            </p>
          </div>
        ))}
      </div>


      {/* Progress Section (optional) */}
      <div className="mb-4 bg-gray-50 dark:bg-dark-100 rounded-lg p-4 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 transition-colors duration-200">
        <h3 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
          Pick up where you left off
        </h3>
        {nextLessonToWorkOn ? (
          <>
            <div className="mb-2">
              <p className="font-medium text-gray-600 dark:text-gray-300">
                Lesson {nextLessonToWorkOn.level}: {nextLessonToWorkOn.title}
              </p>
            </div>
            {/* Show overall progress based on completed lessons */}
            <div className="relative">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-emerald-600">
                    {completedLessonsForQuiz.length} lesson{completedLessonsForQuiz.length !== 1 ? 's' : ''} completed
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-emerald-100 dark:bg-emerald-900/20">
                <div
                  style={{ width: `${allLessons.length > 0 ? Math.round((completedLessonsForQuiz.length / allLessons.length) * 100) : 0}%` }}
                  className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 dark:bg-emerald-500"
                ></div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">Start your first lesson!</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
          onClick={() => {
            console.log('Continue Learning button clicked');
            console.log('nextLessonToWorkOn:', nextLessonToWorkOn);
            if (nextLessonToWorkOn) {
              console.log('Calling handleNavigateToLesson with:', nextLessonToWorkOn.id);
              handleNavigateToLesson(nextLessonToWorkOn.id);
            }
          }}
          disabled={!nextLessonToWorkOn}
        >
          Continue Learning
        </button>
        <button 
          className="w-full py-3 px-4 bg-white dark:bg-dark-100 border border-emerald-600 text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 dark:hover:bg-dark-200 transition-colors"
          onClick={handleQuizMeClick}
          disabled={completedLessonsForQuiz.length === 0}
        >
          Quiz Me ({completedLessonsForQuiz.length} lesson{completedLessonsForQuiz.length !== 1 ? 's' : ''})
        </button>

        {/* Debug Information (temporary) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info:</h4>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <div>Lesson Progress Length: {lessonProgress?.length || 0}</div>
              <div>All Lessons Length: {allLessons.length}</div>
              <div>Completed Lessons: {completedLessonsForQuiz.length}</div>
              <div>Latest Completed: {latestCompletedLesson?.title || 'None'}</div>
              <div>Next Lesson: {nextLessonToWorkOn?.title || 'None'}</div>
              {lessonProgress && lessonProgress.length > 0 && (
                <div>
                  <div className="font-semibold">Progress Details:</div>
                  {lessonProgress.map(progress => (
                    <div key={progress.id} className="ml-2">
                      Lesson {progress.lesson_id.substring(0, 8)}... - Completed: {progress.completed ? 'Yes' : 'No'}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Test Button to create sample progress */}
            <button
              onClick={async () => {
                if (!user) {
                  console.log('Test Button Error: No user logged in');
                  return;
                }
                
                if (!allLessons || allLessons.length === 0) {
                   console.log('Test Button Error: Lessons not loaded yet.', allLessons);
                   console.log('Lessons are not loaded yet. Please wait a moment and try again.');
                   return;
                }

                try {
                  // Get the first two lessons (1.1 and 1.2)
                  const lesson1 = allLessons.find(l => l.title.includes('1.1'));
                  const lesson2 = allLessons.find(l => l.title.includes('1.2'));
                  
                  if (!lesson1 || !lesson2) {
                    console.log('Test Button Error: Could not find lessons 1.1 and 1.2 in allLessons', allLessons);
                    console.log('Could not find lessons 1.1 and 1.2. Check console for loaded lessons.');
                    return;
                  }
                  
                  console.log('Creating progress for user:', user.id);
                  console.log('Lesson 1.1:', lesson1);
                  console.log('Lesson 1.2:', lesson2);
                  
                  // Create lesson progress records
                  const { error: error1 } = await supabase
                    .from('lesson_progress')
                    .upsert({
                      user_id: user.id,
                      lesson_id: lesson1.id,
                      completed: true,
                      score: 100,
                      completed_at: new Date().toISOString()
                    });
                    
                  const { error: error2 } = await supabase
                    .from('lesson_progress')
                    .upsert({
                      user_id: user.id,
                      lesson_id: lesson2.id,
                      completed: true,
                      score: 100,
                      completed_at: new Date().toISOString()
                    });
                  
                  if (error1 || error2) {
                    console.error('Error creating progress:', error1, error2);
                    console.log('Error creating progress - check console');
                  } else {
                    console.log('✅ Test progress created! Refreshing page...');
                    // Optionally refresh the progress data
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error creating test progress:', error);
                  console.log('Error: ' + (error as Error).message);
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Test: Create Progress for Lessons 1.1 & 1.2
            </button>
          </div>
        )}
      </div>

      {/* Quiz Question Count Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">
              Choose Quiz Length
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              How many questions would you like in your quiz? (Based on {completedLessonsForQuiz.length} completed lesson{completedLessonsForQuiz.length !== 1 ? 's' : ''})
            </p>
            <div className="space-y-2">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => handleStartQuizWithCount(count)}
                  className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {count} Questions
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsQuizModalOpen(false)}
              className="w-full mt-4 py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnLanding;
