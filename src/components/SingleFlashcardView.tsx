import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2 } from 'lucide-react';

interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  deck_id: string;
}

interface Deck {
  id: string;
  name: string;
}

const SingleFlashcardView: React.FC = () => {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [deckName, setDeckName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCardAndDeck = async () => {
      setLoading(true);
      setError(null);

      // Fetch flashcard details
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (cardError) {
        setError(cardError.message);
        setLoading(false);
        return;
      }
      setFlashcard(cardData as Flashcard);

      // Fetch deck details
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('name')
        .eq('id', deckId)
        .single();

      if (deckError) {
        setError(deckError.message);
        setLoading(false);
        return;
      }
      setDeckName(deckData.name);

      setLoading(false);
    };

    if (deckId && cardId) fetchCardAndDeck();
  }, [deckId, cardId]);

  const handlePlayAudio = (audioUrl: string) => {
    new Audio(audioUrl).play();
  };

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

  if (!flashcard) {
    return (
      <div className="p-4 text-gray-900 dark:text-white">Flashcard not found.</div>
    );
  }

  return (
    <div className="p-4 text-gray-900 dark:text-white">
      {deckName && (
        <button
          onClick={() => navigate(`/flashcard/${deckId}`)}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
        >
          ← Back to {deckName}
        </button>
      )}

      <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {flashcard.image_url && (
          <img
            crossOrigin="anonymous"
            src={flashcard.image_url}
            alt="Flashcard image"
            className="object-cover rounded-md mb-4 w-full h-64"
          />
        )}
        <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
          {flashcard.english}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          {flashcard.arabic}
        </p>
        {flashcard.transliteration && (
          <p className="text-lg italic text-gray-500 dark:text-gray-400 mb-4">
            {flashcard.transliteration}
          </p>
        )}
        {flashcard.tags && flashcard.tags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tags: {flashcard.tags.join(', ')}
            </p>
          </div>
        )}
        {flashcard.audio_url && (
          <button
            onClick={() => handlePlayAudio(flashcard.audio_url!)}
            className="mt-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full p-3 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors flex items-center justify-center"
            aria-label="Play audio"
          >
            <Volume2 size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SingleFlashcardView;
