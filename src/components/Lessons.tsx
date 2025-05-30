import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronRight,
  Volume2,
  GraduationCap,
  AlignLeft,
  Loader2,
} from 'lucide-react';
import { fetchLessonsByLevel } from '../lib/lessonService';
import { supabase } from '../lib/supabaseClient';
import { useProgress } from '../context/ProgressContext';

interface LessonsProps {
  subTab?: string;
  setSubTab?: (tab: string) => void;
}

const QuizPage: React.FC<{ lesson: any; onBack: () => void }> = ({ lesson, onBack }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
  };

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Lesson
      </button>
      <h2 className="text-2xl font-bold mb-4">Quiz: {lesson.title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Test your knowledge of this lesson
      </p>
      {/* Quiz content would go here */}
    </div>
  );
};

const LessonDetail: React.FC<{
  lesson: any;
  onBack: () => void;
  onQuizStart?: () => void;
}> = ({ lesson, onBack, onQuizStart }) => {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [lessonLetters, setLessonLetters] = useState<any[]>([]);
  const [lettersLoading, setLettersLoading] = useState(true);

  // Fetch letter details from Supabase using the IDs in lesson.content.letters.
  useEffect(() => {
    async function fetchLessonLetters() {
      console.log('Lesson content:', lesson.content);
      // Check if lesson.content.letters exists and is an array
      if (lesson.content && Array.isArray(lesson.content.letters)) {
        const letterIds = lesson.content.letters;
        console.log('Letter IDs to fetch:', letterIds);
        const { data, error } = await supabase
          .from('alphabet')
          .select('*')
          .in('id', letterIds);
        if (error) {
          console.error('Error fetching lesson letters:', error);
        } else {
          console.log('Fetched lesson letters:', data);
          setLessonLetters(data);
        }
      } else {
        console.warn('No letter IDs found in lesson.content.letters');
        setLessonLetters([]);
      }
      setLettersLoading(false);
    }
    fetchLessonLetters();
  }, [lesson]);

  const playAudio = (audioUrl: string, letter: string) => {
    try {
      if (!audioRefs.current[letter]) {
        const audio = new Audio(audioUrl);
        audioRefs.current[letter] = audio;
        audio.onerror = (e: any) => {
          console.error('Audio failed to load:', e);
        };
      }
      const audioElement = audioRefs.current[letter];
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error: any) => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
    }
  };

  if (!lesson?.content) {
    return (
      <div className="p-4 animate-fade-in">
        <button
          onClick={onBack}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
        >
          ← Back to Lessons
        </button>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8 bg-gray-50 dark:bg-dark-100 rounded-lg">
          Lesson content is not available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in">
      <button
        onClick={onBack}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Lessons
      </button>

      <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {lesson.description}
      </p>
      
      {/* Render the pronunciation */}
      {lesson.content.pronunciation && (
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Pronunciation: {lesson.content.pronunciation}
        </p>
      )}
      
      {/* Render the examples */}
      {lesson.content.examples && Array.isArray(lesson.content.examples) && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Examples:</h3>
          <ul className="list-disc ml-6 text-gray-600 dark:text-gray-400">
            {lesson.content.examples.map((example: any, index: number) => (
              <li key={index}>{example}</li>
            ))}
          </ul>
        </div>
      )}

      {onQuizStart && (
        <button
          onClick={onQuizStart}
          className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Start Quiz
        </button>
      )}
    </div>
  );
};

const Lessons: React.FC<LessonsProps> = ({ subTab = 'lessons', setSubTab }) => {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showLessons, setShowLessons] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { userProgress, stats, markLessonComplete } = useProgress();

  // Load lessons when alphabet topic is selected
  useEffect(() => {
    if (selectedTopic === 'alphabet') {
      async function loadLessons() {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchLessonsByLevel(1); // Alphabet is level 1
          setLessons(data);
        } catch (error) {
          console.error('Failed to fetch lessons:', error);
          setError('Failed to load lessons. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
      loadLessons();
    }
  }, [selectedTopic]);

  const handleLessonClick = async (lessonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Fetched lesson data:', data);
        setSelectedLesson(data);
        setShowLessons(false);
      } else {
        setError('Lesson content not found');
      }
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson content');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedLesson(null);
    setShowLessons(true);
    setError(null);
  };

  // Update the progress data to use real data
  const getTopicProgress = (topicId: string) => {
    if (!stats) return 0;
    
    // Calculate progress based on completed lessons for this topic
    switch (topicId) {
      case 'alphabet':
        return Math.round((stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100);
      default:
        return 0;
    }
  };

  const getCurrentProgress = () => {
    if (!userProgress || !stats) return { progress: 0, topic: 'Letters' };
    
    const progress = Math.round((stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100);
    return {
      progress,
      topic: 'Letters' // You can make this dynamic based on last completed lesson
    };
  };

  // Show lesson detail or quiz if a lesson is selected
  if (selectedLesson) {
    return isQuizActive ? (
      <div className="p-4">
        <QuizPage
          lesson={selectedLesson}
          onBack={() => setIsQuizActive(false)}
        />
      </div>
    ) : (
      <div className="p-4">
        <LessonDetail
          lesson={selectedLesson}
          onBack={handleBack}
          onQuizStart={() => setIsQuizActive(true)}
        />
      </div>
    );
  }

  // Show lessons list when Lessons is clicked
  if (showLessons) {
    if (!selectedTopic) {
      // Topics grid view
      return (
        <div className="p-4">
          <button
            onClick={() => setShowLessons(false)}
            className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
          >
            ← Back to Learn
          </button>
          <h2 className="text-2xl font-bold mb-6">Select a Topic</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                id: 'alphabet',
                label: 'Alphabet',
                description: 'Learn Arabic letters and pronunciation',
                icon: <AlignLeft size={24} />,
                progress: getTopicProgress('alphabet'),
              },
              {
                id: 'topic2',
                label: 'Topic 2',
                description: 'Coming soon',
                icon: <BookOpen size={24} />,
                progress: 25,
              },
              {
                id: 'topic3',
                label: 'Topic 3',
                description: 'Coming soon',
                icon: <BookOpen size={24} />,
                progress: 8,
              },
              {
                id: 'topic4',
                label: 'Topic 4',
                description: 'Coming soon',
                icon: <BookOpen size={24} />,
                progress: 2,
              },
              {
                id: 'topic5',
                label: 'Topic 5',
                description: 'Coming soon',
                icon: <BookOpen size={24} />,
                progress: 0,
              },
            ].map((topic) => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className="p-4 rounded-lg cursor-pointer transition-all bg-white dark:bg-dark-200 hover:bg-gray-50 dark:hover:bg-dark-100 border"
              >
                <h3 className="font-medium mb-1">{topic.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {topic.description}
                </p>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded">
                  <div
                    className="absolute top-0 left-0 h-full rounded bg-emerald-500 dark:bg-emerald-400"
                    style={{ width: `${topic.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {topic.progress}% Complete
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Lessons list view for the selected topic
      const topics = [
        {
          id: 'alphabet',
          label: 'Alphabet',
          description: 'Learn Arabic letters and pronunciation',
          icon: <AlignLeft size={24} />,
          lessons: lessons,
        },
        {
          id: 'topic2',
          label: 'Topic 2',
          description: 'Coming soon',
          icon: <BookOpen size={24} />,
          lessons: [],
        },
        {
          id: 'topic3',
          label: 'Topic 3',
          description: 'Coming soon',
          icon: <BookOpen size={24} />,
          lessons: [],
        },
        {
          id: 'topic4',
          label: 'Topic 4',
          description: 'Coming soon',
          icon: <BookOpen size={24} />,
          lessons: [],
        },
      ];
      const currentTopic = topics.find((topic) => topic.id === selectedTopic);
      const topicLessons = currentTopic?.lessons || [];
      
      return (
        <div className="p-4">
          <button
            onClick={() => setSelectedTopic(null)}
            className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
          >
            ← Back to Topics
          </button>
          <h2 className="text-2xl font-bold mb-6">{currentTopic?.label}</h2>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          {topicLessons.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {topicLessons.map((lesson: any) => (
                <div
                  key={lesson.id}
                  className="bg-white dark:bg-dark-100 p-4 rounded-lg border border-gray-200 dark:border-dark-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
                  onClick={() => handleLessonClick(lesson.id)}
                >
                  <div className="flex items-center justify-between group">
                    <div>
                      <h4 className="font-medium mb-1">{lesson.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lesson.description}
                      </p>
                    </div>
                    <ChevronRight
                      className="text-gray-400 transform transition-transform group-hover:translate-x-1"
                      size={20}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Lessons coming soon!
            </div>
          )}
        </div>
      );
    }
  }

  const currentProgress = getCurrentProgress();

  const tabs = [
    {
      id: 'lessons',
      label: 'Lessons',
      description: 'Structured learning path',
      icon: <BookOpen size={24} />,
    },
    {
      id: 'alphabet',
      label: 'Alphabet',
      description: 'Learn Arabic letters',
      icon: <AlignLeft size={24} />,
    },
    {
      id: 'pronunciation',
      label: 'Pronunciation',
      description: 'Perfect your accent',
      icon: <Volume2 size={24} />,
    },
    {
      id: 'grammar',
      label: 'Grammar',
      description: 'Language structure',
      icon: <GraduationCap size={24} />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">Learn</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Master Levantine Arabic step by step
      </p>

      {/* Grid of Tappable Icons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              if (tab.id === 'lessons') {
                setShowLessons(true);
              } else if (setSubTab) {
                setSubTab(tab.id);
              }
            }}
            className={`
              p-4 rounded-lg cursor-pointer transition-all
              ${
                subTab === tab.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                  : 'bg-white dark:bg-dark-200 hover:bg-gray-50 dark:hover:bg-dark-100'
              } border
            `}
          >
            <div className="flex items-center justify-center mb-3">
              <div
                className={`
                p-3 rounded-full
                ${
                  subTab === tab.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400'
                }
              `}
              >
                {tab.icon}
              </div>
            </div>
            <h3 className="font-medium text-center mb-1">{tab.label}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {tab.description}
            </p>
          </div>
        ))}
      </div>

      {/* Progress Section */}
      <div className="mb-4 bg-white dark:bg-dark-200 rounded-lg p-4 border border-gray-200 dark:border-dark-100">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Pick up where you left off
        </h3>
        <div className="mb-2">
          <p className="font-medium">{currentProgress.topic}</p>
        </div>
        <div className="relative pt-">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-emerald-600">
                {currentProgress.progress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded bg-emerald-100 dark:bg-emerald-900/20">
            <div
              style={{ width: `${currentProgress.progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => setShowLessons(true)}
          className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Continue Learning
        </button>
        <button className="w-full py-3 px-4 bg-white dark:bg-dark-100 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-dark-200 transition-colors">
          Quiz Me
        </button>
      </div>
    </div>
  );
};

export default Lessons;



