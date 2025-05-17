import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import CardView, { CardViewHandle } from './CardView';
import { AlertCircle, Settings, Loader2, X } from 'lucide-react'; // ✅ Import AlertCircle, ADDED: Settings icon, ADDED: Loader2, ADDED: X
import SettingsModal, { StudySettings, loadStudySettings as loadInitialStudySettings, HotkeySettings } from './SettingsModal'; // MODIFIED: Removed DEFAULT_HOTKEYS from import
import ReviewCalendar from './ReviewCalendar'; // ADDED: Import ReviewCalendar component
import UploadProgressModal from './UploadProgressModal'; // ADDED: Import UploadProgressModal

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

// Define interface for hotkey settings structure if not imported
// export interface HotkeySettings { ... }

// Default hotkeys (can define locally or import if exported)
const DEFAULT_HOTKEYS: HotkeySettings = {
  undo: 'z',
  next: ' ',
  quality0: '1',
  quality1: '2',
  quality2: '3',
  quality3: '4',
};

// ADDED: Interface for the data we will collect for batch update
interface ReviewUpdateData {
  id: string;
  card_id: string;
  last_review_date: string;
  next_review_date: string;
  interval: number;
  ease_factor: number;
  repetition_count: number;
  reviews_count: number;
  quality_history: number[];
}

// ADDED: Interface for SM-2 results for type safety
// Assuming the RPC returns an array of objects with these properties
interface SM2Result {
  next_interval: number;
  next_ease_factor: number;
  next_repetition_count: number;
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
  const [studySettings, setStudySettings] = useState<StudySettings | null>(null); // ADDED: State for all study settings
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false); // ADDED: State to control exit confirmation modal visibility
  const [reviewHistory, setReviewHistory] = useState<{cardIdx: number, selected: number | null}[]>([]); // For undo

  // ADDED: State to store completed review data before batch upload
  const [completedReviewsData, setCompletedReviewsData] = useState<ReviewUpdateData[]>([]);
  // ADDED: State for upload modal visibility and progress
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const cardViewRef = useRef<CardViewHandle>(null); // ADDED: Ref for CardView

  // Calculate the "due now" threshold timestamp once when the component mounts
  // for this specific set of URL parameters. This value will be stable.
  const dueThresholdTimestamp = useMemo(() => {
    console.log('Memoizing dueThresholdTimestamp'); // Debug log
    return new Date().toISOString();
  }, [decks.join(','), count]);

  // Fetch initial study settings on mount
  useEffect(() => {
    const fetchInitialSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const settings = await loadInitialStudySettings(user);
      setStudySettings(settings);
      // setLoading(false); // Loading for cards is separate
    };
    fetchInitialSettings();
  }, []);

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
            english,
            arabic,
            transliteration,
            image_url,
            audio_url,
            tags,
            type,
            layout,
            metadata
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

  // 2) Handle quality grading, run SM-2, update review - NOW STORES DATA & RETURNS IT
  const onQualitySelect = async (quality: number): Promise<ReviewUpdateData | null> => {
    const review = dueCards[current];
    if (!review) {
      console.error('No current review to grade.');
      return null;
    }

    console.log(`Grading card ${review.card.id} with quality ${quality}`);

    const { data: sched, error: rpcErr } = await supabase.rpc('calculate_sm2', {
      p_repetition_count: review.repetition_count,
      p_ease_factor: review.ease_factor,
      p_interval: review.interval,
      p_quality: quality,
    });

    if (rpcErr) {
      console.error('SM-2 RPC Error:', rpcErr);
      setError('Failed to update review stats.');
      return null;
    }

    console.log('SM-2 calculation result:', sched);

    const { next_interval, next_ease_factor, next_repetition_count } = (sched as any)[0];

    const updatedReviewData: ReviewUpdateData = {
      id: review.id,
      card_id: review.card.id,
      last_review_date: new Date().toISOString(),
      next_review_date: new Date(Date.now() + next_interval * 86400000).toISOString(),
      interval: next_interval,
      ease_factor: next_ease_factor,
      repetition_count: next_repetition_count,
      reviews_count: review.reviews_count + 1,
      quality_history: [...review.quality_history, quality],
    };

    // For all cards except the last one, add to state. The last one will be passed directly.
    if (current < dueCards.length - 1) {
        setCompletedReviewsData(prevData => [...prevData, updatedReviewData]);
    }
    
    return updatedReviewData; // RETURN the data
  };

  // Modified: Allow changing selection, submit on double-click/second click
  const handleRatingClick = async (quality: number) => {
    if (selectedQuality === quality) {
      // Second click on the same button: submit the selected quality and move to next card.
      // handleNextCard will take care of submitting the current selectedQuality.
      await handleNextCard();
    } else {
      // First click on this button, or changing selection.
      // Just update the UI selection. Do not submit the review yet.
      setSelectedQuality(quality);
      setShowPostReviewButtons(true); // Show "Next Card" and "Undo" buttons.
    }
  };

  // Modified: Save review history for undo AND submit selected quality if any
  const handleNextCard = async () => {
    let finalCardDataForUpload: ReviewUpdateData | null = null;

    if (selectedQuality !== null) {
      finalCardDataForUpload = await onQualitySelect(selectedQuality);
    }

    setReviewHistory(prev => [...prev, { cardIdx: current, selected: selectedQuality }]);
    setShowPostReviewButtons(false);
    setSelectedQuality(null);
    setIsAnswerVisible(false);

    if (current === dueCards.length - 1) {
      console.log("Study session completed. Preparing to upload results.");
      // Pass the review data for the final card directly to the upload function
      await uploadCompletedReviews(finalCardDataForUpload);
    } else {
      setCurrent(current + 1);
    }
  };

  // ADDED: Function to upload completed reviews in a batch
  const uploadCompletedReviews = async (finalCardReviewData?: ReviewUpdateData | null) => {
    let reviewsToUpload = [...completedReviewsData];
    if (finalCardReviewData) {
      // Ensure the final card's data isn't duplicated if onQualitySelect already added it
      // This check might be redundant if onQualitySelect logic is adjusted, but safe for now.
      if (!reviewsToUpload.find(r => r.id === finalCardReviewData.id)) {
        reviewsToUpload.push(finalCardReviewData);
      }
    }

    if (reviewsToUpload.length === 0) {
      console.log("No completed reviews to upload.");
      navigate('/flashcards');
      return;
    }

    setUploadProgress(`Preparing to upload ${reviewsToUpload.length} review(s)...`);
    setShowUploadModal(true);

    console.log(`Attempting to upload ${reviewsToUpload.length} reviews in batch:`, reviewsToUpload);

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      setUploadProgress(`Uploading... 0/${reviewsToUpload.length} synced`);
      const { error } = await supabase
        .from('reviews')
        .upsert(reviewsToUpload, { onConflict: 'id' });

      if (error) {
        console.error('Batch upload error:', error);
        setUploadProgress(`Upload failed: ${error.message}. Code: ${error.code}. Details: ${error.details}. Hint: ${error.hint}`);
        setError('Failed to save all review progress.');
      } else {
        console.log('Batch upload successful.');
        setUploadProgress(`Upload complete! ${reviewsToUpload.length}/${reviewsToUpload.length} synced`);
        setCompletedReviewsData([]); // Clear the accumulated state
        setTimeout(() => {
          setShowUploadModal(false);
          navigate('/flashcards');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Caught error during batch upload:', err);
      setUploadProgress(`Upload failed: An unexpected error occurred. ${err.message}`);
      setError('An unexpected error occurred during upload.');
    }
  };

  // Modified: Undo goes back to previous card and restores selection
  const handleUndoReview = () => {
    if (reviewHistory.length > 0) {
      const last = reviewHistory[reviewHistory.length - 1];
      setCurrent(last.cardIdx);
      setSelectedQuality(last.selected);
      setShowPostReviewButtons(!!last.selected);
      setIsAnswerVisible(true);
      setReviewHistory(prev => prev.slice(0, -1));
    } else {
      setSelectedQuality(null);
      setShowPostReviewButtons(false);
      setIsAnswerVisible(false);
    }
  };

  // Add a useEffect for hotkey listeners
  useEffect(() => {
    if (!studySettings) return; // Don't attach listener if settings not loaded

    const handleKeyPress = async (event: KeyboardEvent) => { // Made async
      console.log('Key pressed:', event.key, 'isAnswerVisible:', isAnswerVisible, 'selectedQuality:', selectedQuality);
      if (showSettingsModal || showExitConfirmModal) return;

      // FIXED: Use event.key directly for spacebar
      const key = event.key;
      const isModifierKey = event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;

      // Priority 1: Flipping the card if it's front-facing and no quality is selected
      if (!isAnswerVisible && selectedQuality === null && !isModifierKey) {
        // Prevent flipping if a dialog/input within settings modal might be active,
        // though showSettingsModal check above should cover this.
        // This check is broad for "any key".
        cardViewRef.current?.flipCard();
        event.preventDefault();
        return; // Flip action takes precedence, further hotkey processing stops
      }

      // Priority 2: Actions when answer is visible or a quality is already selected (even if answer just became visible)
      if (isAnswerVisible) {
        let newSelectedQualityViaHotkey: number | null = null;
        if (key === studySettings.hotkeys.quality0) newSelectedQualityViaHotkey = 0;
        else if (key === studySettings.hotkeys.quality1) newSelectedQualityViaHotkey = 1;
        else if (key === studySettings.hotkeys.quality2) newSelectedQualityViaHotkey = 2;
        else if (key === studySettings.hotkeys.quality3) newSelectedQualityViaHotkey = 3;

        if (newSelectedQualityViaHotkey !== null) {
          // Always set the quality on first press, regardless of behavior setting
          setSelectedQuality(newSelectedQualityViaHotkey);
          setShowPostReviewButtons(true); // Ensure Next/Undo buttons are shown

          // NEW LOGIC: Handle submission based on hotkey_behavior setting
          if (studySettings.hotkey_behavior === 'single-press') {
            console.log('Single-press hotkey behavior: Submitting review.');
            await handleNextCard(); // Immediately submit on single press
          } else { // double-press behavior
             console.log('Double-press hotkey behavior: Selected quality.', newSelectedQualityViaHotkey);
             // The second press/spacebar will trigger handleNextCard via the next hotkey logic below
          }

          event.preventDefault();
          return; // Rating hotkey handled
        }

        // "Next Card" hotkey (e.g., spacebar)
        // This is used for submission ONLY in double-press mode AFTER a quality is selected.
        // In single-press mode, quality hotkeys handle submission.
        console.log('Checking next hotkey (with quality) for double-press mode:', 'key=', key, 'expected=', studySettings.hotkeys.next, 'selectedQuality=', selectedQuality, 'behavior=', studySettings.hotkey_behavior);
        if (studySettings.hotkey_behavior === 'double-press' && key === studySettings.hotkeys.next && selectedQuality !== null) {
          console.log('Double-press Next hotkey condition met. Calling handleNextCard().');
          await handleNextCard(); // This will submit the current selectedQuality
          event.preventDefault();
          return; // Next hotkey handled
        }

        // "Undo" hotkey
        if (key === studySettings.hotkeys.undo && reviewHistory.length > 0) { // Only allow undo if there's history
          handleUndoReview();
          event.preventDefault();
          return; // Undo hotkey handled
        }

        // NEW: Prevent default scroll for spacebar if answer is visible, no quality selected, and not handled by above.
        // This condition is met if key is the 'next' hotkey (spacebar) and selectedQuality was null (otherwise previous block handled it).
        if (key === studySettings.hotkeys.next) { 
          console.log('Spacebar pressed (or configured \'next\' hotkey) with answer visible, and no quality selected or other action taken. Preventing scroll.');
          event.preventDefault();
          return; // Spacebar does nothing else in this specific state beyond preventing scroll.
        }
      }
      
      // Note: The original logic for flipping with the 'next' hotkey when !isAnswerVisible
      // is now covered by the broader "any non-modifier key" flip logic at the top.
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [studySettings, onQualitySelect, isAnswerVisible, selectedQuality, showSettingsModal, showExitConfirmModal, handleNextCard, handleUndoReview]);

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

  // Handle settings save from modal
  const handleSettingsSave = (newSettings: StudySettings) => {
    setStudySettings(newSettings);
    // Hotkeys will be re-applied by the keydown listener's useEffect dependency on studySettings
  };

  // Render loading, error, or content
  if (loading || !studySettings) { // Also wait for studySettings to load
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

  // ADDED: Check for upload modal state here
  if (showUploadModal) {
    // Render only the modal if it's showing
    // FIXED: Pass uploadProgress to the message prop
    return <UploadProgressModal isOpen={showUploadModal} message={uploadProgress} />;
  }

  if (dueCards.length === 0) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-300">
        <p className="mb-4">
          No cards are due for review in the selected decks right now.
        </p>
        {/* Add the "Force Review" button */}
        <button
          onClick={forceLoadMoreCards}
          className="mb-4 mr-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          Load More Cards
        </button>
        <button
          onClick={() => navigate('/study')} // Go back to selection
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 mb-8"
        >
          Select different decks
        </button>
        
        {/* ADDED: Calendar UI for upcoming reviews */}
        <div className="mt-8 border-t pt-8 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4">Upcoming Reviews</h3>
          <p className="mb-6 text-sm">View your upcoming reviews on the calendar. Days with scheduled reviews are marked with a green dot.</p>
          <ReviewCalendar />
        </div>
      </div>
    );
  }

  // Display the current card
  const reviewItem = dueCards[current]; // Renamed to avoid confusion with the card object itself
  if (!reviewItem || !reviewItem.card) { // Check both reviewItem and its card property
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

  // Prepare the card data for CardView, ensuring fields object exists
  const cardForView = {
    ...reviewItem.card, // Spread the rest of the card properties (id, audio_url etc.)
    fields: {
      english: reviewItem.card.english || (reviewItem.card.fields && reviewItem.card.fields.english) || '',
      arabic: reviewItem.card.arabic || (reviewItem.card.fields && reviewItem.card.fields.arabic) || '',
      transliteration: reviewItem.card.transliteration || (reviewItem.card.fields && reviewItem.card.fields.transliteration),
      // Add other fields as needed, e.g., imageUrl, clozeText
      imageUrl: reviewItem.card.image_url || (reviewItem.card.fields && reviewItem.card.fields.imageUrl),
    }
  };

  return (
    <div
      className="h-screen overflow-hidden flex flex-col max-w-xl mx-auto"
    >
      <div 
        className="flex-grow overflow-y-auto p-6 relative pb-44" // pb-44 for bottom fixed bars
        onClick={(e: React.MouseEvent<HTMLDivElement>) => { // Added type for e
          if (!isAnswerVisible && selectedQuality === null) {
            const target = e.target as HTMLElement;
            if (
              target.closest('button') ||
              target.closest('.fixed.bottom-0') ||
              target.closest('.fixed.bottom-40') ||
              target.closest('.post-review-buttons')
            ) {
              return;
            }
            cardViewRef.current?.flipCard();
          }
        }}
        onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => { // Added type for e
          if (!isAnswerVisible && selectedQuality === null) {
            const touch = e.target as HTMLElement;
            if (
              touch.closest('button') ||
              touch.closest('.fixed.bottom-0') ||
              touch.closest('.fixed.bottom-40') ||
              touch.closest('.post-review-buttons')
            ) {
              return;
            }
            cardViewRef.current?.flipCard();
          }
        }}
      >
        {/* CardView and its sibling paragraph are direct children of this div */}
        <CardView
          ref={cardViewRef}
          card={cardForView}
          onQualitySelect={onQualitySelect} // This prop is part of CardViewProps
          onAnswerShown={() => setIsAnswerVisible(true)} // This prop is part of CardViewProps
          selectedQuality={selectedQuality} // This prop is part of CardViewProps
          studyDirection={studySettings.study_direction} // This prop is part of CardViewProps
          showTransliteration={studySettings.show_transliteration} // This prop is part of CardViewProps
        />
        <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
          Card {current + 1} of {dueCards.length}
        </p>
      </div> {/* End of scrollable content area */}

      {/* Fixed Bottom Bar for Review Rating Buttons */}
      {isAnswerVisible && (
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-dark-200 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center py-3 px-2 z-50" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
          <button
            onClick={() => handleRatingClick(0)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-red-500 text-white text-xs sm:text-sm leading-tight ${selectedQuality === 0 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">1</span>
            <span className="block font-normal text-gray-200 text-xs sm:text-sm leading-tight">Blackout</span>
          </button>
          <button
            onClick={() => handleRatingClick(1)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-orange-500 text-white text-xs sm:text-sm leading-tight ${selectedQuality === 1 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">2</span>
            <span className="block font-normal text-gray-200 text-xs sm:text-sm leading-tight">Wrong but familiar</span>
          </button>
          <button
            onClick={() => handleRatingClick(2)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-yellow-500 text-white text-xs sm:text-sm leading-tight ${selectedQuality === 2 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">3</span>
            <span className="block font-normal text-gray-200 dark:text-white text-xs sm:text-sm leading-tight">Hesitation</span>
          </button>
          <button
            onClick={() => handleRatingClick(3)}
            className={`flex-1 mx-1 flex flex-col items-center justify-center p-0 h-20 rounded-md bg-green-500 text-white text-xs sm:text-sm leading-tight ${selectedQuality === 3 ? 'border-4 border-black dark:border-white' : ''}`}
            style={{ minWidth: 0 }}
          >
            <span className="text-lg">4</span>
            <span className="block font-normal text-gray-200 text-xs sm:text-sm leading-tight">Perfect</span>
          </button>
        </div>
      )}

      {/* Bottom controls: Undo (left), Next Card (center), Settings/Exit (right) */}
      <div className="fixed bottom-40 left-0 w-full flex justify-between items-center px-6 z-50">
        {/* Undo button bottom left - conditionally rendered */}
        {reviewHistory.length > 0 && (
          <button
            onClick={handleUndoReview}
            className="p-3 rounded-full shadow-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
            style={{ position: 'absolute', left: '1.5rem' }}
          >
            Undo
          </button>
        )}
        {/* Next Card button center */}
        {showPostReviewButtons && (
          <button
            onClick={handleNextCard}
            className="px-8 py-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 mx-auto"
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          >
            Next Card
          </button>
        )}
        {/* Settings/Exit bottom right */}
        <div className="flex space-x-2" style={{ position: 'absolute', right: '1.5rem' }}>
          <button
            className="p-3 rounded-full shadow-lg transition-colors text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-600 bg-gray-100 dark:bg-dark-100 hover:bg-gray-200 dark:hover:bg-gray-200"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            className="p-3 rounded-full shadow-lg transition-colors bg-red-600 text-white hover:bg-red-700"
            onClick={() => setShowExitConfirmModal(true)}
            aria-label="Exit study session"
          >
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {studySettings && (
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
          onSettingsSave={handleSettingsSave} 
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) setShowExitConfirmModal(false); }}>
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">End Study Session?</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Are you sure you want to end the current study session? Your progress on unsaved cards will be lost.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="px-6 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/study')} // Navigate back to study selection
                className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySession;
