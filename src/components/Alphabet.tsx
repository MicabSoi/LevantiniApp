import React, { useRef, useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // Make sure your supabase client is correctly imported

interface AlphabetProps {
  setSubTab?: (tab: string) => void;
}

const Alphabet: React.FC<AlphabetProps> = ({ setSubTab }) => {
  const [alphabetData, setAlphabetData] = useState([]);
  const [specialLettersData, setSpecialLettersData] = useState([]);
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

  const playAudio = async (filePath, letter) => {
    try {
      // Ensure the file path is correct (Check Supabase Storage for actual path)
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


