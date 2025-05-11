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

  // Filter reviews for the selected day
  const reviewsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return reviews.filter(
      (review) =>
        review.next_review_date &&
        isSameDay(new Date(review.next_review_date), selectedDay)
    );
  }, [selectedDay, reviews]);

  // Group reviews by date for the current month view
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
                  </div>
                ) : (
                  <p className="text-red-600">Card details unavailable.</p>
                )}
                {/* Display Due Date */}
                {review.next_review_date && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {format(new Date(review.next_review_date), 'dd MMM yyyy')}
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
            const dayReviews = reviewsByDay[dayKey] || [];
            const hasReviews = dayReviews.length > 0;
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
                {hasReviews && (
                  <div className="relative">
                    <span className="mt-1 w-4 h-4 flex items-center justify-center bg-emerald-500 text-white rounded-full text-xs font-bold">
                      {dayReviews.length}
                    </span>
                    <span className="absolute inset-0 animate-ping h-4 w-4 rounded-full bg-emerald-500 opacity-75"></span>
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
                Reviews Due<span className="sm:hidden"><br/></span> {selectedDay ? format(selectedDay, 'dd MMMM yyyy') : ''}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-100 text-gray-700 dark:text-gray-300"
                aria-label="Close day view"
              >
                <X size={20} />
              </button>
            </div>

            {reviewsForSelectedDay.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No cards scheduled for review on this day.
              </p>
            ) : (
              <ul className="space-y-3">
                {reviewsForSelectedDay.map((review) => (
                  <li
                    key={review.id}
                    className="border border-gray-200 dark:border-dark-100 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors duration-200"
                  >
                    {review.card ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {review.card.english}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {review.card.arabic}
                          </p>
                          {review.card.transliteration && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                              {review.card.transliteration}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-600">Card details unavailable.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCalendar;
