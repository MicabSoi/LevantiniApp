import React, { useState } from 'react';
import { Search, Star, BookOpen } from 'lucide-react';
import { useLearnedWords } from '../context/LearnedWordsContext';

// Sample dictionary data
const dictionaryData = [
  {
    id: 1,
    word: 'مرحبا',
    transliteration: 'marhaba',
    definition: 'Hello',
    example: 'مرحبا، كيف حالك؟',
    exampleTranslation: 'Hello, how are you?',
  },
  {
    id: 2,
    word: 'شكرا',
    transliteration: 'shukran',
    definition: 'Thank you',
    example: 'شكرا جزيلا',
    exampleTranslation: 'Thank you very much',
  },
  {
    id: 3,
    word: 'بدي',
    transliteration: 'biddi',
    definition: 'I want',
    example: 'بدي روح عالبيت',
    exampleTranslation: 'I want to go home',
  },
  {
    id: 4,
    word: 'منيح',
    transliteration: 'mniih',
    definition: 'Good',
    example: 'هاد منيح كتير',
    exampleTranslation: 'This is very good',
  },
  {
    id: 5,
    word: 'يلا',
    transliteration: 'yalla',
    definition: "Let's go/Come on",
    example: 'يلا نروح',
    exampleTranslation: "Let's go",
  },
];

interface DictionaryProps {
  setActiveTab: (tab: string) => void;
  setWordBankSubTab: (tab: string) => void;
}

const Dictionary: React.FC<DictionaryProps> = ({
  setActiveTab,
  setWordBankSubTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const { addLearnedWord } = useLearnedWords();

  const filteredWords = dictionaryData.filter(
    (item) =>
      item.word.includes(searchTerm) ||
      item.transliteration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const markAsLearned = (word: (typeof dictionaryData)[0]) => {
    addLearnedWord(word);
  };

  return (
    <div className="p-4">
      <button
        onClick={() => {
          setActiveTab('wordbank');
          setWordBankSubTab('add words');
        }}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Vocabulary
      </button>

      <h2 className="text-xl font-bold mb-4">Travel Dictionary</h2>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-md leading-5 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          placeholder="Search words in Arabic, English or transliteration"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Dictionary List */}
      <div className="space-y-4">
        {filteredWords.length > 0 ? (
          filteredWords.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 dark:border-dark-100 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-dark-100 dark:bg-dark-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{item.word}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {item.transliteration}
                  </p>
                  <p className="mb-2">{item.definition}</p>
                  <div className="bg-gray-50 dark:bg-dark-100 p-2 rounded-md">
                    <p className="text-sm font-medium">{item.example}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.exampleTranslation}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="p-1"
                  >
                    <Star
                      size={20}
                      className={
                        favorites.includes(item.id)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                  <button
                    onClick={() => markAsLearned(item)}
                    className="p-1 text-emerald-600 hover:text-emerald-800"
                    title="Mark as learned"
                  >
                    <BookOpen size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">
            No words found. Try a different search term.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dictionary;


