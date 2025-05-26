import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { renderCardLayout } from '../utils/templateRenderer';

// Define the expected structure of the 'fields' JSONB column for a basic card
interface CardFields {
  english: string;
  arabic: string;
  transliteration?: string;
  clozeText?: string; // For cloze cards (not implemented in this CardView yet)
  imageUrl?: string; // For image cards (not fully implemented in this CardView yet)
  // Add other fields as needed for specific card types
}

interface CardViewProps {
  card: {
    id: string;
    fields: CardFields;
    layout?: any; // Add layout field for template rendering
    audio_url?: string | null;
    english?: string;
    arabic?: string;
    // Add deck information to identify verb cards
    deck?: {
      name: string;
    };
  };
  onQualitySelect: (quality: number) => void;
  onAnswerShown: () => void;
  selectedQuality: number | null;
  studyDirection: 'en-ar' | 'ar-en';
  showTransliteration: boolean;
  separateConjugationTable?: boolean; // New prop to control if conjugation table should be rendered separately
}

// Define the ref handle type
export interface CardViewHandle {
  flipCard: () => void;
  getConjugationTable?: () => JSX.Element | null;
}

const CardView = forwardRef<CardViewHandle, CardViewProps>(({ 
  card, 
  onQualitySelect, 
  onAnswerShown, 
  selectedQuality, 
  studyDirection, 
  showTransliteration,
  separateConjugationTable = false
}: CardViewProps, ref) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [allConjugations, setAllConjugations] = useState<any[]>([]);
  const [isLoadingConjugations, setIsLoadingConjugations] = useState(false);
  const [verbBaseData, setVerbBaseData] = useState<{word_arabic: string, word_transliteration: string} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useImperativeHandle(ref, () => ({
    flipCard: handleFlip,
    getConjugationTable: () => isVerbCard && separateConjugationTable ? (
      <div className="p-4 space-y-4 bg-white dark:bg-dark-200 rounded-lg shadow-xl">
        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-4">
          Conjugations
        </h3>
        {renderConjugationTableContent()}
        {card.audio_url && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              playAudio(card.audio_url);
            }}
            className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 mx-auto block"
          >
            <Volume2 size={20} />
          </button>
        )}
      </div>
    ) : null,
  }));

  useEffect(() => {
    setIsFlipped(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, [card.id]);

  // Fetch all conjugations for verb cards
  useEffect(() => {
    const fetchAllConjugations = async () => {
      // Check if this is a verb card
      if (card.deck?.name !== 'Verbs') {
        setAllConjugations([]);
        setVerbBaseData(null);
        return;
      }

      const verbFields = card.fields as any;
      
      // Check if this card has the verb structure
      if (!verbFields?.past || !verbFields?.present || !verbFields?.word) {
        setAllConjugations([]);
        setVerbBaseData(null);
        return;
      }

      setIsLoadingConjugations(true);
      
      try {
        // Transform the verb data structure to match what the table expects
        const pronounOrder = ['i', 'you_m', 'you_f', 'you_pl', 'he', 'she', 'we', 'they'];
        
        const conjugationData = pronounOrder.map(pronoun => {
          const pastData = verbFields.past?.[pronoun];
          const presentData = verbFields.present?.[pronoun];
          const imperativeData = verbFields.imperative?.[pronoun];
          
          return {
            'English Past': pastData?.en || '-',
            'Arabic Past': pastData?.ar || '-',
            'Transliteration Past': pastData?.tr || '-',
            'English Present': presentData?.en || '-',
            'Arabic Present': presentData?.ar || '-',
            'Transliteration Present': presentData?.tr || '-',
            'English Imperative': imperativeData?.en || '-',
            'Arabic Imperative': imperativeData?.ar || '-',
            'Transliteration Imperative': imperativeData?.tr || '-',
            'Word': verbFields.word
          };
        });

        console.log('Fetched conjugations from card data:', conjugationData);
        setAllConjugations(conjugationData);

        // Fetch verb base data from default_verb_flashcards table
        await fetchVerbBaseData(conjugationData);
      } catch (err) {
        console.error('Error in fetchAllConjugations:', err);
        setAllConjugations([]);
        setVerbBaseData(null);
      } finally {
        setIsLoadingConjugations(false);
      }
    };

    const fetchVerbBaseData = async (conjugationData: any[] = allConjugations) => {
      try {
        // Get the English word from the card to match against default_verb_flashcards
        const verbFields = card.fields as any;
        const wordEnglish = typeof verbFields.word === 'object' ? 
          verbFields.word?.english : 
          (typeof verbFields.word === 'string' ? verbFields.word : card.fields?.english);

        console.log('🔍 fetchVerbBaseData - Attempting to fetch for English word:', wordEnglish);
        console.log('🔍 fetchVerbBaseData - Card fields:', card.fields);
        console.log('🔍 fetchVerbBaseData - Verb fields word:', verbFields.word);

        if (!wordEnglish) {
          console.log('No English word found to query default_verb_flashcards, using fallback');
          // Fallback: try to extract Arabic and transliteration from card data
          setFallbackVerbData(conjugationData);
          return;
        }

        // Query the default_verb_flashcards table
        const { data, error } = await supabase
          .from('default_verb_flashcards')
          .select('word_arabic, word_transliteration')
          .eq('word_english', wordEnglish)
          .single();

        if (error) {
          console.log('No matching verb found in default_verb_flashcards:', error);
          console.log('Using fallback verb data from card');
          // Fallback: try to extract Arabic and transliteration from card data
          setFallbackVerbData(conjugationData);
          return;
        }

        if (data) {
          setVerbBaseData({
            word_arabic: data.word_arabic || '',
            word_transliteration: data.word_transliteration || ''
          });
          console.log('✅ Fetched verb base data from default_verb_flashcards:', data);
        } else {
          console.log('No data returned from default_verb_flashcards, using fallback');
          setFallbackVerbData(conjugationData);
        }
      } catch (err) {
        console.error('Error fetching verb base data:', err);
        setFallbackVerbData(conjugationData);
      }
    };

    const setFallbackVerbData = (conjugationData: any[] = allConjugations) => {
      // Try to extract Arabic and transliteration from the card data itself
      const verbFields = card.fields as any;
      let wordArabic = '';
      let wordTransliteration = '';

      // Try to get from the word field first
      if (typeof verbFields.word === 'object' && verbFields.word !== null) {
        wordArabic = verbFields.word.arabic || verbFields.word.ar || '';
        wordTransliteration = verbFields.word.transliteration || verbFields.word.tr || '';
      }

      // If not found, try to extract from the first conjugation
      if (!wordArabic && conjugationData.length > 0) {
        const firstConj = conjugationData[0];
        wordArabic = firstConj['Arabic Past'] || '';
        wordTransliteration = firstConj['Transliteration Past'] || '';
      }

      // If still not found, try card fields directly
      if (!wordArabic) {
        wordArabic = card.fields?.arabic || '';
        wordTransliteration = card.fields?.transliteration || '';
      }

      console.log('🔄 Using fallback verb data:', { wordArabic, wordTransliteration });
      
      setVerbBaseData({
        word_arabic: wordArabic,
        word_transliteration: wordTransliteration
      });
    };

    fetchAllConjugations();
  }, [card.id, card.deck?.name]);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      onAnswerShown();
      // Play audio only if it exists, and current direction is English to Arabic (meaning Arabic is on the back)
      if (card.audio_url && studyDirection === 'en-ar') { 
        playAudio(card.audio_url); 
      }
    }
  };

  const handleQualitySelect = (quality: number) => {
    onQualitySelect(quality);
  };

  const playAudio = (audioUrl: string | null | undefined) => {
    try {
      if (!audioUrl) return;
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onerror = (e) => console.error('Audio failed to load:', e);
      } else {
        audioRef.current.src = audioUrl;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => console.error('Error playing audio:', error));
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
    }
  };

  const frontText = studyDirection === 'en-ar' ? card.fields?.english : card.fields?.arabic;
  const backText = studyDirection === 'en-ar' ? card.fields?.arabic : card.fields?.english;
  const isRtlFront = studyDirection === 'ar-en';
  const isRtlBack = studyDirection === 'en-ar';

  // Ensure frontText and backText are strings, not objects
  const safeFrontText = typeof frontText === 'object' && frontText !== null ? 
    ((frontText as any)?.english || (frontText as any)?.arabic || 'No text') : frontText;
  const safeBackText = typeof backText === 'object' && backText !== null ? 
    ((backText as any)?.english || (backText as any)?.arabic || 'No text') : backText;

  // Check if this is a verb card
  const isVerbCard = card.deck?.name === 'Verbs' || (
    (card.fields as any)?.past && 
    (card.fields as any)?.present && 
    (card.fields as any)?.word
  );
  
  console.log('🔍 CardView - Verb card detection:', {
    deckName: card.deck?.name,
    hasPast: !!(card.fields as any)?.past,
    hasPresent: !!(card.fields as any)?.present,
    hasWord: !!(card.fields as any)?.word,
    isVerbCard,
    cardFields: card.fields
  });

  // Function to render just the conjugation table content without headers
  const renderConjugationTableContent = () => {
    // Check if we have verb conjugation data
    if (isLoadingConjugations) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading conjugations...
        </div>
      );
    }

    if (allConjugations.length === 0) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No conjugation data available
        </div>
      );
    }

    // Define the order of pronouns as they should appear
    const pronounOrder = [
      'I ',
      'You (m.) ',
      'You (f.) ',
      'He ',
      'She ',
      'We ',
      'You (pl.) ',
      'They '
    ];

    // Sort conjugations by pronoun order
    const sortedConjugations = allConjugations.sort((a, b) => {
      const aIndex = pronounOrder.findIndex(p => a['English Past'].startsWith(p));
      const bIndex = pronounOrder.findIndex(p => b['English Past'].startsWith(p));
      return aIndex - bIndex;
    });

    // Render individual tense table for mobile
    const renderTenseTable = (tense: string, englishKey: string, arabicKey: string, transliterationKey: string) => {
      let conjugationsToShow = sortedConjugations;
      
      // Special handling for imperative tense on mobile
      if (tense === 'Imperative') {
        // Filter out entries that are just "-" and remove duplicates
        const seenEntries = new Set();
        conjugationsToShow = sortedConjugations.filter((conj) => {
          const englishValue = conj[englishKey];
          const arabicValue = conj[arabicKey];
          const transliterationValue = conj[transliterationKey];
          
          // Skip if all values are "-" or empty
          if ((!englishValue || englishValue === '-') && 
              (!arabicValue || arabicValue === '-') && 
              (!transliterationValue || transliterationValue === '-')) {
            return false;
          }
          
          // Create a unique key for this entry
          const entryKey = `${englishValue || ''}-${arabicValue || ''}-${transliterationValue || ''}`;
          
          // Skip if we've already seen this exact combination
          if (seenEntries.has(entryKey)) {
            return false;
          }
          
          seenEntries.add(entryKey);
          return true;
        });
      }
      
      return (
        <div className="mb-6">
          <h4 className="text-md font-bold text-center text-gray-900 dark:text-white mb-3">
            {tense}
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-200">
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                </tr>
              </thead>
              <tbody>
                {conjugationsToShow.map((conj, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {conj[englishKey] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                      {conj[arabicKey] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                      {showTransliteration ? (conj[transliterationKey] || '-') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <>
        {/* Mobile view: Separate tables for each tense */}
        <div className="block md:hidden">
          {renderTenseTable('Past', 'English Past', 'Arabic Past', 'Transliteration Past')}
          {renderTenseTable('Present', 'English Present', 'Arabic Present', 'Transliteration Present')}
          {renderTenseTable('Imperative', 'English Imperative', 'Arabic Imperative', 'Transliteration Imperative')}
        </div>

        {/* Desktop view: Combined table */}
        <div className="hidden md:block">
          <div className="w-full">
            <table className="w-full border border-gray-300 dark:border-gray-600 text-xs table-fixed">
              <thead>
                <tr className="bg-gray-100 dark:bg-dark-100">
                  <th className="px-1 py-1 border dark:border-gray-600 text-center font-bold text-xs text-gray-900 dark:text-gray-100" colSpan={3}>
                    Past
                  </th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-center font-bold text-xs text-gray-900 dark:text-gray-100" colSpan={3}>
                    Present
                  </th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-center font-bold text-xs text-gray-900 dark:text-gray-100" colSpan={3}>
                    Imperative
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-dark-200">
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">En</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">Ar</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">Trans</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">En</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">Ar</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">Trans</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">En</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">Ar</th>
                  <th className="px-1 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 w-1/9">Trans</th>
                </tr>
              </thead>
              <tbody>
                {sortedConjugations.map((conj, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                    {/* Past Tense */}
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs truncate">
                      {conj['English Past'] || '-'}
                    </td>
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-900 dark:text-white text-xs truncate" dir="rtl">
                      {conj['Arabic Past'] || '-'}
                    </td>
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic text-xs truncate">
                      {showTransliteration ? (conj['Transliteration Past'] || '-') : '-'}
                    </td>
                    
                    {/* Present Tense */}
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs truncate">
                      {conj['English Present'] || '-'}
                    </td>
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-900 dark:text-white text-xs truncate" dir="rtl">
                      {conj['Arabic Present'] || '-'}
                    </td>
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic text-xs truncate">
                      {showTransliteration ? (conj['Transliteration Present'] || '-') : '-'}
                    </td>
                    
                    {/* Imperative Tense */}
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs truncate">
                      {conj['English Imperative'] || '-'}
                    </td>
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-900 dark:text-white text-xs truncate" dir="rtl">
                      {conj['Arabic Imperative'] || '-'}
                    </td>
                    <td className="px-1 py-1 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic text-xs truncate">
                      {showTransliteration ? (conj['Transliteration Imperative'] || '-') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderVerbConjugationTable = () => {
    // Check if we have verb conjugation data
    if (isLoadingConjugations) {
      return (
        <div className="p-4">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading conjugations...
          </p>
        </div>
      );
    }

    if (allConjugations.length === 0) {
      return (
        <div className="p-4">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No conjugation data available
          </p>
        </div>
      );
    }

    // Define the order of pronouns as they should appear
    const pronounOrder = [
      'I ',
      'You (m.) ',
      'You (f.) ',
      'He ',
      'She ',
      'We ',
      'You (pl.) ',
      'They '
    ];

    // Sort conjugations by pronoun order
    const sortedConjugations = allConjugations.sort((a, b) => {
      const aIndex = pronounOrder.findIndex(p => a['English Past'].startsWith(p));
      const bIndex = pronounOrder.findIndex(p => b['English Past'].startsWith(p));
      return aIndex - bIndex;
    });

    // Render individual tense table for mobile
    const renderTenseTable = (tense: string, englishKey: string, arabicKey: string, transliterationKey: string) => {
      let conjugationsToShow = sortedConjugations;
      
      // Special handling for imperative tense on mobile
      if (tense === 'Imperative') {
        // Filter out entries that are just "-" and remove duplicates
        const seenEntries = new Set();
        conjugationsToShow = sortedConjugations.filter((conj) => {
          const englishValue = conj[englishKey];
          const arabicValue = conj[arabicKey];
          const transliterationValue = conj[transliterationKey];
          
          // Skip if all values are "-" or empty
          if ((!englishValue || englishValue === '-') && 
              (!arabicValue || arabicValue === '-') && 
              (!transliterationValue || transliterationValue === '-')) {
            return false;
          }
          
          // Create a unique key for this entry
          const entryKey = `${englishValue || ''}-${arabicValue || ''}-${transliterationValue || ''}`;
          
          // Skip if we've already seen this exact combination
          if (seenEntries.has(entryKey)) {
            return false;
          }
          
          seenEntries.add(entryKey);
          return true;
        });
      }
      
      return (
        <div className="mb-6">
          <h4 className="text-md font-bold text-center text-gray-900 dark:text-white mb-3">
            {tense}
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-200">
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                </tr>
              </thead>
              <tbody>
                {conjugationsToShow.map((conj, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {conj[englishKey] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                      {conj[arabicKey] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                      {showTransliteration ? (conj[transliterationKey] || '-') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    // Get the base verb information from the default_verb_flashcards table
    let wordArabic = '';
    let wordTransliteration = '';
    
    if (verbBaseData) {
      // Use data fetched from default_verb_flashcards table
      wordArabic = verbBaseData.word_arabic || '';
      wordTransliteration = verbBaseData.word_transliteration || '';
    } else {
      // Fallback to card fields if database data is not available
      const verbFields = card.fields as any;
      const wordData = verbFields?.word;
      
      if (typeof wordData === 'object' && wordData !== null) {
        wordArabic = wordData.arabic || wordData.ar || '';
        wordTransliteration = wordData.transliteration || wordData.tr || '';
      } else if (typeof wordData === 'string') {
        // If word is a string, try to extract from the first conjugation
        const firstConj = allConjugations[0];
        if (firstConj) {
          // Try to get from past tense as fallback
          wordArabic = firstConj['Arabic Past'] || '';
          wordTransliteration = firstConj['Transliteration Past'] || '';
        }
      }
    }

    return (
      <div className="p-4 space-y-4">
        {/* Display Arabic word and transliteration above Conjugations heading */}
        {(wordArabic || wordTransliteration) && (
          <div className="text-center mb-4">
            {wordArabic && (
              <p className="text-xl text-gray-900 dark:text-white mb-2" dir="rtl">
                {wordArabic}
              </p>
            )}
            {wordTransliteration && showTransliteration && (
              <p className="text-lg italic text-gray-600 dark:text-gray-400">
                {wordTransliteration}
              </p>
            )}
          </div>
        )}
        
        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-4">
          Conjugations
        </h3>
        
        {renderConjugationTableContent()}

        {card.audio_url && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              playAudio(card.audio_url);
            }}
            className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 mx-auto block"
          >
            <Volume2 size={20} />
          </button>
        )}
      </div>
    );
  };

  const renderFrontContent = () => {
    if (isVerbCard && card.layout) {
      // For verb cards with layout templates, use template renderer
      const renderedLayout = renderCardLayout(card.layout, card.fields);
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
          <div 
            className="text-2xl font-bold text-center text-gray-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: renderedLayout.question }}
          />
        </div>
      );
    } else if (isVerbCard) {
      // Fallback for verb cards without layout templates
      const verbFields = card.fields as any;
      let verbInfinitive = verbFields.word || safeFrontText;
      
      // Ensure verbInfinitive is a string, not an object
      if (typeof verbInfinitive === 'object') {
        console.warn('verbInfinitive is an object:', verbInfinitive);
        verbInfinitive = verbInfinitive?.english || verbInfinitive?.arabic || safeFrontText || 'Unknown verb';
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
          <p className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {verbInfinitive}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            (Verb)
          </p>
        </div>
      );
    }

    return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
      <p 
        dir={isRtlFront ? 'rtl' : 'ltr'}
        className={`text-2xl font-bold text-center text-gray-900 dark:text-white ${isRtlFront ? '' : ''}`}>
        {safeFrontText || (studyDirection === 'en-ar' ? 'No English text' : 'No Arabic text')}
      </p>
      {/* Render transliteration on the front if Arabic is on the front and showTransliteration is true */}
      {studyDirection === 'ar-en' && showTransliteration && card.fields?.transliteration && (
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
          ({card.fields.transliteration})
        </p>
      )}
      {card.fields?.imageUrl && (
        <img src={card.fields.imageUrl} alt="Flashcard content" className="mt-4 max-h-40 object-contain" />
      )}
    </div>
  );
  };

  const renderBackContent = () => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-dark-200 rounded-b-lg">
      <p 
        dir={isRtlBack ? 'rtl' : 'ltr'}
        className={`text-3xl font-bold text-center text-gray-900 dark:text-white ${isRtlBack ? '' : ''}`}>
        {safeBackText || (studyDirection === 'en-ar' ? 'No Arabic text' : 'No English text')}
      </p>
      {/* Render transliteration on the back if Arabic is on the back and showTransliteration is true */}
      {studyDirection === 'en-ar' && showTransliteration && card.fields?.transliteration && (
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
          ({card.fields.transliteration})
        </p>
      )}
      {isVerbCard ? renderVerbConjugationTable() : card.audio_url && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            playAudio(card.audio_url);
          }}
          className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
        >
          <Volume2 size={20} />
        </button>
      )}
    </div>
  );

  const renderAnswerView = () => {
    if (isVerbCard && card.layout) {
      // For verb cards with layout templates, use template renderer for the answer
      const renderedLayout = renderCardLayout(card.layout, card.fields);
      
      return (
        <div className="flex flex-col">
          {renderFrontContent()} 
          <div className="border-b border-gray-300 dark:border-dark-300 mx-6"></div>
          <div className="bg-gray-50 dark:bg-dark-200 rounded-b-lg p-6">
            <div 
              className="verb-table-container"
              dangerouslySetInnerHTML={{ __html: renderedLayout.answer }}
            />
            {card.audio_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(card.audio_url);
                }}
                className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 mx-auto block"
              >
                <Volume2 size={20} />
              </button>
            )}
          </div>
        </div>
      );
    } else if (isVerbCard) {
      // Fallback for verb cards without layout templates
      return (
        <div className="flex flex-col">
          {renderFrontContent()} 
          <div className="border-b border-gray-300 dark:border-dark-300 mx-6"></div>
          <div className="bg-gray-50 dark:bg-dark-200 rounded-b-lg">
            {/* Always show the Arabic word and transliteration within the card */}
            <div className="p-6">
              {/* Display Arabic word and transliteration - ALWAYS show for verb cards */}
              {(verbBaseData?.word_arabic || verbBaseData?.word_transliteration) && (
                <div className="text-center mb-4">
                  {verbBaseData.word_arabic && (
                    <p className="text-xl text-gray-900 dark:text-white mb-2" dir="rtl">
                      {verbBaseData.word_arabic}
                    </p>
                  )}
                  {verbBaseData.word_transliteration && showTransliteration && (
                    <p className="text-lg italic text-gray-600 dark:text-gray-400">
                      {verbBaseData.word_transliteration}
                    </p>
                  )}
                </div>
              )}
              
              {/* Show conjugations table if not separate, or if no separate table exists yet */}
              {!separateConjugationTable && (
                <>
                  <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-4">
                    Conjugations
                  </h3>
                  {renderConjugationTableContent()}
                </>
              )}
              
              {/* Audio button */}
              {card.audio_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(card.audio_url);
                  }}
                  className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 mx-auto block"
                >
                  <Volume2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
    <div className="flex flex-col">
      {renderFrontContent()} 
      <div className="border-b border-gray-300 dark:border-dark-300 mx-6"></div>
      {renderBackContent()}
    </div>
  );
  };

  return (
    <div className={`mx-auto bg-white dark:bg-dark-200 rounded-lg shadow-xl overflow-hidden ${
      isVerbCard ? 'max-w-6xl w-full' : 'max-w-md'
    }`}>
      <div onClick={handleFlip} className="cursor-pointer">
        {isFlipped ? renderAnswerView() : renderFrontContent()}
      </div>
    </div>
  );
});

export default CardView;


