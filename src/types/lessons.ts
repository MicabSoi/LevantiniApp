// Lesson content types
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  audio?: string;
  answer: string;
  options: string[];
}

export interface LessonContent {
  pronunciation: string;
  examples: string[];
  letters?: string[];
  quiz?: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: LessonContent;
  level: number;
  order_num: number;
  type: 'alphabet' | 'grammar' | 'vocabulary' | 'pronunciation';
  created_at?: string;
}

// Letter types for alphabet lessons
export interface LetterForm {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export interface LetterExample {
  word: string;
  transliteration: string;
  meaning: string;
}

export interface Letter {
  id: number;
  letter: string;
  name: string;
  transliteration: string;
  forms: LetterForm;
  examples: LetterExample[];
  audio_url?: string;
}

