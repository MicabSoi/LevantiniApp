import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

const StudySelection: React.FC = () => {
  const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());
  const [cardCount, setCardCount] = useState<number>(10);
  const navigate = useNavigate();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Study Session Setup
        </h2>
        <button
          className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          onClick={() => setIsSettingsModalOpen(true)}
          aria-label="Settings"
        >
          <Settings size={22} />
        </button>
      </div>

      <div className="mb-4">
        <label className="font-medium mb-2 block text-gray-700 dark:text-gray-300">
          Select Decks:
        </label>
        <div className="grid grid-cols-2 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              onClick={() => toggleDeck(deck.id)}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedDecks.has(deck.id) ? "bg-emerald-100 dark:bg-emerald-800 border-emerald-500 dark:border-emerald-400" : "bg-white dark:bg-dark-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-200"}`}
            >
              <span className={`font-medium ${selectedDecks.has(deck.id) ? "text-emerald-800 dark:text-emerald-100" : "text-gray-900 dark:text-gray-100"}`}>
                {deck.name}
              </span>
            </div>
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
          className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-100 text-gray-800 dark:text-gray-200 outline-none focus:border-black dark:focus:border-white focus:ring-0"
        />
      </div>

      <button
        onClick={startStudy}
        disabled={selectedDecks.size === 0}
        className="w-full p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        Start
      </button>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsSave={() => {}}
      />
    </div>
  );
};

export default StudySelection;
