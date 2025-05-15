import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2, Trash2 } from 'lucide-react';
import FlashcardForm from './FlashcardForm';

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

interface SingleFlashcardViewProps {
  flashcard?: Flashcard | null;
  onClose?: () => void;
}

const SingleFlashcardView: React.FC<SingleFlashcardViewProps> = ({ flashcard: propFlashcard, onClose }) => {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(propFlashcard || null);
  const [deckName, setDeckName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!propFlashcard);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState<Partial<Flashcard> | null>(null);
  const [showCreateFlashcardModal, setShowCreateFlashcardModal] = useState(false);

  // Fetch card and deck data
  const fetchCardAndDeck = async () => {
    if (propFlashcard) return;

    setLoading(true);
    setError(null);

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

    if (cardData?.deck_id) {
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('name')
        .eq('id', cardData.deck_id)
        .single();

      if (deckError) {
        console.error('Error fetching deck name in SingleFlashcardView:', deckError);
      }
      setDeckName(deckData?.name || null);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!propFlashcard && deckId && cardId) fetchCardAndDeck();
  }, [propFlashcard, deckId, cardId]);

  useEffect(() => {
    setFlashcard(propFlashcard || null);
    setLoading(!propFlashcard);
  }, [propFlashcard]);

  const handlePlayAudio = (audioUrl: string) => {
    new Audio(audioUrl).play();
  };

  const handleEdit = () => {
    if (!flashcard) return;
    setEditData(flashcard);
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!flashcard) return;
    setShowDeleteConfirm(false);
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', flashcard.id);
    setLoading(false);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      if (onClose) {
        onClose();
      } else if (flashcard.deck_id) {
        navigate(`/flashcard/${flashcard.deck_id}`);
      }
    }
  };

  const handleCloseCreateFlashcardModal = () => {
    setShowCreateFlashcardModal(false);
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
          onClick={() => {
            navigate(`/flashcard/${deckId}`);
          }}
          className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
        >
          ← Back to {deckName}
        </button>
      )}

      <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative pt-12">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            className="text-emerald-600 dark:text-emerald-400 p-1 rounded-md"
            onClick={handleEdit}
            title="Edit Flashcard"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit2"><path d="M16.474 3.526a2.121 2.121 0 0 1 3 3L7.5 18.5l-4 1 1-4 10.974-10.974Z"></path></svg>
          </button>
          <button
            className="text-red-600 dark:text-red-400 p-1 rounded-md"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Flashcard"
          >
            <Trash2 size={18} />
          </button>
        </div>
        <div className={`${flashcard.image_url ? 'mt-12' : ''}`}>
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

      {/* Edit Flashcard Modal (using FlashcardForm) */}
      {showEditModal && flashcard && (
        <FlashcardForm
          deckId={flashcard.deck_id}
          flashcard={flashcard}
          onClose={() => setShowEditModal(false)}
          onSubmit={() => {
            setShowEditModal(false);
            fetchCardAndDeck();
          }}
        />
      )}

      {/* Create New Flashcard Modal (using FlashcardForm) - Keep this if creating from this view is needed */}
      {showCreateFlashcardModal && deckId && (
        <FlashcardForm
          deckId={deckId}
          onClose={handleCloseCreateFlashcardModal}
          onSubmit={handleCloseCreateFlashcardModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleFlashcardView;
