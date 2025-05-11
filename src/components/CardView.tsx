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

const CardView = forwardRef<CardViewHandle, CardViewProps>(({ card, onQualitySelect, onAnswerShown, selectedQuality }, ref) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQualityButtons, setShowQualityButtons] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Expose flipCard function via ref
  useImperativeHandle(ref, () => ({
    flipCard: handleFlip,
  }));

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setShowQualityButtons(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, [card]);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      // Show quality buttons after a slight delay
      setTimeout(() => {
        setShowQualityButtons(true);
        onAnswerShown(); // ADDED: Call onAnswerShown when quality buttons are shown
        // Autoplay audio on flip if available
        if (card.audio_url) {
          playAudio(card.audio_url);
        }
      }, 300); // Adjust delay as needed
    }
    // Flipping back is not typically done in a standard review session flow,
    // but you could add logic here if needed.
  };

  const handleQualitySelect = (quality: number) => {
    // Corrected call to match the updated prop type
    onQualitySelect(quality); // Call the parent handler
  };

  const playAudio = (audioUrl: string) => {
    try {
      if (!audioUrl) return;

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onerror = (e) => {
          console.error('Audio failed to load:', e);
        };
      } else {
        audioRef.current.src = audioUrl;
      }

      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7; // Adjust volume if needed
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
    }
  };

const renderFront = (cardFields: CardFields) => (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
      <p className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        {cardFields?.english || 'No English text'} {/* Add defensive check and fallback */}
      </p>
      {/* Add image rendering here if card type is 'image' */}
      {cardFields?.imageUrl && (
        <img src={cardFields.imageUrl} alt="Flashcard front" className="mt-4 max-h-40 object-contain" />
      )}
    </div>
  );

  const renderBack = (cardFields: CardFields, audioUrl?: string | null, playAudio?: (url: string) => void) => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-dark-200 rounded-b-lg">
      {cardFields?.arabic ? ( // Add defensive check
        <p
          dir="rtl"
          className="text-3xl font-bold text-center text-gray-900 dark:text-white"
        >
          {cardFields.arabic}
        </p>
      ) : (
        <p className="text-xl text-gray-600 dark:text-gray-400 text-center">
          No Arabic text
        </p>
      )}
      {cardFields?.transliteration && ( // Add defensive check
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
          ({cardFields.transliteration})
        </p>
      )}
      {/* Add cloze text rendering here if card type is 'cloze' */}
      {/* {card.type === 'cloze' && card.fields?.clozeText && (
         <p className="text-xl font-bold text-center text-gray-900 dark:text-white mt-4">
           {card.fields.clozeText} // Render with blanks filled? Or originally with blanks? Depends on layout logic.
         </p>
      )} */}
      {/* Add image rendering here if card type is 'image' */}
      {/* Removed image rendering from the back to avoid duplication */}
      {/*
      {cardFields?.imageUrl && (
        <img src={cardFields.imageUrl} alt="Flashcard back" className="mt-4 max-h-40 object-contain" />
      )}
      */}

      {audioUrl && playAudio && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent flip if clicking audio
            playAudio(audioUrl);
          }}
          className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
        >
          <Volume2 size={20} />
        </button>
      )}
    </div>
  );

const renderAnswerView = (card: CardViewProps['card'], playAudio: (url: string) => void) => (
    <div className="flex flex-col">
      {/* Question remains at the top */}
      {renderFront(card.fields)}
      {/* Separator */}
      <div className="border-b border-gray-300 dark:border-dark-300 mx-6"></div>
      {/* Answer appears below */}
      {renderBack(card.fields, card.audio_url, playAudio)}
    </div>
);

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-dark-200 rounded-lg shadow-xl overflow-hidden">
      {/* Card Content Area */}
      <div onClick={handleFlip} className="cursor-pointer">
        {isFlipped ? renderAnswerView(card, playAudio) : renderFront(card.fields)}
      </div>

      {/* Quality Buttons */}
      {/* Removed quality buttons for bottom bar implementation */}
    </div>
  );
});

export default CardView;
