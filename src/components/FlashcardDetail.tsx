import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2 } from 'lucide-react'; // Added Volume2
import { useNavigate } from 'react-router-dom';

interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  deck_id: string; // Assuming cards table has deck_id
}

interface Deck {
  id: string;
  name: string;
  description: string;
  emoji?: string;
}

const FlashcardDetail: React.FC = () => {
  const { id: deckId } = useParams<{ id: string }>(); // Get deckId from URL
  const [deck, setDeck] = useState<Deck | null>(null); // State for deck details
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]); // State for flashcards
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeckAndFlashcards = async () => {
      setLoading(true);
      setError(null); // Clear previous errors

      // Fetch deck details
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (deckError) {
        setError(deckError.message);
        setLoading(false);
        return;
      }
      setDeck(deckData as Deck);

      // Fetch flashcards for the deck
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId);

      if (flashcardsError) {
        setError(flashcardsError.message);
      } else {
        setFlashcards(flashcardsData as Flashcard[]);
      }

      setLoading(false);
    };

    if (deckId) fetchDeckAndFlashcards();
  }, [deckId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 size={40} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!deck) {
    return (
      <div className="p-4 text-gray-900 dark:text-white">Deck not found.</div>
    );
  }

  return (
    <div className="p-4 text-gray-900 dark:text-white">
      <button
        onClick={() => navigate('/')} // Navigate back to the main decks list
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Flashcard Decks
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {deck.emoji} {deck.name}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        {deck.description}
      </p>

      {flashcards.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No flashcards in this deck yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flashcards.map((card) => (
            <div
              key={card.id}
              className="relative p-4 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => navigate(`/flashcard/${deckId}/${card.id}`)}
            >
              <div className="flex">
                {/* Display card image thumbnail if available */}
                {card.image_url ? (
                  <img
                    crossOrigin="anonymous" // Add crossOrigin for images from external sources
                    src={card.image_url}
                    alt="Thumbnail"
                    className="object-cover rounded-md h-16 w-16 flex-shrink-0"
                  />
                ) : (
                  <div className="flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md h-16 w-16">
                    <span className="text-gray-400 dark:text-gray-500 text-sm text-center">
                      No Image
                    </span>
                  </div>
                )}
                <div className="ml-4 flex flex-col justify-center flex-grow">
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {card.english}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {card.arabic}
                  </p>
                  {card.transliteration && (
                    <p className="text-sm italic text-gray-500 dark:text-gray-400 truncate">
                      {card.transliteration}
                    </p>
                  )}
                </div>
              </div>
              {/* Display tags if available */}
              {card.tags && card.tags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tags: {card.tags.join(', ')}
                  </p>
                </div>
              )}
              {/* Audio Play Button */}
              {card.audio_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    new Audio(card.audio_url!).play();
                  }}
                  className="absolute top-2 right-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full p-2 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                  aria-label="Play audio"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardDetail;
