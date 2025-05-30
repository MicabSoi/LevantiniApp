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
  Settings,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import FlashcardForm from './FlashcardForm';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { CreateDeckModal } from './CreateDeckModal'; // Import CreateDeckModal as a named import
import { useSettings } from '../contexts/SettingsContext';
import { formatArabicText } from '../utils/arabicUtils';

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
  reviews_count?: number;
  repetition_count?: number;
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
  card_count?: number;
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
  const [loadingDefaultFlashcards, setLoadingDefaultFlashcards] = useState(false); // NEW: State for loading default flashcards

  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [deckToEdit, setDeckToEdit] = useState<Deck | null>(null);
  const [editedDeckName, setEditedDeckName] = useState('');
  const [editedDeckDescription, setEditedDeckDescription] = useState('');
  const [editedDeckEmoji, setEditedDeckEmoji] = useState('');

  // State to indicate if we are selecting a deck for editing
  const [isSelectingDeckForEdit, setIsSelectingDeckForEdit] = useState(false);
  // State to indicate if we are selecting a deck for deleting
  const [isSelectingDeckForDelete, setIsSelectingDeckForDelete] = useState(false);

  // State for Create New Flashcard Modal
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [currentDeckIdForFlashcard, setCurrentDeckIdForFlashcard] = useState<string | null>(null);

  // ADDED: State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // Add state for default decks and default flashcards
  const [defaultDecks, setDefaultDecks] = useState<Deck[]>([]); // This will now store decks from getAvailableDefaultDecks
  const [loadingDefaultDecks, setLoadingDefaultDecks] = useState(true); // Renamed for clarity from loadingAvailableDefaultDecks
  const [defaultFlashcards, setDefaultFlashcards] = useState<Flashcard[]>([]);

  // New state variables for download feature
  const [downloadingDeckId, setDownloadingDeckId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Add success message state for deck operations
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for deletion progress tracking
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState({ deleted: 0, total: 0 });
  const [deletionStatus, setDeletionStatus] = useState<string>('');

  // State for settings modal and diacritics visibility
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { flashcardShowDiacritics, setFlashcardShowDiacritics } = useSettings();

  // Function to calculate correct card count for verb decks by grouping conjugations
  const getVerbCardCount = (cards: Flashcard[], deckName: string): number => {
    // Only apply grouping logic for Verbs deck
    if (deckName?.toLowerCase() !== 'verbs') {
      return cards.length;
    }

    const verbGroups: { [key: string]: Flashcard[] } = {};
    let nonVerbCards = 0;

    // Group cards by base verb (extract from English field)
    cards.forEach(card => {
      // Check if this looks like a verb conjugation card
      if (card.english.includes(' - ') || 
          (card.english.includes('I ') || card.english.includes('You ') || 
           card.english.includes('He ') || card.english.includes('She ') || 
           card.english.includes('We ') || card.english.includes('They '))) {
        
        // Extract base verb - try different patterns
        let baseVerb = '';
        
        if (card.english.includes(' - ')) {
          // Format: "to come - إِجَا - ija" 
          baseVerb = card.english.split(' - ')[0].trim();
        } else {
          // Format: "I ask", "You ask", etc. - extract the verb part
          const words = card.english.split(' ');
          if (words.length >= 2) {
            baseVerb = words.slice(1).join(' '); // Everything after the pronoun
          }
        }
        
        if (baseVerb) {
          if (!verbGroups[baseVerb]) {
            verbGroups[baseVerb] = [];
          }
          verbGroups[baseVerb].push(card);
        } else {
          nonVerbCards++;
        }
      } else {
        nonVerbCards++;
      }
    });

    // Count groups: each verb group counts as 1, regardless of conjugations
    let groupCount = 0;
    Object.entries(verbGroups).forEach(([, conjugations]) => {
      if (conjugations.length > 1) {
        groupCount += 1; // Count the whole group as 1
      } else {
        groupCount += conjugations.length; // Single conjugations count normally
      }
    });

    return groupCount + nonVerbCards;
  };

  // Fetch default decks (available for download)
  const loadAvailableDefaultDecks = async () => { // Renamed function for clarity
    setLoadingDefaultDecks(true);
    setDownloadError(null);
    setDownloadSuccessMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('getAvailableDefaultDecks');
      
      if (error) {
        console.error('Error loading available default decks:', error);
        setError('Failed to load available decks. Please try again.'); // Use existing error state or a new one
        setDefaultDecks([]);
      } else {
        // The data from getAvailableDefaultDecks should be an array of Decks with card_count
        // Ensure the Deck interface matches this structure (it has an optional cards field, let's make card_count explicit)
        setDefaultDecks(data as Deck[]); 
        console.log('Loaded available default decks:', data);
      }
    } catch (e) {
      console.error('Catch block error loading available default decks:', e);
      setError('An unexpected error occurred while loading available decks.');
      setDefaultDecks([]);
    } finally {
      setLoadingDefaultDecks(false);
    }
  };

  // Fetch default flashcards
  const loadDefaultFlashcards = async () => {
    setLoadingDefaultFlashcards(true); // Start loading
    let allFlashcards: Flashcard[] = [];
    let page = 0;
    const pageSize = 1000; // Supabase typically limits to 1000 rows per request
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error, count } = await supabase
          .from('default_flashcards')
          .select('*', { count: 'exact' })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) {
          console.error('Error loading default flashcards:', error);
          break;
        }

        if (data && data.length > 0) {
          allFlashcards = [...allFlashcards, ...data];
          // If we received fewer rows than the page size, we've reached the end
          hasMore = data.length === pageSize;
          page++;
          console.log(`Loaded ${allFlashcards.length} default flashcards so far...`);
        } else {
          hasMore = false; // No more data
        }
      }

      setDefaultFlashcards(allFlashcards as Flashcard[]);
      console.log(`Total default flashcards loaded: ${allFlashcards.length}`);
    } catch (err) {
      console.error('Error in paginated loading of default flashcards:', err);
    } finally {
      setLoadingDefaultFlashcards(false); // End loading
    }
  };

  // Load user's decks from Supabase
  const loadUserDecks = async () => {
    setLoadingDecks(true); // Start loading
    const { data, error } = await supabase
      .from('decks')
      .select('*, cards(count)')
      // Remove the is_default filter to include both user-created and downloaded default decks
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading decks:', error);
      setError(error.message);
    } else {
      setDecks(data as Deck[]);
      // ADDED: Log fetched data
      console.log('Fetched deck data (including downloaded defaults):', data);
    }
    setLoadingDecks(false); // End loading
  };

  // Fetch both user and default decks/flashcards on mount
  useEffect(() => {
    loadUserDecks();
    loadAvailableDefaultDecks(); // Changed from loadDefaultDecks
    // loadDefaultFlashcards(); // Consider if this is still needed, or if it should be triggered differently
  }, []);

  // Prevent navigation during deck deletion
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDeletingDeck) {
        e.preventDefault();
        e.returnValue = 'Deck deletion is in progress. Are you sure you want to leave?';
        return 'Deck deletion is in progress. Are you sure you want to leave?';
      }
    };

    if (isDeletingDeck) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDeletingDeck]);

  // ADDED: Effect to load all flashcards after decks are loaded
  useEffect(() => {
    const loadAllFlashcards = async () => {
      setLoadingFlashcards(true);
      const { data, error } = await supabase
        .from('cards') // Assuming flashcards are stored in a 'cards' table
        .select('*, reviews(reviews_count, repetition_count)'); // Fetch all flashcards and join with reviews table to get review counts

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

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDownloadDefaultDeck = async (defaultDeckId: string) => {
    setDownloadingDeckId(defaultDeckId);
    setDownloadError(null);
    setDownloadSuccessMessage(null);
    try {
      // Force session refresh to ensure we have a valid token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        throw new Error('Unable to refresh session. Please try logging out and back in.');
      }
      
      const session = refreshData.session;
      if (!session?.user) {
        console.error('No authenticated user found after refresh');
        throw new Error('You must be logged in to download decks. Please log in again.');
      }
      
      console.log('User authenticated after refresh, proceeding with download for deck:', defaultDeckId);
      console.log('User ID:', session.user.id);
      console.log('Access token exists:', !!session.access_token);

      const { data, error: invokeError } = await supabase.functions.invoke('downloadDefaultDeck', {
        body: { default_deck_id: defaultDeckId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (invokeError) {
        console.error('Function invoke error:', invokeError);
        throw invokeError;
      }

      if (data?.error) { // Handle errors returned in the function's JSON response
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      setDownloadSuccessMessage(`Successfully downloaded "${defaultDecks.find(d => d.id === defaultDeckId)?.name || 'deck'}"! It's now in your decks list.`);
      loadUserDecks(); // Refresh the user's decks list
    } catch (err) {
      console.error('Error downloading default deck:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setDownloadError(`Failed to download deck: ${errorMessage}`);
    } finally {
      setDownloadingDeckId(null);
    }
  };

  // Calculate card counts for default decks
  const defaultDeckCardCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    defaultFlashcards.forEach(card => {
      const deckId = (card as any).default_deck_id || card.deck_id;
      if (deckId) {
        counts[deckId] = (counts[deckId] || 0) + 1;
      }
    });
    return counts;
  }, [defaultFlashcards]);

  // Only show user decks (not defaultDecks) in the UI
  const combinedDecks = React.useMemo(() => {
    return decks.map(deck => {
      let cardCount = deck.cards?.[0]?.count || 0;
      
      // For Verbs deck, calculate the correct count by grouping conjugations
      if (deck.name?.toLowerCase() === 'verbs' && allFlashcards.length > 0) {
        const deckCards = allFlashcards.filter(card => card.deck_id === deck.id);
        cardCount = getVerbCardCount(deckCards, deck.name);
      }
      
      return { ...deck, isDefault: false, card_count: cardCount };
    });
  }, [decks, allFlashcards]);

  // Combine all flashcards for search
  const combinedFlashcards = React.useMemo(() => {
    const userCards = allFlashcards.map(card => ({ ...card, isDefault: false }));
    const defCards = defaultFlashcards.map(card => ({ ...card, isDefault: true }));
    return [...userCards, ...defCards]; // Keep this for now, though the filter will ignore default cards
  }, [allFlashcards, defaultFlashcards]);

  // Update search logic to ONLY include user flashcards
  const filteredFlashcards = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    // Filter only userCards based on the search term
    const userCards = allFlashcards.map(card => ({ ...card, isDefault: false }));
    return userCards.filter((card) => {
      return (
        card.english.toLowerCase().includes(term) ||
        card.arabic.toLowerCase().includes(term) ||
        (card.transliteration && card.transliteration.toLowerCase().includes(term)) ||
        (card.tags && card.tags.join(' ').toLowerCase().includes(term))
      );
    });
  }, [searchTerm, allFlashcards]); // Depend on searchTerm and allFlashcards

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
    // Get deck name for progress messages
    const deckToDeleteName = deckToDelete?.name || 'Unknown Deck';
    
    // Initialize deletion state
    setIsDeletingDeck(true);
    setError(null);
    setSuccessMessage(null);
    setDeletionStatus('Preparing to delete deck...');
    setDeletionProgress({ deleted: 0, total: 0 });
    
    // Close the confirmation modal but keep the deck reference for progress display
    setShowDeleteConfirm(false);
    
    try {
      // Step 1: Fetch all flashcard IDs associated with the deck
      setDeletionStatus('Counting cards to delete...');
      const { data: cardIdsData, error: fetchError } = await supabase
        .from('cards')
        .select('id')
        .eq('deck_id', deckId);

      if (fetchError) throw fetchError;

      const cardIds = cardIdsData.map(card => card.id);
      const totalCards = cardIds.length;
      
      console.log(`Found ${totalCards} cards to delete for deck ${deckId}`);
      
      // Update progress with total count
      setDeletionProgress({ deleted: 0, total: totalCards });
      
      if (totalCards === 0) {
        setDeletionStatus('No cards to delete, removing deck...');
      } else {
        setDeletionStatus(`Deleting ${totalCards} cards...`);

        // Step 2: Delete flashcards in batches with progress updates
        const batchSize = 100; // Smaller batches for more frequent progress updates
        let deletedCount = 0;

        for (let i = 0; i < cardIds.length; i += batchSize) {
          const batchIds = cardIds.slice(i, i + batchSize);
          
          const { error: deleteCardsError } = await supabase
            .from('cards')
            .delete()
            .in('id', batchIds);

          if (deleteCardsError) throw deleteCardsError;
          
          deletedCount += batchIds.length;
          setDeletionProgress({ deleted: deletedCount, total: totalCards });
          setDeletionStatus(`Deleted ${deletedCount} of ${totalCards} cards...`);
          
          console.log(`Deleted batch of ${batchIds.length} cards for deck ${deckId} (${deletedCount}/${totalCards})`);
          
          // Small delay to make progress visible for smaller decks
          if (totalCards > 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      // Step 3: Delete the deck itself
      setDeletionStatus('Deleting deck...');
      const { error: deleteDeckError } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      if (deleteDeckError) throw deleteDeckError;

      // Step 4: Update UI and show success
      setDecks((prev) => prev.filter((deck) => deck.id !== deckId));
      setDeletionStatus('Deletion completed successfully!');
      setSuccessMessage(`"${deckToDeleteName}" and ${totalCards} cards have been deleted successfully!`);
      
      console.log(`Successfully completed deletion of deck ${deckId} and its ${totalCards} flashcards.`);

      // Wait a moment to show completion message
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (err) {
      console.error('Error deleting deck or flashcards:', err);
      setError(`Failed to delete deck "${deckToDeleteName}". ${err instanceof Error ? err.message : 'Please try again.'}`);
      setDeletionStatus('Deletion failed');
    } finally {
      // Reset deletion state
      setIsDeletingDeck(false);
      setDeckToDelete(null);
      setDeletionProgress({ deleted: 0, total: 0 });
      setDeletionStatus('');
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

  // Update deck selection navigation
  const handleSelectDeck = (deck: any) => {
    console.log('Navigating to deck:', deck);
    if (deck.isDefault) {
      navigate(`/default-deck/${deck.id}`, { state: { deckType: 'default', deckId: deck.id } });
    } else {
      navigate(`/deck/${deck.id}`);
    }
  };

  // Handler for closing the new deck modal
  const handleCloseNewDeckModal = () => {
    setIsCreatingNewDeck(false);
    setNewDeckName('');
    setNewDeckDescription('');
    setError(null); // Clear error when canceling
  };

  // Function to check if a default deck has already been downloaded
  const isDefaultDeckDownloaded = (defaultDeckId: string, defaultDeckName: string): boolean => {
    // Check if user has a deck with the same name (regardless of is_default flag)
    // This is more reliable since the download process might not set is_default correctly
    const result = decks.some(userDeck => 
      userDeck.name.toLowerCase() === defaultDeckName.toLowerCase()
    );
    
    // Debug logging
    console.log('Checking if default deck is downloaded:', {
      defaultDeckId,
      defaultDeckName,
      userDecks: decks.map(d => ({ id: d.id, name: d.name, is_default: d.is_default })),
      result
    });
    
    return result;
  };

  return (
    <div className="p-4">
      {/* Back button to Vocabulary */}
      <button
        onClick={() => {
          if (!isDeletingDeck) {
            setActiveTab('wordbank');
            setWordBankSubTab('landing');
          }
        }}
        disabled={isDeletingDeck}
        className={`mb-6 flex items-center ${
          isDeletingDeck 
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
            : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-600'
        }`}
        title={isDeletingDeck ? 'Cannot navigate while deleting deck' : 'Back to Vocabulary'}
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

      {successMessage && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
          {successMessage}
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
                <p className="text-gray-600 dark:text-gray-300">{formatArabicText(card.arabic, flashcardShowDiacritics)}</p>
                {card.transliteration && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">{card.transliteration}</p>
                )}
                {/* Display tags or other relevant info */}
                {card.tags && card.tags.length > 0 && (
                  <div className="mt-2">
                    {card.tags.map(tag => (
                      <span key={tag} className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">{tag}</span>
                    ))}
                  </div>
                )}
                {/* Display Total Review Count */}
                {card.reviews_count !== undefined && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Total Reviews: {card.reviews_count}
                  </div>
                )}
                {/* Display Successful Repetitions (formerly repetition_count or streak) */}
                {card.repetition_count !== undefined && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Successful Repetitions: {card.repetition_count}
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
          ) : combinedDecks.length === 0 ? (
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
              <div className="mb-6 text-center text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center justify-center space-x-4">
                <span>
                  Total no. of cards: {combinedDecks.reduce((sum, deck) => sum + (deck.card_count || 0), 0)}
                  {loadingDefaultFlashcards && 
                    <span className="ml-2 text-sm text-emerald-600 dark:text-emerald-400 inline-flex items-center">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Loading all cards...
                    </span>
                  }
                </span>
                {/* Single Edit Button for Decks */}
                <button
                  disabled={isDeletingDeck}
                  className={`p-1 rounded-md ${
                    isDeletingDeck
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-600'
                  }`}
                  onClick={(e) => {
                    if (!isDeletingDeck) {
                      console.log('Edit Decks button clicked');
                      setIsSelectingDeckForEdit(!isSelectingDeckForEdit);
                      setIsSelectingDeckForDelete(false); // Turn off delete mode if turning on edit mode
                    }
                  }}
                  title={isDeletingDeck ? 'Cannot edit while deleting deck' : 'Edit Decks'}
                >
                  <Edit2 size={20} />
                </button>
                {/* Single Delete Button for Decks */}
                <button
                  disabled={isDeletingDeck}
                  className={`p-1 rounded-md ${
                    isDeletingDeck
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600'
                  }`}
                  onClick={(e) => {
                    if (!isDeletingDeck) {
                      console.log('Delete Decks button clicked');
                      setIsSelectingDeckForDelete(!isSelectingDeckForDelete);
                      setIsSelectingDeckForEdit(false); // Turn off edit mode if turning on delete mode
                    }
                  }}
                  title={isDeletingDeck ? 'Cannot delete while deleting deck' : 'Delete Decks'}
                >
                  <Trash2 size={20} />
                </button>
                {/* Settings Button */}
                <button
                  disabled={isDeletingDeck}
                  className={`p-1 rounded-md ${
                    isDeletingDeck
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  onClick={(e) => {
                    if (!isDeletingDeck) {
                      console.log('Settings button clicked');
                      setShowSettingsModal(true);
                    }
                  }}
                  title={isDeletingDeck ? 'Cannot access settings while deleting deck' : 'Settings'}
                >
                  <Settings size={20} />
                </button>
              </div>

              {/* Optional: Visual indicator for edit selection mode */}
              {isSelectingDeckForEdit && (
                <div className="text-center text-emerald-600 dark:text-emerald-400 mb-4">
                  Click on a deck card to edit it.
                </div>
              )}
              {isSelectingDeckForDelete && (
                <div className="text-center text-red-600 dark:text-red-400 mb-4">
                  Click on a deck card to delete it.
                </div>
              )}

              {/* Grid of Decks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Sort filtered decks alphabetically by name before mapping */}
              {combinedDecks.sort((a, b) => a.name.localeCompare(b.name)).map((deck) => (
                <div
                  key={deck.id}
                  className={`relative p-6 rounded-lg shadow-sm border transition-colors flex flex-col justify-between h-full ${
                    isDeletingDeck
                      ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60'
                      : 'bg-gray-50 dark:bg-dark-100 border-gray-200 dark:border-dark-100 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer'
                  }`}
                  onClick={(e) => {
                    // Prevent any deck interactions during deletion
                    if (isDeletingDeck) {
                      return;
                    }
                    
                    console.log('Deck card clicked:', deck.name);
                    console.log('isSelectingDeckForEdit:', isSelectingDeckForEdit);
                    console.log('isSelectingDeckForDelete:', isSelectingDeckForDelete);
                    if (isSelectingDeckForEdit) {
                      e.stopPropagation(); // Prevent default deck navigation
                      setDeckToEdit(deck);
                      setEditedDeckName(deck.name);
                      setEditedDeckDescription(deck.description);
                      setEditedDeckEmoji(deck.emoji || '');
                      setIsSelectingDeckForEdit(false); // Exit selection mode
                      setShowEditModal(true); // Open edit modal
                    } else if (isSelectingDeckForDelete) {
                      e.stopPropagation(); // Prevent default deck navigation
                      setDeckToDelete(deck);
                      setIsSelectingDeckForDelete(false); // Exit selection mode
                      setShowDeleteConfirm(true); // Open delete confirmation modal
                    } else {
                      handleSelectDeck(deck); // Normal navigation
                    }
                  }} // Navigate to deck detail on click
                >
                   {/* Removed Edit and Delete Buttons - Absolute positioned */}

                   {/* Container for Deck Info and Card Count - Modified for vertical stacking on md+ */}
                   <div className="flex flex-col md:flex-col justify-start items-stretch w-full mb-3 flex-grow"> {/* Changed to flex-col, md:flex-col, justify-start, items-stretch */}
                     {/* Top: Deck Icon, Name, Description */}
                     <div className="flex flex-col flex-grow pr-0 mb-2"> {/* Removed pr-4, added mb-2 */}
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

                     {/* Bottom: Card Count Indicator - Adjusted styling */}
                     <div className="flex-shrink-0 flex items-center justify-start p-1 bg-emerald-100/50 dark:bg-emerald-900/30 rounded text-emerald-800 dark:text-emerald-200 font-semibold text-xs mt-1 self-start"> {/* Adjusted padding, background, text size/color, margin, alignment */}
                       {/* Access the count from the nested structure returned by the query */}
                       {deck.card_count || 0} cards
                     </div>
                   </div>

                    {/* Icons for Add, Edit, Delete - Centered and spaced evenly */}
                   <div className="flex justify-around items-center w-full mt-auto pt-3 border-t border-gray-200 dark:border-dark-100">
                     {/* Add New Flashcard Icon */}
                     
                     {/* Edit Button */}
                     
                     {/* Delete Button */}
                     
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false);
              setDeckToDelete(null);
            }
          }}
        >
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

      {/* Deletion Progress Modal */}
      {isDeletingDeck && deckToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
                Deleting "{deckToDelete.name}"
              </h3>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>
                    {deletionProgress.total === 0 
                      ? 'Empty deck' 
                      : `${deletionProgress.deleted} / ${deletionProgress.total} cards`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-red-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: deletionProgress.total > 0 
                        ? `${(deletionProgress.deleted / deletionProgress.total) * 100}%` 
                        : deletionStatus.includes('completed') ? '100%' : '0%'
                    }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {deletionProgress.total > 0 
                    ? `${Math.round((deletionProgress.deleted / deletionProgress.total) * 100)}%`
                    : deletionStatus.includes('completed') ? '100%' : '0%'
                  } complete
                </div>
              </div>

              {/* Status Message */}
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-3" />
                <p className="text-gray-700 dark:text-gray-300">{deletionStatus}</p>
              </div>

              {/* Warning Message */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Please wait:</strong> Do not close this window or navigate away until deletion is complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsModal(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Display Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close settings"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <label htmlFor="flashcard-diacritics-toggle-label" className="text-gray-700 dark:text-gray-300">
                  Show Diacritics (Tashkeel) <span className="text-sm text-gray-500 dark:text-gray-400">(recommended for beginners)</span>
                </label>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="flashcard-diacritics-toggle"
                    className="sr-only"
                    checked={flashcardShowDiacritics}
                    onChange={() => setFlashcardShowDiacritics(!flashcardShowDiacritics)}
                    aria-labelledby="flashcard-diacritics-toggle-label"
                  />
                  {/* Track */}
                  <div className={`block w-14 h-8 rounded-full cursor-pointer transition-colors duration-300 ease-in-out ${flashcardShowDiacritics ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                       onClick={() => setFlashcardShowDiacritics(!flashcardShowDiacritics)}
                  ></div>
                  {/* Dot */}
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ease-in-out transform ${flashcardShowDiacritics ? 'translate-x-6' : 'translate-x-0'}`}
                       onClick={() => setFlashcardShowDiacritics(!flashcardShowDiacritics)}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 pt-1">
                Controls whether vowel marks (e.g., fatha, damma, kasra) and other diacritics are shown on Arabic text.
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deck Modal */}
      {showEditModal && deckToEdit && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setDeckToEdit(null);
              setEditedDeckName('');
              setEditedDeckDescription('');
              setEditedDeckEmoji('');
            }
          }}
        >
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Edit Deck</h3>

            {/* Display error message if exists */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">Error: {error}</span>
              </div>
            )}

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

      {/* Section for Available Default Decks */}
      {!selectedDeckId && ( // Only show this section on the main deck overview
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 flex items-center">
            <LibraryBig size={28} className="mr-3 text-emerald-600" />
            Discover & Download Default Decks
          </h2>
          {loadingDefaultDecks && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="ml-2">Loading available decks...</p>
            </div>
          )}
          {downloadError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              Error: {downloadError}
            </div>
          )}
          {downloadSuccessMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
              {downloadSuccessMessage}
            </div>
          )}
          {!loadingDefaultDecks && defaultDecks.length === 0 && !error && ( // Added !error check
            <p className="text-gray-500 dark:text-gray-400">No default decks are currently available for download.</p>
          )}
          {!loadingDefaultDecks && defaultDecks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {defaultDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-white dark:bg-dark-200 p-5 rounded-lg shadow-md border border-gray-200 dark:border-dark-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-3xl mr-3">{deck.emoji || '📚'}</span>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{deck.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 h-16 overflow-y-auto">{deck.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                      Cards: {deck.card_count !== undefined ? deck.card_count : 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDownloadDefaultDeck(deck.id)}
                      className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center"
                      disabled={downloadingDeckId === deck.id}
                    >
                      {downloadingDeckId === deck.id ? (
                        <Loader2 size={16} className="animate-spin mr-1" />
                      ) : (
                        <Plus size={16} className="mr-1" />
                      )}
                      {downloadingDeckId === deck.id ? 'Adding...' : 'Download Deck'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* END Section for Available Default Decks */}
    </div>
  );
};

export default FlashcardDeck;
