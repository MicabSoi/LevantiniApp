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
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import FlashcardForm from './FlashcardForm';
import { useNavigate } from 'react-router-dom';

// Define types for flashcards and decks
interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
}

interface Deck {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  is_default: boolean;
  archived: boolean;
  created_at: string;
  cards?: Flashcard[];
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
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  setActiveTab,
  setWordBankSubTab,
}) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false); // State to show/hide new deck form
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [showFlashcardForm, setShowFlashcardForm] = useState(false); // State to show/hide new flashcard form
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingDecks, setLoadingDecks] = useState(true); // Added loading state for decks

  const navigate = useNavigate();

  // Load user's decks from Supabase
  const loadUserDecks = async () => {
    setLoadingDecks(true); // Start loading
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading decks:', error);
      setError('Failed to load decks.'); // Set error state
    } else {
      setDecks(data as Deck[]);
    }
    setLoadingDecks(false); // End loading
  };

  // Load flashcards for the selected deck
  const loadDeckData = async (deckId: string) => {
    setError(null); // Clear previous errors
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId);
    if (error) {
      console.error('Error loading flashcards:', error);
      setError('Failed to load flashcards for this deck.'); // Set error state
    } else {
      setDeckCards(data as Flashcard[]);
    }
  };

  useEffect(() => {
    loadUserDecks();
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      loadDeckData(selectedDeck);
      // Optionally clear search term when selecting a new deck
      setSearchTerm('');
    }
  }, [selectedDeck]);

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

  // Filter flashcards based on search term
  const filteredCards = deckCards.filter((card) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true; // Show all cards if search term is empty
    // Use optional chaining (?.) for properties that might be null or undefined
    return (
      card.english?.toLowerCase().includes(term) ||
      card.arabic?.toLowerCase().includes(term) ||
      (card.transliteration &&
        card.transliteration.toLowerCase().includes(term)) ||
      (card.tags &&
        Array.isArray(card.tags) &&
        card.tags.join(' ').toLowerCase().includes(term)) // Ensure tags is an array
    );
  });

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

      <h2 className="text-xl font-bold mb-6">Flashcard Decks</h2>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* When a deck is selected, show back button and search bar */}
      {selectedDeck && (
        <div className="mb-4">
          <button
            onClick={() => {
              setSelectedDeck(null); // Go back to the list of decks
              setDeckCards([]);
              setSearchTerm(''); // Clear search when going back to decks list
              setError(null); // Clear errors
            }}
            className="bg-gray-100 dark:bg-dark-100 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-200"
          >
            Back to Decks
          </button>
          {/* Search bar for filtering cards within a selected deck */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flashcards..."
            className="w-full p-2 mt-4 mb-4 border rounded dark:bg-dark-200 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      )}

      {/* Deck list and New Deck form when no deck is selected */}
      {!selectedDeck && (
        <>
          {/* ADDED: Start Study Session button when viewing the list of decks */}
          <button
            onClick={() => navigate('/study')} // Navigate to the StudySelection route
            className="w-full p-4 mb-4 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center justify-center"
          >
            <BookOpen size={20} className="mr-2" />
            Start Study Session
          </button>
          {/* END ADDED */}

          {/* Button to trigger showing the form for adding a new deck */}
          {/* Restored original onClick logic */}
          <button
            onClick={() => setIsCreatingNewDeck(true)}
            className="mb-4 w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" />
            Create New Deck
          </button>

          {/* Display list of decks */}
          {loadingDecks ? ( // Show loading indicator
            <div className="flex items-center justify-center py-8">
              {/* This is where Loader2 is used */}
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No decks yet. Create your first deck!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedDeck(deck.id)} // Click to view cards in this deck
                >
                  <div className="flex items-center mb-3">
                    {getDeckIcon(deck.id)}{' '}
                    {/* Using helper function for icon */}
                    <h3 className="text-lg font-bold ml-2 text-gray-800 dark:text-white">
                      {deck.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {deck.description}
                  </p>
                </div>
              ))}
            </div>
          )}
          {/* Form for creating a new deck (shown when isCreatingNewDeck is true) */}
          {/* Restored conditional rendering and form structure */}
          {isCreatingNewDeck && (
            <div className="mb-4 p-4 border rounded-md mt-4 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">
                New Deck
              </h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                  required // Make name required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveNewDeck}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsCreatingNewDeck(false);
                    setNewDeckName('');
                    setNewDeckDescription('');
                    setError(null); // Clear error when canceling
                  }}
                  className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Flashcards view for a selected deck */}
      {selectedDeck && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Deck Cards
          </h3>

          {/* Button to show the form for adding a new flashcard */}
          {!showFlashcardForm && (
            <button
              onClick={() => setShowFlashcardForm(true)}
              className="mb-4 w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Add New Flashcard
            </button>
          )}

          {/* Form for adding a new flashcard (shown when showFlashcardForm is true) */}
          {showFlashcardForm && (
            <div className="mb-6 bg-white dark:bg-dark-200 p-6 rounded-lg border border-gray-200 dark:border-dark-100">
              <FlashcardForm
                deckId={selectedDeck}
                onSuccess={() => {
                  setShowFlashcardForm(false);
                  loadDeckData(selectedDeck); // Reload cards after adding a new one
                  setError(null); // Clear error after successful form submission
                }}
                onCancel={() => setShowFlashcardForm(false)}
              />
            </div>
          )}

          {/* Display list of flashcards within the selected deck (filtered by search) */}
          {filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  // Navigate to a detailed view of the flashcard
                  onClick={() => navigate(`/flashcard/${card.id}`)}
                  className="relative p-4 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer"
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
                      // Stop propagation so clicking the audio button doesn't also navigate
                      onClick={(e) => {
                        e.stopPropagation();
                        new Audio(card.audio_url!).play();
                      }}
                      className="absolute top-2 right-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full p-2 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Message when no cards are found in the deck (after filtering or empty deck)
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'No flashcards match your search.'
                : 'No flashcards in this deck yet.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardDeck;
