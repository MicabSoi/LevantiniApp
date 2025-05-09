import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import CardView, { CardViewHandle } from './CardView';
import { AlertCircle, Settings } from 'lucide-react'; // ✅ Import AlertCircle, ADDED: Settings icon
import SettingsModal, { loadHotkeys, HotkeySettings } from './SettingsModal'; // ADDED: Import SettingsModal and loadHotkeys

interface DueCard {
  id: string; // review id
  card: { // This should be a single card object, not an array
    id: string;
    fields: {
      english: string;
      arabic: string;
      transliteration?: string;
      clozeText?: string;
      imageUrl?: string;
    };
    audio_url?: string | null;
    // Include other fields fetched in the select query for type accuracy
    english: string;
    arabic: string;
    transliteration?: string;
    image_url?: string;
    tags?: string[];
    type?: string;
    layout?: string;
    metadata?: any; // Use a more specific type if possible
    review_stats_id?: string; // Assuming this is a string UUID
  };
  last_review_date: string;
  next_review_date: string;
  interval: number;
  ease_factor: number;
  repetition_count: number;
  reviews_count: number;
  quality_history: number[];
  // Add other review columns if needed later, based on schema
  streak?: number;
  avg_response_time?: number;
}

const StudySession: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const decks = params.get('decks')?.split(',') || [];
  const count = Number(params.get('count') || 10);

  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [isAnswerVisible, setIsAnswerVisible] = useState(false); // State to track if answer is visible
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null); // ADDED: State for selected quality
  const [showPostReviewButtons, setShowPostReviewButtons] = useState(false); // ADDED: State to show Undo/Next buttons
  const [showSettingsModal, setShowSettingsModal] = useState(false); // ADDED: State to control settings modal visibility

  const cardViewRef = useRef<CardViewHandle>(null); // ADDED: Ref for CardView

  // Calculate the "due now" threshold timestamp once when the component mounts
  // for this specific set of URL parameters. This value will be stable.
  const dueThresholdTimestamp = useMemo(() => {
    console.log('Memoizing dueThresholdTimestamp'); // Debug log
    return new Date().toISOString();
  }, [decks.join(','), count]); // Recalculate if decks or count change

  // 1) Fetch due cards on mount or when decks/count change
  useEffect(() => {
    setError(null); // Clear previous errors
    async function loadDue() {
      console.log(
        `Attempting to fetch due cards for decks: ${decks.join(
          ','
        )} (count: ${count}) <= ${dueThresholdTimestamp}`
      ); // Debug log
      setLoading(true);

      console.log('DEBUG: Initiating Supabase fetch...'); // Add this log
      const { data, error } = await supabase
        .from('reviews') // Use the correct table name 'reviews'
        .select(
          `
          id,
          last_review_date,
          next_review_date,
          interval,
          ease_factor,
          repetition_count,
          reviews_count,
          quality_history,
          card:cards!reviews_card_fk (
            id,
            fields,
            audio_url
          )
        `
        )
        // Use the stable timestamp from useMemo
        .lte('next_review_date', dueThresholdTimestamp)
        .in('card.deck_id', decks)
        .limit(count)
        .order('next_review_date', { ascending: true });

      console.log('DEBUG: Supabase fetch attempt finished.'); // Add this log

      if (error) {
        console.error('Error fetching due cards:', error);
        setError('Failed to load cards for study session.'); // Set user-friendly error
        console.log('DEBUG: Error path taken, setting loading false.'); // Add this log
      } else {
        console.log('Successfully fetched due cards:', data); // Debug log
        // Filter out any potential null cards just in case
        // Cast to unknown first to satisfy TypeScript
        setDueCards(
          (data || []).filter((review: any) => review.card !== null) as unknown as DueCard[]
        );
        if (data && data.length > 0) {
          setCurrent(0); // Reset to the first card if cards are loaded
        }
        console.log('DEBUG: Success path taken, setting loading false.'); // Add this log
      }
      setLoading(false); // This should run in finally, but putting here too for extra check
    }

    // Only fetch if decks are selected
    if (decks && decks.length > 0) {
      loadDue();
    } else {
      console.log('No decks selected for study session.');
      setDueCards([]);
      setLoading(false);
    }

    // Effect dependencies: decks and count.
    // dueThresholdTimestamp is already reactive to these via useMemo,
    // but React hooks best practices recommend including values used inside,
    // even if they are memoized based on other dependencies listed.
    // This ensures the effect "sees" the correct, stable timestamp for the current parameters.
  }, [decks.join(','), count, dueThresholdTimestamp]); // Updated dependencies

  // 2) Handle quality grading, run SM-2, update review
  const onQualitySelect = async (quality: number) => {
    // Prevent grading if a quality has already been selected
    if (selectedQuality !== null) {
      console.log('Quality already selected for this card.');
      return;
    }

    const review = dueCards[current];
    if (!review) {
      console.error('No current review to grade.');
      return;
    }

    console.log(`Grading card ${review.card.id} with quality ${quality}`); // Debug log

    // call sm2_schedule RPC
    const { data: sched, error: rpcErr } = await supabase.rpc('calculate_sm2', {
      // Use calculate_sm2 as per SQL dump
      p_repetition_count: review.repetition_count,
      p_ease_factor: review.ease_factor,
      p_interval: review.interval,
      p_quality: quality,
    });

    if (rpcErr) {
      console.error('SM-2 RPC Error:', rpcErr);
      setError('Failed to update review stats.'); // Set user-friendly error
      // Still advance card to avoid getting stuck? Or stop session?
      // For now, let's advance to not block the user.
      if (current < dueCards.length - 1) {
        setCurrent(current + 1);
      } else {
        navigate('/flashcards'); // Session complete
      }
      return;
    }

    console.log('SM-2 calculation result:', sched); // Debug log

    const { next_interval, next_ease_factor, next_repetition_count } = (
      sched as any
    )[0]; // Match RPC function output names

    // update the review row
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        last_review_date: new Date().toISOString(),
        next_review_date: new Date(
          Date.now() + next_interval * 86400000 // Use next_interval
        ).toISOString(),
        interval: next_interval, // Use next_interval
        ease_factor: next_ease_factor, // Use next_ease_factor
        repetition_count: next_repetition_count, // Use next_repetition_count
        reviews_count: review.reviews_count + 1,
        quality_history: [...review.quality_history, quality],
      })
      .eq('id', review.id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      setError('Failed to save review progress.'); // Set user-friendly error
      // Advance card anyway
    } else {
      console.log('Review updated successfully. Displaying post-review options.'); // Debug log
      setSelectedQuality(quality); // ADDED: Set selected quality state
      setShowPostReviewButtons(true); // ADDED: Show post-review buttons
    }

    // REMOVED: Logic to move to next card or finish - this is now handled by handleNextCard
  };

  // ADDED: Function to handle moving to the next card
  const handleNextCard = () => {
    // Hide post-review buttons immediately when moving to next card
    setShowPostReviewButtons(false); 
    setSelectedQuality(null); // Clear selected quality
    setIsAnswerVisible(false); // Reset answer visibility for the next card

    if (current < dueCards.length - 1) {
      setCurrent(current + 1);
    } else {
      console.log('Session complete!'); // Debug log
      navigate('/flashcards'); // Go back to flashcard list or decks page
    }
  };

   // ADDED: Function to handle undoing the last review (UI state only for now)
   const handleUndoReview = () => {
      console.log('Undoing last review (UI state only).');
      // TODO: Implement actual database rollback or state reversal if needed
      setSelectedQuality(null); // Clear selected quality
      setShowPostReviewButtons(false); // Hide post-review buttons
      // Optionally, reset isAnswerVisible to true so they can re-grade immediately
      // setIsAnswerVisible(true);
      // Re-enable hotkeys by clearing selectedQuality state
   };

  // Add a useEffect for hotkey listeners
  useEffect(() => {
     const currentHotkeys = loadHotkeys(); // LOADED: Get current hotkeys from localStorage

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;

      // Prevent hotkeys from working when modal is open
      if (showSettingsModal) return;

      // Handle grading hotkeys only if the answer is visible AND no quality has been selected yet
      if (isAnswerVisible && selectedQuality === null) {
          switch(key) {
              case currentHotkeys.quality0:
                  onQualitySelect(0);
                  event.preventDefault();
                  break;
              case currentHotkeys.quality1:
                  onQualitySelect(1);
                  event.preventDefault();
                  break;
              case currentHotkeys.quality2:
                  onQualitySelect(2);
                  event.preventDefault();
                  break;
              case currentHotkeys.quality3:
                  onQualitySelect(3);
                  event.preventDefault();
                  break;
              default:
                  break;
          }
      }
      // Handle spacebar to flip the card only if the answer is NOT visible AND no quality has been selected yet
      else if (!isAnswerVisible && selectedQuality === null && key === currentHotkeys.next) { // MODIFIED: Use hotkey from settings
        cardViewRef.current?.flipCard(); // Call flipCard method on the CardView ref
        event.preventDefault(); // Prevent default behavior (e.g., scrolling)
      }
      // Handle Next key after grading
      else if (selectedQuality !== null && key === currentHotkeys.next) { // MODIFIED: Use hotkey from settings
          handleNextCard();
          event.preventDefault();
      }
       // Handle Undo key
      else if (selectedQuality !== null && key === currentHotkeys.undo) { // MODIFIED: Use hotkey from settings
         handleUndoReview();
         event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [onQualitySelect, isAnswerVisible, selectedQuality, showSettingsModal]); // ADDED: Depend on showSettingsModal

  // ADDED: Handle browser refresh/close and internal navigation prompts
  useEffect(() => {
    // Determine if session is active with unsaved progress
    const shouldBlockNavigation = dueCards.length > 0 && current < dueCards.length && !loading && !error;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlockNavigation) {
        event.preventDefault();
        event.returnValue = ''; // Required for some browsers
        return ''; // Message for others
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dueCards.length, current, loading, error]); // Depend on values that determine shouldBlockNavigation

  // Render loading, error, or content
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="ml-4 text-gray-700 dark:text-gray-300">
          Loading study session...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/study')} // Go back to selection
          className="mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          Go back
        </button>
      </div>
    );
  }

  // Add a function to force load more cards
  const forceLoadMoreCards = async () => {
    setError(null); // Clear previous errors
    setLoading(true);

    console.log(
      `Attempting to force fetch next ${count} cards for decks: ${decks.join(
        ','
      )}`
    );

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          id,
          last_review_date,
          next_review_date,
          interval,
          ease_factor,
          repetition_count,
          reviews_count,
          quality_history,
          card:cards!reviews_card_fk (
            id,
            fields,
            audio_url,
            english,
            arabic,
            transliteration,
            image_url,
            tags,
            type,
            layout,
            metadata,
            review_stats_id
          )
        `
        )
        .in('card.deck_id', decks)
        .limit(count)
        .order('next_review_date', { ascending: true }); // Order by next_review_date to get 'most due' first

      if (error) {
        console.error('Error force fetching cards:', error);
        setError('Failed to load more cards.');
      } else {
        console.log('Successfully force fetched cards:', data);
        const validCards = (data || []).filter(
          (review) => review.card !== null
        );
        // Cast to unknown first to satisfy TypeScript
        setDueCards(validCards as unknown as DueCard[]);
        if (validCards.length > 0) {
          setCurrent(0); // Start session with the first card
        } else {
          setError('No more cards found in the selected decks.');
        }
      }
    } catch (err) {
      console.error('Caught error during force fetch:', err);
      setError('An unexpected error occurred while fetching more cards.');
    } finally {
      setLoading(false);
    }
  };

  if (dueCards.length === 0) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-300">
        <p className="mb-4">
          No cards are due for review in the selected decks right now.
        </p>
        {/* Add the "Force Review" button */}
        <button
          onClick={forceLoadMoreCards}
          className="mb-4 mr-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" // Use a different color
        >
          Force Review Next {count} Cards
        </button>
        <button
          onClick={() => navigate('/study')} // Go back to selection
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          Select different decks
        </button>
      </div>
    );
  }

  // Display the current card
  const currentCard = dueCards[current].card;
  if (!currentCard) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Error: Could not load card details for the current review.</p>
        <button
          onClick={() => navigate('/study')} // Go back to selection
          className="mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          End Session
        </button>
      </div>
    );
  }

  return (
    <div
      className="p-6 max-w-xl mx-auto relative pb-20 min-h-screen"
      onClick={(e) => {
        // Only flip if answer is not visible and no quality selected, and not clicking on a button
        if (!isAnswerVisible && selectedQuality === null) {
          // Prevent if click is on a button or inside the bottom bar/post-review buttons
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('.fixed.bottom-0') ||
            target.closest('.fixed.bottom-32') ||
            target.closest('.post-review-buttons')
          ) {
            return;
          }
          cardViewRef.current?.flipCard();
        }
      }}
      onTouchStart={(e) => {
        // Only flip if answer is not visible and no quality selected, and not touching a button
        if (!isAnswerVisible && selectedQuality === null) {
          const touch = e.target as HTMLElement;
          if (
            touch.closest('button') ||
            touch.closest('.fixed.bottom-0') ||
            touch.closest('.fixed.bottom-32') ||
            touch.closest('.post-review-buttons')
          ) {
            return;
          }
          cardViewRef.current?.flipCard();
        }
      }}
    >
      {/* Pass the correct card object to CardView */}
      <CardView
        ref={cardViewRef} // ADDED: Pass the ref to CardView
        card={currentCard} // Pass the nested card object
        onQualitySelect={onQualitySelect} // Pass the quality
        onAnswerShown={() => setIsAnswerVisible(true)} // Pass the onAnswerShown function
        selectedQuality={selectedQuality} // ADDED: Pass selectedQuality to CardView
      />
      <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
        Card {current + 1} of {dueCards.length}
      </p>

      {/* ADDED: Post-review buttons (Undo and Next) */}
      {showPostReviewButtons && (
        <div className="flex justify-center space-x-4 mt-6 post-review-buttons">
          <button
            onClick={handleUndoReview}
            className="px-6 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            Undo
          </button>
          <button
            onClick={handleNextCard}
            className="px-6 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Next Card
          </button>
        </div>
      )}
      {/* END ADDED: Post-review buttons */}

      {/* Error message display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
          <AlertCircle size={20} className="inline mr-2" />
          {error}
        </div>
      )}

      {/* Settings button */}
      <button
        className="fixed bottom-32 right-6 p-3 rounded-full shadow-lg transition-colors z-50 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-600 bg-gray-100 dark:bg-dark-100 hover:bg-gray-200 dark:hover:bg-dark-200"
        onClick={() => setShowSettingsModal(true)} // MODIFIED: Open settings modal
        aria-label="Settings"
        style={{ zIndex: 60 }} // Ensure above most content, but below the bottom bar
      >
        <Settings size={28} />
      </button>
      {/* END ADDED: Settings button */}

      {/* Fixed Bottom Bar for Review Rating Buttons */}
      {isAnswerVisible && (
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-dark-200 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center py-3 px-2 z-50" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
          <button
            onClick={() => onQualitySelect(0)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-red-500 text-white text-xs font-bold hover:bg-red-600 min-w-0 ${selectedQuality === 0 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">0</span>
            <span className="block font-normal text-gray-200 text-[10px] leading-tight">Blackout</span>
          </button>
          <button
            onClick={() => onQualitySelect(1)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 min-w-0 ${selectedQuality === 1 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">1</span>
            <span className="block font-normal text-gray-200 text-[10px] leading-tight">Wrong but familiar</span>
          </button>
          <button
            onClick={() => onQualitySelect(2)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-600 min-w-0 ${selectedQuality === 2 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">2</span>
            <span className="block font-normal text-gray-200 dark:text-white text-[10px] leading-tight">Hesitation</span>
          </button>
          <button
            onClick={() => onQualitySelect(3)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-green-500 text-white text-xs font-bold hover:bg-green-600 min-w-0 ${selectedQuality === 3 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">3</span>
            <span className="block font-normal text-gray-200 text-[10px] leading-tight">Perfect</span>
          </button>
        </div>
      )}
      {/* END: Fixed Bottom Bar */}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} /> {/* ADDED: Settings Modal component */}
      {/* END Settings Modal */}
    </div>
  );
};

export default StudySession;

// ADDED: Interface for SM-2 results for type safety
// Assuming the RPC returns an array of objects with these properties
interface SM2Result {
  next_interval: number;
  next_ease_factor: number;
  next_repetition_count: number;
}
