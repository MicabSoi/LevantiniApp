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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with the user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { default_deck_id } = await req.json();
    if (!default_deck_id) {
      return new Response(
        JSON.stringify({ error: 'Missing default_deck_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create service role client for operations that require elevated permissions
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the default deck details
    const { data: defaultDeck, error: deckError } = await serviceSupabase
      .from('default_decks')
      .select('*')
      .eq('id', default_deck_id)
      .single();

    if (deckError || !defaultDeck) {
      console.error('Error fetching default deck:', deckError);
      return new Response(
        JSON.stringify({ error: 'Default deck not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user already has a deck with the same name
    const { data: existingDeck, error: existingError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', defaultDeck.name)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking for existing deck:', existingError);
      return new Response(
        JSON.stringify({ error: 'Error checking for existing deck' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (existingDeck) {
      return new Response(
        JSON.stringify({ error: 'You already have a deck with this name' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create the new user deck
    const { data: newDeck, error: createDeckError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        name: defaultDeck.name,
        description: defaultDeck.description,
        emoji: defaultDeck.emoji || '📚',
        is_default: true, // Mark as a downloaded default deck
        archived: false,
      })
      .select()
      .single();

    if (createDeckError || !newDeck) {
      console.error('Error creating new deck:', createDeckError);
      return new Response(
        JSON.stringify({ error: 'Failed to create deck' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch all cards from the default deck
    const { data: defaultCards, error: cardsError } = await serviceSupabase
      .from('default_verb_flashcards')
      .select('*')
      .eq('default_deck_id', default_deck_id);

    if (cardsError) {
      console.error('Error fetching default cards:', cardsError);
      // Clean up the deck we just created
      await supabase.from('decks').delete().eq('id', newDeck.id);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch deck cards' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Copy cards to user's deck in batches to avoid timeout
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < defaultCards.length; i += batchSize) {
      const batch = defaultCards.slice(i, i + batchSize);
      const cardsToInsert = batch.map(card => ({
        deck_id: newDeck.id,
        english: card.english,
        arabic: card.arabic,
        transliteration: card.transliteration,
        type: card.type || 'basic',
        layout: card.layout || {},
        metadata: card.metadata || {},
        tags: card.tags || [],
        image_url: card.image_url,
        audio_url: card.audio_url,
      }));

      const { error: insertError } = await supabase
        .from('cards')
        .insert(cardsToInsert);

      if (insertError) {
        console.error('Error inserting cards batch:', insertError);
        // Clean up on error
        await supabase.from('decks').delete().eq('id', newDeck.id);
        return new Response(
          JSON.stringify({ error: 'Failed to copy deck cards' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      totalInserted += cardsToInsert.length;
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}, total cards: ${totalInserted}`);
    }

    console.log(`Successfully downloaded deck "${defaultDeck.name}" with ${totalInserted} cards for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deck: newDeck, 
        cards_copied: totalInserted 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in downloadDefaultDeck function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 