import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Flashcard } from './useDecks';

export function useFlashcards(deckId: string | null) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) {
      setFlashcards([]);
      setLoading(false);
      return;
    }

    async function fetchFlashcards() {
      try {
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('deck_id', deckId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setFlashcards(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch flashcards');
      } finally {
        setLoading(false);
      }
    }

    fetchFlashcards();
  }, [deckId]);

  const addFlashcard = async (flashcard: Omit<Flashcard, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .insert(flashcard)
        .select()
        .single();

      if (error) throw error;
      setFlashcards(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add flashcard');
      return null;
    }
  };

  const updateFlashcard = async (id: string, updates: Partial<Flashcard>) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setFlashcards(prev =>
        prev.map(card => (card.id === id ? { ...card, ...updates } : card))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update flashcard');
      return false;
    }
  };

  const deleteFlashcard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFlashcards(prev => prev.filter(card => card.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flashcard');
      return false;
    }
  };

  return {
    flashcards,
    loading,
    error,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
  };
}

