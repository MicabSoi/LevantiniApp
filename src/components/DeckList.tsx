// src/components/DeckList.tsx
import React from 'react';
import { useDecks } from '../hooks/useDecks';
import { useSupabase } from '../context/SupabaseContext';
import { Loader2, Plus, Archive, Edit2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Make sure useNavigate is imported

interface DeckListProps {
  onSelectDeck: (deckId: string) => void;
  onCreateDeck: () => void;
}

const DeckList: React.FC<DeckListProps> = ({ onSelectDeck, onCreateDeck }) => {
  const { user } = useSupabase();
  const { decks, loading, error, archiveDeck } = useDecks(user);
  const navigate = useNavigate(); // Initialize the navigate function

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Added "Start Study Session" button */}
      <button
        onClick={() => navigate('/study')} // Navigate to the StudySelection route
        className="w-full p-4 mb-4 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center justify-center"
      >
        <BookOpen size={20} className="mr-2" />
        Start Study Session
      </button>

      <button
        onClick={onCreateDeck}
        className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center"
      >
        <Plus size={20} className="mr-2" />
        Create New Deck
      </button>

      {decks.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No decks yet. Create your first deck to get started!
        </div>
      ) : (
        <div className="grid gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-white dark:bg-dark-200 p-4 rounded-lg border border-gray-200 dark:border-dark-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* This div handles click to view the single deck */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectDeck(deck.id)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{deck.emoji}</span>
                    <h3 className="font-bold">{deck.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {deck.description}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {/* Study Deck Button (for single deck view) - Re-purpose or keep as is */}
                  {/* Currently, this navigates to view cards, not start a study session */}
                  <button
                    onClick={() => onSelectDeck(deck.id)}
                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="View Deck"
                  >
                    <BookOpen size={18} />
                  </button>
                  <button
                    onClick={() => {
                      /* Implement edit */
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-100 rounded-lg transition-colors"
                    title="Edit Deck"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm('Are you sure you want to archive this deck?')
                      ) {
                        archiveDeck(deck.id);
                      }
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-100 rounded-lg transition-colors"
                    title="Archive Deck"
                  >
                    <Archive size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckList;
