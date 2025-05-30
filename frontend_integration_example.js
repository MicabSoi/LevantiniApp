// Example integration for your existing Translate.tsx component
// This replaces your translateWithGemini function

const translateWithHybridService = useCallback(async (text: string, contextText: string) => {
  const startTime = performance.now();
  console.log('translateWithHybridService called with text:', text, 'and context:', contextText);
  
  // Check cache first (keep your existing cache logic)
  const cacheKey = getCacheKey(text, contextText);
  const cachedResult = translationCache.get(cacheKey);
  if (cachedResult) {
    const cacheTime = performance.now() - startTime;
    console.log(`Using cached translation (${cacheTime.toFixed(2)}ms)`);
    return cachedResult;
  }

  setIsLoading(true);
  setError('');

  try {
    // Call your hybrid service instead of Gemini directly
    const response = await fetch('http://127.0.0.1:5003/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        context: contextText,
        gemini_api_key: import.meta.env.VITE_GEMINI_API_KEY, // Your existing API key
        save_for_review: true // Set to false if you don't want to review everything
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('Hybrid service response:', result);

    // Show user if word replacements were made
    if (result.has_replacements) {
      console.log('Word replacements applied:', result.replacements_made);
      // Optionally show this to the user
    }

    const translationResult = {
      id: Date.now().toString(),
      english: text,
      context: contextText,
      arabic: result.arabic, // This now includes your custom replacements
      arabicSentence: '',
      transliteration: result.transliteration, // This also includes replacements
      transliterationSentence: '',
      audioUrl: '',
      contextArabic: '',
      contextTransliteration: '',
    };

    // Store in cache
    translationCache.set(cacheKey, translationResult);
    console.log('Cached translation for key:', cacheKey);
    
    return translationResult;

  } catch (error) {
    console.error('Error calling hybrid service:', error);
    setError('Translation failed. Please try again.');
    return null;
  } finally {
    setIsLoading(false);
  }
}, [getCacheKey, translationCache, setIsLoading, setError]);

// Helper function to add new word replacements
const addWordReplacement = async (originalArabic, originalTransliteration, replacementArabic, replacementTransliteration, reason = '') => {
  try {
    const response = await fetch('http://127.0.0.1:5003/add_word_replacement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original_arabic: originalArabic,
        original_transliteration: originalTransliteration,
        replacement_arabic: replacementArabic,
        replacement_transliteration: replacementTransliteration,
        context: 'user_added',
        reason: reason
      })
    });

    if (response.ok) {
      console.log('Word replacement added successfully');
      // Optionally show success message to user
    }
  } catch (error) {
    console.error('Error adding word replacement:', error);
  }
};

// Function to get pending reviews (for admin interface)
const getPendingReviews = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5003/pending_reviews');
    const data = await response.json();
    return data.pending_reviews;
  } catch (error) {
    console.error('Error getting pending reviews:', error);
    return [];
  }
};

// Function to approve a translation
const approveTranslation = async (translationId, reviewer = 'admin', notes = '') => {
  try {
    const response = await fetch(`http://127.0.0.1:5003/approve_translation/${translationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewer: reviewer,
        notes: notes
      })
    });

    if (response.ok) {
      console.log('Translation approved');
      return true;
    }
  } catch (error) {
    console.error('Error approving translation:', error);
  }
  return false;
};

// Function to decline a translation
const declineTranslation = async (translationId, reviewer = 'admin', notes = '') => {
  try {
    const response = await fetch(`http://127.0.0.1:5003/decline_translation/${translationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewer: reviewer,
        notes: notes
      })
    });

    if (response.ok) {
      console.log('Translation declined');
      return true;
    }
  } catch (error) {
    console.error('Error declining translation:', error);
  }
  return false;
};

// Get service statistics
const getServiceStats = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5003/stats');
    const stats = await response.json();
    console.log('Service stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
};

// Example usage in your handleSubmit function:
// Just replace the line:
// activeRequestRef.current = translateWithGemini(trimmedWord, context);
// with:
// activeRequestRef.current = translateWithHybridService(trimmedWord, context); 