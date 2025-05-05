import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, Settings, X, Check, Loader2 } from 'lucide-react';
import OpenAI from 'openai';

// Define the translation result type
interface TranslationResult {
  id: number;
  english: string;
  context: string;
  arabic: string;
  arabicSentence: string;
  transliteration: string;
  transliterationSentence: string;
  audioUrl: string;
}

// Sample translations as fallback
const sampleTranslations = [
  {
    id: 1,
    english: 'chase',
    context: 'he is chasing her',
    arabic: 'يلحق',
    arabicSentence: 'هو عم يلحقها',
    transliteration: 'yil7a2',
    transliterationSentence: 'huwwe 3am yil7a2ha',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_015.mp3',
  },
  {
    id: 2,
    english: 'eat',
    context: 'I want to eat lunch',
    arabic: 'آكل',
    arabicSentence: 'بدي آكل غدا',
    transliteration: 'eekol',
    transliterationSentence: 'biddi eekol ghada',
    audioUrl: 'https://www.madinaharabic.com/Audio/L001/001_017.mp3',
  },
];

interface TranslateProps {
  setSubTab: (tab: string) => void;
}

const Translate: React.FC<TranslateProps> = ({ setSubTab }) => {
  const [word, setWord] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<TranslationResult[]>([]);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setSavedApiKey(storedApiKey);
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      setSavedApiKey(apiKey);
      setShowSettings(false);
      setError('');
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    setSavedApiKey('');
    localStorage.removeItem('openai_api_key');
  };

  const translateWithOpenAI = async (text: string, contextText: string) => {
    if (!savedApiKey) {
      setError('Please add your OpenAI API key in settings');
      return null;
    }

    setIsLoading(true);
    setError('');

    try {
      const openai = new OpenAI({
        apiKey: savedApiKey,
        dangerouslyAllowBrowser: true, // Note: In production, API calls should be made from a backend
      });

      const prompt = `
        Translate the following English text to Levantine Arabic (specifically the dialect spoken in Lebanon, Syria, Jordan, and Palestine).
        
        IMPORTANT INSTRUCTIONS:
        1. Provide the translation in Arabic script
        2. Provide a transliteration using Arabic chat alphabet (using numbers like 3 for ع, 7 for ح, etc.)
        3. If context is provided, also translate a full sentence using the word in that context
        4. Use authentic Levantine dialect vocabulary and grammar, NOT Modern Standard Arabic
        5. Format your response as JSON with these fields:
           - arabic: the translated word/phrase in Arabic script
           - transliteration: transliteration using Arabic chat alphabet
           - arabicSentence: (if context provided) a sentence using the word in Arabic script
           - transliterationSentence: (if context provided) transliteration of the sentence
        
        English word/phrase: ${text}
        ${contextText ? `Context or example: ${contextText}` : ''}
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a Levantine Arabic translator specializing in the dialects of Lebanon, Syria, Jordan, and Palestine. Provide translations in authentic Levantine dialect, not Modern Standard Arabic.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (content) {
        try {
          const parsedResponse = JSON.parse(content);

          // Create a result object
          const translationResult: TranslationResult = {
            id: Date.now(),
            english: text,
            context: contextText,
            arabic: parsedResponse.arabic || 'مش موجود',
            arabicSentence: parsedResponse.arabicSentence || '',
            transliteration: parsedResponse.transliteration || '',
            transliterationSentence:
              parsedResponse.transliterationSentence || '',
            audioUrl: '', // No audio URL for OpenAI translations
          };

          return translationResult;
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', parseError);
          setError('Failed to parse translation response');
          return null;
        }
      } else {
        setError('No translation received');
        return null;
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      setError('Translation failed. Please check your API key and try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!word.trim()) return;

    // Try to translate with OpenAI
    const openAIResult = await translateWithOpenAI(word, context);

    if (openAIResult) {
      setResult(openAIResult);
      setHistory((prev) => [openAIResult, ...prev]);
    } else if (!error) {
      // Fallback to sample data if OpenAI fails but not due to API key issues
      const lowerWord = word.toLowerCase().trim();
      const match = sampleTranslations.find(
        (item) => item.english.toLowerCase() === lowerWord
      );

      if (match) {
        setResult(match);
        if (!history.some((item) => item.id === match.id)) {
          setHistory((prev) => [match, ...prev]);
        }
      } else {
        // Create a placeholder result
        const fallbackResult: TranslationResult = {
          id: Date.now(),
          english: word,
          context: context,
          arabic: 'مش موجود', // "Not available" in Levantine Arabic
          arabicSentence: 'هاي الكلمة مش موجودة بالقاموس', // "This word is not in the dictionary" in Levantine
          transliteration: 'mish mawjood',
          transliterationSentence: 'hay il-kilme mish mawjoode bil-2amoos',
          audioUrl: '',
        };

        setResult(fallbackResult);
        setHistory((prev) => [fallbackResult, ...prev]);
      }
    }

    // Clear the form
    setWord('');
    setContext('');
  };

  const playAudio = (audioUrl: string) => {
    try {
      if (!audioUrl) return;

      // Create or reuse audio element
      if (!audioRef) {
        const audio = new Audio(audioUrl);
        audio.onerror = (e) => {
          console.error('Audio failed to load:', e);
        };
        setAudioRef(audio);
      } else {
        audioRef.src = audioUrl;
      }

      // Play the audio
      if (audioRef) {
        audioRef.currentTime = 0;
        const playPromise = audioRef.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Error playing audio:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setSubTab('landing')}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Fluency
      </button>

      {/* Note Section with Dark Mode Classes */}
      <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md border border-emerald-100 dark:border-emerald-800">
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          <strong>Note:</strong> This translator provides words and phrases in
          Levantine Arabic dialect (spoken in Lebanon, Syria, Jordan, and
          Palestine), not Modern Standard Arabic.
          {!savedApiKey && (
            <span className="block mt-1">
              Add your OpenAI API key in settings to enable unlimited
              translations.
            </span>
          )}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6 dark:text-gray-100">
        <div className="mb-4">
          <label
            htmlFor="word"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Word or Phrase
          </label>
          <input
            type="text"
            id="word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
            placeholder="Enter a word or phrase"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="context"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Context or Example (optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100"
            placeholder="e.g., 'I want to eat lunch'"
            rows={2}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 flex items-center justify-center disabled:bg-emerald-400"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Send size={18} className="mr-2" />
              Translate
            </>
          )}
        </button>
      </form>

      {/* Translation Result */}
      {result && (
        <div className="mb-6 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{result.arabic}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                {result.transliteration}
              </p>
            </div>
            {result.audioUrl && (
              <button
                onClick={() => playAudio(result.audioUrl)}
                className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-700"
              >
                <Volume2 size={18} />
              </button>
            )}
          </div>

          {result.arabicSentence && (
            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
              <p className="font-medium">In context:</p>
              <p className="text-lg mt-1">{result.arabicSentence}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {result.transliterationSentence}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Translation History */}
      {history.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3">Recent Translations</h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-dark-200"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.english}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.context}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.arabic}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.transliteration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Transliteration Section with Dark Mode Styling */}
      <div className="mt-6 bg-gray-50 dark:bg-dark-200 p-4 rounded-md border border-gray-200 dark:border-dark-100">
        <h3 className="font-bold text-md mb-2 dark:text-gray-100">
          About Levantine Arabic Transliteration
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          Levantine Arabic uses numbers to represent sounds that don't exist in
          English:
        </p>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc pl-5">
          <li>
            <strong>3</strong> - represents the Arabic letter ع ('ayn), a deep
            throat sound
          </li>
          <li>
            <strong>7</strong> - represents the Arabic letter ح (ḥa), a breathy
            H sound
          </li>
          <li>
            <strong>2</strong> - represents the glottal stop (hamza)
          </li>
          <li>
            <strong>gh</strong> - represents the Arabic letter غ (ghayn),
            similar to French R
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Translate;


