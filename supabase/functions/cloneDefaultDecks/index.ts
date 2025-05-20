// cloneDefaultDecks/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-app-domain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with environment variables for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase URL or Service Role Key not provided in environment variables.');
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the user from the Authorization header
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: corsHeaders });
    }

    // Check if user already has decks
    const { data: existingDecks, error: checkError } = await supabaseAdmin
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
    const { data: defaultDecks, error: defaultDecksError } = await supabaseAdmin
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
      const { data: newDeck, error: deckError } = await supabaseAdmin
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
      const { data: defaultCards, error: cardsError } = await supabaseAdmin
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

      const { error: insertError } = await supabaseAdmin
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
