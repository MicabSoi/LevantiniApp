import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const isLocalhost = origin.startsWith('http://localhost:');
  const corsHeaders = {
    'Access-Control-Allow-Origin': isLocalhost ? origin : 'https://YOUR_PRODUCTION_DOMAIN.com', // IMPORTANT: For production, replace with your app's domain(s)
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS', // Added OPTIONS for preflight requests
    'Content-Type': 'application/json' // Ensure Content-Type is set
  };

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key not provided in environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch all default decks and count associated flashcards from both tables
    const { data: defaultDecks, error: defaultDecksError } = await supabase
      .from('default_decks')
      .select(`
        id,
        name,
        description,
        emoji,
        default_flashcards!default_flashcards_default_deck_id_fkey ( count ),
        default_verb_flashcards:default_verb_flashcards!fk_default_verb_flashcards_default_deck ( count )
      `);

    if (defaultDecksError) {
      console.error('Error fetching default decks with counts:', defaultDecksError);
      // Depending on desired behavior, you might want to throw or return an error response
       return new Response(
        JSON.stringify({ error: 'Failed to fetch default decks.' }),
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    if (!defaultDecks || defaultDecks.length === 0) {
       console.log('No default decks found in the database.');
       // Return an empty array and a 200 status if no decks are found, as this is a valid state.
       // Returning 404 here was causing the frontend error previously.
       return new Response(
        JSON.stringify([]), // Return an empty array of decks
        { 
          headers: corsHeaders, 
          status: 200 
        }
      );
    }
    
    // Process the results to sum counts and match frontend structure
    const processedDecks = defaultDecks.map(deck => {
      // Get count from default_flashcards (it returns an array with a single count object)
      const genericCount = deck.default_flashcards?.[0]?.count || 0;
      // Get count from default_verb_flashcards (using the alias default_verb_flashcards)
      const verbCount = deck.default_verb_flashcards?.[0]?.count || 0;

      const totalCardCount = genericCount + verbCount;

      // Exclude nested structures before spreading
      const { default_flashcards, default_verb_flashcards, ...rest } = deck;

      return {
        ...rest,
        card_count: totalCardCount,
      };
    });

    console.log('Successfully fetched and processed default decks:', processedDecks);

    return new Response(
      JSON.stringify(processedDecks),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in getAvailableDefaultDecks function main catch block:', error.message, error.stack);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: corsHeaders,
      status: 500,
    });
  }
}); 