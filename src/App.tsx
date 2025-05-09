import { useState, useEffect } from 'react';
import {
  Home,
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
import SingleFlashcardView from './components/SingleFlashcardView'; // Import SingleFlashcardView
import StudySession from './components/StudySession';

// Main components
import FlashcardDeck from './components/FlashcardDeck';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Progress from './components/Progress';

// Feature components
import VocabularyLanding from './components/VocabularyLanding';

import Dictionary from './components/Dictionary';
import Alphabet from './components/Alphabet';
import Pronunciation from './components/Pronunciation';
import Grammar from './components/Grammar';
import HomePage from './components/HomePage';
import Translate from './components/Translate';
import Comprehension from './components/Comprehension';
import FluencyLanding from './components/FluencyLanding';
import FindTutor from './components/FindTutor';
import LearnLanding from './components/LearnLanding';
import LessonsTopics from './components/LessonsTopics';
import { AudioProvider } from './context/AudioContext';
import StudySelection from './components/StudySelection';
import ReviewCalendar from './components/ReviewCalendar'; // Import ReviewCalendar

// Context for learned words
import { LearnedWordsProvider } from './context/LearnedWordsContext';

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

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => { // Explicitly type prev
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Add last sub-tab memory for each tab
  const [lastLearnSubTab, setLastLearnSubTab] = useState('landing');
  const [lastWordBankSubTab, setLastWordBankSubTab] = useState('add words');
  const [lastFluencySubTab, setLastFluencySubTab] = useState('landing');

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
                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
                  title="View Profile"
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
              <Route path="/flashcard/:deckId/:cardId" element={<SingleFlashcardView />} />
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
                        {/* {subTab === 'quizzes' && <AlphabetLessonsQuizzes />} */} {/* Commented out due to undefined component */}
                      </div>
                    )}

                    {activeTab === 'wordbank' && (
                      <div className="p-4">
                        {wordBankSubTab === 'landing' && (
                          <VocabularyLanding setWordBankSubTab={handleSetWordBankSubTab} />
                        )}
                        {wordBankSubTab === 'recently learned' && (
                          <div>Recently Learned Content Here</div>
                        )}
                        {wordBankSubTab === 'add words' && (
                          <VocabularyLanding setWordBankSubTab={handleSetWordBankSubTab} />
                        )}
                        {wordBankSubTab === 'flashcards' && (
                          <FlashcardDeck setActiveTab={setActiveTab} setWordBankSubTab={handleSetWordBankSubTab} />
                        )}
                        {wordBankSubTab === 'travel dictionary' && (
                          <Dictionary setActiveTab={setActiveTab} setWordBankSubTab={handleSetWordBankSubTab} />
                        )}
                        {wordBankSubTab === 'daily words' && (
                          <div>Daily Words Content Here</div>
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
                            <FluencyLanding setSubTab={handleSetFluencySubTab} />
                          )}
                        </div>
                        <div className="p-4">
                          {subTab === 'translate' && (
                            <Translate setSubTab={handleSetFluencySubTab} />
                          )}
                          {subTab === 'comprehension' && (
                            <Comprehension setSubTab={handleSetFluencySubTab} />
                          )}
                          {subTab === 'tutor' && (
                            <FindTutor setSubTab={handleSetFluencySubTab} />
                          )}
                          {subTab === 'community' && (
                            <div>
                              <button
                                onClick={() => handleSetFluencySubTab('landing')}
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
                      setWordBankSubTab('add words');
                      setLastWordBankSubTab('add words');
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
      </AudioProvider>{' '}
      {/* ✅ Wrap ends here */}
    </LearnedWordsProvider>
  );
}

export default App;
