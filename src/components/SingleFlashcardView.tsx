import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Volume2, Trash2 } from 'lucide-react';
import FlashcardForm from './FlashcardForm';

interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  deck_id: string;
  type?: string;
  fields?: {
    past_tense?: {
      english?: string;
      arabic?: string;
      transliteration?: string;
    };
    present_tense?: {
      english?: string;
      arabic?: string;
      transliteration?: string;
    };
    imperative_tense?: {
      english?: string;
      arabic?: string;
      transliteration?: string;
    };
    word_english?: string;
  };
}

interface Deck {
  id: string;
  name: string;
}

interface SingleFlashcardViewProps {
  flashcard?: Flashcard | null;
  onClose?: () => void;
}

const pronounLabels = [
  { label: 'I (ana)', key: 'ana' },
  { label: 'You (m.) (inta)', key: 'inta' },
  { label: 'You (f.) (inti)', key: 'inti' },
  { label: 'You (pl.) (intu)', key: 'intu' },
  { label: 'He (huwe)', key: 'huwe' },
  { label: 'She (hiyye)', key: 'hiyye' },
  { label: 'We (ni7na)', key: 'ni7na' },
  { label: 'They (hinne)', key: 'hinne' },
  { label: 'Imperative (sg.)', key: 'kuli' },
  { label: 'Imperative (pl.)', key: 'kuli_pl' },
];

const SingleFlashcardView: React.FC<SingleFlashcardViewProps> = ({ flashcard: propFlashcard, onClose }) => {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const [flashcard, setFlashcard] = useState<Flashcard | null>(propFlashcard || null);
  const [deckName, setDeckName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!propFlashcard);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState<Partial<Flashcard> | null>(null);
  const [showCreateFlashcardModal, setShowCreateFlashcardModal] = useState(false);
  const [allConjugations, setAllConjugations] = useState<any[]>([]);
  const [isEditingConjugations, setIsEditingConjugations] = useState(false);
  const [editedConjugations, setEditedConjugations] = useState<any[]>([]);

  const handleConjugationInputChange = (
    pronounIndex: number,
    tense: 'past_tense' | 'present_tense' | 'imperative_tense',
    field: 'english' | 'arabic' | 'transliteration',
    value: string
  ) => {
    setEditedConjugations(prev => {
      const newConjugations = JSON.parse(JSON.stringify(prev));
      if (newConjugations[pronounIndex] && newConjugations[pronounIndex].fields) {
        if (!newConjugations[pronounIndex].fields[tense]) {
          newConjugations[pronounIndex].fields[tense] = {};
        }
        newConjugations[pronounIndex].fields[tense][field] = value;
      }
      return newConjugations;
    });
  };

  const handleSaveChanges = async () => {
    if (!flashcard) return;

    // Transform editedConjugations back to the original flashcard.fields structure
    const updatedFields: any = {
      past: {},
      present: {},
      imperative: {},
      word: (flashcard.fields as any)?.word // Preserve the original word field
    };

    const pronounKeys = ['i', 'you_m', 'you_f', 'you_pl', 'he', 'she', 'we', 'they'];

    editedConjugations.forEach((conjugation, index) => {
      const pronounKey = pronounKeys[index];
      if (!pronounKey) return; // Should not happen if pronounOrder and editedConjugations align

      if (conjugation.fields?.past_tense) {
        updatedFields.past[pronounKey] = {
          en: conjugation.fields.past_tense.english || '',
          ar: conjugation.fields.past_tense.arabic || '',
          tr: conjugation.fields.past_tense.transliteration || ''
        };
      }
      if (conjugation.fields?.present_tense) {
        updatedFields.present[pronounKey] = {
          en: conjugation.fields.present_tense.english || '',
          ar: conjugation.fields.present_tense.arabic || '',
          tr: conjugation.fields.present_tense.transliteration || ''
        };
      }
      // Imperative needs special handling for pronoun keys like 'kuli'
      // For simplicity, this example assumes imperative might map differently or might not be fully editable this way
      // This part needs to be aligned with how imperative is stored and keyed in `fields.imperative`
      // For now, let's assume it maps to a pronounKey if it exists
      if (conjugation.fields?.imperative_tense && updatedFields.imperative) {
         updatedFields.imperative[pronounKey] = { // This line might need adjustment based on actual imperative keys
          en: conjugation.fields.imperative_tense.english || '',
          ar: conjugation.fields.imperative_tense.arabic || '',
          tr: conjugation.fields.imperative_tense.transliteration || ''
        };
      }
    });
    
    // Imperative special keys (kuli, kuli_pl) if they are outside the main pronoun loop
    // This is a placeholder - needs to match how imperative is structured if 'kuli' and 'kuli_pl' are direct keys
    const kuliImperative = editedConjugations.find(c => c.id.endsWith('-kuli'))?.fields?.imperative_tense;
    if (kuliImperative && updatedFields.imperative) {
        updatedFields.imperative.kuli = { en: kuliImperative.english, ar: kuliImperative.arabic, tr: kuliImperative.transliteration };
    }
    const kuliPlImperative = editedConjugations.find(c => c.id.endsWith('-kuli_pl'))?.fields?.imperative_tense;
    if (kuliPlImperative && updatedFields.imperative) {
        updatedFields.imperative.kuli_pl = { en: kuliPlImperative.english, ar: kuliPlImperative.arabic, tr: kuliPlImperative.transliteration };
    }


    setLoading(true);
    setError(null);
    try {
      const { data, error: updateError } = await supabase
        .from('cards')
        .update({ fields: updatedFields })
        .eq('id', flashcard.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setFlashcard(data as Flashcard); // Update local flashcard state
      setAllConjugations(editedConjugations); // Update allConjugations to reflect saved changes
      setIsEditingConjugations(false);
      // console.log('Successfully saved conjugation changes:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      console.error('Error saving conjugation changes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch card and deck data
  const fetchCardAndDeck = async () => {
    if (propFlashcard) return;

    setLoading(true);
    setError(null);

    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (cardError) {
      setError(cardError.message);
      setLoading(false);
      return;
    }
    setFlashcard(cardData as Flashcard);

    if (cardData?.deck_id) {
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('name')
        .eq('id', cardData.deck_id)
        .single();

      if (deckError) {
        console.error('Error fetching deck name in SingleFlashcardView:', deckError);
      }
      setDeckName(deckData?.name || null);
    }

    setLoading(false);
  };

  // Fetch all conjugations for the verb if this is a verb card
  useEffect(() => {
    const fetchAllConjugations = async () => {
      if (!flashcard) return;
      
      // Check if this is a verb card by looking at the fields structure
      const isVerbCard = flashcard.type === 'verb' || (
        (flashcard as any).fields && 
        (flashcard as any).fields.past && 
        (flashcard as any).fields.present &&
        (flashcard as any).fields.word
      );
      
      console.log('🔍 Is verb card?', isVerbCard);
      console.log('🔍 Flashcard type:', flashcard.type);
      console.log('🔍 Has past?', !!((flashcard as any).fields?.past));
      console.log('🔍 Has present?', !!((flashcard as any).fields?.present));
      console.log('🔍 Has word?', !!((flashcard as any).fields?.word));
      
      if (!isVerbCard) return;

      // For verb cards, we already have all the conjugation data in the single card
      // Transform the data structure to match what the table expects
      const fields = (flashcard as any).fields;
      const pronounOrder = ['i', 'you_m', 'you_f', 'you_pl', 'he', 'she', 'we', 'they'];
      
      const conjugationData = pronounOrder.map(pronoun => {
        const pastData = fields.past?.[pronoun];
        const presentData = fields.present?.[pronoun];
        const imperativeData = fields.imperative?.[pronoun];
        
        return {
          id: `${flashcard.id}-${pronoun}`,
          fields: {
            past_tense: pastData ? {
              english: pastData.en,
              arabic: pastData.ar,
              transliteration: pastData.tr
            } : null,
            present_tense: presentData ? {
              english: presentData.en,
              arabic: presentData.ar,
              transliteration: presentData.tr
            } : null,
            imperative_tense: imperativeData ? {
              english: imperativeData.en,
              arabic: imperativeData.ar,
              transliteration: imperativeData.tr
            } : null,
            word_english: typeof fields.word === 'object' ? fields.word?.english : fields.word
          }
        };
      });
      
      console.log('🎯 Setting conjugations from single card:', conjugationData.length, 'items');
      console.log('📋 Sample conjugation:', conjugationData[0]?.fields);
      console.log('🔍 fields.word structure:', fields.word);
      console.log('🔍 fields.word type:', typeof fields.word);
      setAllConjugations(conjugationData);
    };
    fetchAllConjugations();
  }, [flashcard]); // Re-run when flashcard changes

  useEffect(() => {
    if (!propFlashcard && deckId && cardId) fetchCardAndDeck();
  }, [propFlashcard, deckId, cardId]);

  useEffect(() => {
    setFlashcard(propFlashcard || null);
    setLoading(!propFlashcard);
  }, [propFlashcard]);

  const handlePlayAudio = (audioUrl: string) => {
    new Audio(audioUrl).play();
  };

  const handleEdit = () => {
    if (!flashcard) return;
    if (isVerbCard) {
      // For verb cards, toggle inline conjugation editing mode
      // instead of showing the main edit modal.
      if (!isEditingConjugations) {
        setEditedConjugations(JSON.parse(JSON.stringify(allConjugations)));
        setIsEditingConjugations(true);
      }
      // If already editing conjugations, the pencil icon might do nothing or toggle off.
      // For now, it primarily serves to enter edit mode if not already in it.
      // The separate "Cancel" and "Save Conjugation Changes" buttons will handle exiting.
    } else {
      // For non-verb cards, show the main edit modal
    setEditData(flashcard);
    setShowEditModal(true);
    }
  };

  const handleToggleEditConjugations = () => {
    if (!isVerbCard) return;
    if (isEditingConjugations) {
      // "Cancel" button clicked
      setIsEditingConjugations(false);
      setEditedConjugations([]); // Clear edits on cancel
    } else {
      // This case should now primarily be handled by handleEdit for verb cards
      // or if there was a dedicated "Edit Conjugations" button still desired.
      setEditedConjugations(JSON.parse(JSON.stringify(allConjugations)));
      setIsEditingConjugations(true);
    }
  };

  const handleDelete = async () => {
    if (!flashcard) return;
    setShowDeleteConfirm(false);
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', flashcard.id);
    setLoading(false);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      if (onClose) {
        onClose();
      } else if (flashcard.deck_id) {
        navigate(`/flashcard/${flashcard.deck_id}`);
      }
    }
  };

  const handleCloseCreateFlashcardModal = () => {
    setShowCreateFlashcardModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 size={40} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!flashcard) {
    return (
      <div className="p-4 text-gray-900 dark:text-white">Flashcard not found.</div>
    );
  }

  // Verb card detection: type === 'verb' or has verb-like fields
  const isVerbCard = flashcard.type === 'verb' || (
    (flashcard as any).fields && 
    (flashcard as any).fields.past && 
    (flashcard as any).fields.present &&
    (flashcard as any).fields.word
  );
  
  console.log('🔍 SingleFlashcardView - Verb card detection:', {
    type: flashcard.type,
    hasPast: !!((flashcard as any).fields?.past),
    hasPresent: !!((flashcard as any).fields?.present),
    hasWord: !!((flashcard as any).fields?.word),
    isVerbCard,
    flashcardFields: (flashcard as any).fields
  });

  // Determine modal width classes based on card type
  // For verb cards, allow it to take full available width by removing max-width constraints.
  // For non-verb cards, use a standard max-width.
  const modalWidthClasses = isVerbCard ? 'w-full max-w-none' : 'w-full max-w-lg';

  // Handle outside click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click target is the backdrop itself, not content inside it
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Button group for conjugation editing actions - positioned near the top right
  const conjugationActionButtons = isVerbCard && isEditingConjugations && !showEditModal && (
    <div className="absolute top-44 right-20 flex flex-col space-y-2 z-10"> {/* Position below header buttons, vertical flex */}
      <button
        onClick={() => {
          setIsEditingConjugations(false);
          setEditedConjugations([]); // Clear edits on cancel
        }}
        className="px-3 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white text-sm transition-colors" // Smaller padding and text
      >
        Cancel
      </button>
      <button
        onClick={handleSaveChanges}
        className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-sm transition-colors" // Smaller padding and text, text changed
      >
        Save
      </button>
    </div>
  );

  return (
    // Outer modal overlay and container
    // This div provides the backdrop and centers the modal. The p-4 adds some padding.
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick} // Add click handler
    >
      {/* This is the actual modal content panel */}
      {/* Apply dynamic width classes here */}
      <div className={`bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg relative ${modalWidthClasses}`}>

        {/* Header button container for Close, Edit, and Delete - Adjusted right position */}
        <div className="absolute top-4 right-12 flex items-center space-x-2"> {/* Changed right-8 to right-12 */}
          {/* Edit Button */}
          <button
            className="text-emerald-600 dark:text-emerald-400 p-1 rounded-md"
            onClick={handleEdit}
            title="Edit Flashcard"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit2"><path d="M16.474 3.526a2.121 2.121 0 0 1 3 3L7.5 18.5l-4 1 1-4 10.974-10.974Z"></path></svg>
          </button>
          {/* Delete Button */}
          <button
            className="text-red-600 dark:text-red-400 p-1 rounded-md"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Flashcard"
          >
            <Trash2 size={18} />
          </button>
          {/* Close Button */}
          {onClose && (
            <button
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-md"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-xcircle "><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
            </button>
          )}
        </div>

        {/* Inner content div - This div holds the scrollable content */}
        {/* Let it fill its parent. No explicit width or centering classes here. */}
        <div className="p-4 text-gray-900 dark:text-white max-h-[calc(80vh-6rem)] overflow-y-auto">
          {/* max-h adjusted to account for padding and title/buttons above scrollable area */}

          {/* ... existing back button (if applicable) ...*/}
          {deckName && (
            <button
              onClick={() => {
                navigate(`/flashcard/${deckId}`);
              }}
              className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
            >
              ← Back to {deckName}
            </button>
          )}

          {/* Actual card content (image, text, table) */}
          <div className={`${flashcard.image_url ? 'mt-12' : ''}`}> {/* Removed relative pt-12 from here */}
            {/* Removed the old edit/delete button container from here */}

            {flashcard.image_url && (
              <img
                crossOrigin="anonymous"
                src={flashcard.image_url}
                alt="Flashcard image"
                className="object-cover rounded-md mb-4 w-full h-64"
              />
            )}

            {/* Verb-specific display: show all conjugations in a table */}
            {isVerbCard && allConjugations.length > 0 ? (
              <div className="space-y-4 mt-4"> {/* Add some top margin if needed after removing button group */}
                                <div className="text-left">
                  <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                     {(() => {
                       const wordEnglish = (allConjugations[0] as any)?.fields?.word_english;
                       const flashcardWord = (flashcard as any).fields?.word;
                       const fallback = flashcard.english;
                       
                       // Handle word_english from conjugations
                       if (wordEnglish && typeof wordEnglish === 'string') {
                         return wordEnglish;
                       }
                       
                       // Handle flashcard word field
                       if (flashcardWord) {
                         if (typeof flashcardWord === 'string') {
                           return flashcardWord;
                         } else if (typeof flashcardWord === 'object' && flashcardWord.english) {
                           return flashcardWord.english;
                         }
                       }
                       
                       // Fallback to basic english field
                       return fallback || 'Unknown';
                     })()} {/* Display the common word */}
                  </h1>
                  {/* ADDED: Display Arabic and Transliteration for the base verb - left aligned */}
                  {(() => {
                    const flashcardWord = (flashcard as any).fields?.word;
                    const arabicText = (typeof flashcardWord === 'object' ? flashcardWord?.arabic : null) || 
                                     allConjugations[0]?.fields?.past_tense?.arabic || 
                                     allConjugations[0]?.fields?.present_tense?.arabic;
                    return arabicText ? (
                      <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                        {arabicText}
                      </p>
                    ) : null;
                  })()}
                  {(() => {
                    const flashcardWord = (flashcard as any).fields?.word;
                    const transliterationText = (typeof flashcardWord === 'object' ? flashcardWord?.transliteration : null) || 
                                              allConjugations[0]?.fields?.past_tense?.transliteration || 
                                              allConjugations[0]?.fields?.present_tense?.transliteration;
                    return transliterationText ? (
                      <p className="text-lg italic text-gray-500 dark:text-gray-400 mb-4">
                        {transliterationText}
                      </p>
                    ) : null;
                  })()}
                </div>
                {/* Combined Table for Tablets and Larger Screens (md and up) */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-dark-100">
                          <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>Past</th>
                          <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>Present</th>
                          <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>Imperative</th>
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
                        {allConjugations.map((row, idx) => {
                          // Imperative data extraction - only show for "You" forms that have imperative data
                          const impEng = (row.fields as any)?.imperative_tense?.english || '-';
                          const impArb = (row.fields as any)?.imperative_tense?.arabic || '-';
                          const impTrans = (row.fields as any)?.imperative_tense?.transliteration || '-';
                          
                          const currentConjugation = isEditingConjugations ? editedConjugations[idx] : row;
                          if (!currentConjugation || !currentConjugation.fields) {
                            // console.error("Missing conjugation data for row:", idx, currentConjugation, isEditingConjugations, editedConjugations);
                            return <tr key={row.id || idx}><td colSpan={9}>Error: Data missing</td></tr>; // Or some other placeholder
                          }
                          const fields = currentConjugation.fields;

                          return (
                            <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                              {/* Past Tense */}
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                {isEditingConjugations ? (
                                  <input
                                    type="text"
                                    value={fields.past_tense?.english || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'past_tense', 'english', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                  />
                                ) : (fields.past_tense?.english || '-')}
                              </td>
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                                {isEditingConjugations ? (
                                  <input
                                    type="text"
                                    value={fields.past_tense?.arabic || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'past_tense', 'arabic', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    dir="rtl"
                                  />
                                ) : (fields.past_tense?.arabic || '-')}
                              </td>
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                                {isEditingConjugations ? (
                                  <input
                                    type="text"
                                    value={fields.past_tense?.transliteration || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'past_tense', 'transliteration', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                  />
                                ) : (fields.past_tense?.transliteration || '-')}
                              </td>

                              {/* Present Tense */}
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                {isEditingConjugations ? (
                                  <input
                                    type="text"
                                    value={fields.present_tense?.english || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'present_tense', 'english', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                  />
                                ) : (fields.present_tense?.english || '-')}
                              </td>
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                                {isEditingConjugations ? (
                                  <input
                                    type="text"
                                    value={fields.present_tense?.arabic || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'present_tense', 'arabic', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    dir="rtl"
                                  />
                                ) : (fields.present_tense?.arabic || '-')}
                              </td>
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                                {isEditingConjugations ? (
                                  <input
                                    type="text"
                                    value={fields.present_tense?.transliteration || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'present_tense', 'transliteration', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                  />
                                ) : (fields.present_tense?.transliteration || '-')}
                              </td>

                              {/* Imperative Tense - Note: Imperative usually only applies to "You" forms. */}
                              {/* This example makes all imperative cells editable; adjust logic if needed. */}
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                 {isEditingConjugations && (fields.imperative_tense || pronounLabels[idx]?.key.startsWith('intu') || pronounLabels[idx]?.key.startsWith('inta') || pronounLabels[idx]?.key.startsWith('inti') || pronounLabels[idx]?.key.startsWith('kuli')) ? (
                                  <input
                                    type="text"
                                    value={fields.imperative_tense?.english || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'imperative_tense', 'english', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                  />
                                ) : (impEng)}
                              </td>
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                                {isEditingConjugations && (fields.imperative_tense || pronounLabels[idx]?.key.startsWith('intu') || pronounLabels[idx]?.key.startsWith('inta') || pronounLabels[idx]?.key.startsWith('inti') || pronounLabels[idx]?.key.startsWith('kuli')) ? (
                                  <input
                                    type="text"
                                    value={fields.imperative_tense?.arabic || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'imperative_tense', 'arabic', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    dir="rtl"
                                  />
                                ) : (impArb)}
                              </td>
                              <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                                {isEditingConjugations && (fields.imperative_tense || pronounLabels[idx]?.key.startsWith('intu') || pronounLabels[idx]?.key.startsWith('inta') || pronounLabels[idx]?.key.startsWith('inti') || pronounLabels[idx]?.key.startsWith('kuli')) ? (
                                  <input
                                    type="text"
                                    value={fields.imperative_tense?.transliteration || ''}
                                    onChange={(e) => handleConjugationInputChange(idx, 'imperative_tense', 'transliteration', e.target.value)}
                                    className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                  />
                                ) : (impTrans)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Separate Tables for Small Screens (phones, hidden on md and up) */}
                <div className="block md:hidden space-y-6">
                  {/* Past Tense Table */}
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-dark-100">
                            <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>Past</th>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-dark-200">
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allConjugations.map((row, idx) => {
                            const currentConjugation = isEditingConjugations ? editedConjugations[idx] : row;
                            if (!currentConjugation || !currentConjugation.fields) {
                              // console.error("Missing conjugation data for row:", idx, currentConjugation, isEditingConjugations, editedConjugations);
                              return <tr key={`${row.id || idx}-past`}><td colSpan={3}>Error: Data missing</td></tr>; // Or some other placeholder
                            }
                            const fields = currentConjugation.fields;
                            return (
                              <tr key={`${row.id || idx}-past`} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                  {isEditingConjugations ? (
                                    <input
                                      type="text"
                                      value={fields.past_tense?.english || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'past_tense', 'english', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    />
                                  ) : (fields.past_tense?.english || '-')}
                                </td>
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                                  {isEditingConjugations ? (
                                    <input
                                      type="text"
                                      value={fields.past_tense?.arabic || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'past_tense', 'arabic', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                      dir="rtl"
                                    />
                                  ) : (fields.past_tense?.arabic || '-')}
                                </td>
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                                  {isEditingConjugations ? (
                                    <input
                                      type="text"
                                      value={fields.past_tense?.transliteration || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'past_tense', 'transliteration', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    />
                                  ) : (fields.past_tense?.transliteration || '-')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Present Tense Table */}
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-dark-100">
                            <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>Present</th>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-dark-200">
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allConjugations.map((row, idx) => {
                            const currentConjugation = isEditingConjugations ? editedConjugations[idx] : row;
                            if (!currentConjugation || !currentConjugation.fields) {
                              // console.error("Missing conjugation data for row:", idx, currentConjugation, isEditingConjugations, editedConjugations);
                              return <tr key={`${row.id || idx}-present`}><td colSpan={3}>Error: Data missing</td></tr>; // Or some other placeholder
                            }
                            const fields = currentConjugation.fields;
                            return (
                              <tr key={`${row.id || idx}-present`} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                  {isEditingConjugations ? (
                                    <input
                                      type="text"
                                      value={fields.present_tense?.english || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'present_tense', 'english', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    />
                                  ) : (fields.present_tense?.english || '-')}
                                </td>
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                                  {isEditingConjugations ? (
                                    <input
                                      type="text"
                                      value={fields.present_tense?.arabic || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'present_tense', 'arabic', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                      dir="rtl"
                                    />
                                  ) : (fields.present_tense?.arabic || '-')}
                                </td>
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                                  {isEditingConjugations ? (
                                    <input
                                      type="text"
                                      value={fields.present_tense?.transliteration || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'present_tense', 'transliteration', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    />
                                  ) : (fields.present_tense?.transliteration || '-')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Imperative Table */}
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300 dark:border-gray-600 text-sm">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-dark-100">
                            <th className="px-2 py-2 border dark:border-gray-600 text-center font-bold" colSpan={3}>Imperative</th>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-dark-200">
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">English</th>
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Arabic</th>
                            <th className="px-2 py-1 border dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300">Transliteration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allConjugations.map((row, idx) => {
                            const impEng = (row.fields as any)?.imperative_tense?.english || '-';
                            const impArb = (row.fields as any)?.imperative_tense?.arabic || '-';
                            const impTrans = (row.fields as any)?.imperative_tense?.transliteration || '-';
                            const currentConjugation = isEditingConjugations ? editedConjugations[idx] : row;
                            if (!currentConjugation || !currentConjugation.fields) {
                              // console.error("Missing conjugation data for row:", idx, currentConjugation, isEditingConjugations, editedConjugations);
                              return <tr key={`${row.id || idx}-imp`}><td colSpan={3}>Error: Data missing</td></tr>; // Or some other placeholder
                            }
                            const fields = currentConjugation.fields;
                            return (
                              <tr key={`${row.id || idx}-imp`} className="hover:bg-gray-50 dark:hover:bg-dark-100">
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                  {isEditingConjugations && (fields.imperative_tense || pronounLabels[idx]?.key.startsWith('intu') || pronounLabels[idx]?.key.startsWith('inta') || pronounLabels[idx]?.key.startsWith('inti') || pronounLabels[idx]?.key.startsWith('kuli')) ? (
                                    <input
                                      type="text"
                                      value={fields.imperative_tense?.english || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'imperative_tense', 'english', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    />
                                  ) : (impEng)}
                                </td>
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-900 dark:text-white" dir="rtl">
                                  {isEditingConjugations && (fields.imperative_tense || pronounLabels[idx]?.key.startsWith('intu') || pronounLabels[idx]?.key.startsWith('inta') || pronounLabels[idx]?.key.startsWith('inti') || pronounLabels[idx]?.key.startsWith('kuli')) ? (
                                    <input
                                      type="text"
                                      value={fields.imperative_tense?.arabic || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'imperative_tense', 'arabic', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                      dir="rtl"
                                    />
                                  ) : (impArb)}
                                </td>
                                <td className="px-2 py-2 border dark:border-gray-600 text-gray-600 dark:text-gray-400 italic">
                                  {isEditingConjugations && (fields.imperative_tense || pronounLabels[idx]?.key.startsWith('intu') || pronounLabels[idx]?.key.startsWith('inta') || pronounLabels[idx]?.key.startsWith('inti') || pronounLabels[idx]?.key.startsWith('kuli')) ? (
                                    <input
                                      type="text"
                                      value={fields.imperative_tense?.transliteration || ''}
                                      onChange={(e) => handleConjugationInputChange(idx, 'imperative_tense', 'transliteration', e.target.value)}
                                      className="w-full p-1 bg-white dark:bg-dark-200 border border-gray-300 dark:border-gray-500 rounded"
                                    />
                                  ) : (impTrans)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : isVerbCard ? (
              // ... Loading conjugations state ...
              <div>Loading all conjugations...</div>
            ) : (
              // ... existing non-verb display ...
              <>
                <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                  {flashcard.english}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                  {flashcard.arabic}
                </p>
                {flashcard.transliteration && (
                  <p className="text-lg italic text-gray-500 dark:text-gray-400 mb-4">
                    {flashcard.transliteration}
                  </p>
                )}
              </>
            )}

            {flashcard.tags && flashcard.tags.length > 0 && (
              // ... existing tags display ...
               <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tags: {flashcard.tags.join(', ')}
                </p>
              </div>
            )}
            {flashcard.audio_url && (
              // ... existing audio button ...
               <button
                onClick={() => handlePlayAudio(flashcard.audio_url!)}
                className="mt-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full p-3 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors flex items-center justify-center"
                aria-label="Play audio"
              >
                <Volume2 size={24} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Flashcard Modal (using FlashcardForm) */}
      {showEditModal && flashcard && (
        <FlashcardForm
          deckId={flashcard.deck_id}
          flashcard={flashcard}
          onClose={() => setShowEditModal(false)}
          onSubmit={() => {
            setShowEditModal(false);
            fetchCardAndDeck();
          }}
        />
      )}

      {/* Create New Flashcard Modal (using FlashcardForm) - Keep this if creating from this view is needed */}
      {showCreateFlashcardModal && deckId && (
        <FlashcardForm
          deckId={deckId}
          onClose={handleCloseCreateFlashcardModal}
          onSubmit={handleCloseCreateFlashcardModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {conjugationActionButtons}
    </div>
  );
};

export default SingleFlashcardView;
