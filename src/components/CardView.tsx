import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Volume2 } from 'lucide-react';

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
    audio_url?: string | null; // Add audio_url here
    // layout?: any; // Assuming we render based on simple fields for now
    // type?: 'basic' | 'cloze' | 'image'; // Assuming 'basic' for now
    // ADDED: New props for study direction and transliteration visibility
    studyDirection: 'en-ar' | 'ar-en';
    showTransliteration: boolean;
  };
  // Corrected prop type to only expect quality
  onQualitySelect: (quality: number) => void;
  onAnswerShown: () => void; // ADDED: New prop to notify when answer is shown
  selectedQuality: number | null; // ADDED: Prop to indicate selected quality
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

  const renderFrontContent = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
      <p 
        dir={isRtlFront ? 'rtl' : 'ltr'}
        className={`text-2xl font-bold text-center text-gray-900 dark:text-white ${isRtlFront ? 'font-arabic' : ''}`}>
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

  const renderBackContent = () => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-dark-200 rounded-b-lg">
      <p 
        dir={isRtlBack ? 'rtl' : 'ltr'}
        className={`text-3xl font-bold text-center text-gray-900 dark:text-white ${isRtlBack ? 'font-arabic' : ''}`}>
        {backText || (studyDirection === 'en-ar' ? 'No Arabic text' : 'No English text')}
      </p>
      {/* Render transliteration on the back if Arabic is on the back and showTransliteration is true */}
      {studyDirection === 'en-ar' && showTransliteration && card.fields?.transliteration && (
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
          ({card.fields.transliteration})
        </p>
      )}
      {card.audio_url && (
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

  const renderAnswerView = () => (
    <div className="flex flex-col">
      {renderFrontContent()} 
      <div className="border-b border-gray-300 dark:border-dark-300 mx-6"></div>
      {renderBackContent()}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-dark-200 rounded-lg shadow-xl overflow-hidden">
      <div onClick={handleFlip} className="cursor-pointer">
        {isFlipped ? renderAnswerView() : renderFrontContent()}
      </div>
    </div>
  );
});

export default CardView;


