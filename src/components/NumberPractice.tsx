import React, { useState, useEffect } from 'react';
import {
  Hash,
  Target,
  RotateCcw,
  CheckCircle,
  XCircle,
  Play,
  ChevronLeft,
  Settings
} from 'lucide-react';

interface NumberPracticeProps {
  setSubTab: (tab: string) => void;
}

interface PracticeSettings {
  mode: 'digits' | 'words';
  difficulty: 'easy' | 'medium' | 'hard';
}

const NumberPractice: React.FC<NumberPracticeProps> = ({ setSubTab }) => {
  const [gamePhase, setGamePhase] = useState<'settings' | 'playing' | 'finished'>('settings');
  const [settings, setSettings] = useState<PracticeSettings>({
    mode: 'digits',
    difficulty: 'easy'
  });
  const [currentNumber, setCurrentNumber] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedDigits, setSelectedDigits] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [shuffledArabicDigits, setShuffledArabicDigits] = useState<string[]>([]);
  const [isAnimatingDigits, setIsAnimatingDigits] = useState(false);

  // Arabic digits 0-9
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  // Utility to shuffle an array
  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Number words in Arabic (Levantine dialect)
  const numberWords = {
    0: 'صفر',
    1: 'واحد',
    2: 'اثنين',
    3: 'ثلاثة',
    4: 'أربعة',
    5: 'خمسة',
    6: 'ستة',
    7: 'سبعة',
    8: 'ثمانية',
    9: 'تسعة',
    10: 'عشرة',
    11: 'أحد عشر',
    12: 'اثنا عشر',
    13: 'ثلاثة عشر',
    14: 'أربعة عشر',
    15: 'خمسة عشر',
    16: 'ستة عشر',
    17: 'سبعة عشر',
    18: 'ثمانية عشر',
    19: 'تسعة عشر',
    20: 'عشرين',
    30: 'ثلاثين',
    40: 'أربعين',
    50: 'خمسين',
    60: 'ستين',
    70: 'سبعين',
    80: 'ثمانين',
    90: 'تسعين',
    100: 'مية',
    200: 'مئتين',
    300: 'تلتمية',
    400: 'أربعمية',
    500: 'خمسمية',
    600: 'ستمية',
    700: 'سبعمية',
    800: 'تمنمية',
    900: 'تسعمية',
    1000: 'ألف'
  };

  const generateRandomNumber = () => {
    switch (settings.difficulty) {
      case 'easy':
        return Math.floor(Math.random() * 100) + 1; // 1-99
      case 'medium':
        return Math.floor(Math.random() * 1000) + 1; // 1-999
      case 'hard':
        return Math.floor(Math.random() * 10000) + 1; // 1-9999
      default:
        return Math.floor(Math.random() * 100) + 1;
    }
  };

  const convertToArabicDigits = (number: number): string => {
    return number.toString().split('').map(digit => arabicDigits[parseInt(digit)]).join('');
  };

  const convertToArabicWords = (number: number): string => {
    if (number === 0) return numberWords[0];
    if (number <= 20) return numberWords[number as keyof typeof numberWords] || '';
    
    let result = '';
    const thousands = Math.floor(number / 1000);
    const hundreds = Math.floor((number % 1000) / 100);
    const tens = Math.floor((number % 100) / 10);
    const ones = number % 10;

    // Thousands
    if (thousands > 0) {
      if (thousands === 1) {
        result += 'ألف';
      } else if (thousands === 2) {
        result += 'ألفين';
      } else if (thousands <= 10) {
        result += `${numberWords[thousands as keyof typeof numberWords]} تلاف`;
      }
      if (hundreds > 0 || tens > 0 || ones > 0) result += ' و';
    }

    // Hundreds
    if (hundreds > 0) {
      if (hundreds === 1) {
        result += 'مية';
      } else if (hundreds === 2) {
        result += 'مئتين';
      } else {
        result += numberWords[(hundreds * 100) as keyof typeof numberWords] || `${numberWords[hundreds as keyof typeof numberWords]}مية`;
      }
      if (tens > 0 || ones > 0) result += ' و';
    }

    // Tens and ones
    const remainder = number % 100;
    if (remainder > 0) {
      if (remainder <= 20) {
        result += numberWords[remainder as keyof typeof numberWords];
      } else {
        const tensValue = tens * 10;
        result += numberWords[tensValue as keyof typeof numberWords];
        if (ones > 0) {
          result += ` و${numberWords[ones as keyof typeof numberWords]}`;
        }
      }
    }

    return result.trim();
  };

  const getCorrectDigitAnswer = (number: number): string[] => {
    return number.toString().split('').map(digit => arabicDigits[parseInt(digit)]);
  };

  const startPractice = () => {
    setGamePhase('playing');
    const newNumber = generateRandomNumber();
    setCurrentNumber(newNumber);
    setUserAnswer('');
    setSelectedDigits([]);
    setIsCorrect(null);
    setScore({ correct: 0, total: 0 });
    if (settings.mode === 'digits') {
      setShuffledArabicDigits(shuffleArray(arabicDigits));
    }
  };

  useEffect(() => {
    if (gamePhase === 'playing' && settings.mode === 'digits' && isCorrect === null) {
      if (selectedDigits.length === getCorrectDigitAnswer(currentNumber).length && selectedDigits.length > 0) {
        // Automatically submit when all digits are selected
        checkAnswer();
      } else if (selectedDigits.length < getCorrectDigitAnswer(currentNumber).length) {
        // This part is handled by handleDigitClick for animation sequencing
      }
    }
  }, [selectedDigits, gamePhase, settings.mode, currentNumber, isCorrect]);

  const handleDigitClick = (digit: string) => {
    if (isCorrect !== null || isAnimatingDigits) return;

    setSelectedDigits(prev => [...prev, digit]);
    setIsAnimatingDigits(true); // Start shrinking animation

    setTimeout(() => {
      setIsAnimatingDigits(false); // End shrinking animation
      setShuffledArabicDigits(shuffleArray(arabicDigits)); // Reshuffle and trigger growth
    }, 100); // Short delay for shrinking animation
  };

  const checkAnswer = () => {
    let isAnswerCorrect = false;

    if (settings.mode === 'digits') {
      const correctDigits = getCorrectDigitAnswer(currentNumber);
      isAnswerCorrect = selectedDigits.length === correctDigits.length && 
                        selectedDigits.every((digit, index) => digit === correctDigits[index]);
    } else {
      const correctWords = convertToArabicWords(currentNumber);
      isAnswerCorrect = userAnswer.trim() === correctWords;
    }

    setIsCorrect(isAnswerCorrect);
    setScore(prev => ({
      correct: prev.correct + (isAnswerCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    setTimeout(() => {
      if (score.total >= 9) {
        setGamePhase('finished');
      } else {
        const newNumber = generateRandomNumber();
        setCurrentNumber(newNumber);
        setUserAnswer('');
        setSelectedDigits([]);
        setIsCorrect(null);
        if (settings.mode === 'digits') {
          setShuffledArabicDigits(shuffleArray(arabicDigits));
        }
      }
    }, 2000);
  };

  const resetPractice = () => {
    setGamePhase('settings');
    setScore({ correct: 0, total: 0 });
    setUserAnswer('');
    setSelectedDigits([]);
    setIsCorrect(null);
    setShuffledArabicDigits([]);
  };

  if (gamePhase === 'settings') {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <button
          onClick={() => setSubTab('landing')}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center hover:underline"
        >
          <ChevronLeft size={20} className="mr-1" /> Back to Learn
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Numbers Practice Settings
        </h2>

        <div className="bg-white dark:bg-dark-100 p-6 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Practice Mode
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, mode: 'digits' }))}
                  className={`w-full p-4 rounded-lg border text-left ${
                    settings.mode === 'digits'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-dark-300 dark:border-dark-400 dark:text-gray-200'
                  }`}
                >
                  <div className="font-semibold">Digit Selection</div>
                  <div className="text-sm">Select Arabic digits in order (e.g., ٨٧١٦ for 8716)</div>
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, mode: 'words' }))}
                  className={`w-full p-4 rounded-lg border text-left ${
                    settings.mode === 'words'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-dark-300 dark:border-dark-400 dark:text-gray-200'
                  }`}
                >
                  <div className="font-semibold">Word Typing</div>
                  <div className="text-sm">Type the full Arabic words (e.g., تمن تلاف وسبعمية وستعش)</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, difficulty: 'easy' }))}
                  className={`px-4 py-2 rounded-lg border ${
                    settings.difficulty === 'easy'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-dark-300 dark:border-dark-400 dark:text-gray-200'
                  }`}
                >
                  Easy (1-99)
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, difficulty: 'medium' }))}
                  className={`px-4 py-2 rounded-lg border ${
                    settings.difficulty === 'medium'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-dark-300 dark:border-dark-400 dark:text-gray-200'
                  }`}
                >
                  Medium (1-999)
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, difficulty: 'hard' }))}
                  className={`px-4 py-2 rounded-lg border ${
                    settings.difficulty === 'hard'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-dark-300 dark:border-dark-400 dark:text-gray-200'
                  }`}
                >
                  Hard (1-9999)
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={startPractice}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center text-lg transition-colors"
        >
          <Play size={20} className="mr-2" /> Start Practice
        </button>
      </div>
    );
  }

  if (gamePhase === 'playing') {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <button
          onClick={() => setGamePhase('settings')}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center hover:underline"
        >
          <ChevronLeft size={20} className="mr-1" /> Back to Settings
        </button>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
            <Target className="text-emerald-600 mx-auto mb-1" size={20} />
            <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
            <p className="font-bold text-emerald-600">{score.correct}/{score.total}</p>
          </div>
          <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
            <Hash className="text-emerald-600 mx-auto mb-1" size={20} />
            <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
            <p className="font-bold text-emerald-600">{score.total}/10</p>
          </div>
          <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
            <button onClick={resetPractice} className="w-full h-full flex flex-col items-center justify-center">
              <RotateCcw className="text-emerald-600 mx-auto mb-1" size={20} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Reset</p>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-200 p-8 rounded-lg border border-gray-200 dark:border-dark-300 mb-6 text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            What is this number in Arabic?
          </h3>
          <div className="bg-gray-100 dark:bg-gray-700 text-6xl font-bold py-8 px-4 rounded-lg mb-4 text-gray-800 dark:text-gray-200">
            {currentNumber.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {settings.mode === 'digits' ? 'Select the Arabic digits in order' : 'Type the number in Arabic words'}
          </p>
        </div>

        {settings.mode === 'digits' ? (
          <div className="space-y-4">
            {/* Arabic digits grid */}
            <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300">
              <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Arabic Digits</h3>
              <div className="grid grid-cols-5 gap-2">
                {shuffledArabicDigits.map((digit) => (
                  <button
                    key={digit} // Use digit as key because order changes
                    onClick={() => handleDigitClick(digit)}
                    className={`w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-600 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 active:bg-emerald-300 dark:active:bg-emerald-900/70 transition-all duration-300 text-2xl font-arabic flex items-center justify-center
                      ${isCorrect !== null || isAnimatingDigits ? 'opacity-0 scale-0 cursor-not-allowed' : ''}
                      ${selectedDigits.includes(digit) ? 'opacity-0 scale-0' : 'scale-100 opacity-100'}
                    `}
                    disabled={isCorrect !== null || selectedDigits.includes(digit) || isAnimatingDigits}
                  >
                    {digit}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Western: {arabicDigits.map((_, i) => i).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
            <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Type in Arabic:</h3>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-xl font-arabic text-right bg-gray-50 dark:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              dir="rtl"
              placeholder="اكتب الرقم بالعربية..."
              disabled={isCorrect !== null}
            />
          </div>
        )}

        {settings.mode === 'words' && isCorrect === null && (
          <button
            onClick={checkAnswer}
            disabled={!userAnswer.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Check Answer
          </button>
        )}

        {isCorrect !== null && (
          <div className={`p-4 rounded-lg border ${
            isCorrect 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center mb-2">
              {isCorrect ? (
                <CheckCircle size={20} className="mr-2 text-emerald-600" />
              ) : (
                <XCircle size={20} className="mr-2 text-red-600" />
              )}
              <span className="font-semibold">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {!isCorrect && (
              <p className="text-sm">
                Correct answer: {' '}
                <span className="font-arabic text-lg" dir="rtl">
                  {settings.mode === 'digits' 
                    ? getCorrectDigitAnswer(currentNumber).join('')
                    : convertToArabicWords(currentNumber)
                  }
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-6 text-center">
        <CheckCircle className="text-emerald-600 mx-auto mb-3" size={48} />
        <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Practice Complete!</h3>
        <p className="text-md text-emerald-700 dark:text-emerald-300 mb-4">
          Final Score: <span className="font-semibold">{score.correct}/10</span> ({Math.round((score.correct/10) * 100)}%)
        </p>
        <button
          onClick={startPractice}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center justify-center text-md transition-colors mx-auto"
        >
          <RotateCcw size={18} className="mr-2" /> Practice Again
        </button>
      </div>
    </div>
  );
};

export default NumberPractice; 