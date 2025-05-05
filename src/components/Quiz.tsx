import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Volume2 } from 'lucide-react';

interface QuizQuestion {
  id: string;
  level: number;
  order_num: number;
  question_text: string;
  question_type:
    | 'letter_to_sound'
    | 'audio_to_letter'
    | 'letter_to_pronunciation';
  audio_url?: string;
  arabic_letter?: string;
  correct_letter?: string; // from subquery on quiz_options
}

interface QuizOption {
  id: string;
  quiz_question_id: number;
  level: number;
  order_num: number;
  option_text: string;
  is_correct: boolean;
}

interface QuizProps {
  lesson: any;
  lessonId: string;
  quizData: any;
  onComplete: () => void;
  onBack: () => void;
  questionCount: number;
}

const Quiz: React.FC<QuizProps> = ({
  lesson,
  lessonId,
  quizData,
  onComplete,
  onBack,
  questionCount, // ← Add this here
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState<QuizOption[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
  const hasPlayedAudio = useRef(false);
  const { audioData } = useAudio();
  const [quizAudio, setQuizAudio] = useState<Map<string, string>>(new Map());
  const [quizSounds, setQuizSounds] = useState<Map<string, string>>(new Map());

  const playAudio = (letter: string) => {
    const audioUrl = quizAudio.get(`${letter}.mp3`);
    if (audioUrl) {
      new Audio(audioUrl).play();
    }
  };

  console.log('Questions Array:', questions);
  console.log('Current Question Index:', currentQuestionIndex);
  console.log('Current Question Object:', questions[currentQuestionIndex]);

  const handlePlayAudio = (letter: string) => {
    const audioUrl = audioData[letter];
    if (!audioUrl) {
      console.warn(`No audio found for letter: ${letter}`);
      return;
    }
    const audioElement = new Audio(audioUrl);
    audioElement.crossOrigin = 'anonymous'; // ensures proper CORS handling
    audioElement.volume = 0.7;
    audioElement
      .play()
      .catch((err) => console.error(`Error playing audio for ${letter}:`, err));
  };

  // ⬇️ Fetch Quiz Letter Pronunciation Audio (Keep this as is)
  useEffect(() => {
    async function fetchQuizAudio() {
      const { data, error } = await supabase.storage
        .from('audio')
        .list('letter_pronunciation');

      if (error) {
        console.error('❌ Error fetching audio:', error);
        return;
      }

      const audioMap = new Map();

      data.forEach((file) => {
        console.log('📂 Found file:', file.name);

        // Extract letter name (removing prefixes like "01-", "02-")
        const filenameWithoutPrefix = file.name
          .replace(/^\d+-/, '')
          .replace('.mp3', '');

        console.log('🔍 Processed key:', filenameWithoutPrefix);

        audioMap.set(
          filenameWithoutPrefix, // Preserve case
          `https://mnfxcqpwvsprsrxmaxxt.supabase.co/storage/v1/object/public/audio/letter_pronunciation/${file.name}`
        );
      });

      console.log('✅ Final Audio Map:', audioMap);
      setQuizAudio(audioMap);
    }

    fetchQuizAudio();
  }, []);

  // ⬇️ Fetch Correct/Incorrect Feedback Sounds (Newly Added)
  useEffect(() => {
    async function fetchSounds() {
      const soundFiles = {
        correct:
          'https://mnfxcqpwvsprsrxmaxxt.supabase.co/storage/v1/object/public/audio/SFX/correct.mp3',
        incorrect:
          'https://mnfxcqpwvsprsrxmaxxt.supabase.co/storage/v1/object/public/audio/SFX/incorrect.mp3',
      };

      const soundMap = new Map();

      for (const [key, url] of Object.entries(soundFiles)) {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (!response.ok)
            throw new Error(
              `Failed to fetch ${key} sound: ${response.statusText}`
            );

          const audioBlob = await response.blob();
          const blobUrl = URL.createObjectURL(audioBlob); // ✅ Store a Blob URL instead of an `Audio` object
          soundMap.set(key, blobUrl);
        } catch (error) {
          console.error(`Error preloading ${key} sound:`, error);
        }
      }

      setQuizSounds(soundMap);
    }

    fetchSounds();
  }, []);

  useEffect(() => {
    const fetchOptionsForCurrentQuestion = async () => {
      if (questions.length === 0 || currentQuestionIndex >= questions.length) {
        console.warn('⚠️ No valid question found!');
        return;
      }

      const currentQuizId = questions[currentQuestionIndex]?.id;
      console.log(
        '🔍 DEBUG: Fetching quiz options for new question ID:',
        currentQuizId
      );

      if (!currentQuizId) return;

      const { data: optionData, error: optionError } = await supabase
        .from('quiz_options')
        .select('*')
        .eq('quiz_question_id', currentQuizId);

      if (optionError) {
        console.error('❌ Supabase Option Fetch Error:', optionError);
        setError('Error fetching quiz options.');
        return;
      }

      console.log('✅ Successfully fetched new quiz options:', optionData);
      setOptions(shuffleArray(optionData as QuizOption[]));
    };

    fetchOptionsForCurrentQuestion();
  }, [currentQuestionIndex, questions]);
  useEffect(() => {
    console.log('✅ Debug: quizSounds Map', quizSounds);
  }, [quizSounds]);

  useEffect(() => {
    if (questions.length > 0 && options.length > 0 && !hasPlayedAudio.current) {
      const currentQuestion = questions[currentQuestionIndex];

      // 🚫 Skip autoplay if it's a 'letter_to_pronunciation' question
      if (currentQuestion.question_type === 'letter_to_pronunciation') {
        return;
      }

      const correctOption = options.find(
        (opt) =>
          opt.quiz_question_id === Number(currentQuestion.id) && opt.is_correct
      );

      if (correctOption) {
        const key = correctOption.option_text?.trim();
        const audioUrl = quizAudio.get(key || '') || audioData[key || ''];

        if (audioUrl) {
          const audioElement = new Audio(audioUrl);
          audioElement.crossOrigin = 'anonymous';
          audioElement.volume = 0.7;
          audioElement
            .play()
            .then(() => {
              hasPlayedAudio.current = true;
            })
            .catch((err) => {
              console.warn('🔇 Failed to autoplay audio:', err);
            });
        } else {
          console.warn('⚠️ No audio file found for:', key);
        }
      }
    }
  }, [currentQuestionIndex, questions, options, quizAudio, audioData]);

  useEffect(() => {
    fetchQuizData();
  }, [lessonId]);

  useEffect(() => {
    console.log('🔍 DEBUG: Current state of options:', options);
  }, [options]);

  useEffect(() => {
    if (
      questions.length > 0 &&
      questions[currentQuestionIndex]?.question_type === 'audio_to_letter'
    ) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion?.audio_url) {
        console.log(
          '🔊 Playing audio for audio_to_letter question:',
          currentQuestion.audio_url
        );
        const audioElement = new Audio(currentQuestion.audio_url);
        audioElement.volume = 0.7;
        audioElement
          .play()
          .catch((err) => console.error('Error playing audio:', err));
        setAudio(audioElement);
      }
    }
  }, [currentQuestionIndex, questions]);

  const shuffleArray = (array: any[]) => {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (
        !lesson ||
        lesson.level === undefined ||
        lesson.order_num === undefined
      ) {
        const msg = 'Lesson is missing required fields (level and order_num).';
        console.warn('⚠️', msg, lesson);
        setError(msg);
        setLoading(false);
        return;
      }

      console.log(
        '🔍 DEBUG: Fetching quiz data for:',
        lesson.level,
        lesson.order_num
      );

      // Fetch questions along with correct answers from quiz_options (subquery)
      const { data: quizQuestions, error: quizError } = await supabase
        .from('quiz_questions')
        .select(
          `
          id,
          level,
          order_num,
          question_text,
          question_type,
          audio_url,
          arabic_letter,
          quiz_options (option_text, is_correct) 
        `
        )
        .eq('level', lesson.level)
        .eq('order_num', lesson.order_num)
        .limit(100); // Adjust limit if necessary

      if (quizError) {
        console.error('❌ Quiz Fetch Error:', quizError);
        setError('Error fetching quiz questions.');
        return;
      }

      if (!quizQuestions || quizQuestions.length === 0) {
        setError('No quiz questions found for this lesson.');
        return;
      }

      console.log('✅ Fetched quiz questions:', quizQuestions);

      // Process questions to include the correct answer
      const processedQuestions = quizQuestions.map((question) => ({
        ...question,
        correctAnswer:
          question.quiz_options?.find((opt) => opt.is_correct)?.option_text ||
          'Unavailable',
      }));

      // ✅ Shuffle before slicing based on user selection
      const shuffled = shuffleArray(processedQuestions);
      setQuestions(shuffled.slice(0, questionCount));

      console.log(
        '🎯 Processed Questions with Correct Answers:',
        processedQuestions
      );
    } catch (err) {
      setError('Failed to load quiz. Please try again.');
      console.error('❌ Error fetching quiz data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter options for the current question by matching quiz_question_id.
  const getCurrentOptions = () => {
    console.log('🟢 Questions array:', questions);
    console.log('🟡 Current Question Index:', currentQuestionIndex);
    console.log('🔵 Current Question Object:', questions[currentQuestionIndex]);

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      console.error('❌ No current question found!');
      return [];
    }

    return options.filter(
      (option) => String(option.quiz_question_id) === String(currentQuestion.id)
    );
  };

  const handleAnswerSelect = (answer: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handleReplayAudio = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const correctOption = options.find((option) => option.is_correct);

    if (!correctOption) {
      console.warn('⚠ No correct option found!');
      return;
    }

    const key = correctOption.option_text?.trim();
    const fallbackAudioUrl = quizAudio.get(key || '');

    // Use quizAudio map first
    if (fallbackAudioUrl) {
      console.log(`🔊 Replaying from quizAudio: ${fallbackAudioUrl}`);
      const audioElement = new Audio(fallbackAudioUrl);
      audioElement.crossOrigin = 'anonymous';
      audioElement.volume = 0.7;
      audioElement
        .play()
        .catch((err) => console.error(`Error playing fallback audio:`, err));
      return;
    }

    // Fall back to audioData map (if that’s what you're using elsewhere)
    const audioUrl = audioData[key || ''];
    if (audioUrl) {
      console.log(`🔊 Replaying from audioData: ${audioUrl}`);
      const audioElement = new Audio(audioUrl);
      audioElement.crossOrigin = 'anonymous';
      audioElement.volume = 0.7;
      audioElement
        .play()
        .catch((err) =>
          console.error(`Error playing audio from audioData:`, err)
        );
    } else {
      console.warn('⚠ No audio available for this question!');
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || isAnswerSubmitted) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      console.error('No current question found.');
      return;
    }

    // Check if answer is correct
    const correctOption = options.find((option) => option.is_correct);
    const isCorrect = selectedAnswer === correctOption?.option_text;
    setIsAnswerCorrect(isCorrect);

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }));

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setIsAnswerSubmitted(true);

    // ✅ Play Correct/Incorrect Sound from Preloaded Blob URL
    const soundUrl = quizSounds.get(isCorrect ? 'correct' : 'incorrect');
    if (soundUrl) {
      const audioElement = new Audio(soundUrl);
      audioElement.volume = 0.05;
      audioElement
        .play()
        .catch((err) => console.error('Error playing feedback sound:', err));
    } else {
      console.warn('⚠️ Sound effect not found!');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      console.log('➡ Moving to next question:', nextIndex + 1);
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      hasPlayedAudio.current = false;
    } else {
      console.log('🎉 Quiz Completed!');
      setQuizCompleted(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
    setAnswers({});
    fetchQuizData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const finalScore = (score / questions.length) * 100;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white dark:bg-dark-200 rounded-lg shadow-sm"
      >
        <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
        <div className="mb-6">
          <div className="text-4xl font-bold text-center mb-2">
            {finalScore}%
          </div>
          <div className="text-center text-gray-600 dark:text-gray-400">
            You got {score} out of {questions.length} questions correct
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {questions.map((question, index) => {
            const correctAnswer = question.correctAnswer ?? 'Unavailable';
            const userAnswer = answers[question.id] ?? 'No answer given';
            const isCorrect =
              correctAnswer !== 'Unavailable' && correctAnswer === userAnswer;

            const isAudioToLetter =
              question.question_type === 'audio_to_letter';

            const questionPrompt = (() => {
              switch (question.question_type) {
                case 'letter_to_pronunciation':
                  return 'What sound does this letter make?';
                case 'letter_to_sound':
                  return 'Identify the correct pronunciation for the displayed letter.';
                case 'audio_to_letter':
                  return 'Listen to the audio and select the correct letter';
                default:
                  return 'Question';
              }
            })();

            const questionDisplay = (
              <>
                {question.question_type === 'audio_to_letter' && (
                  <span className="text-1xl font-bold">
                    {question.arabic_letter || ''}
                  </span>
                )}
                {(question.question_type === 'letter_to_sound' ||
                  question.question_type === 'letter_to_pronunciation') && (
                  <div className="flex justify-center">
                    <span className="text-4xl font-bold">
                      {question.arabic_letter || question.question_text || '—'}
                    </span>
                  </div>
                )}
              </>
            );

            return (
              <div
                key={question.id}
                className={`p-4 rounded-lg ${
                  isCorrect
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-600'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Question {index + 1}</span>
                  {isCorrect ? (
                    <CheckCircle className="text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="text-red-600 dark:text-red-400" />
                  )}
                </div>

                <div className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  {questionPrompt}
                </div>

                {/* 🟢 Only for audio_to_letter: show "Audio was played" */}
                {isAudioToLetter && (
                  <div className="flex justify-center">
                    <p className="text-sm text-gray-500 italic mb-2">
                      Audio was played
                    </p>
                  </div>
                )}

                <div className="mb-3">{questionDisplay}</div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Correct answer:</strong> {correctAnswer}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Your answer:</strong> {userAnswer}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Lesson
          </button>
          <button
            onClick={handleRetry}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-dark-200 rounded-lg shadow-sm">
      {/* New Back Button at the top */}
      <button
        onClick={onBack}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Lesson
      </button>

      <div className="p-6 bg-white dark:bg-dark-200 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-medium">
            Score: {score}/{questions.length}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {/* For letter_to_sound, display the Arabic letter, letter_to_pronunciation, display the pronunciation and audio_to_letter, display the arabic letter  */}
          {/* Question prompt */}
          {questions[currentQuestionIndex]?.question_type ===
            'audio_to_letter' && (
            <div className="text-xl font-bold mb-4 text-center w-full">
              Which letter is this?
            </div>
          )}

          {questions[currentQuestionIndex]?.question_type ===
            'letter_to_sound' && (
            <div className="text-xl font-bold mb-4 text-center w-full">
              Which letter is this?
            </div>
          )}

          {questions[currentQuestionIndex]?.question_type ===
            'letter_to_pronunciation' && (
            <>
              {/* Prompt */}
              <div className="text-xl font-bold mb-4 text-center w-full">
                What sound does this letter make?
              </div>

              {/* Arabic letter and instruction */}
              <div className="flex flex-col items-center mb-4">
                <div className="text-5xl font-bold">
                  {questions[currentQuestionIndex]?.arabic_letter || ''}
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  Select the correct pronunciation
                </p>
              </div>
            </>
          )}

          {questions[currentQuestionIndex]?.question_type ===
            'letter_to_sound' && (
            <div className="flex flex-col items-center mb-4">
              <div className="text-5xl font-bold">
                {questions[currentQuestionIndex]?.arabic_letter}
              </div>
              <p className="text-gray-500 text-sm mt-4">
                Select the correct letter name
              </p>
            </div>
          )}

          {questions[currentQuestionIndex]?.question_type ===
            'audio_to_letter' && (
            <div className="flex flex-col items-center mb-4">
              <audio
                ref={(element) => setAudio(element)}
                controls
                autoPlay
                className="hidden"
              >
                <source
                  src={questions[currentQuestionIndex]?.audio_url}
                  type="audio/mpeg"
                />
                Your browser does not support the audio element.
              </audio>
              <button
                onClick={handleReplayAudio}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 mt-2"
              >
                🔊 Replay Audio
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {getCurrentOptions().map((option) => {
              let buttonClass = 'p-6 rounded-lg border-2 transition-colors ';
              console.log(
                '✅ Options for Current Question:',
                getCurrentOptions()
              );

              if (isAnswerSubmitted) {
                // After submission, always highlight the correct option in green.
                if (option.is_correct) {
                  buttonClass +=
                    'bg-green-50 dark:bg-green-900/20 border-green-600 ';
                }
                // If the option is not correct but was selected, highlight it in red.
                else if (selectedAnswer === option.option_text) {
                  buttonClass += 'bg-red-50 dark:bg-red-900/20 border-red-600 ';
                }
                // Otherwise, use default styling.
                else {
                  buttonClass += 'border-gray-200 dark:border-dark-100 ';
                }
              } else {
                // Before submission, if the option is selected, use a selection highlight.
                if (selectedAnswer === option.option_text) {
                  buttonClass +=
                    'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 ';
                } else {
                  buttonClass +=
                    'border-gray-200 dark:border-dark-100 hover:border-emerald-200 ';
                }
              }

              const playOptionAudio = (optionText: string | undefined) => {
                if (!optionText) {
                  console.error('🚨 Error: optionText is undefined!');
                  return;
                }

                const normalizedKey = optionText.trim(); // Keep original case

                console.log('🔍 Looking for audio:', normalizedKey); // Debugging

                const audioUrl = quizAudio.get(normalizedKey);

                if (audioUrl) {
                  console.log('🎵 Playing:', audioUrl);
                  const audioElement = new Audio(audioUrl);
                  audioElement.crossOrigin = 'anonymous'; // Handle CORS if needed
                  audioElement.volume = 0.7;
                  audioElement
                    .play()
                    .catch((err) =>
                      console.error(
                        `Error playing audio for ${optionText}:`,
                        err
                      )
                    );
                } else {
                  console.warn(`🚨 No audio found for option: ${optionText}`);
                  console.log(
                    '🔎 Available keys:',
                    Array.from(quizAudio.keys())
                  ); // Debugging
                }
              };

              return (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!option.option_text) {
                      console.error(
                        '🚨 option.option_text is undefined!',
                        option
                      );
                      return;
                    }
                    handleAnswerSelect(option.option_text);
                    playOptionAudio(option.option_text);
                  }}
                  className={buttonClass}
                  disabled={isAnswerSubmitted}
                >
                  <div className="text-3xl text-center font-bold mb-2">
                    {option.option_text || '⚠️ Missing Option'}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {isAnswerSubmitted ? (
            <>
              {/* Centered button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {currentQuestionIndex === questions.length - 1 ? (
                    'Complete Quiz'
                  ) : (
                    <>
                      Next Question
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </motion.div>
              {/* Feedback text appears below the button */}
              <div className="text-xl font-bold text-center mt-4">
                {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;


