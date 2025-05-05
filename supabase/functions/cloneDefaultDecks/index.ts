// cloneDefaultDecks/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user } = await req.json();
    
    if (!user?.id) {
      throw new Error('User data not provided');
    }

    // Initialize Supabase client with environment variables
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user already has decks
    const { data: existingDecks, error: checkError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id);

    if (checkError) throw checkError;
    if (existingDecks?.length > 0) {
      return new Response(
        JSON.stringify({ message: 'User already has decks' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch default decks
    const { data: defaultDecks, error: defaultDecksError } = await supabase
      .from('default_decks')
      .select('*');

    if (defaultDecksError) throw defaultDecksError;
    if (!defaultDecks?.length) {
      return new Response(
        JSON.stringify({ message: 'No default decks found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clone each default deck and its cards
    for (const defaultDeck of defaultDecks) {
      // Create new deck
      const { data: newDeck, error: deckError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
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
      if (!defaultCards?.length) continue;

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

    return new Response(
      JSON.stringify({ message: 'Default decks cloned successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

