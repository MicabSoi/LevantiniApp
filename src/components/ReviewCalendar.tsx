// src/components/ReviewCalendar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isPast,
  isSameMonth,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Define a type for the data structure returned by the reviews fetch
interface Review {
  id: string; // review id
  card: {
    id: string;
    english: string;
    arabic: string;
    transliteration?: string | null;
  } | null; // card can be null if RLS prevents access or card deleted
  next_review_date: string | null;
  last_review_date: string | null;
}

interface ReviewCalendarProps {
  // Add any necessary props, like navigation handlers if needed later
  onCardClick?: (cardId: string) => void; // Optional handler if clicking card links to detail
  // Maybe add a prop to allow navigating to a study session for a specific day?
}

const ReviewCalendar: React.FC<ReviewCalendarProps> = ({ onCardClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Effect to close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedDay) { // Check if the modal is open
          setSelectedDay(null); // Close the modal
        }
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedDay]); // Re-run effect if selectedDay (modal state) changes

  // Calculate the start and end dates for the currently displayed month
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  // Fetch reviews for the current month + a buffer
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      console.log(
        // Removed date range filtering to show all reviews for all cards
        `Fetching all reviews for user's cards.`
      );

      try {
        // Fetch reviews along with minimal card details
        const { data, error } = await supabase
          .from('reviews')
          .select(
            `
            id,
            next_review_date,
            last_review_date,
            card:cards!reviews_card_fk (
              id,
              english,
              arabic,
              transliteration
            )
          `
          );

        if (error) {
          throw error;
        }

        // Filter out reviews where the card data is null (e.g. if RLS prevents access or card deleted)
        const validReviews = data
          ? data.filter((review) => review.card !== null)
          : [];
        
        // Type casting to ensure it matches our Review type
        setReviews(validReviews as unknown as Review[]);
        console.log('Fetched reviews:', validReviews);
      } catch (err: any) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load review schedule.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [currentMonth]); // Refetch when the month changes

  const handlePrevMonth = () => {
    setSelectedDay(null); // Clear selected day
    setCurrentMonth(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDay(null); // Clear selected day
    setCurrentMonth(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (day: Date) => {
    // Toggle the selected day
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null); // Deselect if clicking the same day
    } else {
      setSelectedDay(day); // Select the new day
    }
  };

  // Filter reviews for the selected day (Upcoming reviews)
  const reviewsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return reviews.filter(
      (review) =>
        review.next_review_date &&
        isSameDay(new Date(review.next_review_date), selectedDay)
    );
  }, [selectedDay, reviews]);

  // Group reviews by date for the current month view (Upcoming reviews)
  const reviewsByDay: { [key: string]: Review[] } = useMemo(() => {
    const grouped: { [key: string]: Review[] } = {};
    reviews.forEach((review) => {
      if (review.next_review_date) {
        const dateKey = format(new Date(review.next_review_date), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(review);
      }
    });
    return grouped;
  }, [reviews]);

  // ADDED: Group reviews by last_review_date for past dates
  const completedReviewsByDay: { [key: string]: Review[] } = useMemo(() => {
    const grouped: { [key: string]: Review[] } = {};
    const today = new Date();
    reviews.forEach((review) => {
      if (review.last_review_date) {
         const reviewDate = new Date(review.last_review_date);
         // Only consider last_review_date for days strictly in the past
         if (isPast(reviewDate) && !isToday(reviewDate)) {
            const dateKey = format(reviewDate, 'yyyy-MM-dd');
            if (!grouped[dateKey]) {
              grouped[dateKey] = [];
            }
            grouped[dateKey].push(review);
         }
      }
    });
    return grouped;
  }, [reviews]);

  const completedOnSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return reviews.filter(
      (review) =>
        review.last_review_date &&
        isSameDay(new Date(review.last_review_date), selectedDay)
    );
  }, [selectedDay, reviews]);

  // Reviews that were scheduled for the selectedDay but not completed on selectedDay
  const incompleteForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return reviews.filter((review) => {
      const isScheduledForDay = review.next_review_date && isSameDay(new Date(review.next_review_date), selectedDay);
      // A review is incomplete if it was scheduled for the day and not completed on that day,
      // OR if it was scheduled for a day in the past and still shows this next_review_date (meaning it was missed)
      // and it's not yet completed on a later date before selectedDay.
      // For simplicity here: scheduled for selectedDay AND not completed on selectedDay.
      const isCompletedOnDay = review.last_review_date && isSameDay(new Date(review.last_review_date), selectedDay);
      return isScheduledForDay && !isCompletedOnDay;
    });
  }, [selectedDay, reviews]);

  // Determine the day of the week for the first day of the month (0 for Sunday, 6 for Saturday)
  const startingDayIndex = startDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter reviews based on search query
  const filteredReviews = useMemo(() => {
    if (!searchQuery) return [];

    const lowerCaseQuery = searchQuery.toLowerCase();
    return reviews.filter(review =>
      review.card && (
        review.card.english.toLowerCase().includes(lowerCaseQuery) ||
        review.card.arabic.toLowerCase().includes(lowerCaseQuery) ||
        (review.card.transliteration && review.card.transliteration.toLowerCase().includes(lowerCaseQuery))
      )
    );
  }, [searchQuery, reviews]);

  // Handle clicking a search result
  const handleSearchResultClick = (review: Review) => {
    if (review.next_review_date) {
      const reviewDate = new Date(review.next_review_date);
      // Check if the review date is in the current month, otherwise navigate
      if (!isSameMonth(reviewDate, currentMonth)) {
        setCurrentMonth(startOfMonth(reviewDate));
      }
      setSelectedDay(reviewDate); // Select the day to open the modal
      setSearchQuery(''); // Clear search query
    }
  };

  return (
    <div className="p-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back
      </button>

      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Review Schedule
      </h2>

      {/* Search Input */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search for cards..."
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-dark-300 dark:border-dark-100 dark:text-gray-100"
          value={searchQuery}
          onChange={handleSearchInputChange}
        />
        {/* Dropdown */}
        {searchQuery && filteredReviews.length > 0 && (
          <ul className="absolute z-10 w-full bg-white dark:bg-dark-200 border border-gray-200 dark:border-dark-100 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
            {filteredReviews.map((review) => (
              <li
                key={review.id}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-100 cursor-pointer text-gray-800 dark:text-gray-100 flex justify-between items-center"
                onClick={() => handleSearchResultClick(review)}
              >
                {/* Display relevant card info */}
                {review.card ? (
                  <div className="flex-1 mr-4">
                    <p className="font-medium">{review.card.english}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{review.card.arabic}</p>
                    {review.card.transliteration && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{review.card.transliteration}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">Card details unavailable.</p>
                )}
                {/* Display Due Date */}
                {review.next_review_date && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Next Due Date: {format(new Date(review.next_review_date), 'dd MMM yyyy')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md flex items-start">
          <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 p-6 mb-6">
        {/* Added Today button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Today
          </button>
        </div>

        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Render empty cells for days before the 1st of the month */}
          {Array.from({ length: startingDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="h-12 p-1"></div>
          ))}

          {/* Render days of the month */}
          {daysInMonth.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayReviews = reviewsByDay[dayKey] || []; // Upcoming reviews
            const completedToday = isToday(day) ? reviews.filter(review => review.last_review_date && isSameDay(new Date(review.last_review_date), day)).length : 0; // Count completed reviews today
            const dayCompletedReviews = completedReviewsByDay[dayKey] || []; // Completed reviews in the past

            const hasUpcomingReviews = dayReviews.length > 0;
            const hasCompletedReviews = dayCompletedReviews.length > 0 || completedToday > 0;

            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isPastDay = isPast(day) && !isToday(day);
            const isTodayDay = isToday(day);

            return (
              <div
                key={dayKey}
                className={`
                  h-16 flex flex-col items-center justify-start p-1 text-xs rounded-md cursor-pointer
                  border border-gray-200 dark:border-dark-100
                  transition-all duration-300 ease-in-out
                  text-gray-800 dark:text-gray-200 ${
                    isPastDay
                      ? 'bg-gray-300 dark:bg-dark-300 text-gray-400'
                      : 'bg-gray-50 dark:bg-dark-100 hover:bg-gray-100 dark:hover:bg-dark-300'
                  }
                  ${
                    isSelected
                      ? 'bg-emerald-200 dark:bg-emerald-800 border-emerald-500'
                      : ''
                  }
                  ${isTodayDay ? 'border-emerald-500 border-2' : ''}
                `}
                onClick={() => handleDayClick(day)}
              >
                <span
                  className={`font-bold ${
                    isTodayDay ? 'text-emerald-700 dark:text-emerald-300' : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Display Upcoming Reviews count */}
                {hasUpcomingReviews && (
                  <div className="relative mt-1">
                    <span className="w-4 h-4 flex items-center justify-center bg-emerald-500 text-white rounded-full text-xs font-bold z-10">
                      {dayReviews.length}
                    </span>
                    {/* Add a smaller dot for upcoming reviews */}
                    {!isTodayDay && <span className="absolute inset-0 animate-ping h-4 w-4 rounded-full bg-emerald-500 opacity-75"></span>}
                  </div>
                )}

                {/* Display Completed Reviews count for past days or today */}
                {isPastDay && hasCompletedReviews && (
                   <div className="relative mt-1">
                     {/* Use a different color for completed reviews, e.g., gray or blue */}
                     <span className="w-4 h-4 flex items-center justify-center bg-gray-500 text-white rounded-full text-xs font-bold">
                       {dayCompletedReviews.length}
                     </span>
                   </div>
                )}
                 {isTodayDay && completedToday > 0 && (
                   <div className="relative mt-1">
                     {/* Use a different color for completed reviews today */}
                     <span className="w-4 h-4 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs font-bold">
                       {completedToday}
                     </span>
                   </div>
                 )}

              </div>
            );
          })}
        </div>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
              Loading reviews...
            </span>
          </div>
        )}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) setSelectedDay(null); }}>
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Details for {selectedDay ? format(selectedDay, 'PPP') : ''}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300"
                aria-label="Close day view"
              >
                <X size={20} />
              </button>
            </div>

            {/* Display Completed Reviews */}
            {completedOnSelectedDay.length > 0 && (
              <>
                <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700 dark:text-gray-300">
                  {completedOnSelectedDay.length} Review{completedOnSelectedDay.length !== 1 ? 's' : ''} Completed
                </h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {completedOnSelectedDay.map((review) => {
                    if (!review.card) {
                      return (
                        <li key={review.id} className="border border-gray-200 dark:border-dark-100 rounded-md p-2">
                          <p className="text-red-600">Card details unavailable.</p>
                        </li>
                      );
                    }
                    return (
                      <li key={review.id} className="border border-gray-200 dark:border-dark-100 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors duration-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{review.card.english}</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">{review.card.arabic}</p>
                            {review.card.transliteration && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 italic">{review.card.transliteration}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Display Incomplete Reviews */}
            {incompleteForSelectedDay.length > 0 && (
              <>
                <h4 className="text-md font-semibold mt-3 mb-1 text-gray-700 dark:text-gray-300">
                  {incompleteForSelectedDay.length} Review{incompleteForSelectedDay.length !== 1 ? 's' : ''} Due But Not Completed
                </h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {incompleteForSelectedDay.map((review) => {
                    if (!review.card) {
                      return (
                        <li key={review.id} className="border border-gray-200 dark:border-dark-100 rounded-md p-2">
                          <p className="text-red-600">Card details unavailable.</p>
                        </li>
                      );
                    }
                    // Use base classes for normal readability
                    const itemClass = "border border-gray-200 dark:border-dark-100 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors duration-200";
                    const textClass = "text-gray-900 dark:text-gray-100";
                    const subTextClass = "text-gray-700 dark:text-gray-300";
                    const italicTextClass = "text-gray-600 dark:text-gray-400";

                    return (
                      <li key={review.id} className={itemClass}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className={`text-xs font-medium ${textClass}`}>{review.card.english}</p>
                            <p className={`text-xs ${subTextClass}`}>{review.card.arabic}</p>
                            {review.card.transliteration && (
                              <p className={`text-xs italic ${italicTextClass}`}>{review.card.transliteration}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* No reviews message if both lists are empty */}
            {completedOnSelectedDay.length === 0 && incompleteForSelectedDay.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                No scheduled or completed reviews for this day.
              </p>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCalendar;
