import React, { useRef, useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // Make sure your supabase client is correctly imported

interface AlphabetProps {
  setSubTab?: (tab: string) => void;
}

interface LetterExample {
  word: string;
  transliteration: string;
  translation: string;
}

interface LetterForms {
  isolated?: string; // Assuming 'isolated' might exist, although not used in the current rendering
  end: string;
  middle: string;
  start: string;
}

interface AlphabetItem {
  id: number; // Assuming an id column
  letter: string;
  name: string;
  transliteration: string;
  audio_url?: string | null;
  pronunciation_description?: string | null;
  forms: LetterForms;
  examples: {
    end: LetterExample;
    middle: LetterExample;
    start: LetterExample;
  };
  // Add any other columns from your 'alphabet' table here
}

const Alphabet: React.FC<AlphabetProps> = ({ setSubTab }) => {
  const [alphabetData, setAlphabetData] = useState<AlphabetItem[]>([]);
  const [specialLettersData, setSpecialLettersData] = useState<AlphabetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({});

  useEffect(() => {
    async function fetchAlphabet() {
      // Fetch all rows from the "alphabet" table
      const { data, error } = await supabase
        .from('alphabet')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching alphabet data:', error);
      } else {
        console.log('Fetched data:', data); // Log the whole response

        // Log each letter with its audio URL
        data.forEach((letter) => {
          console.log('Letter:', letter.letter);
          console.log('Audio URL:', letter.audio_url);
        });

        // Define the correct order of the Arabic alphabet
        const arabicLetterOrder = [
          'ا',
          'ب',
          'ت',
          'ث',
          'ج',
          'ح',
          'خ',
          'د',
          'ذ',
          'ر',
          'ز',
          'س',
          'ش',
          'ص',
          'ض',
          'ط',
          'ظ',
          'ع',
          'غ',
          'ف',
          'ق',
          'ك',
          'ل',
          'م',
          'ن',
          'ه',
          'و',
          'ي',
        ];

        // Partition the data: separate main alphabet and special letters
        const specialLettersSet = new Set(['ء', 'ة', 'ى', 'لا']);
        const mainAlphabet = data
          .filter((row) => !specialLettersSet.has(row.letter.trim()))
          .sort(
            (a, b) =>
              arabicLetterOrder.indexOf(a.letter) -
              arabicLetterOrder.indexOf(b.letter)
          );

        const specialLetters = data.filter((row) =>
          specialLettersSet.has(row.letter.trim())
        );

        setAlphabetData(mainAlphabet);
        setSpecialLettersData(specialLetters);

        // Preload audio for each letter
        const allLetters = [...mainAlphabet, ...specialLetters];
        allLetters.forEach(async (letter) => {
          if (letter.audio_url) {
            try {
              const { data, error: signedUrlError } = await supabase.storage
                .from('audio') // Make sure "audio" is your actual bucket name
                .createSignedUrl(letter.audio_url, 3600); // URL valid for 1 hour (adjust as needed)

              if (signedUrlError) {
                console.error(`Error creating signed URL for preloading ${letter.letter}:`, signedUrlError);
                return;
              }

              // Fetch the audio file as a Blob
              const response = await fetch(data.signedUrl);
              if (!response.ok) {
                console.error(`Failed to fetch audio blob for ${letter.letter}: ${response.statusText}`);
                return;
              }

              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob); // Create a local object URL from the blob

              // Store the Audio object initialized with the blob URL directly in audioRefs
              const audioElement = new Audio(blobUrl);
              audioElement.onerror = (e) => {
                console.error(`Audio loading error for ${letter.letter}:`, e);
              };
              // No need for preload/load calls here as we are using a blob URL

              // Use letter id as key
              audioRefs.current[letter.id] = audioElement;

            } catch (error) {
              console.error(`Error preloading audio for ${letter.letter}:`, error);
            }
          }
        });

        setSpecialLettersData(specialLetters);

        // Cleanup function to revoke object URLs
        return () => {
          allLetters.forEach(letter => {
            const audioElement = audioRefs.current[letter.id];
            if (audioElement && audioElement.src && audioElement.src.startsWith('blob:')) {
              URL.revokeObjectURL(audioElement.src);
              console.log(`Revoked object URL for letter ID: ${letter.id}`);
            }
          });
        };
      }
      setLoading(false);
    }
    fetchAlphabet();
  }, []);

  // Modified playAudio function to use preloaded audio
  const playAudio = (letterId: number) => {
    try {
      const audioElement = audioRefs.current[letterId] as HTMLAudioElement | undefined;

      if (audioElement) {
        console.log(`Playing audio for letter ID: ${letterId}`);
        // Reset playback to the beginning
        audioElement.currentTime = 0;
        audioElement.play().catch((err) => {
          console.error(`Error playing preloaded audio for ID ${letterId}:`, err);
        });
      } else {
        console.warn(`No preloaded audio found for letter ID: ${letterId}`);
        // Fallback or error handling if audio was not preloaded
      }
    } catch (error) {
      console.error(`Error in playAudio function for letter ID ${letterId}:`, error);
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

      <h2 className="text-xl font-bold mb-4">Arabic Alphabet</h2>

      {/* Main Alphabet */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {alphabetData.map((letter) => (
            <div
              key={letter.letter}
              className="bg-white dark:bg-dark-100 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-3xl font-bold ml-1">{letter.letter}</div>
                  <div className="text-xl text-gray-600 dark:text-gray-400 ml-3">
                    {letter.name} - {letter.transliteration}
                  </div>
                </div>
                <button
                  onClick={() => playAudio(letter.id)}
                  className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              {/* Use the new pronunciation_description from the database */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {letter.pronunciation_description}
              </p>

              <div className="grid grid-cols-3 gap-4">
                {/* End Position */}
                <div className="text-center">
                  <div className="font-medium text-sm mb-2">End:</div>
                  <div className="text-2xl mb-2">{letter.forms.end}</div>
                  <div className="text-lg">{letter.examples.end.word}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {letter.examples.end.transliteration}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {letter.examples.end.translation}
                  </div>
                </div>

                {/* Middle Position */}
                <div className="text-center">
                  <div className="font-medium text-sm mb-2">Middle:</div>
                  <div className="text-2xl mb-2">{letter.forms.middle}</div>
                  <div className="text-lg">{letter.examples.middle.word}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {letter.examples.middle.transliteration}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {letter.examples.middle.translation}
                  </div>
                </div>

                {/* Start Position */}
                <div className="text-center">
                  <div className="font-medium text-sm mb-2">Start:</div>
                  <div className="text-2xl mb-2">{letter.forms.start}</div>
                  <div className="text-lg">{letter.examples.start.word}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {letter.examples.start.transliteration}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {letter.examples.start.translation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Letters Section */}
      <h2 className="text-xl font-bold mb-4 mt-8">Special Letters</h2>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {specialLettersData.map((letter) => (
            <div
              key={letter.letter}
              className="bg-white dark:bg-dark-100 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-3xl font-bold ml-1">{letter.letter}</div>
                  <div className="text-xl text-gray-600 dark:text-gray-400 ml-3">
                    {letter.name} - {letter.transliteration}
                  </div>
                </div>
                <button
                  onClick={() => playAudio(letter.id)}
                  className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              {/* Use the new pronunciation_description here too */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {letter.pronunciation_description}
              </p>

              <div className="grid grid-cols-3 gap-4">
                {/* End Position */}
                <div className="text-center">
                  <div className="font-medium text-sm mb-2">End:</div>
                  <div className="text-2xl mb-2">{letter.forms.end}</div>
                  <div className="text-lg">{letter.examples.end.word}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {letter.examples.end.transliteration}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {letter.examples.end.translation}
                  </div>
                </div>

                {/* Middle Position */}
                <div className="text-center">
                  <div className="font-medium text-sm mb-2">Middle:</div>
                  <div className="text-2xl mb-2">{letter.forms.middle}</div>
                  <div className="text-lg">{letter.examples.middle.word}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {letter.examples.middle.transliteration}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {letter.examples.middle.translation}
                  </div>
                </div>

                {/* Start Position */}
                <div className="text-center">
                  <div className="font-medium text-sm mb-2">Start:</div>
                  <div className="text-2xl mb-2">{letter.forms.start}</div>
                  <div className="text-lg">{letter.examples.start.word}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {letter.examples.start.transliteration}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {letter.examples.start.translation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alphabet;



