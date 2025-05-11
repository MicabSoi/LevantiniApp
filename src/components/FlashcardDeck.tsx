// src/components/FlashcardDeck.tsx
import React, { useState, useEffect } from 'react';
// ADDED Loader2 here 👇
import {
  BookOpen,
  Bookmark,
  GraduationCap,
  Plus,
  Volume2,
  Loader2,
  Edit2,
  Trash2,
  XCircle,
  LibraryBig,
  CalendarDays,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import FlashcardForm from './FlashcardForm';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { CreateDeckModal } from './CreateDeckModal'; // Import CreateDeckModal as a named import

// Define types for flashcards and decks
interface Flashcard {
  id: string;
  deck_id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  // Add other fields from the 'cards' table if needed for display
  type?: string;
  layout?: any; // Use a more specific type if possible
  metadata?: any; // Use a more specific type if possible
  review_stats_id?: string; // Assuming this is a string UUID
  fields?: { // Add fields property based on the nested structure in reviews
    english: string;
    arabic: string;
    transliteration?: string;
    clozeText?: string;
    imageUrl?: string;
  };
}

interface Deck {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  is_default: boolean;
  archived: boolean;
  created_at: string;
  cards?: { count: number }[];
}

// Define type for cards fetched from the 'reviews' table
interface DueCard {
  id: string; // review id
  card: Flashcard; // Nested card object
  last_review_date: string;
  next_review_date: string;
  interval: number;
  ease_factor: number;
  repetition_count: number;
  reviews_count: number;
  quality_history: number[];
  streak?: number;
  avg_response_time?: number;
}

// Icons based on deck type
const getDeckIcon = (deckId: string) => {
  // Note: This mapping uses deck IDs which might not be stable or meaningful
  // for custom decks. Consider using a 'type' field in the deck table
  // if you want distinct icons for 'verbs', 'nouns', etc.
  if (deckId === 'verbs') {
    // Assuming 'verbs' might be a potential default deck ID or type
    return <BookOpen className="w-6 h-6 text-emerald-600" />;
  } else if (deckId === 'nouns') {
    // Assuming 'nouns' might be a potential default deck ID or type
    return <Bookmark className="w-6 h-6 text-emerald-600" />;
  } else if (deckId === 'learned') {
    // Assuming 'learned' might be a potential default deck ID or type
    return <GraduationCap className="w-6 h-6 text-emerald-600" />;
  } else {
    // Default icon for user-created decks or unknown types
    return <BookOpen className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
  }
};

interface FlashcardDeckProps {
  setActiveTab: (tab: string) => void;
  setWordBankSubTab: (tab: string) => void;
  selectedDeckId?: string | null;
  setSelectedDeckId?: (id: string | null) => void;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  setActiveTab,
  setWordBankSubTab,
  selectedDeckId,
  setSelectedDeckId,
}) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false); // State to show/hide new deck form
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingDecks, setLoadingDecks] = useState(true); // Added loading state for decks
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]); // ADDED: State for all flashcards
  const [loadingFlashcards, setLoadingFlashcards] = useState(false); // ADDED: State for loading flashcards

  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [deckToEdit, setDeckToEdit] = useState<Deck | null>(null);
  const [editedDeckName, setEditedDeckName] = useState('');
  const [editedDeckDescription, setEditedDeckDescription] = useState('');
  const [editedDeckEmoji, setEditedDeckEmoji] = useState('');

  // State for Create New Flashcard Modal
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [currentDeckIdForFlashcard, setCurrentDeckIdForFlashcard] = useState<string | null>(null);

  // ADDED: State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // Load user's decks from Supabase
  const loadUserDecks = async () => {
    setLoadingDecks(true); // Start loading
    const { data, error } = await supabase
      .from('decks')
      .select('*, cards(count)')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading decks:', error);
      setError(error.message);
    } else {
      setDecks(data as Deck[]);
      // ADDED: Log fetched data
      console.log('Fetched deck data:', data);
    }
    setLoadingDecks(false); // End loading
  };

  useEffect(() => {
    loadUserDecks();
  }, []);

  // ADDED: Effect to load all flashcards after decks are loaded
  useEffect(() => {
    const loadAllFlashcards = async () => {
      setLoadingFlashcards(true);
      const { data, error } = await supabase
        .from('cards') // Assuming flashcards are stored in a 'cards' table
        .select('*'); // Fetch all flashcards

      if (error) {
        console.error('Error loading all flashcards:', error);
        // Decide how to handle error, maybe show a message or just log
      } else {
        setAllFlashcards(data as Flashcard[]);
        console.log('Fetched all flashcards:', data);
      }
      setLoadingFlashcards(false);
    };

    // Load flashcards only after decks are loaded initially
    if (!loadingDecks && decks.length > 0) {
       loadAllFlashcards();
    } else if (!loadingDecks && decks.length === 0) {
       // Handle case where there are no decks, maybe no flashcards either
       setLoadingFlashcards(false);
    }

  }, [loadingDecks, decks]); // Depend on loadingDecks and decks state

  // ADDED: Log decks after loading
  useEffect(() => {
    console.log('Loaded decks:', decks);
  }, [decks]);

  // ADDED: Filter decks based on search term (This will be updated)
  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ADDED: Filter flashcards based on search term
  const filteredFlashcards = allFlashcards.filter((card) => {
    const term = searchTerm.toLowerCase();
    return (
      card.english.toLowerCase().includes(term) ||
      card.arabic.toLowerCase().includes(term) ||
      (card.transliteration &&
        card.transliteration.toLowerCase().includes(term)) ||
      (card.tags && card.tags.join(' ').toLowerCase().includes(term)) ||
      // Also include searching by deck name or description if the card has a deck_id
      (card.deck_id && decks.some(deck => deck.id === card.deck_id &&
         (deck.name.toLowerCase().includes(term) || deck.description.toLowerCase().includes(term))
      ))
    );
  });

  // Function to handle saving a new deck
  const handleSaveNewDeck = async () => {
    if (!newDeckName.trim()) {
      setError('Deck name is required.');
      return; // require a deck name
    }
    setError(null); // Clear previous errors

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error: insertError } = await supabase
        .from('decks')
        .insert({
          user_id: session.user.id,
          name: newDeckName.trim(), // Trim whitespace
          description: newDeckDescription,
          emoji: '📚', // Default emoji
          is_default: false,
          archived: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setDecks((prev) => [...prev, data]); // Add new deck to the list
      setIsCreatingNewDeck(false); // Hide the form
      setNewDeckName('');
      setNewDeckDescription('');
      setError(null); // Clear any error messages after successful creation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
      console.error('Error creating deck:', err);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;

      // Remove the deleted deck from the local state
      setDecks((prev) => prev.filter((deck) => deck.id !== deckId));
      setShowDeleteConfirm(false); // Close the modal
      setDeckToDelete(null); // Clear the deck to delete
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck');
      console.error('Error deleting deck:', err);
    }
  };

  const handleUpdateDeck = async () => {
    if (!deckToEdit || !editedDeckName.trim()) {
      setError('Deck name is required.');
      return;
    }
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('decks')
        .update({
          name: editedDeckName.trim(),
          description: editedDeckDescription,
          emoji: editedDeckEmoji,
        })
        .eq('id', deckToEdit.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update the deck in the local state
      setDecks((prev) =>
        prev.map((deck) => (deck.id === data.id ? data : deck))
      );
      setShowEditModal(false);
      setDeckToEdit(null);
      setEditedDeckName('');
      setEditedDeckDescription('');
      setEditedDeckEmoji('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deck');
      console.error('Error updating deck:', err);
    }
  };

  // Handler for creating a new flashcard in a specific deck
  const handleCreateFlashcardInDeck = (deckId: string) => {
    setCurrentDeckIdForFlashcard(deckId);
    setIsCreatingFlashcard(true);
  };

  // Handler for closing the flashcard form modal
  const handleCloseFlashcardForm = () => {
    setIsCreatingFlashcard(false);
    setCurrentDeckIdForFlashcard(null);
    loadUserDecks(); // Refresh decks to show new flashcard count (optional, could optimize later)
  };

  // Handler for selecting a deck (e.g., to view its cards)
  const handleSelectDeck = (deckId: string) => {
    // Update parent state with the selected deck ID
    if (setSelectedDeckId) setSelectedDeckId(deckId);
    // Navigate to a route that shows the cards for this deck
    navigate(`/flashcard/${deckId}`);
  };

  // Handler for closing the new deck modal
  const handleCloseNewDeckModal = () => {
    setIsCreatingNewDeck(false);
    setNewDeckName('');
    setNewDeckDescription('');
    setError(null); // Clear error when canceling
  };

  return (
    <div className="p-4">
      {/* Back button to Vocabulary */}
      <button
        onClick={() => {
          setActiveTab('wordbank'); // Assuming 'wordbank' is the main vocabulary tab
          setWordBankSubTab('add words'); // Assuming a default sub-tab
        }}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Vocabulary
      </button>

      {/* Header with title */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold">Flashcard Decks</h2>
      </div>
      {/* END Header with title */}

      {/* Search Bar with Clear Button */}
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
      {/* END Search Bar with Clear Button */}

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Container for main action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* ADDED: Start Study Session button when viewing the list of decks */}
        <button
          onClick={() => navigate('/study')} // Navigate to the StudySelection route
          className="w-full p-4 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center justify-center"
        >
          <BookOpen size={20} className="mr-2" />
          Start Study Session
        </button>
        {/* END ADDED */}

        {/* ADDED: Button to navigate to Review Schedule */}
        <button
          onClick={() => navigate('/schedule')} // Navigate to the Review Schedule route
          className="w-full p-4 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center justify-center"
        >
          <CalendarDays size={20} className="mr-2" />
          Review Schedule
        </button>
        {/* END ADDED */}

        {/* Button to trigger showing the form for adding a new deck */}
        <button
          onClick={() => setIsCreatingNewDeck(true)}
          className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center"
        >
          <Plus size={20} className="mr-2" />
          Create New Deck
        </button>
      </div>

      {/* Display list of decks OR filtered flashcards based on search term */}
      {searchTerm ? (
        // Display filtered flashcards if search term is present
        loadingFlashcards ? (
           <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredFlashcards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFlashcards
              .sort((a, b) => a.english.localeCompare(b.english))
              .map((card) => (
              <div
                key={card.id}
                className="relative p-4 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer"
                 // Navigate to the single flashcard view, passing deckId and cardId
                onClick={() => navigate(`/decks/${card.deck_id}/flashcard/${card.id}`)}
              >
                {/* Display flashcard front (english) and back (arabic) */}
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{card.english}</h3>
                <p className="text-gray-600 dark:text-gray-300">{card.arabic}</p>
                {card.transliteration && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">{card.transliteration}</p>
                )}
                {/* Optional: Display tags or other relevant info */}
                {card.tags && card.tags.length > 0 && (
                  <div className="mt-2">
                    {card.tags.map(tag => (
                      <span key={tag} className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">{tag}</span>
                    ))}
                  </div>
                )}
                 {/* Display the name of the deck the card belongs to */}
                 {card.deck_id && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Deck: {decks.find(deck => deck.id === card.deck_id)?.name || 'Unknown Deck'}
                    </div>
                 )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No flashcards match your search.
          </div>
        )
      ) : (
        // Display filtered decks if no search term is present AND no specific deck is selected via prop
        !selectedDeckId ? (
          loadingDecks ? (
            <div className="flex items-center justify-center py-8">
             <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
           </div>
          ) : filteredDecks.length === 0 ? (
           <div className="text-center text-gray-500 dark:text-gray-400 py-8">
             No decks yet. Create your first deck!
           </div>
          ) : (
            // Calculate total cards for display before returning JSX
            // Note: This calculation happens here within the render logic,
            // which might be slightly less performant for very large numbers of decks.
            // For better performance, this could be calculated in a useEffect or memoized.
            // Removed variable declaration from inside JSX

            <div className="flex flex-col">
              {/* Total Card Count Display */}
              <div className="mb-6 text-center text-xl font-semibold text-gray-800 dark:text-gray-100">
                Total no. of cards: {filteredDecks.reduce((sum, deck) => sum + (deck.cards?.[0]?.count || 0), 0)}
              </div>
              {/* Grid of Decks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Sort filtered decks alphabetically by name before mapping */}
              {filteredDecks.sort((a, b) => a.name.localeCompare(b.name)).map((deck) => (
                <div
                  key={deck.id}
                  className="relative bg-gray-50 dark:bg-dark-100 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer flex flex-col justify-between h-full"
                  onClick={() => handleSelectDeck(deck.id)} // Navigate to deck detail on click
                >
                   {/* Removed Edit and Delete Buttons - Absolute positioned */}

                   {/* Container for Deck Info and Card Count */}
                   <div className="flex justify-between items-start w-full mb-3 flex-grow">
                     {/* Left: Deck Icon, Name, Description */}
                     <div className="flex flex-col flex-grow pr-4">
                        {/* Deck Icon and Name */}
                        <div className="flex items-center mb-1">
                          {deck.emoji ? (
                            <span className="text-2xl mr-3">{deck.emoji}</span>
                          ) : (
                            <LibraryBig size={24} className="text-emerald-600 mr-3" />
                          )}
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex-grow truncate">
                            {deck.name}
                          </h3>
                        </div>

                        {/* Deck Description */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">
                          {deck.description}
                        </p>
                     </div>

                     {/* Right: Card Count Indicator */}
                     <div className="flex-shrink-0 flex items-center justify-center p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-full text-emerald-800 dark:text-emerald-200 font-semibold text-sm">
                       {/* Access the count from the nested structure returned by the query */}
                       cards: {deck.cards?.[0]?.count || 0}
                     </div>
                   </div>

                    {/* Icons for Add, Edit, Delete - Centered and spaced evenly */}
                   <div className="flex justify-around items-center w-full mt-auto pt-3 border-t border-gray-200 dark:border-dark-100">
                     {/* Add New Flashcard Icon */}
                     <button
                       className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-md"
                       onClick={(e) => {
                         e.stopPropagation(); // Prevent deck click navigation
                         handleCreateFlashcardInDeck(deck.id);
                       }}
                       title="Add New Flashcard"
                     >
                       <Plus size={20} />
                     </button>
                     {/* Edit Button */}
                     <button
                       className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-600 p-1 rounded-md"
                       onClick={(e) => {
                         e.stopPropagation(); // Prevent deck click navigation
                         setDeckToEdit(deck);
                         setEditedDeckName(deck.name);
                         setEditedDeckDescription(deck.description);
                         setEditedDeckEmoji(deck.emoji || '');
                         setShowEditModal(true);
                       }}
                        title="Edit Deck"
                     >
                       <Edit2 size={20} />
                     </button>
                     {/* Delete Button */}
                     <button
                       className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 p-1 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent deck click navigation
                          setDeckToDelete(deck);
                          setShowDeleteConfirm(true);
                        }}
                        title="Delete Deck"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>

                   {/* Removed redundant card count */}

                </div>
              ))}
              </div>
            </div>
          )
        ) : (
          null // Render nothing in FlashcardDeck when a specific deck is selected.
        )
      )}

      {/* Create New Deck Modal */}
      {isCreatingNewDeck && (
        <CreateDeckModal
          onClose={handleCloseNewDeckModal}
          onSubmit={async (name, description, emoji) => {
            if (!name.trim()) {
              setError('Deck name is required.');
              return;
            }
            setError(null);
            try {
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();
              if (sessionError) throw sessionError;
              if (!session?.user) throw new Error('No authenticated user');

              const { data, error: insertError } = await supabase
                .from('decks')
                .insert({
                  user_id: session.user.id,
                  name: name.trim(),
                  description,
                  emoji: emoji || '📚',
                  is_default: false,
                  archived: false,
                })
                .select()
                .single();

              if (insertError) throw insertError;

              setDecks((prev) => [...prev, data]);
              setIsCreatingNewDeck(false);
              setNewDeckName('');
              setNewDeckDescription('');
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create deck');
              console.error('Error creating deck:', err);
            }
          }}
        />
      )}

      {/* Create New Flashcard Modal */}
      {isCreatingFlashcard && currentDeckIdForFlashcard && (
        <FlashcardForm
          deckId={currentDeckIdForFlashcard}
          onClose={handleCloseFlashcardForm}
          onSubmit={() => {
            // Handle flashcard submission logic here (already done within FlashcardForm)
            handleCloseFlashcardForm(); // Close modal after submission
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deckToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the deck "{deckToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeckToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={() => handleDeleteDeck(deckToDelete.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deck Modal */}
      {showEditModal && deckToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Edit Deck</h3>
            <div className="mb-4">
              <label htmlFor="editedDeckName" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="editedDeckName"
                value={editedDeckName}
                onChange={(e) => setEditedDeckName(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                required
                placeholder="e.g. Arabic Verbs"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="editedDeckDescription" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                Description
              </label>
              <input
                type="text"
                id="editedDeckDescription"
                value={editedDeckDescription}
                onChange={(e) => setEditedDeckDescription(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                placeholder="e.g. Common verbs and their conjugations"
              />
            </div>
             <div className="mb-4">
              <label htmlFor="editedDeckEmoji" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                Icon
              </label>
              <input
                type="text"
                id="editedDeckEmoji"
                value={editedDeckEmoji}
                onChange={(e) => setEditedDeckEmoji(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                placeholder="e.g. 📚"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => {
                  setShowEditModal(false);
                  setDeckToEdit(null);
                  setEditedDeckName('');
                  setEditedDeckDescription('');
                  setEditedDeckEmoji('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleUpdateDeck}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardDeck;
