import React, { useState, useEffect } from 'react';
import {
  Home,
  LibraryBig,
  GraduationCap,
  Languages,
  User,
  Star,
  Lightbulb,
  CalendarDays
} from 'lucide-react';
import { useSupabase } from './context/SupabaseContext';
import Auth from './components/Auth';
import { Routes, Route, useNavigate } from 'react-router-dom';
import FlashcardDetail from './components/FlashcardDetail';
import SingleFlashcardView from './components/SingleFlashcardView'; // Import SingleFlashcardView
import StudySession from './components/StudySession';

// Main components
import FlashcardDeck from './components/FlashcardDeck';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Progress from './components/Progress';
import DailyWordsSection from './components/dashboard/DailyWordsSection'; // Import DailyWordsSection

// Feature components
import VocabularyLanding from './components/VocabularyLanding';

import Alphabet from './components/Alphabet';
import Pronunciation from './components/Pronunciation';
import Grammar from './components/Grammar';
import TypingPractice from './components/TypingPractice';
import HomePage from './components/HomePage';
import Translate from './components/Translate';
import Comprehension from './components/Comprehension';
import ConversationPractice from './components/ConversationPractice';
import ListeningSkills from './components/ListeningSkills';
import Community from './components/Community';
import FluencyLanding from './components/FluencyLanding';
import FindTutor from './components/FindTutor';
import LearnLanding from './components/LearnLanding';
import LessonsTopics from './components/LessonsTopics';
import Lessons from './components/Lessons';
import { AudioProvider } from './context/AudioContext';
import StudySelection from './components/StudySelection';
import ReviewCalendar from './components/ReviewCalendar'; // Import ReviewCalendar
import LessonDetailPage from './components/LessonDetailPage';
import Quiz from './components/Quiz';
import TimePractice from './components/TimePractice';
import NumberPractice from './components/NumberPractice';

// Context for learned words
import { LearnedWordsProvider } from './context/LearnedWordsContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { LessonProvider, useLessonContext, Lesson } from './context/LessonContext'; // Import Lesson type
import { SettingsProvider } from './contexts/SettingsContext';

interface AppContentProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const AppContent: React.FC<AppContentProps> = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('landing');
  const [homeSubTab, setHomeSubTab] = useState('dashboard');
  const [wordBankSubTab, setWordBankSubTab] = useState('landing');
  const [communitySubTab, setCommunitySubTab] = useState('forums');
  const [userLevel] = useState(12); // This would come from your user context/state management
  const [dueReviewsCount] = useState(5); // Placeholder for due reviews count
  const [lessonToDisplayId, setLessonToDisplayId] = useState<string | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(0);
  const [quizCompletedLessons, setQuizCompletedLessons] = useState<Lesson[]>([]); // New state for completed lessons for quiz

  // Now we can safely call the hook since we're inside the LessonProvider
  const { allLessons, getLessonById } = useLessonContext();
  const { lessonProgress } = useProgress(); // Assuming useProgress is available and provides lessonProgress

  // Debug current user
  console.log('AppContent - Current user:', user);
  console.log('AppContent - lessonProgress:', lessonProgress); // Debugging lessonProgress

  console.log('Current activeTab:', activeTab);

  // Add last sub-tab memory for each tab
  const [lastLearnSubTab, setLastLearnSubTab] = useState('landing');
  const [lastFluencySubTab, setLastFluencySubTab] = useState('landing');
  const [lastWordBankSubTab, setLastWordBankSubTab] = useState('landing');

  // Handlers to update sub-tabs and last sub-tabs
  const handleSetLearnSubTab = (tab: string) => {
    setSubTab(tab);
    setLastLearnSubTab(tab);
  };
  const handleSetWordBankSubTab = (tab: string) => {
    setWordBankSubTab(tab);
    setLastWordBankSubTab(tab);
  };
  const handleSetFluencySubTab = (tab: string) => {
    setSubTab(tab);
    setLastFluencySubTab(tab);
  };

  const handleNavigateToLesson = (lessonId: string) => {
    setLessonToDisplayId(lessonId);
    setSubTab('lessonDetail'); // Assuming a new subTab value for lesson detail
  };

  // Modified handleStartQuiz to find completed lessons and pass them
  const handleStartQuiz = (questionCount: number) => {
    console.log('handleStartQuiz called with questionCount:', questionCount);

    // Filter allLessons to find those that are completed in lessonProgress
    // Correctly filter lessonProgress (which is an array) and check against allLessons
    const completedLessonIds = new Set(
      (lessonProgress || [])
        .filter(progress => progress.completed)
        .map(progress => progress.lesson_id)
    );

    const completedLessonDetails = allLessons.filter(lesson =>
      completedLessonIds.has(lesson.id)
    );

    console.log('Completed lessons for quiz:', completedLessonDetails);

    if (completedLessonDetails.length === 0) {
      console.warn('No completed lessons found to start a quiz.');
      // Optionally, show a message to the user
      console.log('Please complete at least one lesson before starting a quiz.'); // Using console.log instead of alert
      return;
    }

    setQuizCompletedLessons(completedLessonDetails);
    setQuizQuestionCount(questionCount);
    setSubTab('quiz');
  };

  useEffect(() => {
    const checkScrollable = (element: HTMLElement) => {
      if (element.scrollWidth > element.clientWidth) {
        element.classList.add('is-scrollable');
      } else {
        element.classList.remove('is-scrollable');
      }
    };

    const scrollContainers = document.querySelectorAll('.scroll-fade');
    scrollContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        checkScrollable(container);

        // Create ResizeObserver to check when content size changes
        const resizeObserver = new ResizeObserver(() =>
          checkScrollable(container)
        );
        resizeObserver.observe(container);

        // Cleanup
        return () => resizeObserver.disconnect();
      }
    });
  }, [activeTab, subTab, homeSubTab, wordBankSubTab]);



  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-300 dark:via-dark-300 dark:to-dark-200">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 dark:bg-emerald-700 text-white px-2 py-1 sm:px-4 sm:py-2 shadow-md dark:shadow-black/20">
        <div className="container mx-auto max-w-4xl flex justify-between items-center relative">
          {/* Left: Dark Mode Toggle */}
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                const newMode = !isDarkMode;
                localStorage.setItem('darkMode', JSON.stringify(newMode));
                setIsDarkMode(newMode);
              }}
              className="p-2 rounded-full bg-emerald-700 dark:bg-emerald-800 hover:bg-emerald-800 dark:hover:bg-emerald-900 transition-colors"
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <Lightbulb size={18} className="text-emerald-400 fill-current" />
              ) : (
                <Lightbulb size={18} className="text-gray-300" />
              )}
            </button>
          </div>

          {/* Center: Title */}
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl sm:text-2xl font-bold">Levantini</h1>

          {/* Right: User Info */}
          <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-2">
            <div className="flex items-center bg-emerald-700 dark:bg-emerald-800 px-2 py-0.5 rounded-full text-xs sm:text-sm">
              <span className="text-yellow-400 font-bold mr-1">Lvl {userLevel}</span>
              <Star size={14} className="text-yellow-400" />
            </div>
            <button
              onClick={() => {
                setActiveTab('home');
                setHomeSubTab('profile');
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-700 dark:bg-emerald-800 rounded-full flex items-center justify-center hover:bg-emerald-800 dark:hover:bg-emerald-900 transition-colors"
              title="View Profile"
            >
              <User size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 max-w-4xl mt-14 flex-grow">
        <Routes>
          <Route path="/flashcard/:id" element={<FlashcardDetail />} />
          <Route path="/flashcard/:deckId/:cardId" element={<SingleFlashcardView />} />
          <Route path="/schedule" element={<ReviewCalendar />} />
          <Route path="/study" element={<StudySelection />} />
          <Route path="/study/run" element={<StudySession />} />
          <Route path="/deck/:id" element={<FlashcardDetail />} />
          <Route path="/default-deck/:id" element={<FlashcardDetail />} />
          <Route
            path="*"
            element={
              <div className="mb-20 dark:text-gray-100">
                {activeTab === 'home' && (
                  <div className="space-y-6">
                    {/* Hero Section with Welcome and Quick Stats */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-900/10 dark:via-dark-200 dark:to-emerald-900/5 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/20 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200 dark:bg-emerald-800/20 rounded-full translate-y-12 -translate-x-12 opacity-30"></div>
                      
                      {/* OLIVE TREE IMAGE - Responsive size for different screens */}
                      <div className="absolute -top-8 right-0 z-20 pointer-events-none select-none">
                        <img 
                          src="/images/ChatGPT Image May 27, 2025, 01_56_32 PM.png" 
                          alt="Olive Tree" 
                          className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 opacity-90 object-contain"
                        />
                      </div>
                      
                      <div className="relative z-10 flex">
                        {/* Left side content - Welcome text */}
                        <div className="w-2/3 pr-4">
                          <div className="text-left mb-6">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
                              Welcome Back!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                              {
                                (() => {
                                  const date = new Date();
                                  const weekday = date.toLocaleString('en-US', { weekday: 'long' });
                                  const dayOfMonth = date.getDate();
                                  const month = date.toLocaleString('en-US', { month: 'long' });
                                  const year = date.getFullYear();
                                  return `${weekday} ${dayOfMonth} ${month} ${year}`;
                                })()
                              }
                            </p>
                          </div>
                        </div>
                        
                        {/* Right side - Space for olive tree */}
                        <div className="w-1/3"></div>
                      </div>

                      {/* Enhanced Progress Cards - Full width with proper spacing */}
                      <div className="relative z-10 mt-8 md:mt-12 lg:mt-16">
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="bg-white/80 dark:bg-dark-100/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30 text-center group hover:scale-105 transition-all duration-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:shadow-lg transition-shadow">
                              <Star size={18} className="text-white" />
                            </div>
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Level {userLevel}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Current Level</div>
                          </div>
                          
                          <div className="bg-white/80 dark:bg-dark-100/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30 text-center group hover:scale-105 transition-all duration-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:shadow-lg transition-shadow">
                              <span className="text-white font-bold text-sm">🔥</span>
                            </div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">5 Days</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Streak</div>
                          </div>
                          
                          <div 
                            className="bg-white/80 dark:bg-dark-100/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30 text-center group hover:scale-105 transition-all duration-200 cursor-pointer"
                            onClick={() => navigate('/study/run')}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:shadow-lg transition-shadow">
                              <CalendarDays size={18} className="text-white" />
                            </div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{dueReviewsCount}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Due Reviews</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Daily Words Section - Enhanced */}
                    <div className="bg-white dark:bg-dark-200 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-100 overflow-hidden">
                      <DailyWordsSection />
                    </div>

                    {/* Navigation Grid - Redesigned */}
                    <div className="bg-white dark:bg-dark-200 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-100">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Quick Access</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {
                            id: 'dashboard',
                            label: 'Dashboard',
                            description: 'Your learning overview',
                            icon: <Home size={24} className="text-emerald-600 dark:text-emerald-400" />,
                            gradient: 'from-emerald-500 to-emerald-600',
                            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
                            borderColor: 'border-emerald-200 dark:border-emerald-700/50'
                          },
                          {
                            id: 'progress',
                            label: 'Progress',
                            description: 'Track achievements',
                            icon: <Star size={24} className="text-emerald-600 dark:text-emerald-400" />,
                            gradient: 'from-emerald-600 to-emerald-700',
                            bgColor: 'bg-emerald-100 dark:bg-emerald-800/20',
                            borderColor: 'border-emerald-300 dark:border-emerald-600/50'
                          },
                          {
                            id: 'profile',
                            label: 'Profile',
                            description: 'Personal settings',
                            icon: <User size={24} className="text-emerald-600 dark:text-emerald-400" />,
                            gradient: 'from-emerald-400 to-emerald-500',
                            bgColor: 'bg-emerald-50 dark:bg-emerald-900/15',
                            borderColor: 'border-emerald-200 dark:border-emerald-700/40'
                          },
                          {
                            id: 'settings',
                            label: 'Settings',
                            description: 'App configuration',
                            icon: <GraduationCap size={24} className="text-emerald-600 dark:text-emerald-400" />,
                            gradient: 'from-emerald-700 to-emerald-800',
                            bgColor: 'bg-emerald-100 dark:bg-emerald-800/25',
                            borderColor: 'border-emerald-300 dark:border-emerald-600/60'
                          },
                        ].map((option) => (
                          <div
                            key={option.id}
                            onClick={() => setHomeSubTab(option.id)}
                            className={`group relative overflow-hidden ${option.bgColor} ${option.borderColor} border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1`}
                          >
                            <div className="flex flex-col items-center text-center space-y-3">
                              <div className={`w-12 h-12 bg-gradient-to-br ${option.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                                {React.cloneElement(option.icon, { className: "text-white", size: 24 })}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                  {option.label}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                            
                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white dark:bg-dark-200 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-100 overflow-hidden">
                      {homeSubTab === 'dashboard' && (
                        <HomePage setActiveTab={setActiveTab} />
                      )}
                      {homeSubTab === 'settings' && <Settings />}
                      {homeSubTab === 'profile' && <Profile />}
                      {homeSubTab === 'progress' && <Progress />}
                    </div>
                  </div>
                )}

                {activeTab === 'learn' && (
                  <div className="relative">
                    {subTab === 'landing' && (
                      <LearnLanding setSubTab={handleSetLearnSubTab} handleNavigateToLesson={handleNavigateToLesson} handleStartQuiz={handleStartQuiz} />
                    )}
                    {subTab === 'topic' && (
                      <LessonsTopics
                        selectedTopic={selectedTopic}
                        setSelectedTopic={setSelectedTopic}
                        setSubTab={handleSetLearnSubTab}
                      />
                    )}
                    {subTab === 'alphabet' && (
                      <Alphabet setSubTab={handleSetLearnSubTab} />
                    )}
                    {subTab === 'pronunciation' && (
                      <Pronunciation setSubTab={handleSetLearnSubTab} />
                    )}
                    {subTab === 'grammar' && (
                      <Grammar setSubTab={handleSetLearnSubTab} />
                    )}
                    {subTab === 'comprehension' && (
                      <Comprehension setSubTab={handleSetLearnSubTab} />
                    )}
                    {subTab === 'tutor' && (
                      <FindTutor setSubTab={handleSetLearnSubTab} />
                    )}
                    {subTab === 'lessons' && (
                      <Lessons setSubTab={handleSetLearnSubTab} />
                    )}
                    {subTab === 'lessonDetail' && lessonToDisplayId && (
                      <LessonDetailPage
                        lessonId={lessonToDisplayId}
                        onBack={() => setSubTab(lastLearnSubTab)}
                        onNavigateToTopic={(topicId) => {
                          setSelectedTopic(topicId);
                          setSubTab('topic');
                          setLessonToDisplayId(null);
                        }}
                      />
                    )}
                    {subTab === 'quiz' && quizCompletedLessons.length > 0 && (
                      <Quiz
                        lesson={getLessonById(quizCompletedLessons[0].id) || null}
                        lessonId={quizCompletedLessons[0].id}
                        questionCount={quizQuestionCount}
                        onComplete={() => setSubTab('landing')}
                        onBack={() => setSubTab(lastLearnSubTab)}
                        completedLessons={quizCompletedLessons}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'wordbank' && (
                  <div className="relative">
                    {wordBankSubTab === 'landing' && (
                      <VocabularyLanding setWordBankSubTab={handleSetWordBankSubTab} />
                    )}
                    {wordBankSubTab === 'recently learned' && (
                      <div className="p-4">Recently Learned Placeholder</div>
                    )}
                    {wordBankSubTab === 'add words' && (
                      <div className="p-4">Word Bank Placeholder</div>
                    )}
                    {(wordBankSubTab === 'flashcards' || !wordBankSubTab) && (
                       <FlashcardDeck setActiveTab={setActiveTab} setWordBankSubTab={handleSetWordBankSubTab} />
                    )}
                    {wordBankSubTab === 'travel dictionary' && (
                      <div className="p-4">Travel Dictionary Placeholder</div>
                    )}
                    {wordBankSubTab === 'daily words' && (
                      <div className="p-4">Daily Words Placeholder</div>
                    )}
                  </div>
                )}

                {/* Render Fluency content */}
                {activeTab === 'fluency' && (
                  <div className="relative">
                    {subTab === 'landing' && (
                      <FluencyLanding setSubTab={handleSetFluencySubTab} />
                    )}
                    {subTab === 'translate' && (
                      <Translate setSubTab={handleSetFluencySubTab} />
                    )}
                    {subTab === 'typing' && (
                      <TypingPractice setSubTab={handleSetFluencySubTab} />
                    )}
                    {subTab === 'time' && (
                      <TimePractice setSubTab={handleSetFluencySubTab} />
                    )}
                    {subTab === 'numbers' && (
                      <NumberPractice setSubTab={handleSetFluencySubTab} />
                    )}
                    {subTab === 'conversation' && (
                      <ConversationPractice setSubTab={handleSetFluencySubTab} />
                    )}
                    {subTab === 'listening' && (
                      <ListeningSkills setSubTab={handleSetFluencySubTab} />
                    )}
                    {subTab === 'community' && (
                      <Community setSubTab={handleSetFluencySubTab} />
                    )}
                  </div>
                )}

                {/* Render Community content */}
                {/* Removed Community section due to file not found */}
                {/*
                {activeTab === 'community' && (
                     <Community setSubTab={setCommunitySubTab} />
                )}
                */}

                {/* Render Settings content */}
                {activeTab === 'settings' && (
                  <Settings />
                )}
              </div>
            }
          />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-200 shadow-lg border-t border-gray-200 dark:border-dark-100 overflow-x-auto dark:shadow-black/20">
        <div className="container mx-auto max-w-4xl px-4">
          <ul className="flex min-w-max">
            <li
              className={`flex-1 ${
                activeTab === 'home'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => {
                navigate('/');
                if (activeTab === 'home') {
                  setHomeSubTab('dashboard');
                } else {
                  setActiveTab('home');
                }
              }}
            >
              <button className="w-20 py-3 flex flex-col items-center">
                <Home size={22} />
                <span className="text-xs mt-1">Home</span>
              </button>
            </li>
            <li
              className={`flex-1 ${
                activeTab === 'learn'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => {
                navigate('/');
                if (activeTab === 'learn') {
                  setSubTab('landing');
                  setLastLearnSubTab('landing');
                  setSelectedTopic(null);
                } else {
                  setActiveTab('learn');
                  setSubTab(lastLearnSubTab);
                }
              }}
            >
              <button className="w-20 py-3 flex flex-col items-center">
                <GraduationCap size={22} />
                <span className="text-xs mt-1">Learn</span>
              </button>
            </li>

            <li
              className={`flex-1 ${
                activeTab === 'wordbank'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => {
                navigate('/');
                if (activeTab === 'wordbank') {
                  setWordBankSubTab('landing');
                  setLastWordBankSubTab('landing');
                } else {
                  setActiveTab('wordbank');
                  setWordBankSubTab(lastWordBankSubTab);
                }
              }}
            >
              <button className="w-20 py-3 flex flex-col items-center">
                <LibraryBig size={22} />
                <span className="text-xs mt-1">Vocabulary</span>
              </button>
            </li>
            <li
              className={`flex-1 ${
                activeTab === 'fluency'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => {
                navigate('/');
                if (activeTab === 'fluency') {
                  setSubTab('landing');
                  setLastFluencySubTab('landing');
                } else {
                  setActiveTab('fluency');
                  setSubTab(lastFluencySubTab);
                }
              }}
            >
              <button className="w-20 py-3 flex flex-col items-center">
                <Languages size={22} />
                <span className="text-xs mt-1">Fluency</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

function App() {
  const { user, loading } = useSupabase();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-dark-300 min-h-screen">
        <AudioProvider>
          <LearnedWordsProvider>
            <ProgressProvider>
              <LessonProvider>
                <SettingsProvider>
                  <AppContent isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                </SettingsProvider>
              </LessonProvider>
            </ProgressProvider>
          </LearnedWordsProvider>
        </AudioProvider>
      </div>
    </div>
  );
}

export default App;
