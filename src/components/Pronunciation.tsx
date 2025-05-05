import React, { useRef } from 'react';
import { Volume2 } from 'lucide-react';

// Sample pronunciation data with real audio URLs
const pronunciationData = [
  {
    id: 1,
    phrase: 'كيف حالك؟',
    transliteration: 'Kif ḥālak?',
    translation: 'How are you?',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_003.mp3',
    phonetic: 'The "k" is pronounced at the back of the throat'
  },
  {
    id: 2,
    phrase: 'صباح الخير',
    transliteration: 'Ṣabāḥ al-khayr',
    translation: 'Good morning',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_007.mp3',
    phonetic: 'The "kh" sound is made by constricting the throat'
  },
  {
    id: 3,
    phrase: 'شو بتحب تاكل؟',
    transliteration: 'Shū btiḥibb tākul?',
    translation: 'What do you like to eat?',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_009.mp3',
    phonetic: 'The "ḥ" is a breathy H sound from the throat'
  },
  {
    id: 4,
    phrase: 'وين رايح؟',
    transliteration: 'Wayn rāyiḥ?',
    translation: 'Where are you going?',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_011.mp3',
    phonetic: 'The "y" is pronounced like the "y" in "yes"'
  },
  {
    id: 5,
    phrase: 'بحكي عربي شوي',
    transliteration: 'Biḥkī ʿarabī shwayy',
    translation: 'I speak a little Arabic',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_013.mp3',
    phonetic: 'The "ʿ" (ayn) is a constriction deep in the throat'
  }
];

interface PronunciationProps {
  setSubTab?: (tab: string) => void;
}

const Pronunciation: React.FC<PronunciationProps> = ({ setSubTab }) => {
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});

  const playAudio = (audioUrl: string, id: number) => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRefs.current[id]) {
        const audio = new Audio(audioUrl);
        audioRefs.current[id] = audio;
        
        // Add error handling
        audio.onerror = (e) => {
          console.error("Audio failed to load:", e);
        };
      }
      
      // Play the audio
      const audioElement = audioRefs.current[id];
      audioElement.currentTime = 0; // Reset to start
      
      // Use the play() promise to catch errors
      const playPromise = audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    } catch (error) {
      console.error("Error in playAudio function:", error);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab?.('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Learn
      </button>

      <h2 className="text-xl font-bold mb-4">Pronunciation Guide</h2>
      
      <div className="space-y-4">
        {pronunciationData.map(item => (
          <div key={item.id} className="border border-gray-200 dark:border-dark-100 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-dark-100 dark:bg-dark-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold">{item.phrase}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.transliteration}</p>
              </div>
              <button 
                onClick={() => playAudio(item.audioUrl, item.id)}
                className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 active:bg-emerald-300"
              >
                <Volume2 size={18} />
              </button>
            </div>
            <p className="mb-2">{item.translation}</p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Phonetic tip:</span> {item.phonetic}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pronunciation;

