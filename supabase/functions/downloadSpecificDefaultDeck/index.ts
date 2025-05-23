import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173', // IMPORTANT: For production, replace with your app's domain(s)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { default_deck_id } = await req.json(); // Expect default_deck_id from request

    if (!default_deck_id) {
      throw new Error('default_deck_id not provided');
    }

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

    // Get the user from the Authorization header (user calling this function)
    // This requires the user to be authenticated when calling the function.
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'User not authenticated or token missing/invalid' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch the specific default deck
    const { data: defaultDeck, error: defaultDeckError } = await supabaseAdmin
      .from('default_decks')
      .select('*')
      .eq('id', default_deck_id)
      .single();

    if (defaultDeckError) throw defaultDeckError;
    if (!defaultDeck) {
      return new Response(
        JSON.stringify({ message: 'Default deck not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Create new deck for the user
    const { data: newDeck, error: deckError } = await supabaseAdmin
      .from('decks')
      .insert({
        user_id: user.id,
        name: defaultDeck.name,
        description: defaultDeck.description,
        emoji: defaultDeck.emoji,
        is_default: false, // User's copy is not a "default" template
        archived: false,
      })
      .select()
      .single();

    if (deckError) throw deckError;
    if (!newDeck) {
        throw new Error('Failed to create new deck for user.');
    }

    // Fetch default cards for this specific default deck
    const { data: defaultCards, error: cardsError } = await supabaseAdmin
      .from('default_flashcards')
      .select('*')
      .eq('default_deck_id', defaultDeck.id);

    if (cardsError) throw cardsError;

    if (defaultCards && defaultCards.length > 0) {
      // Clone cards to new deck
      const cardsToInsert = defaultCards.map(card => ({
        deck_id: newDeck.id,
        user_id: user.id, // Add user_id to cards
        english: card.english, 
        arabic: card.arabic, 
        transliteration: card.transliteration, 
        image_url: card.image_url,
        audio_url: card.audio_url,
        tags: card.tags,
        type: card.type || 'basic', 
        fields: card.fields || { english: card.english, arabic: card.arabic, transliteration: card.transliteration },
        layout: card.layout || { question: '{{fields.english}} → {{fields.arabic}}', answer: '{{fields.arabic}} ({{fields.transliteration}})' },
        media: card.media || { images: [], audio: [] },
        metadata: card.metadata || { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      }));

      const { data: insertedCards, error: insertCardsError } = await supabaseAdmin
        .from('cards')
        .insert(cardsToInsert)
        .select();

      if (insertCardsError) throw insertCardsError;
      if (!insertedCards) throw new Error('Failed to insert cards.');

      // Create review entries for each new card
      const reviewEntriesToInsert = insertedCards.map(icard => ({
        card_id: icard.id,
        user_id: user.id, 
        last_review_date: null, 
        next_review_date: new Date().toISOString(), 
        interval: 0, 
        ease_factor: 2.5, 
        repetition_count: 0,
        streak: 0,
        reviews_count: 0,
        quality_history: [],
      }));

      const { error: insertReviewsError } = await supabaseAdmin
        .from('reviews')
        .insert(reviewEntriesToInsert);

      if (insertReviewsError) throw insertReviewsError;
      
    }

    return new Response(
      JSON.stringify({ message: 'Default deck downloaded successfully', new_deck_id: newDeck.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in downloadSpecificDefaultDeck function:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message === 'Default deck not found' ? 404 : (error.message === 'User not authenticated or token missing/invalid' ? 401 : 400),
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 