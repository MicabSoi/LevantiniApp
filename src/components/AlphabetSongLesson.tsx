import React, { useState, useEffect, useRef } from 'react';

const useAudioBuffers = (audioFiles) => {
  const audioContextRef = useRef(null);
  const [buffers, setBuffers] = useState({});

  useEffect(() => {
    // Create the AudioContext
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    async function preloadAudio() {
      const newBuffers = {};
      await Promise.all(
        audioFiles.map(async (file) => {
          try {
            const response = await fetch(file.url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(
              arrayBuffer
            );
            newBuffers[file.letter] = audioBuffer;
          } catch (error) {
            console.error(`Error loading audio for ${file.letter}:`, error);
          }
        })
      );
      setBuffers(newBuffers);
    }
    preloadAudio();
  }, [audioFiles]);

  return { audioContext: audioContextRef.current, buffers };
};

const AlphabetSongLesson = ({ letters, audioFiles }) => {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use our custom hook to preload audio buffers
  const { audioContext, buffers } = useAudioBuffers(audioFiles);

  const playSong = () => {
    console.log('Play button clicked');
    let index = 0;
    setIsPlaying(true);

    const playNext = () => {
      if (index < audioFiles.length) {
        const { letter } = audioFiles[index];
        const buffer = buffers[letter];

        if (!buffer || !audioContext) {
          console.error(`Missing preloaded audio for letter ${letter}`);
          index++;
          playNext();
          return;
        }

        console.log(`Playing preloaded audio for ${letter}`);
        setCurrentIndex(index);

        // Create a source node and play it
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);

        // When the current audio finishes, play the next one
        source.onended = () => {
          console.log(`Audio ended for ${letter}`);
          index++;
          playNext();
        };
      } else {
        console.log('Finished playing all audio files');
        setCurrentIndex(null);
        setIsPlaying(false);
      }
    };

    playNext();
  };

  return (
    <div className="alphabet-song-lesson">
      <h2 className="text-2xl font-bold mb-6">Learn the Arabic Alphabet</h2>
      <div
        className="alphabet-display"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
          gap: '1rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.03)',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
        }}
      >
        {letters.map((letter, idx) => (
          <div
            key={letter}
            className="flex items-center justify-center text-3xl font-bold p-4 rounded-lg"
          >
            {letter}
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          onClick={playSong}
          disabled={isPlaying}
          className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 ${
            isPlaying
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isPlaying ? 'Playing...' : 'Play Alphabet Song'}
        </button>
      </div>
      <p className="text-center text-gray-600 mt-4 text-sm">
        Click play to hear each letter pronounced in sequence
      </p>
    </div>
  );
};

export default AlphabetSongLesson;


