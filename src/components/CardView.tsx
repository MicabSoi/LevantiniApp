import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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
}

// Define the ref handle type
export interface CardViewHandle {
  flipCard: () => void;
}

const CardView = forwardRef<CardViewHandle, CardViewProps>(({ 
  card, 
  onQualitySelect, 
  onAnswerShown, 
  selectedQuality, 
  studyDirection, 
  showTransliteration 
}: CardViewProps, ref) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [allConjugations, setAllConjugations] = useState<any[]>([]);
  const [isLoadingConjugations, setIsLoadingConjugations] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useImperativeHandle(ref, () => ({
    flipCard: handleFlip,
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
        return;
      }

      const verbFields = card.fields as any;
      const verbWord = verbFields.word_english || card.fields.english || card.english;
      
      if (!verbWord) return;

      setIsLoadingConjugations(true);
      
      try {
        const { data, error } = await supabase
          .from('default_verb_flashcards')
          .select('*')
          .eq('Word', verbWord)
          .order('English Past');

        if (error) {
          console.error('Error fetching verb conjugations:', error);
          setAllConjugations([]);
        } else {
          console.log('Fetched conjugations:', data);
          setAllConjugations(data || []);
        }
      } catch (err) {
        console.error('Error in fetchAllConjugations:', err);
        setAllConjugations([]);
      } finally {
        setIsLoadingConjugations(false);
      }
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

  // Check if this is a verb card
  const isVerbCard = card.deck?.name === 'Verbs';

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

    return (
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-4">
          Conjugations
        </h3>
        
        {/* Mobile view: Separate tables for each tense */}
        <div className="block lg:hidden">
          {renderTenseTable('Past', 'English Past', 'Arabic Past', 'Transliteration Past')}
          {renderTenseTable('Present', 'English Present', 'Arabic Present', 'Transliteration Present')}
          {renderTenseTable('Imperative', 'English Imperative', 'Arabic Imperative', 'Transliteration Imperative')}
        </div>

        {/* Desktop view: Combined table */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-dark-100">
                  <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>
                    Past
                  </th>
                  <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>
                    Present
                  </th>
                  <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>
                    Imperative
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-dark-200">
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                  <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                </tr>
              </thead>
              <tbody>
                {sortedConjugations.map((conj, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                    {/* Past Tense */}
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {conj['English Past'] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                      {conj['Arabic Past'] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                      {showTransliteration ? (conj['Transliteration Past'] || '-') : '-'}
                    </td>
                    
                    {/* Present Tense */}
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {conj['English Present'] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                      {conj['Arabic Present'] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                      {showTransliteration ? (conj['Transliteration Present'] || '-') : '-'}
                    </td>
                    
                    {/* Imperative Tense */}
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                      {conj['English Imperative'] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                      {conj['Arabic Imperative'] || '-'}
                    </td>
                    <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                      {showTransliteration ? (conj['Transliteration Imperative'] || '-') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
    if (isVerbCard) {
      // For verb cards, show the infinitive form (word_english field)
      const verbFields = card.fields as any;
      const verbInfinitive = verbFields.word_english || frontText;
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
          <p className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {verbInfinitive}
          </p>
        </div>
      );
    }

    return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
      <p 
        dir={isRtlFront ? 'rtl' : 'ltr'}
        className={`text-2xl font-bold text-center text-gray-900 dark:text-white ${isRtlFront ? '' : ''}`}>
        {frontText || (studyDirection === 'en-ar' ? 'No English text' : 'No Arabic text')}
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
        {backText || (studyDirection === 'en-ar' ? 'No Arabic text' : 'No English text')}
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
    if (isVerbCard) {
      return (
        <div className="flex flex-col">
          {renderFrontContent()} 
          <div className="border-b border-gray-300 dark:border-dark-300 mx-6"></div>
          <div className="bg-gray-50 dark:bg-dark-200 rounded-b-lg">
            {renderVerbConjugationTable()}
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
    <div className="max-w-md mx-auto bg-white dark:bg-dark-200 rounded-lg shadow-xl overflow-hidden">
      <div onClick={handleFlip} className="cursor-pointer">
        {isFlipped ? renderAnswerView() : renderFrontContent()}
      </div>
    </div>
  );
});

export default CardView;


