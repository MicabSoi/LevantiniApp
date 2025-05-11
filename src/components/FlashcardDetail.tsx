import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2, Edit2, Trash2, XCircle, CheckCircle2 } from 'lucide-react'; // Added Edit2, Trash2, and XCircle
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
  metadata?: {
    createdAt: string;
  };
}

interface Deck {
  id: string;
  name: string;
  description: string;
  emoji?: string;
}

interface FlashcardDetailProps {
  // Removed setLastViewedDeckId prop
}

const FlashcardDetail: React.FC<FlashcardDetailProps> = () => {
  const { id: deckId } = useParams<{ id: string }>(); // Get deckId from URL
  const [deck, setDeck] = useState<Deck | null>(null); // State for deck details
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]); // State for flashcards
  const [reviewCounts, setReviewCounts] = useState<{ [cardId: string]: number }>({});
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

  // ADDED: State for search term
  const [searchTerm, setSearchTerm] = useState('');

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
      setLoading(false);
      return;
    }
    setFlashcards(flashcardsData as Flashcard[]);

    // Fetch review counts for all cards in this deck
    const cardIds = (flashcardsData as Flashcard[]).map(card => card.id);
    if (cardIds.length > 0) {
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('card_id, reviews_count')
        .in('card_id', cardIds);
      if (!reviewError && reviewData) {
        // Map card_id to reviews_count (if multiple reviews per card, take the max)
        const counts: { [cardId: string]: number } = {};
        reviewData.forEach((row: { card_id: string, reviews_count: number }) => {
          if (!counts[row.card_id] || row.reviews_count > counts[row.card_id]) {
            counts[row.card_id] = row.reviews_count;
          }
        });
        setReviewCounts(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (deckId) {
      fetchDeckAndFlashcards();
    }
    // Cleanup function to clear the last viewed deck ID when leaving this component
    return () => {
      // This might not be needed if we only want to set it when entering.
      // If we want to clear when leaving *this specific deck view* to go somewhere else *within* the vocab tab (e.g. a flashcard), that's more complex.
      // For now, let's only set when entering this route.
      // setLastViewedDeckId(null);
    };
  }, [deckId]); // Removed setLastViewedDeckId from dependencies

  // ADDED: Filter flashcards based on search term
  const filteredFlashcards = flashcards.filter(card =>
    card.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.transliteration && card.transliteration.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

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
        onClick={() => {
          navigate('/'); // Navigate back to the main decks list
        }}
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

      {/* Search Bar for Flashcards with Clear Button */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search flashcards..."
          className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700 pr-10" // Added pr-10 for padding
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <XCircle className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
      {/* END Search Bar for Flashcards with Clear Button */}

      {/* Button to add new flashcard */}
      {deckId && (
        <button
          onClick={handleCreateFlashcardClick}
          className="mb-4 w-full p-5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center"
        >
          <Plus size={24} className="mr-2" />
          Add New Flashcard
        </button>
      )}

      {/* Header Row for Flashcards */}
      {filteredFlashcards.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-2 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 mb-2 text-sm">
          <div className="col-span-5">Word</div>
          <div className="col-span-2 text-center">Review count</div>
          <div className="col-span-3 text-right">Date created</div>
          <div className="col-span-2 text-center">Media</div>
        </div>
      )}

      {/* Display list of flashcards */}
      {filteredFlashcards.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No flashcards in this deck yet.
        </div>
      ) : (
        <div className="flex flex-col h-[60vh] overflow-y-auto mt-4">
          {filteredFlashcards.map((card) => (
            <div
              key={card.id}
              className="grid grid-cols-12 items-center px-2 py-3 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer mb-2"
              onClick={() => navigate(`/flashcard/${deckId}/${card.id}`)}
            >
              {/* Word (col-span-5) */}
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{card.english}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{card.arabic}</span>
                {card.transliteration && (
                  <span className="text-xs italic text-gray-500 dark:text-gray-400 truncate">{card.transliteration}</span>
                )}
              </div>
              {/* Review count (col-span-2) */}
              <div className="col-span-2 text-center">
                {reviewCounts[card.id] !== undefined ? reviewCounts[card.id] : '-'}
              </div>
              {/* Date created (col-span-3, right-aligned) */}
              <div className="col-span-3 text-right text-sm text-gray-500 dark:text-gray-400">
                {card.metadata?.createdAt ? (() => {
                  const date = new Date(card.metadata.createdAt);
                  const day = String(date.getDate()).padStart(2, '0');
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const month = monthNames[date.getMonth()];
                  const year = String(date.getFullYear()).slice(-2);
                  return `${day}-${month}-${year}`;
                })() : ''}
              </div>
              {/* Media (col-span-2, far right) */}
              <div className="col-span-2 flex items-center justify-center">
                {(card.image_url || card.audio_url) ? (
                  <CheckCircle2 className="text-emerald-500" size={22} />
                ) : null}
              </div>
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
                {/* TODO: Add 'Upload File' and 'Take Photo' options here */}
                {/* Example: */}
                {/* <input type="file" accept="image/*" onChange={handleImageFileUpload} /> */}
                {/* <button onClick={handleTakePhoto}>Take Photo</button> */}
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
                {/* TODO: Add 'Upload File' and 'Record Audio' options here */}
                {/* Example: */}
                {/* <input type="file" accept="audio/*" onChange={handleAudioFileUpload} /> */}
                {/* <button onClick={handleRecordAudio}>Record Audio</button> */}
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
