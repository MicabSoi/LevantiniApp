import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; // Assuming supabaseClient is in lib

export interface Lesson {
  id: string;
  level: number;
  title: string;
  description?: string;
  preview_text?: string;
  content?: any; // Assuming lesson content is stored here
  order_num: number; // Add order_num
}

interface LessonContextType {
  allLessons: Lesson[];
  getLessonById: (lessonId: string) => Lesson | undefined;
  loading: boolean;
  error: string | null;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

interface LessonProviderProps {
  children: ReactNode;
}

export const LessonProvider: React.FC<LessonProviderProps> = ({ children }) => {
  console.log('LessonProvider component rendering');
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('LessonProvider useEffect: Starting lesson fetch...');
    async function fetchAllLessons() {
      setLoading(true);
      setError(null);
      try {
        // Assuming lessons are stored in a 'lessons' table
        const { data, error } = await supabase
          .from('lessons')
          .select('id, level, title, description, preview_text, order_num'); // Include order_num

        if (error) {
          console.error('LessonProvider - Supabase fetch error:', error);
          throw error;
        }

        // Sort lessons by level first, then by order_num
        const sortedLessons = (data || []).sort((a, b) => {
          // First sort by level
          if (a.level !== b.level) {
            return a.level - b.level;
          }
          
          // Then sort by order_num
          return a.order_num - b.order_num;
        });

        console.log('LessonProvider - Fetched and sorted lessons:', sortedLessons);
        setAllLessons(sortedLessons);
      } catch (err) {
        console.error('LessonProvider - Error fetching all lessons:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lessons');
      } finally {
        setLoading(false);
        console.log('LessonProvider useEffect: Lesson fetch finished. Loading:', false);
      }
    }

    fetchAllLessons();
  }, []);

  const getLessonById = (lessonId: string) => {
    return allLessons.find(lesson => lesson.id === lessonId);
  };

  return (
    <LessonContext.Provider value={{ allLessons, getLessonById, loading, error }}>
      {children}
    </LessonContext.Provider>
  );
};

export const useLessonContext = () => {
  const context = useContext(LessonContext);
  if (context === undefined) {
    throw new Error('useLessonContext must be used within a LessonProvider');
  }
  return context;
}; 