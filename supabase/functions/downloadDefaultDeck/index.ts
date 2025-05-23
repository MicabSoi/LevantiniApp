import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';

const VERBS_DECK_NAME = "verbs"; // Lowercase for robust comparison

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const isLocalhost = origin.startsWith('http://localhost:');
  const corsHeaders = {
    'Access-Control-Allow-Origin': isLocalhost ? origin : 'https://YOUR_PRODUCTION_DOMAIN.com', // IMPORTANT: Replace with your app's domain for production
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase URL or Anon Key environment variables.');
      throw new Error('Missing Supabase URL or Anon Key environment variables.');
    }

    // Create a Supabase client with the Auth context of the user who called the function.
    // This way, RLS policies for the user apply automatically.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Get the user from the JWT.
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;
    console.log('User ID:', userId);

    const body = await req.json();
    const { default_deck_id } = body;
    console.log('Request body:', body);
    if (!default_deck_id) {
      console.error('Missing default_deck_id in request body');
      return new Response(JSON.stringify({ error: 'Missing default_deck_id in request body' }), { status: 400, headers: corsHeaders });
    }

    // 1. Fetch the default deck details
    const { data: defaultDeckData, error: defaultDeckError } = await supabase
      .from('default_decks')
      .select('id, name, description, emoji')
      .eq('id', default_deck_id)
      .single();

    if (defaultDeckError || !defaultDeckData) {
      console.error('Error fetching default deck:', defaultDeckError);
      return new Response(JSON.stringify({ error: 'Default deck not found' }), { status: 404, headers: corsHeaders });
    }
    console.log('Fetched default deck:', defaultDeckData);
    console.log('Comparing deck name:', (defaultDeckData.name || '').toLowerCase(), 'vs', VERBS_DECK_NAME);

    // 2. Check if the user has already downloaded this deck using source_default_deck_id
    const { data: existingUserDeck, error: existingUserDeckError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', userId)
      .eq('source_default_deck_id', defaultDeckData.id)
      .maybeSingle();

    if (existingUserDeckError && existingUserDeckError.code !== 'PGRST116') {
      console.error('Error checking existing user deck:', existingUserDeckError);
      return new Response(JSON.stringify({ error: 'Database error checking user decks' }), { status: 500, headers: corsHeaders });
    }

    if (existingUserDeck) {
      console.log('Deck already downloaded by user:', existingUserDeck.id);
      return new Response(JSON.stringify({ message: 'Deck already downloaded by user', deck_id: existingUserDeck.id }), { status: 200, headers: corsHeaders });
    }

    // 3. Create a new user-specific deck in public.decks with source_default_deck_id
    // Always set is_default: false for user decks, including Verbs
    const { data: newUserDeck, error: newUserDeckError } = await supabase
      .from('decks')
      .insert({
        user_id: userId,
        name: defaultDeckData.name,
        description: defaultDeckData.description,
        emoji: defaultDeckData.emoji,
        is_default: false, // Always false for user decks
        archived: false,
        source_default_deck_id: defaultDeckData.id,
      })
      .select('id')
      .single();

    if (newUserDeckError || !newUserDeck) {
      console.error('Error creating new user deck:', newUserDeckError);
      return new Response(JSON.stringify({ error: 'Failed to create user deck' }), { status: 500, headers: corsHeaders });
    }
    const newUserDeckId = newUserDeck.id;
    console.log('Created new user deck:', newUserDeckId);

    let cardsToInsert = [];
    let fetchError;
    let verbCardsData = null;
    let regularCardsData = null;

    // 4. Determine card source and prepare cards for public.cards
    if ((defaultDeckData.name || '').toLowerCase() === VERBS_DECK_NAME) {
      // It's the Verbs deck
      const verbResult = await supabase
        .from('default_verb_flashcards')
        .select('*')
        .eq('default_deck_id', default_deck_id);
      verbCardsData = verbResult.data;
      if (verbResult.error) fetchError = verbResult.error;
      console.log('Fetched verb cards:', verbCardsData ? verbCardsData.length : 0);
      if (verbCardsData && verbCardsData.length > 0) {
        cardsToInsert = verbCardsData.map(vc => ({
          deck_id: newUserDeckId,
          user_id: userId,
          english: vc["Word"],
          arabic: vc["Arabic Present"],
          transliteration: vc["Transliteration Present"],
          type: 'basic',
          fields: {
            word_english: vc["Word"],
            word_arabic: vc["Arabic Present"],
            word_transliteration: vc["Transliteration Present"],
            past_tense: {
              english: vc["English Past"],
              arabic: vc["Arabic Past"],
              transliteration: vc["Transliteration Past"],
            },
            present_tense: {
              english: vc["English Present"],
              arabic: vc["Arabic Present"],
              transliteration: vc["Transliteration Present"],
            },
            imperative_tense: {
              english: vc["English Imperative"],
              arabic: vc["Arabic Imperative"],
              transliteration: vc["Transliteration Imperative"],
            },
          },
          layout: {
            question: "{{fields.word_english}}<br>{{fields.word_arabic}} ({{fields.word_transliteration}})",
            answer: "<strong>Past:</strong> {{fields.past_tense.arabic}} ({{fields.past_tense.transliteration}})<br><strong>Present:</strong> {{fields.present_tense.arabic}} ({{fields.present_tense.transliteration}})<br><strong>Imperative:</strong> {{fields.imperative_tense.arabic}} ({{fields.imperative_tense.transliteration}})",
          },
          metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          media: { images: [], audio: [] },
        }));
        if (cardsToInsert.length > 0) {
          console.log('First card to insert:', JSON.stringify(cardsToInsert[0], null, 2));
        }
      }
    } else {
      // It's a regular default deck
      const regularResult = await supabase
        .from('default_flashcards')
        .select('english, arabic, transliteration, image_url, audio_url, tags, type, fields, layout, media, metadata')
        .eq('default_deck_id', default_deck_id);
      regularCardsData = regularResult.data;
      if (regularResult.error) fetchError = regularResult.error;
      console.log('Fetched regular cards:', regularCardsData ? regularCardsData.length : 0);
      if (regularCardsData && regularCardsData.length > 0) {
        cardsToInsert = regularCardsData.map(rc => ({
          deck_id: newUserDeckId,
          user_id: userId,
          english: rc.english,
          arabic: rc.arabic,
          transliteration: rc.transliteration,
          image_url: rc.image_url,
          audio_url: rc.audio_url,
          tags: rc.tags,
          type: rc.type || 'basic',
          fields: rc.fields || { english: rc.english, arabic: rc.arabic, transliteration: rc.transliteration },
          layout: rc.layout || { question: "{{fields.english}}", answer: "{{fields.arabic}} ({{fields.transliteration}})"},
          media: rc.media || { images: [], audio: [] },
          metadata: rc.metadata || { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        }));
        if (cardsToInsert.length > 0) {
          console.log('First card to insert:', JSON.stringify(cardsToInsert[0], null, 2));
        }
      }
    }

    if (fetchError) {
      console.error('Error fetching cards from default table:', fetchError);
      // Attempt to delete the user_deck created if card fetching fails
      await supabase.from('decks').delete().eq('id', newUserDeckId);
      return new Response(JSON.stringify({ error: 'Failed to fetch cards for the default deck' }), { status: 500, headers: corsHeaders });
    }

    // 5. Insert the cards into public.cards
    if (cardsToInsert.length > 0) {
      const { error: insertCardsError } = await supabase
        .from('cards')
        .insert(cardsToInsert);

      if (insertCardsError) {
        console.error('Error inserting new cards into public.cards:', insertCardsError);
        // Attempt to delete the user_deck created if card insertion fails
        await supabase.from('decks').delete().eq('id', newUserDeckId);
        return new Response(JSON.stringify({ error: 'Failed to copy cards to user deck', insertCardsError }), { status: 500, headers: corsHeaders });
      }
      console.log('Inserted cards:', cardsToInsert.length);
    } else {
      console.log('No cards to insert for this deck.');
    }

    return new Response(JSON.stringify({ message: 'Deck downloaded successfully', user_deck_id: newUserDeckId, cards_copied: cardsToInsert.length }), { status: 200, headers: corsHeaders });

  } catch (e) {
    console.error('General error in downloadDefaultDeck:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unexpected error occurred' }), { status: 500, headers: corsHeaders });
  }
}); 