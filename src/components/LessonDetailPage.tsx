import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Volume2 } from 'lucide-react';
import Quiz from './Quiz';
import { motion } from 'framer-motion';
import { useAudio } from '../context/AudioContext'; // ✅ Import shared audio data
import AlphabetSongLesson from './AlphabetSongLesson';

interface LessonDetailProps {
  lessonId: string;
  onBack: () => void;
}

// Map lesson IDs to their corresponding letters ALPHABET topic
const lessonLettersMap: { [key: string]: string[] } = {
  '657b5aef-23e3-462c-9f61-c134a855b269': ['ل', 'ا', 'ى', 'ي'],
  '81221d64-e880-407c-a9ba-fb47b02d7d10': ['ب', 'ن', 'ت', 'ث'],
  'd1df16d4-e6b2-4dbd-9d13-b43b84465e28': ['د', 'ذ', 'ط', 'ظ'],
  '78156b07-cca4-4d0c-8e6c-f3903f533844': ['ج', 'ح', 'خ'],
  '8b81eec3-1391-4371-bbf4-4a2d5b056051': ['ر', 'ز', 'و', 'ك'],
  'd5fd9cb9-2c76-44b0-a506-bf8d40beef0b': ['س', 'ش', 'ص', 'ض'],
  '5bade402-5729-4afc-a688-eae79a41bedd': ['ع', 'غ', 'ف', 'ق'],
  '8e4bc85b-08f5-448b-84fa-836235dfea4c': ['م', 'ه', 'ة', 'ء'],
  '89265e2d-d7bd-4725-9047-d1d7f84965cc': [
    'ا',
    'ب',
    'ت',
    'ث',
    'ج',
    'ح',
    'خ',
    'د',
    'ذ',
    'ر',
    'ز',
    'س',
    'ش',
    'ص',
    'ض',
    'ط',
    'ظ',
    'ع',
    'غ',
    'ف',
    'ق',
    'ك',
    'ل',
    'م',
    'ن',
    'ه',
    'و',
    'ي',
  ],
};

const LessonDetailPage: React.FC<LessonDetailProps> = ({
  lessonId,
  onBack,
}) => {
  const [lesson, setLesson] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState(30);

  const [showQuiz, setShowQuiz] = useState(false);
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [quiz, setQuiz] = useState<any>(null);

  useEffect(() => {
    async function fetchQuizData() {
      console.log(
        '🔍 DEBUG: Fetching quiz data for:',
        lesson?.level,
        lesson?.order_num
      );

      if (
        !lesson ||
        lesson.level === undefined ||
        lesson.order_num === undefined
      ) {
        console.warn('⚠️ Lesson is missing required fields:', lesson);
        return;
      }

      const { data: quiz_questions, error: quizError } = await supabase
        .from('quiz_questions')
        .select(
          `
       *
      `
        )
        .eq('level', lesson.level)
        .eq('order_num', lesson.order_num);

      if (quizError) {
        console.error('❌ Quiz Fetch Error:', quizError);
        return;
      }

      console.log(
        '✅ Fetched quiz_questions with audio & sound:',
        quiz_questions
      );
      setQuiz(quiz_questions);
    }

    if (lesson) {
      fetchQuizData();
    }
  }, [lesson]);

  useEffect(() => {
    async function fetchLesson() {
      setLoading(true);
      setError(null);
      try {
        // Fetch lesson details
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;
        setLesson(lessonData);

        // Fetch letters associated with this lesson
        const lettersToFetch = lessonLettersMap[lessonId] || [];
        if (lettersToFetch.length > 0) {
          const { data: letterData, error: letterError } = await supabase
            .from('alphabet')
            .select(
              'letter, name, transliteration, pronunciation_description, forms, examples, additional_info, song_url'
            )
            .in('letter', lettersToFetch);

          if (letterError) throw letterError;

          // Maintain correct order of letters
          const orderedLetters = lettersToFetch.map((ltr) =>
            letterData.find((row) => row.letter === ltr)
          );
          setLetters(orderedLetters);
        }
      } catch (err: any) {
        console.error('Error fetching lesson or letters:', err);
        setError('Failed to load lesson content.');
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);
  const { audioData } = useAudio();

  const playAudio = (letter: string) => {
    // Find the audio file for this letter from the constructed list
    const audioFile = constructedAudioFiles.find(
      (file) => file.letter === letter
    );
    if (!audioFile || !audioFile.url) {
      console.warn(`No audio found for letter: ${letter}`);
      return;
    }
    const audio = new Audio(audioFile.url);
    audio.crossOrigin = 'anonymous';
    audio
      .play()
      .catch((err) => console.error(`Error playing audio for ${letter}:`, err));
  };

  if (loading) return <div className="p-4">Loading lesson...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!lesson) return <div className="p-4">Lesson not found.</div>;

  const renderQuiz = () => {
    // Pick a random letter from the lesson as the correct answer
    const correctLetter = letters[Math.floor(Math.random() * letters.length)];

    // Shuffle options (correct letter + random others)
    const options = [...letters]
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, 3); // Pick 3 random options

    // Ensure the correct letter is always included
    if (!options.includes(correctLetter)) {
      options.push(correctLetter);
    }

    // State to track user's selection
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const handleOptionClick = (option: string) => {
      setSelectedOption(option);
      setIsCorrect(option === correctLetter.letter);

      // Reset after a delay
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 1500);
    };

    return (
      <div className="quiz-container">
        <h2 className="text-xl font-bold mb-4">
          Which letter makes this sound?
        </h2>

        {/* Play Sound Button */}
        <button
          onClick={() => new Audio(correctLetter.audio_url).play()}
          className="play-button"
        >
          🔊 Play Sound
        </button>

        {/* Answer Options */}
        <div className="options-container">
          {options.map((option) => (
            <motion.div
              key={option.letter}
              className={`option ${
                selectedOption === option.letter ? 'selected' : ''
              }`}
              whileTap={{ scale: 0.9 }}
              animate={
                isCorrect !== null
                  ? option.letter === correctLetter.letter
                    ? { scale: 1.2 }
                    : { x: [-10, 10, -5, 5, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
              onClick={() => handleOptionClick(option.letter)}
            >
              {option.letter}
            </motion.div>
          ))}
        </div>

        {/* Feedback */}
        {isCorrect !== null && (
          <motion.div
            className={`feedback ${isCorrect ? 'correct' : 'wrong'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isCorrect ? '✅ Correct!' : '❌ Try Again'}
          </motion.div>
        )}

        {/* Return to Lesson */}
        <motion.button
          onClick={() => setShowQuiz(false)}
          className="mt-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ⬅ Back to Lesson
        </motion.button>
      </div>
    );
  };

  if (showQuiz && quiz) {
    return (
      <Quiz
        lesson={lesson}
        lessonId={lessonId}
        quizData={quiz}
        onComplete={() => setShowQuiz(false)}
        onBack={() => setShowQuiz(false)}
        questionCount={questionCount}
      />
    );
  }
  // Create an array that maps each letter to its audio file URL with logging
  const constructedAudioFiles = letters.map((l) => {
    console.log(`Using audio URL for ${l.letter}: ${l.song_url}`);
    return { letter: l.letter, url: l.song_url };
  });

  // This will print the complete list in the console
  console.log('constructedAudioFiles:', constructedAudioFiles);
  return (
    <div className="p-4">
      {/* Go Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Lessons
      </button>

      {/* Lesson Title & Description */}
      <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
      <p className="text-gray-600 dark:text-white mb-6 whitespace-pre-wrap">
        {lesson.description}
      </p>
      {/* For lesson 9, include the Alphabet Song component */}

      {lesson.order_num === 9 && (
        <div className="mb-6">
          {console.log('Audio data available:', audioData)}
          {console.log('Letters being mapped:', letters)}
          <AlphabetSongLesson
            letters={letters.map((l) => l.letter)}
            audioFiles={constructedAudioFiles}
          />
        </div>
      )}

      {/* Display Letter Cards */}
      {letters.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Letters in this Lesson</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {letters.map((letter) => (
              <div key={letter.letter} className="flex flex-col">
                {/* Letter Card */}
                <div className="bg-white dark:bg-dark-100 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-300 flex flex-col">
                  {/* Letter Display */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl font-bold ml-1">
                        {letter.letter}
                      </div>
                      <div className="text-xl text-gray-600 dark:text-gray-400 ml-3">
                        {letter.name} - {letter.transliteration}
                      </div>
                    </div>
                    <button
                      onClick={() => playAudio(letter.letter)}
                      className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {/* Pronunciation Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {letter.pronunciation_description}
                  </p>

                  {/* Forms & Examples Table */}
                  <div className="grid grid-cols-3 gap-4">
                    {['end', 'middle', 'start'].map((position) => (
                      <div key={position} className="text-center">
                        <div className="font-medium text-sm mb-2 capitalize">
                          {position}:
                        </div>
                        <div className="text-2xl mb-5">
                          {letter.forms[position]}
                        </div>
                        {letter.examples[position]?.word && (
                          <div className="text-md" dir="rtl">
                            {letter.examples[position].word}
                          </div>
                        )}

                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {letter.examples[position]?.transliteration}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {letter.examples[position]?.translation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Info Outside the Letter Card */}
                {letter.additional_info && (
                  <p className="mt-2 text-black dark:text-white text-lg">
                    {letter.additional_info}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center items-center mt-4 gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-white">
          Number of Questions:
        </label>
        <select
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-100 text-gray-700 dark:text-white"
        >
          {[5, 10, 15, 20, 25, 30].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      {/* Start Quiz Button */}
      <div className="flex justify-center mt-6">
        <motion.button
          onClick={() => setShowQuiz(true)}
          className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!quiz || quiz.length === 0} // ✅ Disable if no quiz_questions are found
          style={{ opacity: quiz && quiz.length > 0 ? 1 : 0.5 }} // ✅ Dim button when loading
        >
          {quiz && quiz.length > 0 ? 'Start Quiz' : 'Loading Quiz...'}
        </motion.button>
      </div>
    </div> // ✅ Now the JSX structure is correct
  );
};

export default LessonDetailPage;


