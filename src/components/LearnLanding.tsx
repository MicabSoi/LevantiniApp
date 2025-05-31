import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);

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

      {/* Emerald wrapper div for all content */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-900/10 dark:via-dark-200 dark:to-emerald-900/5 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
        {/* Main Focus: Lessons */}
        <div
          key={mainOption.id}
          onClick={() => setSubTab(mainOption.id)}
          className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 mb-8 shadow-sm"
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
              className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 shadow-sm"
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

        {/* Progress Section */}
        <div className="mb-4 bg-white dark:bg-dark-100 rounded-lg p-4 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 transition-colors duration-200 shadow-sm">
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
            className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
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
            className="w-full py-3 px-4 bg-white dark:bg-dark-100 border border-emerald-600 text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 dark:hover:bg-dark-200 transition-colors shadow-sm"
            onClick={handleQuizMeClick}
            disabled={completedLessonsForQuiz.length === 0}
          >
            Quiz Me ({completedLessonsForQuiz.length} lesson{completedLessonsForQuiz.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>

      {/* Quiz Question Count Modal */}
      {isQuizModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
              setIsQuizModalOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-dark-200 rounded-lg p-6 max-w-sm w-full mx-4" ref={modalRef}>
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
