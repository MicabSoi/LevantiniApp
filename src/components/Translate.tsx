import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Volume2, Settings, X, Check, Loader2, FolderPlus, Plus, HelpCircle } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabaseClient';
import { useSettings } from '../contexts/SettingsContext';
import { formatArabicText } from '../utils/arabicUtils';
import TranslationCache from '../utils/translationCache';

// Advanced cache instance for translations
const translationCache = new TranslationCache<TranslationResult>(200, 1000 * 60 * 60); // 200 items, 1 hour TTL

// Define the translation result type
interface TranslationResult {
  id: string;
  english: string;
  context: string;
  arabic: string;
  arabicSentence: string; // This might be empty if Gemini doesn't provide sentence context directly
  transliteration: string;
  transliterationSentence: string; // Similarly, might be empty
  audioUrl: string;
  contextArabic?: string;
  contextTransliteration?: string;
  // Fields for the hybrid service
  geminiOriginalArabic?: string; 
  hasReplacements?: boolean;
  model_version?: string;
}

// Define the structure of a row from user_translation_history table
interface UserTranslationHistoryRow {
  id: string;
  english_text: string;
  context_text: string | null;
  arabic_text: string;
  transliteration_text: string | null;
  context_arabic?: string | null;
  context_transliteration?: string | null;
  created_at: string; // Supabase typically returns timestamps as strings
}

// Define the structure for a Deck
interface Deck {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  icon?: string; // Optional: path to icon or icon name
  description?: string; // Optional: description of the deck
}

// Sample translations as fallback (Restoring this constant)
const sampleTranslations = [
  {
    id: "1",
    english: 'chase',
    context: 'he is chasing her',
    arabic: 'يلحق',
    arabicSentence: 'هو عم يلحقها',
    transliteration: 'yil7a2',
    transliterationSentence: 'huwwe 3am yil7a2ha',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_015.mp3',
  },
  {
    id: "2",
    english: 'eat',
    context: 'I want to eat lunch',
    arabic: 'آكل',
    arabicSentence: 'بدي آكل غدا',
    transliteration: 'eekol',
    transliterationSentence: 'biddi eekol ghada',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_017.mp3',
  },
];

interface TranslateProps {
  setSubTab: (tab: string) => void;
}

const Translate: React.FC<TranslateProps> = ({ setSubTab }: TranslateProps) => {
  const [word, setWord] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [supabaseHistory, setSupabaseHistory] = useState<TranslationResult[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [showDiacriticsSettingsModal, setShowDiacriticsSettingsModal] = useState(false);
  const { translationShowDiacritics, setTranslationShowDiacritics } = useSettings();
  const [modalShowDiacriticsState, setModalShowDiacriticsState] = useState(translationShowDiacritics);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddToDeckModal, setShowAddToDeckModal] = useState(false);
  const [translationItemToAdd, setTranslationItemToAdd] = useState<TranslationResult | null>(null);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckIcon, setNewDeckIcon] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedDialect, setSelectedDialect] = useState<'apc_Arab' | 'ajp_Arab' | 'ar'>('apc_Arab'); // COMMENTED OUT - Using Gemini

  // State for asking a question about a translation
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [selectedTranslationForQuestion, setSelectedTranslationForQuestion] = useState<TranslationResult | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);

  const { user } = useSupabase();
  const saveSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestRef = useRef<Promise<TranslationResult | null> | null>(null);

  // Restore Gemini API Key and genAI state
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [genAI, setGenAI] = useState<GoogleGenerativeAI | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Google API key is not set in .env.local');
      // setError('Google API key is not configured. Please check your .env.local file.');
      return;
    }
    import('@google/generative-ai').then(({ GoogleGenerativeAI }) => {
      setGenAI(new GoogleGenerativeAI(apiKey));
    });
  }, []);

  // Generate cache key for translation requests
  const getCacheKey = useCallback((text: string, contextText: string) => {
    return `${text.toLowerCase().trim()}|${contextText.toLowerCase().trim()}`;
  }, []);

  // Async function to save to database (non-blocking) - Reverted for direct Gemini
  const saveTranslationToHistory = useCallback(async (
    // text: string, // No longer passing text and contextText separately
    // contextText: string,
    parsedResponse: TranslationResult // Expects the full result object
  ): Promise<TranslationResult | null> => {
    if (!user) return null;

    try {
      // Adapt to what's available directly from Gemini parsing
      const insertData: Partial<UserTranslationHistoryRow> & { user_id: string, english_text: string, arabic_text: string } = {
        user_id: user.id,
        english_text: parsedResponse.english, 
        context_text: parsedResponse.context, 
        arabic_text: parsedResponse.arabic || 'مش موجود', 
        transliteration_text: parsedResponse.transliteration || '', 
        context_arabic: parsedResponse.contextArabic || null, 
        context_transliteration: parsedResponse.contextTransliteration || null,
        // Fields like geminiOriginalArabic, hasReplacements, model_version are not directly from Gemini in this flow
      };

      const { data, error: insertError } = await supabase
        .from('user_translation_history')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error saving translation to history:', insertError);
        return null;
      }

      if (data) {
        const newHistoryItem: TranslationResult = {
          id: data.id,
          english: data.english_text || '',
          context: data.context_text || '',
          arabic: data.arabic_text || '',
          arabicSentence: parsedResponse.arabicSentence || '', 
          transliteration: data.transliteration_text || '', 
          transliterationSentence: parsedResponse.transliterationSentence || '', 
          audioUrl: parsedResponse.audioUrl || '', 
          contextArabic: data.context_arabic || '',
          contextTransliteration: data.context_transliteration || '',
        };
        
        setSupabaseHistory(currentHistory => [newHistoryItem, ...currentHistory].slice(0, 20));
        return newHistoryItem;
      }
    } catch (error) {
      console.error('Database save error:', error);
    }
    return null;
  }, [user]);

  // Restore original translateWithGemini function
  const translateWithGemini = useCallback(async (text: string, contextText: string): Promise<TranslationResult | null> => {
    const startTime = performance.now();
    console.log('translateWithGemini (direct) called with text:', text, 'and context:', contextText);
    
    if (!genAI) {
      console.error('Google Generative AI SDK not initialized.');
      setError('Translation service is not ready. Please ensure API key is set and SDK is loaded.');
      return null;
    }

    const cacheKey = getCacheKey(text, contextText);
    const cachedResult = translationCache.get(cacheKey);
    if (cachedResult) {
      const cacheTime = performance.now() - startTime;
      console.log(`Using cached translation (${cacheTime.toFixed(2)}ms)`);
      return cachedResult;
    }

    setIsLoading(true);
    setError('');

    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    
    requestTimeoutRef.current = setTimeout(() => {
      setError('Translation request timed out. Please try again.');
      setIsLoading(false);
      activeRequestRef.current = null; 
    }, 30000); 

    try {
      const prompt = `
Translate "${text}" to the MOST COMMON, NATURAL, and COLLOQUIAL Levantine Arabic (Lebanese/Syrian/Palestinian/Jordanian), not MSA${contextText ? `, context: "${contextText}"` : ''}.
Imagine you are speaking to a friend on the street in Beirut, Damascus, Amman, or Jerusalem.

-- Example of desired Levantine translation and vocabulary (this is a guide, translate the user's actual text below): --
-- English input: "the boy kicked the ball"
-- Arabic: الوَلَد شاط الطابِة
-- Transliteration: il-walad shaaT iT-Taabeh
-- ArabicSentence: الوَلَد شاط الطابِة بِقُوِّة
-- TransliterationSentence: il-walad shaaT iT-Taabeh b2uwweh
-- ContextArabic: N/A
-- ContextTransliteration: N/A
-- END OF EXAMPLE --

CRITICAL: Use everyday vocabulary and sentence structures. For "ball" or "balls", ALWAYS use the word "طابة" (Taabeh) or its appropriate Levantine plural forms (e.g., "طابات" - Taabaat, "طابتين" - Taabteen). NEVER use the word "كُرة" (kura) or any of its derivatives.

DIACRITICS REQUIREMENT: **ALL Arabic text MUST include FULL diacritics (tashkeel)** - fatha (َ), damma (ُ), kasra (ِ), sukun (ْ), shadda (ّ), tanween, etc. This is essential for pronunciation guidance.

TRANSLITERATION STANDARD: For ALL transliterations, use ONLY the following Levantine Chat Alphabet rules:
- Consonants: a, b, t, th (for ث), j (for ج), 7 (for ح), kh (for خ), d, dh (for ذ), r, z, s, sh (for ش), S (for ص), D (for ض), T (for ط), Z (for ظ), 3 (for ع), gh (for غ), f, q (for ق - can be q, k, or 2 based on regional pronunciation, choose most common for the word), k, l, m, n, h, w, y.
- Hamza (ء): Use '2' (e.g., su2al for سؤال).
- Vowels: Short vowels: a (fatha e.g. daras), i (kasra e.g. sirib), u (damma e.g. rukob). Long vowels: aa (e.g. baab), ii (e.g. kbiir), uu (e.g. nuur).
- Shadda (ّ): Represent by doubling the consonant (e.g., halla2 for هلّأ, sakkara for سكّر).
- Ensure "al-" (ال) assimilation is reflected if natural (e.g., "ish-shams" not "il-shams").

Essential Levantine patterns (examples):
• "بِدّي" (biddi) for "I want" - NEVER "أريد" (ureed)
• "لازِم" (laazim) for "need to/must" - NEVER "أنا بحاجة" (ana bi 7aja)  
• "عَم + verb" for present continuous: "عَم بآكُل" (3am beekol) = "I'm eating"
• Common words: "كتير" (kteer) for "very/a lot", "هَلَّأ" (halla2) for "now", "هون" (hon) for "here", "شو" (shu) for "what", "وين" (wen) for "where", "كيف" (kif) for "how", "ليش" (lesh) for "why", "إيمتى" (emta) for "when".
• Negation: Use "مش" (mish) or "مو" (mo) - avoid formal "لا" or "لم".

IMPORTANT: Respond ONLY with this exact multi-line format. Ensure all requested fields are present. If a field is not applicable for the given input (e.g., ContextArabic when no context is provided), leave it blank or state "N/A".
Arabic: [your Arabic translation of "${text}" with full diacritics]
Transliteration: [your transliteration of "${text}" following the rules above]
ArabicSentence: [your Arabic translation of "${contextText || text}" as a full sentence with diacritics, ensuring it's the most natural Levantine phrasing AND USES "طابة" FOR BALL]
TransliterationSentence: [your transliteration of the ArabicSentence following the rules above AND REFLECTING "طابة" FOR BALL]
${contextText ? `ContextArabic: [Arabic translation of the original context phrase "${contextText}" with diacritics. This might be the same as ArabicSentence or a more direct translation of the isolated context phrase. If it involves "ball", use "طابة".]
ContextTransliteration: [Transliteration of ContextArabic following the rules above. If it involves "ball", use "طابة".]` : 'ContextArabic: N/A\nContextTransliteration: N/A'}
`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
      activeRequestRef.current = model.generateContent(prompt).then(geminiResult => {
          if (requestTimeoutRef.current) { 
            clearTimeout(requestTimeoutRef.current);
            requestTimeoutRef.current = null;
          }
          const responseText = geminiResult.response.text();
          console.log('Raw Gemini Response:', responseText);

          // Parsing logic (simplified, ensure robust parsing based on your actual prompt output)
          const parsed: Partial<TranslationResult> = {};
          const lines = responseText.split('\n').map(l => l.trim());
          
          lines.forEach(line => {
            if (line.startsWith('Arabic:')) parsed.arabic = line.substring('Arabic:'.length).trim();
            else if (line.startsWith('Transliteration:')) parsed.transliteration = line.substring('Transliteration:'.length).trim();
            else if (line.startsWith('ArabicSentence:')) parsed.arabicSentence = line.substring('ArabicSentence:'.length).trim();
            else if (line.startsWith('TransliterationSentence:')) parsed.transliterationSentence = line.substring('TransliterationSentence:'.length).trim();
            else if (line.startsWith('ContextArabic:')) parsed.contextArabic = line.substring('ContextArabic:'.length).trim();
            else if (line.startsWith('ContextTransliteration:')) parsed.contextTransliteration = line.substring('ContextTransliteration:'.length).trim();
          });

          if (!parsed.arabic || !parsed.transliteration) {
            console.error("Failed to parse critical fields (Arabic/Transliteration) from Gemini response:", responseText);
            // Fallback or use the whole responseText for Arabic if parsing fails completely
            parsed.arabic = parsed.arabic || responseText;
            parsed.transliteration = parsed.transliteration || "(transliteration unavailable)";
          }

          const result: TranslationResult = {
            id: new Date().toISOString(),
            english: text,
            context: contextText,
            arabic: parsed.arabic || 'خطأ في التحليل', // "Parsing error"
            transliteration: parsed.transliteration || '(error)',
            arabicSentence: parsed.arabicSentence || parsed.arabic || '', // Fallback to main Arabic if sentence not found
            transliterationSentence: parsed.transliterationSentence || parsed.transliteration || '', // Fallback
            audioUrl: '', // No audio directly from Gemini text API
            contextArabic: parsed.contextArabic || '',
            contextTransliteration: parsed.contextTransliteration || '',
          };

          translationCache.set(cacheKey, result);
          const endTime = performance.now();
          console.log(`Translation successful via Direct Gemini (${(endTime - startTime).toFixed(2)}ms)`);
          saveTranslationToHistory(result);
          return result;
      });

      const result = await activeRequestRef.current;
      setIsLoading(false);
      activeRequestRef.current = null;
      return result;

    } catch (err: any) {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
      console.error('Error calling Google Generative AI or parsing response:', err);
      setError(err.message || 'Failed to translate. Please try again.');
      setIsLoading(false);
      activeRequestRef.current = null;
      return null;
    }
  }, [genAI, getCacheKey, saveTranslationToHistory]); // Added genAI and removed user from dependencies

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    if (!word.trim()) {
      setError('Please enter a word or phrase to translate.');
      return;
    }

    console.log('handleSubmit triggered with word:', word, 'context:', context);
    setIsLoading(true);
    setError('');
    setResult(null); 

    // Call the direct Gemini function
    const translationResult = await translateWithGemini(word, context);
    
    setIsLoading(false);
    if (translationResult) {
      console.log('Setting result in UI: ', translationResult);
      setResult(translationResult);
    } else {
      if (!error) { 
        setError('Translation failed. Please check the console for details.');
      }
      console.error('Translation failed, result is null');
    }
  };

  const playAudio = (audioUrl: string) => {
    try {
      if (!audioUrl) return;

      // Create or reuse audio element
      if (!audioRef) {
        const audio = new Audio(audioUrl);
        audio.onerror = (e) => {
          console.error('Audio failed to load:', e);
        };
        setAudioRef(audio);
      } else {
        audioRef.src = audioUrl;
      }

      // Play the audio
      if (audioRef) {
        audioRef.currentTime = 0;
        const playPromise = audioRef.play();

        if (playPromise !== undefined) {
          playPromise.catch((error: Error) => {
            console.error('Error playing audio:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
    }
  };

  // Function to fetch history from Supabase
  const fetchHistory = async () => {
    if (!user) {
      setSupabaseHistory([]);
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    const { data, error } = await supabase
      .from('user_translation_history')
      .select('id, english_text, context_text, arabic_text, transliteration_text, context_arabic, context_transliteration, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching history:', error);
      setError('Failed to load translation history.');
      setSupabaseHistory([]);
    } else if (data) {
      // Map fetched data to TranslationResult interface, providing default empty strings
      const historyData: TranslationResult[] = data.map((item: UserTranslationHistoryRow) => ({
        id: item.id,
        english: item.english_text || '',
        context: item.context_text || '',
        arabic: item.arabic_text || '',
        arabicSentence: '', // Not stored in this table yet
        transliteration: item.transliteration_text || '',
        transliterationSentence: '', // Not stored in this table yet
        audioUrl: '', // Not stored in this table yet
        contextArabic: item.context_arabic || '',
        contextTransliteration: item.context_transliteration || '',
      }));
      setSupabaseHistory(historyData);
    } else {
      // Handle case where data is null but no error (e.g., no records found)
      setSupabaseHistory([]);
    }
    setIsHistoryLoading(false);
  };

  // Function to fetch user's decks from Supabase
  const fetchUserDecks = async () => {
    if (!user) {
      setUserDecks([]);
      return;
    }

    const { data, error } = await supabase
      .from('decks') // Assuming your decks table is named 'decks'
      .select('id, name, user_id, created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user decks:', error);
      // Optionally, set an error state for the user
      setUserDecks([]);
    } else if (data) {
      setUserDecks(data);
    } else {
      setUserDecks([]);
    }
  };

  // Fetch history when the component mounts or the user changes
  useEffect(() => {
    // Only fetch history if user is available
    if (user) {
      fetchHistory();
      fetchUserDecks(); // Fetch decks when user is available
    } else {
      // Clear history if user logs out
      setSupabaseHistory([]);
      setUserDecks([]); // Clear decks if user logs out
    }

  }, [user]); // Depend on user to refetch history

  // Effect to close modals on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDiacriticsSettingsModal) {
          setShowDiacriticsSettingsModal(false);
        } else if (showQuestionInput) {
          setShowQuestionInput(false);
        } else if (showAddToDeckModal) {
          setShowAddToDeckModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDiacriticsSettingsModal, showQuestionInput, showAddToDeckModal]); // Re-run effect if modal states change

  // Handler for opening the settings modal
  const handleOpenSettingsModal = () => {
    // Initialize modal state with current main state
    setModalShowDiacriticsState(translationShowDiacritics);
    setShowDiacriticsSettingsModal(true);
  };

  // Handler for saving changes from the modal
  const handleSaveSettings = () => {
    // Update main state with modal state
    setTranslationShowDiacritics(modalShowDiacriticsState);
    // Close modal
    setShowDiacriticsSettingsModal(false);
  };

  // Handler for closing modal without saving
  const handleCloseSettingsModal = () => {
    // Simply close the modal, main state is unchanged
    setShowDiacriticsSettingsModal(false);
  };

  const handleAddToDeck = (item: TranslationResult) => {
    // Implementation of adding the translation to a deck
    console.log('Adding to deck:', item);
    // Set the item to be added and open the modal
    setTranslationItemToAdd(item);
    setShowAddToDeckModal(true);
    // Reset selected deck and new deck name when opening the modal
    setSelectedDeckId(null);
    setNewDeckName('');
    setNewDeckIcon('');
    setNewDeckDescription('');
  };

  const handleCloseAddToDeckModal = () => {
    setShowAddToDeckModal(false);
    setTranslationItemToAdd(null);
    setNewDeckName(''); // Clear new deck name on close
    setNewDeckIcon('');
    setNewDeckDescription('');
    setSelectedDeckId(null); // Clear selected deck on close
  };

  const handleCreateAndAddToDeck = async () => {
    if (!newDeckName.trim() || !user || !translationItemToAdd) return;

    const newDeckPayload: { name: string; user_id: string; icon?: string; description?: string } = {
      name: newDeckName,
      user_id: user.id,
    };
    if (newDeckIcon.trim()) newDeckPayload.icon = newDeckIcon.trim();
    if (newDeckDescription.trim()) newDeckPayload.description = newDeckDescription.trim();

    // Create new deck
    const { data: newDeckData, error: createDeckError } = await supabase
      .from('decks')
      .insert(newDeckPayload)
      .select(); // Select the newly created deck to get its ID

    if (createDeckError || !newDeckData || newDeckData.length === 0) {
      console.error('Error creating new deck:', createDeckError);
      // Optionally, show an error to the user
      return;
    }

    const createdDeck = newDeckData[0];
    console.log('New deck created:', createdDeck);

    // Add translation to the new deck
    await addTranslationToDeck(createdDeck.id, translationItemToAdd);

    // Close modal and refresh decks
    handleCloseAddToDeckModal();
    fetchUserDecks(); // Refresh the list of decks
  };

  const handleAddToExistingDeck = async () => {
    if (!selectedDeckId || !translationItemToAdd) return;

    // Add translation to the selected existing deck
    await addTranslationToDeck(selectedDeckId, translationItemToAdd);

    // Close modal
    handleCloseAddToDeckModal();
  };

  // Helper function to add translation to a specific deck
  const addTranslationToDeck = async (deckId: string, translation: TranslationResult) => {
    // Assuming you have a table like 'deck_translations' to link translations to decks
    const { error: addTranslationError } = await supabase
      .from('deck_translations') // Replace with your actual table name
      .insert({
        deck_id: deckId,
        translation_id: translation.id, // Assuming translation history has a unique ID
        // You might also want to store the word, translation, etc. directly here
        // depending on your schema design.
        english_text: translation.english,
        arabic_text: translation.arabic,
        transliteration_text: translation.transliteration,
        context_text: translation.context,
        context_arabic: translation.contextArabic,
        context_transliteration: translation.contextTransliteration,
      });

    if (addTranslationError) {
      console.error('Error adding translation to deck:', addTranslationError);
      // Optionally, show an error to the user
    } else {
      console.log('Translation added to deck:', deckId);
      // Optionally, show a success message
    }
  };

  // Handler for clicking the "Ask a Question" button
  const handleAskQuestionClick = (item: TranslationResult) => {
    setSelectedTranslationForQuestion(item);
    setShowQuestionInput(true);
    setQuestionText(''); // Clear previous question text
    setAnswerText(''); // Clear previous answer text
  };

  const handleSendQuestion = async () => {
    if (!questionText || !selectedTranslationForQuestion) {
      setError('Missing question or translation.');
      return;
    }

    setIsAnsweringQuestion(true);
    setAnswerText('');
    
    if (!geminiApiKey) { // Restore API key check
        setError('API Key is not available for sending question.');
        setIsAnsweringQuestion(false);
        return;
    }
    if (!genAI) { // Restore genAI check
        setError('Generative AI service not initialized for sending question.');
        setIsAnsweringQuestion(false);
        return;
    }

    try {
      // Restore direct Gemini call for question answering
      const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or your preferred model for Q&A
      const prompt = `
        You are a helpful tutor for Levantine Arabic.
        The user has the following translation:
        English: "${selectedTranslationForQuestion.english}"
        Arabic: "${selectedTranslationForQuestion.arabic}"
        ${selectedTranslationForQuestion.context ? `Context: "${selectedTranslationForQuestion.context}"` : ''}

        The user's question is: "${questionText}"

        Provide a concise answer to the user's question. If you use Arabic text, also provide a simple chat-alphabet transliteration (e.g., 7 for ح, 3 for ع).
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      setAnswerText(textResponse);

    } catch (e: any) {
      console.error('Error sending question or getting answer via Gemini:', e);
      setError(e.message || 'Failed to get an answer from Gemini.');
      setAnswerText('Sorry, an error occurred while trying to get an answer.');
    } finally {
      setIsAnsweringQuestion(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Fluency
      </button>

      {/* Header and Settings Icon for the Translate page */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Translate</h2>
        
        <div className="flex items-center space-x-2">
          {/* COMMENTED OUT - Clear Cache not needed for NLLB-200
          <button
            onClick={clearTranslationCache}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            aria-label="Clear Translation Cache"
            title="Clear cached translations to get fresh results with improved Levantine Arabic"
          >
            Clear Cache
          </button>
          */}
        <button
          onClick={handleOpenSettingsModal}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Display Settings"
        >
          <Settings size={22} />
        </button>
        </div>
      </div>

      {/* Note Section with Dark Mode Classes */}
      <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md border border-emerald-100 dark:border-emerald-800">
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          <strong>Note:</strong> This translator provides words and phrases in
          authentic colloquial Levantine Arabic dialect (spoken in Lebanon, Syria, Jordan, and
          Palestine), not Modern Standard Arabic. Using Google Gemini AI with enhanced prompts optimized 
          for natural, everyday vocabulary like "لازم" (lazim) instead of formal "أنا بحاجة" (ana bi 7aja).
        </p>
        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
          💡 If you see formal Arabic (MSA) results, please clear the cache using the button above to get fresh results with the updated Levantine prompts.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6 dark:text-gray-100">
        <div className="mb-4">
          <label
            htmlFor="word"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Word or Phrase
          </label>
          <input
            type="text"
            id="word"
            value={word}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setWord(e.target.value);
              // When the main word/phrase changes, clear the context to avoid staleness
              setContext(''); 
            }}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
            placeholder="e.g. Throw"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="context"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Example (optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
            placeholder="e.g. Throw the ball to the dog"
            rows={2}
          />
        </div>

        {/* COMMENTED OUT - Dialect Selector (Using Gemini instead of NLLB-200)
          <div className="mb-4">
            <label
              htmlFor="dialect"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Arabic Dialect
            </label>
            <select
              id="dialect"
              value={selectedDialect}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDialect(e.target.value as 'apc_Arab' | 'ajp_Arab' | 'ar')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
            >
              <option value="apc_Arab">North Levantine Arabic (Syrian/Lebanese)</option>
              <option value="ajp_Arab">South Levantine Arabic (Palestinian/Jordanian)</option>
            </select>
          </div>
          */}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 flex items-center justify-center disabled:bg-emerald-400"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Send size={18} className="mr-2" />
              Translate
            </>
          )}
        </button>
      </form>

      {/* Translation Result */}
      {result && (
        <div className="mb-6 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex justify-between items-start">
            <div>
              {/* Display English word/phrase */}
              <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{result.english}</p>
              <h3 className="font-bold text-lg">{formatArabicText(result.arabic, translationShowDiacritics)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                {result.transliteration}
              </p>
            </div>
            {result.audioUrl && (
              <button
                onClick={() => playAudio(result.audioUrl)}
                className="mt-2 p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                aria-label="Play audio"
              >
                <Volume2 size={20} />
              </button>
            )}
          </div>

          {/* Display Context / Example Sentence */}
          {result.arabicSentence && (
            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
              <p className="font-medium">In context:</p>
              <p className="text-lg mt-1">{formatArabicText(result.arabicSentence, translationShowDiacritics)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {result.transliterationSentence}
              </p>
            </div>
          )}

          {/* Context or Example Arabic Translation */}
          {result.contextArabic && result.contextArabic.trim().length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
              <p className="font-medium">Context translated:</p>
              <div className="bg-gray-50 dark:bg-dark-200 p-3 rounded-lg mt-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-800 dark:text-gray-200">{result.context}</p>
                    <div className="mt-2">
                      {result.contextArabic && (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {formatArabicText(result.contextArabic, translationShowDiacritics)}
                            </p>
                            {result.contextTransliteration && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {result.contextTransliteration}
                              </p>
                            )}
                          </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add to Deck button for the latest translation */}
          <div className="flex justify-end mt-2">
            <button
              onClick={() => handleAddToDeck(result)}
              className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-2 rounded-md"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Translation History */}
      {isHistoryLoading ? (
        <p>Loading history...</p>
      ) : supabaseHistory.length > 0 ? (
        <div>
          <h3 className="font-bold text-lg mb-3">Recent Translations</h3>
          <div className="space-y-3">
            {supabaseHistory.map((item: TranslationResult) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-dark-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.english}</p>
                    {item.context && (
                      <div className="mt-1 pl-2 border-l-2 border-gray-300 dark:border-gray-500">
                        <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                          Translation:
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {item.context}
                        </p>
                        {item.contextArabic && (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {formatArabicText(item.contextArabic, translationShowDiacritics)}
                            </p>
                            {item.contextTransliteration && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.contextTransliteration}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatArabicText(item.arabic, translationShowDiacritics)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.transliteration}
                    </p>
                  </div>
                </div>
                {/* Add to Deck button and Ask Question button */}
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    onClick={() => handleAddToDeck(item)}
                    className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-2 rounded-md"
                  >
                    <Plus size={24} />
                  </button>
                  <button
                    onClick={() => handleAskQuestionClick(item)}
                    className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-2 rounded-md text-2xl"
                  >
                    ?
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No recent translations yet.</p>
      )}

      {/* Diacritics Settings Modal */}
      {showDiacriticsSettingsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={handleCloseSettingsModal}
        >
          <div
            className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Display Settings</h3>
              <button
                onClick={handleCloseSettingsModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close settings"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <label htmlFor="diacritics-toggle-label" className="text-gray-700 dark:text-gray-300">
                  Show Diacritics (Tashkeel) <span className="text-sm text-gray-500 dark:text-gray-400">(recommended for beginners)</span>
                </label>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="diacritics-toggle"
                    className="sr-only"
                    checked={modalShowDiacriticsState}
                    onChange={() => setModalShowDiacriticsState(!modalShowDiacriticsState)}
                    aria-labelledby="diacritics-toggle-label"
                  />
                  {/* Track */}
                  <div className={`block w-14 h-8 rounded-full cursor-pointer transition-colors duration-300 ease-in-out ${modalShowDiacriticsState ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                       onClick={() => setModalShowDiacriticsState(!modalShowDiacriticsState)}
                  ></div>
                  {/* Dot */}
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ease-in-out transform ${modalShowDiacriticsState ? 'translate-x-6' : 'translate-x-0'}`}
                       onClick={() => setModalShowDiacriticsState(!modalShowDiacriticsState)}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 pt-1">
                Controls whether vowel marks (e.g., fatha, damma, kasra) and other diacritics are shown on Arabic text.
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question and Answer Section/Modal */}
      {showQuestionInput && selectedTranslationForQuestion && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out overflow-hidden"
          onClick={() => setShowQuestionInput(false)}
        >
          <div
            className="bg-white dark:bg-dark-200 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Ask a Question about Translation</h3>
              <button
                onClick={() => setShowQuestionInput(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close question modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">Translation:</p>
              <p className="font-medium text-lg mb-1">{selectedTranslationForQuestion.english}</p>
              <p className="font-bold text-lg mb-1">{formatArabicText(selectedTranslationForQuestion.arabic, translationShowDiacritics)}</p>
              {selectedTranslationForQuestion.transliteration && (
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{selectedTranslationForQuestion.transliteration}</p>
              )}
              {selectedTranslationForQuestion.context && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Context: {selectedTranslationForQuestion.context}</p>
              )}
            </div>

            <textarea
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-gray-50 dark:bg-dark-100 text-gray-800 dark:text-gray-200"
              rows={4}
              placeholder="Type your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            ></textarea>

            <button
              onClick={handleSendQuestion}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 flex items-center justify-center disabled:opacity-50 mb-4"
              disabled={!questionText || isAnsweringQuestion}
            >
              {isAnsweringQuestion ? <Loader2 className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
              {isAnsweringQuestion ? 'Getting Answer...' : 'Send Question'}
            </button>

            {answerText && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Answer:</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{answerText}</p>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Add to Deck Modal Placeholder */}
      {showAddToDeckModal && translationItemToAdd && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={handleCloseAddToDeckModal}
        >
          <div
            className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Add to Deck</h3>
              <button
                onClick={handleCloseAddToDeckModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Translation: <strong>{translationItemToAdd.english}</strong> - <strong>{formatArabicText(translationItemToAdd.arabic, translationShowDiacritics)}</strong>
            </p>

            {/* Existing Decks */}
            {userDecks.length > 0 && (
              <div className="mb-4">
                <label htmlFor="deck-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select existing deck:</label>
                <select
                  id="deck-select"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
                  value={selectedDeckId || ''}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                >
                  <option value="" disabled>-- Select a deck --</option>
                  {userDecks.map((deck) => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Create New Deck */}
            <div className="mb-4">
              <label htmlFor="new-deck-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or create a new deck:</label>
              <input
                type="text"
                id="new-deck-name"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100 mb-2"
                placeholder="New deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
              />
              <input
                type="text"
                id="new-deck-icon"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100 mb-2"
                placeholder="Deck icon (e.g., emoji or icon name)"
                value={newDeckIcon}
                onChange={(e) => setNewDeckIcon(e.target.value)}
              />
              <textarea
                id="new-deck-description"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
                placeholder="Deck description (optional)"
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseAddToDeckModal}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-700 mr-2"
              >
                Cancel
              </button>
              {newDeckName.trim() !== '' ? (
                <button
                  onClick={handleCreateAndAddToDeck}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400"
                  disabled={!newDeckName.trim()}
                >
                  Create and Add
                </button>
              ) : (
                <button
                  onClick={handleAddToExistingDeck}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400"
                  disabled={!selectedDeckId}
                >
                  Add to Selected Deck
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;
