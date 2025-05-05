import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the word type
export interface Word {
  id: number;
  word: string;
  transliteration: string;
  definition: string;
  example: string;
  exampleTranslation: string;
  learnedAt: Date;
}

interface LearnedWordsContextType {
  learnedWords: Word[];
  addLearnedWord: (word: Omit<Word, 'learnedAt'>) => void;
  getTodayLearnedCount: () => number;
  getTodayLearnedWords: () => Word[];
}

const LearnedWordsContext = createContext<LearnedWordsContextType | undefined>(undefined);

export const useLearnedWords = () => {
  const context = useContext(LearnedWordsContext);
  if (!context) {
    throw new Error('useLearnedWords must be used within a LearnedWordsProvider');
  }
  return context;
};

interface LearnedWordsProviderProps {
  children: ReactNode;
}

export const LearnedWordsProvider: React.FC<LearnedWordsProviderProps> = ({ children }) => {
  const [learnedWords, setLearnedWords] = useState<Word[]>(() => {
    // Load from localStorage on initial render
    const savedWords = localStorage.getItem('learnedWords');
    if (savedWords) {
      const parsed = JSON.parse(savedWords);
      // Convert string dates back to Date objects
      return parsed.map((word: any) => ({
        ...word,
        learnedAt: new Date(word.learnedAt)
      }));
    }
    return [];
  });

  // Save to localStorage whenever learnedWords changes
  useEffect(() => {
    localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
  }, [learnedWords]);

  const addLearnedWord = (word: Omit<Word, 'learnedAt'>) => {
    // Check if word is already learned
    const isAlreadyLearned = learnedWords.some(w => w.id === word.id);
    
    if (!isAlreadyLearned) {
      const newLearnedWord = {
        ...word,
        learnedAt: new Date()
      };
      setLearnedWords(prev => [...prev, newLearnedWord]);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getTodayLearnedCount = () => {
    return learnedWords.filter(word => isToday(word.learnedAt)).length;
  };

  const getTodayLearnedWords = () => {
    return learnedWords.filter(word => isToday(word.learnedAt));
  };

  return (
    <LearnedWordsContext.Provider value={{ 
      learnedWords, 
      addLearnedWord, 
      getTodayLearnedCount,
      getTodayLearnedWords
    }}>
      {children}
    </LearnedWordsContext.Provider>
  );
};

