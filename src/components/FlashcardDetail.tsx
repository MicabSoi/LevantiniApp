import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2, Edit2, Trash2, XCircle, CheckCircle2, Plus, ArrowUpDown } from 'lucide-react'; // Added Edit2, Trash2, and XCircle
import { useNavigate, useLocation } from 'react-router-dom';
import FlashcardForm from './FlashcardForm'; // Import FlashcardForm
import SingleFlashcardView from './SingleFlashcardView'; // Import SingleFlashcardView

interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  deck_id?: string; // Make deck_id optional
  default_deck_id?: string; // Add default_deck_id
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
  const location = useLocation(); // Get location object to access state
  const deckType = (location.state as { deckType?: 'user' | 'default' })?.deckType || 'user'; // Get deckType from state, default to 'user'

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

  // State for sorting (default to sorting by English alphabetically)
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: 'english', direction: 'asc' });

  // State for Flashcard Modal
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);

  // Fetch deck details and flashcards
  const fetchDeckAndFlashcards = async () => {
    setLoading(true);
    setError(null); // Clear previous errors

    let deckData = null;
    let deckError = null;
    let flashcardsData = null;
    let flashcardsError = null;

    if (deckType === 'user') {
      // Fetch user deck details
      const { data: userDeckData, error: userDeckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();
      deckData = userDeckData;
      deckError = userDeckError;

      if (!deckError) {
        // Fetch user flashcards for the deck
        const { data: userFlashcardsData, error: userFlashcardsError } = await supabase
          .from('cards')
          .select('*')
          .eq('deck_id', deckId);
        flashcardsData = userFlashcardsData;
        flashcardsError = userFlashcardsError;
      }

    } else { // deckType === 'default'
      // Fetch default deck details
      const { data: defaultDeckData, error: defaultDeckError } = await supabase
        .from('default_decks')
        .select('*')
        .eq('id', deckId)
        .single();
      deckData = defaultDeckData;
      deckError = defaultDeckError;

      if (!deckError) {
        // Fetch default flashcards for the deck
        const { data: defaultFlashcardsData, error: defaultFlashcardsError } = await supabase
          .from('default_flashcards')
          .select('*')
          .eq('default_deck_id', deckId);
        flashcardsData = defaultFlashcardsData;
        flashcardsError = defaultFlashcardsError;
      }
    }

    if (deckError) {
      setError(deckError.message);
      setLoading(false);
      return;
    }
    setDeck(deckData as Deck);

    if (flashcardsError) {
      setError(flashcardsError.message);
      setLoading(false);
      return;
    }
    setFlashcards(flashcardsData as Flashcard[]);

    // Fetch review counts for all cards in this deck - only for user decks
    if (deckType === 'user') {
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
  }, [deckId, deckType]); // Add deckType to dependencies

  // ADDED: Filter flashcards based on search term
  const filteredFlashcards = flashcards.filter(card =>
    card.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.transliteration && card.transliteration.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Function to handle sort request
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    // If clicking the same column that is already desc, reset sort (or cycle back to asc)
    // For now, let's cycle: asc -> desc -> asc
    // if (sortConfig.key === key && sortConfig.direction === 'desc') {
    //   setSortConfig({ key: null, direction: 'asc' });
    //   return;
    // }
    setSortConfig({ key, direction });
  };

  // Memoized and sorted flashcards
  const sortedFlashcards = React.useMemo(() => {
    let sortableItems = [...filteredFlashcards];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = null;
        let valB: any = null;

        switch (sortConfig.key) {
          case 'english':
            valA = a.english.toLowerCase();
            valB = b.english.toLowerCase();
            break;
          case 'arabic':
            // For Arabic, use localeCompare for proper sorting
            valA = a.arabic;
            valB = b.arabic;
            // localeCompare directly returns -1, 0, or 1
            if (valA.localeCompare(valB, 'ar') < 0) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA.localeCompare(valB, 'ar') > 0) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          case 'transliteration':
            valA = (a.transliteration || '').toLowerCase();
            valB = (b.transliteration || '').toLowerCase();
            break;
          case 'reviewCount':
            valA = reviewCounts[a.id] || 0;
            valB = reviewCounts[b.id] || 0;
            break;
          case 'createdAt':
            valA = new Date(a.metadata?.createdAt || 0).getTime();
            valB = new Date(b.metadata?.createdAt || 0).getTime();
            break;
          default:
            return 0;
        }

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredFlashcards, sortConfig, reviewCounts]);

  // Handler to open edit modal and set data
  const handleEditFlashcardClick = (card: Flashcard) => {
    // Only allow editing for user decks
    if (deckType !== 'user') return;
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
    // Only allow deleting for user decks
    if (deckType !== 'user') return;
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
    // Only refetch if it's a user deck, as default cards are static
    if (deckType === 'user' && deckId) {
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
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Back button moved above title/description */}
      <button
          onClick={() => {
            navigate('/wordbank'); // Or the correct route for Vocabulary landing
          }}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center mb-4" // Added mb-4
      >
          ← Back to Flashcard Decks
      </button>

      {/* Deck title and description moved below back button */}
      <div className="mb-8"> {/* Wrap title and description */}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
          {deck.emoji} {deck.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {deck.description}
        </p>
      </div>

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
      {deckType === 'user' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleCreateFlashcardClick}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Flashcard
          </button>
        </div>
      )}

      {/* Header Row for Flashcards - Adjusted dark mode text color */}
      {filteredFlashcards.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-2 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 mb-2 text-sm">
          {/* Word Column Header - Align stack to left, and button content to left on small screens */}
          <div className="col-span-5 flex flex-col items-start md:flex-row md:items-baseline md:space-x-3">
            <button onClick={() => requestSort('english')} className="w-full md:w-1/2 text-left flex items-center justify-start hover:text-emerald-600 dark:hover:text-emerald-400 py-1 md:py-0">
              English
              {sortConfig.key === 'english' && <ArrowUpDown size={14} className={`ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} />}
            </button>
            <button onClick={() => requestSort('arabic')} className="w-full md:w-1/4 text-left md:text-center flex items-center justify-start md:justify-center hover:text-emerald-600 dark:hover:text-emerald-400 py-1 md:py-0">
              Arabic
              {sortConfig.key === 'arabic' && <ArrowUpDown size={14} className={`ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} />}
            </button>
            <button onClick={() => requestSort('transliteration')} className="w-full md:w-1/4 text-left md:text-right flex items-center justify-start md:justify-end hover:text-emerald-600 dark:hover:text-emerald-400 py-1 md:py-0">
              Transliteration
              {sortConfig.key === 'transliteration' && <ArrowUpDown size={14} className={`ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} />}
            </button>
          </div>
          {/* Review count button - already centered */}
          <button onClick={() => requestSort('reviewCount')} className="col-span-2 text-center flex items-center justify-center hover:text-emerald-600 dark:hover:text-emerald-400 py-1 md:py-0">
            Review count
            {sortConfig.key === 'reviewCount' && <ArrowUpDown size={14} className={`ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} />}
          </button>
          {/* Date created button - Added text-center, justify-center for small screens. md: classes override. */}
          <button onClick={() => requestSort('createdAt')} className="col-span-3 text-center md:text-right flex items-center justify-center md:justify-end hover:text-emerald-600 dark:hover:text-emerald-400 py-1 md:py-0">
            Date created
            {sortConfig.key === 'createdAt' && <ArrowUpDown size={14} className={`ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} />}
          </button>
          {/* Media div - already centered */}
          <div className="col-span-2 text-center flex items-center justify-center py-1 md:py-0">Media</div>
        </div>
      )}

      {/* Display list of flashcards */}
      {filteredFlashcards.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No flashcards in this deck yet.
        </div>
      ) : (
        <div className="flex flex-col h-[60vh] overflow-y-auto mt-4">
          {sortedFlashcards.map((card) => (
            <div
              key={card.id}
              className="grid grid-cols-12 items-center px-2 py-3 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer mb-2"
              onClick={() => {
                setSelectedFlashcard(card);
                setShowFlashcardModal(true);
              }}
            >
              {/* Word (col-span-5) - Ensure items-start for small screens, and text-left for spans. Adjusted md widths and added break-words. */}
              <div className="col-span-5 flex flex-col items-start md:flex-row md:items-baseline md:space-x-3">
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-left md:w-1/2 break-words">{card.english}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300 text-left md:w-1/4 md:text-center break-words">{card.arabic}</span>
                {card.transliteration && (
                  <span className="text-xs italic text-gray-500 dark:text-gray-400 text-left md:w-1/4 md:text-right break-words">{card.transliteration}</span>
                )}
              </div>
              {/* Review count (col-span-2) - Adjusted text and dark mode color */}
              <div className="col-span-2 text-center">
                {deckType === 'user' && typeof reviewCounts[card.id] !== 'undefined' && reviewCounts[card.id] > 0 ? (
                  <span className="text-gray-700 dark:text-white">{reviewCounts[card.id]}</span> /* Removed ' time(s)' and changed dark:text-emerald-200 to dark:text-white */
                ) : '-'}
              </div>
              {/* Date created (col-span-3, right-aligned) - Centered on small screens */}
              <div className="col-span-3 text-sm text-gray-500 dark:text-gray-400 text-center md:text-right"> {/* text-center for small screens, md:text-right for md+ */}
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseEditFlashcardModal();
            }
          }}
        >
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseDeleteFlashcardConfirm();
            }
          }}
        >
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

      {/* Flashcard Modal */}
      {showFlashcardModal && selectedFlashcard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFlashcardModal(false);
              setSelectedFlashcard(null);
            }
          }}
        >
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => {
                setShowFlashcardModal(false);
                setSelectedFlashcard(null);
              }}
            >
              <XCircle size={24} />
            </button>
            {/* Only pass flashcards with a defined deck_id or default_deck_id */}
            <SingleFlashcardView
              flashcard={{
                ...selectedFlashcard,
                deck_id: selectedFlashcard.deck_id ?? selectedFlashcard.default_deck_id ?? '',
              }}
              onClose={() => {
                setShowFlashcardModal(false);
                setSelectedFlashcard(null);
                fetchDeckAndFlashcards();
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default FlashcardDetail;
