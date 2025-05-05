import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AudioContextType {
  audioData: { [key: string]: string };
  loading: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [audioData, setAudioData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudio() {
      const { data, error } = await supabase
        .from('alphabet')
        .select('letter, audio_url');
      if (error) {
        console.error('❌ Error fetching audio data:', error);
        setLoading(false);
        return;
      }

      const audioMap: { [key: string]: string } = {};

      for (const row of data) {
        if (!row.audio_url) continue;

        // Use Supabase's getPublicUrl method to get the correct URL
        const { data: publicUrlData } = supabase.storage
          .from('audio')
          .getPublicUrl(row.audio_url);
        const publicUrl = publicUrlData.publicUrl;
        audioMap[row.letter] = publicUrl;
      }

      setAudioData(audioMap);
      setLoading(false);
    }

    fetchAudio();
  }, []);

  return (
    <AudioContext.Provider value={{ audioData, loading }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};


