// src/components/ReviewCalendar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isPast,
} from 'date-fns';

// Use the Card type defined previously
import { Database } from '../types/supabase';
type Card = Database['public']['Tables']['cards']['Row'];

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

  // Calculate the start and end dates for the currently displayed month
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  // Fetch reviews for the current month + a buffer
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      // Fetch reviews for ~1 month around the current view
      const fetchStartDate = startOfMonth(currentMonth);
      const fetchEndDate = endOfMonth(currentMonth);

      // Adjust range slightly to cover potential edge cases or see upcoming reviews
      // Let's fetch reviews due within the next 3 months from today for simplicity
      const today = new Date();
      const reviewRangeStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 30 // Fetch some past due cards too? Or just future? Let's focus on future.
      );
      const reviewRangeEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 3, // Fetch up to 3 months ahead
        today.getDate()
      );

      console.log(
        `Fetching reviews due between ${reviewRangeStart.toISOString()} and ${reviewRangeEnd.toISOString()}`
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
          )
          .gte('next_review_date', reviewRangeStart.toISOString()) // >= start of range
          .lte('next_review_date', reviewRangeEnd.toISOString()); // <= end of range

        if (error) {
          throw error;
        }

        // Filter out reviews where the card data is null (e.g. if RLS prevents access or card deleted)
        const validReviews = data
          ? data.filter((review) => review.card !== null)
          : [];
        setReviews(validReviews as Review[]);
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
    setSelectedDay(day);
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Review Schedule
      </h2>

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
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-100"
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
                  ${
                    isPastDay
                      ? 'bg-gray-100 dark:bg-dark-300 text-gray-400'
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
                  <span className="mt-1 w-4 h-4 flex items-center justify-center bg-emerald-500 text-white rounded-full text-xs font-bold">
                    {dayReviews.length}
                  </span>
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

      {/* Details for Selected Day */}
      {selectedDay && (
        <div className="mt-6 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 p-6">
          <h3 className="text-lg font-bold mb-4">
            Reviews Due on {format(selectedDay, 'PPP')}
          </h3>

          {reviewsForSelectedDay.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              No cards scheduled for review on this day.
            </p>
          ) : (
            <ul className="space-y-3">
              {reviewsForSelectedDay.map((review) => (
                <li
                  key={review.id}
                  className="border border-gray-200 dark:border-dark-100 rounded-md p-3"
                >
                  {/* Display card details (English, Arabic, Transliteration) */}
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
                      {/* Add action buttons here later */}
                      {/*
                            <div className="flex space-x-2">
                                <button className="px-3 py-1 text-sm bg-emerald-100 rounded">Review Now</button>
                                <button className="px-3 py-1 text-sm bg-blue-100 rounded">Change Date</button>
                            </div>
                            */}
                    </div>
                  ) : (
                    <p className="text-red-600">Card details unavailable.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCalendar;
