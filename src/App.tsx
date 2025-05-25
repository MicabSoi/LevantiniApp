import { useState, useEffect } from 'react';
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

// Context for learned words
import { LearnedWordsProvider } from './context/LearnedWordsContext';
import { ProgressProvider } from './context/ProgressContext';

function App() {
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('landing');
  const [homeSubTab, setHomeSubTab] = useState('dashboard');
  const [wordBankSubTab, setWordBankSubTab] = useState('landing');
  const [communitySubTab, setCommunitySubTab] = useState('forums');
  const [userLevel] = useState(12); // This would come from your user context/state management
  const [dueReviewsCount] = useState(5); // Placeholder for due reviews count

  console.log('Current activeTab:', activeTab);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => { // Explicitly type prev
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

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
              <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-300">
                {/* Sticky Header */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 dark:bg-emerald-700 text-white px-2 py-1 sm:px-4 sm:py-2 shadow-md dark:shadow-black/20">
                  <div className="container mx-auto max-w-4xl flex justify-between items-center relative">
                    {/* Left: Dark Mode Toggle */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          setIsDarkMode((prev) => {
                            const newMode = !prev;
                            localStorage.setItem('darkMode', JSON.stringify(newMode));
                            return newMode;
                          });
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
                <main className="container mx-auto p-4 max-w-4xl mt-14 flex-grow">
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
                        <div className="bg-white dark:bg-dark-200 rounded-lg shadow-md mb-20 dark:text-gray-100 dark:shadow-black/10">
                          {activeTab === 'home' && (
                            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
                              {/* Welcome and Quick Stats */}
                              <div className="w-full flex flex-col items-center mb-8">
                                <h2 className="text-2xl font-bold mb-2 text-emerald-700 dark:text-emerald-300 text-center">Progress</h2>
                                <div className="flex flex-wrap justify-center gap-4 mt-2">
                                  <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <Star size={18} className="text-emerald-600 mr-2" />
                                    <span className="font-semibold text-emerald-800 dark:text-emerald-200">Level {userLevel}</span>
                                  </div>
                                  <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-200 mr-2">🔥</span>
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-200">Streak: 5 days</span>
                                  </div>
                                  <div
                                    className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800 cursor-pointer"
                                    onClick={() => navigate('/study/run')}
                                  >
                                    <CalendarDays size={18} className="text-emerald-600 mr-2" />
                                    <span className="font-semibold text-emerald-800 dark:text-emerald-200">Due Reviews: {dueReviewsCount}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Add Daily Words Section Here */}
                              <div className="w-full max-w-md mb-8">
                                <DailyWordsSection />
                              </div>

                              {/* Grid of Home Options */}
                              <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-8">
                                {[
                                  {
                                    id: 'dashboard',
                                    label: 'Dashboard',
                                    description: 'Your learning overview',
                                    icon: <Home size={28} className="text-emerald-600 mb-2 mx-auto" />,
                                  },
                                  {
                                    id: 'progress',
                                    label: 'Progress',
                                    description: 'Track your achievements and stats',
                                    icon: <Star size={28} className="text-emerald-600 mb-2 mx-auto" />,
                                  },
                                  {
                                    id: 'profile',
                                    label: 'Profile',
                                    description: 'Manage your personal information',
                                    icon: <User size={28} className="text-emerald-600 mb-2 mx-auto" />,
                                  },
                                  {
                                    id: 'settings',
                                    label: 'Settings',
                                    description: 'Configure app settings',
                                    icon: <GraduationCap size={28} className="text-emerald-600 mb-2 mx-auto" />,
                                  },
                                ].map((option) => (
                                  <div
                                    key={option.id}
                                    onClick={() => setHomeSubTab(option.id)}
                                    className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-dark-100 border border-gray-200 dark:border-dark-300 hover:!border-emerald-500 dark:hover:!border-emerald-500 flex flex-col items-center text-center"
                                  >
                                    {option.icon}
                                    <h3 className="font-bold mb-1 text-gray-800 dark:text-gray-100">
                                      {option.label}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {option.description}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Render content based on selected sub-tab */}
                              <div className="w-full">
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
                                <LearnLanding setSubTab={handleSetLearnSubTab} />
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
                              {subTab === 'typing' && (
                                <TypingPractice setSubTab={handleSetLearnSubTab} />
                              )}
                              {subTab === 'lessons' && (
                                <Lessons setSubTab={handleSetLearnSubTab} />
                              )}
                              {/* {subTab === 'quizzes' && <AlphabetLessonsQuizzes />} */} {/* Commented out due to undefined component */}
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
                              {subTab === 'comprehension' && (
                                <Comprehension setSubTab={handleSetFluencySubTab} />
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
                              {subTab === 'tutor' && (
                                <FindTutor setSubTab={handleSetFluencySubTab} />
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
            </ProgressProvider>
          </LearnedWordsProvider>
        </AudioProvider>
      </div>
    </div>
  );
}

export default App;
