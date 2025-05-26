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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client with environment variables
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { default_deck_id } = await req.json();
    
    if (!default_deck_id) {
      throw new Error('Default deck ID not provided');
    }

    // Check if user already has this deck
    const { data: existingDeck, error: checkError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', (await supabase
        .from('default_decks')
        .select('name')
        .eq('id', default_deck_id)
        .single()).data?.name || '')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw checkError;
    }

    if (existingDeck) {
      return new Response(
        JSON.stringify({ error: 'You already have this deck' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the default deck
    const { data: defaultDeck, error: defaultDeckError } = await supabase
      .from('default_decks')
      .select('*')
      .eq('id', default_deck_id)
      .single();

    if (defaultDeckError) throw defaultDeckError;
    if (!defaultDeck) {
      throw new Error('Default deck not found');
    }

    // Create new deck for the user
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
    if (!newDeck) {
      throw new Error('Failed to create deck');
    }

    let cardsToInsert: any[] = [];

    // Check if this is the Verbs deck and handle it specially
    if (defaultDeck.name === 'Verbs') {
      // Fetch verb cards from default_verb_flashcards table
      const { data: verbCards, error: verbCardsError } = await supabase
        .from('default_verb_flashcards')
        .select('*')
        .eq('default_deck_id', default_deck_id);

      if (verbCardsError) throw verbCardsError;
      if (!verbCards?.length) {
        return new Response(
          JSON.stringify({ message: 'Deck downloaded successfully (no cards found)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create verb cards with proper structure
      cardsToInsert = verbCards.map(card => ({
        deck_id: newDeck.id,
        user_id: user.id,
        english: card.word_english || '',
        arabic: card.word_arabic || '',
        transliteration: card.word_transliteration || '',
        image_url: null,
        audio_url: null,
        tags: null,
        type: 'verb',
        fields: {
          word: card.word_english || '',
          arabic: card.word_arabic || '',
          transliteration: card.word_transliteration || '',
          past: {
            i: { en: card.english_past_i, ar: card.arabic_past_i, tr: card.transliteration_past_i },
            you_m: { en: card.english_past_you_m, ar: card.arabic_past_you_m, tr: card.transliteration_past_you_m },
            you_f: { en: card.english_past_you_f, ar: card.arabic_past_you_f, tr: card.transliteration_past_you_f },
            you_pl: { en: card.english_past_you_pl, ar: card.arabic_past_you_pl, tr: card.transliteration_past_you_pl },
            he: { en: card.english_past_he, ar: card.arabic_past_he, tr: card.transliteration_past_he },
            she: { en: card.english_past_she, ar: card.arabic_past_she, tr: card.transliteration_past_she },
            we: { en: card.english_past_we, ar: card.arabic_past_we, tr: card.transliteration_past_we },
            they: { en: card.english_past_they, ar: card.arabic_past_they, tr: card.transliteration_past_they }
          },
          present: {
            i: { en: card.english_present_i, ar: card.arabic_present_i, tr: card.transliteration_present_i },
            you_m: { en: card.english_present_you_m, ar: card.arabic_present_you_m, tr: card.transliteration_present_you_m },
            you_f: { en: card.english_present_you_f, ar: card.arabic_present_you_f, tr: card.transliteration_present_you_f },
            you_pl: { en: card.english_present_you_pl, ar: card.arabic_present_you_pl, tr: card.transliteration_present_you_pl },
            he: { en: card.english_present_he, ar: card.arabic_present_he, tr: card.transliteration_present_he },
            she: { en: card.english_present_she, ar: card.arabic_present_she, tr: card.transliteration_present_she },
            we: { en: card.english_present_we, ar: card.arabic_present_we, tr: card.transliteration_present_we },
            they: { en: card.english_present_they, ar: card.arabic_present_they, tr: card.transliteration_present_they }
          },
          imperative: {
            you_m: { en: card.english_imperative_you_m, ar: card.arabic_imperative_you_m, tr: card.transliteration_imperative_you_m },
            you_f: { en: card.english_imperative_you_f, ar: card.arabic_imperative_you_f, tr: card.transliteration_imperative_you_f },
            you_pl: { en: card.english_imperative_you_pl, ar: card.arabic_imperative_you_pl, tr: card.transliteration_imperative_you_pl }
          }
        },
        layout: {
          question: "{{fields.word}}",
          answer: "<div class='verb-table'><h3>Past Tense</h3><table><tr><td>{{fields.past.i.en}}</td><td>{{fields.past.i.ar}}</td><td>{{fields.past.i.tr}}</td></tr><tr><td>{{fields.past.you_m.en}}</td><td>{{fields.past.you_m.ar}}</td><td>{{fields.past.you_m.tr}}</td></tr><tr><td>{{fields.past.you_f.en}}</td><td>{{fields.past.you_f.ar}}</td><td>{{fields.past.you_f.tr}}</td></tr><tr><td>{{fields.past.you_pl.en}}</td><td>{{fields.past.you_pl.ar}}</td><td>{{fields.past.you_pl.tr}}</td></tr><tr><td>{{fields.past.he.en}}</td><td>{{fields.past.he.ar}}</td><td>{{fields.past.he.tr}}</td></tr><tr><td>{{fields.past.she.en}}</td><td>{{fields.past.she.ar}}</td><td>{{fields.past.she.tr}}</td></tr><tr><td>{{fields.past.we.en}}</td><td>{{fields.past.we.ar}}</td><td>{{fields.past.we.tr}}</td></tr><tr><td>{{fields.past.they.en}}</td><td>{{fields.past.they.ar}}</td><td>{{fields.past.they.tr}}</td></tr></table><h3>Present Tense</h3><table><tr><td>{{fields.present.i.en}}</td><td>{{fields.present.i.ar}}</td><td>{{fields.present.i.tr}}</td></tr><tr><td>{{fields.present.you_m.en}}</td><td>{{fields.present.you_m.ar}}</td><td>{{fields.present.you_m.tr}}</td></tr><tr><td>{{fields.present.you_f.en}}</td><td>{{fields.present.you_f.ar}}</td><td>{{fields.present.you_f.tr}}</td></tr><tr><td>{{fields.present.you_pl.en}}</td><td>{{fields.present.you_pl.ar}}</td><td>{{fields.present.you_pl.tr}}</td></tr><tr><td>{{fields.present.he.en}}</td><td>{{fields.present.he.ar}}</td><td>{{fields.present.he.tr}}</td></tr><tr><td>{{fields.present.she.en}}</td><td>{{fields.present.she.ar}}</td><td>{{fields.present.she.tr}}</td></tr><tr><td>{{fields.present.we.en}}</td><td>{{fields.present.we.ar}}</td><td>{{fields.present.we.tr}}</td></tr><tr><td>{{fields.present.they.en}}</td><td>{{fields.present.they.ar}}</td><td>{{fields.present.they.tr}}</td></tr></table><h3>Imperative</h3><table><tr><td>{{fields.imperative.you_m.en}}</td><td>{{fields.imperative.you_m.ar}}</td><td>{{fields.imperative.you_m.tr}}</td></tr><tr><td>{{fields.imperative.you_f.en}}</td><td>{{fields.imperative.you_f.ar}}</td><td>{{fields.imperative.you_f.tr}}</td></tr><tr><td>{{fields.imperative.you_pl.en}}</td><td>{{fields.imperative.you_pl.ar}}</td><td>{{fields.imperative.you_pl.tr}}</td></tr></table></div>"
        },
      }));
    } else {
      // Handle regular flashcards
      const { data: defaultCards, error: cardsError } = await supabase
        .from('default_flashcards')
        .select('*')
        .eq('default_deck_id', default_deck_id);

      if (cardsError) throw cardsError;
      if (!defaultCards?.length) {
        return new Response(
          JSON.stringify({ message: 'Deck downloaded successfully (no cards found)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Clone regular cards to new deck
      cardsToInsert = defaultCards.map(card => ({
        deck_id: newDeck.id,
        user_id: user.id,
        english: card.english,
        arabic: card.arabic,
        transliteration: card.transliteration,
        image_url: card.image_url,
        audio_url: card.audio_url,
        tags: card.tags,
        type: 'basic',
        fields: {
          english: card.english,
          arabic: card.arabic,
          transliteration: card.transliteration,
          imageUrl: card.image_url,
        },
        layout: {
          question: "{{fields.english}}",
          answer: "{{fields.arabic}} ({{fields.transliteration}})"
        },
      }));
    }

    const { error: insertError } = await supabase
      .from('cards')
      .insert(cardsToInsert);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        message: 'Deck downloaded successfully',
        deck: newDeck,
        cards_count: cardsToInsert.length
      }),
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