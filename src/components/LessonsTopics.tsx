// LessonsTopics.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronRight, BookOpen, AlignLeft } from 'lucide-react';
import { fetchLessonTopics, fetchLessonsByLevel } from '../lib/lessonService';
import { useProgress } from '../context/ProgressContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import LessonDetailPage from './LessonDetailPage';

interface Topic {
  id: string;
  level: number;
  label: string;
  description: string;
  icon: JSX.Element;
  progress: number;
  type: string;
}

interface Lesson {
  id: string;
  level: number;
  title: string;
  description?: string;
  preview_text?: string;
  // Add other lesson properties as needed
}

interface LessonsTopicsProps {
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  setSubTab: (tab: string) => void;
}

const LessonsTopics: React.FC<LessonsTopicsProps> = ({
  selectedTopic,
  setSelectedTopic,
  setSubTab,
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentTopicLessons, setCurrentTopicLessons] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  
  const { lessonProgress, refreshProgress: refreshProgressContext } = useProgress();
  const { isLessonCompleted, getLessonScore } = useLessonProgress();

  const calculateTopicProgress = useCallback((level: number) => {
    const levelLessons = allLessons.filter(lesson => lesson.level === level);
    if (levelLessons.length === 0) return 0;
    
    const completedLevelLessons = levelLessons.filter(lesson => 
      isLessonCompleted(lesson.id)
    );
    return Math.round((completedLevelLessons.length / levelLessons.length) * 100);
  }, [allLessons, isLessonCompleted]);

  // Effect to load all initial data (topics and all lessons)
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [topicData, ...lessonsByLevelData] = await Promise.all([
          fetchLessonTopics(),
          // Fetch lessons for a reasonable range of levels, e.g., 1 to 5 or based on existing topics
          // This is a simplified approach; ideally, you'd fetch lessons relevant to the topics
          ...Array.from({ length: 5 }, (_, i) => fetchLessonsByLevel(i + 1)).map(p => p.catch(e => [])) // Catch errors for levels with no lessons
        ]);

        const fetchedAllLessons = lessonsByLevelData.flat() as Lesson[];
        setAllLessons(fetchedAllLessons);

        const sortedTopics = topicData.sort((a: any, b: any) => a.level - b.level);
        const mappedTopics: Topic[] = sortedTopics.map((topic: any) => ({
          id: topic.level.toString(),
          level: topic.level,
          label: topic.label.replace('Lessons for ', ''),
          description: topic.description,
          icon: topic.label.toLowerCase() === 'alphabet' ? <AlignLeft size={24} /> : <BookOpen size={24} />,
          progress: 0, // Initial progress, will be updated by another effect
          type: topic.label,
        }));
        setTopics(mappedTopics);
        
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Failed to load topics and lessons.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Effect to update topic progress when allLessons or lessonProgress changes
  useEffect(() => {
    if (allLessons.length > 0 && topics.length > 0) {
      console.log('🔄 Recalculating topic progress. All lessons count:', allLessons.length, 'Lesson progress entries:', lessonProgress.length);
      setTopics(prevTopics =>
        prevTopics.map(topic => ({
          ...topic,
          progress: calculateTopicProgress(topic.level),
        }))
      );
    }
  }, [allLessons, lessonProgress, topics.length, calculateTopicProgress]); // Added topics.length and calculateTopicProgress

  // Effect to load lessons for the currently selected topic
  useEffect(() => {
    if (selectedTopic) {
      async function loadCurrentTopicLessons() {
        setLoading(true);
        setError(null);
        try {
          const level = parseInt(selectedTopic!, 10); // selectedTopic is guaranteed to be non-null here
          const lessonsData = await fetchLessonsByLevel(level);
          setCurrentTopicLessons(lessonsData as Lesson[]);
        } catch (err) {
          console.error('Failed to fetch lessons for topic:', err);
          setError('Failed to load lessons for this topic.');
        } finally {
          setLoading(false);
        }
      }
      loadCurrentTopicLessons();
    } else {
      setCurrentTopicLessons([]); // Clear lessons when no topic is selected
    }
  }, [selectedTopic]);
  
  const handleBackFromLesson = async () => {
    setSelectedLessonId(null);
    console.log('🔄 Returned from lesson, attempting to refresh progress context and topics...');
    await refreshProgressContext(); // Refresh the main progress context
    // The useEffect depending on lessonProgress should now re-calculate topic progress automatically
  };

  if (selectedLessonId) {
    return (
      <LessonDetailPage
        lessonId={selectedLessonId}
        onBack={handleBackFromLesson}
        onNavigateToTopic={(topicId) => {
          setSelectedLessonId(null);
          setSelectedTopic(topicId);
        }}
      />
    );
  }

  if (loading && topics.length === 0) { // Show loader only if initial topics haven't loaded
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
        {error}
      </div>
    );
  }

  if (!selectedTopic) {
    return (
      <div className="p-4">
        <button
          onClick={() => setSubTab('landing')}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
        >
          ← Back to Learn
        </button>
        <h2 className="text-2xl font-bold mb-6">Select a Topic</h2>

        {topics.length === 0 && !loading && (
            <p>No topics available. Check console for errors.</p>
        )}

        <div className="grid grid-cols-1 gap-4">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className="
                p-4 rounded-lg cursor-pointer transition-colors
                bg-gray-50 dark:bg-[#2D2D2D]
                border border-gray-200 dark:border-[#121212]
                hover:!border-emerald-500 dark:hover:!border-emerald-500
              "
            >
              <div className="flex items-center mb-2">
                <div className="mr-3">{topic.icon}</div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">
                        {topic.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {topic.description}
                    </p>
                </div>
              </div>
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded">
                <div
                  className="absolute top-0 left-0 h-full rounded bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                  style={{ width: `${topic.progress}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 text-gray-800 dark:text-white">
                {topic.progress}% Complete
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button
        onClick={() => {
          setSelectedTopic(null);
        }}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Topics
      </button>
      <h2 className="text-2xl font-bold mb-6">
        {topics.find((t) => t.id === selectedTopic)?.label || 'Topic Lessons'}
      </h2>

      {loading && currentTopicLessons.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      )}

      {!loading && currentTopicLessons.length === 0 && !error && (
          <p>No lessons found for this topic.</p>
      )}

      <div className="grid grid-cols-1 gap-4">
        {currentTopicLessons.map((lesson) => {
          const completed = isLessonCompleted(lesson.id);
          const score = getLessonScore(lesson.id);
          
          return (
            <div
              key={lesson.id}
              onClick={() => setSelectedLessonId(String(lesson.id))}
              className={`
                p-4 rounded-lg cursor-pointer transition-colors border relative
                ${completed 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 shadow-emerald-100 dark:shadow-emerald-900/30 shadow-md' 
                  : 'bg-gray-50 dark:bg-[#2D2D2D] border-gray-200 dark:border-[#121212]'
                }
                hover:!border-emerald-500 dark:hover:!border-emerald-500
              `}
            >
              <div className="flex items-center justify-between group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold ${completed ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-800 dark:text-white'}`}>
                      {lesson.title}
                    </h4>
                    {completed && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${completed ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {lesson.preview_text || lesson.description}
                  </p>
                  {score !== null && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      Best Score: {score}%
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {completed && (
                    <div className="bg-emerald-600 dark:bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Complete
                    </div>
                  )}
                  <ChevronRight
                    className={`transform transition-transform group-hover:translate-x-1 ${completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
                    size={20}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonsTopics;
