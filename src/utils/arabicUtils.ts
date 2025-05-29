/**
 * Removes Arabic diacritics (tashkeel) from text
 * @param text - The Arabic text with or without diacritics
 * @returns The text with diacritics removed
 */
export const removeDiacritics = (text: string): string => {
  // Arabic diacritics Unicode range: \u064B-\u065F, \u0670, \u06D6-\u06ED
  const diacriticsRegex = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
  return text.replace(diacriticsRegex, '');
};

/**
 * Formats Arabic text based on diacritics visibility setting
 * @param text - The original Arabic text
 * @param showDiacritics - Whether to show diacritics or not
 * @returns The formatted text
 */
export const formatArabicText = (text: string, showDiacritics: boolean): string => {
  return showDiacritics ? text : removeDiacritics(text);
}; 