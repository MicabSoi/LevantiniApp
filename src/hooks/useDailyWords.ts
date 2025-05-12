import { useState, useEffect } from 'react';
import { Word, Deck } from '../types/words';

// Mock Data
const mockWords: Word[] = [
  { id: '1', levantine: 'صباح الخير (sabaḥ el-khayr)', english: 'Good morning' },
  { id: '2', levantine: 'مساء الخير (masāʾ el-khayr)', english: 'Good evening' },
  { id: '3', levantine: 'كيفك؟ (kīfak?)', english: 'How are you? (m)' },
  { id: '4', levantine: 'كيفِك؟ (kīfik?)', english: 'How are you? (f)' },
  { id: '5', levantine: 'تمام (tamām)', english: 'Fine' },
  { id: '6', levantine: 'شكراً (shukran)', english: 'Thank you' },
  { id: '7', levantine: 'عفواً (ʿafwan)', english: 'You\'re welcome' },
  { id: '8', levantine: 'إي (ʾī)', english: 'Yes' },
  { id: '9', levantine: 'لأ (laʾ)', english: 'No' },
  { id: '10', levantine: 'لو سمحت (law samaḥt)', english: 'Excuse me / Please (m)' },
  { id: '11', levantine: 'لو سمحتِ (law samaḥti)', english: 'Excuse me / Please (f)' },
  { id: '12', levantine: 'تفضل (tfaḍḍal)', english: 'Please come in / Go ahead (m)' },
  { id: '13', levantine: 'تفضلي (tfaḍḍalī)', english: 'Please come in / Go ahead (f)' },
  { id: '14', levantine: 'أهلاً وسهلاً (ʾahlan wa sahlan)', english: 'Welcome' },
  { id: '15', levantine: 'باي (bāy)', english: 'Bye' },
];

const mockDecks: Deck[] = [
  { id: 'deck1', name: 'General Vocabulary' },
  { id: 'deck2', name: 'Greetings and Farewells' },
  { id: 'deck3', name: 'Food and Drink' },
];

const useDailyWords = () => {
  const [dailyWords, setDailyWords] = useState<Word[]>([]);
  const [recentlyLearnedWordIds, setRecentlyLearnedWordIds] = useState<Set<string>>(() => new Set());
  const [numWordsSetting, setNumWordsSetting] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const userDecks: Deck[] = mockDecks; // Expose mock decks

  const fetchDailyWords = async (count: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simple random selection (can be improved to avoid recently learned in a session)
      const shuffled = [...mockWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, count);

      setDailyWords(selectedWords);

      // Add selected words to recently learned set for this session
      setRecentlyLearnedWordIds(prev => {
        const newSet = new Set(prev);
        selectedWords.forEach(word => newSet.add(word.id));
        return newSet;
      });

    } catch (err) {
      console.error(err);
      setError('Failed to fetch daily words.');
    } finally {
      setIsLoading(false);
    }
  };

  const addWordToDeck = (wordId: string, deckId: string) => {
    console.log(`TODO: Implement backend call to add word ${wordId} to deck ${deckId}`);
    // TODO: Implement backend call to add word to deck
  };

  const handleSetNumWordsSetting = (newCount: number) => {
    if (newCount >= 1 && newCount <= 5) {
      setNumWordsSetting(newCount);
    }
  };

  useEffect(() => {
    fetchDailyWords(numWordsSetting);
  }, [numWordsSetting]); // Refetch when numWordsSetting changes

  return {
    dailyWords,
    recentlyLearnedWordIds,
    numWordsSetting,
    isLoading,
    error,
    setNumWordsSetting: handleSetNumWordsSetting,
    addWordToDeck,
    userDecks,
  };
};

export default useDailyWords; 