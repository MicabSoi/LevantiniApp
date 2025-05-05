// LessonsTopics.tsx
import React, { useState, useEffect } from 'react';
import { Loader2, ChevronRight, BookOpen, AlignLeft } from 'lucide-react';
import { fetchLessonTopics, fetchLessonsByLevel } from '../lib/lessonService';

import LessonDetailPage from './LessonDetailPage';

interface LessonsTopicsProps {
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  setSelectedLesson: (lesson: any) => void;
  setSubTab: (tab: string) => void;
}

const LessonsTopics: React.FC<LessonsTopicsProps> = ({
  selectedTopic,
  setSelectedTopic,
  setSelectedLesson,
  setSubTab,
}) => {
  const [topics, setTopics] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await fetchLessonTopics();

        // Sort by level ascending
        const sorted = data.sort((a: any, b: any) => a.level - b.level);

        const mapped = sorted.map((topic: any) => ({
          id: topic.level.toString(), // for use in routing
          label: topic.label,
          description: topic.description,
          icon:
            topic.label.toLowerCase() === 'alphabet' ? (
              <AlignLeft size={24} />
            ) : (
              <BookOpen size={24} />
            ),
          progress: 65, // placeholder for now
          type: topic.label,
        }));

        setTopics(mapped);
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    }

    loadTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      async function loadLessons() {
        setLoading(true);
        setError(null);
        try {
          const topicMeta = topics.find((t) => t.id === selectedTopic);
          const level = parseInt(selectedTopic ?? '', 10);
          const lessonsData = await fetchLessonsByLevel(level);

          setLessons(lessonsData);
        } catch (err) {
          console.error('Failed to fetch lessons:', err);
          setError('Failed to load lessons. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
      loadLessons();
    }
  }, [selectedTopic, topics]);

  if (selectedLessonId) {
    return (
      <LessonDetailPage
        lessonId={selectedLessonId}
        onBack={() => setSelectedLessonId(null)}
      />
    );
  }

  // 1) If NO topic is selected, show the "Select a Topic" screen with "← Back to Learn"
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
              <h3 className="font-bold mb-1 text-gray-800 dark:text-white">
                {topic.label}
              </h3>
              <p className="text-sm mb-2 text-gray-600 dark:text-white">
                {topic.description}
              </p>
              {/* Progress Bar */}
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded">
                <div
                  className="absolute top-0 left-0 h-full rounded bg-emerald-500 dark:bg-emerald-400"
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

  // 2) Otherwise, show the list of lessons for the selected topic
  return (
    <div className="p-4">
      <button
        onClick={() => {
          setSelectedTopic(null);
          setLessons([]);
        }}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Topics
      </button>
      <h2 className="text-2xl font-bold mb-6">
        Lessons for {topics.find((t) => t.id === selectedTopic)?.label}
      </h2>

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

      <div className="grid grid-cols-1 gap-4">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            onClick={() => setSelectedLessonId(String(lesson.id))}
            className="
              bg-gray-50 dark:bg-[#2D2D2D] p-4 rounded-lg cursor-pointer transition-colors
              border border-gray-200 dark:border-[#121212]
              hover:!border-emerald-500 dark:hover:!border-emerald-500
            "
          >
            <div className="flex items-center justify-between group">
              <div>
                <h4 className="font-bold mb-1 text-gray-800 dark:text-white">
                  {lesson.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lesson.preview_text || lesson.description}
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
    </div>
  );
};

export default LessonsTopics;


