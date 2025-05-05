import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
}

const FlashcardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFlashcard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setFlashcard(data as Flashcard);
      }
      setLoading(false);
    };

    if (id) fetchFlashcard();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 size={40} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!flashcard) {
    return (
      <div className="p-4 text-gray-900 dark:text-white">
        Flashcard not found.
      </div>
    );
  }

  return (
    <div className="p-4 text-gray-900 dark:text-white">
      <button
        onClick={() => navigate('/')} // or navigate('/flashcards') if your decks page is at a different route
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Deck
      </button>

      <div className="max-w-2xl mx-auto bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{flashcard.english}</h1>

          {flashcard.image_url && (
            <div className="mb-6">
              <img
                crossOrigin="anonymous"
                src={flashcard.image_url}
                alt="Flashcard"
                className="w-full rounded-lg"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-lg">
              <h2 className="font-bold text-lg mb-2">Arabic</h2>
              <p className="text-2xl">{flashcard.arabic}</p>
            </div>

            {flashcard.transliteration && (
              <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-lg">
                <h2 className="font-bold text-lg mb-2">Transliteration</h2>
                <p className="text-lg">{flashcard.transliteration}</p>
              </div>
            )}

            {flashcard.audio_url && (
              <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-lg">
                <h2 className="font-bold text-lg mb-2">Pronunciation</h2>
                <audio controls className="w-full">
                  <source src={flashcard.audio_url} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {flashcard.tags && flashcard.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {flashcard.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardDetail;


