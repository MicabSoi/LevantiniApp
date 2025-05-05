import React, { useState, useEffect } from 'react';
import {
  Plus,
  ChevronRight,
  AlertCircle,
  Edit2,
  Save,
  Trash2,
  BookOpen,
  Search,
  Calendar,
  BookA,
  Plane,
  Clock,
} from 'lucide-react';
import { useLearnedWords } from '../context/LearnedWordsContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VerbConjugation {
  pronoun: string;
  arabic: string;
  transliteration: string;
  translation: string;
}

interface Word {
  id: number;
  arabic: string;
  transliteration: string;
  englishMeaning: string;
  dateMade: string;
  isEditing?: boolean;
}

interface WordBankProps {
  setActiveTab: (tab: string) => void;
  setWordBankSubTab: (tab: string) => void;
}

const WordBank: React.FC<WordBankProps> = ({
  setActiveTab,
  setWordBankSubTab,
}) => {
  const { getTodayLearnedWords } = useLearnedWords();
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecentlyLearned, setShowRecentlyLearned] = useState(false);
  const [recentlyLearnedWords, setRecentlyLearnedWords] = useState<
    { date: string; words: any[] }[]
  >([]);
  const [expandedVerbs, setExpandedVerbs] = useState<number[]>([]);
  const [wordsPerDay] = useState<number>(() => {
    const saved = localStorage.getItem('wordsPerDay');
    return saved ? parseInt(saved) : 3;
  });

  // Sample verb data - this would normally come from your database
  const verbDatabase = [
    {
      id: 1,
      base: {
        arabic: 'كتب',
        transliteration: 'katab',
        translation: 'to write',
      },
      past: [
        {
          pronoun: 'I',
          arabic: 'كتبت',
          transliteration: 'katabit',
          translation: 'I wrote',
        },
        {
          pronoun: 'You (m)',
          arabic: 'كتبت',
          transliteration: 'katabit',
          translation: 'You wrote',
        },
        {
          pronoun: 'You (f)',
          arabic: 'كتبتي',
          transliteration: 'katabti',
          translation: 'You wrote',
        },
        {
          pronoun: 'He',
          arabic: 'كتب',
          transliteration: 'katab',
          translation: 'He wrote',
        },
        {
          pronoun: 'She',
          arabic: 'كتبت',
          transliteration: 'katabit',
          translation: 'She wrote',
        },
        {
          pronoun: 'We',
          arabic: 'كتبنا',
          transliteration: 'katabna',
          translation: 'We wrote',
        },
        {
          pronoun: 'You (pl)',
          arabic: 'كتبتو',
          transliteration: 'katabtu',
          translation: 'You wrote',
        },
        {
          pronoun: 'They',
          arabic: 'كتبو',
          transliteration: 'katabu',
          translation: 'They wrote',
        },
      ],
      present: [
        {
          pronoun: 'I',
          arabic: 'بكتب',
          transliteration: 'baktob',
          translation: 'I write',
        },
        {
          pronoun: 'You (m)',
          arabic: 'بتكتب',
          transliteration: 'btiktob',
          translation: 'You write',
        },
        {
          pronoun: 'You (f)',
          arabic: 'بتكتبي',
          transliteration: 'btikitbi',
          translation: 'You write',
        },
        {
          pronoun: 'He',
          arabic: 'بيكتب',
          transliteration: 'byiktob',
          translation: 'He writes',
        },
        {
          pronoun: 'She',
          arabic: 'بتكتب',
          transliteration: 'btiktob',
          translation: 'She writes',
        },
        {
          pronoun: 'We',
          arabic: 'منكتب',
          transliteration: 'mniktob',
          translation: 'We write',
        },
        {
          pronoun: 'You (pl)',
          arabic: 'بتكتبو',
          transliteration: 'btikitbu',
          translation: 'You write',
        },
        {
          pronoun: 'They',
          arabic: 'بيكتبو',
          transliteration: 'byiktbu',
          translation: 'They write',
        },
      ],
      imperative: [
        {
          pronoun: 'You (m)',
          arabic: 'اكتب',
          transliteration: 'ktob',
          translation: 'Write!',
        },
        {
          pronoun: 'You (f)',
          arabic: 'اكتبي',
          transliteration: 'ktubi',
          translation: 'Write!',
        },
        {
          pronoun: 'You (pl)',
          arabic: 'اكتبو',
          transliteration: 'ktubu',
          translation: 'Write!',
        },
      ],
      examples: [
        {
          arabic: 'بدي اكتب رسالة',
          transliteration: 'biddi aktob risaale',
          translation: 'I want to write a letter',
        },
        {
          arabic: 'كتبت الواجب؟',
          transliteration: 'katabit il-waajib?',
          translation: 'Did you write the homework?',
        },
      ],
      date: '2024-02-20',
    },
    {
      id: 2,
      base: {
        arabic: 'أكل',
        transliteration: 'akal',
        translation: 'to eat',
      },
      past: [
        {
          pronoun: 'I',
          arabic: 'أكلت',
          transliteration: 'akalit',
          translation: 'I ate',
        },
        {
          pronoun: 'You (m)',
          arabic: 'أكلت',
          transliteration: 'akalit',
          translation: 'You ate',
        },
        {
          pronoun: 'You (f)',
          arabic: 'أكلتي',
          transliteration: 'akalti',
          translation: 'You ate',
        },
        {
          pronoun: 'He',
          arabic: 'أكل',
          transliteration: 'akal',
          translation: 'He ate',
        },
        {
          pronoun: 'She',
          arabic: 'أكلت',
          transliteration: 'akalit',
          translation: 'She ate',
        },
        {
          pronoun: 'We',
          arabic: 'أكلنا',
          transliteration: 'akalna',
          translation: 'We ate',
        },
        {
          pronoun: 'You (pl)',
          arabic: 'أكلتو',
          transliteration: 'akaltu',
          translation: 'You ate',
        },
        {
          pronoun: 'They',
          arabic: 'أكلو',
          transliteration: 'akalu',
          translation: 'They ate',
        },
      ],
      present: [
        {
          pronoun: 'I',
          arabic: 'باكل',
          transliteration: 'baakol',
          translation: 'I eat',
        },
        {
          pronoun: 'You (m)',
          arabic: 'بتاكل',
          transliteration: 'btaakol',
          translation: 'You eat',
        },
        {
          pronoun: 'You (f)',
          arabic: 'بتاكلي',
          transliteration: 'btaakli',
          translation: 'You eat',
        },
        {
          pronoun: 'He',
          arabic: 'بياكل',
          transliteration: 'byaakol',
          translation: 'He eats',
        },
        {
          pronoun: 'She',
          arabic: 'بتاكل',
          transliteration: 'btaakol',
          translation: 'She eats',
        },
        {
          pronoun: 'We',
          arabic: 'مناكل',
          transliteration: 'mnaakol',
          translation: 'We eat',
        },
        {
          pronoun: 'You (pl)',
          arabic: 'بتاكلو',
          transliteration: 'btaaklu',
          translation: 'You eat',
        },
        {
          pronoun: 'They',
          arabic: 'بياكلو',
          transliteration: 'byaaklu',
          translation: 'They eat',
        },
      ],
      imperative: [
        {
          pronoun: 'You (m)',
          arabic: 'كول',
          transliteration: 'kool',
          translation: 'Eat!',
        },
        {
          pronoun: 'You (f)',
          arabic: 'كولي',
          transliteration: 'kooli',
          translation: 'Eat!',
        },
        {
          pronoun: 'You (pl)',
          arabic: 'كولو',
          transliteration: 'koolu',
          translation: 'Eat!',
        },
      ],
      examples: [
        {
          arabic: 'بدك تاكل شي؟',
          transliteration: 'biddak taakol shi?',
          translation: 'Do you want to eat something?',
        },
        {
          arabic: 'أكلت الفطور',
          transliteration: 'akalit il-fToor',
          translation: 'I ate breakfast',
        },
      ],
      date: '2024-02-20',
    },
  ];

  const [groupedVerbs, setGroupedVerbs] = useState<{
    [key: string]: typeof verbDatabase;
  }>({});

  useEffect(() => {
    // Group verbs by date
    const grouped = verbDatabase.reduce(
      (acc: { [key: string]: typeof verbDatabase }, verb) => {
        if (!acc[verb.date]) {
          acc[verb.date] = [];
        }
        acc[verb.date].push(verb);
        return acc;
      },
      {}
    );
    setGroupedVerbs(grouped);
  }, []);

  const toggleVerb = (verbId: number) => {
    setExpandedVerbs((prev) =>
      prev.includes(verbId)
        ? prev.filter((id) => id !== verbId)
        : [...prev, verbId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Initialize words state
  const [words, setWords] = useState<Word[]>(() => {
    const savedWords = localStorage.getItem('wordBank');
    return savedWords ? JSON.parse(savedWords) : [];
  });

  const todayLearnedWords = getTodayLearnedWords();

  const tabs = [
    {
      id: 'wordbank',
      label: 'Recently Learned',
      icon: <Clock size={24} className="text-emerald-600" />,
      count: 'Last 7 days',
    },
    {
      id: 'wordbank_add',
      label: 'Word Bank',
      icon: <BookA size={24} className="text-emerald-600" />,
      count: '250 words',
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: <BookOpen size={24} className="text-emerald-600" />,
      count: '12 decks',
    },
    {
      id: 'travel',
      label: 'Travel',
      icon: <Plane size={24} className="text-emerald-600" />,
      count: '100 phrases',
    },
  ];

  const [arabic, setArabic] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [englishMeaning, setEnglishMeaning] = useState('');
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Word>('englishMeaning');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'wordbank'

  // Get words learned in the last 7 days
  const getRecentlyLearnedWords = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWords = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const words = getTodayLearnedWords(date);
      if (words.length > 0) {
        recentWords.push({
          date: date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          words,
        });
      }
    }
    return recentWords;
  };

  // Update recently learned words when component mounts or when getTodayLearnedWords changes
  useEffect(() => {
    setRecentlyLearnedWords(getRecentlyLearnedWords());
  }, [getTodayLearnedWords]);

  // Save words to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wordBank', JSON.stringify(words));
  }, [words]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation logic based on the clarified requirements
    if (!englishMeaning) {
      setError('English Meaning is required.');
      return;
    }

    if (!transliteration && !arabic) {
      setError('Either English Transliteration or Arabic must be filled.');
      return;
    }

    const newWord: Word = {
      id: Date.now(),
      arabic,
      transliteration,
      englishMeaning,
      dateMade: new Date().toLocaleDateString('en-GB'),
      isEditing: false,
    };

    setWords((prev) => [newWord, ...prev]);
    setArabic('');
    setTransliteration('');
    setEnglishMeaning('');
  };

  const handleSort = (column: keyof Word) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedWords = [...words].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const aValue = a[sortColumn].toLowerCase();
    const bValue = b[sortColumn].toLowerCase();
    return aValue > bValue ? direction : -direction;
  });

  const handleEditToggle = (id: number) => {
    setWords((prev) =>
      prev.map((word) =>
        word.id === id ? { ...word, isEditing: !word.isEditing } : word
      )
    );
  };

  const handleSave = (id: number, updatedWord: Partial<Word>) => {
    setWords((prev) =>
      prev.map((word) =>
        word.id === id ? { ...word, ...updatedWord, isEditing: false } : word
      )
    );
  };

  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this word?'
    );
    if (confirmed) {
      setWords((prev) => prev.filter((word) => word.id !== id));
    }
  };

  // Render Word Bank view
  if (currentView === 'wordbank') {
    return (
      <div className="p-4">
        <button
          onClick={() => setCurrentView('main')}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
        >
          ← Back to Vocabulary
        </button>

        <h2 className="text-2xl font-bold mb-6">Word Bank</h2>

        {/* Add New Word Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100"
        >
          <h3 className="font-bold mb-4">Add New Word</h3>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="English Meaning"
              value={englishMeaning}
              onChange={(e) => setEnglishMeaning(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md"
              required
            />
            <input
              type="text"
              placeholder="English Transliteration"
              value={transliteration}
              onChange={(e) => setTransliteration(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md"
            />
            <input
              type="text"
              placeholder="Arabic"
              value={arabic}
              onChange={(e) => setArabic(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            <Plus size={18} className="mr-2" />
            Add Word
          </button>
        </form>

        {/* Words Table */}
        <div className="bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-100 border-b border-gray-200 dark:border-dark-100">
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-200"
                  onClick={() => handleSort('englishMeaning')}
                >
                  English Meaning
                  {sortColumn === 'englishMeaning' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-200"
                  onClick={() => handleSort('transliteration')}
                >
                  English Transliteration
                  {sortColumn === 'transliteration' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-200"
                  onClick={() => handleSort('arabic')}
                >
                  Arabic
                  {sortColumn === 'arabic' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-200"
                  onClick={() => handleSort('dateMade')}
                >
                  Date Made
                  {sortColumn === 'dateMade' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-100">
              {sortedWords.map((word) => (
                <tr
                  key={word.id}
                  className="hover:bg-gray-50 dark:hover:bg-dark-100"
                >
                  <td className="px-4 py-3">{word.englishMeaning}</td>
                  <td className="px-4 py-3">{word.transliteration}</td>
                  <td className="px-4 py-3 text-right" dir="rtl">
                    {word.arabic}
                  </td>
                  <td className="px-4 py-3">{word.dateMade}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditToggle(word.id)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {word.isEditing ? (
                          <Save size={18} />
                        ) : (
                          <Edit2 size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {words.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No words added yet. Start building your vocabulary!
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">Vocabulary</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Build your Levantine Arabic vocabulary
      </p>

      {/* Grid of Options (Tabs Map) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              if (tab.id === 'wordbank') {
                setShowRecentlyLearned(true);
              } else
                switch (tab.id) {
                  case 'wordbank_add':
                    setCurrentView('wordbank');
                    break;
                  case 'flashcards':
                    setActiveTab('wordbank');
                    setWordBankSubTab('flashcards');
                    break;
                  case 'travel':
                    setActiveTab('wordbank');
                    setWordBankSubTab('travel dictionary');
                    break;
                }
            }}
            className="p-4 rounded-lg cursor-pointer transition-colors bg-gray-50 dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#121212] hover:!border-emerald-500 dark:hover:!border-emerald-500"
          >
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                {tab.icon}
              </div>
            </div>
            <h3 className="font-bold text-center mb-1 text-gray-800 dark:text-white">
              {tab.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-white text-center">
              {tab.count}
            </p>
          </div>
        ))}
      </div>

      {/* Search Bar (Moved below Tabs Map) */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-dark-200 placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          placeholder="Search words or phrases"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Daily Words Section */}
      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-bold mb-4">Daily Words</h3>
        {Object.entries(groupedVerbs)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, verbs]) => (
            <div
              key={date}
              className="border border-gray-200 dark:border-dark-100 rounded-lg overflow-hidden"
            >
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 border-b border-gray-200 dark:border-dark-100">
                <div className="flex items-center">
                  <Calendar
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400 mr-2"
                  />
                  <h3 className="font-bold">{formatDate(date)}</h3>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-dark-100 dark:bg-dark-200">
                {verbs.slice(0, wordsPerDay).map((verb) => (
                  <div key={verb.id} className="p-4">
                    <div
                      className="flex justify-between items-start cursor-pointer"
                      onClick={() => toggleVerb(verb.id)}
                    >
                      <div>
                        <h4 className="text-lg font-bold">
                          {verb.base.arabic}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {verb.base.transliteration}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {verb.base.translation}
                        </p>
                      </div>
                      {expandedVerbs.includes(verb.id) ? (
                        <ChevronUp className="text-gray-400 dark:text-gray-500" />
                      ) : (
                        <ChevronDown className="text-gray-400 dark:text-gray-500" />
                      )}
                    </div>

                    {expandedVerbs.includes(verb.id) && (
                      <div className="mt-4">
                        {/* Past Tense */}
                        <div className="mb-4">
                          <h5 className="font-bold mb-2">Past Tense</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {verb.past.map((conj, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 dark:bg-dark-100 p-2 rounded-md"
                              >
                                <span className="text-sm font-medium">
                                  {conj.pronoun}
                                </span>
                                <div className="flex justify-between mt-1">
                                  <span className="text-lg">{conj.arabic}</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {conj.transliteration}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {conj.translation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Present Tense */}
                        <div className="mb-4">
                          <h5 className="font-bold mb-2">Present Tense</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {verb.present.map((conj, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 dark:bg-dark-100 p-2 rounded-md"
                              >
                                <span className="text-sm font-medium">
                                  {conj.pronoun}
                                </span>
                                <div className="flex justify-between mt-1">
                                  <span className="text-lg">{conj.arabic}</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {conj.transliteration}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {conj.translation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Imperative */}
                        <div className="mb-4">
                          <h5 className="font-bold mb-2">
                            Imperative - Telling someone to do the action
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {verb.imperative.map((conj, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 dark:bg-dark-100 p-2 rounded-md"
                              >
                                <span className="text-sm font-medium">
                                  {conj.pronoun}
                                </span>
                                <div className="flex justify-between mt-1">
                                  <span className="text-lg">{conj.arabic}</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {conj.transliteration}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {conj.translation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Example Sentences */}
                        <div>
                          <h5 className="font-bold mb-2">Examples</h5>
                          <div className="space-y-2">
                            {verb.examples.map((example, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 dark:bg-dark-100 p-2 rounded-md"
                              >
                                <div className="text-lg">{example.arabic}</div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  {example.transliteration}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  {example.translation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default WordBank;


