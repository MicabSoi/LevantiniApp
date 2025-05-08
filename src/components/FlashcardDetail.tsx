import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2, Edit2, Trash2 } from 'lucide-react'; // Added Edit2 and Trash2
import { useNavigate } from 'react-router-dom';
import FlashcardForm from './FlashcardForm'; // Import FlashcardForm
import { Plus } from 'lucide-react'; // Import Plus icon

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

  // State for Flashcard Edit Modal
  const [showEditFlashcardModal, setShowEditFlashcardModal] = useState(false);
  const [flashcardToEdit, setFlashcardToEdit] = useState<Flashcard | null>(null);
  const [editedFlashcardData, setEditedFlashcardData] = useState<Partial<Flashcard> | null>(null);

  // State for Flashcard Delete Modal
  const [showDeleteFlashcardConfirm, setShowDeleteFlashcardConfirm] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<Flashcard | null>(null);

  // State for Create New Flashcard Modal
  const [showCreateFlashcardModal, setShowCreateFlashcardModal] = useState(false);

  // Fetch deck details and flashcards
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

  useEffect(() => {
    if (deckId) fetchDeckAndFlashcards();
  }, [deckId]);

  // Handler to open edit modal and set data
  const handleEditFlashcardClick = (card: Flashcard) => {
    setFlashcardToEdit(card);
    setEditedFlashcardData(card); // Initialize edited data with current card data
    setShowEditFlashcardModal(true);
  };

  // Handler to close edit modal
  const handleCloseEditFlashcardModal = () => {
    setShowEditFlashcardModal(false);
    setFlashcardToEdit(null);
    setEditedFlashcardData(null);
    setError(null); // Clear any errors
  };

  // Handler to update flashcard
  const handleUpdateFlashcard = async () => {
    if (!flashcardToEdit || !editedFlashcardData) return;
    setLoading(true); // Start loading for the update operation
    setError(null); // Clear previous errors

    try {
      const { error: updateError } = await supabase
        .from('cards')
        .update(editedFlashcardData)
        .eq('id', flashcardToEdit.id);

      if (updateError) throw updateError;

      // Update the flashcards state locally
      setFlashcards((prev) =>
        prev.map((card) =>
          card.id === flashcardToEdit.id ? { ...card, ...editedFlashcardData as Flashcard } : card
        )
      );

      handleCloseEditFlashcardModal(); // Close modal on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update flashcard');
      console.error('Error updating flashcard:', err);
    } finally {
      setLoading(false); // End loading
    }
  };

  // Handler to open delete confirmation modal
  const handleDeleteFlashcardClick = (card: Flashcard) => {
    setFlashcardToDelete(card);
    setShowDeleteFlashcardConfirm(true);
  };

  // Handler to close delete confirmation modal
  const handleCloseDeleteFlashcardConfirm = () => {
    setShowDeleteFlashcardConfirm(false);
    setFlashcardToDelete(null);
    setError(null); // Clear any errors
  };

  // Handler to delete flashcard
  const handleDeleteFlashcard = async () => {
    if (!flashcardToDelete) return;
    setLoading(true); // Start loading for the delete operation
    setError(null); // Clear previous errors

    try {
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', flashcardToDelete.id);

      if (deleteError) throw deleteError;

      // Remove the deleted flashcard from the state
      setFlashcards((prev) => prev.filter((card) => card.id !== flashcardToDelete.id));

      handleCloseDeleteFlashcardConfirm(); // Close modal on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flashcard');
      console.error('Error deleting flashcard:', err);
    } finally {
      setLoading(false); // End loading
    }
  };

  // Handler to open create flashcard modal
  const handleCreateFlashcardClick = () => {
    setShowCreateFlashcardModal(true);
  };

  // Handler to close create flashcard modal and refresh flashcards
  const handleCloseCreateFlashcardModal = () => {
    setShowCreateFlashcardModal(false);
    // Optional: Refresh flashcards after creating a new one
    if (deckId) {
      fetchDeckAndFlashcards();
    }
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

      {/* Button to add new flashcard */}
      {deckId && (
        <button
          onClick={handleCreateFlashcardClick}
          className="mb-4 w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center"
        >
          <Plus size={20} className="mr-2" />
          Add New Flashcard
        </button>
      )}

      {flashcards.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No flashcards in this deck yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flashcards.map((card) => (
            <div
              key={card.id}
              className="relative p-4 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              onClick={() => navigate(`/flashcard/${deckId}/${card.id}`)} // Keep navigation on card click
            >
              {/* Edit and Delete Buttons */}
              <div className="absolute top-2 right-2 flex space-x-2 z-10">
                 <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click navigation
                    handleEditFlashcardClick(card);
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                  title="Edit Flashcard"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click navigation
                    handleDeleteFlashcardClick(card);
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete Flashcard"
                >
                  <Trash2 size={16} />
                </button>
              </div>

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
                  className="absolute bottom-2 right-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full p-2 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                  aria-label="Play audio"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Flashcard Modal */}
      {showEditFlashcardModal && flashcardToEdit && editedFlashcardData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Edit Flashcard</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="editedEnglish" className="block text-sm font-medium text-gray-900 dark:text-gray-300">English</label>
                <input
                  type="text"
                  id="editedEnglish"
                  value={editedFlashcardData.english || ''}
                  onChange={(e) => setEditedFlashcardData({ ...editedFlashcardData, english: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
              <div>
                <label htmlFor="editedArabic" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Arabic</label>
                <input
                  type="text"
                  id="editedArabic"
                  value={editedFlashcardData.arabic || ''}
                  onChange={(e) => setEditedFlashcardData({ ...editedFlashcardData, arabic: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
              <div>
                <label htmlFor="editedTransliteration" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Transliteration (Optional)</label>
                <input
                  type="text"
                  id="editedTransliteration"
                  value={editedFlashcardData.transliteration || ''}
                  onChange={(e) => setEditedFlashcardData({ ...editedFlashcardData, transliteration: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
               <div>
                <label htmlFor="editedImage" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Image URL (Optional)</label>
                <input
                  type="text"
                  id="editedImage"
                  value={editedFlashcardData.image_url || ''}
                  onChange={(e) => setEditedFlashcardData({ ...editedFlashcardData, image_url: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
               <div>
                <label htmlFor="editedAudio" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Audio URL (Optional)</label>
                <input
                  type="text"
                  id="editedAudio"
                  value={editedFlashcardData.audio_url || ''}
                  onChange={(e) => setEditedFlashcardData({ ...editedFlashcardData, audio_url: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
              <div>
                <label htmlFor="editedTags" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Tags (comma-separated, Optional)</label>
                <input
                  type="text"
                  id="editedTags"
                  value={editedFlashcardData.tags ? editedFlashcardData.tags.join(', ') : ''}
                  onChange={(e) => setEditedFlashcardData({ ...editedFlashcardData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={handleCloseEditFlashcardModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleUpdateFlashcard}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Flashcard Confirmation Modal */}
      {showDeleteFlashcardConfirm && flashcardToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this flashcard?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={handleCloseDeleteFlashcardConfirm}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteFlashcard}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Flashcard Modal */}
      {showCreateFlashcardModal && deckId && (
        <FlashcardForm
          deckId={deckId}
          onClose={handleCloseCreateFlashcardModal}
          onSubmit={handleCloseCreateFlashcardModal} // Close modal on successful submit
        />
      )}

    </div>
  );
};

export default FlashcardDetail;
