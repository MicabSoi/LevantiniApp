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

// Helper function to highlight a specific letter in a word at a given position
const highlightLetter = (word: string, letterToHighlight: string, position: 'start' | 'middle' | 'end'): (string | JSX.Element)[] => {
  if (!word || !letterToHighlight) return [word];

  const elements: (string | JSX.Element)[] = [];
  let lastIndex = 0;

  // Find all occurrences of the letter
  const regex = new RegExp(letterToHighlight, 'g');
  let match;
  const matches: { index: number, text: string }[] = [];
  while ((match = regex.exec(word)) !== null) {
    matches.push({ index: match.index, text: match[0] });
  }

  if (matches.length === 0) return [word]; // No occurrences found

  let highlightedIndex = -1;

  // Determine which occurrence to highlight based on position
  if (position === 'start') {
    if (matches[0].index === 0) {
      highlightedIndex = 0;
    }
  } else if (position === 'end') {
    // Find the last character of the word, accounting for potential whitespace or special characters at the very end
    const trimmedWord = word.trim();
    const lastCharIndexInTrimmed = trimmedWord.length - 1;

    // Find the match that corresponds to the last character of the trimmed word
    for (let i = matches.length - 1; i >= 0; i--) {
        // Check if the match's index + its length is the very end of the trimmed word
        // This is a simplification; actual logic might need to consider Arabic character connection rules
        if (matches[i].index === word.indexOf(trimmedWord) + lastCharIndexInTrimmed && matches[i].text === trimmedWord.slice(-1))
         {
            highlightedIndex = i;
            break;
         }
    }

  } else if (position === 'middle') {
    // Highlight the first occurrence that is not at the start or end
    // This is a simplified logic. A more robust solution might involve checking surrounding characters.
    for (let i = 0; i < matches.length; i++) {
        if (matches[i].index > 0 && matches[i].index < word.length - matches[i].text.length) {
            highlightedIndex = i;
            break;
        }
    }
  }


  if (highlightedIndex === -1) {
      // If no specific occurrence matched the position logic, just return the word unhighlighted
      // Alternatively, could fallback to highlighting based on visual form or other criteria
      console.warn(`Could not find a clear instance of letter '${letterToHighlight}' at position '${position}' in word '${word}' for highlighting.`);
      return [word];
  }

  // Reconstruct the word with highlighting at the determined index
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    elements.push(word.substring(lastIndex, match.index));

    if (i === highlightedIndex) {
      elements.push(<span key={match.index} className="text-emerald-400">{match.text}</span>);
    } else {
      elements.push(match.text);
    }
    lastIndex = match.index + match.text.length;
  }

  elements.push(word.substring(lastIndex));

  return elements;
};

const Alphabet: React.FC<AlphabetProps> = ({ setSubTab }) => {
  const [alphabetData, setAlphabetData] = useState<AlphabetItem[]>([]);
  const [specialLettersData, setSpecialLettersData] = useState<AlphabetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRefs = useRef({});

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

        setSpecialLettersData(specialLetters);
      }
      setLoading(false);
    }
    fetchAlphabet();
  }, []);

  const playAudio = async (filePath: string | null | undefined, letter: string) => {
    try {
      // Ensure the file path is correct (Check Supabase Storage for actual path)
      if (!filePath) {
        console.warn('No audio file path provided for letter:', letter);
        return; // Exit if no file path
      }
      console.log(`Requesting signed URL for file: ${filePath}`);

      // Get a signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('audio') // Make sure "audio" is your actual bucket name
        .createSignedUrl(filePath, 60); // URL expires in 60 seconds

      if (error) {
        console.error(`Error creating signed URL for ${letter}:`, error);
        return;
      }

      console.log(`Signed URL for ${letter}: ${data.signedUrl}`);

      // Fetch the audio file as a Blob
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob); // Convert blob to local object URL

      console.log(`Playing audio from local blob URL: ${blobUrl}`);

      // Play the audio
      let audioElement = new Audio(blobUrl);
      audioElement.play().catch((err) => {
        console.error(`Error playing audio for ${letter}:`, err);
      });
    } catch (error) {
      console.error(`Error in playAudio function for ${letter}:`, error);
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
                  onClick={() => playAudio(letter.audio_url, letter.letter)}
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
                  <div className="text-lg">{highlightLetter(letter.examples.end.word, letter.letter, 'end')}</div>
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
                  <div className="text-lg">{highlightLetter(letter.examples.middle.word, letter.letter, 'middle')}</div>
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
                  <div className="text-lg">{highlightLetter(letter.examples.start.word, letter.letter, 'start')}</div>
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
                  onClick={() => playAudio(letter.audio_url, letter.letter)}
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
                  <div className="text-lg">{highlightLetter(letter.examples.end.word, letter.letter, 'end')}</div>
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
                  <div className="text-lg">{highlightLetter(letter.examples.middle.word, letter.letter, 'middle')}</div>
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
                  <div className="text-lg">{highlightLetter(letter.examples.start.word, letter.letter, 'start')}</div>
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



