import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const StudySelection: React.FC = () => {
  const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());
  const [cardCount, setCardCount] = useState<number>(10);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDecks() {
      const { data, error } = await supabase
        .from('decks')
        .select('id, name')
        .eq('archived', false)
        .order('created_at', { ascending: true });
      if (error) console.error(error);
      else setDecks(data as any);
    }
    fetchDecks();
  }, []);

  const toggleDeck = (id: string) => {
    const next = new Set(selectedDecks);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedDecks(next);
  };

  const startStudy = () => {
    const params = new URLSearchParams();
    params.set('decks', Array.from(selectedDecks).join(','));
    params.set('count', String(cardCount));
    navigate(`/study/run?${params.toString()}`);
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white dark:bg-dark-200">
      <button
        onClick={() => navigate('/flashcards')}
        className="mb-4 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Flashcard Decks
      </button>
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Study Session Setup
      </h2>
      <div className="mb-4">
        <label className="font-medium mb-2 block text-gray-700 dark:text-gray-300">
          Select Decks:
        </label>
        <div className="space-y-2">
          {decks.map((deck) => (
            <label key={deck.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedDecks.has(deck.id)}
                onChange={() => toggleDeck(deck.id)}
                className="form-checkbox text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-gray-900 dark:text-gray-100">
                {deck.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="font-medium mb-2 block text-gray-700 dark:text-gray-300">
          Number of Cards:
        </label>
        <input
          type="number"
          min={1}
          value={cardCount}
          onChange={(e) => setCardCount(Number(e.target.value))}
          className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-100 text-gray-800 dark:text-gray-200"
        />
      </div>

      <button
        onClick={startStudy}
        disabled={selectedDecks.size === 0}
        className="w-full p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        Start
      </button>
    </div>
  );
};

export default StudySelection;
