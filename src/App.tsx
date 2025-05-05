import React, { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  LibraryBig,
  GraduationCap,
  Languages,
  User,
  Star,
} from 'lucide-react';
import { useSupabase } from './context/SupabaseContext';
import Auth from './components/Auth';
import { Routes, Route, useNavigate } from 'react-router-dom';
import FlashcardDetail from './components/FlashcardDetail';
import StudySession from './components/StudySession';

// Main components
import WordBank from './components/WordBank.tsx';
import FlashcardDeck from './components/FlashcardDeck';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Progress from './components/Progress';

// Feature components

import Dictionary from './components/Dictionary';
import Alphabet from './components/Alphabet';
import Pronunciation from './components/Pronunciation';
import Grammar from './components/Grammar';
import HomePage from './components/HomePage';
import Translate from './components/Translate';
import Lessons from './components/Lessons';
import Comprehension from './components/Comprehension';
import FluencyLanding from './components/FluencyLanding';
import FindTutor from './components/FindTutor';
import LearnLanding from './components/LearnLanding';
import LessonsTopics from './components/LessonsTopics';
import { AudioProvider } from './context/AudioContext';
import StudySelection from './components/StudySelection';
import ReviewCalendar from './components/ReviewCalendar'; // Import ReviewCalendar
import VocabularyLanding from './components/VocabularyLanding'; // Import VocabularyLanding

// Context for learned words
import { LearnedWordsProvider } from './context/LearnedWordsContext';

function App() {
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('landing');
  const [homeSubTab, setHomeSubTab] = useState('dashboard');
  const [showLessons, setShowLessons] = useState(false);
  const [wordBankSubTab, setWordBankSubTab] = useState('landing'); // Set initial sub-tab to landing
  const [communitySubTab, setCommunitySubTab] = useState('forums');
  const [userLevel] = useState(12); // This would come from your user context/state management

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => { // Explicitly type prev
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [learnReset, setLearnReset] = useState(0);

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
  }, [activeTab, subTab, homeSubTab, wordBankSubTab, communitySubTab]);

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
    <LearnedWordsProvider>
      <AudioProvider>
        {' '}
        {/* ✅ Wrap everything inside this */}{' '}
        {/* Wrap everything inside this */}
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-300">
          {/* Sticky Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 dark:bg-dark-100 text-white px-4 py-2 shadow-md dark:shadow-black/20">
            <div className="container mx-auto max-w-4xl flex justify-between items-center">
              {/* Left: Title */}
              <h1 className="text-2xl font-bold">Levantini</h1>

              {/* Center: Dark Mode Toggle */}
              <button
                onClick={() => {
                  setIsDarkMode((prev) => {
                    const newMode = !prev;
                    localStorage.setItem('darkMode', JSON.stringify(newMode));
                    return newMode;
                  });
                }}
                className="px-4 py-2 rounded-full bg-emerald-700 dark:bg-dark-200 hover:bg-emerald-800 dark:hover:bg-dark-300 transition-colors"
              >
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>

              {/* Right: User Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-emerald-700 dark:bg-dark-200 px-3 py-1 rounded-full">
                  <span className="text-yellow-400 font-bold mr-1">
                    Lvl {userLevel}
                  </span>
                  <Star size={16} className="text-yellow-400" />
                </div>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setHomeSubTab('profile');
                  }}
                  className="w-8 h-8 bg-emerald-700 dark:bg-dark-200 rounded-full flex items-center justify-center hover:bg-emerald-800 dark:hover:bg-dark-300 transition-colors"
                >
                  <User size={18} />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto p-4 max-w-4xl mt-14 flex-grow">
            <Routes>
              <Route path="/flashcard/:id" element={<FlashcardDetail />} />
              <Route path="/schedule" element={<ReviewCalendar />} />
              <Route path="/study" element={<StudySelection />} />
              <Route path="/study/run" element={<StudySession />} />
              <Route
                path="*"
                element={
                  <div className="bg-white dark:bg-dark-200 rounded-lg shadow-md mb-20 dark:text-gray-100 dark:shadow-black/10">
                    {activeTab === 'home' && (
                      <div>
                        <div className="relative">
                          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-dark-100 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide smooth-scroll scroll-bounce scroll-fade">
                            {[
                              'dashboard',
                              'settings',
                              'profile',
                              'progress',
                            ].map((tab) => (
                              <button
                                key={tab}
                                onClick={() => setHomeSubTab(tab)}
                                className={`px-4 py-2 ${
                                  homeSubTab === tab
                                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                                aria-label={`Switch to ${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`} // Added aria-label for accessibility
                              >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-4">
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
                      <div className="p-4">
                        {subTab === 'landing' && (
                          <LearnLanding setSubTab={setSubTab} />
                        )}
                        {subTab === 'topic' && (
                          <LessonsTopics
                            selectedTopic={selectedTopic}
                            setSelectedTopic={setSelectedTopic}
                            setSelectedLesson={setSelectedLesson}
                            setSubTab={setSubTab}
                          />
                        )}
                        {subTab === 'alphabet' && (
                          <Alphabet setSubTab={setSubTab} />
                        )}
                        {subTab === 'pronunciation' && (
                          <Pronunciation setSubTab={setSubTab} />
                        )}
                        {subTab === 'grammar' && (
                          <Grammar setSubTab={setSubTab} />
                        )}
                        {/* {subTab === 'quizzes' && <AlphabetLessonsQuizzes />} */} {/* Commented out due to undefined component */}
                      </div>
                    )}

                    {activeTab === 'wordbank' && (
                      <div className="p-4">
                        {wordBankSubTab === 'landing' && (
                          <VocabularyLanding setWordBankSubTab={setWordBankSubTab} />
                        )}
                        {wordBankSubTab === 'recently learned' && (
                          <div>Recently Learned Content Here</div> // Placeholder for Recently Learned content
                        )}
                        {wordBankSubTab === 'add words' && (
                          <WordBank
                            setActiveTab={setActiveTab}
                            setWordBankSubTab={setWordBankSubTab}
                          />
                        )}
                        {wordBankSubTab === 'flashcards' && (
                          <FlashcardDeck
                            setActiveTab={setActiveTab}
                            setWordBankSubTab={setWordBankSubTab}
                          />
                        )}
                        {wordBankSubTab === 'travel dictionary' && (
                          <Dictionary
                            setActiveTab={setActiveTab}
                            setWordBankSubTab={setWordBankSubTab}
                          />
                        )}
                        {wordBankSubTab === 'daily words' && (
                          <div>Daily Words Content Here</div> // Placeholder for Daily Words content
                        )}
                      </div>
                    )}

                    {activeTab === 'community' && (
                      <div>
                        <div className="relative">
                          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-dark-100 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide smooth-scroll scroll-bounce scroll-fade">
                            {['forums', 'chat'].map((tab) => (
                              <button
                                key={tab}
                                onClick={() => setCommunitySubTab(tab)}
                                className={`px-4 py-2 ${
                                  communitySubTab === tab
                                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-center text-gray-500 py-8">
                            Community features coming soon!
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'fluency' && (
                      <div>
                        <div className="relative">
                          {subTab === 'landing' && (
                            <FluencyLanding setSubTab={setSubTab} />
                          )}
                        </div>
                        <div className="p-4">
                          {subTab === 'translate' && (
                            <Translate setSubTab={setSubTab} />
                          )}
                          {subTab === 'comprehension' && (
                            <Comprehension setSubTab={setSubTab} />
                          )}
                          {subTab === 'tutor' && (
                            <FindTutor setSubTab={setSubTab} />
                          )}
                          {subTab === 'community' && (
                            <div>
                              <button
                                onClick={() => setSubTab('landing')}
                                className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
                              >
                                ← Back to Fluency
                              </button>

                              <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-dark-100 overflow-x-auto whitespace-nowrap pb-2">
                                {['forums', 'chat'].map((tab) => (
                                  <button
                                    key={tab}
                                    onClick={() => setCommunitySubTab(tab)}
                                    className={`px-4 py-2 ${
                                      communitySubTab === tab
                                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                  </button>
                                ))}
                              </div>
                              <div className="p-4">
                                <div className="text-center text-gray-500 py-8">
                                  Community features coming soon!
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
                    setActiveTab('home');
                    setHomeSubTab('dashboard');
                  }}
                >
                  <button className="w-24 py-3 flex flex-col items-center">
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
                    setActiveTab('learn');
                    setSubTab('landing');
                    setSelectedTopic(null);
                  }}
                >
                  <button className="w-24 py-3 flex flex-col items-center">
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
                    setActiveTab('wordbank');
                    setWordBankSubTab('add words');
                  }}
                >
                  <button className="w-24 py-3 flex flex-col items-center">
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
                    setActiveTab('fluency');
                    setSubTab('landing');
                  }}
                >
                  <button className="w-24 py-3 flex flex-col items-center">
                    <Languages size={22} />
                    <span className="text-xs mt-1">Fluency</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </AudioProvider>{' '}
      {/* ✅ Wrap ends here */}
    </LearnedWordsProvider>
  );
}

export default App;
