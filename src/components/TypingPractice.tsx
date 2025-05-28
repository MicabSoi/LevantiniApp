import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  Target,
  Clock,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Play,
  ChevronLeft
} from 'lucide-react';

interface TypingPracticeProps {
  setSubTab: (tab: string) => void;
}

const arabicAlphabet = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');

const arabicKeyboard = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
];

const typingLessons = [
  {
    id: 1,
    title: 'Basic Letters',
    description: 'Practice typing individual Arabic letters',
    level: 'Beginner',
    text: arabicAlphabet.join(' '),
    status: 'Available'
  },
  {
    id: 2,
    title: 'Simple Words',
    description: 'Type common Levantine Arabic words',
    level: 'Beginner',
    text: 'بيت كتاب ولد بنت ماء خبز حليب سيارة مدرسة',
    status: 'Coming Soon'
  },
  {
    id: 3,
    title: 'Short Phrases',
    description: 'Practice typing everyday phrases',
    level: 'Intermediate',
    text: 'أهلا وسهلا شو اخبارك كيف حالك مع السلامة',
    status: 'Coming Soon'
  },
  {
    id: 4,
    title: 'Sentences',
    description: 'Complete sentence typing practice',
    level: 'Advanced',
    text: 'أنا بحب اتعلم العربي اللبناني لأنه حلو كتير',
    status: 'Coming Soon'
  },
];

const TypingPractice: React.FC<TypingPracticeProps> = ({ setSubTab }) => {
  const [selectedLesson, setSelectedLesson] = useState<typeof typingLessons[0] | null>(null);
  const [userInput, setUserInput] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [gamePhase, setGamePhase] = useState<'configuring' | 'playing' | 'finished'>('configuring');
  const [numLettersToTest, setNumLettersToTest] = useState<number>(10);
  const [challengeLetters, setChallengeLetters] = useState<string[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number>(0);
  const [currentTypedChar, setCurrentTypedChar] = useState<string>('');
  const [feedbackStatus, setFeedbackStatus] = useState<'pending' | 'correct' | 'incorrect'>('pending');
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const handleLessonSelect = (lesson: typeof typingLessons[0]) => {
    setSelectedLesson(lesson);
    if (lesson.title !== 'Basic Letters') {
      setCurrentText(lesson.text);
      setUserInput('');
      setIsComplete(false);
      setStartTime(Date.now());
      setGamePhase('configuring');
    } else {
      setGamePhase('configuring');
      setNumLettersToTest(10);
      setChallengeLetters([]);
      setCurrentChallengeIndex(0);
      setCurrentTypedChar('');
      setFeedbackStatus('pending');
      setSessionStats({ correct: 0, total: 0 });
      setUserInput('');
    }
  };

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleStartBasicLettersGame = () => {
    const shuffledAlphabet = shuffleArray(arabicAlphabet);
    setChallengeLetters(shuffledAlphabet.slice(0, numLettersToTest));
    setCurrentChallengeIndex(0);
    setCurrentTypedChar('');
    setFeedbackStatus('pending');
    setSessionStats({ correct: 0, total: 0 });
    setUserInput('');
    setGamePhase('playing');
    setStartTime(Date.now());
  };

  const handleBasicLetterInput = (typedChar: string) => {
    if (gamePhase !== 'playing' || challengeLetters.length === 0) return;

    const expectedChar = challengeLetters[currentChallengeIndex];
    setUserInput(typedChar);
    setCurrentTypedChar(typedChar);
    setSessionStats(prev => ({ ...prev, total: prev.total + 1 }));

    if (typedChar === expectedChar) {
      setFeedbackStatus('correct');
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setFeedbackStatus('incorrect');
    }

    setTimeout(() => {
      if (currentChallengeIndex < challengeLetters.length - 1) {
        setCurrentChallengeIndex(prev => prev + 1);
        setFeedbackStatus('pending');
        setCurrentTypedChar('');
        setUserInput('');
      } else {
        setGamePhase('finished');
      }
    }, 1000);
  };

  const handleGenericInputChange = (value: string) => {
    if (selectedLesson?.title === 'Basic Letters' && gamePhase === 'playing') {
      if (value.length > 0) {
        const lastChar = value.charAt(value.length-1);
        handleBasicLetterInput(lastChar);
      }
    } else if (selectedLesson && selectedLesson.title !== 'Basic Letters') {
      setUserInput(value);
      if (value === currentText) {
        setIsComplete(true);
      }
    }
  };

  const handleKeyClick = (key: string) => {
    if (selectedLesson?.title === 'Basic Letters' && gamePhase === 'playing') {
      handleBasicLetterInput(key);
    } else if (selectedLesson && selectedLesson.title !== 'Basic Letters' && !isComplete) {
      const newInput = userInput + key;
      setUserInput(newInput);
      if (newInput === currentText) {
        setIsComplete(true);
      }
    }
  };

  const resetLesson = () => {
    if (selectedLesson?.title === 'Basic Letters') {
      setGamePhase('configuring');
      setNumLettersToTest(10);
      setChallengeLetters([]);
      setCurrentChallengeIndex(0);
      setCurrentTypedChar('');
      setFeedbackStatus('pending');
      setSessionStats({ correct: 0, total: 0 });
      setUserInput('');
    } else {
      setUserInput('');
      setIsComplete(false);
      setStartTime(Date.now());
    }
  };

  const calculateAccuracy = () => {
    if (selectedLesson?.title === 'Basic Letters') {
      if (sessionStats.total === 0) return 0;
      return Math.round((sessionStats.correct / sessionStats.total) * 100);
    }
    if (!userInput || !currentText) return 0;
    let correctChars = 0;
    const minLength = Math.min(userInput.length, currentText.length);
    for (let i = 0; i < minLength; i++) {
      if (userInput[i] === currentText[i]) {
        correctChars++;
      }
    }
    return Math.round((correctChars / currentText.length) * 100);
  };

  const calculateProgress = () => {
    if (selectedLesson?.title === 'Basic Letters') {
      if (challengeLetters.length === 0) return 0;
      const progressIndex = gamePhase === 'finished' ? challengeLetters.length : currentChallengeIndex;
      return Math.round(((progressIndex) / challengeLetters.length) * 100);
    }
    if (!currentText) return 0;
    return Math.round((userInput.length / currentText.length) * 100);
  };

  const getCharacterStatus = (index: number) => {
    if (index >= userInput.length) return 'pending';
    return userInput[index] === currentText[index] ? 'correct' : 'incorrect';
  };

  if (selectedLesson) {
    if (selectedLesson.title === 'Basic Letters') {
      if (gamePhase === 'configuring') {
        return (
          <div className="p-4 max-w-2xl mx-auto">
            <button
              onClick={() => setSelectedLesson(null)}
              className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center hover:underline"
            >
              <ChevronLeft size={20} className="mr-1" /> Back to Lessons
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">{selectedLesson.title} Configuration</h2>
            <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-dark-300">
              <div className="mb-6">
                <label htmlFor="numLetters" className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of letters to practice: <span className="font-bold text-emerald-600">{numLettersToTest}</span>
                </label>
                <input
                  type="range"
                  id="numLetters"
                  min="5"
                  max={arabicAlphabet.length}
                  value={numLettersToTest}
                  onChange={(e) => setNumLettersToTest(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5</span>
                  <span>{arabicAlphabet.length}</span>
                </div>
              </div>
              <button
                onClick={handleStartBasicLettersGame}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center text-lg transition-colors"
              >
                <Play size={20} className="mr-2" /> Start Practice
              </button>
            </div>
          </div>
        );
      }

      if (gamePhase === 'playing' || gamePhase === 'finished') {
        const currentDisplayLetter = gamePhase === 'playing' && challengeLetters[currentChallengeIndex] ? challengeLetters[currentChallengeIndex] : (gamePhase === 'finished' && challengeLetters.length > 0 ? challengeLetters[challengeLetters.length -1] : '');

        let feedbackColorClass = '';
        if (feedbackStatus === 'correct') feedbackColorClass = 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500';
        if (feedbackStatus === 'incorrect') feedbackColorClass = 'text-red-500 bg-red-100 dark:bg-red-900/30 border-red-500 animate-shake';
        
        return (
          <div className="p-4 max-w-2xl mx-auto">
            <button
              onClick={() => setGamePhase('configuring')}
              className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center hover:underline"
            >
              <ChevronLeft size={20} className="mr-1" /> Back to Configuration
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">{selectedLesson.title}</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
                <Target className="text-emerald-600 mx-auto mb-1" size={20} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                <p className="font-bold text-emerald-600">{calculateAccuracy()}%</p>
              </div>
              <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
                <Clock className="text-emerald-600 mx-auto mb-1" size={20} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <p className="font-bold text-emerald-600">
                   {gamePhase === 'finished' ? challengeLetters.length : currentChallengeIndex + 1} / {challengeLetters.length}
                </p>
              </div>
              <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
                <button onClick={resetLesson} className="w-full h-full flex flex-col items-center justify-center">
                  <RotateCcw className="text-emerald-600 mx-auto mb-1" size={20} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reset</p>
                </button>
              </div>
            </div>

            {gamePhase === 'playing' && (
            <div className="bg-white dark:bg-dark-200 p-8 rounded-lg border border-gray-200 dark:border-dark-300 mb-6 text-center">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Type the following letter:</h3>
              <div 
                className={`font-arabic h-32 w-full max-w-md mx-auto flex items-center justify-center rounded-md border-2 transition-all duration-300 ease-in-out ${feedbackColorClass} ${feedbackStatus === 'pending' ? 'text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600' : ''} overflow-hidden`}
                style={{ fontSize: '5rem', lineHeight: '0.8', transform: 'translateY(-0.1em)' }}
                dir="rtl"
              >
                {currentDisplayLetter}
              </div>
            </div>
            )}
            
            {gamePhase === 'finished' && (
              <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-6 text-center">
                <CheckCircle className="text-emerald-600 mx-auto mb-3" size={48} />
                <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Practice Complete!</h3>
                <p className="text-md text-emerald-700 dark:text-emerald-300 mb-1">
                  You practiced <span className="font-semibold">{challengeLetters.length}</span> letters.
                </p>
                <p className="text-md text-emerald-700 dark:text-emerald-300">
                  Accuracy: <span className="font-semibold">{calculateAccuracy()}%</span> 
                  ({sessionStats.correct} / {sessionStats.total} correct)
                </p>
                <button
                  onClick={handleStartBasicLettersGame}
                  className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center justify-center text-md transition-colors mx-auto"
                >
                  <RotateCcw size={18} className="mr-2" /> Play Again
                </button>
              </div>
            )}

            {gamePhase === 'playing' && (
                <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Your input:</h3>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => handleGenericInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key.length === 1 && arabicAlphabet.includes(e.key)) {
                        handleBasicLetterInput(e.key);
                        e.preventDefault();
                      } else if (e.key === ' ') {
                         e.preventDefault();
                      }
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-3xl font-arabic text-center bg-gray-50 dark:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="rtl"
                    placeholder="_"
                    maxLength={1}
                    ref={input => input && input.focus()}
                />
                </div>
            )}

            {gamePhase === 'playing' && (
              <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300">
                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Arabic Keyboard</h3>
                <div className="space-y-2">
                  {arabicKeyboard.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center space-x-1 rtl:space-x-reverse">
                      {row.map((key) => (
                        <button
                          key={key}
                          onClick={() => handleKeyClick(key)}
                          className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 dark:bg-dark-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:bg-emerald-200 dark:active:bg-emerald-900/50 transition-colors text-xl font-arabic flex items-center justify-center"
                          disabled={gamePhase !== 'playing'}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    } else {
      return (
        <div className="p-4">
           <button
             onClick={() => setSelectedLesson(null)}
             className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center hover:underline"
           >
             <ChevronLeft size={20} className="mr-1" /> Back to Lessons
           </button>
           <h2 className="text-xl font-bold mb-4">{selectedLesson.title}</h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
                <Target className="text-emerald-600 mx-auto mb-1" size={20} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                <p className="font-bold text-emerald-600">{calculateAccuracy()}%</p>
              </div>
              <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
                <Clock className="text-emerald-600 mx-auto mb-1" size={20} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <p className="font-bold text-emerald-600">{calculateProgress()}%</p>
              </div>
              <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
                <button onClick={resetLesson} className="w-full h-full flex flex-col items-center justify-center">
                  <RotateCcw className="text-emerald-600 mx-auto mb-1" size={20} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reset</p>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
              <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Type the following:</h3>
              <div className="text-2xl font-arabic leading-relaxed text-right flex flex-wrap w-full" dir="rtl">
                {currentText.split('').map((char, index) => {
                  const status = getCharacterStatus(index);
                  let className = 'border-b-2 ';
                  
                  if (status === 'correct') {
                    className += 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20';
                  } else if (status === 'incorrect') {
                    className += 'text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20';
                  } else if (index === userInput.length) {
                    className += 'text-gray-800 dark:text-gray-100 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 animate-pulse';
                  } else {
                    className += 'text-gray-400 border-gray-200 dark:border-gray-600';
                  }

                  return (
                    <span key={index} className={className}>
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
              <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Your input:</h3>
              <textarea
                value={userInput}
                onChange={(e) => handleGenericInputChange(e.target.value)}
                className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-2xl font-arabic text-right bg-gray-50 dark:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="rtl"
                placeholder="Start typing here..."
                disabled={isComplete}
              />
            </div>

            <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300">
              <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Arabic Keyboard</h3>
              <div className="space-y-2">
                {arabicKeyboard.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center space-x-1">
                    {row.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyClick(key)}
                        className="w-12 h-12 bg-gray-100 dark:bg-dark-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:bg-emerald-200 dark:active:bg-emerald-900/50 transition-colors text-lg font-arabic"
                        disabled={isComplete}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => handleKeyClick(' ')}
                  className="px-8 py-3 bg-gray-100 dark:bg-dark-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:bg-emerald-200 dark:active:bg-emerald-900/50 transition-colors"
                  disabled={isComplete}
                >
                  Space
                </button>
              </div>
            </div>

            {/* Completion Message for other lessons */}
            {isComplete && (
              <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="text-emerald-600 mr-2" size={24} />
                  <div>
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-200">Lesson Complete!</h3>
                    <p className="text-emerald-700 dark:text-emerald-300">Great job! You've successfully completed this typing lesson.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  }

  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Learn
      </button>

      <h2 className="text-xl font-bold mb-6">Arabic Typing Practice</h2>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <Keyboard className="text-emerald-600 mr-2" size={20} />
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200">
            Master Arabic Typing
          </h3>
        </div>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Learn to type in Arabic using a virtual keyboard. Practice individual letters, words, and phrases to improve your typing speed and accuracy.
        </p>
      </div>

      <div className="space-y-4">
        {typingLessons.map((lesson) => (
          <div
            key={lesson.id}
            onClick={() => handleLessonSelect(lesson)}
            className={`flex items-center justify-between p-4 bg-white dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300 transition-colors ${
              lesson.status === 'Available' 
                ? 'hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mr-4">
                <Keyboard size={24} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {lesson.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {lesson.description}
                </p>
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-xs">
                  {lesson.level}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              {lesson.status === 'Available' ? (
                <CheckCircle className="text-emerald-600" size={20} />
              ) : (
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm mr-2">
                    {lesson.status}
                  </span>
                  <AlertCircle className="text-gray-400" size={20} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-dark-200 rounded-lg border border-gray-200 dark:border-dark-300">
        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-100">
          More Typing Lessons Coming Soon
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We're developing additional typing lessons with words, phrases, and full sentences to help you become proficient at typing in Arabic.
        </p>
      </div>
    </div>
  );
};

export default TypingPractice; 