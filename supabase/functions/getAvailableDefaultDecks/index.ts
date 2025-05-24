import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://learnlevantini.netlify.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Create Supabase client using service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch available default decks with their card counts
    const { data: defaultDecks, error: defaultDecksError } = await supabase
      .from('default_decks')
      .select('*')
      .order('name');

    if (defaultDecksError) {
      console.error('Error fetching default decks:', defaultDecksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch default decks' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For each default deck, get the card count
    const decksWithCounts = await Promise.all(
      (defaultDecks || []).map(async (deck) => {
        const { count, error: countError } = await supabase
          .from('default_verb_flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('default_deck_id', deck.id);

        if (countError) {
          console.error(`Error counting cards for deck ${deck.id}:`, countError);
          return { ...deck, card_count: 0 };
        }

        return { ...deck, card_count: count || 0 };
      })
    );

    return new Response(
      JSON.stringify(decksWithCounts),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in getAvailableDefaultDecks function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 