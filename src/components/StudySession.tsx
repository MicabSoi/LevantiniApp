import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import CardView from './CardView';
import { AlertCircle } from 'lucide-react'; // ✅ Import AlertCircle

interface DueCard {
  id: string; // review id
  card: {
    id: string;
    fields: {
      english: string;
      arabic: string;
      transliteration?: string;
      clozeText?: string;
      imageUrl?: string;
    };
    audio_url?: string | null; // Added audio_url based on the query in logs
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
        setDueCards(
          (data || []).filter((card) => card.card !== null) as DueCard[]
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

  // 2) Handle quality grading, run SM-2, update review, advance card
  const onQualitySelect = async (quality: number) => {
    // Removed cardId as it's available from current card
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
      console.log('Review updated successfully. Moving to next card.'); // Debug log
    }

    // move to next card or finish
    if (current < dueCards.length - 1) {
      setCurrent(current + 1);
    } else {
      console.log('Session complete!'); // Debug log
      navigate('/flashcards'); // Go back to flashcard list or decks page
    }
  };

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
        setDueCards(validCards as DueCard[]);
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
    <div className="p-6">
      {/* Pass the correct card object to CardView */}
      <CardView
        card={currentCard} // Pass the nested card object
        onQualitySelect={(quality) => onQualitySelect(quality)} // Pass the quality
      />
      <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
        Card {current + 1} of {dueCards.length}
      </p>
    </div>
  );
};

export default StudySession;
