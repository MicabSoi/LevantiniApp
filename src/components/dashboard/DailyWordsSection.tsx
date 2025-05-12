import React, { useState } from 'react';
import useDailyWords from '../../hooks/useDailyWords';
import { CheckCircle, PlusCircle } from 'lucide-react';

const DailyWordsSection: React.FC = () => {
  const {
    dailyWords,
    recentlyLearnedWordIds,
    numWordsSetting,
    isLoading,
    error,
    setNumWordsSetting,
    addWordToDeck,
    userDecks,
  } = useDailyWords();

  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  // Set default selected deck when userDecks are loaded
  React.useEffect(() => {
    if (userDecks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(userDecks[0].id);
    }
  }, [userDecks, selectedDeckId]);

  const handleDeckChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeckId(e.target.value);
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Daily Words</h2>

      <div className="mb-4 flex items-center">
        <label htmlFor="numWords" className="mr-2 text-gray-700 dark:text-gray-300">Number of words:</label>
        <select
          id="numWords"
          value={numWordsSetting}
          onChange={(e) => setNumWordsSetting(parseInt(e.target.value, 10))}
          className="border rounded p-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
        >
          {[1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-blue-600 dark:text-blue-400">Loading words...</p>}
      {error && <p className="text-red-600 dark:text-red-400">Error: {error}</p>}

      {!isLoading && !error && dailyWords.length > 0 && (
        <ul className="space-y-4">
          {dailyWords.map(word => (
            <li key={word.id} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700 flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-grow mb-2 md:mb-0">
                <p className="text-lg font-medium text-gray-900 dark:text-white">{word.levantine}</p>
                <p className="text-gray-600 dark:text-gray-300">{word.english}</p>
                {word.exampleSentence && (
                  <p className="text-sm italic text-gray-500 dark:text-gray-400">{word.exampleSentence}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {recentlyLearnedWordIds.has(word.id) && (
                  <span className="text-green-600 dark:text-green-400 flex items-center text-sm">
                    <CheckCircle size={16} className="mr-1" /> Recently Learned
                  </span>
                )}
                <select
                  value={selectedDeckId}
                  onChange={handleDeckChange}
                  className="border rounded p-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  disabled={userDecks.length === 0}
                >
                  {userDecks.length > 0 ? (
                    userDecks.map(deck => (
                      <option key={deck.id} value={deck.id}>{deck.name}</option>
                    ))
                  ) : (
                    <option value="">No decks available</option>
                  )}
                </select>
                <button
                  onClick={() => selectedDeckId && addWordToDeck(word.id, selectedDeckId)}
                  className="p-1 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                  disabled={!selectedDeckId}
                >
                  <PlusCircle size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !error && dailyWords.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">No daily words available.</p>
      )}
    </div>
  );
};

export default DailyWordsSection; 