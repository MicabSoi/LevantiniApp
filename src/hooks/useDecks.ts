import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string;
  emoji: string;
  is_default: boolean;
  archived: boolean;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  transliteration: string;
  image_url: string | null;
  audio_url: string | null;
  tags: string[];
}

export function useDecks(user: User | null) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    async function fetchDecks() {
      try {
        const { data, error } = await supabase
          .from('decks')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDecks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch decks');
      } finally {
        setLoading(false);
      }
    }

    fetchDecks();
  }, [user]);

  const createDeck = async (name: string, description: string, emoji: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name,
          description,
          emoji,
          is_default: false,
          archived: false,
        })
        .select()
        .single();

      if (error) throw error;
      setDecks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
      return null;
    }
  };

  const updateDeck = async (deckId: string, updates: Partial<Deck>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('decks')
        .update(updates)
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (error) throw error;
      setDecks(prev => 
        prev.map(deck => 
          deck.id === deckId ? { ...deck, ...updates } : deck
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deck');
      return false;
    }
  };

  const archiveDeck = async (deckId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('decks')
        .update({ archived: true })
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (error) throw error;
      setDecks(prev => prev.filter(deck => deck.id !== deckId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive deck');
      return false;
    }
  };

  return {
    decks,
    loading,
    error,
    createDeck,
    updateDeck,
    archiveDeck,
  };
}

