import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export async function initUserDecks(userId: string) {
  try {
    // Check if user already has decks
    const { data: existingDecks, error: checkError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', userId);

    if (checkError) throw checkError;
    if (existingDecks && existingDecks.length > 0) return;

    // Fetch default decks
    const { data: defaultDecks, error: defaultDecksError } = await supabase
      .from('default_decks')
      .select('*');

    if (defaultDecksError) throw defaultDecksError;
    if (!defaultDecks) return;

    // Clone each default deck and its cards
    for (const defaultDeck of defaultDecks) {
      // Create new deck
      const { data: newDeck, error: deckError } = await supabase
        .from('decks')
        .insert({
          user_id: userId,
          name: defaultDeck.name,
          description: defaultDeck.description,
          emoji: defaultDeck.emoji,
          is_default: true,
          archived: false,
        })
        .select()
        .single();

      if (deckError) throw deckError;
      if (!newDeck) continue;

      // Fetch default cards for this deck
      const { data: defaultCards, error: cardsError } = await supabase
        .from('default_flashcards')
        .select('*')
        .eq('default_deck_id', defaultDeck.id);

      if (cardsError) throw cardsError;
      if (!defaultCards || defaultCards.length === 0) continue;

      // Clone cards to new deck
      const cardsToInsert = defaultCards.map(card => ({
        deck_id: newDeck.id,
        front: card.front,
        back: card.back,
        transliteration: card.transliteration,
        image_url: card.image_url,
        audio_url: card.audio_url,
        tags: card.tags,
      }));

      const { error: insertError } = await supabase
        .from('flashcards')
        .insert(cardsToInsert);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error initializing user decks:', error);
    throw error;
  }
}

