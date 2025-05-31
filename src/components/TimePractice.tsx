import React, { useState, useEffect } from 'react';
import {
  Clock,
  Target,
  RotateCcw,
  CheckCircle,
  XCircle,
  Play,
  ChevronLeft,
  Settings,
  Check
} from 'lucide-react';

interface TimePracticeProps {
  setSubTab: (tab: string) => void;
}

interface TimeSettings {
  clockType: 'digital' | 'analog';
  numeralType: 'western' | 'arabic';
  timeFormat: '12' | '24';
}

const TimePractice: React.FC<TimePracticeProps> = ({ setSubTab }) => {
  const [gamePhase, setGamePhase] = useState<'settings' | 'playing' | 'finished'>('settings');
  const [settings, setSettings] = useState<TimeSettings>({
    clockType: 'digital',
    numeralType: 'western',
    timeFormat: '12'
  });
  const [currentTime, setCurrentTime] = useState({ hours: 12, minutes: 30 });
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Arabic numbers 0-9
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  // Time expressions in Arabic
  const timeExpressions = {
    hours: {
      1: 'الواحدة',
      2: 'الثانية', 
      3: 'الثالثة',
      4: 'الرابعة',
      5: 'الخامسة',
      6: 'السادسة',
      7: 'السابعة',
      8: 'الثامنة',
      9: 'التاسعة',
      10: 'العاشرة',
      11: 'الحادية عشرة',
      12: 'الثانية عشرة'
    },
    minutes: {
      0: '',
      5: 'وخمس دقائق',
      10: 'وعشر دقائق',
      15: 'والربع',
      20: 'وثلث',
      25: 'وخمس وعشرين دقيقة',
      30: 'والنصف',
      35: 'وخمس وثلاثين دقيقة',
      40: 'وأربعين دقيقة',
      45: 'إلا ربع',
      50: 'إلا عشر دقائق',
      55: 'إلا خمس دقائق'
    }
  };

  const generateRandomTime = () => {
    const hours = Math.floor(Math.random() * 12) + 1;
    const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const minutes = minuteOptions[Math.floor(Math.random() * minuteOptions.length)];
    return { hours, minutes };
  };

  const formatTime = (time: { hours: number; minutes: number }) => {
    if (settings.numeralType === 'arabic') {
      const formatNumber = (num: number) => {
        return num.toString().split('').map(digit => arabicNumerals[parseInt(digit)]).join('');
      };
      
      if (settings.timeFormat === '12') {
        return `${formatNumber(time.hours)}:${formatNumber(parseInt(time.minutes.toString().padStart(2, '0')))}`;
      } else {
        return `${formatNumber(time.hours)}:${formatNumber(parseInt(time.minutes.toString().padStart(2, '0')))}`;
      }
    } else {
      if (settings.timeFormat === '12') {
        return `${time.hours}:${time.minutes.toString().padStart(2, '0')}`;
      } else {
        return `${time.hours}:${time.minutes.toString().padStart(2, '0')}`;
      }
    }
  };

  const getCorrectAnswer = (time: { hours: number; minutes: number }) => {
    const hourText = timeExpressions.hours[time.hours as keyof typeof timeExpressions.hours];
    const minuteText = timeExpressions.minutes[time.minutes as keyof typeof timeExpressions.minutes];
    
    if (time.minutes === 0) {
      return `الساعة ${hourText}`;
    } else if (time.minutes === 45) {
      const nextHour = time.hours === 12 ? 1 : time.hours + 1;
      const nextHourText = timeExpressions.hours[nextHour as keyof typeof timeExpressions.hours];
      return `الساعة ${nextHourText} ${minuteText}`;
    } else if (time.minutes >= 50) {
      const nextHour = time.hours === 12 ? 1 : time.hours + 1;
      const nextHourText = timeExpressions.hours[nextHour as keyof typeof timeExpressions.hours];
      return `الساعة ${nextHourText} ${minuteText}`;
    } else {
      return `الساعة ${hourText} ${minuteText}`;
    }
  };

  const startPractice = () => {
    setGamePhase('playing');
    setCurrentTime(generateRandomTime());
    setUserAnswer('');
    setIsCorrect(null);
    setScore({ correct: 0, total: 0 });
  };

  const checkAnswer = () => {
    const correctAnswer = getCorrectAnswer(currentTime);
    const isAnswerCorrect = userAnswer.trim() === correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setScore(prev => ({
      correct: prev.correct + (isAnswerCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    setTimeout(() => {
      if (score.total >= 9) {
        setGamePhase('finished');
      } else {
        setCurrentTime(generateRandomTime());
        setUserAnswer('');
        setIsCorrect(null);
      }
    }, 2000);
  };

  const resetPractice = () => {
    setGamePhase('settings');
    setScore({ correct: 0, total: 0 });
    setUserAnswer('');
    setIsCorrect(null);
  };

  const AnalogClock = ({ time }: { time: { hours: number; minutes: number } }) => {
    const hourAngle = (time.hours % 12) * 30 + time.minutes * 0.5;
    const minuteAngle = time.minutes * 6;

    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Clock face */}
          <circle cx="100" cy="100" r="95" fill="white" stroke="#333" strokeWidth="2"/>
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = i * 30;
            const x1 = 100 + 85 * Math.cos((angle - 90) * Math.PI / 180);
            const y1 = 100 + 85 * Math.sin((angle - 90) * Math.PI / 180);
            const x2 = 100 + 75 * Math.cos((angle - 90) * Math.PI / 180);
            const y2 = 100 + 75 * Math.sin((angle - 90) * Math.PI / 180);
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#333"
                strokeWidth="2"
              />
            );
          })}

          {/* Hour hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 50 * Math.cos((hourAngle - 90) * Math.PI / 180)}
            y2={100 + 50 * Math.sin((hourAngle - 90) * Math.PI / 180)}
            stroke="#333"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Minute hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 70 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
            y2={100 + 70 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
            stroke="#666"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="100" cy="100" r="3" fill="#333"/>
        </svg>
      </div>
    );
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
          Time Practice Settings
        </h2>

        <div className="bg-white dark:bg-dark-200 p-6 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clock Type
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, clockType: 'digital' }))}
                  className={`px-4 py-2 rounded-lg border ${
                    settings.clockType === 'digital'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  Digital
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, clockType: 'analog' }))}
                  className={`px-4 py-2 rounded-lg border ${
                    settings.clockType === 'analog'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  Analog
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numeral Type
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, numeralType: 'western' }))}
                  className={`px-4 py-2 rounded-lg border ${
                    settings.numeralType === 'western'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  Western (1, 2, 3)
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, numeralType: 'arabic' }))}
                  className={`px-4 py-2 rounded-lg border ${
                    settings.numeralType === 'arabic'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  Arabic Eastern (١, ٢, ٣)
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
            <Clock className="text-emerald-600 mx-auto mb-1" size={20} />
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
            What is this time in Arabic?
          </h3>
          
          {settings.clockType === 'digital' ? (
            <div className="bg-black text-green-400 font-mono text-6xl py-8 px-4 rounded-lg mb-4 inline-block">
              {formatTime(currentTime)}
            </div>
          ) : (
            <AnalogClock time={currentTime} />
          )}
        </div>

        <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Your answer:</h3>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-xl font-arabic text-right bg-gray-50 dark:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            dir="rtl"
            placeholder="اكتب الوقت بالعربية..."
            disabled={isCorrect !== null}
          />
        </div>

        {isCorrect === null ? (
          <button
            onClick={checkAnswer}
            disabled={!userAnswer.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Check Answer
          </button>
        ) : (
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
                Correct answer: <span className="font-arabic text-lg" dir="rtl">{getCorrectAnswer(currentTime)}</span>
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center justify-center text-md transition-colors mx-auto"
        >
          <RotateCcw size={18} className="mr-2" /> Practice Again
        </button>
      </div>
    </div>
  );
};

export default TimePractice; 