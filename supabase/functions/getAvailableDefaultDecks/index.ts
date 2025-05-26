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
    // Initialize Supabase client with environment variables
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch all default decks
    const { data: defaultDecks, error: defaultDecksError } = await supabase
      .from('default_decks')
      .select('*')
      .order('created_at', { ascending: true });

    if (defaultDecksError) throw defaultDecksError;

    // For each default deck, count the number of cards
    const decksWithCardCount = await Promise.all(
      (defaultDecks || []).map(async (deck) => {
        // Handle Verbs deck specially - it uses default_verb_flashcards table
        if (deck.name === 'Verbs') {
          const { count, error: countError } = await supabase
            .from('default_verb_flashcards')
            .select('*', { count: 'exact', head: true })
            .eq('default_deck_id', deck.id);

          if (countError) {
            console.error('Error counting verb cards for deck:', deck.id, countError);
            return { ...deck, card_count: 0 };
          }

          return { ...deck, card_count: count || 0 };
        } else {
          // Handle regular flashcard decks
          const { count, error: countError } = await supabase
            .from('default_flashcards')
            .select('*', { count: 'exact', head: true })
            .eq('default_deck_id', deck.id);

          if (countError) {
            console.error('Error counting cards for deck:', deck.id, countError);
            return { ...deck, card_count: 0 };
          }

          return { ...deck, card_count: count || 0 };
        }
      })
    );

    return new Response(
      JSON.stringify(decksWithCardCount),
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