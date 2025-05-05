import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lesson, Letter } from '../types/lessons';
import { Volume2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';

interface LessonViewerProps {
  lessonId: string;
  lessonType?: string;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId, lessonType }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);

  // Fetch lesson data
  useEffect(() => {
    async function fetchLesson() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;
        if (!data) throw new Error('Lesson not found');

        setLesson(data as Lesson);

        // If it's an alphabet lesson and has letters, fetch letter details
        if (data.type === 'alphabet' && data.content.letters?.length) {
          const { data: letterData, error: letterError } = await supabase
            .from('alphabet')
            .select('*')
            .in('letter', data.content.letters);

          if (letterError) throw letterError;
          setLetters(letterData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
        console.error('Error fetching lesson:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    setSelectedQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  const playAudio = async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error || 'Failed to load lesson'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-dark-200 rounded-lg shadow-sm">
      {/* Lesson Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
      </div>

      {/* Pronunciation Section */}
      {lesson.content.pronunciation && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Pronunciation Guide</h2>
          <p className="text-gray-700 dark:text-gray-300">{lesson.content.pronunciation}</p>
        </div>
      )}

      {/* Examples Section */}
      {lesson.content.examples && lesson.content.examples.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-3">Examples</h2>
          <div className="grid gap-3">
            {lesson.content.examples.map((example, index) => (
              <div 
                key={index}
                className="p-3 bg-gray-50 dark:bg-dark-100 rounded-lg"
              >
                <p className="text-gray-700 dark:text-gray-300">{example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letters Section (for alphabet lessons) */}
      {lesson.type === 'alphabet' && letters.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-3">Letters</h2>
          <div className="grid gap-4">
            {letters.map((letter) => (
              <div 
                key={letter.id}
                className="p-4 border border-gray-200 dark:border-dark-100 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold">{letter.letter}</span>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">
                      {letter.name} ({letter.transliteration})
                    </span>
                  </div>
                  {letter.audio_url && (
                    <button
                      onClick={() => playAudio(letter.audio_url!)}
                      className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                </div>

                {/* Letter Forms */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {Object.entries(letter.forms).map(([position, form]) => (
                    <div 
                      key={position}
                      className="text-center p-2 bg-gray-50 dark:bg-dark-100 rounded"
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {position}
                      </p>
                      <p className="text-xl">{form}</p>
                    </div>
                  ))}
                </div>

                {/* Letter Examples */}
                <div className="space-y-2">
                  {letter.examples.map((example, idx) => (
                    <div 
                      key={idx}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="font-bold">{example.word}</span>
                      <span className="mx-2">-</span>
                      <span>{example.transliteration}</span>
                      <span className="mx-2">-</span>
                      <span className="italic">{example.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Section */}
      {lesson.content.quiz && lesson.content.quiz.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-xl mb-4">Practice Quiz</h2>
          <div className="space-y-6">
            {lesson.content.quiz.map((question, qIndex) => (
              <div 
                key={qIndex}
                className="border border-gray-200 dark:border-dark-100 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-medium">{question.question}</h3>
                  {question.audio && (
                    <button
                      onClick={() => playAudio(question.audio!)}
                      className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <button
                      key={oIndex}
                      onClick={() => handleQuizAnswer(qIndex, option)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedQuizAnswers[qIndex] === option
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-dark-100 hover:bg-gray-50 dark:hover:bg-dark-100'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {showResults && selectedQuizAnswers[qIndex] && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    selectedQuizAnswers[qIndex] === question.answer
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    {selectedQuizAnswers[qIndex] === question.answer
                      ? 'Correct!'
                      : `Incorrect. The correct answer is: ${question.answer}`}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!showResults && Object.keys(selectedQuizAnswers).length > 0 && (
            <button
              onClick={checkAnswers}
              className="mt-4 w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Check Answers
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonViewer;

