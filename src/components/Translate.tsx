import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, Settings, X, Check, Loader2, FolderPlus, Plus, HelpCircle } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabaseClient';

// Define the translation result type
interface TranslationResult {
  id: string;
  english: string;
  context: string;
  arabic: string;
  arabicSentence: string;
  transliteration: string;
  transliterationSentence: string;
  audioUrl: string;
  contextArabic?: string;
  contextTransliteration?: string;
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
  const [showDiacritics, setShowDiacritics] = useState(true);
  const [modalShowDiacriticsState, setModalShowDiacriticsState] = useState(showDiacritics);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddToDeckModal, setShowAddToDeckModal] = useState(false);
  const [translationItemToAdd, setTranslationItemToAdd] = useState<TranslationResult | null>(null);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckIcon, setNewDeckIcon] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // State for asking a question about a translation
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [selectedTranslationForQuestion, setSelectedTranslationForQuestion] = useState<TranslationResult | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);

  const { user } = useSupabase();
  const saveSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Helper function to remove diacritics
  const removeDiacritics = (text: string): string => {
    if (!text) return '';
    // Regex for common Arabic diacritics (Fatha, Damma, Kasra, Tanweens, Shadda, Sukun, Dagger Alif)
    return text.replace(/[ً-ْٰ]/g, '');
  };

  const arabicTextToShow = (text: string | undefined | null): string => {
    if (!text) return '';
    return showDiacritics ? text : removeDiacritics(text);
  };

  const translateWithGemini = async (text: string, contextText: string) => {
    console.log('translateWithGemini called with text:', text, 'and context:', contextText);
    console.log('Attempting to read VITE_GEMINI_API_KEY...');
    if (!geminiApiKey) {
      console.error('Google API key not found in environment variables.');
      setError('Google API key is not configured. Please check your .env.local file.');
      return null;
    }
    console.log('API key found. Proceeding with translation.');

    setIsLoading(true);
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey as string);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17"});

      const prompt = `
        Translate the following English text to Levantine Arabic (specifically the dialect spoken in Lebanon, Syria, Jordan, and Palestine).
        
        IMPORTANT INSTRUCTIONS:
        1. Provide the translation in Arabic script, including all necessary diacritics (tashkeel) like fatha, damma, kasra, sukon, shadda, etc.
        2. If the English word/phrase is a noun or adjective and the context provided implies a specific grammatical gender (male or female), translate it using the appropriate gendered form. In the JSON output for the word/phrase translation, add " (m)" after the Arabic translation if it's masculine or " (f)" if it's feminine.
        3. Provide a transliteration using Arabic chat alphabet according to the following rules:
           - د: d
           - ش: sh
           - ض: D
           - ط: T
           - غ: gh
           - ى: a
           - و: w or uu
           - ة: a/eh
           - ء: 2
           - ت: t
           - ج: j
           - ح: 7
           - خ: kh
           - ث: th
           - س: s
           - ن: n
           - ه: h
           - ب: b
           - ز: z
           - ف: f
           - ك: k
           - ا: a
           - ع: 3
           - ي: y or ii
           - ص: S
           - ذ: d or z
           - ر: r
           - ل: l
           - م: m
           - ظ: z or D
           - ق: 2
        4. Also include short vowels and sukon in the transliteration using the following:
           - Fatha (َ): a
           - Damma (ُ): u
           - Kasra (ِ): i
           - Sukon (ْ): represented by the absence of a vowel after the consonant.
        5. If context is provided, also translate a full sentence using the word in that context.
        6. Use authentic Levantine dialect vocabulary and grammar, NOT Modern Standard Arabic.
        7. Format your response as a valid JSON object with these exact fields:
           - "arabic": string (the translated word/phrase in Arabic script)
           - "transliteration": string (transliteration using Arabic chat alphabet)
           - "arabicSentence": string (if context provided, a sentence using the word in Arabic script, otherwise an empty string)
           - "transliterationSentence": string (if context provided, transliteration of the sentence, otherwise an empty string)
           ${contextText ? `           - "contextArabic": string (the Arabic translation of the context text)
           - "contextTransliteration": string (transliteration of the context text using Arabic chat alphabet)` : ''}
        
        English word/phrase: "${text}"
        ${contextText ? `Context or example: "${contextText}"` : ''}
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();
      
      if (responseText) {
        try {
          // Gemini might return the JSON within a markdown block, so we need to extract it.
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          let parsableText = responseText;
          if (jsonMatch && jsonMatch[1]) {
            parsableText = jsonMatch[1];
          }
          
          const parsedResponse = JSON.parse(parsableText);

          const translationResult: TranslationResult = {
            id: '',
            english: text,
            context: contextText,
            arabic: parsedResponse.arabic || 'مش موجود',
            arabicSentence: parsedResponse.arabicSentence || '',
            transliteration: parsedResponse.transliteration || '',
            transliterationSentence: parsedResponse.transliterationSentence || '',
            audioUrl: '', // No audio URL for Gemini translations yet
            contextArabic: parsedResponse.contextArabic || '',
            contextTransliteration: parsedResponse.contextTransliteration || '',
          };

          // Insert the translation into the user_translation_history table
          if (user) {
            const { data, error: insertError } = await supabase
              .from('user_translation_history')
              .insert({
                user_id: user.id,
                english_text: text,
                context_text: contextText,
                arabic_text: parsedResponse.arabic || 'مش موجود',
                transliteration_text: parsedResponse.transliteration || '',
                context_arabic: parsedResponse.contextArabic || null,
                context_transliteration: parsedResponse.contextTransliteration || null,
                // created_at is automatically set by the database default value
              });

            if (insertError) {
              console.error('Error saving translation to history:', insertError);
              // Optionally, set an error state for the user
            } else {
              console.log('Translation saved to history:', data);
              // After successful insertion, update the history state locally
              // Explicitly type the data to resolve linter errors
              const insertedData = data as UserTranslationHistoryRow[] | null;
              if (insertedData && insertedData.length > 0) {
                const newHistoryItem: TranslationResult = {
                  id: insertedData[0].id,
                  english: insertedData[0].english_text || '',
                  context: insertedData[0].context_text || '',
                  arabic: insertedData[0].arabic_text || '',
                  arabicSentence: '', // Not stored in this table yet
                  transliteration: insertedData[0].transliteration_text || '',
                  transliterationSentence: '', // Not stored in this table yet
                  audioUrl: '', // Not stored in this table yet
                  contextArabic: insertedData[0].context_arabic || '',
                  contextTransliteration: insertedData[0].context_transliteration || '',
                };
                // Prepend the new item to the history, keeping the limit if necessary
                setSupabaseHistory(currentHistory => [newHistoryItem, ...currentHistory].slice(0, 20)); // Assuming a limit of 20 as in fetchHistory
              }
            }
          }

          return translationResult;
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', parseError, 'Raw response:', responseText);
          setError('Failed to parse translation response. Check console for details.');
          return null;
        }
      } else {
        setError('No translation received from Gemini');
        return null;
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      setError('Translation failed. Please check your API key and network. Check console for details.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!word.trim()) return;

    // Try to translate with Gemini
    const geminiResult = await translateWithGemini(word, context);

    if (geminiResult) {
      setResult(geminiResult);
    } else if (!error.includes('API key')) { // Avoid fallback if API key is the issue
      // Fallback to sample data if Gemini fails for other reasons
      const lowerWord = word.toLowerCase().trim();
      const match = sampleTranslations.find(
        (item) => item.english.toLowerCase() === lowerWord
      );

      if (match) {
        setResult(match);
      } else {
        const fallbackResult: TranslationResult = {
          id: Date.now().toString(),
          english: word,
          context: context,
          arabic: 'مش موجود', 
          arabicSentence: 'هاي الكلمة مش موجودة بالقاموس', 
          transliteration: 'mish mawjood',
          transliterationSentence: 'hay il-kilme mish mawjoode bil-2amoos',
          audioUrl: '',
          contextArabic: '',
          contextTransliteration: '',
        };

        setResult(fallbackResult);
      }
    }

    setWord('');
    setContext('');
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

  // Effect to LOAD user-specific settings when the user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        setIsLoading(true); // Indicate loading of settings
        try {
          const { data, error: fetchUserError } = await supabase.auth.getUser();
          if (fetchUserError) {
            console.error('Error fetching user for settings:', fetchUserError);
            setShowDiacritics(true); // Default on error
            return;
          }
          if (data?.user?.user_metadata) {
            const userMetadata = data.user.user_metadata;
            if (userMetadata.translateSettings !== undefined && userMetadata.translateSettings.showDiacritics !== undefined) {
              const storedSetting = userMetadata.translateSettings.showDiacritics;
              setShowDiacritics(currentSetting => currentSetting !== storedSetting ? storedSetting : currentSetting);
            } else {
              setShowDiacritics(true); // Default if not set in metadata
            }
          } else {
             setShowDiacritics(true); // Default if no metadata
          }
        } catch (e) {
            console.error("Error in loadSettings:", e);
            setShowDiacritics(true); // Fallback default
        } finally {
            setIsLoading(false); // Done loading settings
        }
      } else {
         // If user logs out, reset settings state to default (true)
         setShowDiacritics(true);
      }
    };

    loadSettings();
  }, [user]); // Depend on user to load settings

  // Debounced function to SAVE settings to Supabase
  const saveDiacriticsSettingToSupabase = async (newSettingValue: boolean) => {
    if (!user) return;

    // Clear any existing timeout
    if (saveSettingsTimeoutRef.current) {
      clearTimeout(saveSettingsTimeoutRef.current);
    }

    // Set a new timeout
    saveSettingsTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: userData, error: fetchError } = await supabase.auth.getUser(); // Get fresh user data
        if (fetchError) {
           console.error('Error fetching user before saving settings:', fetchError);
           return;
        }

        const existingMetadata = userData?.user?.user_metadata || {};
        const newMetadata = {
            ...existingMetadata,
            translateSettings: { ...existingMetadata.translateSettings, showDiacritics: newSettingValue }
        };

        const { error: updateError } = await supabase.auth.updateUser({ data: newMetadata });
        if (updateError) {
          console.error('Error saving diacritics setting to Supabase:', updateError);
        } else {
          console.log('Diacritics setting saved to Supabase:', newSettingValue);
        }
      } catch (e) {
          console.error("Error in saveDiacriticsSettingToSupabase:", e);
      }
    }, 1000); // 1-second debounce
  };

  // Handler for opening the settings modal
  const handleOpenSettingsModal = () => {
    // Initialize modal state with current main state
    setModalShowDiacriticsState(showDiacritics);
    setShowDiacriticsSettingsModal(true);
  };

  // Handler for saving changes from the modal
  const handleSaveSettings = () => {
    // Update main state with modal state
    setShowDiacritics(modalShowDiacriticsState);
    // Trigger debounced save to Supabase
    saveDiacriticsSettingToSupabase(modalShowDiacriticsState);
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
    if (!questionText || !selectedTranslationForQuestion || !geminiApiKey) {
      setError('Missing question, translation, or API key.');
      return;
    }

    setIsAnsweringQuestion(true);
    setAnswerText('');
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey as string);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17"});

      const prompt = `
        You are a professional tutor in Arabic, specializing ONLY in the Levantine dialect (Lebanon, Syria, Jordan, and Palestine).
        Your responses should be helpful, informative, and focused on explaining the provided English-Levantine Arabic translation.

        Here is the translation the user is asking about:
        English: "${selectedTranslationForQuestion.english}"
        Arabic: "${selectedTranslationForQuestion.arabic}"
        ${selectedTranslationForQuestion.context ? `Context: "${selectedTranslationForQuestion.context}"` : ''}

        The user's question is: "${questionText}"

        Please answer the user's question based on the provided translation, acting as a Levantine Arabic tutor.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      if (responseText) {
        setAnswerText(responseText);
      } else {
        setAnswerText('Could not get an answer from the tutor.');
      }

    } catch (apiError) {
      console.error('Error calling Gemini API for question:', apiError);
      setError('Failed to get an answer. Please try again.');
      setAnswerText('Error getting answer.');
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
        <button
          onClick={handleOpenSettingsModal}
          className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Display Settings"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* Note Section with Dark Mode Classes */}
      <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md border border-emerald-100 dark:border-emerald-800">
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          <strong>Note:</strong> This translator provides words and phrases in
          Levantine Arabic dialect (spoken in Lebanon, Syria, Jordan, and
          Palestine), not Modern Standard Arabic.
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWord(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
            placeholder="Enter a word or phrase"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="context"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Context or Example (optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
            placeholder="e.g., 'I want to eat lunch'"
            rows={2}
          />
        </div>

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
              <h3 className="font-bold text-lg">{arabicTextToShow(result.arabic)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                {result.transliteration}
              </p>
            </div>
            {result.audioUrl && (
              <button
                onClick={() => playAudio(result.audioUrl)}
                className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-700"
              >
                <Volume2 size={18} />
              </button>
            )}
          </div>

          {result.arabicSentence && (
            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
              <p className="font-medium">In context:</p>
              <p className="text-lg mt-1">{arabicTextToShow(result.arabicSentence)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {result.transliterationSentence}
              </p>
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
                          Context translation:
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {item.context}
                        </p>
                        {item.contextArabic && (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {arabicTextToShow(item.contextArabic)}
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
                    <p className="font-bold">{arabicTextToShow(item.arabic)}</p>
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
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
          onClick={() => setShowQuestionInput(false)}
        >
          <div
            className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Ask a Question about Translation</h3>
              <button
                onClick={() => setShowQuestionInput(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close question modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">Translation:</p>
              <p className="font-medium text-lg mb-1">{selectedTranslationForQuestion.english}</p>
              <p className="font-bold text-lg mb-1">{arabicTextToShow(selectedTranslationForQuestion.arabic)}</p>
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
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 flex items-center justify-center disabled:opacity-50"
              disabled={!questionText || isAnsweringQuestion}
            >
              {isAnsweringQuestion ? <Loader2 className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
              {isAnsweringQuestion ? 'Getting Answer...' : 'Send Question'}
            </button>

            {answerText && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Answer:</h4>
                <p className="text-gray-700 dark:text-gray-300">{answerText}</p>
              </div>
            )}

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
              Translation: <strong>{translationItemToAdd.english}</strong> - <strong>{arabicTextToShow(translationItemToAdd.arabic)}</strong>
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



