import React, { useState } from 'react';
import {
  Keyboard,
  Target,
  Clock,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TypingPracticeProps {
  setSubTab: (tab: string) => void;
}

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
    text: 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي',
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
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleLessonSelect = (lesson: typeof typingLessons[0]) => {
    if (lesson.status === 'Available') {
      setSelectedLesson(lesson.id);
      setCurrentText(lesson.text);
      setUserInput('');
      setIsComplete(false);
      setStartTime(Date.now());
    }
  };

  const handleInputChange = (value: string) => {
    setUserInput(value);
    if (value === currentText) {
      setIsComplete(true);
    }
  };

  const handleKeyClick = (key: string) => {
    if (selectedLesson && !isComplete) {
      const newInput = userInput + key;
      handleInputChange(newInput);
    }
  };

  const resetLesson = () => {
    setUserInput('');
    setIsComplete(false);
    setStartTime(Date.now());
  };

  const calculateAccuracy = () => {
    if (!userInput || !currentText) return 0;
    let correct = 0;
    const minLength = Math.min(userInput.length, currentText.length);
    
    for (let i = 0; i < minLength; i++) {
      if (userInput[i] === currentText[i]) {
        correct++;
      }
    }
    return Math.round((correct / currentText.length) * 100);
  };

  const getCharacterStatus = (index: number) => {
    if (index >= userInput.length) return 'pending';
    return userInput[index] === currentText[index] ? 'correct' : 'incorrect';
  };

  if (selectedLesson) {
    const selectedLessonData = typingLessons.find(l => l.id === selectedLesson);
    
    return (
      <div className="p-4">
        <button
          onClick={() => setSelectedLesson(null)}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
        >
          ← Back to Lessons
        </button>

        <h2 className="text-xl font-bold mb-4">{selectedLessonData?.title}</h2>

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
            <p className="font-bold text-emerald-600">{Math.round((userInput.length / currentText.length) * 100)}%</p>
          </div>
          <div className="bg-white dark:bg-dark-200 p-3 rounded-lg border border-gray-200 dark:border-dark-300 text-center">
            <button onClick={resetLesson} className="w-full">
              <RotateCcw className="text-emerald-600 mx-auto mb-1" size={20} />
              <p className="text-sm text-gray-600 dark:text-gray-400">Reset</p>
            </button>
          </div>
        </div>

        {/* Text Display */}
        <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Type the following:</h3>
          <div className="text-2xl font-arabic leading-relaxed text-right" dir="rtl">
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

        {/* Input Area */}
        <div className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 mb-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Your input:</h3>
          <textarea
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-2xl font-arabic text-right bg-gray-50 dark:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            dir="rtl"
            placeholder="Start typing here..."
          />
        </div>

        {/* Virtual Keyboard */}
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

        {/* Completion Message */}
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