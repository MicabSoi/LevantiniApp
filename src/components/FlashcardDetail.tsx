import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2, Edit2, Trash2, XCircle, CheckCircle2, Plus, ArrowUpDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import FlashcardForm from './FlashcardForm';
import SingleFlashcardView from './SingleFlashcardView';

interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  deck_id?: string;
  default_deck_id?: string;
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
  const { id: deckId } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reviewCounts, setReviewCounts] = useState<{ [cardId: string]: number }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const deckType = (location.state as { deckType?: 'user' | 'default' })?.deckType || 'user';

  // State for Flashcard Edit Modal (now using FlashcardForm)
  const [flashcardToEdit, setFlashcardToEdit] = useState<Flashcard | null>(null);

  // State for Flashcard Delete Modal
  const [showDeleteFlashcardConfirm, setShowDeleteFlashcardConfirm] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<Flashcard | null>(null);

  // State for Create New Flashcard Modal
  const [showCreateFlashcardModal, setShowCreateFlashcardModal] = useState(false);

  // State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // State for sorting (default to sorting by English alphabetically)
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: 'english', direction: 'asc' });

  // State for Flashcard Modal (for viewing)
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);

  // Fetch deck details and flashcards
  const fetchDeckAndFlashcards = async () => {
    setLoading(true);
    setError(null);

    let deckData = null;
    let deckError = null;
    let flashcardsData = null;
    let flashcardsError = null;

    if (deckType === 'user') {
      const { data: userDeckData, error: userDeckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();
      deckData = userDeckData;
      deckError = userDeckError;

      if (!deckError) {
        const { data: userFlashcardsData, error: userFlashcardsError } = await supabase
          .from('cards')
          .select('*')
          .eq('deck_id', deckId);
        flashcardsData = userFlashcardsData;
        flashcardsError = userFlashcardsError;
      }

    } else {
      const { data: defaultDeckData, error: defaultDeckError } = await supabase
        .from('default_decks')
        .select('*')
        .eq('id', deckId)
        .single();
      deckData = defaultDeckData;
      deckError = defaultDeckError;

      if (!deckError) {
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

    if (deckType === 'user') {
      const cardIds = (flashcardsData as Flashcard[]).map(card => card.id);
      if (cardIds.length > 0) {
        const { data: reviewData, error: reviewError } = await supabase
          .from('reviews')
          .select('card_id, reviews_count')
          .in('card_id', cardIds);
        if (!reviewError && reviewData) {
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
    return () => {
      // Cleanup if needed
    };
  }, [deckId, deckType]);

  const filteredFlashcards = flashcards.filter(card =>
    card.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.transliteration && card.transliteration.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
            valA = a.arabic;
            valB = b.arabic;
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

  // Handler to open edit modal (now using FlashcardForm)
  const handleEditFlashcardClick = (card: Flashcard) => {
    if (deckType !== 'user') return;
    setFlashcardToEdit(card);
  };

  // Handler to close edit modal (now using FlashcardForm)
  const handleCloseEditFlashcardModal = () => {
    setFlashcardToEdit(null);
    setError(null);
    // Refresh flashcards after edit
    if (deckType === 'user' && deckId) {
      fetchDeckAndFlashcards();
    }
  };

  // Handler to open delete confirmation modal
  const handleDeleteFlashcardClick = (card: Flashcard) => {
    if (deckType !== 'user') return;
    setFlashcardToDelete(card);
    setShowDeleteFlashcardConfirm(true);
  };

  // Handler to close delete confirmation modal
  const handleCloseDeleteFlashcardConfirm = () => {
    setShowDeleteFlashcardConfirm(false);
    setFlashcardToDelete(null);
    setError(null);
  };

  // Handler to delete flashcard
  const handleDeleteFlashcard = async () => {
    if (!flashcardToDelete) return;
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', flashcardToDelete.id);

      if (deleteError) throw deleteError;

      setFlashcards((prev) => prev.filter((card) => card.id !== flashcardToDelete.id));

      handleCloseDeleteFlashcardConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flashcard');
      console.error('Error deleting flashcard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler to open create flashcard modal
  const handleCreateFlashcardClick = () => {
    setShowCreateFlashcardModal(true);
  };

  // Handler to close create flashcard modal and refresh flashcards
  const handleCloseCreateFlashcardModal = () => {
    setShowCreateFlashcardModal(false);
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
      <button
          onClick={() => {
            navigate('/wordbank');
          }}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center mb-4"
      >
          ← Back to Flashcard Decks
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
          {deck.emoji} {deck.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {deck.description}
        </p>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search flashcards..."
          className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700 pr-10"
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

      {filteredFlashcards.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-2 py-2 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 mb-2 text-sm">
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
          <button onClick={() => requestSort('reviewCount')} className="col-span-2 text-center flex items-center justify-center hover:text-emerald-600 dark:hover:text-emerald-400 py-1 md:py-0">
            Review count
            {sortConfig.key === 'reviewCount' && <ArrowUpDown size={14} className={`ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} />}
          </button>
          <button onClick={() => requestSort('createdAt')} className="col-span-3 text-center md:text-right flex items-center justify-center md:justify-end hover:text-emerald-600 dark:hover:text-emerald-400 py-1 md:py-0">
            Date created
            {sortConfig.key === 'createdAt' && <ArrowUpDown size={14} className={`ml-1 ${sortConfig.direction === 'desc' ? 'transform rotate-180' : ''}`} />}
          </button>
          <div className="col-span-2 text-center flex items-center justify-center py-1 md:py-0">Media</div>
        </div>
      )}

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
              <div className="col-span-5 flex flex-col items-start md:flex-row md:items-baseline md:space-x-3">
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-left md:w-1/2 break-words">{card.english}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300 text-left md:w-1/4 md:text-center break-words">{card.arabic}</span>
                {card.transliteration && (
                  <span className="text-xs italic text-gray-500 dark:text-gray-400 text-left md:w-1/4 md:text-right break-words">{card.transliteration}</span>
                )}
              </div>
              <div className="col-span-2 text-center">
                {deckType === 'user' && typeof reviewCounts[card.id] !== 'undefined' && reviewCounts[card.id] > 0 ? (
                  <span className="text-gray-700 dark:text-white">{reviewCounts[card.id]}</span>
                ) : '-'}
              </div>
              <div className="col-span-3 text-sm text-gray-500 dark:text-gray-400 text-center md:text-right">
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
              <div className="col-span-2 flex items-center justify-center">
                {(card.image_url || card.audio_url) ? (
                  <CheckCircle2 className="text-emerald-500" size={22} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Use FlashcardForm for editing */}
      {flashcardToEdit && deckId && (
        <FlashcardForm
          deckId={deckId}
          flashcard={flashcardToEdit}
          onClose={handleCloseEditFlashcardModal}
          onSubmit={handleCloseEditFlashcardModal} // Close modal and refresh on successful submit
        />
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
          onSubmit={handleCloseCreateFlashcardModal}
        />
      )}

      {/* Flashcard Modal (for viewing) */}
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
